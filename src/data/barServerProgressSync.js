import { BAR_SERVER_LISTENING_DRILLS } from './barServerListening.js'

export const BAR_SERVER_PRACTICE_VERSION = 1

const latestTimestamp = (left, right) => {
  if (!left) return right || null
  if (!right) return left
  return new Date(left).getTime() >= new Date(right).getTime() ? left : right
}

const earliestTimestamp = (left, right) => {
  if (!left) return right || null
  if (!right) return left
  return new Date(left).getTime() <= new Date(right).getTime() ? left : right
}

const maxNumber = (left, right) => Math.max(Number(left || 0), Number(right || 0))

const mergeSpeakingPractice = (cloud = {}, local = {}) => {
  const phrases = new Set([
    ...Object.keys(cloud.phraseRepetitions || {}),
    ...Object.keys(local.phraseRepetitions || {}),
  ])
  const phraseRepetitions = Object.fromEntries([...phrases].map((phrase) => [
    phrase,
    maxNumber(cloud.phraseRepetitions?.[phrase], local.phraseRepetitions?.[phrase]),
  ]))
  return {
    ...cloud,
    ...local,
    phraseRepetitions,
    fullAnswerRepetitions: maxNumber(cloud.fullAnswerRepetitions, local.fullAnswerRepetitions),
    listenedPhrases: [...new Set([...(cloud.listenedPhrases || []), ...(local.listenedPhrases || [])])],
    completedAt: earliestTimestamp(cloud.completedAt, local.completedAt),
  }
}

const mergeDrillProgress = (cloud = {}, local = {}) => {
  const latestSource = new Date(local.lastAttemptAt || 0).getTime() >= new Date(cloud.lastAttemptAt || 0).getTime()
    ? local
    : cloud
  return {
    ...cloud,
    ...local,
    normalPlays: maxNumber(cloud.normalPlays, local.normalPlays),
    slowPlays: maxNumber(cloud.slowPlays, local.slowPlays),
    attempts: maxNumber(cloud.attempts, local.attempts),
    lastScore: Number(latestSource.lastScore || 0),
    bestScore: maxNumber(cloud.bestScore, local.bestScore),
    lastAttemptAt: latestTimestamp(cloud.lastAttemptAt, local.lastAttemptAt),
    completedAt: earliestTimestamp(cloud.completedAt, local.completedAt),
    speakingPractice: mergeSpeakingPractice(cloud.speakingPractice, local.speakingPractice),
  }
}

export const mergeListeningProgress = (drills, cloud = {}, local = {}) => Object.fromEntries(
  drills
    .filter((drill) => cloud[drill.id] || local[drill.id])
    .map((drill) => [drill.id, mergeDrillProgress(cloud[drill.id], local[drill.id])]),
)

export const mergeBarShiftHistory = (...histories) => {
  const attempts = new Map()
  histories.flat().filter(Boolean).forEach((attempt) => {
    const key = attempt.id || `${attempt.completedAt || ''}:${attempt.score || 0}`
    const existing = attempts.get(key)
    if (!existing || new Date(attempt.completedAt || 0) > new Date(existing.completedAt || 0)) {
      attempts.set(key, attempt)
    }
  })
  return [...attempts.values()]
    .sort((left, right) => new Date(right.completedAt || 0) - new Date(left.completedAt || 0))
    .slice(0, 10)
}

export const mergeBarListeningProgress = (cloud, local) => mergeListeningProgress(BAR_SERVER_LISTENING_DRILLS, cloud, local)

export const mergeBarServerPractice = (cloud = {}, local = {}) => {
  const localStageIsNewer = Boolean(local.learningStage) && (
    !cloud.learningStage
    || new Date(local.stageUpdatedAt || 0).getTime() > new Date(cloud.stageUpdatedAt || 0).getTime()
  )
  const stageSource = localStageIsNewer ? local : cloud
  return {
    ...cloud,
    ...local,
    version: BAR_SERVER_PRACTICE_VERSION,
    listeningProgress: mergeBarListeningProgress(cloud.listeningProgress, local.listeningProgress),
    shiftHistory: mergeBarShiftHistory(cloud.shiftHistory || [], local.shiftHistory || []),
    learningStage: stageSource.learningStage || 'job_search',
    stageUpdatedAt: latestTimestamp(cloud.stageUpdatedAt, local.stageUpdatedAt),
  }
}
