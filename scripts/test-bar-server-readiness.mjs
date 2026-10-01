import { barServerFoundationDays } from '../src/data/barServerFoundation.js'
import { BAR_SERVER_LISTENING_DRILLS } from '../src/data/barServerListening.js'
import { getBarServerReadinessReport } from '../src/data/barServerReadiness.js'

const fail = (message) => {
  console.error(`Bar Server readiness contract failed: ${message}`)
  process.exit(1)
}

const empty = getBarServerReadinessReport()
if (empty.overallScore !== 0) fail('empty report must start at zero')
if (empty.level.id !== 'insufficient') fail('empty report must show insufficient evidence')
if (empty.dimensions.length !== 5) fail('report must include five readiness dimensions')
if (empty.recommendations.length !== 3) fail('empty report must return three next actions')

const completeFoundation = Object.fromEntries(
  barServerFoundationDays.map((day) => [day.id, { completedAt: '2026-01-01' }]),
)
const completeListening = Object.fromEntries(BAR_SERVER_LISTENING_DRILLS.map((drill) => [
  drill.id,
  {
    bestScore: 100,
    completedAt: '2026-01-01',
    speakingPractice: { completedAt: '2026-01-01' },
  },
]))
const complete = getBarServerReadinessReport({
  foundationProgress: completeFoundation,
  listeningProgress: completeListening,
  shiftHistory: [{ score: 90, completedAt: '2026-01-02' }],
  scenarioProfile: {
    completed_scenario_count: 3,
    readiness_score: 90,
    weakest_skill: 'upselling',
    skill_scores: { communication: 92, upselling: 82 },
  },
})

if (complete.overallScore !== 96) fail(`complete weighted score should be 96, got ${complete.overallScore}`)
if (complete.evidencePercent !== 100) fail('complete report must have full evidence')
if (!complete.readyForShift) fail('complete report should pass the shift readiness gate')
if (complete.level.id !== 'stable') fail('complete report should be stable')

const onePerfectListeningAnswer = getBarServerReadinessReport({
  listeningProgress: {
    [BAR_SERVER_LISTENING_DRILLS[0].id]: { bestScore: 100, completedAt: '2026-01-01' },
  },
})
const listening = onePerfectListeningAnswer.dimensions.find((item) => item.id === 'listening')
if (listening.score >= 20) fail('one perfect answer must not create an inflated listening score')
if (onePerfectListeningAnswer.level.id !== 'insufficient') fail('sparse results must remain insufficient evidence')

console.log('Bar Server readiness report contract passed (5 evidence dimensions).')
