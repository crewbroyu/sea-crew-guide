import assert from 'node:assert/strict'
import fs from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { removeStoredTask5Images, stripCompletionImages } from '../src/data/task5CompletionDetails.js'

// 1. Profile data: photos are removed, every other field and malformed entries are kept.
assert.deepEqual(stripCompletionImages(null), {})
assert.deepEqual(stripCompletionImages([{ image: 'x' }]), {})
assert.deepEqual(
  stripCompletionImages({
    a: { completedAt: '2026-10-01T00:00:00.000Z', notes: 'n', image: 'data:image/jpeg;base64,AAAA' },
    b: { completedAt: '2026-10-02T00:00:00.000Z', notes: 'm', image: null },
    c: { completedAt: '2026-10-03T00:00:00.000Z', notes: 'o' },
    d: 'legacy',
  }),
  {
    a: { completedAt: '2026-10-01T00:00:00.000Z', notes: 'n' },
    b: { completedAt: '2026-10-02T00:00:00.000Z', notes: 'm' },
    c: { completedAt: '2026-10-03T00:00:00.000Z', notes: 'o' },
    d: 'legacy',
  },
)

// 2. Browser storage: both Task 5 records are rewritten without photos; other keys are untouched.
const createStorage = (entries) => {
  const values = new Map(Object.entries(entries))
  return {
    values,
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, value),
  }
}
const photo = `data:image/jpeg;base64,${'A'.repeat(600_000)}`
const task5Data = { selectedRole: 'retail', completedCourses: { a: true }, completedCourseDetails: { a: { completedAt: 't', notes: 'n', image: photo } } }
const storage = createStorage({
  task5_data: JSON.stringify(task5Data),
  task5_result: JSON.stringify({ taskId: 5, completedCourseDetails: { a: { completedAt: 't', notes: 'n', image: photo } } }),
  task6_data: JSON.stringify({ answerCardData: { a: { image: 'kept' } } }),
})
assert.deepEqual(removeStoredTask5Images(storage), ['task5_data', 'task5_result'])
assert.deepEqual(JSON.parse(storage.values.get('task5_data')), {
  ...task5Data,
  completedCourseDetails: { a: { completedAt: 't', notes: 'n' } },
})
assert.deepEqual(JSON.parse(storage.values.get('task5_result')).completedCourseDetails, { a: { completedAt: 't', notes: 'n' } })
assert.ok(storage.values.get('task5_data').length < 1_000, 'The photo no longer takes browser storage.')
assert.equal(storage.values.get('task6_data'), JSON.stringify({ answerCardData: { a: { image: 'kept' } } }))

// Records without photos are not rewritten, so a second run changes nothing.
const writes = []
const cleanStorage = { ...storage, setItem: (key, value) => writes.push([key, value]) }
assert.deepEqual(removeStoredTask5Images(cleanStorage), [])
assert.deepEqual(writes, [])

// Malformed or missing records are skipped without throwing.
assert.deepEqual(removeStoredTask5Images(createStorage({ task5_data: '{not json', task5_result: 'null' })), [])
assert.deepEqual(removeStoredTask5Images(createStorage({})), [])

// 3. Migration: run the real table definition and migration in PGlite.
const db = await PGlite.create()
await db.exec(`
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
`)
await db.exec(fs.readFileSync(new URL('../supabase_job_preparation_profiles.sql', import.meta.url), 'utf8'))

const USERS = {
  photos: '00000000-0000-4000-8000-000000000001',
  noPhotos: '00000000-0000-4000-8000-000000000002',
  empty: '00000000-0000-4000-8000-000000000003',
  array: '00000000-0000-4000-8000-000000000004',
}
const OLD = '2026-10-01T00:00:00.000Z'
await db.exec(`insert into auth.users (id) values ${Object.values(USERS).map((id) => `('${id}')`).join(', ')}`)
await db.query(
  `insert into public.job_preparation_profiles (user_id, completed_course_details, learning_records, updated_at) values
    ($1, $5::jsonb, '{"keep": true}'::jsonb, $9),
    ($2, $6::jsonb, '{}'::jsonb, $9),
    ($3, $7::jsonb, '{}'::jsonb, $9),
    ($4, $8::jsonb, '{}'::jsonb, $9)`,
  [
    USERS.photos, USERS.noPhotos, USERS.empty, USERS.array,
    JSON.stringify({
      a: { completedAt: 't1', notes: 'n1', image: 'data:image/jpeg;base64,AAAA' },
      b: { completedAt: 't2', notes: 'n2', image: null },
      c: 'legacy',
    }),
    JSON.stringify({ a: { completedAt: 't1', notes: 'n1' } }),
    '{}',
    '[{"image": "data:image/jpeg;base64,AAAA"}]',
    OLD,
  ],
)

const migration = fs.readFileSync(new URL('../supabase/migrations/20261014090000_remove_task5_completion_photos.sql', import.meta.url), 'utf8')
const rows = async () => Object.fromEntries((await db.query(
  'select user_id, completed_course_details, learning_records, updated_at from public.job_preparation_profiles',
)).rows.map((row) => [row.user_id, row]))

// The production verification check (step 14) fails before the migration and passes after it.
const productionVerification = fs.readFileSync(new URL('../supabase_production_verification.sql', import.meta.url), 'utf8')
const photoCheck = productionVerification.slice(
  productionVerification.indexOf('-- Task 5 completion photos (step 14)'),
  productionVerification.indexOf('-- Summary of every ok check above'),
)
const photoCheckOk = async () => (await db.query(photoCheck)).rows[0].ok
assert.equal(await photoCheckOk(), false, 'Production verification flags stored photos.')

const [verification] = (await db.exec(migration)).filter((result) => result.fields.some((field) => field.name === 'remaining_photos'))
assert.equal(Number(verification.rows[0].remaining_photos), 0, 'The migration verification query reports no photos left.')
assert.equal(await photoCheckOk(), true, 'Production verification passes after the migration.')

const after = await rows()
assert.deepEqual(after[USERS.photos].completed_course_details, {
  a: { completedAt: 't1', notes: 'n1' },
  b: { completedAt: 't2', notes: 'n2' },
  c: 'legacy',
})
assert.deepEqual(after[USERS.photos].learning_records, { keep: true }, 'Other columns are untouched.')
assert.ok(after[USERS.photos].updated_at > new Date(OLD), 'Cleaned rows advance updated_at so stale writers re-read.')
assert.deepEqual(after[USERS.noPhotos].completed_course_details, { a: { completedAt: 't1', notes: 'n1' } })
assert.equal(after[USERS.noPhotos].updated_at.toISOString(), OLD, 'Rows without photos are not touched.')
assert.deepEqual(after[USERS.empty].completed_course_details, {})
assert.equal(after[USERS.empty].updated_at.toISOString(), OLD)
assert.deepEqual(after[USERS.array].completed_course_details, [{ image: 'data:image/jpeg;base64,AAAA' }], 'Non-object values are left alone.')
assert.equal(after[USERS.array].updated_at.toISOString(), OLD)

// Rerunning changes nothing.
await db.exec(migration)
assert.deepEqual(await rows(), after, 'The migration is safe to rerun.')

console.log('Task 5 photo removal checks passed.')
