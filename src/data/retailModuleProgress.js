// Independent evidence: a passed check and a saved, self-reviewed writing exercise.
export const moduleComplete = (record) => Boolean(record?.quizPassedAt && record?.practiceCompletedAt)
export function mergeModuleProgress(a = {}, b = {}) {
 const result = {...a}
 for (const [id, incoming] of Object.entries(b || {})) {
  const previous = result[id] || {}
  const incomingOrder = (incoming.updatedAt || '') + JSON.stringify(incoming)
  const previousOrder = (previous.updatedAt || '') + JSON.stringify(previous)
  const newer = incomingOrder >= previousOrder ? incoming : previous
  const first = (x,y) => [x,y].filter(Boolean).sort()[0] || null
  result[id] = {...previous,...incoming,...newer,quizPassedAt:first(previous.quizPassedAt,incoming.quizPassedAt),practiceCompletedAt:first(previous.practiceCompletedAt,incoming.practiceCompletedAt)}
 }
 return result
}
export const moduleProgressKey = lesson => lesson.id + '@' + lesson.revision
export const validModuleResponse = text => (text || '').trim().split(/\s+/).filter(Boolean).length >= 12
