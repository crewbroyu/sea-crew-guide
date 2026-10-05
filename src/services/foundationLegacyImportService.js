import { FOUNDATION_COURSES } from '../data/foundationCourseCatalog'
import { mergeFoundationProgress, mergeFoundationSavedLines } from '../data/foundationSync'
import {
  getFoundationCompletedCount,
  readFoundationPlacement,
  readFoundationProgress,
  readSavedFoundationLineChanges,
  readSavedFoundationLines,
  writeFoundationPlacement,
  writeFoundationProgress,
  writeSavedFoundationLineChanges,
  writeSavedFoundationLines,
} from './foundationProgressService'
import { upsertMyFoundationCourseState } from './jobPreparationService'

const IMPORT_MARKER_PREFIX = 'foundation_legacy_import_v1'

const hasEvidence = (value, key = '') => {
  if (value == null || key === 'version') return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.entries(value).some(([childKey, child]) => hasEvidence(child, childKey))
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  return String(value).trim().length > 0
}

const fingerprint = (value) => {
  const input = JSON.stringify(value)
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

const markerKey = (userId) => `${IMPORT_MARKER_PREFIX}:${userId}`
const pendingKey = (userId, slug) => `foundation_pending_v1:${userId}:${slug}`

const readMarker = (userId) => {
  try { return JSON.parse(localStorage.getItem(markerKey(userId)) || 'null') } catch { return null }
}

const writeMarker = (userId, value) => {
  localStorage.setItem(markerKey(userId), JSON.stringify(value))
}

const readLegacyCourse = (course) => ({
  course,
  progress: readFoundationProgress(course.jobKey),
  savedLines: readSavedFoundationLines(course.jobKey),
  savedLineChanges: readSavedFoundationLineChanges(course.jobKey),
  placement: readFoundationPlacement(course.jobKey),
})

const getImportPlan = (userId) => {
  const courses = Object.values(FOUNDATION_COURSES)
    .map(readLegacyCourse)
    .filter((item) => hasEvidence(item.progress) || item.savedLines.length || Object.keys(item.savedLineChanges).length || item.placement)
  if (!courses.length) return null
  const sourceFingerprint = fingerprint(courses.map(({ course, ...state }) => ({ jobKey: course.jobKey, ...state })))
  const marker = readMarker(userId)
  if (marker?.fingerprint === sourceFingerprint && marker.status === 'done') return null
  return {
    userId,
    fingerprint: sourceFingerprint,
    status: marker?.fingerprint === sourceFingerprint ? marker.status : 'available',
    courses,
    summary: courses.map(({ course, progress, savedLines, placement }) => ({
      jobKey: course.jobKey,
      title: course.title,
      completedDays: getFoundationCompletedCount(course, progress),
      totalDays: course.days.length,
      savedLineCount: savedLines.length,
      hasPlacement: Boolean(placement),
    })),
  }
}

export const getLegacyFoundationImport = (userId) => userId ? getImportPlan(userId) : null

export const importLegacyFoundationProgress = async (userId) => {
  const plan = getImportPlan(userId)
  if (!plan) return { status: 'no_data', summary: [] }

  const prepared = plan.courses.map(({ course, progress, savedLines, savedLineChanges, placement }) => {
    const scopedProgress = readFoundationProgress(course.jobKey, userId)
    const scopedLines = {
      savedLines: readSavedFoundationLines(course.jobKey, userId),
      savedLineChanges: readSavedFoundationLineChanges(course.jobKey, userId),
    }
    const mergedProgress = mergeFoundationProgress(scopedProgress, progress)
    const mergedLines = mergeFoundationSavedLines(scopedLines, { savedLines, savedLineChanges })
    const mergedPlacement = readFoundationPlacement(course.jobKey, userId) || placement || null
    writeFoundationProgress(course.jobKey, mergedProgress, userId)
    writeSavedFoundationLines(course.jobKey, mergedLines.savedLines, userId)
    writeSavedFoundationLineChanges(course.jobKey, mergedLines.savedLineChanges, userId)
    if (mergedPlacement) writeFoundationPlacement(course.jobKey, mergedPlacement, userId)
    localStorage.setItem(pendingKey(userId, course.slug), '1')
    return { course, progress: mergedProgress, ...mergedLines, placement: mergedPlacement }
  })

  writeMarker(userId, { fingerprint: plan.fingerprint, status: 'pending', updatedAt: new Date().toISOString() })
  try {
    for (const item of prepared) {
      const profile = await upsertMyFoundationCourseState({
        expectedUserId: userId,
        jobKey: item.course.jobKey,
        roleKey: item.course.roleKey,
        roleTitle: item.course.title,
        version: item.course.version,
        progress: item.progress,
        savedLines: item.savedLines,
        savedLineChanges: item.savedLineChanges,
        placement: item.placement,
      })
      const cloudState = profile?.learning_records?.foundationCourses?.[item.course.jobKey]
      if (cloudState) {
        const finalProgress = mergeFoundationProgress(item.progress, cloudState.progress)
        const finalLines = mergeFoundationSavedLines(item, cloudState)
        writeFoundationProgress(item.course.jobKey, finalProgress, userId)
        writeSavedFoundationLines(item.course.jobKey, finalLines.savedLines, userId)
        writeSavedFoundationLineChanges(item.course.jobKey, finalLines.savedLineChanges, userId)
        if (cloudState.placement || item.placement) writeFoundationPlacement(item.course.jobKey, cloudState.placement || item.placement, userId)
      }
      localStorage.removeItem(pendingKey(userId, item.course.slug))
    }
    writeMarker(userId, { fingerprint: plan.fingerprint, status: 'done', updatedAt: new Date().toISOString() })
    return { status: 'done', summary: plan.summary }
  } catch (error) {
    return { status: 'pending', summary: plan.summary, error }
  }
}
