import { barServerFoundationDays, barServerShiftLabs } from '../src/data/barServerFoundation.js'
import { retailFoundationDays } from '../src/data/retailFoundation.js'

const lineText = (line) => typeof line === 'string' ? line : line?.line

const normalizeDayReference = ({ day, shiftLab, serviceLines, position }) => {
  const knowledge = (day.knowledge || day.sections?.flatMap((section) => section.items || []) || [])
    .filter((item) => typeof item === 'string' && item.trim())
  const requiredActions = (day.requiredActions || knowledge)
    .filter((item) => typeof item === 'string' && item.trim())
  const phrases = (serviceLines || day.serviceLines || []).map(lineText).filter(Boolean)
  return {
    id: `foundation:${day.id}`,
    position,
    question: shiftLab?.challenge?.prompt || day.challenge?.prompt || '',
    roleGoal: shiftLab?.mission || day.mission || day.outcome || '',
    serviceSequence: requiredActions.slice(0, 6),
    knowledgeNotes: knowledge.slice(0, 10),
    knowledgeNotesZh: knowledge.slice(0, 5),
    usefulPhrases: phrases.slice(0, 6),
    retryChecklistZh: requiredActions.slice(0, 4),
    fallbackStrengthsZh: ['已经尝试用英语直接回应当前岗位场景。'],
    referenceAnswer: phrases.join(' '),
  }
}

const trustedReferences = new Map([
  ...barServerFoundationDays.map((day) => [
    `bar_server:${day.id}`,
    normalizeDayReference({
      day,
      shiftLab: barServerShiftLabs[day.id],
      serviceLines: barServerShiftLabs[day.id]?.serviceLines,
      position: 'Bar Server',
    }),
  ]),
  ...retailFoundationDays.map((day) => [
    `retail:${day.id}`,
    normalizeDayReference({ day, serviceLines: day.serviceLines, position: 'Retail Sales Associate' }),
  ]),
])

const getJobKeyForPosition = (position = '') => /retail|sales associate|duty[\s-]*free|免税|零售/i.test(position)
  ? 'retail'
  : 'bar_server'

export const getFoundationTrainingReference = ({ scenarioId, position }) => {
  const dayId = String(scenarioId || '').replace(/^foundation:/, '').trim()
  if (!dayId) return null
  return trustedReferences.get(`${getJobKeyForPosition(position)}:${dayId}`) || null
}
