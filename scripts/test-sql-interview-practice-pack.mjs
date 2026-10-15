import assert from 'node:assert/strict'
import fs from 'node:fs'
import { PGlite } from '@electric-sql/pglite'

// Replays the entitlement and AI quota baselines, then step 17 (interview practice pack), in an
// in-memory Postgres. Checks the new product's quota scope, that existing packs keep working, that
// the quota function is otherwise unchanged, and who can read reference answers.
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
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`
const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const MIGRATION = 'supabase/migrations/20261017090000_interview_practice_pack.sql'
const QUOTA_FN = "'public.reserve_ai_usage_quota(text,text,text,text,text)'::regprocedure"

const PRACTICE = '00000000-0000-4000-8000-0000000000a1'
const BAR = '00000000-0000-4000-8000-0000000000b1'
const RETAIL = '00000000-0000-4000-8000-0000000000c1'
const NOBODY = '00000000-0000-4000-8000-0000000000d1'
const EXPIRED = '00000000-0000-4000-8000-0000000000e1'
const ADMIN = '00000000-0000-4000-8000-0000000000f1'

const db = await PGlite.create()
await db.exec(SUPABASE_SHIM)
for (const file of [
  'supabase_roles_and_access.sql',
  'supabase_products_and_entitlements.sql',
  'supabase_ai_usage_reservations.sql',
  'supabase_retail_sales_pack.sql',
  'supabase_voice_entitlements.sql',
]) await db.exec(read(file))

const prosrc = async () => (await db.query(`select prosrc from pg_proc where oid = ${QUOTA_FN}`)).rows[0].prosrc
const before = await prosrc()
const lf = (text) => text.replace(/\r\n/g, '\n')
const md5 = async (text) => (await db.query('select md5($1) as hash', [text])).rows[0].hash
// Printed for the production pre-check in SUPABASE_MIGRATION_ORDER.md.
console.log('voice_entitlements reserve_ai_usage_quota md5 (LF):', await md5(lf(before)))
console.log('voice_entitlements reserve_ai_usage_quota md5 (CRLF):', await md5(lf(before).replace(/\n/g, '\r\n')))

await db.exec(read(MIGRATION))
await db.exec(read(MIGRATION))

// 1. The function body differs from the baseline only by the product list and the new guard.
const after = lf(await prosrc())
const expected = lf(before)
  .replace("('bar_server_pack', 'retail_sales_pack')\n", "('bar_server_pack', 'retail_sales_pack', 'interview_practice_pack')\n")
  .replace("raise exception 'INVALID_QUOTA_REQUEST';\n  end if;\n", `raise exception 'INVALID_QUOTA_REQUEST';\n  end if;\n
  -- The interview practice pack covers voice answers and AI feedback only: no mock interviews,
  -- scenario training, natural TTS, or free trial.
  if input_product_code = 'interview_practice_pack'
    and (input_action not in ('transcribe', 'evaluate') or is_free_trial) then
    raise exception 'INVALID_QUOTA_REQUEST';
  end if;\n`)
assert.equal(after, expected)

// 2. The product row.
const product = (await db.query("select * from public.products where code = 'interview_practice_pack'")).rows[0]
assert.equal(Number(product.price_cny), 99)
assert.equal(product.access_days, 90)
assert.equal(product.ai_feedback_quota, 60)
assert.equal(product.mock_interview_quota, 0)
assert.equal(product.is_active, true)

await db.exec(`insert into auth.users (id) values ('${PRACTICE}'), ('${BAR}'), ('${RETAIL}'), ('${NOBODY}'), ('${EXPIRED}'), ('${ADMIN}')`)
await db.exec(`
  insert into public.user_access (user_id, role, access_status) values ('${ADMIN}', 'admin', 'active')
    on conflict (user_id) do update set role = 'admin', access_status = 'active';
  insert into public.user_entitlements (user_id, product_code, expires_at, ai_feedback_limit, mock_interview_limit, source) values
    ('${PRACTICE}', 'interview_practice_pack', now() + interval '90 days', 60, 0, 'activation_code'),
    ('${BAR}', 'bar_server_pack', now() + interval '180 days', 120, 10, 'activation_code'),
    ('${RETAIL}', 'retail_sales_pack', now() + interval '180 days', 120, 10, 'activation_code'),
    ('${EXPIRED}', 'interview_practice_pack', now() - interval '1 day', 60, 0, 'activation_code');
`)

const asUser = async (userId, fn) => {
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId])
  await db.exec('set role authenticated')
  try {
    return await fn()
  } finally {
    await db.exec('reset role')
    await db.query("select set_config('request.jwt.claim.sub', '', false)")
  }
}
let requestCounter = 0
const reserve = (userId, productCode, action, mode = 'premium_practice') => asUser(userId, () => db.query(
  'select public.reserve_ai_usage_quota($1, $2, $3, $4, $5) as result',
  [productCode, action, mode, 'question-1', `request-${requestCounter += 1}`],
)).then((result) => result.rows[0].result)

// 3. Practice pack: transcribe and evaluate only, 60 units each.
const evaluation = await reserve(PRACTICE, 'interview_practice_pack', 'evaluate')
assert.equal(evaluation.limit, 60)
assert.equal((await reserve(PRACTICE, 'interview_practice_pack', 'transcribe')).limit, 60)
for (const [action, mode] of [['mock_interview', 'premium_mock'], ['scenario_turn', 'premium_scenario'], ['tts', 'premium_practice'], ['evaluate', 'scenario_trial']]) {
  await assert.rejects(reserve(PRACTICE, 'interview_practice_pack', action, mode), /INVALID_QUOTA_REQUEST/, `${action} ${mode}`)
}
await assert.rejects(reserve(PRACTICE, 'bar_server_pack', 'evaluate'), /ACTIVATION_REQUIRED/, 'The practice pack does not unlock a position pack.')
await assert.rejects(reserve(NOBODY, 'interview_practice_pack', 'evaluate'), /ACTIVATION_REQUIRED/)
await assert.rejects(reserve(EXPIRED, 'interview_practice_pack', 'evaluate'), /ACTIVATION_REQUIRED/)

await db.query(
  `insert into public.ai_usage_events (user_id, product_code, action, mode, request_id)
   select $1, 'interview_practice_pack', 'evaluate', 'premium_practice', 'used-' || n from generate_series(1, 59) n`,
  [PRACTICE],
)
await assert.rejects(reserve(PRACTICE, 'interview_practice_pack', 'evaluate'), /AI_QUOTA_EXHAUSTED/, '59 used plus 1 reserved reach the 60 limit.')

// 4. Existing packs are unaffected, including mock interviews.
assert.equal((await reserve(BAR, 'bar_server_pack', 'evaluate')).limit, 120)
assert.equal((await reserve(BAR, 'bar_server_pack', 'mock_interview', 'premium_mock')).limit, 10)
assert.equal((await reserve(RETAIL, 'retail_sales_pack', 'evaluate')).limit, 120)
await assert.rejects(reserve(BAR, 'unknown_pack', 'evaluate'), /INVALID_QUOTA_REQUEST/)

// 5. Reference answers: practice pack reads every position, position packs read their own.
await db.exec(`
  insert into public.interview_reference_answers (position_key, question_id, answer_en, key_points_zh) values
    ('bar_server', 'bar_1', 'Bar answer', '要点'), ('retail', 'retail_1', 'Retail answer', null),
    ('restaurant', 'restaurant_1', 'Restaurant answer', null), ('housekeeping', 'housekeeping_1', 'Housekeeping answer', null),
    ('front_office', 'front_office_1', 'Front office answer', null);
`)
await db.exec(read(MIGRATION))
const readable = async (userId) => (await asUser(userId, () => db.query(
  'select position_key from public.interview_reference_answers order by position_key',
))).rows.map((row) => row.position_key)
const allPositions = ['bar_server', 'front_office', 'housekeeping', 'restaurant', 'retail']
assert.deepEqual(await readable(PRACTICE), allPositions)
assert.deepEqual(await readable(ADMIN), allPositions)
assert.deepEqual(await readable(BAR), ['bar_server'])
assert.deepEqual(await readable(RETAIL), ['retail'])
assert.deepEqual(await readable(NOBODY), [])
assert.deepEqual(await readable(EXPIRED), [])
await db.exec('set role anon')
await assert.rejects(db.query('select * from public.interview_reference_answers'), /permission denied/)
await db.exec('reset role')
await assert.rejects(asUser(ADMIN, () => db.query(
  "insert into public.interview_reference_answers (position_key, question_id, answer_en) values ('retail', 'x', 'y')",
)), /permission denied/)
await assert.rejects(db.query(
  "insert into public.interview_reference_answers (position_key, question_id, answer_en) values ('kitchen', 'x', 'y')",
), /check constraint/)

console.log('interview practice pack sql: ok')
