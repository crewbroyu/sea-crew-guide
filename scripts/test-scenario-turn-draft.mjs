import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { handleInterviewRequest } from '../server/interviewAi.js'

// The first scenario turn saves its charged follow-up as a server-written draft, and a retry with the
// same request id returns that draft without reserving quota, calling AI, or charging again.
const userId = '00000000-0000-4000-8000-000000000501'
const otherUserId = '00000000-0000-4000-8000-000000000599'
const baselineSessionId = '00000000-0000-4000-8000-000000000502'
const otherScenarioSessionId = '00000000-0000-4000-8000-000000000504'
const unfinishedSessionId = '00000000-0000-4000-8000-000000000505'
const secretKey = 'scenario-turn-test-secret'
const scenarioId = 'bar_sim_basic_order'

const state = {
  drafts: [],
  completedSessions: [
    { id: baselineSessionId, user_id: userId, scenario_id: scenarioId, status: 'completed', overall_readiness: 61, weaknesses: ['Did not repeat the order.'] },
    { id: otherScenarioSessionId, user_id: userId, scenario_id: 'bar_sim_premium_recommendation', status: 'completed', overall_readiness: 90, weaknesses: [] },
    { id: unfinishedSessionId, user_id: userId, scenario_id: scenarioId, status: 'in_progress', overall_readiness: 0, weaknesses: [] },
  ],
  insertFails: false,
  usageFails: false,
  providerCalls: 0,
  quotaReservations: 0,
  usageActions: [],
  finalizeOutcomes: [],
  inserts: [],
}

const readHeader = (headers, name) => {
  if (!headers) return ''
  if (typeof headers.get === 'function') return headers.get(name) || ''
  const found = Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase())
  return found?.[1] || ''
}
const filterValue = (url, key) => url.searchParams.get(key)?.replace(/^eq\./, '') ?? null

globalThis.fetch = async (input, options = {}) => {
  const target = String(input)
  const url = new URL(target)
  const method = options.method || 'GET'
  const isAdmin = readHeader(options.headers, 'apikey') === secretKey

  if (target.includes('/auth/v1/user')) {
    return Response.json({ id: userId, aud: 'authenticated', role: 'authenticated', email: 'turn@example.com', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00.000Z' })
  }
  if (target.includes('/rest/v1/user_access')) return Response.json({ access_status: 'active', role: 'learner', unlocked: true, plan: 'single_job' })
  if (target.includes('/rest/v1/user_entitlements')) {
    return Response.json({ user_id: userId, product_code: 'bar_server_pack', status: 'active', starts_at: '2026-01-01T00:00:00.000Z', expires_at: '2027-01-01T00:00:00.000Z', ai_feedback_limit: 100, mock_interview_limit: 10 })
  }
  if (target.includes('/rest/v1/rpc/reserve_ai_usage_quota')) {
    state.quotaReservations += 1
    return Response.json({ reservation_id: '00000000-0000-4000-8000-000000000503', unlimited: false })
  }
  if (target.includes('/rest/v1/rpc/finalize_ai_usage_reservation')) {
    state.finalizeOutcomes.push(JSON.parse(options.body || '{}').input_outcome)
    return Response.json(true)
  }
  if (target.includes('/rest/v1/rpc/record_ai_usage_event')) {
    if (state.usageFails) return Response.json({ message: 'usage table unavailable' }, { status: 500 })
    state.usageActions.push(JSON.parse(options.body || '{}').input_action)
    return Response.json(1)
  }
  if (target.includes('/rest/v1/rpc/record_ai_operation_log')) return Response.json(1)
  if (target.includes('/rest/v1/user_job_skill_profiles')) return Response.json([])

  if (target.includes('/rest/v1/scenario_training_sessions')) {
    if (!isAdmin) {
      if (method !== 'GET') return Response.json({ message: 'permission denied' }, { status: 403 })
      return Response.json([])
    }
    if (method === 'POST') {
      state.inserts.push(JSON.parse(options.body || '{}'))
      if (state.insertFails) return Response.json({ message: 'insert failed' }, { status: 500 })
      const row = { id: randomUUID(), created_at: new Date().toISOString(), ...JSON.parse(options.body || '{}') }
      state.drafts.push(row)
      return Response.json(row, { status: 201 })
    }
    const requestId = filterValue(url, 'scenario_context->>turnRequestId')
    if (requestId !== null) {
      return Response.json(state.drafts.filter((draft) => draft.user_id === filterValue(url, 'user_id')
        && draft.scenario_id === filterValue(url, 'scenario_id')
        && draft.status === filterValue(url, 'status')
        && draft.scenario_context?.turnRequestId === requestId))
    }
    const id = filterValue(url, 'id')
    // Postgres rejects a malformed uuid filter, like PostgREST does in production.
    if (!/^[0-9a-f-]{36}$/i.test(id || '')) return Response.json({ code: '22P02', message: 'invalid input syntax for type uuid' }, { status: 400 })
    return Response.json(state.completedSessions.filter((row) => row.id === id && row.user_id === filterValue(url, 'user_id')))
  }

  if (target.includes('/chat/completions')) {
    state.providerCalls += 1
    return Response.json({
      request_id: `provider-turn-${state.providerCalls}`,
      choices: [{ message: { content: JSON.stringify({ role: 'Guest', message: `Which base spirit would you like? (${state.providerCalls})` }) } }],
    })
  }

  throw new Error(`Unexpected request: ${method} ${target}`)
}

const env = {
  DASHSCOPE_API_KEY: 'scenario-turn-provider-key',
  DASHSCOPE_BASE_URL: 'https://dashscope.test/v1',
  SUPABASE_URL: 'https://supabase.test',
  SUPABASE_ANON_KEY: 'scenario-turn-anon-key',
  SUPABASE_SECRET_KEY: secretKey,
}
const answer = 'One mojito with less syrup, and could you tell me which non-alcoholic drink your wife prefers?'
const requestTurn = (clientRequestId, extra = {}, requestEnv = env) => handleInterviewRequest({
  method: 'POST',
  headers: { authorization: 'Bearer scenario-turn-token' },
  env: requestEnv,
  body: {
    action: 'scenario_turn',
    mode: 'premium_scenario',
    position: 'Bar Server',
    scenarioId,
    firstAnswer: answer,
    persistDraft: true,
    clientRequestId,
    ...extra,
  },
})
const reset = () => {
  state.drafts.length = 0
  state.inserts.length = 0
  state.insertFails = false
  state.usageFails = false
  state.providerCalls = 0
  state.quotaReservations = 0
  state.usageActions.length = 0
  state.finalizeOutcomes.length = 0
  globalThis.__crewPathInterviewUsage?.clear()
}

// 1. First turn: the follow-up is generated, saved as the draft, then charged once.
reset()
const first = await requestTurn('turn-happy')
assert.equal(first.status, 200)
assert.equal(first.body.data.message, 'Which base spirit would you like? (1)')
assert.ok(first.body.data.session?.id, 'The response carries the server-saved draft.')
assert.equal(state.drafts.length, 1)
const [draft] = state.drafts
assert.equal(draft.user_id, userId)
assert.equal(draft.job_key, 'bar_server')
assert.equal(draft.scenario_id, scenarioId)
assert.equal(draft.difficulty, 1, 'Difficulty comes from the trusted server catalog.')
assert.equal(draft.status, 'in_progress')
assert.equal(draft.scenario_context.turnRequestId, 'turn-happy')
assert.equal(draft.scenario_context.retry, undefined)
assert.deepEqual(draft.turns.map((turn) => turn.role), ['Guest', 'trainee', 'Guest'])
assert.equal(draft.turns[1].content, answer)
assert.equal(draft.turns[2].isFollowUp, true)
assert.deepEqual(first.body.data.session.turns, draft.turns)
assert.deepEqual(state.usageActions, ['evaluate'])
assert.deepEqual(state.finalizeOutcomes, ['completed'])

// 2. Lost reply: the retry with the same request id returns the saved draft for free.
state.providerCalls = 0
state.quotaReservations = 0
state.usageActions.length = 0
state.finalizeOutcomes.length = 0
const recovered = await requestTurn('turn-happy')
assert.equal(recovered.status, 200)
assert.equal(recovered.body.meta.recovered, true)
assert.equal(recovered.body.data.session.id, first.body.data.session.id)
assert.equal(recovered.body.data.message, first.body.data.message)
assert.equal(state.providerCalls, 0, 'A recovered turn must not call AI.')
assert.equal(state.quotaReservations, 0, 'A recovered turn must not reserve quota.')
assert.deepEqual(state.usageActions, [], 'A recovered turn must not be charged.')
assert.equal(state.drafts.length, 1, 'A recovered turn must not create another draft.')

// 3. Draft save fails after the AI call: not charged; the retry with the same id succeeds once.
reset()
state.insertFails = true
const saveFailed = await requestTurn('turn-save-fails')
assert.equal(saveFailed.status, 503)
assert.equal(saveFailed.body.error.code, 'TRAINING_RESULT_SAVE_FAILED')
assert.deepEqual(state.usageActions, [], 'An unsaved follow-up must not be charged.')
assert.deepEqual(state.finalizeOutcomes, ['failed'])
state.insertFails = false
const saveRetried = await requestTurn('turn-save-fails')
assert.equal(saveRetried.status, 200)
assert.ok(saveRetried.body.data.session?.id)
assert.deepEqual(state.usageActions, ['evaluate'], 'The learner pays once in total.')

// 4. Usage record fails after the draft was saved: the retry returns the saved draft without charging.
reset()
state.usageFails = true
const usageFailed = await requestTurn('turn-usage-fails')
assert.equal(usageFailed.status, 503)
assert.equal(usageFailed.body.error.code, 'USAGE_RECORD_FAILED')
assert.deepEqual(state.finalizeOutcomes, ['failed'])
state.usageFails = false
const usageRetried = await requestTurn('turn-usage-fails')
assert.equal(usageRetried.status, 200)
assert.equal(usageRetried.body.meta.recovered, true)
assert.equal(state.providerCalls, 1)
assert.equal(state.drafts.length, 1)

// 5. Guided retry: the comparison comes from the stored completed session, never the browser.
reset()
const guided = await requestTurn('turn-guided', {
  retrySessionId: baselineSessionId,
  baselineResult: { overallReadiness: 100, weaknesses: [] },
})
assert.equal(guided.status, 200)
assert.deepEqual(state.drafts[0].scenario_context.retry, {
  sessionId: baselineSessionId,
  baselineResult: { overallReadiness: 61, weaknesses: ['Did not repeat the order.'] },
})
for (const [label, retrySessionId] of [
  ['not a uuid', 'baseline-1'],
  ['another learner', otherUserId],
  ['another scenario', otherScenarioSessionId],
  ['not completed', unfinishedSessionId],
]) {
  reset()
  const ignored = await requestTurn(`turn-bad-retry-${label}`, { retrySessionId })
  assert.equal(ignored.status, 200)
  assert.equal(state.drafts[0].scenario_context.retry, undefined, `An invalid retry session is ignored: ${label}.`)
}

// 6. Pages loaded before server-saved drafts would insert their own draft, which learners can no
//    longer do. They are told to refresh before any quota, AI call, or charge.
reset()
const legacy = await requestTurn('turn-legacy', { persistDraft: undefined })
assert.equal(legacy.status, 409)
assert.equal(legacy.body.error.code, 'CLIENT_OUTDATED')
assert.equal(state.quotaReservations, 0, 'An outdated page must not reserve quota.')
assert.equal(state.providerCalls, 0, 'An outdated page must not call AI.')
assert.deepEqual(state.usageActions, [], 'An outdated page must not be charged.')
assert.equal(state.inserts.length, 0)

// 7. Missing trusted-write configuration fails before reserving quota or calling AI.
reset()
const { SUPABASE_SECRET_KEY: _omitted, ...envWithoutSecret } = env
const missingSecret = await requestTurn('turn-missing-secret', {}, envWithoutSecret)
assert.equal(missingSecret.status, 503)
assert.equal(missingSecret.body.error.code, 'TRUSTED_WRITE_NOT_CONFIGURED')
assert.equal(state.quotaReservations, 0)
assert.equal(state.providerCalls, 0)

console.log('Scenario turn draft passed: server-saved drafts, free same-id recovery, no charge on save failure, trusted retry baselines, and outdated pages refused before any charge.')
