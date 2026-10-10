import { supabase } from '../supabase'

const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user?.id) return null
  return user
}

export const getMyScenarioProfile = async (jobKey = 'bar_server') => {
  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('user_job_skill_profiles')
    .select('*')
    .eq('user_id', user.id)
    .eq('job_key', jobKey)
    .maybeSingle()

  if (error) throw error
  return data
}

export const getMyScenarioHistory = async (jobKey = 'bar_server', limit = 30) => {
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('scenario_training_sessions')
    .select('id, scenario_id, difficulty, status, overall_readiness, skill_scores, weaknesses, next_recommendation, created_at, completed_at')
    .eq('user_id', user.id)
    .eq('job_key', jobKey)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(Math.min(Math.max(Number(limit) || 30, 1), 60))

  if (error) throw error
  return data || []
}

export const getMyInProgressScenarioSession = async (jobKey = 'bar_server') => {
  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('scenario_training_sessions')
    .select('id, scenario_id, scenario_context, turns, created_at')
    .eq('user_id', user.id)
    .eq('job_key', jobKey)
    .eq('status', 'in_progress')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

// The first-turn draft is created by the server together with the charged follow-up
// (scenario_turn). Learners only update their own draft turns to resume later.
export const updateScenarioTrainingDraft = async ({ sessionId, turns }) => {
  if (!sessionId) return null

  const { data, error } = await supabase
    .from('scenario_training_sessions')
    .update({ turns })
    .eq('id', sessionId)
    .eq('status', 'in_progress')
    .select('id')
    .single()

  if (error) throw error
  return data
}
