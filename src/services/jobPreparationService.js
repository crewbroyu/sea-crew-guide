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

export const upsertMyJobPreparation = async ({
  selectedRole = null,
  roleTitle = '',
  preparationChecklist = [],
  completedResources = [],
  learningRecords = {},
  completedCourseDetails = {},
  sourceTaskId = 5,
} = {}) => {
  const user = await getCurrentUser()
  if (!user) return null

  const completedChecklistCount = preparationChecklist.filter((item) => item.completed).length
  const checklistTotal = preparationChecklist.length

  const payload = removeUndefinedValues({
    user_id: user.id,
    email: user.email || null,
    selected_role: selectedRole,
    role_title: roleTitle || null,
    preparation_checklist: preparationChecklist,
    completed_resources: completedResources,
    learning_records: learningRecords,
    completed_course_details: completedCourseDetails,
    completed_checklist_count: completedChecklistCount,
    checklist_total: checklistTotal,
    source_task_id: sourceTaskId,
    preparation_status:
      checklistTotal > 0 && completedChecklistCount >= checklistTotal ? 'completed' : 'in_progress',
    updated_at: new Date().toISOString(),
  })

  const { data, error } = await supabase
    .from('job_preparation_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export const getMyJobPreparation = async () => {
  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('job_preparation_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error
  return data
}
