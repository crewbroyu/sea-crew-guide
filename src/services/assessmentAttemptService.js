import { supabase } from '../supabase'

const ATTEMPT_ERROR_MESSAGES = {
  LOGIN_REQUIRED: '请先登录后再开始实战评估。',
  VERIFIED_ACCOUNT_REQUIRED: '请先使用正式邮箱账号登录后再开始实战评估。',
  ASSESSMENT_LIMIT_REACHED: '你的 3 次完整评估机会已全部使用。',
  ASSESSMENT_ATTEMPT_EXPIRED: '本次实战评估已超过 2 小时，请重新开始。',
  ASSESSMENT_ATTEMPT_NOT_ACTIVE: '本次实战评估已经结束，请返回后重新开始。',
}

const normalizeAttemptStatus = (data = {}) => ({
  isAdmin: Boolean(data.isAdmin),
  maxAttempts: data.maxAttempts == null ? null : Number(data.maxAttempts),
  completedAttempts: Number(data.completedAttempts) || 0,
  remainingAttempts: data.remainingAttempts == null ? null : Number(data.remainingAttempts),
  activeAttemptId: data.activeAttemptId || data.attemptId || null,
  activeExpiresAt: data.activeExpiresAt || data.expiresAt || null,
})

const toAttemptError = (error, fallbackMessage) => {
  const matchedCode = Object.keys(ATTEMPT_ERROR_MESSAGES)
    .find((code) => error?.message?.includes(code))
  const nextError = new Error(
    matchedCode ? ATTEMPT_ERROR_MESSAGES[matchedCode] : fallbackMessage,
  )
  nextError.code = matchedCode || error?.code || 'ASSESSMENT_ACCESS_FAILED'
  return nextError
}

export const getAssessmentAttemptStatus = async () => {
  const { data, error } = await supabase.rpc('get_assessment_attempt_status')
  if (error) throw toAttemptError(error, '暂时无法读取评估次数，请稍后重试。')
  return normalizeAttemptStatus(data)
}

export const startAssessmentAttempt = async (assessmentVersion) => {
  const { data, error } = await supabase.rpc('start_assessment_attempt', {
    input_assessment_version: assessmentVersion,
  })
  if (error) throw toAttemptError(error, '暂时无法开始实战评估，请稍后重试。')
  return normalizeAttemptStatus(data)
}
