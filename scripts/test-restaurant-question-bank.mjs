import assert from 'node:assert/strict'
import interviewQuestions from '../src/data/interviewQuestions.js'
import { RESTAURANT_LEVEL_LABELS, restaurantAdditions, restaurantRevisions } from '../src/data/restaurantQuestionBank.js'

// The restaurant bank revision: short questions with follow-ups, levels, and added practical questions.
const questions = interviewQuestions.restaurant.questions
const ids = questions.map((question) => question.id)

assert.equal(questions.length, 50)
assert.equal(new Set(ids).size, ids.length, 'Question ids are unique.')
assert.deepEqual(questions.map((question) => question.order), questions.map((_, index) => index + 1), 'Orders run 1..50.')
for (const id of Object.keys(restaurantRevisions)) assert.ok(ids.includes(id), `Revision ${id} targets an existing question.`)
assert.deepEqual(restaurantAdditions.map((question) => question.id), Array.from({ length: 10 }, (_, index) => `rs_${41 + index}`))

for (const question of questions) {
  assert.ok(Object.keys(RESTAURANT_LEVEL_LABELS).includes(question.level), `${question.id} has a known level.`)
  assert.ok(Array.isArray(question.followUps) && question.followUps.length >= 1 && question.followUps.length <= 3, `${question.id} has 1-3 follow-ups.`)
  assert.ok(question.question && question.tip && question.difficulty, `${question.id} is complete.`)
  assert.ok(question.source && question.sourceNote, `${question.id} keeps its source note.`)
}

// Questions the review called leading are now short enough to ask aloud.
for (const id of ['rs_01', 'rs_03', 'rs_06', 'rs_08', 'rs_14', 'rs_29']) {
  const words = questions.find((question) => question.id === id).question.split(/\s+/).length
  assert.ok(words <= 20, `${id} has ${words} words.`)
}

// The review asked for résumé follow-ups, live demonstrations, and chained follow-ups.
const added = questions.filter((question) => question.order > 40)
assert.ok(added.filter((question) => question.category === 'behavioral').length >= 3, 'Résumé questions are included.')
assert.ok(added.filter((question) => question.category === 'demonstration').length >= 4, 'Demonstrations are included.')
assert.ok(questions.find((question) => question.id === 'rs_50').followUps.length === 3, 'The mistake question chains three follow-ups.')

// Overlapping complaint and stamina questions each state a distinct focus.
for (const id of ['rs_08', 'rs_16', 'rs_32', 'rs_14', 'rs_20', 'rs_40']) {
  assert.match(questions.find((question) => question.id === id).tip, /^Focus: /, `${id} states its focus.`)
}

// Fixed rules the review objected to are gone from tips.
for (const question of questions) assert.doesNotMatch(question.tip, /\b\d+\s*minutes?\b/i, `${question.id} has no fixed waiting time.`)

// The revision stays inside the restaurant bank. Other banks may carry their own follow-ups and
// levels (the Effy jewelry bank does), but never restaurant questions or restaurant level keys.
const restaurantIds = new Set([...Object.keys(restaurantRevisions), ...restaurantAdditions.map((question) => question.id)])
for (const [key, bank] of Object.entries(interviewQuestions)) {
  if (key === 'restaurant') continue
  assert.ok(bank.questions.every((question) => !restaurantIds.has(question.id)), `${key} has no restaurant questions.`)
  assert.ok(bank.questions.every((question) => !question.level || !Object.hasOwn(RESTAURANT_LEVEL_LABELS, question.level)), `${key} uses no restaurant levels.`)
}

console.log('restaurant question bank: ok')
