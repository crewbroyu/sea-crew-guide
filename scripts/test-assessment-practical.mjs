import assert from 'node:assert/strict'
import { handleInterviewRequest } from '../server/interviewAi.js'
import {
  ENGLISH_PRACTICAL_TASKS,
  getPracticalEvaluationRequestId,
  getStarPracticalTask,
  STAR_FALLBACK_FOLLOW_UPS,
} from '../src/data/practicalAssessmentData.js'

const originalFetch = globalThis.fetch
const originalDateNow = Date.now
const originalAbortSignalTimeout = AbortSignal.timeout
const modelRequests = []
const providerTimeouts = []
let evaluationAttempts = 0
let mockNow = null
let testUserId = '00000000-0000-4000-8000-000000000099'
let providerOverride = null
let authorizationError = null
let completionCount = 0
let authorizationCount = 0
let usageRecordCount = 0
let recoveredEvaluation = null
const completedPayloads = []
const recoveryLookups = []

Date.now = () => mockNow ?? originalDateNow()
AbortSignal.timeout = (timeoutMs) => {
  providerTimeouts.push(timeoutMs)
  return originalAbortSignalTimeout(timeoutMs)
}

globalThis.fetch = async (url, options = {}) => {
  const target = String(url)
  if (target.includes('/auth/v1/user')) {
    return Response.json({
      id: testUserId,
      email: 'assessment@example.com',
      role: 'authenticated',
    })
  }
  if (target.includes('/rest/v1/rpc/record_ai_usage_event')) {
    usageRecordCount += 1
    return Response.json(1)
  }
  if (target.includes('/rest/v1/rpc/record_ai_operation_log')) return Response.json(1)
  if (target.includes('/rest/v1/user_skill_evidence')) {
    return (options.method || 'GET') === 'POST' ? new Response(null, { status: 201 }) : Response.json([])
  }
  if (target.includes('/rest/v1/user_skill_profiles')) {
    return (options.method || 'GET') === 'POST' ? new Response(null, { status: 201 }) : Response.json([])
  }
  if (target.includes('/rest/v1/rpc/get_assessment_evaluation_result')) {
    recoveryLookups.push(JSON.parse(options.body))
    return Response.json(recoveredEvaluation)
  }
  if (target.includes('/rest/v1/rpc/authorize_assessment_action')) {
    authorizationCount += 1
    return authorizationError
      ? Response.json({ message: authorizationError }, { status: 400 })
      : Response.json(true)
  }
  if (target.includes('/rest/v1/rpc/complete_assessment_attempt')) {
    completionCount += 1
    completedPayloads.push(JSON.parse(options.body))
    return Response.json({ completedAttempts: 1, remainingAttempts: 2, maxAttempts: 3 })
  }
  if (target.includes('/chat/completions')) {
    const request = JSON.parse(options.body)
    modelRequests.push(request)
    if (providerOverride) return providerOverride()
    const isEvaluation = request.response_format?.json_schema?.name === 'practical_assessment_result'
      || request.messages?.[1]?.content?.includes('"scoringRubric"')
    const evaluationInput = isEvaluation ? JSON.parse(request.messages[1].content) : null
    const forceFallback = evaluationInput?.serviceBackground === 'none'
    if (isEvaluation) evaluationAttempts += 1
    return Response.json({
      choices: [{
        message: {
          content: JSON.stringify(isEvaluation && (forceFallback || evaluationAttempts === 1) ? {
            summary: '首轮模拟不完整响应。',
          } : isEvaluation ? { result: {
            englishScore: '76',
            evidenceConfidence: 'medium',
            summary: '英语能够完成基本闭环，经历证据仍需补充结果。',
            strengths: ['能确认客人需求。'],
            priorities: ['补充个人行动和结果数据。'],
            integrityFlags: ['结果主要使用主观描述。'],
            evidenceHighlights: [
              { source: 'english', quote: 'I will check and update you.', finding: '包含处理动作和回报承诺。' },
              { source: 'star', quote: '我先核对订单。', finding: '包含个人行动证据。' },
            ],
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
          } } : {
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
  SUPABASE_SECRET_KEY: 'assessment-test-secret',
}
const headers = { authorization: 'Bearer assessment-test-token' }

try {
  assert.equal(
    getPracticalEvaluationRequestId('00000000-0000-4000-8000-000000000101'),
    'assessment-evaluate:00000000-0000-4000-8000-000000000101',
  )
  assert.equal(getPracticalEvaluationRequestId(''), '')
  const sceneTasks = [
    ...ENGLISH_PRACTICAL_TASKS,
    getStarPracticalTask('restaurant'),
    ...STAR_FALLBACK_FOLLOW_UPS,
  ]
  sceneTasks.forEach((task) => {
    assert.ok(task.roleName, `${task.id} requires a role name`)
    assert.ok(task.roleLabel, `${task.id} requires a role label`)
    assert.ok(task.roleState, `${task.id} requires a role state`)
    assert.ok(task.avatar?.startsWith('/images/assessment/'), `${task.id} requires an assessment avatar`)
    assert.ok(task.location, `${task.id} requires a location`)
    assert.ok(task.sceneTime, `${task.id} requires scene timing`)
    assert.ok(task.objective, `${task.id} requires an objective`)
    assert.ok(['Cherry', 'Serena', 'Ethan'].includes(task.voice), `${task.id} requires an approved natural voice`)
    assert.ok(['Chinese', 'English'].includes(task.languageType), `${task.id} requires a supported voice language`)
  })
  assert.notEqual(ENGLISH_PRACTICAL_TASKS[0].avatar, ENGLISH_PRACTICAL_TASKS[1].avatar)

  const missingAttempt = await handleInterviewRequest({
    method: 'POST',
    headers,
    body: {
      action: 'assessment_followup',
      mode: 'assessment',
      clientRequestId: 'assessment-followup-without-attempt',
      followUpIndex: 1,
      serviceBackground: 'restaurant',
      history: [],
    },
    env,
  })
  assert.equal(missingAttempt.status, 400)
  assert.equal(missingAttempt.body.error.code, 'ASSESSMENT_ATTEMPT_REQUIRED')

  const followUp = await handleInterviewRequest({
    method: 'POST',
    headers,
    body: {
      action: 'assessment_followup',
      mode: 'assessment',
      clientRequestId: 'assessment-followup-1',
      assessmentAttemptId: '00000000-0000-4000-8000-000000000101',
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
      assessmentAttemptId: '00000000-0000-4000-8000-000000000101',
      serviceBackground: 'restaurant',
      answers: practicalAnswers,
    },
    env,
  })
  assert.equal(evaluation.status, 200)
  assert.equal(evaluation.body.data.englishScore, 76)
  assert.equal(evaluation.body.data.serviceExperienceScore, 68)
  assert.equal(evaluation.body.data.evidenceConfidence, 'medium')
  assert.equal(evaluation.body.data.evidenceHighlights.length, 2)
  assert.equal(evaluation.body.data.attemptStatus.remainingAttempts, 2)
  assert.equal(completedPayloads[0].input_result_summary.requestId, 'assessment-evaluate-1')
  assert.equal(completedPayloads[0].input_result_summary.evaluation.summary, evaluation.body.data.summary)
  assert.equal(completedPayloads[0].input_result_summary.evaluation.attemptStatus, undefined)
  assert.ok(evaluation.body.data.evidenceHighlights[0].quote.includes('update'))
  assert.equal(modelRequests.length, 3)
  assert.equal(evaluationAttempts, 2)
  assert.ok(modelRequests[1].messages[0].content.includes('不得评价口音'))
  assert.equal(modelRequests[1].response_format.json_schema.strict, true)
  assert.equal(modelRequests[2].response_format.type, 'json_object')

  const fallbackEvaluation = await handleInterviewRequest({
    method: 'POST',
    headers,
    body: {
      action: 'assessment_evaluate',
      mode: 'assessment',
      clientRequestId: 'assessment-evaluate-fallback',
      assessmentAttemptId: '00000000-0000-4000-8000-000000000102',
      serviceBackground: 'none',
      answers: practicalAnswers,
    },
    env,
  })
  assert.equal(fallbackEvaluation.status, 200)
  assert.equal(fallbackEvaluation.body.data.scoringMode, 'rules_fallback')
  assert.equal(fallbackEvaluation.body.data.provider, 'rules')
  assert.ok(Number.isFinite(fallbackEvaluation.body.data.englishScore))
  assert.ok(Number.isFinite(fallbackEvaluation.body.data.serviceExperienceScore))
  assert.equal(fallbackEvaluation.body.data.evidenceHighlights.length, 2)
  assert.equal(modelRequests.length, 5)

  const scenarios = [
    ['timeout', () => { throw new DOMException('Timed out', 'TimeoutError') }, 1],
    ['abort', () => { throw new DOMException('Aborted', 'AbortError') }, 1],
    ['network', () => { throw new TypeError('fetch failed') }, 1],
    ['429', () => Response.json({ error: { code: 'rate_limit' } }, { status: 429 }), 1],
    ['500', () => new Response('upstream error', { status: 500 }), 1],
    ['503', () => new Response('unavailable', { status: 503 }), 1],
    ['body-read', () => ({ text: async () => { throw new TypeError('stream interrupted') } }), 1],
    ['invalid-json', () => new Response('not json'), 2],
    ['null-body', () => Response.json(null), 2],
    ['invalid-content', () => Response.json({ choices: [{ message: { content: '{broken' } }] }), 2],
    ['second-round-timeout', () => {
      if (modelRequests.at(-1).response_format.type === 'json_object') {
        throw new DOMException('Timed out', 'TimeoutError')
      }
      return Response.json({ choices: [] })
    }, 2],
  ]
  let userSequence = 200
  const evaluate = (overrides = {}, requestHeaders = headers) => {
    testUserId = `00000000-0000-4000-8000-${String(userSequence++).padStart(12, '0')}`
    return handleInterviewRequest({
      method: 'POST', headers: requestHeaders, env,
      body: {
        action: 'assessment_evaluate', mode: 'assessment',
        clientRequestId: `fault-test-${userSequence}`,
        assessmentAttemptId: '00000000-0000-4000-8000-000000000102',
        serviceBackground: 'restaurant', answers: practicalAnswers,
        ...overrides,
      },
    })
  }
  for (const [name, respond, expectedCalls] of scenarios) {
    providerOverride = respond
    const beforeCalls = modelRequests.length
    const beforeTimeouts = providerTimeouts.length
    const beforeCompletions = completionCount
    const result = await evaluate()
    assert.equal(result.status, 200, name)
    assert.equal(result.body.data.scoringMode, 'rules_fallback', name)
    assert.equal(result.body.data.provider, 'rules', name)
    assert.equal(result.body.data.model, null, name)
    assert.equal(result.body.data.englishScore, fallbackEvaluation.body.data.englishScore, name)
    assert.equal(result.body.data.serviceExperienceScore, fallbackEvaluation.body.data.serviceExperienceScore, name)
    assert.equal(result.body.data.attemptStatus.remainingAttempts, 2, name)
    assert.equal(modelRequests.length - beforeCalls, expectedCalls, name)
    const scenarioTimeouts = providerTimeouts.slice(beforeTimeouts)
    assert.equal(scenarioTimeouts.length, expectedCalls, name)
    assert.ok(scenarioTimeouts[0] > 0 && scenarioTimeouts[0] <= 45_000, name)
    if (expectedCalls === 2) assert.ok(scenarioTimeouts[1] > 0 && scenarioTimeouts[1] <= 18_000, name)
    assert.equal(completionCount - beforeCompletions, 1, name)
  }
  mockNow = originalDateNow()
  providerOverride = () => {
    mockNow += 61_000
    return Response.json({ choices: [] })
  }
  const beforeBudgetCalls = modelRequests.length
  const beforeBudgetTimeouts = providerTimeouts.length
  const budgetFallback = await evaluate()
  assert.equal(budgetFallback.status, 200)
  assert.equal(budgetFallback.body.data.scoringMode, 'rules_fallback')
  assert.equal(modelRequests.length - beforeBudgetCalls, 1)
  assert.deepEqual(providerTimeouts.slice(beforeBudgetTimeouts), [45_000])
  mockNow = null

  recoveredEvaluation = {
    englishScore: 71,
    serviceExperienceScore: 66,
    evidenceConfidence: 'medium',
    summary: '已保存的完整评分。',
    strengths: ['能够完成服务闭环。'],
    priorities: ['补充结果证据。'],
    integrityFlags: [],
    evidenceHighlights: [],
    englishBreakdown: fallbackEvaluation.body.data.englishBreakdown,
    starBreakdown: fallbackEvaluation.body.data.starBreakdown,
    scoringMode: 'ai',
    provider: 'dashscope',
    model: 'qwen3.5-plus',
  }
  providerOverride = () => { throw new Error('Recovered results must not call the provider') }
  const beforeRecoveryCalls = modelRequests.length
  const beforeRecoveryLookups = recoveryLookups.length
  const beforeRecoveryAuthorizations = authorizationCount
  const beforeRecoveryUsage = usageRecordCount
  const recovered = await handleInterviewRequest({
    method: 'POST', headers, env,
    body: {
      action: 'assessment_evaluate', mode: 'assessment',
      clientRequestId: 'assessment-evaluate-1',
      assessmentAttemptId: '00000000-0000-4000-8000-000000000101',
      serviceBackground: 'restaurant', answers: practicalAnswers,
    },
  })
  assert.equal(recovered.status, 200)
  assert.equal(recovered.body.meta.recovered, true)
  assert.equal(recovered.body.data.summary, '已保存的完整评分。')
  assert.equal(recovered.body.data.attemptStatus.remainingAttempts, 2)
  assert.deepEqual(recoveryLookups[beforeRecoveryLookups], {
    input_attempt_id: '00000000-0000-4000-8000-000000000101',
    input_request_id: 'assessment-evaluate-1',
  })
  assert.equal(modelRequests.length, beforeRecoveryCalls)
  assert.equal(authorizationCount, beforeRecoveryAuthorizations)
  assert.equal(usageRecordCount, beforeRecoveryUsage)
  recoveredEvaluation = null

  const beforeRejectedCalls = modelRequests.length
  const beforeRejectedCompletions = completionCount
  const incomplete = await evaluate({ answers: [] })
  assert.equal(incomplete.status, 400)
  assert.equal(incomplete.body.error.code, 'PRACTICAL_ASSESSMENT_INCOMPLETE')
  const unauthenticated = await evaluate({}, {})
  assert.equal(unauthenticated.status, 401)
  authorizationError = 'ASSESSMENT_ACTION_LIMIT_REACHED'
  const limited = await evaluate()
  assert.equal(limited.status, 429)
  assert.equal(limited.body.error.code, 'ASSESSMENT_ACTION_LIMIT_REACHED')
  assert.equal(modelRequests.length, beforeRejectedCalls)
  assert.equal(completionCount, beforeRejectedCompletions)

  console.log('Practical assessment API contract and provider fault scenarios passed.')
} finally {
  globalThis.fetch = originalFetch
  Date.now = originalDateNow
  AbortSignal.timeout = originalAbortSignalTimeout
}
