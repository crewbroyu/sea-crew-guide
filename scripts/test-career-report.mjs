import assert from 'node:assert/strict'
import { handleCareerReportRequest } from '../server/careerReport.js'

const originalFetch = global.fetch
const calls = []

global.fetch = async (url, options = {}) => {
  calls.push({ url: String(url), options })
  if (String(url).includes('/auth/v1/user')) {
    return new Response(JSON.stringify({ id: '11111111-1111-4111-8111-111111111111', email: 'test@example.com' }), { status: 200 })
  }
  if (String(url).includes('/rest/v1/career_reports')) {
    return new Response('', { status: 200, headers: { 'content-range': '0-0/0' } })
  }
  if (String(url).includes('/chat/completions')) {
    return new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({
        summary: '目前适合先以 Bar Server 为主申方向。',
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
  assert.ok(calls.some((call) => call.url.includes('/chat/completions')))
  assert.ok(calls.some((call) => call.url.includes('save_ai_advisor_career_report')))
  console.log('Career report API scenarios passed.')
} finally {
  global.fetch = originalFetch
}
