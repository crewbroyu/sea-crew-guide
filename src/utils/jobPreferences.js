import { normalizeInterviewPosition } from './interviewPosition'

const academyPositionAliases = {
  'Spa Therapist': 'spa',
  'SPA / Fitness': 'spa',
}

export const normalizeAcademyPosition = (value, fallback = '') => {
  if (!value) return fallback
  return academyPositionAliases[value] || normalizeInterviewPosition(value, fallback)
}

const readJson = (key, fallback = {}) => {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

export const getJobPreferences = () => {
  const task2Result = readJson('task2_result')
  const primaryKey = normalizeAcademyPosition(
    task2Result.selectedTargetJob || task2Result.target_position,
  )
  const backupKeys = (task2Result.backup_positions || [])
    .map((position) => normalizeAcademyPosition(position))
    .filter((position, index, positions) => (
      position && position !== primaryKey && positions.indexOf(position) === index
    ))
    .slice(0, 2)

  return { primaryKey, backupKeys }
}

export const getJobPreferenceLabel = (positionKey, preferences) => {
  if (positionKey && positionKey === preferences.primaryKey) return '主申'
  if (preferences.backupKeys.includes(positionKey)) return '备选'
  return ''
}

export const sortByJobPreference = (positions, preferences) => {
  const priority = [preferences.primaryKey, ...preferences.backupKeys].filter(Boolean)
  return [...positions].sort((left, right) => {
    const leftIndex = priority.indexOf(left.key)
    const rightIndex = priority.indexOf(right.key)
    const leftRank = leftIndex === -1 ? priority.length : leftIndex
    const rightRank = rightIndex === -1 ? priority.length : rightIndex
    return leftRank - rightRank
  })
}
