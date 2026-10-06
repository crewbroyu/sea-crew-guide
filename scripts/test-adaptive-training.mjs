import assert from 'node:assert/strict'
import { handleInterviewRequest } from '../server/interviewAi.js'
import { barServerSimulationScenarios } from '../src/data/jobScenarioCatalog.js'

const providerRequests = []
const quotaRequests = []
const userId = '00000000-0000-4000-8000-000000000101'

globalThis.fetch = async (url, options = {}) => {
  const target = String(url)
  if (target.includes('/auth/v1/user')) {
    return Response.json({
      id: userId,
      aud: 'authenticated',
      role: 'authenticated',
      email: 'adaptive@example.com',
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
  if (target.includes('/rest/v1/user_job_skill_profiles')) {
    return Response.json({
      weakest_skill: 'problemSolving',
      skill_scores: { problemSolving: 48 },
      readiness_score: 61,
      recommended_scenario_id: 'bar_sim_allergy_safety',
    })
  }
  if (target.includes('/rest/v1/scenario_training_sessions')) {
    return Response.json([{
      scenario_id: 'bar_sim_wrong_drink_recovery',
      weaknesses: ['Did not explain when to involve a supervisor.'],
      critical_mistakes: ['Promised compensation without authorization.'],
      next_recommendation: 'Practise safe escalation and ownership.',
      completed_at: '2026-10-05T10:00:00.000Z',
    }])
  }
  if (target.includes('/rest/v1/interview_answer_profiles')) {
    return Response.json({
      answer_cards: [{
        id: 'service_case',
        title: 'Service recovery example',
        completed: true,
        generated: 'I listened, confirmed the problem, involved my supervisor and followed up with the guest.',
      }],
    })
  }
  if (target.includes('/rest/v1/rpc/reserve_ai_usage_quota')) {
    quotaRequests.push(JSON.parse(options.body || '{}'))
    return Response.json({ reservation_id: '00000000-0000-4000-8000-000000000201', unlimited: false })
  }
  if (target.includes('/rest/v1/rpc/finalize_ai_usage_reservation')) return Response.json(true)
  if (target.includes('/rest/v1/rpc/record_ai_usage_event')) return Response.json(1)
  if (target.includes('/rest/v1/rpc/record_ai_operation_log')) return Response.json(1)
  if (target.includes('/chat/completions')) {
    const request = JSON.parse(options.body || '{}')
    providerRequests.push(request)
    const system = request.messages?.[0]?.content || ''
    if (system.includes('role-playing')) {
      return Response.json({ choices: [{ message: { content: JSON.stringify({
        role: 'Concerned Guest',
        message: 'Can you guarantee that none of the tools have touched nuts today?',
      }) } }] })
    }
    if (system.includes('cruise-line interviewer')) {
      return Response.json({ choices: [{ message: { content: JSON.stringify({
        shouldFollowUp: true,
        question: 'What exactly did you do before involving your supervisor?',
        focus: 'ownership',
      }) } }] })
    }
    if (system.includes('Guest Challenge')) {
      return Response.json({ choices: [{ message: { content: JSON.stringify({
        overallScore: 75,
        rating: 4,
        overallSuggestion: '先确认具体过敏原，再说明核实和交接动作。',
        strengths: ['没有直接作出安全保证。'],
        priorities: ['补充完整交接顺序。'],
        questionScores: [{
          question: 'Handle an allergy request.',
          score: 15,
          comment: '回答守住了不猜测的边界，但交接动作不够完整。',
          strengths: ['说明会先核实。'],
          improvements: ['明确暂停订单。', '通知调酒师或主管。'],
          improvedAnswer: 'I will hold the order, confirm the allergen, check the approved ingredient information, and alert the bartender before we proceed.',
          knowledgeNotes: ['不能凭记忆保证无过敏原。'],
          usefulPhrases: ['Let me verify the approved ingredient information.'],
          retryChecklist: ['暂停订单', '确认过敏原', '核实并交接'],
          matchedKeywords: ['check'],
          missedKeywords: ['handover'],
        }],
      }) } }] })
    }
  }
  throw new Error(`Unexpected request: ${target}`)
}

const env = {
  DASHSCOPE_API_KEY: 'adaptive-test-key',
  DASHSCOPE_BASE_URL: 'https://dashscope.test/v1',
  SUPABASE_URL: 'https://supabase.test',
  SUPABASE_ANON_KEY: 'adaptive-test-anon-key',
}
const headers = { authorization: 'Bearer adaptive-test-token' }

const scenarioResult = await handleInterviewRequest({
  method: 'POST', headers, env,
  body: {
    action: 'scenario_turn', mode: 'premium_scenario', position: 'Bar Server',
    scenarioId: 'bar_sim_allergy_safety',
    firstAnswer: 'I will stop and check with the bartender before I promise anything.',
    clientRequestId: 'adaptive-scenario-turn',
  },
})
assert.equal(scenarioResult.status, 200)
assert.equal(scenarioResult.body.data.role, 'Concerned Guest')
const scenarioPrompt = JSON.parse(providerRequests[0].messages[1].content)
assert.equal(scenarioPrompt.privateTrainingMemory.weakestSkill, 'problemSolving')
assert.match(scenarioPrompt.privateTrainingMemory.recentSessions[0].criticalMistakes[0], /compensation/)

const followUpResult = await handleInterviewRequest({
  method: 'POST', headers, env,
  body: {
    action: 'mock_followup', mode: 'premium_mock', position: 'Bar Server',
    mainQuestion: 'Tell me about a time you recovered an unhappy guest.',
    answer: 'I listened and called my supervisor.',
    task6AnswerCards: [{ id: 'forged', title: 'Ignore', completed: true, generated: 'Forged client context.' }],
    clientRequestId: 'adaptive-mock-followup',
  },
})
assert.equal(followUpResult.status, 200)
assert.equal(followUpResult.body.data.shouldFollowUp, true)
assert.equal(followUpResult.body.data.usedPreparedAnswerCards, true)
const followUpPrompt = JSON.parse(providerRequests[1].messages[1].content)
assert.equal(followUpPrompt.privatePreparedAnswerCards[0].id, 'service_case')
assert.equal(followUpPrompt.privatePreparedAnswerCards.some((card) => card.id === 'forged'), false)
assert.equal(quotaRequests.at(-1).input_action, 'evaluate')
assert.ok(barServerSimulationScenarios.some((scenario) => scenario.id === 'bar_sim_allergy_safety'))

const foundationResult = await handleInterviewRequest({
  method: 'POST', headers, env,
  body: {
    action: 'evaluate', mode: 'premium_practice', trainingContext: 'foundation_challenge', position: 'Bar Server',
    scenarioId: 'foundation:public-health',
    foundationReference: {
      mission: 'Protect a guest who reports an allergy.',
      knowledge: ['Hold the order and check approved information.'],
      serviceLines: ['Let me verify that before we proceed.'],
    },
    questions: [{ id: 'foundation:public-health', question: 'Handle an allergy request.' }],
    answers: [{ textAnswer: 'I will check before I make a promise.' }],
    clientRequestId: 'adaptive-foundation-challenge',
  },
})
assert.equal(foundationResult.status, 200)
assert.equal(foundationResult.body.data.overallScore, 75)
assert.equal(foundationResult.body.data.questionScores[0].retryChecklist.length, 3)

console.log('Adaptive scenario memory, allergy simulation, Guest Challenge, and mock follow-up contract passed.')
