import { BAR_SERVER_FOUNDATION_VERSION } from '../data/barServerFoundation'
import { RETAIL_FOUNDATION_STORAGE_KEY, RETAIL_FOUNDATION_VERSION } from '../data/retailFoundation'

const BAR_STORAGE_KEY = 'task5_data'
const SAVED_LINES_PREFIX = 'foundation_saved_lines_v1'
const PLACEMENT_PREFIX = 'foundation_placement_v1'

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '') || fallback
  } catch {
    return fallback
  }
}

export const readFoundationProgress = (jobKey) => {
  if (jobKey === 'retail') {
    const value = readJson(RETAIL_FOUNDATION_STORAGE_KEY, {})
    return value.version === RETAIL_FOUNDATION_VERSION
      ? value
      : { version: RETAIL_FOUNDATION_VERSION, days: {} }
  }

  return readJson(BAR_STORAGE_KEY, {}).foundationProgress || {}
}

export const writeFoundationProgress = (jobKey, progress) => {
  if (jobKey === 'retail') {
    localStorage.setItem(RETAIL_FOUNDATION_STORAGE_KEY, JSON.stringify({
      version: RETAIL_FOUNDATION_VERSION,
      days: progress?.days || {},
    }))
    return
  }

  const task5 = readJson(BAR_STORAGE_KEY, {})
  localStorage.setItem(BAR_STORAGE_KEY, JSON.stringify({
    ...task5,
    foundationProgress: progress,
    foundationVersion: BAR_SERVER_FOUNDATION_VERSION,
  }))
}

export const getFoundationDayProgress = (jobKey, progress, dayId) => (
  jobKey === 'retail' ? progress?.days?.[dayId] || {} : progress?.[dayId] || {}
)

export const isFoundationDayFinished = (jobKey, progress, dayId) => (
  Boolean(getFoundationDayProgress(jobKey, progress, dayId).completedAt)
)

export const getFoundationCompletedCount = (course, progress) => (
  course.days.filter((day) => isFoundationDayFinished(course.jobKey, progress, day.id)).length
)

export const findContinueFoundationDay = (course, progress) => (
  course.days.find((day) => !isFoundationDayFinished(course.jobKey, progress, day.id))
  || course.days.at(-1)
)

export const readSavedFoundationLines = (jobKey) => (
  readJson(`${SAVED_LINES_PREFIX}:${jobKey}`, [])
)

export const writeSavedFoundationLines = (jobKey, lines) => {
  localStorage.setItem(`${SAVED_LINES_PREFIX}:${jobKey}`, JSON.stringify(lines.slice(0, 100)))
}

export const readFoundationPlacement = (jobKey) => (
  readJson(`${PLACEMENT_PREFIX}:${jobKey}`, null)
)

export const writeFoundationPlacement = (jobKey, result) => {
  localStorage.setItem(`${PLACEMENT_PREFIX}:${jobKey}`, JSON.stringify(result))
}

