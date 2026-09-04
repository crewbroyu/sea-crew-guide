import { supabase } from '../supabase'

export const createSupportRequest = async ({ category, message }) => {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user?.id) throw new Error('请先登录后再提交问题。')

  const { data, error } = await supabase
    .from('support_requests')
    .insert({ user_id: user.id, category, message: message.trim() })
    .select('id, category, message, status, created_at')
    .single()

  if (error) throw error
  return data
}
