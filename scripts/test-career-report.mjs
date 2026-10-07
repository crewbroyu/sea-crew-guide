import assert from 'node:assert/strict'
import { handleCareerReportRequest } from '../server/careerReport.js'

const originalFetch = global.fetch
const calls = []
let existingCareerRecord = null
let completedReportCount = 0
let reportLimitReached = false
let reportInProgress = false
let reportLookupFailure = false
let reportSaveFailure = false
let providerOverride = null
const completedReportPayloads = []
const finalizedOutcomes = []
const assessmentCompletedAt = '2026-10-07T01:00:00.000Z'
const revisionCompletedAt = '2026-10-07T02:00:00.000Z'

global.fetch = async (url, options = {}) => {
  calls.push({ url: String(url), options })
  if (String(url).includes('/auth/v1/user')) {
    return new Response(JSON.stringify({ id: '11111111-1111-4111-8111-111111111111', email: 'test@example.com' }), { status: 200 })
  }
  if (String(url).includes('/rest/v1/career_reports')) {
    if (reportLookupFailure) {
      return new Response(JSON.stringify({ message: 'database unavailable' }), { status: 503, headers: { 'content-type': 'application/json' } })
    }
    if (existingCareerRecord) {
      const assessmentFilter = new URL(String(url)).searchParams.get('assessment_snapshot') || ''
      const requestedAssessment = assessmentFilter.startsWith('cs.')
        ? JSON.parse(assessmentFilter.slice(3))
        : null
      const matches = requestedAssessment
        && Number(requestedAssessment.assessmentVersion) === Number(existingCareerRecord.assessment_snapshot?.assessmentVersion)
        && requestedAssessment.completedAt === existingCareerRecord.assessment_snapshot?.completedAt
      return new Response(JSON.stringify(matches ? existingCareerRecord : []), { status: 200, headers: { 'content-type': 'application/json' } })
    }
    return new Response(JSON.stringify([]), { status: 200, headers: { 'content-range': '*/0', 'content-type': 'application/json' } })
  }
  if (String(url).includes('/rest/v1/rpc/reserve_career_report_generation')) {
    if (reportLimitReached) {
      return new Response(JSON.stringify({ message: 'CAREER_REPORT_LIMIT_REACHED' }), { status: 400, headers: { 'content-type': 'application/json' } })
    }
    if (reportInProgress) {
      return new Response(JSON.stringify({ message: 'CAREER_REPORT_IN_PROGRESS' }), { status: 409, headers: { 'content-type': 'application/json' } })
    }
    return new Response(JSON.stringify({ reservation_id: '33333333-3333-4333-8333-333333333333' }), { status: 200 })
  }
  if (String(url).includes('/rest/v1/rpc/finalize_career_report_generation')) {
    finalizedOutcomes.push(JSON.parse(options.body).input_outcome)
    return new Response(JSON.stringify(true), { status: 200 })
  }
  if (String(url).includes('/chat/completions')) {
    if (providerOverride) return providerOverride()
    return new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({
        summary: '你最适合做 Bar Server。',
        decisionBasis: [
          { key: 'english', label: '当前英语水平', value: '基础服务沟通', impact: '可以处理标准服务对话。' },
          { key: 'experience', label: '相关工作经验', value: '餐饮服务', impact: '服务经验可以迁移。' },
          { key: 'entry_threshold', label: '岗位进入门槛', value: '中等', impact: '需要酒水知识。' },
          { key: 'competitiveness', label: '当前竞争力', value: '中等', impact: '仍需补英语。' },
          { key: 'core_goal', label: '核心诉求', value: '更看重收入', impact: '需要比较收入上限。' },
        ],
        decisionRisks: ['如果只追求尽快上船，可能牺牲收入上限。'],
        manualCalibration: { recommended: true, topics: ['低门槛岗位还是高收入岗位'], message: '建议进一步比较。' },
        recommendedPositions: [
          { id: 'bar', matchScore: 78, reasons: ['有餐饮经验'], risks: ['晚班强度高'], nextSteps: ['学习酒水英语'] },
          { id: 'restaurant', matchScore: 72, reasons: ['服务基础可迁移'], risks: ['体力要求高'], nextSteps: ['整理服务案例'] },
          { id: 'retail', matchScore: 65, reasons: ['愿意沟通'], risks: ['有销售目标'], nextSteps: ['练习销售表达'] },
        ],
        notRecommended: ['暂不把前台作为主申岗位。'],
        applicationRoute: { id: 'guide', reason: '先完成材料和面试准备。' },
        next30Days: ['确认主申岗位。', '完成酒水基础课。'],
        advisorSignals: {
          intentTags: ['career_decision', 'position_match'],
          decisionStage: 'position_selection',
          confidence: 'medium',
          missingInformation: ['是否有稳定英文服务经历'],
          riskFlags: ['english_gap'],
        },
      }) } }],
    }), { status: 200 })
  }
  if (String(url).includes('/rest/v1/rpc/save_ai_advisor_career_report')) {
    if (reportSaveFailure) {
      return new Response(JSON.stringify({ message: 'database unavailable' }), { status: 503, headers: { 'content-type': 'application/json' } })
    }
    completedReportCount += 1
    completedReportPayloads.push(JSON.parse(options.body))
    return new Response(JSON.stringify({ consultation_id: '22222222-2222-4222-8222-222222222222' }), { status: 200 })
  }
  throw new Error(`Unexpected fetch: ${url}`)
}

try {
  const unauthenticated = await handleCareerReportRequest({
    method: 'POST',
    headers: {},
    body: {},
    env: { DASHSCOPE_API_KEY: 'test-key', SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'test-anon' },
  })
  assert.equal(unauthenticated.status, 401)
  assert.equal(unauthenticated.body.error.code, 'LOGIN_REQUIRED')

  const invalidChoice = await handleCareerReportRequest({
    method: 'POST',
    headers: { authorization: 'Bearer mock-token' },
    body: {
      clientRequestId: 'career-report-invalid-choice',
      profile: {
        targetRole: 'bar', timeline: 'tomorrow', currentStage: 'position_selected',
        primaryConcern: 'english', hardLimits: ['none'],
      },
    },
    env: { DASHSCOPE_API_KEY: 'test-key', SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'test-anon' },
  })
  assert.equal(invalidChoice.status, 400)
  assert.equal(invalidChoice.body.error.code, 'INVALID_PROFILE_CHOICE')

  const result = await handleCareerReportRequest({
    method: 'POST',
    headers: { authorization: 'Bearer mock-token' },
    body: {
      clientRequestId: 'career-report-test-1',
      profile: {
        targetRole: 'bar', backupRole: 'restaurant', timeline: '3_6_months',
        currentStage: 'position_selected', primaryConcern: 'english',
        hardLimits: ['high_upfront_cost'], additionalContext: '餐饮服务经验，不想填写手机号 13812345678。',
      },
      assessment: { assessmentVersion: 3, completedAt: assessmentCompletedAt, overallScore: 68, dimensionScores: { english: 62, service_experience: 71 }, practicalAssessment: { englishScore: 64, serviceExperienceScore: 72 }, ruleRecommendations: [{ id: 'bar', matchScore: 74 }, { id: 'restaurant', matchScore: 70 }, { id: 'retail', matchScore: 64 }] },
    },
    env: { DASHSCOPE_API_KEY: 'test-key', SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'test-anon' },
  })

  assert.equal(result.status, 200)
  assert.equal(result.body.success, true)
  assert.equal(result.body.data.generationMode, 'ai')
  assert.deepEqual(result.body.data.recommendedPositions.map((item) => item.id), ['bar', 'restaurant', 'retail'])
  assert.equal(result.body.data.applicationRoute.id, 'guide')
  assert.equal(result.body.data.advisorSignals.decisionStage, 'position_selection')
  assert.equal(result.body.data.decisionPrinciple, 'AI 帮你缩小选择范围，但不替你做最终决定。')
  assert.deepEqual(result.body.data.decisionBasis.map((item) => item.key), ['english', 'experience', 'entry_threshold', 'competitiveness', 'core_goal'])
  assert.ok(result.body.data.decisionRisks.length > 0)
  assert.ok(result.body.data.manualCalibration.recommended)
  assert.ok(!result.body.data.summary.includes('你最适合'))
  const modelCall = calls.find((call) => call.url.includes('/chat/completions'))
  assert.ok(modelCall)
  assert.equal(JSON.parse(modelCall.options.body).max_completion_tokens, 2500)
  assert.ok(JSON.parse(modelCall.options.body).messages[0].content.includes('不替用户做最终决定'))
  const modelProfile = JSON.parse(JSON.parse(modelCall.options.body).messages[1].content).profile
  assert.equal(modelProfile.targetRole, 'bar')
  assert.ok(modelProfile.additionalContext.includes('[已隐藏手机号]'))
  assert.ok(calls.some((call) => call.url.includes('save_ai_advisor_career_report')))

  const modelCallCount = calls.filter((call) => call.url.includes('/chat/completions')).length
  existingCareerRecord = {
    profile: {
      targetRole: 'bar', backupRole: 'restaurant', timeline: '3_6_months',
      currentStage: 'position_selected', primaryConcern: 'english', hardLimits: ['high_upfront_cost'],
    },
    assessment_snapshot: { assessmentVersion: 3, completedAt: assessmentCompletedAt, dimensionScores: { english: 62, service_experience: 71 } },
    report: result.body.data,
    created_at: new Date().toISOString(),
  }
  const restored = await handleCareerReportRequest({
    method: 'POST',
    headers: { authorization: 'Bearer mock-token' },
    body: {
      clientRequestId: 'career-report-test-2',
      profile: {
        targetRole: 'bar', timeline: '3_6_months', currentStage: 'position_selected',
        primaryConcern: 'english', hardLimits: ['high_upfront_cost'], additionalContext: '餐饮服务经验。',
      },
      assessment: { assessmentVersion: 3, completedAt: assessmentCompletedAt, overallScore: 68, ruleRecommendations: [{ id: 'bar', matchScore: 74 }, { id: 'restaurant', matchScore: 70 }, { id: 'retail', matchScore: 64 }] },
    },
    env: { DASHSCOPE_API_KEY: 'test-key', SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'test-anon' },
  })
  assert.equal(restored.status, 200)
  assert.equal(restored.body.meta.reusedExistingReport, true)
  assert.equal(calls.filter((call) => call.url.includes('/chat/completions')).length, modelCallCount)
  const exactLookup = [...calls].reverse().find((call) => call.url.includes('/rest/v1/career_reports'))
  const exactLookupFilter = new URL(exactLookup.url).searchParams.get('assessment_snapshot')
  assert.ok(exactLookupFilter?.startsWith('cs.'))
  assert.deepEqual(JSON.parse(exactLookupFilter.slice(3)), {
    assessmentVersion: 3,
    completedAt: assessmentCompletedAt,
  })

  const revised = await handleCareerReportRequest({
    method: 'POST',
    headers: { authorization: 'Bearer mock-token' },
    body: {
      clientRequestId: 'career-report-test-3',
      regenerate: true,
      profile: {
        targetRole: 'retail', backupRole: 'bar', timeline: 'within_3_months',
        currentStage: 'interview_preparation', primaryConcern: 'interview',
        hardLimits: ['night_shifts'], additionalContext: '希望优先比较销售岗位。',
      },
      assessment: { assessmentVersion: 3, completedAt: revisionCompletedAt, overallScore: 68, dimensionScores: { english: 62 }, ruleRecommendations: [{ id: 'bar', matchScore: 74 }, { id: 'restaurant', matchScore: 70 }, { id: 'retail', matchScore: 64 }] },
    },
    env: { DASHSCOPE_API_KEY: 'test-key', SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'test-anon' },
  })
  assert.equal(revised.status, 200)
  assert.equal(calls.filter((call) => call.url.includes('/chat/completions')).length, modelCallCount + 1)

  existingCareerRecord = {
    profile: {
      targetRole: 'retail', backupRole: 'bar', timeline: 'within_3_months',
      currentStage: 'interview_preparation', primaryConcern: 'interview',
      hardLimits: ['night_shifts'], additionalContext: '希望优先比较销售岗位。',
    },
    assessment_snapshot: { assessmentVersion: 3, completedAt: revisionCompletedAt, dimensionScores: { english: 62 } },
    report: revised.body.data,
    created_at: new Date().toISOString(),
  }
  const revisionRetry = await handleCareerReportRequest({
    method: 'POST',
    headers: { authorization: 'Bearer mock-token' },
    body: {
      clientRequestId: 'career-report-test-retry',
      regenerate: true,
      profile: existingCareerRecord.profile,
      assessment: { assessmentVersion: 3, completedAt: revisionCompletedAt, overallScore: 68, ruleRecommendations: [{ id: 'retail', matchScore: 74 }] },
    },
    env: { DASHSCOPE_API_KEY: 'test-key', SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'test-anon' },
  })
  assert.equal(revisionRetry.status, 200)
  assert.equal(revisionRetry.body.meta.reusedExistingReport, true)
  assert.equal(calls.filter((call) => call.url.includes('/chat/completions')).length, modelCallCount + 1)

  const beforeMismatchedAssessment = calls.filter((call) => call.url.includes('/chat/completions')).length
  const mismatchedAssessment = await handleCareerReportRequest({
    method: 'POST',
    headers: { authorization: 'Bearer mock-token' },
    body: {
      clientRequestId: 'career-report-new-assessment',
      profile: existingCareerRecord.profile,
      assessment: {
        assessmentVersion: 3,
        completedAt: '2026-10-07T03:00:00.000Z',
        overallScore: 70,
        ruleRecommendations: [{ id: 'retail', matchScore: 76 }],
      },
    },
    env: { DASHSCOPE_API_KEY: 'test-key', SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'test-anon' },
  })
  assert.equal(mismatchedAssessment.status, 200)
  assert.equal(mismatchedAssessment.body.meta?.reusedExistingReport, undefined)
  assert.equal(calls.filter((call) => call.url.includes('/chat/completions')).length, beforeMismatchedAssessment + 1)

  existingCareerRecord = null
  const fallbackScenarios = [
    ['timeout', () => { throw new DOMException('Timed out', 'TimeoutError') }, 'test-key', 1],
    ['network', () => { throw new TypeError('fetch failed') }, 'test-key', 1],
    ['429', () => Response.json({ error: { code: 'rate_limit' } }, { status: 429 }), 'test-key', 1],
    ['500', () => new Response('provider failed', { status: 500 }), 'test-key', 1],
    ['malformed', () => Response.json({ choices: [{ message: { content: '{broken' } }] }), 'test-key', 1],
    ['incomplete', () => Response.json({ choices: [{ message: { content: JSON.stringify({ summary: '缺少岗位列表。' }) } }] }), 'test-key', 1],
    ['null', () => Response.json({ choices: [{ message: { content: 'null' } }] }), 'test-key', 1],
    ['body-read', () => ({ ok: true, text: async () => { throw new TypeError('stream interrupted') } }), 'test-key', 1],
    ['unconfigured', null, '', 0],
  ]
  for (const [name, override, apiKey, expectedProviderCalls] of fallbackScenarios) {
    providerOverride = override
    const beforeProviderCalls = calls.filter((call) => call.url.includes('/chat/completions')).length
    const beforeSaves = completedReportPayloads.length
    const fallbackResult = await handleCareerReportRequest({
      method: 'POST',
      headers: { authorization: 'Bearer mock-token' },
      body: {
        clientRequestId: `career-report-fallback-${name}`,
        profile: {
          targetRole: 'bar', backupRole: 'restaurant', timeline: '3_6_months',
          currentStage: 'position_selected', primaryConcern: 'english', hardLimits: ['none'],
        },
        assessment: {
          assessmentVersion: 3,
          completedAt: `2026-10-07T04:00:0${beforeSaves}.000Z`,
          overallScore: 68,
          dimensionScores: { english: 62, service_experience: 71 },
          ruleRecommendations: [{ id: 'bar', matchScore: 74 }, { id: 'restaurant', matchScore: 70 }, { id: 'retail', matchScore: 64 }],
        },
      },
      env: { DASHSCOPE_API_KEY: apiKey, SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'test-anon' },
    })
    assert.equal(fallbackResult.status, 200, name)
    assert.equal(fallbackResult.body.data.generationMode, 'rules_fallback', name)
    assert.equal(fallbackResult.body.data.decisionPrinciple, '测评规则帮你缩小选择范围，但不替你做最终决定。', name)
    assert.deepEqual(fallbackResult.body.data.recommendedPositions.map((item) => item.id), ['bar', 'restaurant', 'retail'], name)
    assert.equal(calls.filter((call) => call.url.includes('/chat/completions')).length - beforeProviderCalls, expectedProviderCalls, name)
    assert.equal(completedReportPayloads.length - beforeSaves, 1, name)
    assert.equal(completedReportPayloads.at(-1).input_model, 'rules-v1', name)
  }
  providerOverride = null

  reportLookupFailure = true
  const lookupFailureResult = await handleCareerReportRequest({
    method: 'POST',
    headers: { authorization: 'Bearer mock-token' },
    body: {
      clientRequestId: 'career-report-lookup-failure',
      profile: {
        targetRole: 'bar', timeline: '3_6_months', currentStage: 'position_selected',
        primaryConcern: 'english', hardLimits: ['none'],
      },
      assessment: {
        assessmentVersion: 3,
        completedAt: '2026-10-07T04:30:00.000Z',
        overallScore: 68,
        ruleRecommendations: [{ id: 'bar', matchScore: 74 }],
      },
    },
    env: { DASHSCOPE_API_KEY: 'test-key', SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'test-anon' },
  })
  assert.equal(lookupFailureResult.status, 200)
  assert.equal(lookupFailureResult.body.data.generationMode, 'ai')
  reportLookupFailure = false

  const finalizedBeforeSaveFailure = finalizedOutcomes.length
  reportSaveFailure = true
  const saveFailureResult = await handleCareerReportRequest({
    method: 'POST',
    headers: { authorization: 'Bearer mock-token' },
    body: {
      clientRequestId: 'career-report-save-failure',
      profile: {
        targetRole: 'bar', timeline: '3_6_months', currentStage: 'position_selected',
        primaryConcern: 'english', hardLimits: ['none'],
      },
      assessment: {
        assessmentVersion: 3,
        completedAt: '2026-10-07T04:40:00.000Z',
        overallScore: 68,
        ruleRecommendations: [{ id: 'bar', matchScore: 74 }],
      },
    },
    env: { DASHSCOPE_API_KEY: 'test-key', SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'test-anon' },
  })
  assert.equal(saveFailureResult.status, 503)
  assert.equal(saveFailureResult.body.error.code, 'REPORT_SAVE_FAILED')
  assert.equal(finalizedOutcomes.length, finalizedBeforeSaveFailure + 1)
  assert.equal(finalizedOutcomes.at(-1), 'failed')
  reportSaveFailure = false

  reportInProgress = true
  const inProgress = await handleCareerReportRequest({
    method: 'POST',
    headers: { authorization: 'Bearer mock-token' },
    body: {
      clientRequestId: 'career-report-in-progress',
      profile: {
        targetRole: 'bar', timeline: '3_6_months', currentStage: 'position_selected',
        primaryConcern: 'english', hardLimits: ['none'],
      },
      assessment: { assessmentVersion: 3, completedAt: '2026-10-07T04:50:00.000Z', overallScore: 68 },
    },
    env: { DASHSCOPE_API_KEY: 'test-key', SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'test-anon' },
  })
  assert.equal(inProgress.status, 409)
  assert.equal(inProgress.body.error.code, 'REPORT_IN_PROGRESS')
  reportInProgress = false
  reportLimitReached = true

  const limitReached = await handleCareerReportRequest({
    method: 'POST',
    headers: { authorization: 'Bearer mock-token' },
    body: {
      clientRequestId: 'career-report-test-4',
      regenerate: true,
      profile: {
        targetRole: 'retail', timeline: 'within_3_months', currentStage: 'interview_preparation',
        primaryConcern: 'interview', hardLimits: ['night_shifts'], additionalContext: '',
      },
      assessment: { assessmentVersion: 3, completedAt: '2026-10-07T05:00:00.000Z', overallScore: 68, ruleRecommendations: [{ id: 'retail', matchScore: 74 }] },
    },
    env: { DASHSCOPE_API_KEY: 'test-key', SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'test-anon' },
  })
  assert.equal(limitReached.status, 429)
  assert.equal(limitReached.body.error.code, 'RATE_LIMITED')
  console.log('Career report API scenarios passed.')
} finally {
  global.fetch = originalFetch
}
