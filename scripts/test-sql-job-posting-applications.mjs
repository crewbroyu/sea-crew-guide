import assert from 'node:assert/strict'
import fs from 'node:fs'
import { PGlite } from '@electric-sql/pglite'

// Step 19 on top of the application records baseline and steps 16 and 18: records linked to
// postings, the channel labels, and the evidence rule for "verified".
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
const STEP_19 = 'supabase/migrations/20261021090000_job_posting_applications.sql'
const ADMIN = '00000000-0000-4000-8000-0000000000a1'
const USER_A = '00000000-0000-4000-8000-0000000000b1'
const USER_B = '00000000-0000-4000-8000-0000000000c1'

const db = await PGlite.create()
await db.exec(SUPABASE_SHIM)
await db.exec(read('supabase_roles_and_access.sql'))
await db.exec(read('supabase_job_application_records.sql'))
await db.exec(read('supabase/migrations/20261016090000_job_postings.sql'))
await db.exec(read('supabase/migrations/20261018090000_job_search_details.sql'))
await db.exec(`
  insert into auth.users (id) values ('${ADMIN}'), ('${USER_A}'), ('${USER_B}');
  insert into public.user_access (user_id, role, access_status) values ('${ADMIN}', 'admin', 'active');
  insert into public.job_postings (source_name, source_url, title, summary, status) values
    ('号', 'https://mp.weixin.qq.com/s/one', 'MSC 招聘', '摘要', 'published');
  insert into public.job_application_records (user_id, company_name, job_title, source_type)
    values ('${USER_A}', 'Royal Caribbean', 'Waiter', 'cruise_company');
`)

await db.exec(read(STEP_19))
await db.exec(read(STEP_19))

const as = async (role, userId, sql, params) => {
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId || ''])
  await db.exec(`set role ${role}`)
  try {
    return await db.query(sql, params)
  } finally {
    await db.exec('reset role')
    await db.query("select set_config('request.jwt.claim.sub', '', false)")
  }
}
const postingId = (await db.query("select id from public.job_postings where source_url like '%one'")).rows[0].id

// 1. Existing data survives and postings get defaults plus a review time.
assert.equal((await db.query('select count(*)::int as n from public.job_application_records')).rows[0].n, 1)
const posting = (await db.query('select channel_type, fee_disclosure, last_checked_at, channel_verified_at from public.job_postings')).rows[0]
assert.equal(posting.channel_type, 'unspecified')
assert.equal(posting.fee_disclosure, 'unspecified')
assert.ok(posting.last_checked_at, 'last_checked_at is backfilled')
assert.equal(posting.channel_verified_at, null)

// 2. A user saves a posting to their own records, with an interview date.
const saved = await as('authenticated', USER_A, `insert into public.job_application_records
  (user_id, company_name, job_title, company_url, source_type, job_posting_id, interview_date)
  values ($1, 'MSC Cruises', 'MSC 招聘', 'https://mp.weixin.qq.com/s/one', 'job_posting', $2, '2026-10-28') returning id`, [USER_A, postingId])
assert.equal(saved.rows.length, 1)
await assert.rejects(as('authenticated', USER_A, `insert into public.job_application_records (user_id, company_name, job_title, source_type)
  values ($1, 'x', 'y', 'newsletter')`, [USER_A]), /check constraint/)
assert.equal((await as('authenticated', USER_B, 'select * from public.job_application_records')).rows.length, 0, 'Records stay private.')
await assert.rejects(as('authenticated', USER_B, `insert into public.job_application_records (user_id, company_name, job_title, source_type, job_posting_id)
  values ($1, 'x', 'y', 'job_posting', $2)`, [USER_A, postingId]), /row-level security/, 'Nobody writes records for another user.')

// 3. Deleting the posting keeps the record and its snapshot, unlinked.
await as('authenticated', ADMIN, 'delete from public.job_postings where id = $1', [postingId])
const kept = (await db.query('select job_posting_id, job_title, company_url, interview_date from public.job_application_records where source_type = $1', ['job_posting'])).rows[0]
assert.equal(kept.job_posting_id, null)
assert.equal(kept.job_title, 'MSC 招聘')
assert.equal(kept.company_url, 'https://mp.weixin.qq.com/s/one')
assert.ok(kept.interview_date)

// 4. Channel labels and the evidence rule.
const insertPosting = (fields) => as('authenticated', ADMIN, `insert into public.job_postings
  (source_name, source_url, title, summary, status, channel_type, channel_claim, channel_verified_at, channel_verification_url, fee_disclosure)
  values ('号', $1, '标题', '摘要', 'published', $2, $3, $4, $5, $6) returning id`, [
  `https://mp.weixin.qq.com/s/${Math.random().toString(36).slice(2)}`,
  fields.channel_type ?? 'unspecified', fields.channel_claim ?? null, fields.channel_verified_at ?? null,
  fields.channel_verification_url ?? null, fields.fee_disclosure ?? 'unspecified',
])
await insertPosting({ channel_type: 'claimed_authorized', channel_claim: '中国指定合作伙伴', fee_disclosure: 'fees_stated' })
await insertPosting({ channel_type: 'official_direct', channel_verified_at: '2026-10-21T00:00:00Z', channel_verification_url: 'https://careers.msccruises.com/' })
for (const [label, fields] of [
  ['unknown channel', { channel_type: 'second_tier' }],
  ['verified without evidence', { channel_type: 'claimed_authorized', channel_verified_at: '2026-10-21T00:00:00Z' }],
  ['evidence over http', { channel_verification_url: 'http://example.com' }],
  ['unknown fee value', { fee_disclosure: 'cheap' }],
  ['empty claim', { channel_claim: '' }],
]) {
  await assert.rejects(insertPosting(fields), /check constraint/, label)
}

// 5. Anon reads the new public fields on published postings.
const visible = (await as('anon', null, 'select channel_type, channel_claim, fee_disclosure, last_checked_at, channel_verification_url from public.job_postings order by channel_type')).rows
assert.deepEqual(visible.map((row) => row.channel_type), ['claimed_authorized', 'official_direct'])

console.log('job posting applications sql: ok')
