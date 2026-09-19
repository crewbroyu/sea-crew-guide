import { createClient } from '@supabase/supabase-js'
import process from 'node:process'

const DEFAULT_TTS_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'
const DEFAULT_TTS_MODEL = 'qwen3-tts-flash'
const DEFAULT_TTS_VOICE = 'Cherry'
const MAX_TEXT_LENGTH = 300
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const RATE_LIMIT_REQUESTS = 20
const usageBuckets = new Map()

const POSITION_PRODUCTS = new Map([
  ['bar_server', 'bar_server_pack'],
  ['bar-server', 'bar_server_pack'],
  ['bar server', 'bar_server_pack'],
  ['retail', 'retail_sales_pack'],
  ['retail_sales', 'retail_sales_pack'],
  ['retail sales', 'retail_sales_pack'],
  ['retail sales associate', 'retail_sales_pack'],
])

class TtsApiError extends Error {
  constructor(status, code, message) {
    super(message)
    this.name = 'TtsApiError'
    this.status = status
    this.code = code
  }
}

const trimText = (value, maxLength = 1000) => typeof value === 'string'
  ? value.trim().slice(0, maxLength)
  : ''

const getHeader = (headers, name) => {
  if (!headers) return ''
  if (typeof headers.get === 'function') return headers.get(name) || ''
  const target = name.toLowerCase()
  return Object.entries(headers).find(([key]) => key.toLowerCase() === target)?.[1] || ''
}

const getConfig = (env = process.env) => ({
  apiKey: trimText(env.DASHSCOPE_API_KEY, 500),
  ttsUrl: trimText(env.DASHSCOPE_TTS_URL || env.DASHSCOPE_ASR_URL, 1000) || DEFAULT_TTS_URL,
  model: trimText(env.DASHSCOPE_TTS_MODEL, 100) || DEFAULT_TTS_MODEL,
  voice: trimText(env.DASHSCOPE_TTS_VOICE, 100) || DEFAULT_TTS_VOICE,
  supabaseUrl: trimText(env.SUPABASE_URL || env.VITE_SUPABASE_URL, 500),
  supabaseAnonKey: trimText(env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY, 1000),
})

const authenticateRequest = async ({ headers, config }) => {
  const token = getHeader(headers, 'authorization').match(/^Bearer\s+(.+)$/i)?.[1]?.trim()
  if (!token) throw new TtsApiError(401, 'LOGIN_REQUIRED', '登录后可使用自然语音。')

  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user?.id) throw new TtsApiError(401, 'LOGIN_REQUIRED', '登录状态已失效。')
  return { user, supabase }
}

const getProductCode = (position) => POSITION_PRODUCTS.get(trimText(position, 120).toLowerCase()) || null

const verifyProductAccess = async ({ user, supabase, productCode }) => {
  const { data: access, error: accessError } = await supabase
    .from('user_access')
    .select('role, access_status')
    .eq('user_id', user.id)
    .maybeSingle()
  if (accessError) throw new TtsApiError(503, 'ACCESS_CHECK_FAILED', '暂时无法验证岗位权益。')

  const isAdmin = access?.role === 'admin' && access?.access_status === 'active'
  if (isAdmin) return { isAdmin: true }

  const { data: entitlement, error } = await supabase
    .from('user_entitlements')
    .select('product_code, status, expires_at')
    .eq('user_id', user.id)
    .eq('product_code', productCode)
    .eq('status', 'active')
    .maybeSingle()
  if (error) throw new TtsApiError(503, 'ACCESS_CHECK_FAILED', '暂时无法验证岗位权益。')

  const isCurrent = entitlement && (!entitlement.expires_at || new Date(entitlement.expires_at).getTime() > Date.now())
  if (!isCurrent) {
    throw new TtsApiError(403, 'NATURAL_TTS_REQUIRES_PACK', '自然语音仅供已解锁对应岗位包的用户使用。')
  }
  return { isAdmin: false }
}

const reserveQuota = async ({ supabase, productCode, requestId }) => {
  const { data, error } = await supabase.rpc('reserve_ai_usage_quota', {
    input_product_code: productCode,
    input_action: 'tts',
    input_mode: 'natural_tts',
    input_scenario_id: null,
    input_request_id: requestId,
  })
  if (!error) return data?.reservation_id || null

  const message = error.message || ''
  if (message.includes('AI_QUOTA_EXHAUSTED')) {
    throw new TtsApiError(429, 'TTS_DAILY_QUOTA_EXHAUSTED', '今天的自然语音额度已用完，已切换为浏览器语音。')
  }
  if (message.includes('ACTIVATION_REQUIRED')) {
    throw new TtsApiError(403, 'NATURAL_TTS_REQUIRES_PACK', '自然语音仅供已解锁对应岗位包的用户使用。')
  }
  if (message.includes('AI_REQUEST_IN_PROGRESS')) {
    throw new TtsApiError(409, 'TTS_REQUEST_IN_PROGRESS', '这条语音正在生成。')
  }
  if (message.includes('AI_REQUEST_ALREADY_COMPLETED')) {
    throw new TtsApiError(409, 'TTS_REQUEST_ALREADY_COMPLETED', '这条语音已经生成，请重新播放。')
  }
  if (message.includes('AI_FAILURE_LIMIT_REACHED')) {
    throw new TtsApiError(429, 'TTS_FAILURE_LIMIT_REACHED', '自然语音重试较多，已切换为浏览器语音。')
  }
  console.error('TTS quota reservation failed:', error.message)
  throw new TtsApiError(503, 'QUOTA_CHECK_FAILED', '暂时无法核对自然语音额度。')
}

const finalizeQuota = async ({ supabase, reservationId, outcome }) => {
  if (!reservationId) return
  const { error } = await supabase.rpc('finalize_ai_usage_reservation', {
    input_reservation_id: reservationId,
    input_outcome: outcome,
  })
  if (error) console.error('TTS quota finalization failed:', error.message)
}

const recordUsage = async ({ supabase, productCode, requestId, model }) => {
  const { error } = await supabase.rpc('record_ai_usage_event', {
    input_product_code: productCode,
    input_action: 'tts',
    input_mode: 'natural_tts',
    input_scenario_id: null,
    input_provider: 'dashscope',
    input_model: model,
    input_request_id: requestId,
  })
  if (error) throw new TtsApiError(503, 'USAGE_RECORD_FAILED', '自然语音记录暂时无法保存。')
}

const enforceRateLimit = (userId) => {
  const now = Date.now()
  const current = usageBuckets.get(userId)
  if (!current || now - current.startedAt >= RATE_LIMIT_WINDOW_MS) {
    usageBuckets.set(userId, { startedAt: now, count: 1 })
    return
  }
  if (current.count >= RATE_LIMIT_REQUESTS) {
    throw new TtsApiError(429, 'RATE_LIMITED', '自然语音请求较多，请稍后再试。')
  }
  current.count += 1
}

export const handleTtsRequest = async ({ method, headers, body, env = process.env }) => {
  let quotaContext = null
  try {
    if (method !== 'POST') throw new TtsApiError(405, 'METHOD_NOT_ALLOWED', '仅支持 POST 请求。')

    const config = getConfig(env)
    if (!config.apiKey) throw new TtsApiError(503, 'TTS_NOT_CONFIGURED', '自然语音服务尚未配置。')
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      throw new TtsApiError(503, 'AUTH_NOT_CONFIGURED', '登录验证服务尚未配置。')
    }

    const text = trimText(body?.text, MAX_TEXT_LENGTH + 1)
    if (!text) throw new TtsApiError(400, 'TEXT_REQUIRED', '没有可朗读的英文内容。')
    if (text.length > MAX_TEXT_LENGTH) {
      throw new TtsApiError(413, 'TEXT_TOO_LONG', `单次朗读不能超过 ${MAX_TEXT_LENGTH} 个字符。`)
    }

    const productCode = getProductCode(body?.position)
    if (!productCode) {
      throw new TtsApiError(403, 'NATURAL_TTS_NOT_AVAILABLE', '该内容使用浏览器语音。')
    }
    const requestId = trimText(body?.clientRequestId, 200)
    if (!requestId) throw new TtsApiError(400, 'REQUEST_ID_REQUIRED', '自然语音请求缺少唯一编号。')

    const { user, supabase } = await authenticateRequest({ headers, config })
    const { isAdmin } = await verifyProductAccess({ user, supabase, productCode })
    enforceRateLimit(user.id)

    const reservationId = isAdmin ? null : await reserveQuota({ supabase, productCode, requestId })
    quotaContext = { supabase, reservationId }

    const providerResponse = await fetch(config.ttsUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        input: {
          text,
          voice: config.voice,
          language_type: 'English',
        },
      }),
    })
    const providerBody = await providerResponse.json().catch(() => null)
    const rawAudioUrl = providerBody?.output?.audio?.url
    if (!providerResponse.ok || !rawAudioUrl) {
      console.error('DashScope TTS failed:', providerBody?.code || providerResponse.status, providerBody?.message || '')
      throw new TtsApiError(502, 'TTS_PROVIDER_ERROR', '自然语音暂时不可用。')
    }

    await recordUsage({ supabase, productCode, requestId, model: config.model })
    await finalizeQuota({ supabase, reservationId, outcome: 'completed' })
    quotaContext = null

    const audioUrl = rawAudioUrl.replace(/^http:\/\//i, 'https://')
    return {
      status: 200,
      body: {
        success: true,
        data: {
          audioUrl,
          expiresAt: providerBody.output.audio.expires_at || null,
          provider: 'dashscope',
          model: config.model,
          characters: providerBody.usage?.characters || text.length,
        },
      },
    }
  } catch (error) {
    if (quotaContext) {
      await finalizeQuota({ ...quotaContext, outcome: 'released' })
    }
    const status = error instanceof TtsApiError ? error.status : 500
    const code = error instanceof TtsApiError ? error.code : 'TTS_INTERNAL_ERROR'
    if (!(error instanceof TtsApiError)) console.error('TTS request failed:', error)
    return {
      status,
      body: { success: false, error: { code, message: error.message || '自然语音暂时不可用。' } },
    }
  }
}
