import { apiClient } from '../lib/apiClient'

export async function getTasks() {
  return apiClient.get('/tasks')
}

export async function getMyTasks() {
  return apiClient.get('/me/tasks')
}

export async function initMyTasks(tasks) {
  return apiClient.post('/me/tasks/init', { tasks })
}

export async function completeTask(taskId) {
  return apiClient.post('/me/tasks/complete', { taskId })
}

export async function getFirstTask(stage, sortOrder) {
  return apiClient.get(`/tasks/first?stage=${stage}&sort_order=${sortOrder}`)
}

export async function findTaskByTitle(title) {
  return apiClient.get(`/tasks/by-title?title=${encodeURIComponent(title)}`)
}

export async function getTaskByStageAndOrder(stage, sortOrder) {
  return apiClient.get(`/tasks/by-stage-order?stage=${stage}&sort_order=${sortOrder}`)
}

export async function getMyTaskStatus(taskId) {
  return apiClient.get(`/me/tasks/status?task_id=${taskId}`)
}

export async function upsertMyTask(payload) {
  return apiClient.post('/me/tasks/upsert', payload)
}
