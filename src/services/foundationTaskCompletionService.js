import { getFoundationCompletedCount } from './foundationProgressService'
import { upsertMyFoundationCourseState } from './jobPreparationService'
import { completeTaskAndSyncPathProfile, markLocalTaskComplete } from './userPathService'

const TASK_RESULT_KEY = 'task5_result'

const readTaskResult = () => {
  try {
    return JSON.parse(localStorage.getItem(TASK_RESULT_KEY) || '{}')
  } catch {
    return {}
  }
}

const getLegacyLearningRecordKey = (jobKey) => (
  jobKey === 'bar_server' ? 'barServerFoundation' : 'retailFoundation'
)

export const buildFoundationTaskResult = ({ course, progress, previousResult = {}, completedAt }) => {
  if (!course) throw new Error('Missing foundation course')

  const completedDays = getFoundationCompletedCount(course, progress)
  if (completedDays !== course.days.length) {
    throw new Error('Complete every foundation day before finishing Task 5')
  }

  const stableCompletedAt = previousResult.taskId === 5 && previousResult.completedAt
    ? previousResult.completedAt
    : completedAt || new Date().toISOString()
  const learningRecordKey = getLegacyLearningRecordKey(course.jobKey)

  return {
    ...previousResult,
    taskId: 5,
    completedAt: stableCompletedAt,
    selectedRole: course.roleKey,
    roleTitle: course.title,
    preparationChecklist: previousResult.preparationChecklist || [],
    completedResources: previousResult.completedResources || [],
    learningRecords: {
      ...(previousResult.learningRecords || {}),
      [learningRecordKey]: progress,
    },
    foundationProgress: progress,
    foundationCompletedDays: completedDays,
    foundationCourse: {
      jobKey: course.jobKey,
      version: course.version,
    },
  }
}

export const completeFoundationTask = async ({
  course,
  progress,
  savedLines = [],
  savedLineChanges = {},
  placement = null,
  ownerId = null,
}) => {
  const taskResult = buildFoundationTaskResult({
    course,
    progress,
    previousResult: readTaskResult(),
  })
  localStorage.setItem(TASK_RESULT_KEY, JSON.stringify(taskResult))

  let foundationSynced = !ownerId
  if (ownerId) {
    try {
      await upsertMyFoundationCourseState({
        expectedUserId: ownerId,
        jobKey: course.jobKey,
        roleKey: course.roleKey,
        roleTitle: course.title,
        version: course.version,
        progress,
        savedLines,
        savedLineChanges,
        placement,
      })
      foundationSynced = true
    } catch (error) {
      console.error('Failed to sync the completed foundation course:', error)
    }
  }

  if (ownerId && !foundationSynced) {
    markLocalTaskComplete(5)
    return {
      taskResult,
      foundationSynced: false,
      pathSynced: false,
    }
  }

  const pathProfile = await completeTaskAndSyncPathProfile(5, {
    career_stage: 'resume_preparation',
    application_stage: 'job_knowledge',
  })

  return {
    taskResult,
    foundationSynced,
    pathSynced: !ownerId || Boolean(pathProfile),
  }
}
