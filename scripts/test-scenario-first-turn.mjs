import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createFirstTurnState, runFirstScenarioTurn } from '../src/utils/scenarioFirstTurn.js'

const apiError = (code) => Object.assign(new Error(code), { code })

const createHarness = () => {
  let idCounter = 0
  const calls = []
  const plan = []
  const run = (state, { scenarioId = 'bar_sim_basic_order', answer = 'I would recommend a mojito.' } = {}) => runFirstScenarioTurn({
    state,
    scenarioId,
    answer,
    createRequestId: () => `request-${++idCounter}`,
    requestFollowUp: async (requestId) => {
      calls.push(requestId)
      const step = plan.shift()
      if (step instanceof Error) throw step
      return { role: 'Guest', message: `Follow-up for ${requestId}`, session: { id: `draft-${requestId}` } }
    },
  })
  return { calls, plan, run }
}

// Happy path: one request, the server-saved draft comes back with the follow-up.
{
  const { calls, run } = createHarness()
  const result = await run(createFirstTurnState())
  assert.deepEqual(calls, ['request-1'])
  assert.equal(result.session.id, 'draft-request-1')
}

// Any failure (lost reply, timeout, draft save error) is retried with the same request id, so the
// server can return the saved draft or reuse the failed reservation instead of charging again.
for (const code of ['NETWORK_ERROR', 'AI_TIMEOUT', 'TRAINING_RESULT_SAVE_FAILED', 'AI_REQUEST_IN_PROGRESS']) {
  const { calls, plan, run } = createHarness()
  const state = createFirstTurnState()
  plan.push(apiError(code))
  await assert.rejects(run(state), new RegExp(code))
  await run(state)
  assert.deepEqual(calls, ['request-1', 'request-1'], `${code} is retried with the same request id.`)
}

// Charged earlier but no saved draft to return: ask once more with a fresh id.
{
  const { calls, plan, run } = createHarness()
  const state = createFirstTurnState()
  plan.push(apiError('NETWORK_ERROR'), apiError('AI_REQUEST_ALREADY_COMPLETED'))
  await assert.rejects(run(state), /NETWORK_ERROR/)
  const recovered = await run(state)
  assert.deepEqual(calls, ['request-1', 'request-1', 'request-2'])
  assert.equal(recovered.message, 'Follow-up for request-2')
}

// A second AI_REQUEST_ALREADY_COMPLETED is not retried in a loop.
{
  const { calls, plan, run } = createHarness()
  plan.push(apiError('AI_REQUEST_ALREADY_COMPLETED'), apiError('AI_REQUEST_ALREADY_COMPLETED'))
  await assert.rejects(run(createFirstTurnState()), /AI_REQUEST_ALREADY_COMPLETED/)
  assert.deepEqual(calls, ['request-1', 'request-2'])
}

// A changed answer or a different scenario is a new turn with a new request id.
{
  const { calls, plan, run } = createHarness()
  const state = createFirstTurnState()
  plan.push(apiError('AI_TIMEOUT'), apiError('AI_TIMEOUT'))
  await assert.rejects(run(state, { answer: 'First answer' }), /AI_TIMEOUT/)
  await assert.rejects(run(state, { answer: 'Edited answer' }), /AI_TIMEOUT/)
  await run(state, { scenarioId: 'bar_sim_premium_recommendation', answer: 'Edited answer' })
  assert.deepEqual(calls, ['request-1', 'request-2', 'request-3'])
}

// The screen uses the server-saved draft and keeps the first-turn state on error.
const screen = fs.readFileSync(new URL('../src/pages/programs/BarServerScenarioTraining.jsx', import.meta.url), 'utf8')
assert.ok(screen.includes('runFirstScenarioTurn({'), 'The scenario screen runs the first turn through the retry helper.')
assert.equal(screen.includes('createScenarioTrainingDraft'), false, 'The browser no longer creates the first-turn draft.')
assert.ok(screen.includes('setActiveSessionId(followUp.session?.id || null)'), 'The screen continues with the server-saved draft.')
assert.ok(screen.includes('retrySessionId: baselineResult ? baselineSessionId : null'), 'A guided retry sends only the baseline session id.')
const catchBlock = screen.slice(screen.indexOf('} catch (error) {', screen.indexOf('const submitAnswer')))
assert.equal(/firstTurnRef\.current = /.test(catchBlock.slice(0, catchBlock.indexOf('} finally'))), false, 'Errors keep the first-turn state for the retry.')

const service = fs.readFileSync(new URL('../src/services/interviewAiService.js', import.meta.url), 'utf8')
assert.ok(/action: 'scenario_turn',[\s\S]*?persistDraft: true/.test(service), 'The scenario turn request asks the server to save the draft.')

console.log('Scenario first turn passed: retries reuse the request id so the server returns the saved draft, lost charges recover once, and new answers get new ids.')
