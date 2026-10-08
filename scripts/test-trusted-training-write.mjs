import assert from 'node:assert/strict'
import fs from 'node:fs'
import { handleInterviewRequest } from '../server/interviewAi.js'

const userId = '00000000-0000-4000-8000-000000000301'
const sessionId = '00000000-0000-4000-8000-000000000302'
const secretKey = 'trusted-server-test-secret'
const adminWrites = []
let quotaReservations = 0
let providerCalls = 0

const readHeader = (headers, name) => {
  if (!headers) return ''
  if (typeof headers.get === 'function') return headers.get(name) || ''
  const found = Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase())
  return found?.[1] || ''
}

globalThis.fetch = async (url, options = {}) => {
  const target = String(url)
  const method = options.method || 'GET'
  const isAdmin = readHeader(options.headers, 'apikey') === secretKey

  if (target.includes('/auth/v1/user')) {
    return Response.json({
      id: userId,
      aud: 'authenticated',
      role: 'authenticated',
      email: 'trusted-training@example.com',
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: {},
      created_at: '2026-01-01T00:00:00.000Z',
    })
  }
  if (target.includes('/rest/v1/user_access')) {
    return Response.json({ access_status: 'active', role: 'learner', unlocked: true, plan: 'single_job' })
  }
  if (target.includes('/rest/v1/user_entitlements')) {
    return Response.json({
      user_id: userId,
      product_code: 'bar_server_pack',
      status: 'active',
      starts_at: '2026-01-01T00:00:00.000Z',
      expires_at: '2027-01-01T00:00:00.000Z',
      ai_feedback_limit: 100,
      mock_interview_limit: 10,
    })
  }
  if (target.includes('/rest/v1/rpc/reserve_ai_usage_quota')) {
    quotaReservations += 1
    return Response.json({ reservation_id: '00000000-0000-4000-8000-000000000303', unlimited: false })
  }
  if (target.includes('/rest/v1/rpc/finalize_ai_usage_reservation')) return Response.json(true)
  if (target.includes('/rest/v1/rpc/record_ai_usage_event')) return Response.json(1)
  if (target.includes('/rest/v1/rpc/record_ai_operation_log')) return Response.json(1)

  if (target.includes('/rest/v1/scenario_training_sessions')) {
    if (!isAdmin) return Response.json([])
    if (method === 'PATCH') {
      const body = JSON.parse(options.body || '{}')
      adminWrites.push({ table: 'scenario_training_sessions', body })
      return Response.json({
        id: sessionId,
        scenario_id: 'bar_sim_allergy_safety',
        job_key: 'bar_server',
        difficulty: 4,
        status: 'completed',
        overall_readiness: body.overall_readiness,
        skill_scores: body.skill_scores,
        weaknesses: body.weaknesses,
        next_recommendation: body.next_recommendation,
        completed_at: body.completed_at,
      })
    }
    if (target.includes(`id=eq.${sessionId}`)) {
      return Response.json({
        id: sessionId,
        user_id: userId,
        job_key: 'bar_server',
        scenario_id: 'bar_sim_allergy_safety',
        status: 'in_progress',
        scenario_context: { forgedScore: 100, retry: { sessionId: '00000000-0000-4000-8000-000000000399' } },
      })
    }
    return Response.json([{ scenario_id: 'bar_sim_allergy_safety' }])
  }

  if (target.includes('/rest/v1/user_job_skill_profiles')) {
    if (!isAdmin) return Response.json(null)
    if (method === 'POST') {
      adminWrites.push({ table: 'user_job_skill_profiles', body: JSON.parse(options.body || '{}') })
      return new Response(null, { status: 201 })
    }
    return Response.json(null)
  }

  if (target.includes('/rest/v1/user_skill_evidence')) {
    if (!isAdmin) return Response.json({ message: 'server key required' }, { status: 403 })
    if (method === 'POST') {
      adminWrites.push({ table: 'user_skill_evidence', body: JSON.parse(options.body || '[]') })
      return new Response(null, { status: 201 })
    }
    return Response.json([])
  }

  if (target.includes('/rest/v1/user_skill_profiles')) {
    if (!isAdmin) return Response.json({ message: 'server key required' }, { status: 403 })
    if (method === 'POST') {
      adminWrites.push({ table: 'user_skill_profiles', body: JSON.parse(options.body || '{}') })
      return new Response(null, { status: 201 })
    }
    return Response.json([])
  }

  if (target.includes('/chat/completions')) {
    providerCalls += 1
    return Response.json({
      request_id: 'provider-trusted-result',
      choices: [{ message: { content: JSON.stringify({
        skillScores: {
          communication: 80,
          barKnowledge: 60,
          service: 70,
          upselling: 50,
          problemSolving: 40,
          english: 90,
        },
        strengths: ['Paused the order and avoided a false guarantee.'],
        weaknesses: ['The handover sequence was incomplete.'],
        criticalMistakes: [],
        betterResponse: 'I will pause the order, verify the approved information, and alert the bartender and supervisor.',
        nextTrainingRecommendation: 'Practise escalation and a closed-loop handover.',
      }) } }],
    })
  }

  throw new Error(`Unexpected request: ${method} ${target}`)
}

const result = await handleInterviewRequest({
  method: 'POST',
  headers: { authorization: 'Bearer trusted-training-token' },
  env: {
    DASHSCOPE_API_KEY: 'trusted-training-provider-key',
    DASHSCOPE_BASE_URL: 'https://dashscope.test/v1',
    SUPABASE_URL: 'https://supabase.test',
    SUPABASE_ANON_KEY: 'trusted-training-anon-key',
    SUPABASE_SECRET_KEY: secretKey,
  },
  body: {
    action: 'scenario_evaluate',
    mode: 'premium_scenario',
    position: 'Bar Server',
    scenarioId: 'bar_sim_allergy_safety',
    sessionId,
    clientRequestId: 'trusted-scenario-evaluation',
    evaluation: { overallReadiness: 100, weakestSkill: 'english' },
    turns: [
      { role: 'Concerned Guest', content: 'Can you guarantee this is safe?' },
      { role: 'trainee', content: 'I will pause and verify the approved ingredient information.' },
      { role: 'Concerned Guest', content: 'I need an answer now.' },
      { role: 'trainee', content: 'I cannot guarantee it. I will alert the bartender and supervisor before we continue.' },
    ],
  },
})

assert.equal(result.status, 200)
assert.equal(result.body.data.session.id, sessionId)
assert.equal(result.body.data.overallReadiness, 65)
assert.equal(result.body.data.profile.readinessScore, 65)
assert.equal(result.body.data.profile.weakestSkill, 'problemSolving')
assert.equal(result.body.data.profile.completedScenarioCount, 1)

const sessionWrite = adminWrites.find((write) => write.table === 'scenario_training_sessions')?.body
assert.equal(sessionWrite.status, 'completed')
assert.equal(sessionWrite.difficulty, 4)
assert.equal(sessionWrite.overall_readiness, 65)
assert.equal(sessionWrite.skill_scores.problemSolving, 40)
assert.equal(sessionWrite.scenario_context.forgedScore, undefined)
assert.equal(sessionWrite.scenario_context.retrySessionId, '00000000-0000-4000-8000-000000000399')

const profileWrite = adminWrites.find((write) => write.table === 'user_job_skill_profiles')?.body
assert.equal(profileWrite.user_id, userId)
assert.equal(profileWrite.readiness_score, 65)
assert.equal(profileWrite.weakest_skill, 'problemSolving')
assert.notEqual(profileWrite.readiness_score, 100, 'client-supplied scores must never control the capability profile')
const unifiedEvidenceWrite = adminWrites.find((write) => write.table === 'user_skill_evidence')?.body
assert.ok(Array.isArray(unifiedEvidenceWrite))
assert.equal(unifiedEvidenceWrite.some((row) => row.skill_key === 'safety_judgment'), true)
assert.equal(unifiedEvidenceWrite.every((row) => row.user_id === userId), true)

const mismatchedScenario = await handleInterviewRequest({
  method: 'POST',
  headers: { authorization: 'Bearer trusted-training-token' },
  env: {
    DASHSCOPE_API_KEY: 'trusted-training-provider-key',
    DASHSCOPE_BASE_URL: 'https://dashscope.test/v1',
    SUPABASE_URL: 'https://supabase.test',
    SUPABASE_ANON_KEY: 'trusted-training-anon-key',
    SUPABASE_SECRET_KEY: secretKey,
  },
  body: {
    action: 'scenario_evaluate',
    mode: 'premium_scenario',
    position: 'Bar Server',
    scenarioId: 'retail_sim_sea_day',
    sessionId,
    clientRequestId: 'mismatched-scenario',
    turns: [],
  },
})
assert.equal(mismatchedScenario.status, 400)
assert.equal(mismatchedScenario.body.error.code, 'SCENARIO_POSITION_MISMATCH')
assert.equal(quotaReservations, 1, 'a mismatched scenario must fail before reserving paid quota')

const missingSecret = await handleInterviewRequest({
  method: 'POST',
  headers: { authorization: 'Bearer trusted-training-token' },
  env: {
    DASHSCOPE_API_KEY: 'trusted-training-provider-key',
    DASHSCOPE_BASE_URL: 'https://dashscope.test/v1',
    SUPABASE_URL: 'https://supabase.test',
    SUPABASE_ANON_KEY: 'trusted-training-anon-key',
  },
  body: {
    action: 'scenario_evaluate',
    mode: 'premium_scenario',
    position: 'Bar Server',
    scenarioId: 'bar_sim_allergy_safety',
    sessionId,
    clientRequestId: 'missing-trusted-secret',
    turns: [],
  },
})
assert.equal(missingSecret.status, 503)
assert.equal(missingSecret.body.error.code, 'TRUSTED_WRITE_NOT_CONFIGURED')
assert.equal(providerCalls, 1, 'missing trusted-write configuration must fail before calling the AI provider')
assert.equal(quotaReservations, 1, 'missing trusted-write configuration must fail before reserving quota')

const clientService = fs.readFileSync(new URL('../src/services/scenarioTrainingService.js', import.meta.url), 'utf8')
assert.equal(clientService.includes("status: 'completed'"), false)
assert.equal(clientService.includes(".from('user_job_skill_profiles')\n    .upsert"), false)

const migration = fs.readFileSync(new URL('../supabase/migrations/20261008090000_trusted_training_results.sql', import.meta.url), 'utf8')
assert.match(migration, /grant update \(turns\)/i)
assert.match(migration, /revoke insert, update on table public\.user_job_skill_profiles from authenticated/i)

console.log('Trusted training writes passed: server-owned references, completed sessions, capability profiles, and draft-only client permissions.')
