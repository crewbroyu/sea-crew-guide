import {
  BAR_SERVER_LEARNING_STAGES,
  BAR_SERVER_LISTENING_DRILLS,
} from '../src/data/barServerListening.js'

const fail = (message) => {
  console.error(`Bar Server listening contract failed: ${message}`)
  process.exit(1)
}

if (BAR_SERVER_LISTENING_DRILLS.length !== 12) fail('expected exactly 12 drills')

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

console.log('Bar Server listening contract passed (12 drills, 3 levels, 3 learning stages).')
