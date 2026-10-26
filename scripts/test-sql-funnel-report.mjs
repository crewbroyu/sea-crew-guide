import assert from 'node:assert/strict'
import fs from 'node:fs'
import { PGlite } from '@electric-sql/pglite'

// Replays the baselines the funnel report reads from, seeds a handful of users at different
// stages, and checks the report's counts, conversion and exclusions.
const SUPABASE_SHIM = `
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;
create schema auth;
create table auth.users (
  id uuid primary key, email text, created_at timestamptz default now(), last_sign_in_at timestamptz,
  raw_user_meta_data jsonb default '{}'::jsonb, raw_app_meta_data jsonb default '{}'::jsonb
);
create function auth.uid() returns uuid language sql stable
  as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.jwt() returns jsonb language sql stable
  as $$ select jsonb_build_object('email', current_setting('request.jwt.claim.sub', true) || '@example.com') $$;
grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
`
const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const db = await PGlite.create()
await db.exec(SUPABASE_SHIM)
for (const file of [
  'supabase_roles_and_access.sql',
  'supabase_products_and_entitlements.sql',
  'supabase_ai_usage_reservations.sql',
  'supabase_retail_sales_pack.sql',
  'supabase_voice_entitlements.sql',
  'supabase/migrations/20261017090000_interview_practice_pack.sql',
  'supabase_manual_purchase_requests.sql',
  'supabase_product_analytics.sql',
  'supabase_scenario_training.sql',
  'supabase_interview_practice_records.sql',
]) await db.exec(read(file))

const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const FULL = id(1) // free trial -> paywall -> request -> paid bar pack -> all 8 scenarios
const FREE = id(2) // free trial only
const OFFLINE = id(3) // paid interview pack offline, one practice, no paywall event
const ANON = id(4) // viewed paywall while logged out
const FOUNDER = id(5) // founder grant, not paid
const IDLE = id(6) // registered, nothing else
const ADMIN = id(7) // excluded
const OLD = id(8) // registered before the window, paid inside it

await db.exec(`
insert into auth.users (id, created_at) values
  ('${FULL}', now() - interval '20 days'), ('${FREE}', now() - interval '10 days'),
  ('${OFFLINE}', now() - interval '10 days'), ('${ANON}', now() - interval '5 days'),
  ('${FOUNDER}', now() - interval '5 days'), ('${IDLE}', now() - interval '2 days'),
  ('${ADMIN}', now() - interval '2 days'), ('${OLD}', now() - interval '200 days');
insert into public.user_access (user_id, role) values ('${ADMIN}', 'admin')
  on conflict (user_id) do update set role = excluded.role;

insert into public.product_events (user_id, anonymous_id, event_name, created_at) values
  ('${FULL}', 'a1', 'assessment_completed', now() - interval '19 days'),
  ('${FULL}', 'a1', 'product_page_viewed', now() - interval '18 days'),
  ('${FREE}', 'a2', 'free_trial_scenario_completed', now() - interval '9 days'),
  (null, 'a4', 'product_page_viewed', now() - interval '6 days'),
  ('${ANON}', 'a4', 'auth_completed', now() - interval '5 days'),
  ('${ADMIN}', 'a7', 'product_page_viewed', now() - interval '1 days');

insert into public.manual_purchase_requests (user_id, contact_email, product_code, price_cny, reference_code, status, created_at, payment_confirmed_at)
values
  ('${FULL}', 'f@example.com', 'bar_server_pack', 199, 'R1', 'activation_sent', now() - interval '17 days', now() - interval '16 days'),
  ('${OFFLINE}', 'o@example.com', 'interview_practice_pack', 99, 'R3', 'payment_confirmed', now() - interval '8 days', now() - interval '8 days');
update public.manual_purchase_requests set created_at = now() - interval '9 days' where reference_code = 'R3';

insert into public.user_entitlements (user_id, product_code, source, starts_at) values
  ('${FULL}', 'bar_server_pack', 'activation_code', now() - interval '15 days'),
  ('${FOUNDER}', 'bar_server_pack', 'founder', now() - interval '4 days'),
  ('${ADMIN}', 'bar_server_pack', 'payment', now() - interval '1 days'),
  ('${OLD}', 'retail_sales_pack', 'payment', now() - interval '3 days');

insert into public.interview_practice_records (user_id, target_position, created_at) values
  ('${OFFLINE}', 'bar_server', now() - interval '7 days'),
  ('${OFFLINE}', 'bar_server', now() - interval '9 days');
`)

// FULL: 8 distinct bar scenarios after paying (plus a repeat); FOUNDER: 8 too but never paid.
for (const user of [FULL, FOUNDER]) {
  for (let n = 1; n <= 8; n += 1) {
    await db.query(
      `insert into public.scenario_training_sessions (user_id, job_key, scenario_id, difficulty, status, created_at, completed_at)
       values ($1, 'bar_server', $2, 2, 'completed', now() - make_interval(days => $3), now() - make_interval(days => $3))`,
      [user, `s${n}`, 14 - n],
    )
  }
}
await db.query(
  `insert into public.scenario_training_sessions (user_id, job_key, scenario_id, difficulty, status, completed_at)
   values ($1, 'bar_server', 's1', 2, 'completed', now())`,
  [FULL],
)

const { rows } = await db.query(read('supabase_funnel_report.sql'))
const row = (section, step) => rows.find((r) => r.section === section && r.step === step)

// Overall cohort: FULL, FREE, OFFLINE, ANON, FOUNDER, IDLE (admin and OLD excluded).
assert.equal(row('overall', 1).users, 6)
assert.equal(row('overall', 2).users, 4, 'free activity: FULL, FREE, OFFLINE (interview), FOUNDER (scenarios)')
assert.equal(row('overall', 2).continued, 4)
assert.equal(row('overall', 3).users, 2, 'paywall: FULL and ANON via linked anonymous id')
assert.equal(row('overall', 3).continued, 1, 'ANON never had a free activity')
assert.equal(Number(row('overall', 3).pct_continued), 25)
assert.equal(row('overall', 4).users, 2, 'requests: FULL and OFFLINE')
assert.equal(row('overall', 4).continued, 1)
assert.equal(row('overall', 5).users, 2, 'paid: FULL and OFFLINE; founder grant is not paid')
assert.equal(row('overall', 5).continued, 2)
assert.equal(row('overall', 6).users, 2, 'started: FULL scenarios and OFFLINE interview after paying')
assert.equal(row('overall', 7).users, 1, 'completed: only FULL; OFFLINE has 1 of 3 interviews after paying')
assert.equal(row('overall', 7).continued, 1)
assert.equal(Number(row('overall', 7).pct_continued), 50)

// FULL paid 16 days ago (manual confirmation beats the later activation), first scenario at -13,
// eighth distinct scenario at -6.
assert.equal(row('bar_server_pack', 1).users, 1)
assert.equal(Number(row('bar_server_pack', 2).median_days), 3)
assert.equal(row('bar_server_pack', 3).users, 1)
assert.equal(Number(row('bar_server_pack', 3).median_days), 7)

// OFFLINE: the practice before paying does not count as started.
assert.equal(row('interview_practice_pack', 2).users, 1)
assert.equal(Number(row('interview_practice_pack', 2).median_days), 1)
assert.equal(row('interview_practice_pack', 3).users, 0)

// OLD registered before the window but paid inside it, so it shows up in the product section only.
assert.equal(row('retail_sales_pack', 1).users, 1)
assert.equal(row('retail_sales_pack', 2).users, 0)
assert.equal(Number(row('retail_sales_pack', 2).pct_continued), 0)

console.table(rows)
console.log('funnel report: all checks passed')

// Per-user detail for the same paid users.
await db.exec(`
insert into public.activation_codes (code, type, product_code, is_used, used_by) values ('CODE-1', 'coaching', 'bar_server_pack', true, '${FULL}');
update public.user_entitlements set source_reference = 'CODE-1' where user_id = '${FULL}';
update auth.users set email = 'u' || right(id::text, 1) || '@example.com';
`)
const detail = (await db.query(read('supabase_paid_users_report.sql'))).rows
const person = (user, product) => detail.find((r) => r.user_id === user && r.product_code === product)

assert.deepEqual(
  detail.map((r) => `${r.user_id}:${r.product_code}`).sort(),
  [`${FULL}:bar_server_pack`, `${OFFLINE}:interview_practice_pack`, `${OLD}:retail_sales_pack`].sort(),
  'founder grants and staff are not listed',
)
const full = person(FULL, 'bar_server_pack')
assert.equal(full.开通方式, 'activation_code + manual_purchase')
assert.equal(full.激活码, 'CODE-1')
assert.equal(full.激活码类型, 'coaching')
assert.equal(full.购买单号, 'R1')
assert.equal(full.scenario_sessions, 9)
assert.equal(full.distinct_scenarios, 8)
assert.ok(Date.now() - new Date(full.最后活跃时间).getTime() < 60_000, 'latest session is now')

const offline = person(OFFLINE, 'interview_practice_pack')
assert.equal(offline.开通方式, 'manual_purchase')
assert.equal(offline.激活码, null)
assert.equal(offline.interview_practices, 1, 'the practice before paying is not counted')
assert.equal(offline.scenario_sessions, 0)

assert.equal(person(OLD, 'retail_sales_pack').开通方式, 'payment')
assert.equal(detail[0].user_id, OLD, 'newest payment first')
console.log('paid users report: all checks passed')
