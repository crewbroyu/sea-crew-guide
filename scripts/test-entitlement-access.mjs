import assert from 'node:assert/strict'
import { handleInterviewRequest } from '../server/interviewAi.js'

let providerCalls = 0
let accessResponse = {
  unlocked: false,
  role: 'member',
  plan: 'free',
  access_status: 'active',
  premium_until: null,
}
let entitlementResponse = {
  user_id: '00000000-0000-4000-8000-000000000002',
  product_code: 'bar_server_pack',
  status: 'active',
  starts_at: '2026-01-01T00:00:00.000Z',
  expires_at: '2027-01-01T00:00:00.000Z',
  ai_feedback_limit: 120,
  mock_interview_limit: 10,
}
let retailEntitlementResponse = null
let practiceEntitlementResponse = null
const reservedProducts = []
const chatSystemPrompts = []

globalThis.fetch = async (url, init = {}) => {
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
    return Response.json(accessResponse)
  }

  if (target.includes('/rest/v1/user_entitlements')) {
    // PostgREST returns every row matching product_code=in.(...); the server picks the position pack first.
    return Response.json([entitlementResponse, retailEntitlementResponse, practiceEntitlementResponse]
      .filter((item) => item && target.includes(item.product_code)))
  }

  if (target.includes('/rest/v1/ai_usage_events')) {
    return new Response(null, { status: 200, headers: { 'Content-Range': '0-0/0' } })
  }

  if (target.includes('/rest/v1/rpc/record_ai_usage_event')) {
    return Response.json(1)
  }

  if (target.includes('/rest/v1/rpc/record_ai_operation_log')) {
    return Response.json(1)
  }

  if (target.includes('/rest/v1/rpc/reserve_ai_usage_quota')) {
    reservedProducts.push(JSON.parse(init.body).input_product_code)
    return Response.json({ reservation_id: '00000000-0000-4000-8000-000000000003', unlimited: false })
  }

  if (target.includes('/rest/v1/rpc/finalize_ai_usage_reservation')) {
    return Response.json(true)
  }

  if (target.includes('/chat/completions')) {
    providerCalls += 1
    chatSystemPrompts.push(JSON.parse(init.body).messages[0].content)
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

let requestSequence = 0

const request = (position) => handleInterviewRequest({
  method: 'POST',
  headers: { authorization: 'Bearer entitlement-test-token' },
  body: {
    action: 'evaluate',
    mode: 'premium_practice',
    position,
    clientRequestId: `entitlement-test-${++requestSequence}`,
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

retailEntitlementResponse = {
  ...entitlementResponse,
  product_code: 'retail_sales_pack',
}
const retailAllowed = await request('Retail Sales Associate')
assert.equal(retailAllowed.status, 200)
assert.equal(retailAllowed.body.success, true)
assert.equal(providerCalls, 2)

assert.deepEqual(reservedProducts, ['bar_server_pack', 'retail_sales_pack'])

// Front office, restaurant, and housekeeping are unlocked by the interview practice pack only.
const frontOfficeDenied = await request('Guest Services')
assert.equal(frontOfficeDenied.status, 403)
assert.equal(frontOfficeDenied.body.error.code, 'ACTIVATION_REQUIRED')
assert.match(frontOfficeDenied.body.error.message, /面试练习包/)
assert.equal(providerCalls, 2)

practiceEntitlementResponse = { ...entitlementResponse, product_code: 'interview_practice_pack', ai_feedback_limit: 60, mock_interview_limit: 0 }
for (const position of ['Front Office', 'Restaurant Server', 'Housekeeping']) {
  const practiceAllowed = await request(position)
  assert.equal(practiceAllowed.status, 200, `${position}: ${JSON.stringify(practiceAllowed.body)}`)
}
assert.equal(providerCalls, 5)
assert.deepEqual(reservedProducts.slice(2), ['interview_practice_pack', 'interview_practice_pack', 'interview_practice_pack'])
assert.match(chatSystemPrompts.at(-1), /Stateroom Attendant/)
assert.doesNotMatch(chatSystemPrompts.at(-1), /推荐具体饮品/, 'The drink rubric is for bar positions only.')

// With both packs, Bar Server is charged to its own pack, not the practice pack.
await request('Bar Server')
assert.equal(reservedProducts.at(-1), 'bar_server_pack')
assert.match(chatSystemPrompts.at(-1), /推荐具体饮品/)

// The practice pack never unlocks mock interviews.
const practiceMock = await handleInterviewRequest({
  method: 'POST',
  headers: { authorization: 'Bearer entitlement-test-token' },
  body: { action: 'evaluate', mode: 'premium_mock', position: 'Front Office', clientRequestId: `entitlement-test-${++requestSequence}`, questions: [], answers: [] },
  env: { DASHSCOPE_API_KEY: 'test-key', SUPABASE_URL: 'https://supabase.test', SUPABASE_ANON_KEY: 'test-anon-key', SUPABASE_SERVICE_ROLE_KEY: 'test-service-key' },
})
assert.equal(practiceMock.status, 403)
assert.equal(practiceMock.body.error.code, 'POSITION_AI_NOT_AVAILABLE')

const unsupported = await request('Kitchen Steward')
assert.equal(unsupported.status, 403)
assert.equal(unsupported.body.error.code, 'POSITION_AI_NOT_AVAILABLE')
assert.equal(providerCalls, 6)
practiceEntitlementResponse = null

entitlementResponse = null
accessResponse = {
  unlocked: true,
  role: 'member',
  plan: 'premium',
  access_status: 'active',
  premium_until: null,
}
const legacyDenied = await request('Bar Server')
assert.equal(legacyDenied.status, 403)
assert.equal(legacyDenied.body.error.code, 'ACTIVATION_REQUIRED')
assert.equal(providerCalls, 6)

accessResponse = { ...accessResponse, unlocked: false, plan: 'free' }
entitlementResponse = {
  user_id: '00000000-0000-4000-8000-000000000002',
  product_code: 'bar_server_pack',
  status: 'active',
  starts_at: '2026-01-01T00:00:00.000Z',
  expires_at: '2027-01-01T00:00:00.000Z',
  ai_feedback_limit: 120,
  mock_interview_limit: 10,
}
const mismatchedAudio = await handleInterviewRequest({
  method: 'POST',
  headers: { authorization: 'Bearer entitlement-test-token' },
  body: {
    action: 'transcribe',
    mode: 'premium_practice',
    position: 'Bar Server',
    clientRequestId: `entitlement-test-${++requestSequence}`,
    durationSeconds: 1,
    mimeType: 'audio/webm',
    audioData: `data:audio/webm;base64,${'A'.repeat(130_000)}`,
  },
  env: {
    DASHSCOPE_API_KEY: 'test-key',
    SUPABASE_URL: 'https://supabase.test',
    SUPABASE_ANON_KEY: 'test-anon-key',
  },
})
assert.equal(mismatchedAudio.status, 413)
assert.equal(mismatchedAudio.body.error.code, 'AUDIO_DURATION_MISMATCH')
assert.equal(providerCalls, 6)

console.log('Product entitlement access contract passed.')
