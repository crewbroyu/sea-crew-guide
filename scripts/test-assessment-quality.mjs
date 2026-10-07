import assert from 'node:assert/strict'
import {
  ALL_QUESTIONS,
  DIMENSIONS,
  ENGLISH_QUESTIONS,
  SERVICE_BACKGROUNDS,
  WORK_PREFERENCE_QUESTIONS,
} from '../src/data/assessmentData.js'
import {
  applyPracticalAssessmentScores,
  calculateDimensionScore,
  calculateWorkPreferenceProfile,
} from '../src/data/assessmentScoring.js'
import {
  cacheAssessmentResult,
  clearCachedAssessmentResult,
  markAssessmentProgressComplete,
} from '../src/data/assessmentStorage.js'
import { careerReportMatchesAssessment } from '../src/data/careerReportIdentity.js'

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

assert.deepEqual(
  applyPracticalAssessmentScores(
    { english: 80, service_experience: 70, eligibility: 60 },
    { englishScore: 60, serviceExperienceScore: 50 },
  ),
  { english: 71, service_experience: 62, eligibility: 60 },
)

const throwingStorage = {
  getItem: () => { throw new Error('storage unavailable') },
  setItem: () => { throw new Error('storage unavailable') },
  removeItem: () => { throw new Error('storage unavailable') },
}
assert.equal(cacheAssessmentResult(throwingStorage, { completed: true }), false)
assert.equal(markAssessmentProgressComplete(throwingStorage, '2026-10-07T01:00:00.000Z'), false)
assert.equal(clearCachedAssessmentResult(throwingStorage), false)

const storageValues = new Map([['boarding_progress', JSON.stringify({ task2: { completed: true } })]])
const workingStorage = {
  getItem: (key) => storageValues.get(key) || null,
  setItem: (key, value) => storageValues.set(key, value),
  removeItem: (key) => storageValues.delete(key),
}
const completedAt = '2026-10-07T01:00:00.000Z'
assert.equal(cacheAssessmentResult(workingStorage, { completed: true, assessmentVersion: 3, completedAt }), true)
assert.deepEqual(JSON.parse(storageValues.get('assessment_result')), { completed: true, assessmentVersion: 3, completedAt })
assert.equal(markAssessmentProgressComplete(workingStorage, completedAt), true)
assert.deepEqual(JSON.parse(storageValues.get('boarding_progress')), {
  task1: { completed: true, completedAt },
  task2: { completed: true },
})
assert.equal(clearCachedAssessmentResult(workingStorage), true)
assert.equal(storageValues.has('assessment_result'), false)

assert.equal(careerReportMatchesAssessment(
  { assessmentVersion: 3, completedAt: '2026-10-07T01:00:00.000Z' },
  { assessmentVersion: 3, completedAt: '2026-10-07T01:00:00.000Z' },
), true)
assert.equal(careerReportMatchesAssessment(
  { assessmentVersion: 3, completedAt: '2026-10-06T01:00:00.000Z' },
  { assessmentVersion: 3, completedAt: '2026-10-07T01:00:00.000Z' },
), false)
assert.equal(careerReportMatchesAssessment(
  { assessmentVersion: '3', completedAt: ' 2026-10-07T01:00:00.000Z ' },
  { assessmentVersion: 3, completedAt: '2026-10-07T01:00:00.000Z' },
), true)
assert.equal(careerReportMatchesAssessment(
  { assessmentVersion: 2, completedAt: '2026-10-07T01:00:00.000Z' },
  { assessmentVersion: 3, completedAt: '2026-10-07T01:00:00.000Z' },
), false)
assert.equal(careerReportMatchesAssessment(
  { assessmentVersion: 3 },
  { assessmentVersion: 3, completedAt: '2026-10-07T01:00:00.000Z' },
), false)

console.log('Assessment quality checks passed.')
