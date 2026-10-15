import { supabase } from '../supabase'
import { callAttemptRpc, toAttemptError } from './assessmentAttemptErrors'

const normalizeAttemptStatus = (data = {}) => ({
  isAdmin: Boolean(data.isAdmin),
  maxAttempts: data.maxAttempts == null ? null : Number(data.maxAttempts),
  completedAttempts: Number(data.completedAttempts) || 0,
  remainingAttempts: data.remainingAttempts == null ? null : Number(data.remainingAttempts),
  activeAttemptId: data.activeAttemptId || data.attemptId || null,
  activeExpiresAt: data.activeExpiresAt || data.expiresAt || null,
})

export const getAssessmentAttemptStatus = async () => {
  const { data, error } = await callAttemptRpc(supabase, 'get_assessment_attempt_status')
  if (error) throw toAttemptError(error, '暂时无法读取评估次数，请稍后重试。')
  return normalizeAttemptStatus(data)
}

export const startAssessmentAttempt = async (assessmentVersion) => {
  const { data, error } = await callAttemptRpc(supabase, 'start_assessment_attempt', {
    input_assessment_version: assessmentVersion,
  })
  if (error) throw toAttemptError(error, '暂时无法开始实战评估，请稍后重试。')
  return normalizeAttemptStatus(data)
}
