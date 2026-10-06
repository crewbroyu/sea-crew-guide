import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path, { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  BAR_SERVER_LISTENING_DRILLS,
  readBarLearningStage,
  readBarLearningStageUpdatedAt,
  readBarListeningProgress,
  readBarShiftHistory,
  writeBarLearningStage,
  writeBarLearningStageUpdatedAt,
  writeBarListeningProgress,
  writeBarShiftHistory,
} from '../src/data/barServerListening.js'
import {
  mergeBarListeningProgress,
  mergeBarServerPractice,
  mergeBarShiftHistory,
} from '../src/data/barServerProgressSync.js'

const fail = (message) => {
  console.error(`Bar Server progress sync contract failed: ${message}`)
  process.exit(1)
}

const drill = BAR_SERVER_LISTENING_DRILLS[0]
const cloud = {
  [drill.id]: {
    normalPlays: 2,
    attempts: 1,
    bestScore: 70,
    completedAt: '2026-01-02T00:00:00.000Z',
    lastAttemptAt: '2026-01-02T00:00:00.000Z',
    lastScore: 70,
    speakingPractice: {
      phraseRepetitions: { [drill.response]: 2 },
      listenedPhrases: [drill.response],
      completedAt: '2026-01-02T00:05:00.000Z',
    },
  },
}
const local = {
  [drill.id]: {
    normalPlays: 1,
    slowPlays: 2,
    attempts: 3,
    bestScore: 100,
    lastAttemptAt: '2026-01-03T00:00:00.000Z',
    lastScore: 100,
    speakingPractice: {
      phraseRepetitions: { [drill.response]: 1 },
      listenedPhrases: ['another phrase'],
    },
  },
  unknown_drill: { bestScore: 100 },
}

const merged = mergeBarListeningProgress(cloud, local)[drill.id]
if (merged.normalPlays !== 2 || merged.slowPlays !== 2 || merged.attempts !== 3) fail('counters must keep the strongest device evidence')
if (merged.bestScore !== 100 || merged.lastScore !== 100) fail('scores must keep the best and most recent evidence')
if (!merged.completedAt) fail('cloud completion must survive a local merge')
if (merged.speakingPractice.phraseRepetitions[drill.response] !== 2) fail('speaking repetitions must not decrease')
if (merged.speakingPractice.listenedPhrases.length !== 2) fail('listened phrases must be combined')
if (mergeBarListeningProgress(cloud, local).unknown_drill) fail('unknown drill ids must not enter synced progress')

const history = mergeBarShiftHistory(
  [{ id: 'older', score: 70, completedAt: '2026-01-01' }],
  [
    { id: 'newer', score: 85, completedAt: '2026-01-03' },
    { id: 'older', score: 70, completedAt: '2026-01-01' },
  ],
)
if (history.length !== 2 || history[0].id !== 'newer') fail('shift history must deduplicate and sort newest first')

const newerStage = mergeBarServerPractice(
  { learningStage: 'job_search', stageUpdatedAt: '2026-01-01' },
  { learningStage: 'experienced', stageUpdatedAt: '2026-01-02' },
)
assert.equal(newerStage.learningStage, 'experienced')
assert.equal(mergeBarServerPractice(newerStage, { listeningProgress: local }).learningStage, 'experienced', 'a listening update must not reset the learning stage')

const storage = new Map()
globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, value) => storage.set(key, value),
}
writeBarListeningProgress(local, 'account-a')
writeBarShiftHistory(history, 'account-a')
writeBarLearningStage('experienced', 'account-a')
writeBarLearningStageUpdatedAt('2026-01-02', 'account-a')
assert.deepEqual(readBarListeningProgress('account-b'), {})
assert.deepEqual(readBarShiftHistory('account-b'), [])
assert.equal(readBarLearningStage('account-b'), 'job_search')
assert.equal(readBarLearningStage('account-a'), 'experienced')
assert.equal(readBarLearningStageUpdatedAt('account-a'), '2026-01-02')
writeBarLearningStage('first_contract')
assert.equal(readBarLearningStage('account-b'), 'job_search', 'legacy stage must not be assigned to a signed-in account')

let row = {
  user_id: 'account-a',
  updated_at: '2026-01-01T00:00:00.000Z',
  learning_records: { foundationCourses: { bar_server: { sentinel: true } } },
}
let userId = 'account-a'
let writes = 0
let failRead = false
let conflict = true
class Query {
  constructor() { this.operation = 'read'; this.filters = [] }
  select() { return this }
  eq(key, value) { this.filters.push([key, value]); return this }
  is(key, value) { return this.eq(key, value) }
  update(value) { this.operation = 'update'; this.value = value; return this }
  insert(value) { this.operation = 'insert'; this.value = value; return this }
  async single() { return this.execute() }
  async maybeSingle() { return this.execute() }
  then(resolvePromise, rejectPromise) { return Promise.resolve(this.execute()).then(resolvePromise, rejectPromise) }
  execute() {
    if (this.operation === 'read') return failRead ? { error: new Error('offline') } : { data: structuredClone(row), error: null }
    if (this.operation === 'insert') {
      if (row) return { error: { code: '23505' } }
      row = this.value; writes += 1
      return { data: structuredClone(row), error: null }
    }
    if (conflict) {
      conflict = false
      row = { ...row, learning_records: { ...row.learning_records, concurrent: { preserved: true } }, updated_at: '2026-01-01T00:00:01.000Z' }
      return { data: null, error: null }
    }
    if (this.filters.some(([key, value]) => row?.[key] !== value)) return { data: null, error: null }
    row = { ...row, ...this.value }; writes += 1
    return { data: structuredClone(row), error: null }
  }
}
globalThis.__barSyncClient = {
  auth: { getUser: async () => ({ data: { user: userId ? { id: userId, email: 'test@example.invalid' } : null }, error: null }) },
  from: () => new Query(),
}
const serviceSource = (await readFile(new URL('../src/services/jobPreparationService.js', import.meta.url), 'utf8'))
  .replace("import { supabase } from '../supabase'", 'const supabase=globalThis.__barSyncClient')
  .replace("'../data/foundationSync'", JSON.stringify(pathToFileURL(path.resolve('src/data/foundationSync.js')).href))
  .replace("'../data/retailPracticeProgress'", JSON.stringify(pathToFileURL(path.resolve('src/data/retailPracticeProgress.js')).href))
  .replace("'../data/barServerProgressSync'", JSON.stringify(pathToFileURL(path.resolve('src/data/barServerProgressSync.js')).href))
const service = await import(`data:text/javascript;base64,${Buffer.from(serviceSource).toString('base64')}`)
await service.upsertMyBarServerPracticeState({
  expectedUserId: 'account-a',
  version: 1,
  listeningProgress: local,
  shiftHistory: history,
  learningStage: 'experienced',
  stageUpdatedAt: '2026-01-02',
})
assert.equal(row.learning_records.concurrent.preserved, true)
assert.equal(row.learning_records.foundationCourses.bar_server.sentinel, true)
assert.equal((await service.getMyBarServerPracticeState('account-a')).learningStage, 'experienced')
const before = writes
failRead = true
await assert.rejects(() => service.getMyBarServerPracticeState('account-a'), /offline/)
assert.equal(writes, before)
failRead = false
userId = 'account-b'
await assert.rejects(() => service.upsertMyBarServerPracticeState({ expectedUserId: 'account-a' }), /Account changed/)
assert.equal(writes, before)

const root = resolve(new URL('..', import.meta.url).pathname.replace(/^\/(.:)/, '$1'))
const accessGate = await readFile(resolve(root, 'src/components/AccessGate.jsx'), 'utf8')
if (!accessGate.includes('bindProgressStorageToUser')) fail('AccessGate must clear user-scoped progress on account switch')
const { USER_SCOPED_PROGRESS_KEYS } = await import(pathToFileURL(resolve(root, 'src/data/userScopedStorage.js')).href)
for (const key of ['bar_server_listening_progress_v1', 'bar_server_learning_stage', 'bar_server_shift_challenge_history_v1']) {
  if (!USER_SCOPED_PROGRESS_KEYS.includes(key)) fail(`account switch cleanup is missing ${key}`)
}

console.log('Bar Server progress sync contract passed (account partitions, stage merge, cloud conflict retry, failed read and account switch).')
