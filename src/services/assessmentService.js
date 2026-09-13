import { supabase } from '../supabase'

export const saveAssessmentSubmission = async ({
  contact = {},
  serviceBackground = null,
  answers = {},
  dimensionScores = {},
  overallScore = 0,
  level = null,
  conclusion = null,
  recommendations = [],
}) => {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user?.id) {
    const error = new Error('请先登录后再保存职业测评。')
    error.code = 'LOGIN_REQUIRED'
    throw error
  }

  const payload = {
    name: contact.name || null,
    phone: contact.phone || null,
    wechat: contact.wechat || null,
    email: contact.email || null,
    goal: contact.goal || null,
    service_background: serviceBackground,
    answers,
    dimension_scores: dimensionScores,
    overall_score: overallScore,
    level: level?.level || null,
    level_label: level?.label || null,
    recommendations: conclusion ? { conclusion, jobs: recommendations } : recommendations,
  }

  const { error } = await supabase.rpc('save_assessment_submission', {
    input_payload: payload,
  })

  if (error) throw error
  return { saved: true }
}
