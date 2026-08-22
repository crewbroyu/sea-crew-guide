import { apiClient } from '../lib/apiClient'
import { supabase } from '../supabase'

export async function getLatestAssessment() {
  return apiClient.get('/me/assessment/latest')
}

export async function saveAssessment(payload) {
  return apiClient.post('/me/assessment', payload)
}

export const saveAssessmentSubmission = async ({
  userId = null,
  contact = {},
  serviceBackground = null,
  answers = {},
  dimensionScores = {},
  overallScore = 0,
  level = null,
  conclusion = null,
  recommendations = [],
}) => {
  const payload = {
    user_id: userId,
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

  const { error } = await supabase
    .from('assessment_submissions')
    .insert(payload)

  if (error) throw error
  return { saved: true }
}
