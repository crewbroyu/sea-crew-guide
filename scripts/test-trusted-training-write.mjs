import assert from 'node:assert/strict'
import fs from 'node:fs'
import { handleInterviewRequest } from '../server/interviewAi.js'

const userId = '00000000-0000-4000-8000-000000000301'
const sessionId = '00000000-0000-4000-8000-000000000302'
const secretKey = 'trusted-server-test-secret'
const adminWrites = []
let quotaReservations = 0
let providerCalls = 0
// Session state seen by admin reads: 'in_progress' or 'completed'. completeAfterReads flips it to
// completed after N reads to simulate a concurrent request finishing first.
let sessionStatus = 'in_progress'
let completeAfterReads = Infinity
let sessionReads = 0
let rejectSecondCompletion = false
const usageActions = []
const finalizeOutcomes = []
// Raw provider message contents returned in order before the default valid scenario report.
const providerQueue = []
const completedSessionRow = {
  id: sessionId,
  user_id: userId,
  job_key: 'bar_server',
  scenario_id: 'bar_sim_allergy_safety',
  difficulty: 4,
  status: 'completed',
  overall_readiness: 72,
  skill_scores: { communication: 80, barKnowledge: 70, service: 75, upselling: 60, problemSolving: 65, english: 82 },
  strengths: ['Stored strength.'],
  weaknesses: ['Stored weakness.'],
  critical_mistakes: [],
  better_response: 'Stored better response.',
  next_recommendation: 'Stored recommendation.',
  completed_at: '2026-10-09T01:00:00.000Z',
}

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
  if (target.includes('/rest/v1/rpc/finalize_ai_usage_reservation')) {
    finalizeOutcomes.push(JSON.parse(options.body || '{}').input_outcome)
    return Response.json(true)
  }
  if (target.includes('/rest/v1/rpc/record_ai_usage_event')) {
    usageActions.push(JSON.parse(options.body || '{}').input_action)
    return Response.json(1)
  }
  if (target.includes('/rest/v1/rpc/record_ai_operation_log')) return Response.json(1)
  if (target.includes('/rest/v1/user_job_skill_profiles')) {
    if (!isAdmin) return Response.json([])
    return Response.json({ readiness_score: 70, skill_scores: completedSessionRow.skill_scores, weakest_skill: 'upselling', recommended_scenario_id: 'bar_sim_premium_recommendation', completed_scenario_count: 2 })
  }
  if (target.includes('/rest/v1/rpc/complete_scenario_with_unified_profile')) {
    if (!isAdmin) return Response.json({ message: 'server key required' }, { status: 403 })
    if (rejectSecondCompletion) {
      sessionStatus = 'completed'
      return Response.json({ code: 'P0001', message: 'SCENARIO_SESSION_INVALID' }, { status: 400 })
    }
    const body = JSON.parse(options.body || '{}')
    adminWrites.push({ table: 'complete_scenario_with_unified_profile', body })
    return Response.json({
      session: {
        id: sessionId,
        scenario_id: body.input_scenario_id,
        job_key: body.input_job_key,
        difficulty: body.input_completed_fields.difficulty,
        status: 'completed',
        overall_readiness: body.input_completed_fields.overall_readiness,
        skill_scores: body.input_skill_scores,
        weaknesses: body.input_completed_fields.weaknesses,
        next_recommendation: body.input_completed_fields.next_recommendation,
        completed_at: body.input_occurred_at,
      },
      profile: {
        readinessScore: 65,
        skillScores: body.input_skill_scores,
        weakestSkill: 'problemSolving',
        recommendedScenario: { id: 'bar_sim_cocktail_recommendation' },
        completedScenarioCount: 1,
      },
      unifiedProfile: { readinessScore: 63, evidenceCount: 1 },
    })
  }

  if (target.includes('/rest/v1/scenario_training_sessions')) {
    if (!isAdmin) return Response.json([])
    if (target.includes(`id=eq.${sessionId}`)) {
      sessionReads += 1
      if (sessionReads > completeAfterReads) sessionStatus = 'completed'
      if (sessionStatus === 'completed') return Response.json(completedSessionRow)
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

  if (target.includes('/chat/completions')) {
    providerCalls += 1
    if (providerQueue.length) {
      return Response.json({ request_id: `queued-${providerCalls}`, choices: [{ message: { content: providerQueue.shift() } }] })
    }
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

const atomicWrite = adminWrites.find((write) => write.table === 'complete_scenario_with_unified_profile')?.body
assert.equal(atomicWrite.input_user_id, userId)
assert.equal(atomicWrite.input_completed_fields.difficulty, 4)
assert.equal(atomicWrite.input_completed_fields.overall_readiness, 65)
assert.equal(atomicWrite.input_skill_scores.problemSolving, 40)
assert.equal(atomicWrite.input_completed_fields.scenario_context.forgedScore, undefined)
assert.equal(atomicWrite.input_completed_fields.scenario_context.retrySessionId, '00000000-0000-4000-8000-000000000399')
assert.equal(atomicWrite.input_evidence_entries.some((row) => row.skill_key === 'safety_judgment'), true)
assert.notEqual(atomicWrite.input_completed_fields.overall_readiness, 100, 'client-supplied scores must never control the capability profile')

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

// Retry idempotency: a session can only be completed once, and retries must not score or charge again.
const trustedEnv = {
  DASHSCOPE_API_KEY: 'trusted-training-provider-key',
  DASHSCOPE_BASE_URL: 'https://dashscope.test/v1',
  SUPABASE_URL: 'https://supabase.test',
  SUPABASE_ANON_KEY: 'trusted-training-anon-key',
  SUPABASE_SECRET_KEY: secretKey,
}
const retryTurns = [
  { role: 'Concerned Guest', content: 'Can you guarantee this is safe?' },
  { role: 'trainee', content: 'I will pause and verify the approved ingredient information.' },
  { role: 'Concerned Guest', content: 'I need an answer now.' },
  { role: 'trainee', content: 'I cannot guarantee it. I will alert the bartender and supervisor.' },
]
const evaluateScenario = (clientRequestId) => handleInterviewRequest({
  method: 'POST',
  headers: { authorization: 'Bearer trusted-training-token' },
  env: trustedEnv,
  body: { action: 'scenario_evaluate', mode: 'premium_scenario', position: 'Bar Server', scenarioId: 'bar_sim_allergy_safety', sessionId, clientRequestId, turns: retryTurns },
})
const resetRetryState = ({ status = 'in_progress', afterReads = Infinity, rejectCompletion = false } = {}) => {
  sessionStatus = status
  completeAfterReads = afterReads
  sessionReads = 0
  rejectSecondCompletion = rejectCompletion
  usageActions.length = 0
  finalizeOutcomes.length = 0
  adminWrites.length = 0
  quotaReservations = 0
  providerCalls = 0
  globalThis.__crewPathInterviewUsage?.clear()
}

// 1. Lost response or timeout: the session is already completed, so the retry returns the stored result
//    without reserving quota, calling AI, or writing anything.
resetRetryState({ status: 'completed' })
const recovered = await evaluateScenario('lost-response-retry')
assert.equal(recovered.status, 200)
assert.equal(recovered.body.meta.recovered, true)
assert.equal(recovered.body.data.overallReadiness, 72, 'the stored score is returned, not a new one')
assert.equal(recovered.body.data.betterResponse, 'Stored better response.')
assert.equal(recovered.body.data.session.id, sessionId)
assert.equal(recovered.body.data.profile.completedScenarioCount, 2)
assert.equal(recovered.body.data.profile.recommendedScenario.id, 'bar_sim_premium_recommendation')
assert.equal(providerCalls, 0, 'no AI call for an already-completed session')
assert.equal(quotaReservations, 0, 'no quota reservation for an already-completed session')
assert.deepEqual(usageActions, [])
assert.equal(adminWrites.length, 0, 'nothing is written again')

// 2. Concurrent duplicate: this request passes the early check, but another request completes the session
//    before this one saves. It returns the stored result and is released without charge.
resetRetryState({ afterReads: 1 })
const raced = await evaluateScenario('concurrent-duplicate')
assert.equal(raced.status, 200)
assert.equal(raced.body.data.overallReadiness, 72, 'the first completed result wins')
assert.equal(raced.body.data.recoveredExistingResult, true)
assert.equal(providerCalls, 1)
assert.deepEqual(usageActions, [], 'the duplicate request is not charged')
assert.deepEqual(finalizeOutcomes, ['released'])
assert.equal(adminWrites.length, 0, 'the duplicate never reaches the atomic completion')

// 3. The database rejects a second completion under the profile lock: the stored result is returned.
resetRetryState({ rejectCompletion: true })
const rejected = await evaluateScenario('database-rejects-duplicate')
assert.equal(rejected.status, 200)
assert.equal(rejected.body.data.overallReadiness, 72)
assert.deepEqual(usageActions, [])
assert.deepEqual(finalizeOutcomes, ['released'])

// 4. A rejected completion with no completed session left behind is a 409, not a 503 storage error.
resetRetryState({ rejectCompletion: true })
const originalRow = { ...completedSessionRow }
completedSessionRow.scenario_id = 'bar_sim_wrong_drink_recovery'
const conflict = await evaluateScenario('invalid-draft')
completedSessionRow.scenario_id = originalRow.scenario_id
assert.equal(conflict.status, 409)
assert.equal(conflict.body.error.code, 'SCENARIO_SESSION_INVALID')
assert.deepEqual(usageActions, [])
assert.deepEqual(finalizeOutcomes, ['failed'])

// Scenario score contract: every job dimension must be a real score before anything is saved.
const scenarioReport = (skillScores, extra = {}) => JSON.stringify({
  skillScores,
  strengths: ['Paused before promising.'],
  weaknesses: ['Handover was incomplete.'],
  criticalMistakes: [],
  betterResponse: 'I will pause the order and verify the approved information first.',
  nextTrainingRecommendation: 'Practise the closed-loop handover.',
  ...extra,
})
const fullScores = { communication: 80, barKnowledge: 60, service: 70, upselling: 50, problemSolving: 40, english: 90 }

// 5. A report missing a dimension is retried; the saved scores come from the complete report, never 0.
resetRetryState()
providerQueue.push(scenarioReport({ ...fullScores, upselling: undefined }), scenarioReport({ ...fullScores, upselling: 55 }))
const retried = await evaluateScenario('missing-dimension-retry')
assert.equal(retried.status, 200)
assert.equal(providerCalls, 2, 'an incomplete report is retried once')
const savedScores = adminWrites.find((write) => write.table === 'complete_scenario_with_unified_profile').body.input_skill_scores
assert.equal(savedScores.upselling, 55)
assert.ok(Object.values(savedScores).every((score) => score > 0), 'no dimension is stored as a default 0')
assert.deepEqual(usageActions, ['evaluate'])

// 6. Two unusable reports (null, empty string): rejected with nothing saved or charged; the draft stays retryable.
resetRetryState()
providerQueue.push(scenarioReport({ ...fullScores, english: null }), scenarioReport({ ...fullScores, barKnowledge: '' }))
const incomplete = await evaluateScenario('unusable-dimensions')
assert.equal(incomplete.status, 502)
assert.equal(incomplete.body.error.code, 'INVALID_AI_RESPONSE')
assert.equal(providerCalls, 2)
assert.equal(adminWrites.length, 0, 'no session completion or capability evidence is written')
assert.deepEqual(usageActions, [], 'a rejected report is not charged')
assert.deepEqual(finalizeOutcomes, ['failed'])

// 7. A truncated report is retried instead of failing immediately.
resetRetryState()
providerQueue.push('{"skillScores": {"communication": 80,', scenarioReport(fullScores))
const truncated = await evaluateScenario('truncated-report')
assert.equal(truncated.status, 200)
assert.equal(providerCalls, 2)

// 8. Quoted numeric scores pass on the first attempt; a missing model answer does not.
resetRetryState()
providerQueue.push(scenarioReport(Object.fromEntries(Object.entries(fullScores).map(([key, value]) => [key, String(value)]))))
const quoted = await evaluateScenario('quoted-scores')
assert.equal(quoted.status, 200)
assert.equal(providerCalls, 1)
assert.equal(adminWrites.find((write) => write.table === 'complete_scenario_with_unified_profile').body.input_skill_scores.english, 90)

resetRetryState()
providerQueue.push(scenarioReport(fullScores, { betterResponse: '' }), scenarioReport(fullScores, { betterResponse: '   ' }))
const noAnswer = await evaluateScenario('missing-better-response')
assert.equal(noAnswer.status, 502)
assert.equal(adminWrites.length, 0)

const clientScreen = fs.readFileSync(new URL('../src/pages/programs/BarServerScenarioTraining.jsx', import.meta.url), 'utf8')
assert.equal(clientScreen.includes('else finalEvaluationRequestIdRef.current = null'), false, 'a failed final evaluation keeps its request id for the retry')

const clientService = fs.readFileSync(new URL('../src/services/scenarioTrainingService.js', import.meta.url), 'utf8')
assert.equal(clientService.includes("status: 'completed'"), false)
assert.equal(clientService.includes(".from('user_job_skill_profiles')\n    .upsert"), false)

const migration = fs.readFileSync(new URL('../supabase/migrations/20261008090000_trusted_training_results.sql', import.meta.url), 'utf8')
assert.match(migration, /grant update \(turns\)/i)
assert.match(migration, /revoke insert, update on table public\.user_job_skill_profiles from authenticated/i)

const draftInsertMigration = fs.readFileSync(new URL('../supabase/migrations/20261010090000_revoke_learner_scenario_draft_insert.sql', import.meta.url), 'utf8')
assert.match(draftInsertMigration, /revoke insert on table public\.scenario_training_sessions from authenticated/i)
assert.match(draftInsertMigration, /drop policy if exists "Users can create own scenario drafts"/i)
assert.doesNotMatch(draftInsertMigration, /revoke[^;]*update/i, 'Learners keep updating their own draft turns.')
assert.equal(clientService.includes('.insert('), false, 'The browser no longer inserts scenario sessions.')

console.log('Trusted training writes passed: server-owned references, completed sessions, capability profiles, and draft-only client permissions.')
