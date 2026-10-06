import {
  BAR_SERVER_LEARNING_STAGES,
  BAR_SERVER_LISTENING_DRILLS,
  getListeningDrillStatus,
  getListeningUnitStats,
  getRecommendedListeningDrill,
  getShiftChallengeDrills,
  isBarListeningAnswerComplete,
  scoreBarListeningAnswer,
} from '../src/data/barServerListening.js'

const fail = (message) => {
  console.error(`Bar Server listening contract failed: ${message}`)
  process.exit(1)
}

if (BAR_SERVER_LISTENING_DRILLS.length !== 13) fail('expected exactly 13 drills')

const drillIds = new Set()
const prompts = new Set()
const levels = new Set()
const units = new Set()

for (const drill of BAR_SERVER_LISTENING_DRILLS) {
  if (!drill.id || drillIds.has(drill.id)) fail(`duplicate or missing drill id: ${drill.id}`)
  if (!drill.prompt || prompts.has(drill.prompt)) fail(`duplicate or missing prompt: ${drill.id}`)
  if (!drill.context || !drill.task || !drill.explanation) fail(`missing learning copy: ${drill.id}`)
  if (!drill.response || !drill.responseCue) fail(`missing workplace response practice: ${drill.id}`)
  const responseWordCount = drill.response.trim().split(/\s+/).length
  if (responseWordCount < 7 || responseWordCount > 30) fail(`response length is not suitable for short speaking practice: ${drill.id}`)
  drillIds.add(drill.id)
  prompts.add(drill.prompt)
  levels.add(drill.level)
  units.add(drill.unit)

  if (drill.type === 'capture') {
    if (!Array.isArray(drill.fields) || drill.fields.length < 2) fail(`capture drill needs at least two fields: ${drill.id}`)
    const fieldKeys = new Set()
    for (const field of drill.fields) {
      if (!field.key || fieldKeys.has(field.key)) fail(`duplicate or missing field key: ${drill.id}`)
      if (!field.label || !Array.isArray(field.options) || field.options.length < 3) fail(`invalid field options: ${drill.id}/${field.key}`)
      if (!field.options.includes(field.correct)) fail(`correct answer missing from options: ${drill.id}/${field.key}`)
      fieldKeys.add(field.key)
    }
  } else if (drill.type === 'choice') {
    if (!Array.isArray(drill.options) || drill.options.length < 3) fail(`choice drill needs at least three options: ${drill.id}`)
    if (!drill.options.some((option) => option.id === drill.correctOptionId)) fail(`invalid correct choice: ${drill.id}`)
  } else {
    fail(`unsupported drill type: ${drill.id}`)
  }
}

if (![1, 2, 3].every((level) => levels.has(level))) fail('drills must cover levels 1, 2, and 3')
if (units.size < 6) fail('drills must cover at least six workplace skills')

const stageIds = BAR_SERVER_LEARNING_STAGES.map((stage) => stage.id)
if (new Set(stageIds).size !== 3) fail('learning stages must be unique')
if (!['job_search', 'first_contract', 'experienced'].every((id) => stageIds.includes(id))) fail('required learning stage missing')

const firstDrill = BAR_SERVER_LISTENING_DRILLS[0]
const secondDrill = BAR_SERVER_LISTENING_DRILLS[1]
if (getRecommendedListeningDrill({}).drill.id !== firstDrill.id) fail('empty progress should recommend the first drill')

const failedProgress = {
  [firstDrill.id]: { normalPlays: 1, attempts: 1, bestScore: 0 },
}
if (getListeningDrillStatus(firstDrill, failedProgress) !== 'needs_listening') fail('failed drill status is incorrect')
if (getRecommendedListeningDrill(failedProgress).drill.id !== firstDrill.id) fail('failed drill should be retried before new content')

const listeningPassedProgress = {
  [firstDrill.id]: { normalPlays: 1, attempts: 1, bestScore: 100, completedAt: '2026-01-01T00:00:00.000Z' },
}
if (getRecommendedListeningDrill(listeningPassedProgress).status !== 'needs_speaking') fail('passed listening should recommend speaking')

const masteredFirstProgress = {
  [firstDrill.id]: {
    normalPlays: 1,
    attempts: 1,
    bestScore: 100,
    completedAt: '2026-01-01T00:00:00.000Z',
    speakingPractice: { completedAt: '2026-01-01T00:05:00.000Z' },
  },
}
if (getRecommendedListeningDrill(masteredFirstProgress).drill.id !== secondDrill.id) fail('mastered drill should advance to new content')
if (getListeningUnitStats(masteredFirstProgress).reduce((sum, unit) => sum + unit.total, 0) !== 13) fail('unit stats must include every drill')

const slowDependentProgress = {
  [firstDrill.id]: {
    ...masteredFirstProgress[firstDrill.id],
    slowPlays: 2,
  },
}
if (getListeningDrillStatus(firstDrill, slowDependentProgress) !== 'needs_normal_speed') fail('repeated slow playback should create a normal-speed review')

const challengeDrills = getShiftChallengeDrills({}, 5)
if (challengeDrills.length !== 5) fail('shift challenge must contain five drills')
if (new Set(challengeDrills.map((drill) => drill.id)).size !== 5) fail('shift challenge drills must be unique')
if (![1, 2, 3].every((level) => challengeDrills.some((drill) => drill.level === level))) fail('shift challenge must cover all three levels')
if (new Set(challengeDrills.map((drill) => drill.unit)).size < 4) fail('shift challenge must cover at least four workplace skills')
if (!getShiftChallengeDrills(failedProgress, 5).some((drill) => drill.id === firstDrill.id)) fail('shift challenge must prioritize an existing weak drill')

const correctCaptureAnswers = Object.fromEntries(firstDrill.fields.map((field) => [field.key, field.correct]))
if (!isBarListeningAnswerComplete(firstDrill, correctCaptureAnswers)) fail('complete capture answer was not detected')
if (scoreBarListeningAnswer(firstDrill, correctCaptureAnswers).score !== 100) fail('correct capture answer must score 100')
if (scoreBarListeningAnswer(firstDrill, {}).score !== 0) fail('empty capture answer must score 0')

const allergyDrill = BAR_SERVER_LISTENING_DRILLS.find((drill) => drill.id === 'allergy-order-handover')
if (!allergyDrill || allergyDrill.level !== 3) fail('allergy safety drill is missing')
if (!allergyDrill.prompt.includes('approved ingredient information')) fail('allergy drill must require an approved information source')

console.log('Bar Server listening contract passed (13 drills, 3 levels, 3 learning stages).')
