import assert from 'node:assert/strict'
import { handleInterviewRequest } from '../server/interviewAi.js'
import {
  buildMockDraft,
  clearMockDraft,
  getMockDraftResumeIndex,
  mockDraftKey,
  readMockDraft,
  writeMockDraft,
} from '../src/data/mockInterviewDraft.js'

const userId = '00000000-0000-4000-8000-000000000301'
const finalizeOutcomes = []
const usageEvents = []
const providerRequests = []
let providerReplies = []
let cloudAnswerCards = []
let unifiedProfileWrites = 0
let unifiedProfileFailures = 0
const unifiedProfilePayloads = []
let usageWriteError = false

const reply = (content) => Response.json({ choices: [{ message: { content } }] })
const questionScore = (index) => ({
  question: `Question ${index + 1}`,
  score: 12,
  comment: '回答有方向，但缺少具体结果。',
  improvements: ['补充具体行动和结果。'],
  strengths: ['回应了问题。'],
  improvedAnswer: 'In my last role I confirmed the guest request, solved it and followed up.',
  matchedKeywords: [],
  missedKeywords: [],
})
const mockReport = (count) => JSON.stringify({
  overallScore: 99,
  rating: 5,
  overallSuggestion: '优先重练低分题。',
  strengths: ['表达清楚。'],
  priorities: ['补充证据。'],
  dimensionScores: {
    speakingClarity: 72,
    interviewStructure: 68,
    jobKnowledge: 64,
    guestHandling: 70,
    problemSolving: 66,
    safetyJudgment: 62,
  },
  questionScores: Array.from({ length: count }, (_, index) => questionScore(index)),
})

globalThis.fetch = async (url, options = {}) => {
  const target = String(url)
  if (target.includes('/auth/v1/user')) {
    return Response.json({ id: userId, aud: 'authenticated', role: 'authenticated', email: 'mock@example.com', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00.000Z' })
  }
  if (target.includes('/rest/v1/user_access')) return Response.json({ access_status: 'active', role: 'learner', unlocked: true })
  if (target.includes('/rest/v1/user_entitlements')) {
    return Response.json({ user_id: userId, product_code: 'bar_server_pack', status: 'active', starts_at: '2026-01-01T00:00:00.000Z', expires_at: '2027-01-01T00:00:00.000Z', ai_feedback_limit: 100, mock_interview_limit: 10 })
  }
  if (target.includes('/rest/v1/interview_answer_profiles')) return Response.json({ answer_cards: cloudAnswerCards })
  if (target.includes('/rest/v1/rpc/upsert_unified_skill_evidence')) {
    unifiedProfileWrites += 1
    unifiedProfilePayloads.push(JSON.parse(options.body || '{}'))
    if (unifiedProfileFailures > 0) {
      unifiedProfileFailures -= 1
      return Response.json({ message: 'simulated database outage' }, { status: 500 })
    }
    return Response.json({ readinessScore: 67, evidenceCount: 1 })
  }
  if (target.includes('/rest/v1/rpc/reserve_ai_usage_quota')) return Response.json({ reservation_id: '00000000-0000-4000-8000-000000000401', unlimited: false })
  if (target.includes('/rest/v1/rpc/finalize_ai_usage_reservation')) {
    finalizeOutcomes.push(JSON.parse(options.body || '{}').input_outcome)
    return Response.json(true)
  }
  if (target.includes('/rest/v1/rpc/record_ai_usage_event')) {
    if (usageWriteError) return Response.json({ message: 'usage write failed' }, { status: 500 })
    usageEvents.push(JSON.parse(options.body || '{}').input_action)
    return Response.json(1)
  }
  if (target.includes('/rest/v1/rpc/record_ai_operation_log')) return Response.json(1)
  if (target.includes('/chat/completions')) {
    providerRequests.push(JSON.parse(options.body || '{}'))
    const next = providerReplies.shift()
    if (next === undefined) throw new Error('Unexpected provider call')
    return reply(next)
  }
  throw new Error(`Unexpected request: ${target}`)
}

const env = {
  DASHSCOPE_API_KEY: 'mock-test-key',
  DASHSCOPE_BASE_URL: 'https://dashscope.test/v1',
  SUPABASE_URL: 'https://supabase.test',
  SUPABASE_ANON_KEY: 'mock-test-anon-key',
  SUPABASE_SECRET_KEY: 'mock-test-secret-key',
}
const headers = { authorization: 'Bearer mock-test-token' }
const call = (body) => handleInterviewRequest({ method: 'POST', headers, env, body })
const resetLedger = () => {
  finalizeOutcomes.length = 0
  usageEvents.length = 0
  providerRequests.length = 0
  usageWriteError = false
}

// 1. A follow-up check that declines to ask is released, not charged and not counted as a failure.
resetLedger()
providerReplies = [JSON.stringify({ shouldFollowUp: false, question: '', focus: 'evidence' })]
let result = await call({ action: 'mock_followup', mode: 'premium_mock', position: 'Bar Server', mainQuestion: 'Why this job?', answer: 'I enjoy guest service and have two years of bar experience.', clientRequestId: 'no-follow-up' })
assert.equal(result.status, 200)
assert.equal(result.body.data.shouldFollowUp, false)
assert.deepEqual(usageEvents, [], 'no follow-up must not record usage')
assert.deepEqual(finalizeOutcomes, ['released'], 'no follow-up must release the reservation')

// 2. An actual follow-up is charged once.
resetLedger()
providerReplies = [JSON.stringify({ shouldFollowUp: true, question: 'What did you personally do?', focus: 'ownership' })]
result = await call({ action: 'mock_followup', mode: 'premium_mock', position: 'Bar Server', mainQuestion: 'Tell me about a complaint.', answer: 'We fixed it.', clientRequestId: 'real-follow-up' })
assert.equal(result.status, 200)
assert.deepEqual(usageEvents, ['evaluate'])
assert.deepEqual(finalizeOutcomes, ['completed'])

const questions = Array.from({ length: 9 }, (_, index) => ({ id: `q${index + 1}`, question: `Question ${index + 1}` }))
const answers = questions.map((_, index) => ({ textAnswer: `Answer ${index + 1}` }))
const mockBody = (clientRequestId) => ({ action: 'evaluate', mode: 'premium_mock', position: 'Bar Server', questions, answers, clientRequestId })

// 3. A report missing one question is retried; the saved score comes from the complete report.
resetLedger()
providerReplies = [mockReport(8), mockReport(9)]
result = await call(mockBody('retry-missing-question'))
assert.equal(result.status, 200)
assert.equal(providerRequests.length, 2, 'an incomplete report must be retried once')
assert.equal(result.body.data.questionScores.length, 9)
assert.equal(result.body.data.overallScore, 60, 'total must be derived from question scores, not the model claim')
assert.equal(providerRequests[0].max_completion_tokens, 8_192, '9-question budget must stay within the provider ceiling')
assert.deepEqual(usageEvents, ['mock_interview'])
assert.deepEqual(finalizeOutcomes, ['completed'])
assert.equal(unifiedProfileWrites, 1)

// 4. A truncated report is retried instead of failing immediately.
resetLedger()
providerReplies = ['{"overallScore": 70, "questionScores": [', mockReport(9)]
result = await call(mockBody('retry-truncated'))
assert.equal(result.status, 200)
assert.equal(providerRequests.length, 2)

// 4b. Quoted numeric scores are accepted rather than retried into a failure.
resetLedger()
const quotedReport = JSON.parse(mockReport(9))
quotedReport.questionScores = quotedReport.questionScores.map((score) => ({ ...score, score: String(score.score) }))
providerReplies = [JSON.stringify(quotedReport)]
result = await call(mockBody('quoted-scores'))
assert.equal(result.status, 200)
assert.equal(providerRequests.length, 1, 'quoted scores must pass the contract on the first attempt')
assert.equal(result.body.data.overallScore, 60)

// 4c. Shorter interviews keep a budget that grows with the question count.
resetLedger()
providerReplies = [mockReport(7)]
result = await call({ ...mockBody('seven-questions'), questions: questions.slice(0, 7), answers: answers.slice(0, 7) })
assert.equal(result.status, 200)
assert.equal(providerRequests[0].max_completion_tokens, 7_100)

// 4d. Oversized answer cards are trimmed to a fixed budget; summaries come before raw answers.
resetLedger()
const longText = (label) => `${label} `.repeat(400)
cloudAnswerCards = Array.from({ length: 8 }, (_, index) => ({
  id: `card-${index}`,
  title: `Card ${index}`,
  completed: true,
  answers: Object.fromEntries(Array.from({ length: 8 }, (_, field) => [`field${field}`, longText(`answer-${index}-${field}`)])),
  generated: { concise: longText(`concise-${index}`), basic: longText(`basic-${index}`) },
}))
providerReplies = [JSON.stringify({ shouldFollowUp: false, question: '', focus: 'evidence' })]
result = await call({ action: 'mock_followup', mode: 'premium_mock', position: 'Bar Server', mainQuestion: 'Tell me about yourself.', answer: 'I have worked in hotel bars for two years.', clientRequestId: 'card-budget' })
assert.equal(result.status, 200)
const promptCards = JSON.parse(providerRequests[0].messages[1].content).privatePreparedAnswerCards
const promptChars = promptCards.reduce((total, card) => total + card.generated.length
  + card.answerEvidence.reduce((sum, item) => sum + item.key.length + item.answer.length, 0), 0)
assert.ok(promptChars <= 6_000, `answer-card context must stay within budget (got ${promptChars})`)
assert.ok(promptCards.every((card) => !card.generated.includes('basic-')), 'the concise summary is preferred over the full answer')
assert.ok(promptCards[0].generated.startsWith('concise-0'), 'the first card summary is included before any raw answers')
assert.equal(result.body.data.usedPreparedAnswerCards, true)
cloudAnswerCards = []

// 5. Two incomplete reports are rejected: nothing is saved or charged, and the attempt counts as failed.
resetLedger()
providerReplies = [mockReport(8), mockReport(7)]
result = await call(mockBody('reject-incomplete'))
assert.equal(result.status, 502)
assert.equal(result.body.error.code, 'INVALID_AI_RESPONSE')
assert.deepEqual(usageEvents, [], 'an incomplete report must not be charged')
assert.deepEqual(finalizeOutcomes, ['failed'])

// 5b. A paid usage-write failure must not create capability evidence.
resetLedger()
const writesBeforeUsageFailure = unifiedProfileWrites
usageWriteError = true
providerReplies = [mockReport(9)]
result = await call(mockBody('usage-write-failure'))
assert.equal(result.status, 503)
assert.equal(result.body.error.code, 'USAGE_RECORD_FAILED')
assert.equal(unifiedProfileWrites, writesBeforeUsageFailure)
assert.deepEqual(finalizeOutcomes, ['failed'])

// 5c. A transient capability write failure is retried once and the score is still returned.
resetLedger()
let writesBefore = unifiedProfileWrites
unifiedProfileFailures = 1
providerReplies = [mockReport(9)]
result = await call(mockBody('profile-write-transient'))
assert.equal(result.status, 200)
assert.equal(unifiedProfileWrites - writesBefore, 2, 'one immediate retry')
assert.equal(result.body.data.unifiedProfile.evidenceCount, 1)
assert.equal(result.body.data.unifiedProfileSyncPending, undefined)
assert.deepEqual(usageEvents, ['mock_interview'])
assert.deepEqual(finalizeOutcomes, ['completed'])

// 5d. A persistent capability write failure must not discard a charged mock interview result.
resetLedger()
writesBefore = unifiedProfileWrites
unifiedProfileFailures = 2
providerReplies = [mockReport(9)]
result = await call(mockBody('profile-write-outage'))
assert.equal(result.status, 200, 'the paid score is returned even when the profile write fails')
assert.equal(result.body.data.questionScores.length, 9)
assert.equal(result.body.data.unifiedProfileSyncPending, true)
assert.equal(result.body.data.unifiedProfile, undefined)
assert.equal(unifiedProfileWrites - writesBefore, 2)
assert.deepEqual(usageEvents, ['mock_interview'], 'charged exactly once')
assert.deepEqual(finalizeOutcomes, ['completed'])
unifiedProfileFailures = 0

// 6. Drafts are per account, per position, bounded in age, and resume at the first unanswered question.
const values = new Map()
const storage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
}
const savedAt = '2026-10-06T08:00:00.000Z'
const now = Date.parse(savedAt) + 60_000
const draft = buildMockDraft({
  position: 'bar_server',
  interviewer: { id: 1, name: 'Sarah Johnson', title: 'HR Manager', initial: 'SJ', color: 'bg-purple-500' },
  questions: [{ id: 'q1' }, { id: 'q1-follow-up', isFollowUp: true }, { id: 'q2' }],
  answers: ['first', 'follow-up answer'],
  answerDetails: [{ questionId: 'q1', textAnswer: 'first' }, { questionId: 'q1-follow-up', textAnswer: 'follow-up answer' }],
  followUpChecks: 1,
  followUps: 1,
  finalEvaluationRequestId: null,
  savedAt,
})
writeMockDraft(storage, 'user-a', draft)
assert.ok(values.has(mockDraftKey('user-a')))
assert.deepEqual(readMockDraft(storage, 'user-a', 'bar_server', now).questions[1], { id: 'q1-follow-up', isFollowUp: true })
assert.equal(getMockDraftResumeIndex(readMockDraft(storage, 'user-a', 'bar_server', now)), 2)
assert.equal(readMockDraft(storage, 'user-b', 'bar_server', now), null, 'another account must not see the draft')
assert.equal(readMockDraft(storage, 'user-a', 'retail', now), null, 'another position must not resume the draft')
assert.equal(readMockDraft(storage, 'user-a', 'bar_server', now + 25 * 60 * 60 * 1000), null, 'stale drafts expire')
writeMockDraft(storage, 'user-a', { ...draft, answers: ['only one'] })
assert.equal(readMockDraft(storage, 'user-a', 'bar_server', now), null, 'answers and details must stay aligned')
writeMockDraft(storage, 'user-a', { ...draft, answers: ['a', 'b', 'c'], answerDetails: [{}, {}, {}], finalEvaluationRequestId: 'final-1' })
const scoringOnly = readMockDraft(storage, 'user-a', 'bar_server', now)
assert.equal(getMockDraftResumeIndex(scoringOnly), 3, 'a fully answered draft resumes at scoring')
assert.equal(scoringOnly.finalEvaluationRequestId, 'final-1', 'the final score request id survives a refresh')
clearMockDraft(storage, 'user-a')
assert.equal(readMockDraft(storage, 'user-a', 'bar_server', now), null)

console.log('Mock interview reliability passed: free no-follow-up checks, charged follow-ups, contract retry, truncated retry, rejected incomplete reports, and account-scoped resumable drafts.')
