export const cacheAssessmentResult = (storage, assessmentResult) => {
  try {
    storage.setItem('assessment_result', JSON.stringify(assessmentResult))
    return true
  } catch {
    return false
  }
}

export const markAssessmentProgressComplete = (storage, completedAt) => {
  try {
    const progress = JSON.parse(storage.getItem('boarding_progress') || '{}')
    progress.task1 = { completed: true, completedAt }
    storage.setItem('boarding_progress', JSON.stringify(progress))
    return true
  } catch {
    return false
  }
}

export const clearCachedAssessmentResult = (storage) => {
  try {
    storage.removeItem('assessment_result')
    return true
  } catch {
    return false
  }
}
