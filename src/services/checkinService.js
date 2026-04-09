import { apiClient } from '../lib/apiClient'

export async function getTodayCheckin(date) {
  return apiClient.get(`/me/checkins/today?date=${date}`)
}

export async function getAllCheckins() {
  return apiClient.get('/me/checkins')
}

export async function createCheckin(payload) {
  return apiClient.post('/me/checkins', payload)
}
