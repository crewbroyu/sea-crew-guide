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
const allowedTimelineValues = ['within_3_months', '3_6_months', '6_12_months', 'exploring']
const allowedStageValues = ['exploring', 'position_selected', 'interview_preparation', 'waiting_contract', 'waiting_onboard', 'experienced']
const allowedConcernValues = ['english', 'interview', 'experience', 'role_knowledge', 'medical_visa', 'route_reliability', 'cost', 'onboard_adaptation', 'other']
const allowedHardLimitValues = ['sales_targets', 'night_shifts', 'high_intensity', 'low_base_salary', 'long_contract', 'high_upfront_cost', 'none']

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
    if (message.includes('CAREER_REPORT_LIMIT_REACHED') || message.includes('CAREER_REPORT_ALREADY_GENERATED')) {
      throw new CareerReportApiError(429, 'RATE_LIMITED', '职业评估的两次生成机会已用完，请根据最新报告继续准备。')
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
    .select('profile, assessment_snapshot, report, created_at')
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

const sanitizeChoiceList = (value, allowedValues, max = 6) => Array.isArray(value)
  ? [...new Set(value.map((item) => trimText(item, 40)).filter((item) => allowedValues.includes(item)))]
    .sort((left, right) => allowedValues.indexOf(left) - allowedValues.indexOf(right))
    .slice(0, max)
  : []

const sanitizeProfile = (profile = {}) => {
  const hardLimits = sanitizeChoiceList(profile.hardLimits, allowedHardLimitValues)
  return {
    targetRole: trimText(profile.targetRole, 40),
    backupRole: trimText(profile.backupRole, 40),
    timeline: trimText(profile.timeline, 40),
    currentStage: trimText(profile.currentStage, 40),
    primaryConcern: trimText(profile.primaryConcern, 40),
    hardLimits: hardLimits.length > 1 ? hardLimits.filter((value) => value !== 'none') : hardLimits,
    additionalContext: redactSensitiveText(profile.additionalContext || profile.workSummary).slice(0, 500),
  }
}

const profilesMatch = (left, right) => JSON.stringify(sanitizeProfile(left)) === JSON.stringify(sanitizeProfile(right))

const normalizeList = (value, fallback, max = 4) => Array.isArray(value)
  ? value.map((item) => trimText(item, 220)).filter(Boolean).slice(0, max).concat([])
  : fallback

const profileLabels = {
  targetRole: Object.fromEntries([['undecided', '还不确定，希望获得推荐'], ...allowedRoles.map((role) => [role.id, role.title])]),
  timeline: { within_3_months: '希望 3 个月内上船', '3_6_months': '希望 3-6 个月上船', '6_12_months': '希望 6-12 个月上船', exploring: '上船时间暂未确定' },
  currentStage: {
    exploring: '刚开始了解海乘', position_selected: '已经确定目标岗位',
    interview_preparation: '正在准备或参加面试', waiting_contract: '已通过面试，等待合同',
    waiting_onboard: '已拿到合同，等待登船', experienced: '有过上船经历',
  },
  primaryConcern: {
    english: '英语听说跟不上', interview: '面试表现不稳定', experience: '相关经验不足',
    role_knowledge: '不了解岗位实际工作', medical_visa: '体检、签证或证件',
    route_reliability: '申请渠道是否可靠', cost: '前期费用和投入',
    onboard_adaptation: '上船后的适应问题', other: '其他问题',
  },
  hardLimit: {
    sales_targets: '不能接受强销售指标', night_shifts: '不能接受长期晚班',
    high_intensity: '不能接受高体力强度', low_base_salary: '不能接受较低底薪',
    long_contract: '不能接受较长合同', high_upfront_cost: '不能接受较高前期费用',
    none: '目前没有明确限制',
  },
}

const getProfileLabel = (field, value) => profileLabels[field]?.[value] || value || '尚未确认'

const getAssessmentEvidence = (assessment, scoreKey, dimensionKey, label) => {
  const practicalScore = Number(assessment?.practicalAssessment?.[scoreKey])
  if (Number.isFinite(practicalScore) && practicalScore > 0) return `${label} ${practicalScore}/100`
  const dimensionScore = Number(assessment?.dimensionScores?.[dimensionKey])
  return Number.isFinite(dimensionScore) && dimensionScore > 0 ? `${label} ${dimensionScore}/100` : '结合本次测评证据判断'
}

const normalizeDecisionBasis = (value, profile, assessment) => {
  const supplied = Array.isArray(value) ? value : []
  const basis = [
    { key: 'english', label: '当前英语水平', value: getAssessmentEvidence(assessment, 'englishScore', 'english', '英语实战'), impact: '英语水平会影响可比较岗位的沟通复杂度和准备周期。' },
    { key: 'experience', label: '相关工作经验', value: getAssessmentEvidence(assessment, 'serviceExperienceScore', 'service_experience', '经历核验'), impact: '已有经历决定哪些能力可以直接迁移到邮轮岗位。' },
    { key: 'entry_threshold', label: '岗位进入门槛', value: '结合前三个方向比较', impact: '门槛较低通常更利于先上船，但不等于收入或长期发展更优。' },
    { key: 'competitiveness', label: '当前竞争力', value: '以现有英语、经历和准备度综合判断', impact: '匹配度反映当前准备状态，不是录取概率。' },
    { key: 'core_goal', label: '你的核心诉求', value: `${getProfileLabel('targetRole', profile.targetRole)}；${getProfileLabel('timeline', profile.timeline)}；${getProfileLabel('currentStage', profile.currentStage)}`, impact: '核心诉求决定应优先比较目标岗位、上船速度还是现实限制。' },
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

const deriveDecisionRisks = (profile, positions, assessment) => {
  const primaryId = positions[0]?.id
  const risks = []
  if (profile.targetRole !== 'undecided' && profile.targetRole && primaryId !== profile.targetRole) {
    risks.push('测评优先方向与你当前首选岗位不同，需要确认是调整目标，还是针对首选岗位补齐差距。')
  }
  if (profile.hardLimits.includes('sales_targets') && ['bar', 'retail', 'beauty_spa'].includes(primaryId)) {
    risks.push('当前方向通常包含推荐销售或业绩要求，与你不能接受强销售指标的限制存在冲突。')
  }
  if (profile.hardLimits.includes('high_intensity') && ['bar', 'restaurant', 'housekeeping'].includes(primaryId)) {
    risks.push('当前方向通常工作节奏或体力强度较高，与你的限制存在冲突。')
  }
  if (profile.hardLimits.includes('night_shifts') && ['bar', 'front_office'].includes(primaryId)) {
    risks.push('当前方向可能涉及晚班或轮班，需要在接受岗位前确认实际排班。')
  }
  if (profile.timeline === 'within_3_months' && Number(assessment?.practicalAssessment?.englishScore || assessment?.dimensionScores?.english || 0) < 60) {
    risks.push('尽快申请与补足岗位英语之间存在时间冲突，需要先确认是优先上船还是继续准备。')
  }
  return risks
}

const normalizeManualCalibration = (value, profile, decisionRisks) => {
  const topics = normalizeList(value?.topics, [], 5)
  if (profile.timeline === 'within_3_months' || profile.primaryConcern === 'english') topics.push('先上船还是继续准备')
  if (profile.targetRole !== 'undecided' && profile.targetRole) topics.push('目标岗位还是测评优先方向')
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

const buildReport = (raw, fallbackRecommendations, profile, assessment = {}) => {
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
  const derivedRisks = deriveDecisionRisks(profile, positions, assessment)
  const decisionRisks = [...new Set([
    ...normalizeList(raw?.decisionRisks, [], 4),
    ...derivedRisks,
  ])].slice(0, 5)

  return {
    decisionPrinciple: 'AI 帮你缩小选择范围，但不替你做最终决定。',
    summary: softenDecisionLanguage(raw?.summary) || '你的岗位方向需要结合英语、经历、工作偏好和准备周期逐步确认。',
    decisionBasis: normalizeDecisionBasis(raw?.decisionBasis, profile, assessment),
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
    const validRoleIds = ['undecided', ...allowedRoles.map((role) => role.id)]
    const requiredProfileFields = ['targetRole', 'timeline', 'currentStage', 'primaryConcern']
    if (requiredProfileFields.some((field) => !profile[field]) || !profile.hardLimits.length) {
      throw new CareerReportApiError(400, 'INCOMPLETE_PROFILE', '请补全职业评估所需的信息。')
    }
    if (!validRoleIds.includes(profile.targetRole) || (profile.backupRole && !validRoleIds.slice(1).includes(profile.backupRole))) {
      throw new CareerReportApiError(400, 'INVALID_TARGET_ROLE', '请选择有效的目标岗位。')
    }
    if (!allowedTimelineValues.includes(profile.timeline)
      || !allowedStageValues.includes(profile.currentStage)
      || !allowedConcernValues.includes(profile.primaryConcern)) {
      throw new CareerReportApiError(400, 'INVALID_PROFILE_CHOICE', '求职目标中包含无效选项，请刷新页面后重新选择。')
    }
    if (profile.targetRole === 'undecided') profile.backupRole = ''
    if (profile.backupRole === profile.targetRole) profile.backupRole = ''

    const requestId = trimText(payload.clientRequestId, 200)
    if (!requestId) throw new CareerReportApiError(400, 'REQUEST_ID_REQUIRED', '本次职业评估请求无效，请重新提交。')
    const assessment = payload.assessment || {}
    const fallbackRecommendations = Array.isArray(assessment.ruleRecommendations) ? assessment.ruleRecommendations.slice(0, 3) : []
    const existingRecord = await getExistingCareerReport(supabase)
    const regenerate = payload.regenerate === true
    if (existingRecord && (!regenerate || profilesMatch(existingRecord.profile, profile))) {
      return {
        status: 200,
        body: {
          success: true,
          data: buildReport(
            existingRecord.report,
            fallbackRecommendations,
            sanitizeProfile(existingRecord.profile || profile),
            existingRecord.assessment_snapshot || assessment,
          ),
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
          { role: 'user', content: JSON.stringify({ profile, assessment: { assessmentVersion: Number(assessment.assessmentVersion) || null, overallScore: Number(assessment.overallScore) || 0, level: trimText(assessment.level, 80), serviceBackground: trimText(assessment.serviceBackground, 80), dimensionScores: assessment.dimensionScores || {}, practicalAssessment: assessment.practicalAssessment ? { englishScore: Number(assessment.practicalAssessment.englishScore) || 0, serviceExperienceScore: Number(assessment.practicalAssessment.serviceExperienceScore) || 0, evidenceConfidence: trimText(assessment.practicalAssessment.evidenceConfidence, 40), summary: trimText(assessment.practicalAssessment.summary, 800), priorities: Array.isArray(assessment.practicalAssessment.priorities) ? assessment.practicalAssessment.priorities.slice(0, 4).map((item) => trimText(item, 220)) : [], integrityFlags: Array.isArray(assessment.practicalAssessment.integrityFlags) ? assessment.practicalAssessment.integrityFlags.slice(0, 4).map((item) => trimText(item, 220)) : [], evidenceHighlights: Array.isArray(assessment.practicalAssessment.evidenceHighlights) ? assessment.practicalAssessment.evidenceHighlights.slice(0, 4).map((item) => ({ source: trimText(item?.source, 20), quote: trimText(item?.quote, 240), finding: trimText(item?.finding, 300) })) : [] } : null, ruleRecommendations: fallbackRecommendations } }) },
        ],
      }),
      signal: AbortSignal.timeout(75_000),
    })
      const rawReport = await parseProviderResponse(response)
      const report = buildReport(rawReport, fallbackRecommendations, profile, assessment)
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
