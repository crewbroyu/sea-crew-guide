import assert from 'node:assert/strict'
import { handleTtsRequest } from '../server/tts.js'

const originalFetch = globalThis.fetch
const providerRequests = []
const usageEvents = []

globalThis.fetch = async (url, options = {}) => {
  const target = String(url)
  if (target.includes('/auth/v1/user')) {
    return Response.json({
      id: '00000000-0000-4000-8000-000000000088',
      email: 'assessment-tts@example.com',
      role: 'authenticated',
    })
  }
  if (target.includes('/rest/v1/rpc/record_ai_usage_event')) {
    usageEvents.push(JSON.parse(options.body))
    return Response.json(1)
  }
  if (target.includes('/api/v1/services/aigc/multimodal-generation/generation')) {
    providerRequests.push(JSON.parse(options.body))
    return Response.json({
      output: {
        audio: {
          url: 'http://audio.test/assessment.mp3',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        },
      },
      usage: { characters: 42 },
    })
  }
  throw new Error(`Unexpected request: ${target}`)
}

const env = {
  DASHSCOPE_API_KEY: 'tts-test-key',
  DASHSCOPE_TTS_URL: 'https://dashscope.test/api/v1/services/aigc/multimodal-generation/generation',
  SUPABASE_URL: 'https://supabase.test',
  SUPABASE_ANON_KEY: 'tts-test-anon',
}
const headers = { authorization: 'Bearer assessment-tts-token' }

try {
  const requestBody = {
    text: 'Excuse me. I ordered thirty minutes ago.',
    mode: 'assessment',
    voice: 'Ethan',
    languageType: 'English',
    scenarioId: 'practical-english-complaint',
    clientRequestId: 'assessment-tts-1',
  }
  const first = await handleTtsRequest({ method: 'POST', headers, body: requestBody, env })
  assert.equal(first.status, 200)
  assert.equal(first.body.data.provider, 'dashscope')
  assert.equal(first.body.data.audioUrl, 'https://audio.test/assessment.mp3')
  assert.equal(providerRequests[0].input.voice, 'Ethan')
  assert.equal(providerRequests[0].input.language_type, 'English')
  assert.equal(usageEvents[0].input_product_code, null)
  assert.equal(usageEvents[0].input_mode, 'assessment')
  assert.equal(usageEvents[0].input_scenario_id, 'practical-english-complaint')

  const cached = await handleTtsRequest({
    method: 'POST',
    headers,
    body: { ...requestBody, clientRequestId: 'assessment-tts-2' },
    env,
  })
  assert.equal(cached.status, 200)
  assert.equal(cached.body.data.provider, 'dashscope-cache')
  assert.equal(providerRequests.length, 1)
  assert.equal(usageEvents.length, 1)

  const invalid = await handleTtsRequest({
    method: 'POST',
    headers,
    body: { ...requestBody, scenarioId: 'arbitrary-free-tts', clientRequestId: 'assessment-tts-3' },
    env,
  })
  assert.equal(invalid.status, 400)
  assert.equal(invalid.body.error.code, 'INVALID_ASSESSMENT_SCENARIO')

  console.log('Assessment natural TTS contract passed.')
} finally {
  globalThis.fetch = originalFetch
}
