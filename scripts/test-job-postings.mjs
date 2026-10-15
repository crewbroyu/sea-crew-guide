import assert from 'node:assert/strict'
import fs from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { handleJobPostingRequest, normalizeSourceUrl, parseWechatArticle, sanitizeExtraction } from '../server/jobPostings.js'

// Covers the job posting migration (step 16) in an in-memory Postgres and the server-side
// article parsing and extraction sanitizing used by /api/job-postings.

// 1. Source URLs are limited to WeChat articles over https.
assert.equal(normalizeSourceUrl('https://mp.weixin.qq.com/s/AbC-12_x?from=timeline#wechat'), 'https://mp.weixin.qq.com/s/AbC-12_x')
assert.equal(normalizeSourceUrl('https://mp.weixin.qq.com/s?__biz=MzA&mid=1&idx=1&sn=abc'), 'https://mp.weixin.qq.com/s?__biz=MzA&mid=1&idx=1&sn=abc')
for (const url of ['http://mp.weixin.qq.com/s/abc', 'https://evil.example/s/abc', 'https://mp.weixin.qq.com.evil.example/s/abc', 'file:///etc/passwd', '', null]) {
  assert.equal(normalizeSourceUrl(url), null, String(url))
}

// 2. The article parser reads title, account, date, and body text only.
const html = `<html><head><meta property="og:title" content="MSC 邮轮 &amp; 酒吧岗位招聘" /></head><body>
<strong id="js_name"> 海乘招聘号 </strong>
<div id="js_content" style="visibility: hidden;"><p>岗位：Bar Server</p><p>要求：英语&nbsp;流利<br/>年龄 20-35 岁</p><script>alert(1)</script></div>
<script>var ct = "1760000000"; var nickname = "海乘招聘号";</script></body></html>`
const article = parseWechatArticle(html)
assert.equal(article.title, 'MSC 邮轮 & 酒吧岗位招聘')
assert.equal(article.sourceName, '海乘招聘号')
assert.equal(article.publishedOn, '2025-10-09')
assert.equal(article.text, '岗位：Bar Server\n要求：英语 流利\n年龄 20-35 岁')

// 3. AI output is clamped to known shapes; unknown departments and bad dates are dropped.
const extraction = sanitizeExtraction({
  title: '', summary: 'x'.repeat(500), cruise_lines: ['MSC Cruises', 'MSC Cruises', 7],
  departments: ['酒吧服务', '火箭部'], positions: 'Bar Server', deadline: '2026-13-45',
  risk_flags: ['要求先交培训费'], agency: '  ', is_recruitment: false,
}, { title: '原标题' })
assert.equal(extraction.title, '原标题')
assert.equal(extraction.summary.length, 400)
assert.deepEqual(extraction.cruise_lines, ['MSC Cruises'])
assert.deepEqual(extraction.departments, ['酒吧服务'])
assert.deepEqual(extraction.positions, [])
assert.equal(extraction.deadline, null)
assert.equal(extraction.agency, null)
assert.equal(extraction.is_recruitment, false)
assert.equal(sanitizeExtraction({ deadline: '2026-11-30' }).deadline, '2026-11-30')

// 4. The handler rejects anonymous callers before fetching anything.
const anonymous = await handleJobPostingRequest({
  method: 'POST', headers: {}, body: { sourceUrl: 'https://mp.weixin.qq.com/s/abc' },
  env: { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'anon' },
})
assert.equal(anonymous.status, 401)
assert.equal((await handleJobPostingRequest({ method: 'GET', headers: {}, body: {}, env: {} })).status, 405)

// 5. Database: anyone reads published rows; only active admins read drafts or write.
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
const MIGRATION = 'supabase/migrations/20261016090000_job_postings.sql'
const ADMIN = '00000000-0000-4000-8000-0000000000a1'
const LEARNER = '00000000-0000-4000-8000-0000000000b1'
const SUSPENDED_ADMIN = '00000000-0000-4000-8000-0000000000c1'

const db = await PGlite.create()
await db.exec(SUPABASE_SHIM)
await db.exec(read('supabase_roles_and_access.sql'))
await db.exec(`insert into auth.users (id) values ('${ADMIN}'), ('${LEARNER}'), ('${SUSPENDED_ADMIN}')`)
await db.exec(`
  insert into public.user_access (user_id, role, access_status) values
    ('${ADMIN}', 'admin', 'active'), ('${LEARNER}', 'member', 'active'), ('${SUSPENDED_ADMIN}', 'admin', 'suspended');
`)
await db.exec(read(MIGRATION))
await db.exec(read(MIGRATION))

const as = async (role, userId, fn) => {
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId || ''])
  await db.exec(`set role ${role}`)
  try {
    return await fn()
  } finally {
    await db.exec('reset role')
    await db.query("select set_config('request.jwt.claim.sub', '', false)")
  }
}
const insertPosting = (url, status = 'draft') => db.query(
  `insert into public.job_postings (source_name, source_url, title, summary, status)
   values ('海乘招聘号', $1, 'MSC 酒吧岗位招聘', '摘要', $2) returning id, created_by, published_at`,
  [url, status],
)
const titles = async (role, userId) => (await as(role, userId, () => db.query('select source_url from public.job_postings order by source_url'))).rows.map((row) => row.source_url)

const draft = (await as('authenticated', ADMIN, () => insertPosting('https://mp.weixin.qq.com/s/a'))).rows[0]
assert.equal(draft.created_by, ADMIN)
assert.equal(draft.published_at, null)
const published = (await as('authenticated', ADMIN, () => insertPosting('https://mp.weixin.qq.com/s/b', 'published'))).rows[0]
assert.ok(published.published_at, 'Publishing stamps published_at.')

await assert.rejects(as('authenticated', ADMIN, () => insertPosting('https://mp.weixin.qq.com/s/a')), /duplicate key/)
await assert.rejects(db.query(
  "insert into public.job_postings (source_name, source_url, title, summary) values ('x', 'javascript:alert(1)', 't', 's')",
), /check constraint/)

assert.deepEqual(await titles('anon', null), ['https://mp.weixin.qq.com/s/b'])
assert.deepEqual(await titles('authenticated', LEARNER), ['https://mp.weixin.qq.com/s/b'])
assert.deepEqual(await titles('authenticated', SUSPENDED_ADMIN), ['https://mp.weixin.qq.com/s/b'])
assert.deepEqual(await titles('authenticated', ADMIN), ['https://mp.weixin.qq.com/s/a', 'https://mp.weixin.qq.com/s/b'])

for (const [role, userId] of [['anon', null], ['authenticated', LEARNER], ['authenticated', SUSPENDED_ADMIN]]) {
  await assert.rejects(as(role, userId, () => insertPosting(`https://mp.weixin.qq.com/s/${role}-${userId}`)), /permission denied|row-level security/)
  const updated = await as(role, userId, () => db.query("update public.job_postings set title = 'hacked' returning id")).catch((error) => error)
  assert.ok(updated instanceof Error || updated.rows.length === 0, `${role} ${userId} cannot update`)
  const deleted = await as(role, userId, () => db.query('delete from public.job_postings returning id')).catch((error) => error)
  assert.ok(deleted instanceof Error || deleted.rows.length === 0, `${role} ${userId} cannot delete`)
}

// Publishing a draft stamps published_at once; archiving hides it from the public.
const republished = await as('authenticated', ADMIN, () => db.query(
  "update public.job_postings set status = 'published' where id = $1 returning published_at", [draft.id],
))
assert.ok(republished.rows[0].published_at)
await as('authenticated', ADMIN, () => db.query("update public.job_postings set status = 'archived' where id = $1", [published.id]))
assert.deepEqual(await titles('anon', null), ['https://mp.weixin.qq.com/s/a'])
await as('authenticated', ADMIN, () => db.query('delete from public.job_postings where id = $1', [published.id]))
assert.deepEqual(await titles('authenticated', ADMIN), ['https://mp.weixin.qq.com/s/a'])

console.log('job postings: ok')
