import { supabase } from '../supabase'
import { BAR_SERVER_SKILLS, getScenarioForWeakSkill } from '../data/jobScenarioCatalog'

const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user?.id) return null
  return user
}

const clampScore = (value) => Math.round(Math.max(0, Math.min(100, Number(value) || 0)))

export const emptySkillScores = () => Object.fromEntries(BAR_SERVER_SKILLS.map(({ key }) => [key, 0]))

export const normalizeSkillScores = (value) => Object.fromEntries(
  BAR_SERVER_SKILLS.map(({ key }) => [key, clampScore(value?.[key])]),
)

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
    .select('id, scenario_id, difficulty, status, overall_readiness, skill_scores, created_at, completed_at')
    .eq('user_id', user.id)
    .eq('job_key', jobKey)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(Math.min(Math.max(Number(limit) || 30, 1), 60))

  if (error) throw error
  return data || []
}

export const saveScenarioTrainingResult = async ({ scenario, turns, evaluation }) => {
  const user = await getCurrentUser()
  if (!user) return null

  const skillScores = normalizeSkillScores(evaluation?.skillScores)
  const weakestSkill = BAR_SERVER_SKILLS
    .slice()
    .sort((left, right) => skillScores[left.key] - skillScores[right.key])[0]?.key || 'english'

  const { data: session, error: sessionError } = await supabase
    .from('scenario_training_sessions')
    .insert({
      user_id: user.id,
      job_key: scenario.jobKey,
      scenario_id: scenario.id,
      difficulty: scenario.difficulty,
      scenario_context: scenario,
      turns,
      status: 'completed',
      overall_readiness: clampScore(evaluation?.overallReadiness),
      skill_scores: skillScores,
      strengths: evaluation?.strengths || [],
      weaknesses: evaluation?.weaknesses || [],
      critical_mistakes: evaluation?.criticalMistakes || [],
      better_response: evaluation?.betterResponse || '',
      next_recommendation: evaluation?.nextTrainingRecommendation || '',
      completed_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (sessionError) throw sessionError

  const history = await getMyScenarioHistory(scenario.jobKey)
  const completedScenarioIds = [...new Set(history.map((item) => item.scenario_id))]
  const latestScores = skillScores
  const previousProfile = await getMyScenarioProfile(scenario.jobKey)
  const previousScores = normalizeSkillScores(previousProfile?.skill_scores)
  const hasPreviousProfile = Boolean(previousProfile?.updated_at)
  const blendedScores = Object.fromEntries(BAR_SERVER_SKILLS.map(({ key }) => [
    key,
    hasPreviousProfile ? Math.round(previousScores[key] * 0.65 + latestScores[key] * 0.35) : latestScores[key],
  ]))
  const nextWeakestSkill = BAR_SERVER_SKILLS
    .slice()
    .sort((left, right) => blendedScores[left.key] - blendedScores[right.key])[0]?.key || weakestSkill
  const recommendedScenario = getScenarioForWeakSkill(nextWeakestSkill, completedScenarioIds)
  const readinessScore = Math.round(
    BAR_SERVER_SKILLS.reduce((total, { key }) => total + blendedScores[key], 0) / BAR_SERVER_SKILLS.length,
  )

  const { error: profileError } = await supabase
    .from('user_job_skill_profiles')
    .upsert({
      user_id: user.id,
      job_key: scenario.jobKey,
      readiness_score: readinessScore,
      skill_scores: blendedScores,
      weakest_skill: nextWeakestSkill,
      recommended_scenario_id: recommendedScenario?.id || null,
      completed_scenario_count: completedScenarioIds.length,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,job_key' })

  if (profileError) throw profileError

  return { session, profile: { readinessScore, skillScores: blendedScores, weakestSkill: nextWeakestSkill, recommendedScenario } }
}
