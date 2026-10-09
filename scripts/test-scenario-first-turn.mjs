import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createFirstTurnState, runFirstScenarioTurn } from '../src/utils/scenarioFirstTurn.js'

const apiError = (code) => Object.assign(new Error(code), { code })

const createHarness = () => {
  let idCounter = 0
  const calls = { followUps: [], drafts: [] }
  const plan = { followUps: [], drafts: [] }
  const next = (queue, fallback) => {
    const step = queue.shift() ?? fallback
    if (step instanceof Error) throw step
    return step
  }
  const run = (state, { scenarioId = 'bar_server_drink_recommendation_01', answer = 'I would recommend a mojito.' } = {}) => runFirstScenarioTurn({
    state,
    scenarioId,
    answer,
    createRequestId: () => `request-${++idCounter}`,
    requestFollowUp: async (requestId) => {
      calls.followUps.push(requestId)
      return next(plan.followUps, { role: 'Guest', message: `Follow-up for ${requestId}` })
    },
    saveDraft: async (followUp) => {
      calls.drafts.push(followUp.message)
      return next(plan.drafts, { id: `draft-${calls.drafts.length}` })
    },
  })
  return { calls, plan, run }
}

// Happy path: one AI call, one draft save.
{
  const { calls, run } = createHarness()
  const result = await run(createFirstTurnState())
  assert.deepEqual(calls.followUps, ['request-1'])
  assert.deepEqual(result, { followUp: { role: 'Guest', message: 'Follow-up for request-1' }, savedDraft: { id: 'draft-1' } })
}

// The follow-up was generated and charged, then the draft save failed: the retry only saves the draft.
{
  const { calls, plan, run } = createHarness()
  const state = createFirstTurnState()
  plan.drafts.push(new Error('Supabase insert failed'))
  await assert.rejects(run(state), /Supabase insert failed/)
  const retry = await run(state)
  assert.deepEqual(calls.followUps, ['request-1'], 'A draft-save retry must not call or charge the AI again.')
  assert.deepEqual(calls.drafts, ['Follow-up for request-1', 'Follow-up for request-1'])
  assert.equal(retry.followUp.message, 'Follow-up for request-1')
}

// The AI call failed (not charged): the retry reuses the same request id.
{
  const { calls, plan, run } = createHarness()
  const state = createFirstTurnState()
  plan.followUps.push(apiError('AI_TIMEOUT'))
  await assert.rejects(run(state), /AI_TIMEOUT/)
  await run(state)
  assert.deepEqual(calls.followUps, ['request-1', 'request-1'], 'A failed AI call is retried with the same request id.')
}

// The earlier attempt was charged but its reply was lost: the server reports the id as completed,
// so the helper asks once more with a fresh id instead of leaving the learner stuck.
{
  const { calls, plan, run } = createHarness()
  const state = createFirstTurnState()
  plan.followUps.push(apiError('NETWORK_ERROR'), apiError('AI_REQUEST_ALREADY_COMPLETED'))
  await assert.rejects(run(state), /NETWORK_ERROR/)
  const recovered = await run(state)
  assert.deepEqual(calls.followUps, ['request-1', 'request-1', 'request-2'])
  assert.equal(recovered.followUp.message, 'Follow-up for request-2')
}

// A second AI_REQUEST_ALREADY_COMPLETED is not retried in a loop.
{
  const { calls, plan, run } = createHarness()
  plan.followUps.push(apiError('AI_REQUEST_ALREADY_COMPLETED'), apiError('AI_REQUEST_ALREADY_COMPLETED'))
  await assert.rejects(run(createFirstTurnState()), /AI_REQUEST_ALREADY_COMPLETED/)
  assert.deepEqual(calls.followUps, ['request-1', 'request-2'])
}

// A changed answer or a different scenario is a new turn with a new request id.
{
  const { calls, plan, run } = createHarness()
  const state = createFirstTurnState()
  plan.drafts.push(new Error('save failed'), new Error('save failed'))
  await assert.rejects(run(state, { answer: 'First answer' }), /save failed/)
  await assert.rejects(run(state, { answer: 'Edited answer' }), /save failed/)
  await run(state, { scenarioId: 'bar_server_complaint_recovery_02', answer: 'Edited answer' })
  assert.deepEqual(calls.followUps, ['request-1', 'request-2', 'request-3'])
}

// The screen wires the helper in and no longer drops the first-turn state on error.
const screen = fs.readFileSync(new URL('../src/pages/programs/BarServerScenarioTraining.jsx', import.meta.url), 'utf8')
assert.ok(screen.includes('runFirstScenarioTurn({'), 'The scenario screen runs the first turn through the retry helper.')
assert.equal(screen.includes('firstTurnRequestIdRef'), false, 'The old per-attempt request id ref is gone.')
const catchBlock = screen.slice(screen.indexOf('} catch (error) {', screen.indexOf('const submitAnswer')))
assert.equal(/firstTurnRef\.current = /.test(catchBlock.slice(0, catchBlock.indexOf('} finally'))), false, 'Errors keep the first-turn state for the retry.')

console.log('Scenario first turn passed: draft-save retries reuse the charged follow-up, failed calls reuse the request id, lost replies recover once, and new answers get new ids.')
