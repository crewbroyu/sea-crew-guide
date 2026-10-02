import assert from 'node:assert/strict'
import { barServerTrialScenarios } from '../src/data/barServerTrial.js'
import { BAR_TRIAL_VALIDATION_LINE, buildBarServerTrialReport } from '../src/data/barServerTrialReport.js'

const buildAttempt = (score, strength, improvement) => ({
  evaluation: {
    overallScore: score,
    questionScores: [{ strengths: [strength], improvements: [improvement] }],
  },
})

const attemptsByScenario = Object.fromEntries(barServerTrialScenarios.map((scenario, index) => [
  scenario.id,
  [
    buildAttempt(45 + index * 5, `第一次优势 ${index}`, `第一次差距 ${index}`),
    buildAttempt([76, 62, 71][index], `重练优势 ${index}`, `重练差距 ${index}`),
  ],
]))

const report = buildBarServerTrialReport({ attemptsByScenario, currentStage: 'waiting_onboard' })

assert.equal(report.validationLine, BAR_TRIAL_VALIDATION_LINE)
assert.equal(report.readiness, 70)
assert.equal(report.passedCount, 2)
assert.equal(report.meetsValidationLine, false)
assert.equal(report.primaryGap.scenarioId, barServerTrialScenarios[1].id)
assert.equal(report.primaryGap.scenarioTitle, '客诉补救')
assert.equal(report.primaryGap.score, 62)
assert.equal(report.priorityTraining.length, 3)
assert.match(report.priorityTraining[0].title, /客诉补救/)
assert.equal(report.roadmap.stagePlan, 'first_contract')
assert.equal(report.roadmap.phases.length, 4)
assert.equal(report.roadmap.phases.flatMap((phase) => phase.titles).length, 14)
assert.deepEqual(report.scenarios.map((scenario) => scenario.delta), [31, 12, 16])

const passingAttempts = Object.fromEntries(barServerTrialScenarios.map((scenario) => [
  scenario.id,
  [buildAttempt(60, '基础动作', '继续稳定'), buildAttempt(80, '达到要求', '继续提升')],
]))
const passingReport = buildBarServerTrialReport({ attemptsByScenario: passingAttempts, currentStage: 'experienced' })
assert.equal(passingReport.meetsValidationLine, true)
assert.equal(passingReport.roadmap.stagePlan, 'experienced')

const zeroScoreAttempts = {
  ...passingAttempts,
  [barServerTrialScenarios[0].id]: [buildAttempt(0, '未体现', '需要补齐'), buildAttempt(0, '未体现', '需要补齐')],
}
const zeroScoreReport = buildBarServerTrialReport({ attemptsByScenario: zeroScoreAttempts })
assert.equal(zeroScoreReport.readiness, 53)

console.log('Bar Server trial report tests passed')
