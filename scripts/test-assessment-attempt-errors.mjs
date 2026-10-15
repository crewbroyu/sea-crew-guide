import assert from 'node:assert/strict'
import { callAttemptRpc, toAttemptError } from '../src/services/assessmentAttemptErrors.js'

// Covers how practical-assessment attempt RPC failures reach the learner: stale
// login tokens are refreshed and retried once, and unknown failures keep their code.

console.error = () => {}
const fallback = '暂时无法开始实战评估，请稍后重试。'

// 1. Known database codes map to their own messages.
assert.equal(toAttemptError({ message: 'ASSESSMENT_LIMIT_REACHED' }, fallback).code, 'ASSESSMENT_LIMIT_REACHED')
assert.equal(toAttemptError({ code: 'P0001', message: 'LOGIN_REQUIRED' }, fallback).message, '请先登录后再开始实战评估。')

// 2. Expired or invalid tokens are treated as a login problem.
const expired = toAttemptError({ code: 'PGRST301', message: 'JWT expired' }, fallback)
assert.equal(expired.code, 'LOGIN_REQUIRED')
assert.equal(expired.message, '请先登录后再开始实战评估。')

// 3. Network failures (Chrome and iOS wording) get a network message.
for (const message of ['TypeError: Failed to fetch', 'TypeError: Load failed']) {
  assert.equal(toAttemptError({ code: '', message }, fallback).message, '网络连接失败，请检查网络后重试。')
}

// 4. Anything else shows the fallback plus the real code.
const unknown = toAttemptError({ code: '42501', message: 'permission denied for function start_assessment_attempt' }, fallback)
assert.equal(unknown.message, `${fallback}（错误代码：42501）`)
assert.equal(unknown.code, '42501')
assert.equal(toAttemptError({ message: 'odd' }, fallback).message, fallback)

// 5. A token error is refreshed and retried exactly once.
const makeClient = (results, refreshError = null) => {
  const calls = { rpc: 0, refresh: 0 }
  return {
    calls,
    rpc: async () => results[calls.rpc++],
    auth: { refreshSession: async () => { calls.refresh += 1; return { error: refreshError } } },
  }
}
const tokenError = { error: { code: 'PGRST303', message: 'JWT expired' } }
const ok = { data: { remainingAttempts: 3 }, error: null }

let client = makeClient([tokenError, ok])
assert.deepEqual(await callAttemptRpc(client, 'start_assessment_attempt', {}), ok)
assert.deepEqual(client.calls, { rpc: 2, refresh: 1 })

client = makeClient([tokenError, ok], { message: 'refresh failed' })
assert.deepEqual(await callAttemptRpc(client, 'start_assessment_attempt', {}), tokenError)
assert.deepEqual(client.calls, { rpc: 1, refresh: 1 })

client = makeClient([{ error: { code: 'P0001', message: 'ASSESSMENT_LIMIT_REACHED' } }])
await callAttemptRpc(client, 'start_assessment_attempt', {})
assert.deepEqual(client.calls, { rpc: 1, refresh: 0 })

client = makeClient([ok])
assert.deepEqual(await callAttemptRpc(client, 'get_assessment_attempt_status'), ok)
assert.deepEqual(client.calls, { rpc: 1, refresh: 0 })

console.log('assessment attempt error handling ok')
