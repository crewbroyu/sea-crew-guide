import { supabase } from '../supabase'

const isCurrentEntitlement = (entitlement) => (
  entitlement?.status === 'active'
  && (!entitlement.expires_at || new Date(entitlement.expires_at).getTime() > Date.now())
)

const remaining = (limit, used) => (limit === null || limit === undefined ? null : Math.max(Number(limit) - used, 0))

export const getMyProductUsage = async (productCode) => {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user?.id || !productCode) return null

  const { data: entitlement, error: entitlementError } = await supabase
    .from('user_entitlements')
    .select('user_id, product_code, status, starts_at, expires_at, ai_feedback_limit, mock_interview_limit')
    .eq('user_id', user.id)
    .eq('product_code', productCode)
    .maybeSingle()

  if (entitlementError) throw entitlementError
  if (!isCurrentEntitlement(entitlement)) return { active: false, productCode }

  const usageSince = entitlement.starts_at || new Date(0).toISOString()
  const [feedbackResult, mockResult] = await Promise.all([
    supabase
      .from('ai_usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('product_code', productCode)
      .eq('action', 'evaluate')
      .gte('created_at', usageSince),
    supabase
      .from('ai_usage_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('product_code', productCode)
      .eq('action', 'mock_interview')
      .gte('created_at', usageSince),
  ])

  if (feedbackResult.error) throw feedbackResult.error
  if (mockResult.error) throw mockResult.error

  const feedbackUsed = feedbackResult.count || 0
  const mockUsed = mockResult.count || 0

  return {
    active: true,
    productCode,
    expiresAt: entitlement.expires_at || null,
    feedback: {
      used: feedbackUsed,
      limit: entitlement.ai_feedback_limit,
      remaining: remaining(entitlement.ai_feedback_limit, feedbackUsed),
    },
    mockInterview: {
      used: mockUsed,
      limit: entitlement.mock_interview_limit,
      remaining: remaining(entitlement.mock_interview_limit, mockUsed),
    },
  }
}
