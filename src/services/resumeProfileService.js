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

export const upsertMyResumeProfile = async ({
  personalInfo = {},
  professionalSummary = '',
  workExperience = [],
  education = [],
  skills = [],
  certificates = [],
  languages = [],
  sourceTaskId = 4,
} = {}) => {
  const user = await getCurrentUser()
  if (!user) return null

  const payload = removeUndefinedValues({
    user_id: user.id,
    email: user.email || personalInfo.email || null,
    name: personalInfo.name || user.user_metadata?.name || user.email?.split('@')[0] || null,
    phone: personalInfo.phone || null,
    nationality: personalInfo.nationality || null,
    location: personalInfo.location || null,
    passport_status: personalInfo.passportStatus || null,
    professional_summary: professionalSummary || null,
    work_experience: workExperience,
    education,
    skills,
    certificates,
    languages,
    source_task_id: sourceTaskId,
    resume_status: 'draft_ready',
    updated_at: new Date().toISOString(),
  })

  const { data, error } = await supabase
    .from('resume_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export const getMyResumeProfile = async () => {
  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('resume_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error
  return data
}
