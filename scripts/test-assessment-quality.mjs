import assert from 'node:assert/strict'
import {
  ALL_QUESTIONS,
  DIMENSIONS,
  ENGLISH_QUESTIONS,
  SERVICE_BACKGROUNDS,
  WORK_PREFERENCE_QUESTIONS,
} from '../src/data/assessmentData.js'
import {
  calculateDimensionScore,
  calculateWorkPreferenceProfile,
} from '../src/data/assessmentScoring.js'

const questionSets = DIMENSIONS.flatMap((dimension) => (
  dimension.id === 'service_experience'
    ? SERVICE_BACKGROUNDS.map((background) => ({
        name: `${dimension.id}:${background.id}`,
        questions: ALL_QUESTIONS[dimension.id][background.id],
      }))
    : [{ name: dimension.id, questions: ALL_QUESTIONS[dimension.id] }]
))

assert.equal(DIMENSIONS.reduce((sum, dimension) => sum + dimension.weight, 0), 1)

questionSets.forEach(({ name, questions }) => {
  assert.ok(questions.length >= 5, `${name} should have at least five questions`)
  assert.equal(new Set(questions.map((question) => question.id)).size, questions.length, `${name} has duplicate question IDs`)

  questions.forEach((question) => {
    assert.equal(question.options.length, 4, `${question.id} should have four options`)
    assert.equal(new Set(question.options.map((option) => option.id)).size, 4, `${question.id} has duplicate option IDs`)

    if (!question.options.some((option) => option.jobSignals)) {
      const bestOption = question.options.find((option) => option.score === question.maxScore)
      const longestLength = Math.max(...question.options.map((option) => option.text.length))
      assert.ok(bestOption, `${question.id} has no best option`)
      assert.ok(bestOption.text.length < longestLength, `${question.id} can be solved by choosing the longest option`)
    }
  })
})

assert.ok(
  new Set(ENGLISH_QUESTIONS.map((question) => question.options.findIndex((option) => option.score === question.maxScore))).size >= 3,
  'English answer positions are too predictable',
)

const perfectEnglishAnswers = Object.fromEntries(
  ENGLISH_QUESTIONS.map((question) => [
    question.id,
    question.options.find((option) => option.score === question.maxScore).id,
  ])
)
assert.equal(calculateDimensionScore(perfectEnglishAnswers, ENGLISH_QUESTIONS), 100)

const buildPreferenceAnswers = (jobId) => Object.fromEntries(
  WORK_PREFERENCE_QUESTIONS.map((question) => {
    const selected = question.options.reduce((best, option) => (
      (option.jobSignals?.[jobId] || 0) > (best.jobSignals?.[jobId] || 0) ? option : best
    ))
    return [question.id, selected.id]
  })
)

const retailProfile = calculateWorkPreferenceProfile(
  buildPreferenceAnswers('retail'),
  WORK_PREFERENCE_QUESTIONS,
)
const scatteredProfile = calculateWorkPreferenceProfile(
  Object.fromEntries(WORK_PREFERENCE_QUESTIONS.map((question, index) => [
    question.id,
    question.options[index % question.options.length].id,
  ])),
  WORK_PREFERENCE_QUESTIONS,
)

assert.equal(retailProfile.jobScores.retail, 100)
assert.ok(retailProfile.clarityScore > scatteredProfile.clarityScore)
assert.notEqual(calculateDimensionScore(buildPreferenceAnswers('retail'), WORK_PREFERENCE_QUESTIONS), 100)

console.log('Assessment quality checks passed.')
