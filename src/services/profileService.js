import { apiClient } from '../lib/apiClient'

export async function getMyProfile() {
  return apiClient.get('/me/profile')
}

export async function createInitialProfile(payload) {
  return apiClient.post('/profiles/init', payload)
}

export async function updateMyProfile(payload) {
  return apiClient.patch('/me/profile', payload)
}
