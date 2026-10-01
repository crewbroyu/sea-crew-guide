import { barServerFoundationDays } from '../src/data/barServerFoundation.js'
import { BAR_SERVER_LISTENING_DRILLS } from '../src/data/barServerListening.js'
import {
  BAR_SERVER_STAGE_PLANS,
  getBarServerPlanProgress,
} from '../src/data/barServerLearningPlan.js'

const fail = (message) => {
  console.error(`Bar Server plan contract failed: ${message}`)
  process.exit(1)
}

const foundationIds = new Set(barServerFoundationDays.map((day) => day.id))
const listeningIds = new Set(BAR_SERVER_LISTENING_DRILLS.map((drill) => drill.id))
const requirementTypes = new Set([
  'foundation_days',
  'listening_speaking_drills',
  'listening_count',
  'speaking_count',
  'shift_attempts',
  'shift_score',
  'scenario_count',
  'interview_ready',
])

for (const [stageId, items] of Object.entries(BAR_SERVER_STAGE_PLANS)) {
  if (items.length !== 14) fail(`${stageId} must contain exactly 14 training days`)
  if (!items.every((item, index) => item.day === index + 1)) fail(`${stageId} days must be sequential`)
  if (new Set(items.map((item) => item.id)).size !== 14) fail(`${stageId} plan ids must be unique`)
  for (const item of items) {
    if (!item.title || !item.description || !item.route.startsWith('/')) fail(`${stageId}/${item.id} has incomplete content`)
    if (!requirementTypes.has(item.requirement?.type)) fail(`${stageId}/${item.id} has an unsupported requirement`)
    if (item.requirement.type === 'foundation_days' && !item.requirement.ids.every((id) => foundationIds.has(id))) fail(`${stageId}/${item.id} references an unknown foundation day`)
    if (item.requirement.type === 'listening_speaking_drills' && !item.requirement.ids.every((id) => listeningIds.has(id))) fail(`${stageId}/${item.id} references an unknown listening drill`)
  }
  const emptyProgress = getBarServerPlanProgress(stageId, {})
  if (emptyProgress.completedCount !== 0 || emptyProgress.currentItem.day !== 1) fail(`${stageId} empty progress is incorrect`)
}

const completeContext = {
  foundationProgress: Object.fromEntries([...foundationIds].map((id) => [id, { completedAt: '2026-01-01' }])),
  listeningProgress: Object.fromEntries([...listeningIds].map((id) => [id, { completedAt: '2026-01-01', speakingPractice: { completedAt: '2026-01-01' } }])),
  shiftHistory: [{ score: 100, completedAt: '2026-01-01' }],
  scenarioCompletedCount: 4,
  interviewCompleted: true,
}

for (const stageId of Object.keys(BAR_SERVER_STAGE_PLANS)) {
  const completed = getBarServerPlanProgress(stageId, completeContext)
  if (!completed.isComplete || completed.completedCount !== 14) fail(`${stageId} complete context should finish the plan`)
}

console.log('Bar Server 14-day plan contract passed (3 stages, 42 plan items).')
