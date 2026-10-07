export const careerReportMatchesAssessment = (assessmentSnapshot = {}, assessment = null) => {
  if (!assessment) return true
  const snapshotVersion = Number(assessmentSnapshot.assessmentVersion) || null
  const assessmentVersion = Number(assessment.assessmentVersion) || null
  const snapshotCompletedAt = typeof assessmentSnapshot.completedAt === 'string'
    ? assessmentSnapshot.completedAt.trim()
    : ''
  const assessmentCompletedAt = typeof assessment.completedAt === 'string'
    ? assessment.completedAt.trim()
    : ''

  return Boolean(
    snapshotVersion
    && assessmentVersion
    && snapshotVersion === assessmentVersion
    && snapshotCompletedAt
    && snapshotCompletedAt === assessmentCompletedAt,
  )
}
