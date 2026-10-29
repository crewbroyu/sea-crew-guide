import assert from 'node:assert/strict'
import fs from 'node:fs'
import { PGlite } from '@electric-sql/pglite'

// Replays the tables the trial language report reads, seeds visitors in each language, and checks
// the language assignment, merged anonymous browsers, exclusions and conversion percentages.
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
  'supabase_product_analytics.sql',
]) await db.exec(read(file))

const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const EN = id(1) // English from a shared link, signs in mid-trial, goes all the way to the paywall
const SWITCHER = id(2) // opens in Chinese, switches to English, completes a scenario in English
const ZH = id(3) // Chinese, signed in, completes one scenario
const ADMIN = id(4) // excluded
const OLD = id(5) // only active before the window

await db.exec(`
insert into auth.users (id) values ('${EN}'), ('${SWITCHER}'), ('${ZH}'), ('${ADMIN}'), ('${OLD}');
insert into public.user_access (user_id, role) values ('${ADMIN}', 'admin')
  on conflict (user_id) do update set role = excluded.role;

insert into public.product_events (user_id, anonymous_id, event_name, properties, created_at) values
  -- English visitor: anonymous first, then the same browser signs in.
  (null, 'b-en', 'free_trial_viewed', '{"language":"en"}', now() - interval '50 minutes'),
  ('${EN}', 'b-en', 'auth_completed', '{}', now() - interval '45 minutes'),
  ('${EN}', 'b-en', 'free_trial_scenario_completed', '{"language":"en"}', now() - interval '40 minutes'),
  ('${EN}', 'b-en', 'free_trial_completed', '{}', now() - interval '30 minutes'),
  ('${EN}', 'b-en', 'free_trial_report_viewed', '{}', now() - interval '30 minutes'),
  ('${EN}', 'b-en', 'free_trial_report_cta_clicked', '{}', now() - interval '29 minutes'),
  ('${EN}', 'b-en', 'product_page_viewed', '{}', now() - interval '28 minutes'),
  -- Switcher: the last language used decides the section.
  ('${SWITCHER}', 'b-sw', 'free_trial_viewed', '{"language":"zh"}', now() - interval '40 minutes'),
  ('${SWITCHER}', 'b-sw', 'language_switched', '{"from":"zh","to":"en"}', now() - interval '39 minutes'),
  ('${SWITCHER}', 'b-sw', 'free_trial_scenario_completed', '{"language":"en"}', now() - interval '30 minutes'),
  -- Chinese: one view without a language property (counted as Chinese) and one with it.
  ('${ZH}', 'b-zh', 'free_trial_viewed', '{}', now() - interval '20 minutes'),
  ('${ZH}', 'b-zh', 'free_trial_scenario_completed', '{"language":"zh"}', now() - interval '10 minutes'),
  -- Anonymous Chinese visitor who never signs in.
  (null, 'b-anon', 'free_trial_viewed', '{"language":"zh"}', now() - interval '15 minutes'),
  -- Product page visit without opening the trial is not part of the funnel.
  (null, 'b-shop', 'product_page_viewed', '{}', now() - interval '15 minutes'),
  -- Excluded: staff, and activity before the window.
  ('${ADMIN}', 'b-admin', 'free_trial_viewed', '{"language":"en"}', now() - interval '5 minutes'),
  ('${OLD}', 'b-old', 'free_trial_viewed', '{"language":"en"}', now() - interval '60 days');
`)

// Pin the window to the seeded data instead of the pilot release date.
const report = read('supabase_trial_language_report.sql')
  .replace("timestamptz '2026-10-29 09:50:00+00'", "now() - interval '30 days'")
assert.notEqual(report, read('supabase_trial_language_report.sql'), 'the window start must be replaceable')

const { rows } = await db.query(report)
const row = (section, step) => rows.find((r) => r.section === section && r.step === step)
const actors = (section, step) => Number(row(section, step)?.actors ?? 0)

assert.deepEqual([...new Set(rows.map((r) => r.section))], ['zh', 'en', 'switches'])

// English: EN (anonymous browser merged into the account) and SWITCHER. Admin and OLD are excluded.
assert.equal(actors('en', 1), 2)
assert.equal(actors('en', 2), 2)
assert.equal(actors('en', 3), 2)
assert.equal(actors('en', 4), 1)
assert.equal(actors('en', 5), 1)
assert.equal(actors('en', 6), 1)
assert.equal(actors('en', 7), 1)
assert.equal(Number(row('en', 4).pct_of_opened), 50)
assert.equal(Number(row('en', 4).pct_of_previous), 50)
assert.equal(row('en', 1).pct_of_previous, null)

// Chinese: ZH (no language property) and the anonymous visitor; the shop-only visitor is not counted.
assert.equal(actors('zh', 1), 2)
assert.equal(actors('zh', 2), 1)
assert.equal(actors('zh', 3), 1)
assert.equal(actors('zh', 4), 0)
assert.equal(actors('zh', 7), 0)
assert.equal(Number(row('zh', 2).pct_of_opened), 50)
assert.equal(row('zh', 5).pct_of_previous, null, 'no division by zero after an empty stage')

const switchRows = rows.filter((r) => r.section === 'switches')
assert.deepEqual(switchRows.map((r) => [r.stage, Number(r.actors)]), [['zh → en', 1]])

// Read-only: nothing but a single SELECT statement.
assert.doesNotMatch(report.replace(/--.*$/gm, ''), /\b(insert|update|delete|drop|alter|create|grant|truncate)\b/i)

console.table(rows)
console.log('trial language report: all checks passed')
