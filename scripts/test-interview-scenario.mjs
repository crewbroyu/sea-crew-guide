import assert from 'node:assert/strict'
import { handleInterviewRequest } from '../server/interviewAi.js'

const scenarioEvaluation = {
  overallScore: 32,
  rating: 2,
  overallSuggestion: '已经给出具体酒名，但需要先确认偏好并解释推荐理由。',
  strengths: ['给出了一款具体饮品。'],
  priorities: ['补充偏好确认、风味解释和服务收尾。'],
  questionScores: [{
    question: 'Drink recommendation scenario',
    score: 6,
    comment: 'Screwdriver 有柑橘风味，但橙汁可能偏甜，当前回答没有验证客人偏好。',
    strengths: ['给出了明确推荐。'],
    improvements: ['先确认基酒偏好。', '解释甜度与风味。', '确认套餐或价格后推进点单。'],
    improvedAnswer: 'May I ask whether you prefer gin or vodka? I would recommend a Tom Collins because it is light and citrus-forward.',
    knowledgeNotes: ['Screwdriver 由 vodka 和 orange juice 构成，橙汁可能偏甜。'],
    usefulPhrases: ['May I ask whether you prefer gin or vodka?'],
    retryChecklist: ['先问一个关键偏好。', '说出推荐理由。', '完成点单收尾。'],
    matchedKeywords: ['recommend'],
    missedKeywords: ['preference', 'flavor'],
  }],
}

let providerEvaluation = scenarioEvaluation
let evaluationRequestCount = 0
const evaluationRequests = []
const quotaReservations = []
let scenarioRequestSequence = 0

globalThis.fetch = async (url, options) => {
  const target = String(url)
  if (target.includes('/auth/v1/user')) {
    return new Response(JSON.stringify({
      id: '00000000-0000-4000-8000-000000000001',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'scenario-test@example.com',
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: {},
      created_at: '2026-01-01T00:00:00.000Z',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  if (target.includes('/rest/v1/rpc/record_ai_usage_event')) {
    return new Response('1', { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  if (target.includes('/rest/v1/rpc/reserve_ai_usage_quota')) {
    quotaReservations.push(JSON.parse(options?.body || '{}'))
    return Response.json({ reservation_id: '00000000-0000-4000-8000-000000000003', unlimited: false })
  }

  if (target.includes('/rest/v1/rpc/finalize_ai_usage_reservation')) {
    return Response.json(true)
  }

  if (target.includes('/rest/v1/ai_usage_events')) {
    return new Response(null, { status: 200, headers: { 'Content-Range': '0-0/0' } })
  }

  if (target.includes('/chat/completions')) {
    evaluationRequestCount += 1
    evaluationRequests.push(JSON.parse(options?.body || '{}'))
    return new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify(providerEvaluation) } }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  throw new Error(`Unexpected request: ${target}`)
}

const evaluateScenario = () => handleInterviewRequest({
  method: 'POST',
  headers: { authorization: 'Bearer scenario-test-token' },
  body: {
    action: 'evaluate',
    mode: 'scenario_trial',
    position: 'Bar Server',
    scenarioId: 'bar_server_drink_recommendation_01',
    clientRequestId: `scenario-test-${++scenarioRequestSequence}`,
    questions: [{
      id: 'bar_server_drink_recommendation_01',
      question: 'What would you recommend?',
      focus: 'Match the drink to the guest.',
      keywords: ['preference', 'recommend', 'flavor'],
    }],
    answers: [{ textAnswer: 'I recommend Screwdriver.', durationSeconds: 4 }],
  },
  env: {
    DASHSCOPE_API_KEY: 'scenario-test-key',
    DASHSCOPE_BASE_URL: 'https://dashscope.test/v1',
    SUPABASE_URL: 'https://supabase.test',
    SUPABASE_ANON_KEY: 'scenario-test-anon-key',
  },
})

const result = await evaluateScenario()

assert.equal(result.status, 200)
assert.equal(result.body.success, true)
assert.equal(quotaReservations[0].input_product_code, 'bar_server_pack')
assert.equal(quotaReservations[0].input_action, 'evaluate')
assert.equal(quotaReservations[0].input_mode, 'scenario_trial')
const feedback = result.body.data.questionScores[0]
assert.equal(feedback.improvedAnswer, scenarioEvaluation.questionScores[0].improvedAnswer)
assert.deepEqual(feedback.knowledgeNotes, scenarioEvaluation.questionScores[0].knowledgeNotes)
assert.deepEqual(feedback.usefulPhrases, scenarioEvaluation.questionScores[0].usefulPhrases)
assert.deepEqual(feedback.retryChecklist, scenarioEvaluation.questionScores[0].retryChecklist)
assert.equal(evaluationRequests[0].model, 'qwen3.7-plus')
assert.equal(evaluationRequests[0].response_format.type, 'json_schema')
assert.equal(evaluationRequests[0].response_format.json_schema.strict, true)

providerEvaluation = {
  overallScore: 35,
  rating: 2,
  overallSuggestion: '需要进一步完善回答。',
}
const requestsBeforeRetryTest = evaluationRequestCount
let sparseResponsePending = true
globalThis.fetch = async (url, options) => {
  const target = String(url)
  if (target.includes('/auth/v1/user')) {
    return new Response(JSON.stringify({
      id: '00000000-0000-4000-8000-000000000001',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'scenario-test@example.com',
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: {},
      created_at: '2026-01-01T00:00:00.000Z',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  if (target.includes('/rest/v1/rpc/record_ai_usage_event')) {
    return new Response('2', { status: 200, headers: { 'Content-Type': 'application/json' } })
  }


  if (target.includes('/rest/v1/rpc/reserve_ai_usage_quota')) {
    return Response.json({ reservation_id: '00000000-0000-4000-8000-000000000004', unlimited: false })
  }

  if (target.includes('/rest/v1/rpc/finalize_ai_usage_reservation')) {
    return Response.json(true)
  }

  if (target.includes('/rest/v1/ai_usage_events')) {
    return new Response(null, { status: 200, headers: { 'Content-Range': '0-0/0' } })
  }

  if (target.includes('/chat/completions')) {
    evaluationRequestCount += 1
    evaluationRequests.push(JSON.parse(options?.body || '{}'))
    const content = sparseResponsePending ? providerEvaluation : scenarioEvaluation
    sparseResponsePending = false
    return new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify(content) } }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  throw new Error(`Unexpected request: ${target}`)
}
const sparseResult = await evaluateScenario()
const fallbackFeedback = sparseResult.body.data.questionScores[0]
assert.equal(sparseResult.status, 200)
assert.equal(evaluationRequestCount - requestsBeforeRetryTest, 2)
assert.equal(fallbackFeedback.comment, scenarioEvaluation.questionScores[0].comment)

const publicPracticeResult = await handleInterviewRequest({
  method: 'POST',
  headers: { authorization: 'Bearer scenario-test-token' },
  body: {
    action: 'evaluate',
    mode: 'practice',
    position: 'Restaurant Assistant',
    questions: [{ id: 'public-question', question: 'Why do you want this role?' }],
    answers: [{ textAnswer: 'I enjoy service.', durationSeconds: 3 }],
  },
  env: {
    DASHSCOPE_API_KEY: 'scenario-test-key',
    DASHSCOPE_BASE_URL: 'https://dashscope.test/v1',
    SUPABASE_URL: 'https://supabase.test',
    SUPABASE_ANON_KEY: 'scenario-test-anon-key',
  },
})

assert.equal(publicPracticeResult.status, 403)
assert.equal(publicPracticeResult.body.error.code, 'VOICE_TRAINING_REQUIRES_ACCESS')

console.log('Scenario feedback contract passed.')
