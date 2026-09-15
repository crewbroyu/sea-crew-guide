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

export const getMyFoundationCourseState = async (jobKey) => {
  const profile = await getMyJobPreparation()
  return profile?.learning_records?.foundationCourses?.[jobKey] || null
}

export const upsertMyFoundationCourseState = async ({
  jobKey,
  roleKey,
  roleTitle,
  version,
  progress,
  savedLines,
  placement,
}) => {
  const user = await getCurrentUser()
  if (!user || !jobKey) return null

  const { data: existing, error: readError } = await supabase
    .from('job_preparation_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (readError) throw readError

  const learningRecords = existing?.learning_records || {}
  const foundationCourses = learningRecords.foundationCourses || {}
  const updatedAt = new Date().toISOString()
  const payload = {
    user_id: user.id,
    email: user.email || existing?.email || null,
    selected_role: existing?.selected_role || roleKey || null,
    role_title: existing?.role_title || roleTitle || null,
    preparation_checklist: existing?.preparation_checklist || [],
    completed_resources: existing?.completed_resources || [],
    learning_records: {
      ...learningRecords,
      foundationCourses: {
        ...foundationCourses,
        [jobKey]: {
          version,
          progress: progress || {},
          savedLines: Array.isArray(savedLines) ? savedLines.slice(0, 100) : [],
          placement: placement || null,
          updatedAt,
        },
      },
    },
    completed_course_details: existing?.completed_course_details || {},
    completed_checklist_count: existing?.completed_checklist_count || 0,
    checklist_total: existing?.checklist_total || 0,
    source_task_id: existing?.source_task_id || 5,
    preparation_status: existing?.preparation_status || 'in_progress',
    updated_at: updatedAt,
  }

  const { data, error } = await supabase
    .from('job_preparation_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) throw error
  return data
}
