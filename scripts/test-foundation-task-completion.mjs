import assert from 'node:assert/strict'
import fs from 'node:fs'

const importSource = async (file, replacements) => {
  let source = fs.readFileSync(file, 'utf8')
  for (const [from, to] of replacements) source = source.replace(from, to)
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
}

const storage = new Map()
globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
}

globalThis.__pathClient = {
  auth: { getUser: async () => ({ data: { user: null }, error: null }) },
}
const userPath = await importSource('src/services/userPathService.js', [
  ["import { supabase } from '../supabase'", 'const supabase = globalThis.__pathClient'],
])
userPath.writeLocalTaskProgress({ task5: { completed: true, completedAt: '2026-10-01T00:00:00.000Z' } })
userPath.markLocalTaskComplete(5)
assert.equal(
  userPath.getLocalTaskProgress().task5.completedAt,
  '2026-10-01T00:00:00.000Z',
  'repeating completion must preserve the original timestamp',
)

const calls = []
globalThis.__foundationTask = {
  getCompletedCount: (course, progress) => course.days.filter((day) => progress[day.id]?.completedAt).length,
  syncFoundation: async () => { calls.push('foundation'); return {} },
  completePath: async () => { calls.push('path'); return { task_progress: { task5: { completed: true } } } },
  markLocal: () => { calls.push('local') },
}
const completion = await importSource('src/services/foundationTaskCompletionService.js', [
  ["import { getFoundationCompletedCount } from './foundationProgressService'", 'const getFoundationCompletedCount = globalThis.__foundationTask.getCompletedCount'],
  ["import { upsertMyFoundationCourseState } from './jobPreparationService'", 'const upsertMyFoundationCourseState = (...args) => globalThis.__foundationTask.syncFoundation(...args)'],
  ["import { completeTaskAndSyncPathProfile, markLocalTaskComplete } from './userPathService'", 'const completeTaskAndSyncPathProfile = (...args) => globalThis.__foundationTask.completePath(...args); const markLocalTaskComplete = (...args) => globalThis.__foundationTask.markLocal(...args)'],
])

const course = {
  jobKey: 'bar_server',
  roleKey: 'barServer',
  title: 'Bar Server 岗位基础课',
  version: 3,
  days: [{ id: 'day1' }, { id: 'day2' }],
}
const progress = {
  day1: { completedAt: '2026-10-01T00:00:00.000Z' },
  day2: { completedAt: '2026-10-02T00:00:00.000Z' },
}

await assert.rejects(
  () => completion.completeFoundationTask({ course, progress: { day1: progress.day1 }, ownerId: 'user-a' }),
  /Complete every foundation day/,
)
assert.deepEqual(calls, [], 'incomplete courses must not write Task 5 or cloud progress')

const result = await completion.completeFoundationTask({ course, progress, ownerId: 'user-a' })
assert.deepEqual(calls, ['foundation', 'path'], 'course evidence must sync before path completion')
assert.equal(result.foundationSynced, true)
assert.equal(result.pathSynced, true)
const saved = JSON.parse(storage.get('task5_result'))
assert.equal(saved.taskId, 5)
assert.equal(saved.selectedRole, 'barServer')
assert.equal(saved.foundationCompletedDays, 2)
assert.deepEqual(saved.learningRecords.barServerFoundation, progress)

const firstCompletedAt = saved.completedAt
await completion.completeFoundationTask({ course, progress, ownerId: 'user-a' })
assert.equal(JSON.parse(storage.get('task5_result')).completedAt, firstCompletedAt)

calls.length = 0
globalThis.__foundationTask.syncFoundation = async () => { calls.push('foundation'); throw new Error('offline') }
const originalConsoleError = console.error
console.error = () => {}
const offlineResult = await completion.completeFoundationTask({ course, progress, ownerId: 'user-a' })
console.error = originalConsoleError
assert.deepEqual(calls, ['foundation', 'local'], 'failed course evidence must not publish cloud path completion')
assert.equal(offlineResult.foundationSynced, false)
assert.equal(offlineResult.pathSynced, false)

console.log('Foundation Task 5 completion passed: completion gate, cloud ordering, downstream snapshot and idempotent timestamps.')
