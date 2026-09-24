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
const CAREER_REPORT_MAX_COMPLETION_TOKENS = 2500
const allowedRoles = [
  { id: 'retail', title: 'Retail Sales Associate' },
  { id: 'front_office', title: 'Guest Service Associate' },
  { id: 'bar', title: 'Bar Server' },
  { id: 'restaurant', title: 'Restaurant Assistant' },
  { id: 'housekeeping', title: 'Housekeeping' },
  { id: 'youth_staff', title: 'Youth Staff' },
  { id: 'beauty_spa', title: 'Beauty / SPA Specialist' },
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

const reserveCareerReport = async ({ supabase, requestId }) => {
  const { data, error } = await supabase.rpc('reserve_career_report_generation', {
    input_request_id: requestId,
  })

  if (error) {
    const message = error.message || ''
    if (message.includes('CAREER_REPORT_ALREADY_GENERATED')) {
      throw new CareerReportApiError(429, 'RATE_LIMITED', '免费职业评估已生成，请先根据报告完成岗位确认。')
    }
    if (message.includes('CAREER_REPORT_IN_PROGRESS')) {
      throw new CareerReportApiError(409, 'REPORT_IN_PROGRESS', '职业报告正在生成，请不要重复提交。')
    }
    console.error('Career report reservation failed:', message)
    throw new CareerReportApiError(503, 'REPORT_STORAGE_UNAVAILABLE', '职业报告存储尚未配置，请稍后再试。')
  }

  return data?.reservation_id || null
}

const finalizeCareerReport = async ({ supabase, reservationId, completed }) => {
  if (!reservationId) return
  const { error } = await supabase.rpc('finalize_career_report_generation', {
    input_reservation_id: reservationId,
    input_outcome: completed ? 'completed' : 'failed',
  })
  if (error) console.error('Career report reservation finalization failed:', error.message)
}

const getExistingCareerReport = async (supabase) => {
  const { data, error } = await supabase
    .from('career_reports')
    .select('profile, report, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Existing career report lookup failed:', error.message)
    return null
  }
  return data?.report && typeof data.report === 'object' ? data : null
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

const profileLabels = {
  englishLevel: { basic: '只能简单沟通', service: '可完成基础服务沟通', interview: '可用英文讲经历和回答常见问题' },
  experience: { none: '暂无相关经验', hospitality: '酒店/服务', restaurant_bar: '餐饮/酒吧', retail_sales: '零售/销售', front_office: '前台/接待', other: '其他可迁移经验' },
  goal: { stability: '先稳妥上船', income: '更看重收入', career: '更看重长期职业发展' },
  timeline: { within_3_months: '3 个月内开始申请', '3_6_months': '3-6 个月开始申请', '6_12_months': '6-12 个月开始申请', exploring: '先了解再决定' },
  workIntensity: { low: '希望节奏稳定', medium: '可接受忙碌', high: '能接受高强度和晚班' },
}

const getProfileLabel = (field, value) => profileLabels[field]?.[value] || value || '尚未确认'

const normalizeDecisionBasis = (value, profile) => {
  const supplied = Array.isArray(value) ? value : []
  const basis = [
    { key: 'english', label: '当前英语水平', value: getProfileLabel('englishLevel', profile.englishLevel), impact: '英语水平会影响可比较岗位的沟通复杂度和准备周期。' },
    { key: 'experience', label: '相关工作经验', value: getProfileLabel('experience', profile.experience), impact: '已有经历决定哪些能力可以直接迁移到邮轮岗位。' },
    { key: 'entry_threshold', label: '岗位进入门槛', value: '结合前三个方向比较', impact: '门槛较低通常更利于先上船，但不等于收入或长期发展更优。' },
    { key: 'competitiveness', label: '当前竞争力', value: '以现有英语、经历和准备度综合判断', impact: '匹配度反映当前准备状态，不是录取概率。' },
    { key: 'core_goal', label: '你的核心诉求', value: `${getProfileLabel('goal', profile.goal)}；${getProfileLabel('timeline', profile.timeline)}；${getProfileLabel('workIntensity', profile.workIntensity)}`, impact: '核心诉求决定应优先考虑上船速度、收入、强度还是长期发展。' },
  ]

  return basis.map((fallback) => {
    const item = supplied.find((candidate) => candidate?.key === fallback.key)
    return {
      key: fallback.key,
      label: trimText(item?.label, 80) || fallback.label,
      value: trimText(item?.value, 180) || fallback.value,
      impact: trimText(item?.impact, 260) || fallback.impact,
    }
  })
}

const deriveDecisionRisks = (profile, positions) => {
  const primaryId = positions[0]?.id
  const risks = []
  if (profile.goal === 'income' && ['restaurant', 'housekeeping'].includes(primaryId)) {
    risks.push('当前推荐更偏向解决“先上船”问题，不一定是长期收益最优方案。')
  }
  if (profile.goal === 'career' && ['restaurant', 'housekeeping'].includes(primaryId)) {
    risks.push('当前较容易进入的方向，与长期职业发展最优方向可能并不相同。')
  }
  if (profile.workIntensity === 'low' && ['bar', 'restaurant', 'housekeeping'].includes(primaryId)) {
    risks.push('当前优先方向通常工作节奏较快或体力强度较高，与你希望节奏稳定的诉求存在冲突。')
  }
  if (profile.timeline === 'within_3_months' && profile.englishLevel === 'basic') {
    risks.push('尽快申请与补足岗位英语之间存在时间冲突，需要先确认是优先上船还是继续准备。')
  }
  return risks
}

const normalizeManualCalibration = (value, profile, decisionRisks) => {
  const topics = normalizeList(value?.topics, [], 5)
  if (profile.timeline === 'within_3_months' || profile.englishLevel === 'basic') topics.push('先上船还是继续准备')
  if (profile.goal === 'income') topics.push('低门槛岗位还是高收入岗位')
  if (profile.goal === 'career') topics.push('短期进入机会还是长期职业路径')
  if (decisionRisks.length) topics.push('是否接受短期妥协换取船上经验')

  return {
    recommended: value?.recommended !== false,
    topics: [...new Set(topics)].slice(0, 5),
    message: trimText(value?.message, 360) || '这类选择涉及收入、时间成本和长期职业路径，不建议只依据一次 AI 测评决定，可结合人工咨询进一步校准。',
  }
}

const softenDecisionLanguage = (value) => trimText(value, 500)
  .replace(/你最适合(?:做|申请)?/g, '基于目前信息，可优先比较')
  .replace(/你应该直接申请/g, '如果相应优先级成立，可以考虑申请')
  .replace(/就是你的最佳选择/g, '是当前可比较的方向之一')

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

const buildReport = (raw, fallbackRecommendations, profile) => {
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
  const derivedRisks = deriveDecisionRisks(profile, positions)
  const decisionRisks = [...new Set([
    ...normalizeList(raw?.decisionRisks, [], 4),
    ...derivedRisks,
  ])].slice(0, 5)

  return {
    decisionPrinciple: 'AI 帮你缩小选择范围，但不替你做最终决定。',
    summary: softenDecisionLanguage(raw?.summary) || '你的岗位方向需要结合英语、经历、工作偏好和准备周期逐步确认。',
    decisionBasis: normalizeDecisionBasis(raw?.decisionBasis, profile),
    decisionRisks: decisionRisks.length ? decisionRisks : ['方向匹配度只反映当前信息；收入、工作强度和长期发展仍需在岗位确认前逐项比较。'],
    manualCalibration: normalizeManualCalibration(raw?.manualCalibration, profile, decisionRisks),
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
    const config = getConfig(env)
    requireConfig(config)
    const { supabase } = await authenticateRequest({ headers, config })

    const profile = sanitizeProfile(payload.profile)
    const requiredProfileFields = ['ageRange', 'education', 'englishLevel', 'experience', 'goal', 'timeline', 'budget', 'salesTolerance', 'workIntensity']
    if (requiredProfileFields.some((field) => !profile[field])) throw new CareerReportApiError(400, 'INCOMPLETE_PROFILE', '请补全职业评估所需的信息。')

    const requestId = trimText(payload.clientRequestId, 200)
    if (!requestId) throw new CareerReportApiError(400, 'REQUEST_ID_REQUIRED', '本次职业评估请求无效，请重新提交。')
    const assessment = payload.assessment || {}
    const fallbackRecommendations = Array.isArray(assessment.ruleRecommendations) ? assessment.ruleRecommendations.slice(0, 3) : []
    const existingRecord = await getExistingCareerReport(supabase)
    if (existingRecord) {
      return {
        status: 200,
        body: {
          success: true,
          data: buildReport(existingRecord.report, fallbackRecommendations, existingRecord.profile || profile),
          meta: { reusedExistingReport: true },
        },
      }
    }

    const reservationId = await reserveCareerReport({ supabase, requestId })
    let completed = false

    try {
    const response = await fetch(`${config.textBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        enable_thinking: false,
        temperature: 0.2,
        max_completion_tokens: CAREER_REPORT_MAX_COMPLETION_TOKENS,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildCareerAdvisorSystemPrompt({ roleChoices: allowedRoles.map((role) => `${role.id} (${role.title})`).join('、') }) },
          { role: 'user', content: JSON.stringify({ profile, assessment: { assessmentVersion: Number(assessment.assessmentVersion) || null, overallScore: Number(assessment.overallScore) || 0, level: trimText(assessment.level, 80), serviceBackground: trimText(assessment.serviceBackground, 80), dimensionScores: assessment.dimensionScores || {}, practicalAssessment: assessment.practicalAssessment ? { englishScore: Number(assessment.practicalAssessment.englishScore) || 0, serviceExperienceScore: Number(assessment.practicalAssessment.serviceExperienceScore) || 0, evidenceConfidence: trimText(assessment.practicalAssessment.evidenceConfidence, 40), summary: trimText(assessment.practicalAssessment.summary, 800), priorities: Array.isArray(assessment.practicalAssessment.priorities) ? assessment.practicalAssessment.priorities.slice(0, 4).map((item) => trimText(item, 220)) : [], integrityFlags: Array.isArray(assessment.practicalAssessment.integrityFlags) ? assessment.practicalAssessment.integrityFlags.slice(0, 4).map((item) => trimText(item, 220)) : [] } : null, ruleRecommendations: fallbackRecommendations } }) },
        ],
      }),
      signal: AbortSignal.timeout(75_000),
    })
      const rawReport = await parseProviderResponse(response)
      const report = buildReport(rawReport, fallbackRecommendations, profile)
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
      completed = true
      return { status: 200, body: { success: true, data: report } }
    } finally {
      await finalizeCareerReport({ supabase, reservationId, completed })
    }
  } catch (error) {
    if (error instanceof SyntaxError) return { status: 400, body: { success: false, error: { code: 'INVALID_JSON', message: '请求格式无效。' } } }
    if (error instanceof CareerReportApiError) return { status: error.status, body: { success: false, error: { code: error.code, message: error.message } } }
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') return { status: 504, body: { success: false, error: { code: 'AI_TIMEOUT', message: '生成超时，请稍后重试。' } } }
    console.error('Career report API failed:', error)
    return { status: 500, body: { success: false, error: { code: 'INTERNAL_ERROR', message: '职业评估服务暂时出错。' } } }
  }
}
