import { supabase } from '../supabase'

export class CareerReportError extends Error {
  constructor(code, message, status = 0) {
    super(message)
    this.name = 'CareerReportError'
    this.code = code
    this.status = status
  }
}

export const getLatestCareerReport = async () => {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user?.id) return null

  const { data, error } = await supabase
    .from('career_reports')
    .select('profile, report, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new CareerReportError('REPORT_LOAD_FAILED', '暂时无法读取已生成的职业评估。')
  return data?.report ? data : null
}

export const generateCareerReport = async ({ profile, assessment }) => {
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session?.access_token) {
    throw new CareerReportError('LOGIN_REQUIRED', '请先登录后再生成职业评估。', 401)
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 90_000)
  const clientRequestId = globalThis.crypto?.randomUUID?.()
    || `career-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

  try {
    const response = await fetch('/api/career-report', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profile, assessment, clientRequestId }),
      signal: controller.signal,
    })
    const body = await response.json().catch(() => null)

    if (!response.ok || !body?.success) {
      throw new CareerReportError(
        body?.error?.code || `HTTP_${response.status}`,
        body?.error?.message || '职业评估暂时无法生成，请稍后重试。',
        response.status,
      )
    }

    return body.data
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new CareerReportError('AI_TIMEOUT', '生成超时，请稍后重试。', 504)
    }
    if (error instanceof CareerReportError) throw error
    throw new CareerReportError('NETWORK_ERROR', '无法连接职业评估服务，请检查网络后重试。')
  } finally {
    window.clearTimeout(timeoutId)
  }
}
