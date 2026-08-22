import { supabase } from '../supabase'

const PROGRESS_KEY = 'boarding_progress'
const TASK_COUNT = 12

const taskStageMap = {
  1: 'assessment',
  2: 'position_selected',
  3: 'route_selected',
  4: 'resume',
  5: 'job_knowledge',
  6: 'interview_skills',
  7: 'interview_practice',
  8: 'ai_interview',
  9: 'offer',
  10: 'documents',
  11: 'visa',
  12: 'boarding_ready',
}

const readJson = (key, fallback = null) => {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch (error) {
    console.warn(`Unable to read ${key}:`, error)
    return fallback
  }
}

export const getLocalTaskProgress = () => readJson(PROGRESS_KEY, {})

export const writeLocalTaskProgress = (progress) => {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
}

export const markLocalTaskComplete = (taskId) => {
  const progress = getLocalTaskProgress()
  progress[`task${taskId}`] = {
    completed: true,
    completedAt: new Date().toISOString(),
  }
  writeLocalTaskProgress(progress)
  return progress
}

const getCompletedTaskIds = (progress) => {
  const completed = []

  for (let taskId = 1; taskId <= TASK_COUNT; taskId += 1) {
    if (progress[`task${taskId}`]?.completed) {
      completed.push(taskId)
    }
  }

  return completed
}

const inferStageFromProgress = (completedTaskIds) => {
  const lastCompletedTaskId = completedTaskIds.at(-1) || null

  if (!lastCompletedTaskId) return 'exploring'
  if (lastCompletedTaskId >= 10) return 'boarding_preparation'
  if (lastCompletedTaskId >= 9) return 'offer_received'
  if (lastCompletedTaskId >= 6) return 'interview_preparation'
  if (lastCompletedTaskId >= 4) return 'resume_preparation'
  if (lastCompletedTaskId >= 2) return 'position_planning'
  return 'assessment_done'
}

const inferApplicationStage = (completedTaskIds) => {
  if (completedTaskIds.includes(12)) return 'boarding_ready'
  if (completedTaskIds.includes(10) || completedTaskIds.includes(11)) return 'documents'
  if (completedTaskIds.includes(9)) return 'offer_received'
  if (completedTaskIds.includes(8) || completedTaskIds.includes(7)) return 'interview'
  if (completedTaskIds.includes(4)) return 'resume'
  if (completedTaskIds.includes(2)) return 'position_selected'
  if (completedTaskIds.includes(1)) return 'assessed'
  return 'exploring'
}

const inferResumeStatus = (completedTaskIds) => {
  if (completedTaskIds.includes(4)) return 'draft_ready'
  return 'not_started'
}

const inferInterviewStatus = (completedTaskIds) => {
  if (completedTaskIds.includes(8)) return 'ai_mock_done'
  if (completedTaskIds.includes(7)) return 'practicing'
  if (completedTaskIds.includes(6)) return 'learning'
  return 'not_started'
}

const calculateLeadScore = ({
  completedTaskIds,
  targetPosition,
  latestAssessmentScore,
  buddyIntent,
}) => {
  let score = 0
  score += Math.min(completedTaskIds.length * 8, 48)
  if (targetPosition) score += 15
  if (latestAssessmentScore) score += latestAssessmentScore >= 70 ? 15 : 8
  if (completedTaskIds.includes(4)) score += 10
  if (completedTaskIds.includes(8)) score += 12
  if (buddyIntent) score += 8
  return Math.min(score, 100)
}

const compactProgress = (progress) => {
  const compacted = {}

  for (let taskId = 1; taskId <= TASK_COUNT; taskId += 1) {
    const value = progress[`task${taskId}`]
    compacted[`task${taskId}`] = {
      completed: Boolean(value?.completed),
      completedAt: value?.completedAt || null,
      stage: taskStageMap[taskId],
    }
  }

  return compacted
}

export const buildLocalPathProfile = (overrides = {}) => {
  const progress = getLocalTaskProgress()
  const completedTaskIds = getCompletedTaskIds(progress)
  const task2Result = readJson('task2_result', {})
  const assessmentResult = readJson('assessment_result', {})
  const targetPosition =
    Object.prototype.hasOwnProperty.call(overrides, 'target_position')
      ? overrides.target_position
      : task2Result.selectedTargetJob || null
  const latestAssessmentScore =
    Object.prototype.hasOwnProperty.call(overrides, 'latest_assessment_score')
      ? overrides.latest_assessment_score
      : assessmentResult.overallScore || null
  const latestAssessmentLevel =
    overrides.latest_assessment_level || assessmentResult.level?.label || assessmentResult.level_label || null

  return {
    career_stage: inferStageFromProgress(completedTaskIds),
    application_stage: inferApplicationStage(completedTaskIds),
    resume_status: inferResumeStatus(completedTaskIds),
    interview_status: inferInterviewStatus(completedTaskIds),
    target_position: targetPosition,
    latest_assessment_score: latestAssessmentScore,
    latest_assessment_level: latestAssessmentLevel,
    last_completed_task_id: completedTaskIds.at(-1) || null,
    task_progress: compactProgress(progress),
    lead_score: calculateLeadScore({
      completedTaskIds,
      targetPosition,
      latestAssessmentScore,
      buddyIntent: overrides.buddy_intent,
    }),
    ...overrides,
  }
}

const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user?.id) {
    return null
  }

  return user
}

const removeUndefinedValues = (payload) =>
  Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined))

export const getMyPathProfile = async () => {
  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('user_path_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error
  return data
}

export const upsertMyPathProfile = async (partial = {}) => {
  const user = await getCurrentUser()
  if (!user) return null

  const localProfile = buildLocalPathProfile(partial)
  const payload = removeUndefinedValues({
    user_id: user.id,
    email: user.email || null,
    name: user.user_metadata?.name || user.email?.split('@')[0] || null,
    ...localProfile,
    updated_at: new Date().toISOString(),
    last_active_at: new Date().toISOString(),
  })

  const { data, error } = await supabase
    .from('user_path_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export const syncLocalPathProfile = async (partial = {}) => {
  try {
    return await upsertMyPathProfile(partial)
  } catch (error) {
    console.error('Failed to sync user path profile:', error)
    return null
  }
}

export const completeTaskAndSyncPathProfile = async (taskId, partial = {}) => {
  markLocalTaskComplete(taskId)
  return syncLocalPathProfile({
    last_completed_task_id: taskId,
    ...partial,
  })
}
