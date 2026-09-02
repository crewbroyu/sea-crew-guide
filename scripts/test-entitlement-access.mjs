import assert from 'node:assert/strict'
import { handleInterviewRequest } from '../server/interviewAi.js'

let providerCalls = 0

globalThis.fetch = async (url) => {
  const target = String(url)

  if (target.includes('/auth/v1/user')) {
    return Response.json({
      id: '00000000-0000-4000-8000-000000000002',
      email: 'entitlement-test@example.com',
      aud: 'authenticated',
      role: 'authenticated',
      app_metadata: {},
      user_metadata: {},
    })
  }

  if (target.includes('/rest/v1/user_access')) {
    return Response.json({
      unlocked: false,
      role: 'member',
      plan: 'free',
      access_status: 'active',
      premium_until: null,
    })
  }

  if (target.includes('/rest/v1/user_entitlements')) {
    return Response.json({
      user_id: '00000000-0000-4000-8000-000000000002',
      product_code: 'bar_server_pack',
      status: 'active',
      starts_at: '2026-01-01T00:00:00.000Z',
      expires_at: '2027-01-01T00:00:00.000Z',
      ai_feedback_limit: 120,
      mock_interview_limit: 10,
    })
  }

  if (target.includes('/rest/v1/ai_usage_events')) {
    return new Response(null, { status: 200, headers: { 'Content-Range': '0-0/0' } })
  }

  if (target.includes('/rest/v1/rpc/record_ai_usage_event')) {
    return Response.json(1)
  }

  if (target.includes('/chat/completions')) {
    providerCalls += 1
    return Response.json({
      choices: [{ message: { content: JSON.stringify({
        overallScore: 70,
        rating: 4,
        overallSuggestion: '继续针对岗位细节练习。',
        questionScores: [{
          question: 'How do you recommend a drink?',
          score: 14,
          comment: '回答方向正确。',
          improvements: ['增加确认偏好的动作。'],
          improvedAnswer: 'I would first ask about the guest’s preferred base spirit and flavor.',
          matchedKeywords: ['guest'],
          missedKeywords: ['preference'],
        }],
      }) } }],
    })
  }

  throw new Error(`Unexpected request: ${target}`)
}

const request = (position) => handleInterviewRequest({
  method: 'POST',
  headers: { authorization: 'Bearer entitlement-test-token' },
  body: {
    action: 'evaluate',
    mode: 'premium_practice',
    position,
    questions: [{ id: 'q1', question: 'How do you recommend a drink?', keywords: ['guest', 'preference'] }],
    answers: [{ questionId: 'q1', textAnswer: 'I listen to the guest.', durationSeconds: 8 }],
  },
  env: {
    DASHSCOPE_API_KEY: 'test-key',
    DASHSCOPE_BASE_URL: 'https://dashscope.test/v1',
    SUPABASE_URL: 'https://supabase.test',
    SUPABASE_ANON_KEY: 'test-anon-key',
  },
})

const allowed = await request('Bar Server')
assert.equal(allowed.status, 200)
assert.equal(allowed.body.success, true)
assert.equal(providerCalls, 1)

const denied = await request('Retail Sales')
assert.equal(denied.status, 403)
assert.equal(denied.body.error.code, 'ACTIVATION_REQUIRED')
assert.equal(providerCalls, 1)

console.log('Product entitlement access contract passed.')
