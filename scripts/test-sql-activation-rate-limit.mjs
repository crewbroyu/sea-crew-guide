import assert from 'node:assert/strict'
import fs from 'node:fs'
import { PGlite } from '@electric-sql/pglite'

// Runs the activation baselines and the rate-limit migration (step 15) in an in-memory Postgres and
// checks that code guessing is capped per user while normal redemption keeps working.
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
const RATE_LIMIT_MIGRATION = 'supabase/migrations/20261015090000_rate_limit_activation_codes.sql'

const USER_A = '00000000-0000-4000-8000-0000000000a1'
const USER_B = '00000000-0000-4000-8000-0000000000b1'
const USER_C = '00000000-0000-4000-8000-0000000000c1'

const db = await PGlite.create()
await db.exec(SUPABASE_SHIM)
await db.exec(read('supabase_roles_and_access.sql'))
await db.exec(read('supabase_products_and_entitlements.sql'))
await db.exec(`insert into auth.users (id) values ('${USER_A}'), ('${USER_B}'), ('${USER_C}')`)

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
const redeem = (userId, code) => asUser(userId, () => db.query('select public.consume_activation_code($1) as result', [code]))
  .then((result) => result.rows[0].result)
const addCode = (code) => db.query(
  "insert into public.activation_codes (code, is_used, type, product_code, access_days) values ($1, false, 'manual_paid', 'bar_server_pack', 180)",
  [code],
)
const codeIsUsed = async (code) => (await db.query('select is_used from public.activation_codes where code = $1', [code])).rows[0].is_used
const ageAttempts = (userId, interval) => db.query(
  `update public.activation_code_attempts set attempted_at = attempted_at - $2::interval where user_id = $1`,
  [userId, interval],
)

// Before step 15 nothing stops a script from guessing.
for (let attempt = 0; attempt < 30; attempt += 1) {
  assert.equal((await redeem(USER_A, `CREW-GUESS${attempt}`)).reason, 'Invalid code')
}

await db.exec(read(RATE_LIMIT_MIGRATION))
await db.exec(read(RATE_LIMIT_MIGRATION))

// 1. Five failures in 15 minutes lock redemption, even for a valid code, without consuming it.
await addCode('CREW-GOODA1')
for (let attempt = 0; attempt < 4; attempt += 1) {
  assert.equal((await redeem(USER_A, `CREW-WRONG${attempt}`)).reason, 'Invalid code')
}
await addCode('CREW-TAKEN1')
assert.equal((await redeem(USER_C, 'CREW-TAKEN1')).success, true)
assert.equal((await redeem(USER_A, 'CREW-TAKEN1')).reason, 'Code already used', 'A used code counts as a failure too.')
const locked = await redeem(USER_A, 'CREW-GOODA1')
assert.deepEqual(locked, { success: false, reason: 'Too many attempts' })
assert.equal(await codeIsUsed('CREW-GOODA1'), false, 'A locked request never touches the code.')

// 2. Other users are not affected by one user's lock.
await addCode('CREW-GOODB1')
assert.equal((await redeem(USER_B, 'CREW-GOODB1')).success, true)

// 3. After 15 minutes the short lock lifts and a valid code redeems normally.
await ageAttempts(USER_A, '16 minutes')
const redeemed = await redeem(USER_A, 'CREW-GOODA1')
assert.equal(redeemed.success, true)
assert.equal(redeemed.product_code, 'bar_server_pack')
const entitlement = (await db.query(
  "select status, source, source_reference from public.user_entitlements where user_id = $1 and product_code = 'bar_server_pack'",
  [USER_A],
)).rows[0]
assert.deepEqual(entitlement, { status: 'active', source: 'activation_code', source_reference: 'CREW-GOODA1' })
const attemptLog = (await db.query(
  'select succeeded, count(*)::int as n from public.activation_code_attempts where user_id = $1 group by succeeded order by succeeded',
  [USER_A],
)).rows
assert.deepEqual(attemptLog, [{ succeeded: false, n: 5 }, { succeeded: true, n: 1 }])

// Only failures count: after the success above, four new failures still leave one more attempt.
for (let attempt = 0; attempt < 4; attempt += 1) {
  assert.equal((await redeem(USER_A, `CREW-AGAIN${attempt}`)).reason, 'Invalid code')
}
assert.equal((await redeem(USER_A, 'CREW-AGAIN4')).reason, 'Invalid code', 'A successful redemption is not counted as a failure.')
assert.equal((await redeem(USER_A, 'CREW-AGAIN5')).reason, 'Too many attempts')

// 4. Twenty failures in a day lock redemption until they are older than a day.
await db.query(
  `insert into public.activation_code_attempts (user_id, succeeded, attempted_at)
   select $1, false, now() - interval '2 hours' from generate_series(1, 20)`,
  [USER_C],
)
await addCode('CREW-GOODC2')
assert.equal((await redeem(USER_C, 'CREW-GOODC2')).reason, 'Too many attempts', 'The daily cap applies.')
await ageAttempts(USER_C, '1 day')
assert.equal((await redeem(USER_C, 'CREW-GOODC2')).success, true, 'Failures older than a day no longer count.')

// 5. Signed-out callers are still refused, and clients cannot touch the attempt log.
await db.query("select set_config('request.jwt.claim.sub', '', false)")
await db.exec('set role anon')
await assert.rejects(db.query("select public.consume_activation_code('CREW-GOODA1')"), /permission denied for function consume_activation_code/)
await db.exec('reset role')
await assert.rejects(
  asUser(USER_A, () => db.query('select count(*) from public.activation_code_attempts')),
  /permission denied for table activation_code_attempts/,
)
await assert.rejects(
  asUser(USER_A, () => db.query('delete from public.activation_code_attempts')),
  /permission denied for table activation_code_attempts/,
)

// 6. The migration's own verification and the production summary rows pass.
const migrationSql = read(RATE_LIMIT_MIGRATION)
const migrationCheck = (await db.query(migrationSql.slice(migrationSql.lastIndexOf('commit;') + 'commit;'.length))).rows[0]
assert.deepEqual(migrationCheck, {
  attempt_log_exists: true,
  learner_can_read_attempts: false,
  learner_can_write_attempts: false,
  redemption_is_rate_limited: true,
})
const verificationSql = read('supabase_production_verification.sql')
// The summary also reads tables from other features; create them so the query runs.
await db.exec(read('supabase_job_preparation_profiles.sql'))
await db.exec(read('supabase_scenario_training.sql'))
const summary = (await db.query(verificationSql.slice(verificationSql.indexOf('-- Summary of every ok check above')))).rows
const rateLimitRows = summary.filter((row) => row.section.startsWith('8 ')).map((row) => [row.check_name, row.ok]).sort()
assert.deepEqual(rateLimitRows, [
  ['attempt log exists', true],
  ['clients cannot read or write the attempt log', true],
  ['consume_activation_code checks the attempt log', true],
  ['consume_activation_code: authenticated only', true],
])
await db.close()

console.log('Activation code rate limit passed: 5 failures per 15 minutes and 20 per day lock guessing per user, valid codes still redeem, locked requests never consume a code, and the attempt log is server-only.')
