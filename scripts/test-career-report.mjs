import assert from 'node:assert/strict'
import { handleCareerReportRequest } from '../server/careerReport.js'

const originalFetch = global.fetch
const calls = []
let existingCareerRecord = null

global.fetch = async (url, options = {}) => {
  calls.push({ url: String(url), options })
  if (String(url).includes('/auth/v1/user')) {
    return new Response(JSON.stringify({ id: '11111111-1111-4111-8111-111111111111', email: 'test@example.com' }), { status: 200 })
  }
  if (String(url).includes('/rest/v1/career_reports')) {
    if (existingCareerRecord) {
      return new Response(JSON.stringify(existingCareerRecord), { status: 200, headers: { 'content-type': 'application/json' } })
    }
    return new Response(JSON.stringify([]), { status: 200, headers: { 'content-range': '*/0', 'content-type': 'application/json' } })
  }
  if (String(url).includes('/rest/v1/rpc/reserve_career_report_generation')) {
    return new Response(JSON.stringify({ reservation_id: '33333333-3333-4333-8333-333333333333' }), { status: 200 })
  }
  if (String(url).includes('/rest/v1/rpc/finalize_career_report_generation')) {
    return new Response(JSON.stringify(true), { status: 200 })
  }
  if (String(url).includes('/chat/completions')) {
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
    return new Response(JSON.stringify({ consultation_id: '22222222-2222-4222-8222-222222222222' }), { status: 200 })
  }
  throw new Error(`Unexpected fetch: ${url}`)
}

try {
  const result = await handleCareerReportRequest({
    method: 'POST',
    headers: { authorization: 'Bearer mock-token' },
    body: {
      clientRequestId: 'career-report-test-1',
      profile: {
        ageRange: '21_25', education: 'diploma', englishLevel: 'service', experience: 'restaurant_bar', goal: 'income', timeline: '3_6_months', budget: '500_2000', salesTolerance: 'open', workIntensity: 'high', workSummary: '餐饮服务经验。',
      },
      assessment: { overallScore: 68, ruleRecommendations: [{ id: 'bar', matchScore: 74 }, { id: 'restaurant', matchScore: 70 }, { id: 'retail', matchScore: 64 }] },
    },
    env: { DASHSCOPE_API_KEY: 'test-key', SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'test-anon' },
  })

  assert.equal(result.status, 200)
  assert.equal(result.body.success, true)
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
  assert.ok(calls.some((call) => call.url.includes('save_ai_advisor_career_report')))

  const modelCallCount = calls.filter((call) => call.url.includes('/chat/completions')).length
  existingCareerRecord = {
    profile: {
      englishLevel: 'service', experience: 'restaurant_bar', goal: 'income', timeline: '3_6_months', workIntensity: 'high',
    },
    report: result.body.data,
    created_at: new Date().toISOString(),
  }
  const restored = await handleCareerReportRequest({
    method: 'POST',
    headers: { authorization: 'Bearer mock-token' },
    body: {
      clientRequestId: 'career-report-test-2',
      profile: {
        ageRange: '21_25', education: 'diploma', englishLevel: 'service', experience: 'restaurant_bar', goal: 'income', timeline: '3_6_months', budget: '500_2000', salesTolerance: 'open', workIntensity: 'high', workSummary: '餐饮服务经验。',
      },
      assessment: { overallScore: 68, ruleRecommendations: [{ id: 'bar', matchScore: 74 }, { id: 'restaurant', matchScore: 70 }, { id: 'retail', matchScore: 64 }] },
    },
    env: { DASHSCOPE_API_KEY: 'test-key', SUPABASE_URL: 'https://example.supabase.co', SUPABASE_ANON_KEY: 'test-anon' },
  })
  assert.equal(restored.status, 200)
  assert.equal(restored.body.meta.reusedExistingReport, true)
  assert.equal(calls.filter((call) => call.url.includes('/chat/completions')).length, modelCallCount)
  console.log('Career report API scenarios passed.')
} finally {
  global.fetch = originalFetch
}
