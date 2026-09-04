import { supabase } from '../supabase'

export class CareerReportError extends Error {
  constructor(code, message, status = 0) {
    super(message)
    this.name = 'CareerReportError'
    this.code = code
    this.status = status
  }
}

export const generateCareerReport = async ({ profile, assessment }) => {
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session?.access_token) {
    throw new CareerReportError('LOGIN_REQUIRED', '请先登录后再生成职业评估。', 401)
  }

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 90_000)

  try {
    const response = await fetch('/api/career-report', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profile, assessment }),
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
