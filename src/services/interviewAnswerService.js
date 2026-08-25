import { supabase } from '../supabase'

const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user?.id) {
    return null
  }

  return user
}

const removeUndefinedValues = (payload) =>
  Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined))

export const upsertMyInterviewAnswerProfile = async ({
  preparedAnswerCount = 0,
  answerCards = [],
  sourceTaskId = 6,
} = {}) => {
  const user = await getCurrentUser()
  if (!user) return null

  const payload = removeUndefinedValues({
    user_id: user.id,
    email: user.email || null,
    prepared_answer_count: preparedAnswerCount,
    answer_cards: answerCards,
    source_task_id: sourceTaskId,
    preparation_status: preparedAnswerCount >= 3 ? 'ready_for_mock' : 'in_progress',
    updated_at: new Date().toISOString(),
  })

  const { data, error } = await supabase
    .from('interview_answer_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export const getMyInterviewAnswerProfile = async () => {
  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('interview_answer_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error
  return data
}
