import assert from 'node:assert/strict'
import interviewQuestions, { positionConfig, positionDepartments } from '../src/data/interviewQuestions.js'

// Every position belongs to a known department and has a bank; every bank is listed as a position.
const departmentKeys = positionDepartments.map((department) => department.key)
const positionKeys = positionConfig.map((position) => position.key)
assert.equal(new Set(positionKeys).size, positionKeys.length, 'Position keys are unique.')
for (const position of positionConfig) {
  assert.ok(departmentKeys.includes(position.department), `${position.key} has a known department.`)
  assert.ok(position.nameZh && position.nameEn, `${position.key} has both names.`)
  assert.ok(interviewQuestions[position.key], `${position.key} has a question bank.`)
}
assert.deepEqual(Object.keys(interviewQuestions).sort(), [...positionKeys].sort(), 'Every bank is listed in positionConfig.')
for (const department of positionDepartments) {
  assert.ok(positionConfig.some((position) => position.department === department.key), `${department.key} holds a position.`)
}

// Question ids are unique across all banks, since reference answers and practice records key on them.
const allIds = Object.values(interviewQuestions).flatMap((bank) => bank.questions.map((question) => question.id))
assert.equal(new Set(allIds).size, allIds.length, 'Question ids are unique across banks.')
for (const [key, bank] of Object.entries(interviewQuestions)) {
  assert.deepEqual(bank.questions.map((question) => question.order), bank.questions.map((_, index) => index + 1), `${key} orders run 1..n.`)
  for (const question of bank.questions) {
    assert.ok(question.question && question.tip && question.difficulty, `${question.id} is complete.`)
    assert.ok(question.source && question.sourceNote, `${question.id} has a source.`)
  }
}

// The retail department: Sales Associate keeps the retail key that packs and records use, and
// Effy Jewelry Sales is its own position.
assert.equal(positionConfig.find((position) => position.key === 'retail').nameEn, 'Sales Associate')
assert.deepEqual(positionConfig.filter((position) => position.department === 'retail').map((position) => position.key), ['retail', 'effy_jewelry'])
assert.equal(interviewQuestions.effy_jewelry.questions.length, 30)
assert.ok(interviewQuestions.effy_jewelry.questions.every((question) => question.id.startsWith('ej_')))

console.log('Question bank structure tests passed.')
