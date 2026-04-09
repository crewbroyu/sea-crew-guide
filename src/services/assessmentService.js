import { apiClient } from '../lib/apiClient'

export async function getLatestAssessment() {
  return apiClient.get('/me/assessment/latest')
}

export async function saveAssessment(payload) {
  return apiClient.post('/me/assessment', payload)
}
