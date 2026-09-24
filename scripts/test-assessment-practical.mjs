import assert from 'node:assert/strict'
import { handleInterviewRequest } from '../server/interviewAi.js'

const originalFetch = globalThis.fetch
const modelRequests = []

globalThis.fetch = async (url, options = {}) => {
  const target = String(url)
  if (target.includes('/auth/v1/user')) {
    return Response.json({
      id: '00000000-0000-4000-8000-000000000099',
      email: 'assessment@example.com',
      role: 'authenticated',
    })
  }
  if (target.includes('/rest/v1/rpc/record_ai_usage_event')) return Response.json(1)
  if (target.includes('/rest/v1/rpc/record_ai_operation_log')) return Response.json(1)
  if (target.includes('/chat/completions')) {
    const request = JSON.parse(options.body)
    modelRequests.push(request)
    const isEvaluation = request.response_format?.json_schema?.name === 'practical_assessment_result'
    return Response.json({
      choices: [{
        message: {
          content: JSON.stringify(isEvaluation ? {
            englishScore: 76,
            serviceExperienceScore: 68,
            evidenceConfidence: 'medium',
            summary: '英语能够完成基本闭环，经历证据仍需补充结果。',
            strengths: ['能确认客人需求。'],
            priorities: ['补充个人行动和结果数据。'],
            integrityFlags: ['结果主要使用主观描述。'],
            englishBreakdown: {
              taskCompletion: 24,
              closedLoopCommunication: 19,
              serviceSafetyJudgment: 16,
              deliveryEfficiency: 10,
              languageControl: 7,
            },
            starBreakdown: {
              specificity: 14,
              personalOwnership: 13,
              judgmentAndAction: 18,
              resultEvidence: 11,
              reflection: 12,
            },
          } : {
            question: '其中哪一步是你本人独立完成的？为什么先做这一步？',
            focus: 'ownership',
          }),
        },
      }],
    })
  }
  throw new Error(`Unexpected request: ${target}`)
}

const env = {
  DASHSCOPE_API_KEY: 'assessment-test-key',
  DASHSCOPE_BASE_URL: 'https://dashscope.test/v1',
  SUPABASE_URL: 'https://supabase.test',
  SUPABASE_ANON_KEY: 'assessment-test-anon',
}
const headers = { authorization: 'Bearer assessment-test-token' }

try {
  const followUp = await handleInterviewRequest({
    method: 'POST',
    headers,
    body: {
      action: 'assessment_followup',
      mode: 'assessment',
      clientRequestId: 'assessment-followup-1',
      followUpIndex: 1,
      serviceBackground: 'restaurant',
      history: [{ question: '讲一次客诉。', answer: '我们最后解决了。', durationSeconds: 20 }],
    },
    env,
  })
  assert.equal(followUp.status, 200)
  assert.equal(followUp.body.data.focus, 'ownership')
  assert.ok(followUp.body.data.question.includes('本人'))

  const practicalAnswers = [
    { id: 'e1', category: 'english', question: 'Complaint', answer: 'I am sorry. I will check and update you.', durationSeconds: 14 },
    { id: 'e2', category: 'english', question: 'Allergy', answer: 'I will confirm with the kitchen first.', durationSeconds: 10 },
    { id: 's1', category: 'star', question: 'Main', answer: '我处理过一次客诉。', durationSeconds: 35 },
    { id: 's2', category: 'star', question: 'Follow-up 1', answer: '我先核对订单。', durationSeconds: 18 },
    { id: 's3', category: 'star', question: 'Follow-up 2', answer: '客人接受了处理。', durationSeconds: 16 },
  ]
  const evaluation = await handleInterviewRequest({
    method: 'POST',
    headers,
    body: {
      action: 'assessment_evaluate',
      mode: 'assessment',
      clientRequestId: 'assessment-evaluate-1',
      serviceBackground: 'restaurant',
      answers: practicalAnswers,
    },
    env,
  })
  assert.equal(evaluation.status, 200)
  assert.equal(evaluation.body.data.englishScore, 76)
  assert.equal(evaluation.body.data.serviceExperienceScore, 68)
  assert.equal(evaluation.body.data.evidenceConfidence, 'medium')
  assert.equal(modelRequests.length, 2)
  assert.ok(modelRequests[1].messages[0].content.includes('不得评价口音'))
  assert.equal(modelRequests[1].response_format.json_schema.strict, true)

  console.log('Practical assessment API contract passed.')
} finally {
  globalThis.fetch = originalFetch
}
