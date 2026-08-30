import { supabase } from '../supabase'

const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user?.id) {
    const authError = new Error('请先登录后记录真实面试。')
    authError.code = 'LOGIN_REQUIRED'
    throw authError
  }

  return user
}

const cleanText = (value) => {
  const normalized = typeof value === 'string' ? value.trim() : value
  return normalized || null
}

const buildPayload = (input) => ({
  cruise_company: cleanText(input.cruiseCompany),
  target_position: cleanText(input.targetPosition),
  interview_date: input.interviewDate || null,
  interview_round: input.interviewRound || 'first',
  interview_format: input.interviewFormat || 'video',
  platform: cleanText(input.platform),
  interviewer_name: cleanText(input.interviewerName),
  status: input.status || 'scheduled',
  questions: Array.isArray(input.questions) ? input.questions : [],
  overall_confidence: input.overallConfidence ? Number(input.overallConfidence) : null,
  interviewer_feedback: cleanText(input.interviewerFeedback),
  next_action: cleanText(input.nextAction),
  next_action_at: input.nextActionAt || null,
  notes: cleanText(input.notes),
  consent_anonymous_questions: Boolean(input.consentAnonymousQuestions),
  updated_at: new Date().toISOString(),
})

export const listRealInterviewRecords = async () => {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('real_interview_records')
    .select('*')
    .eq('user_id', user.id)
    .order('interview_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export const createRealInterviewRecord = async (input) => {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('real_interview_records')
    .insert({
      ...buildPayload(input),
      user_id: user.id,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export const updateRealInterviewRecord = async (id, input) => {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('real_interview_records')
    .update(buildPayload(input))
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export const deleteRealInterviewRecord = async (id) => {
  const user = await getCurrentUser()
  const { error } = await supabase
    .from('real_interview_records')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error
}
