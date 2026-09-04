import { createClient } from '@supabase/supabase-js'
import process from 'node:process'
import {
  advisorDecisionStages,
  advisorIntentIds,
  advisorRiskFlagIds,
  AI_CREW_YUGE_FRAMEWORK_VERSION,
  buildCareerAdvisorSystemPrompt,
} from './aiCrewYugeFramework.js'

const DEFAULT_TEXT_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1'
const DEFAULT_MODEL = 'qwen3.5-plus'
const REPORT_LIMIT = 1
const allowedRoles = [
  { id: 'retail', title: 'Retail Sales Associate' },
  { id: 'front_office', title: 'Guest Service Associate' },
  { id: 'bar', title: 'Bar Server' },
  { id: 'restaurant', title: 'Restaurant Assistant' },
  { id: 'housekeeping', title: 'Housekeeping' },
]

class CareerReportApiError extends Error {
  constructor(status, code, message) {
    super(message)
    this.name = 'CareerReportApiError'
    this.status = status
    this.code = code
  }
}

const trimText = (value, maxLength = 2000) => typeof value === 'string' ? value.trim().slice(0, maxLength) : ''

const getHeader = (headers, name) => {
  if (!headers) return ''
  if (typeof headers.get === 'function') return headers.get(name) || ''
  const target = name.toLowerCase()
  return Object.entries(headers).find(([key]) => key.toLowerCase() === target)?.[1] || ''
}

const getConfig = (env = process.env) => ({
  apiKey: trimText(env.DASHSCOPE_API_KEY, 500),
  textBaseUrl: (env.DASHSCOPE_BASE_URL || DEFAULT_TEXT_BASE_URL).replace(/\/+$/, ''),
  model: trimText(env.DASHSCOPE_CAREER_REPORT_MODEL, 100) || trimText(env.DASHSCOPE_EVALUATION_MODEL, 100) || DEFAULT_MODEL,
  supabaseUrl: trimText(env.SUPABASE_URL || env.VITE_SUPABASE_URL, 500),
  supabaseAnonKey: trimText(env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY, 1000),
})

const requireConfig = (config) => {
  if (!config.apiKey) throw new CareerReportApiError(503, 'AI_NOT_CONFIGURED', '职业评估服务尚未配置。')
  if (!config.supabaseUrl || !config.supabaseAnonKey) throw new CareerReportApiError(503, 'AUTH_NOT_CONFIGURED', '登录验证服务尚未配置。')
}

const authenticateRequest = async ({ headers, config }) => {
  const token = getHeader(headers, 'authorization').match(/^Bearer\s+(.+)$/i)?.[1]?.trim()
  if (!token) throw new CareerReportApiError(401, 'LOGIN_REQUIRED', '请先登录后再生成职业评估。')

  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user?.id) throw new CareerReportApiError(401, 'LOGIN_REQUIRED', '登录状态已失效，请重新登录。')
  return { user, supabase }
}

const redactSensitiveText = (value) => trimText(value, 1000)
  .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[已隐藏邮箱]')
  .replace(/(?<!\d)1[3-9]\d{9}(?!\d)/g, '[已隐藏手机号]')
  .replace(/(?:微信|wechat|vx|v信)\s*[:：]\s*[\w-]+/gi, '[已隐藏联系方式]')

const sanitizeProfile = (profile = {}) => ({
  ageRange: trimText(profile.ageRange, 40),
  education: trimText(profile.education, 40),
  englishLevel: trimText(profile.englishLevel, 40),
  experience: trimText(profile.experience, 40),
  goal: trimText(profile.goal, 40),
  timeline: trimText(profile.timeline, 40),
  budget: trimText(profile.budget, 40),
  salesTolerance: trimText(profile.salesTolerance, 40),
  workIntensity: trimText(profile.workIntensity, 40),
  workSummary: redactSensitiveText(profile.workSummary),
})

const normalizeList = (value, fallback, max = 4) => Array.isArray(value)
  ? value.map((item) => trimText(item, 220)).filter(Boolean).slice(0, max).concat([])
  : fallback

const normalizeSignals = (signals = {}) => ({
  intentTags: Array.isArray(signals.intentTags)
    ? signals.intentTags.filter((item) => advisorIntentIds.includes(item)).slice(0, 3)
    : ['career_decision', 'position_match'],
  decisionStage: advisorDecisionStages.includes(signals.decisionStage)
    ? signals.decisionStage
    : 'position_selection',
  confidence: ['high', 'medium', 'low'].includes(signals.confidence) ? signals.confidence : 'medium',
  missingInformation: normalizeList(signals.missingInformation, [], 3),
  riskFlags: Array.isArray(signals.riskFlags)
    ? signals.riskFlags.filter((item) => advisorRiskFlagIds.includes(item)).slice(0, 4)
    : [],
})

const normalizeRole = (role, fallback, index) => {
  const valid = allowedRoles.find((item) => item.id === role?.id) || fallback
  return {
    id: valid.id,
    title: valid.title,
    matchScore: Math.max(35, Math.min(95, Math.round(Number(role?.matchScore) || fallback.matchScore || 60))),
    reasons: normalizeList(role?.reasons, ['请结合你的已有经历和岗位要求进一步确认。'], 3),
    risks: normalizeList(role?.risks, ['投递前先确认英语、工作强度和岗位经验是否匹配。'], 3),
    nextSteps: normalizeList(role?.nextSteps, ['完成岗位介绍和基础准备。'], 3),
    rank: index + 1,
  }
}

const parseProviderResponse = async (response) => {
  const raw = await response.text()
  let body
  try { body = JSON.parse(raw) } catch { body = { message: raw.slice(0, 500) } }
  if (!response.ok) {
    console.error('Career report provider failed:', body.code || response.status, body.message || body.error?.message)
    throw new CareerReportApiError(502, 'AI_PROVIDER_ERROR', '职业评估服务暂时不可用，请稍后重试。')
  }
  const content = body.choices?.[0]?.message?.content
  try { return JSON.parse(content) } catch { throw new CareerReportApiError(502, 'INVALID_AI_RESPONSE', '职业评估生成不完整，请重新提交。') }
}

const buildReport = (raw, fallbackRecommendations) => {
  const fallback = fallbackRecommendations
    .map((item) => ({ ...allowedRoles.find((role) => role.id === item.id), matchScore: item.matchScore }))
    .filter((item) => item.id)
  const selected = Array.isArray(raw?.recommendedPositions) ? raw.recommendedPositions : []
  const usedRoleIds = new Set()
  const positions = [0, 1, 2].map((index) => {
    const requested = selected.find((item) => !usedRoleIds.has(item?.id))
    const fallbackRole = fallback.find((item) => !usedRoleIds.has(item.id))
      || allowedRoles.find((item) => !usedRoleIds.has(item.id))
      || allowedRoles[0]
    const normalized = normalizeRole(requested, fallbackRole, index)
    usedRoleIds.add(normalized.id)
    return normalized
  })
  const routeId = ['diy', 'guide', 'agent'].includes(raw?.applicationRoute?.id) ? raw.applicationRoute.id : 'guide'
  const routeTitles = { diy: '低成本 DIY 路线', guide: '指导型 DIY 路线', agent: '渠道协助路线' }

  return {
    summary: trimText(raw?.summary, 500) || '你的岗位方向需要结合英语、经历、工作偏好和准备周期逐步确认。',
    recommendedPositions: positions,
    notRecommended: normalizeList(raw?.notRecommended, ['暂不建议只看岗位名称或收入决定方向，应先确认英语和工作强度。'], 3),
    applicationRoute: {
      id: routeId,
      title: routeTitles[routeId],
      reason: trimText(raw?.applicationRoute?.reason, 360) || '根据目前信息，先完成岗位准备和材料梳理后再选择具体申请渠道。',
    },
    next30Days: normalizeList(raw?.next30Days, ['确认主申岗位与备选岗位。', '补齐一个最影响投递的短板。', '整理英文简历所需的真实经历。'], 4),
    advisorSignals: normalizeSignals(raw?.advisorSignals),
    generatedAt: new Date().toISOString(),
    frameworkVersion: AI_CREW_YUGE_FRAMEWORK_VERSION,
  }
}

export const handleCareerReportRequest = async ({ method, headers, body, env = process.env }) => {
  try {
    if (method !== 'POST') throw new CareerReportApiError(405, 'METHOD_NOT_ALLOWED', '仅支持 POST 请求。')
    const payload = typeof body === 'string' ? JSON.parse(body) : body || {}
    const profile = sanitizeProfile(payload.profile)
    const requiredProfileFields = ['ageRange', 'education', 'englishLevel', 'experience', 'goal', 'timeline', 'budget', 'salesTolerance', 'workIntensity']
    if (requiredProfileFields.some((field) => !profile[field])) throw new CareerReportApiError(400, 'INCOMPLETE_PROFILE', '请补全职业评估所需的信息。')

    const config = getConfig(env)
    requireConfig(config)
    const { supabase } = await authenticateRequest({ headers, config })
    const { count, error: reportCountError } = await supabase
      .from('career_reports')
      .select('id', { count: 'exact', head: true })

    if (reportCountError) {
      console.error('Career report quota lookup failed:', reportCountError.message)
      throw new CareerReportApiError(503, 'REPORT_STORAGE_UNAVAILABLE', '职业报告存储尚未配置，请稍后再试。')
    }
    if ((count || 0) >= REPORT_LIMIT) {
      throw new CareerReportApiError(429, 'RATE_LIMITED', '免费职业评估已生成，请先根据报告完成岗位确认。')
    }
    const assessment = payload.assessment || {}
    const fallbackRecommendations = Array.isArray(assessment.ruleRecommendations) ? assessment.ruleRecommendations.slice(0, 3) : []
    const response = await fetch(`${config.textBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        enable_thinking: false,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildCareerAdvisorSystemPrompt({ roleChoices: allowedRoles.map((role) => `${role.id} (${role.title})`).join('、') }) },
          { role: 'user', content: JSON.stringify({ profile, assessment: { overallScore: Number(assessment.overallScore) || 0, level: trimText(assessment.level, 80), serviceBackground: trimText(assessment.serviceBackground, 80), dimensionScores: assessment.dimensionScores || {}, ruleRecommendations: fallbackRecommendations } }) },
        ],
      }),
      signal: AbortSignal.timeout(75_000),
    })
    const rawReport = await parseProviderResponse(response)
    const report = buildReport(rawReport, fallbackRecommendations)
    const { error } = await supabase.rpc('save_ai_advisor_career_report', {
      input_profile: profile,
      input_assessment: assessment,
      input_report: report,
      input_model: config.model,
      input_intent_tags: report.advisorSignals.intentTags,
      input_decision_stage: report.advisorSignals.decisionStage,
      input_confidence: report.advisorSignals.confidence,
      input_missing_information: report.advisorSignals.missingInformation,
      input_risk_flags: report.advisorSignals.riskFlags,
      input_framework_version: AI_CREW_YUGE_FRAMEWORK_VERSION,
    })
    if (error) {
      console.error('Career report persistence failed:', error.message)
      throw new CareerReportApiError(503, 'REPORT_SAVE_FAILED', '报告已生成，但暂时无法保存，请稍后重新生成。')
    }
    return { status: 200, body: { success: true, data: report } }
  } catch (error) {
    if (error instanceof SyntaxError) return { status: 400, body: { success: false, error: { code: 'INVALID_JSON', message: '请求格式无效。' } } }
    if (error instanceof CareerReportApiError) return { status: error.status, body: { success: false, error: { code: error.code, message: error.message } } }
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') return { status: 504, body: { success: false, error: { code: 'AI_TIMEOUT', message: '生成超时，请稍后重试。' } } }
    console.error('Career report API failed:', error)
    return { status: 500, body: { success: false, error: { code: 'INTERNAL_ERROR', message: '职业评估服务暂时出错。' } } }
  }
}
