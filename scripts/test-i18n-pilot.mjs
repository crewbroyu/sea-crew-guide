import assert from 'node:assert/strict'
import { isBilingualRoute, readPreferredLanguage, resolveRouteLanguage } from '../src/i18n/language.js'
import zhResources from '../src/i18n/locales/zh/index.js'
import enResources from '../src/i18n/locales/en/index.js'
import {
  barServerTrialScenarios,
  getBarServerTrialScenarios,
  getReadinessLabel,
  getScoreDeltaMessage,
} from '../src/data/barServerTrial.js'
import { buildBarServerTrialReport } from '../src/data/barServerTrialReport.js'
import { readAssessmentTrialContext } from '../src/data/assessmentExperienceBridge.js'
import { handleInterviewRequest } from '../server/interviewAi.js'

const CJK = /[一-鿿]/

const collectStrings = (value, path = '', found = []) => {
  if (typeof value === 'string') found.push([path, value])
  else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) collectStrings(child, `${path}.${key}`, found)
  }
  return found
}

const collectKeys = (value, path = '') => (
  value && typeof value === 'object' && !Array.isArray(value)
    ? Object.entries(value).flatMap(([key, child]) => collectKeys(child, path ? `${path}.${key}` : key))
    : [path]
)

// Route language: only translated pages honour English, and a ?lang= link beats the stored preference.
{
  assert.equal(isBilingualRoute('/programs/bar-server/trial'), true)
  assert.equal(isBilingualRoute('/programs/bar-server/foundation'), false)
  assert.equal(resolveRouteLanguage({ pathname: '/programs/bar-server/trial', preferred: 'en' }), 'en')
  assert.equal(resolveRouteLanguage({ pathname: '/programs/bar-server/foundation', preferred: 'en' }), 'zh')
  assert.equal(resolveRouteLanguage({ pathname: '/programs/bar-server/trial', search: '?lang=en', preferred: 'zh' }), 'en')
  assert.equal(resolveRouteLanguage({ pathname: '/programs/bar-server/trial', search: '?lang=fr', preferred: 'zh' }), 'zh')
  assert.equal(resolveRouteLanguage({ pathname: '/', search: '?lang=en', preferred: 'en' }), 'zh')
  assert.equal(readPreferredLanguage({ getItem: () => 'en' }), 'en')
  assert.equal(readPreferredLanguage({ getItem: () => 'de' }), 'zh')
  assert.equal(readPreferredLanguage({ getItem: () => { throw new Error('blocked') } }), 'zh')
}

// UI strings: both languages define the same keys, and the English copy has no Chinese left in it.
{
  for (const namespace of Object.keys(zhResources)) {
    const zhKeys = collectKeys(zhResources[namespace]).filter((key) => key && !key.startsWith('apiErrors'))
    const enKeys = collectKeys(enResources[namespace]).filter((key) => key && !key.startsWith('apiErrors'))
    assert.deepEqual(enKeys.sort(), zhKeys.sort(), `English ${namespace} keys must match Chinese`)
    for (const [path, text] of collectStrings(enResources[namespace])) {
      assert.equal(CJK.test(text), false, `English ${namespace}${path} still contains Chinese: ${text}`)
    }
  }
}

// Scenario content: the Chinese course is untouched and the English one only swaps learner-facing text.
const AI_ONLY_FIELDS = new Set(['focus', 'interviewerQuestion', 'keywords'])
{
  assert.equal(getBarServerTrialScenarios('zh'), barServerTrialScenarios)
  assert.equal(getBarServerTrialScenarios('fr'), barServerTrialScenarios)
  const english = getBarServerTrialScenarios('en')
  assert.equal(english.length, barServerTrialScenarios.length)

  english.forEach((scenario, index) => {
    const chinese = barServerTrialScenarios[index]
    assert.equal(scenario.id, chinese.id)
    for (const field of AI_ONLY_FIELDS) assert.deepEqual(scenario[field], chinese[field], `${field} is sent to the AI and must not change`)
    assert.deepEqual(scenario.lesson.sentencePatterns, chinese.lesson.sentencePatterns)
    assert.deepEqual(scenario.lesson.dialogue.map((line) => line.text), chinese.lesson.dialogue.map((line) => line.text))
    assert.deepEqual(
      scenario.lesson.decisionCheck.options.map(({ id, correct }) => ({ id, correct })),
      chinese.lesson.decisionCheck.options.map(({ id, correct }) => ({ id, correct })),
    )
    assert.deepEqual(scenario.lesson.vocabulary.map((item) => item.term), chinese.lesson.vocabulary.map((item) => item.term))

    for (const [path, text] of collectStrings(scenario)) {
      if (AI_ONLY_FIELDS.has(path.split('.')[1])) continue
      assert.equal(CJK.test(text), false, `English scenario ${scenario.id}${path} still contains Chinese: ${text}`)
    }
  })
}

// Score labels and the completion report follow the requested language.
{
  assert.equal(getReadinessLabel(85), '回答已经接近可面试状态')
  assert.equal(getReadinessLabel(85, 'en'), 'Your answer is close to interview-ready')
  assert.equal(getScoreDeltaMessage(-3), '第二次分数暂时下降并不代表退步，请放慢速度，先只改一个关键问题。')
  assert.match(getScoreDeltaMessage(-3, 'en'), /does not mean you got worse/)

  const attempt = (score) => ({ evaluation: { overallScore: score, questionScores: [{}] } })
  const attemptsByScenario = Object.fromEntries(
    barServerTrialScenarios.map((scenario, index) => [scenario.id, [attempt(40 + index * 5), attempt(55 + index * 10)]]),
  )
  const englishReport = buildBarServerTrialReport({ attemptsByScenario, currentStage: 'waiting_onboard', language: 'en' })
  for (const [path, text] of collectStrings(englishReport)) {
    assert.equal(CJK.test(text), false, `English report${path} still contains Chinese: ${text}`)
  }
  const chineseReport = buildBarServerTrialReport({ attemptsByScenario, currentStage: 'waiting_onboard' })
  assert.equal(chineseReport.scenarios[0].title, '饮品推荐')
  assert.equal(englishReport.scenarios[0].title, 'Drink recommendation')
  assert.equal(englishReport.readiness, chineseReport.readiness)
}

// Assessment labels shown on the trial page follow the page language.
{
  const search = '?source=assessment&scenario=1&gap=english&concern=interview&stage=waiting_onboard'
  assert.equal(readAssessmentTrialContext(search).gapLabel, '英语服务沟通')
  const english = readAssessmentTrialContext(search, 'en')
  assert.equal(english.gapLabel, 'English for guest service')
  assert.equal(english.concernLabel, 'interview performance')
  assert.equal(english.stageLabel, 'contract signed, waiting to join the ship')
}

// Server: only an English request switches the prompt and response schema to English feedback.
{
  const providerRequests = []
  let providerEvaluation = null
  globalThis.fetch = async (url, options) => {
    const target = String(url)
    if (target.includes('/auth/v1/user')) {
      return Response.json({
        id: '00000000-0000-4000-8000-000000000001',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'i18n-test@example.com',
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: {},
        created_at: '2026-01-01T00:00:00.000Z',
      })
    }
    if (target.includes('/rest/v1/rpc/reserve_ai_usage_quota')) {
      return Response.json({ reservation_id: '00000000-0000-4000-8000-000000000003', unlimited: false })
    }
    if (target.includes('/rest/v1/rpc/')) return Response.json(true)
    if (target.includes('/rest/v1/ai_usage_events')) {
      return new Response(null, { status: 200, headers: { 'Content-Range': '0-0/0' } })
    }
    if (target.includes('/chat/completions')) {
      providerRequests.push(JSON.parse(options?.body || '{}'))
      return Response.json({ choices: [{ message: { content: JSON.stringify(providerEvaluation) } }] })
    }
    throw new Error(`Unexpected request: ${target}`)
  }

  let requestSequence = 0
  const evaluate = (language) => handleInterviewRequest({
    method: 'POST',
    headers: { authorization: 'Bearer i18n-test-token' },
    body: {
      action: 'evaluate',
      mode: 'scenario_trial',
      position: 'Bar Server',
      scenarioId: 'bar_server_complaint_recovery_02',
      clientRequestId: `i18n-test-${++requestSequence}`,
      ...(language ? { language } : {}),
      questions: [{ id: 'bar_server_complaint_recovery_02', question: 'Recover the service.', focus: 'Recover.', keywords: ['apologize'] }],
      answers: [{ textAnswer: 'Sorry about that.', durationSeconds: 3 }],
    },
    env: {
      DASHSCOPE_API_KEY: 'i18n-test-key',
      DASHSCOPE_BASE_URL: 'https://dashscope.test/v1',
      SUPABASE_URL: 'https://supabase.test',
      SUPABASE_ANON_KEY: 'i18n-test-anon-key',
    },
  })

  providerEvaluation = {
    overallScore: 30,
    rating: 2,
    overallSuggestion: 'Acknowledge the wait before you offer a fix.',
    strengths: ['You apologised.'],
    priorities: ['Confirm the order.'],
    questionScores: [{
      question: 'Recover the service.',
      score: 6,
      comment: 'You said sorry, but did not confirm the order or offer a fix.',
      strengths: ['You apologised.'],
      improvements: ['Confirm the original order.'],
      improvedAnswer: 'I am sorry the drink was not what you expected.',
      knowledgeNotes: ['Free drinks may need supervisor approval.'],
      usefulPhrases: ['May I confirm what you ordered?'],
      retryChecklist: ['Offer a remake or replacement.'],
      matchedKeywords: [],
      missedKeywords: [],
    }],
  }

  const chinese = await evaluate()
  assert.equal(chinese.status, 200)
  const chinesePrompt = providerRequests.at(-1)
  assert.match(chinesePrompt.messages[0].content, /点评和总体建议用简体中文/)
  assert.equal(chinesePrompt.response_format.json_schema.schema.properties.overallSuggestion.description, 'Specific next action in Simplified Chinese.')

  const english = await evaluate('en')
  assert.equal(english.status, 200)
  const englishPrompt = providerRequests.at(-1)
  assert.match(englishPrompt.messages[0].content, /CEFR B1/)
  assert.doesNotMatch(englishPrompt.messages[0].content, /点评和总体建议用简体中文/)
  assert.equal(englishPrompt.response_format.json_schema.schema.properties.overallSuggestion.description, 'Specific next action in plain, simple English.')
  assert.doesNotMatch(JSON.stringify(englishPrompt.response_format), /in Chinese/)
  assert.match(JSON.parse(englishPrompt.messages[1].content).requiredOutput.overallSuggestion, /^Plain English/)
  assert.equal(english.body.data.questionScores[0].comment, providerEvaluation.questionScores[0].comment)
}

// Client: the trial page's language must reach the request body. Production once dropped it here,
// so the server above was never asked for English.
{
  const { readFile } = await import('node:fs/promises')
  const serviceSource = (await readFile(new URL('../src/services/interviewAiService.js', import.meta.url), 'utf8'))
    .replace("import { supabase } from '../supabase'", 'const supabase = globalThis.__i18nSupabase')
  assert.notEqual(serviceSource.indexOf('globalThis.__i18nSupabase'), -1, 'supabase import must be stubbed')
  globalThis.__i18nSupabase = { auth: { getSession: async () => ({ data: { session: { access_token: 'token' } }, error: null }) } }
  globalThis.window = globalThis.window || { setTimeout, clearTimeout }
  const service = await import(`data:text/javascript;base64,${Buffer.from(serviceSource).toString('base64')}`)

  const sentBodies = []
  globalThis.fetch = async (url, options) => {
    sentBodies.push(JSON.parse(options.body))
    return Response.json({ success: true, data: {} })
  }
  const request = { mode: 'scenario_trial', position: 'Bar Server', questions: [], answers: [], scenarioId: 'bar_server_drink_recommendation_01' }
  await service.evaluateInterviewWithAi({ ...request, language: 'en' })
  await service.evaluateInterviewWithAi(request)
  assert.equal(sentBodies[0].language, 'en')
  assert.equal('language' in sentBodies[1], false, 'Chinese requests must stay unchanged')
}

console.log('i18n pilot passed: route language, key parity, English course content, report copy, assessment labels, English AI prompts and client language forwarding.')
