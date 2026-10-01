import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { BAR_SERVER_LISTENING_DRILLS } from '../src/data/barServerListening.js'
import {
  mergeBarListeningProgress,
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

const root = resolve(new URL('..', import.meta.url).pathname.replace(/^\/(.:)/, '$1'))
const accessGate = await readFile(resolve(root, 'src/components/AccessGate.jsx'), 'utf8')
for (const key of ['bar_server_listening_progress_v1', 'bar_server_learning_stage', 'bar_server_shift_challenge_history_v1']) {
  if (!accessGate.includes(`'${key}'`)) fail(`account switch cleanup is missing ${key}`)
}

console.log('Bar Server progress sync contract passed (merge, history, account isolation).')
