import assert from 'node:assert/strict'
import fs from 'node:fs'
import { PGlite } from '@electric-sql/pglite'

// Step 18 (job search details) on top of step 16: backfill, shape checks, the 60-position limit,
// and that admins can still write while anon reads published rows.
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
const STEP_16 = 'supabase/migrations/20261016090000_job_postings.sql'
const STEP_18 = 'supabase/migrations/20261018090000_job_search_details.sql'
const ADMIN = '00000000-0000-4000-8000-0000000000a1'

const db = await PGlite.create()
await db.exec(SUPABASE_SHIM)
await db.exec(read('supabase_roles_and_access.sql'))
await db.exec(`insert into auth.users (id) values ('${ADMIN}');
  insert into public.user_access (user_id, role, access_status) values ('${ADMIN}', 'admin', 'active');`)
await db.exec(read(STEP_16))
await db.exec(`insert into public.job_postings (source_name, source_url, title, summary, positions, status) values
  ('号', 'https://mp.weixin.qq.com/s/legacy', '旧招聘', '摘要', array['Waiter', 'Sous Chef'], 'published'),
  ('号', 'https://mp.weixin.qq.com/s/empty', '无岗位', '摘要', '{}', 'draft');`)

await db.exec(read(STEP_18))
await db.exec(read(STEP_18))

// 1. Backfill keeps order, marks experience unspecified, and leaves rows without positions empty.
const legacy = (await db.query("select position_details, interview_sessions from public.job_postings where source_url like '%legacy'")).rows[0]
assert.deepEqual(legacy.position_details, [{ title: 'Waiter', experience: 'unspecified' }, { title: 'Sous Chef', experience: 'unspecified' }])
assert.deepEqual(legacy.interview_sessions, [])
assert.deepEqual((await db.query("select position_details from public.job_postings where source_url like '%empty'")).rows[0].position_details, [])

const asAdmin = async (sql, params) => {
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [ADMIN])
  await db.exec('set role authenticated')
  try {
    return await db.query(sql, params)
  } finally {
    await db.exec('reset role')
    await db.query("select set_config('request.jwt.claim.sub', '', false)")
  }
}
let counter = 0
const insert = (details, sessions, positions = details.map((item) => item.title)) => asAdmin(
  `insert into public.job_postings (source_name, source_url, title, summary, positions, position_details, interview_sessions)
   values ('号', $1, '标题', '摘要', $2, $3, $4) returning id`,
  [`https://mp.weixin.qq.com/s/t${counter += 1}`, positions, JSON.stringify(details), JSON.stringify(sessions)],
)

// 2. Admins can write valid structured rows, including 60 positions and mixed sessions.
const sixty = Array.from({ length: 60 }, (_, index) => ({ title: `Role ${index}`, experience: index % 2 ? 'none' : 'cruise' }))
await insert(sixty, [
  { city: '上海', mode: 'offline', date: '2026-10-28', note: '具体地址见原文' },
  { city: null, mode: 'online', date: null, note: null },
])

// 3. Invalid shapes are rejected by the database.
const invalid = [
  ['61 positions', [...sixty, { title: 'Extra', experience: 'none' }], []],
  ['unknown experience', [{ title: 'Waiter', experience: 'senior' }], []],
  ['missing title', [{ experience: 'none' }], []],
  ['unknown mode', [], [{ city: '上海', mode: 'zoom', date: null, note: null }]],
  ['bad date', [], [{ city: '上海', mode: 'offline', date: '28 Oct', note: null }]],
  ['long city', [], [{ city: 'x'.repeat(31), mode: 'offline', date: null, note: null }]],
]
for (const [label, details, sessions] of invalid) {
  await assert.rejects(insert(details, sessions), /check constraint|violates/, label)
}
await assert.rejects(insert(sixty, [], [...sixty.map((item) => item.title), 'Extra']), /check constraint/, '61 positions in the text array')
await assert.rejects(db.query("update public.job_postings set interview_sessions = '{}'::jsonb"), /check constraint/, 'sessions must be an array')

// 4. Anon still reads published rows, now with the structured columns.
await db.exec('set role anon')
const published = (await db.query('select position_details, interview_sessions from public.job_postings')).rows
await db.exec('reset role')
assert.equal(published.length, 1)
assert.equal(published[0].position_details.length, 2)

// 5. The validation function is not directly callable by clients.
await db.exec('set role anon')
await assert.rejects(db.query("select public.job_posting_details_valid('[]', '[]')"), /permission denied/)
await db.exec('reset role')

console.log('job search details sql: ok')
