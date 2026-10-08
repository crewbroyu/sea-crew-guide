import { supabase } from '../supabase'

export const getMyUnifiedSkillProfiles = async () => {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user?.id) return []

  const { data, error } = await supabase
    .from('user_skill_profiles')
    .select('job_key, readiness_score, skills, confidence, weakest, evidence_count, source_counts, coverage_percent, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data || []
}

