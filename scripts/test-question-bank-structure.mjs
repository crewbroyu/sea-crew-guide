import assert from 'node:assert/strict'
import interviewQuestions, { positionConfig, positionDepartments } from '../src/data/interviewQuestions.js'
import { EFFY_SOURCE_TYPES, EFFY_STAGES, effyVideoPractice } from '../src/data/effyJewelryQuestionBank.js'

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
    assert.ok(question.sourceNote, `${question.id} has a source note.`)
    // Only a question that declares itself as self-written role training may go without a link.
    assert.ok(question.source || question.sourceType === 'skills_training', `${question.id} has a source.`)
    if (question.source) assert.match(question.source.url, /^https:\/\//, `${question.id} links over https.`)
  }
}

// The retail department: Sales Associate keeps the retail key that packs and records use, and
// Effy Jewelry Sales is its own position.
assert.equal(positionConfig.find((position) => position.key === 'retail').nameEn, 'Sales Associate')
assert.deepEqual(positionConfig.filter((position) => position.department === 'retail').map((position) => position.key), ['retail', 'effy_jewelry'])
const effyQuestions = interviewQuestions.effy_jewelry.questions
assert.equal(effyQuestions.length, 35)
assert.ok(effyQuestions.every((question) => question.id.startsWith('ej_')))
// The original 30 ids survive the reordering, since reference answers and records key on them.
for (let number = 1; number <= 35; number += 1) {
  assert.ok(effyQuestions.some((question) => question.id === `ej_${String(number).padStart(2, '0')}`), `ej_${number} exists.`)
}
// Every Effy question states its own source type, and the study order runs core, apply, extend.
assert.ok(effyQuestions.every((question) => EFFY_SOURCE_TYPES[question.sourceType]), 'Effy questions have a source type.')
const stageRank = Object.keys(EFFY_STAGES)
const ranks = effyQuestions.map((question) => stageRank.indexOf(question.stage))
assert.ok(ranks.every((rank) => rank >= 0), 'Effy questions have a stage.')
assert.deepEqual(ranks, [...ranks].sort((a, b) => a - b), 'Effy questions run core, then apply, then extend.')
assert.ok(['ej_31', 'ej_32', 'ej_33', 'ej_34', 'ej_35'].every((id) => effyQuestions.find((question) => question.id === id).stage === 'core'))
// Only interview-report questions may claim to come from a candidate's interview.
for (const question of effyQuestions.filter((item) => item.sourceType === 'interview_report')) assert.ok(question.source, `${question.id} links its interview report.`)
assert.equal(effyVideoPractice.prompts.length, 3)
assert.ok(effyVideoPractice.prompts.every((prompt) => prompt.outline.length && prompt.checks.length))

console.log('Question bank structure tests passed.')
