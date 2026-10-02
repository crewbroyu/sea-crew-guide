import assert from 'node:assert/strict'
import {
  buildAssessmentExperience,
  chooseBarTrialScenario,
  readAssessmentTrialContext,
} from '../src/data/assessmentExperienceBridge.js'
import {
  barServerTrialScenarios,
  getBarTrialScenarioEntryStage,
  getNextIncompleteBarTrialScenario,
} from '../src/data/barServerTrial.js'

assert.equal(chooseBarTrialScenario({ lowestDimension: 'english', primaryConcern: 'experience' }), 0)
assert.equal(chooseBarTrialScenario({ lowestDimension: 'service_experience', primaryConcern: 'english' }), 1)
assert.equal(chooseBarTrialScenario({ lowestDimension: 'ship_adaptability' }), 2)
assert.equal(chooseBarTrialScenario({ lowestDimension: 'unknown', primaryConcern: 'onboard_adaptation' }), 2)

const barExperience = buildAssessmentExperience({
  primaryJob: { id: 'bar', title: '酒吧服务 / Bar Server' },
  lowestDimension: { id: 'service_experience', name: '服务与岗位背景' },
  careerProfile: { primaryConcern: 'interview', currentStage: 'interview_preparation' },
})

assert.equal(barExperience.kind, 'bar_trial')
assert.equal(barExperience.scenarioIndex, 1)
assert.match(barExperience.route, /scenario=2/)
assert.equal(readAssessmentTrialContext(barExperience.route.split('?')[1]).scenarioIndex, 1)
assert.equal(readAssessmentTrialContext('?source=direct&scenario=2'), null)
assert.equal(readAssessmentTrialContext('?source=assessment&scenario=9'), null)

const frontOfficeExperience = buildAssessmentExperience({
  primaryJob: { id: 'front_office', title: '前台 / Guest Services' },
  lowestDimension: { id: 'english', name: '英语服务沟通' },
})

assert.equal(frontOfficeExperience.kind, 'resources')
assert.match(frontOfficeExperience.route, /position=front_office/)
assert.match(frontOfficeExperience.questionsRoute, /position=front_office/)
assert.doesNotMatch(frontOfficeExperience.route, /bar-server/)

const spaExperience = buildAssessmentExperience({
  primaryJob: { id: 'beauty_spa', title: '美容 SPA / 技能服务' },
  lowestDimension: { id: 'application_readiness', name: '求职准备度' },
})

assert.equal(spaExperience.questionsRoute, '/academy/interview-questions')
assert.equal(spaExperience.route, '/jobs')

const attemptsByScenario = {
  [barServerTrialScenarios[1].id]: [{}, {}],
}
assert.equal(getNextIncompleteBarTrialScenario(attemptsByScenario, 1), 2, 'a personalized second-scene start should continue to scene three')
attemptsByScenario[barServerTrialScenarios[2].id] = [{}, {}]
assert.equal(getNextIncompleteBarTrialScenario(attemptsByScenario, 2), 0, 'the remaining first scene should be offered before completion')
assert.equal(getBarTrialScenarioEntryStage({ attemptsByScenario }, 1), 'comparison')
assert.equal(getBarTrialScenarioEntryStage({ attemptsByScenario: {}, lessonProgressByScenario: {} }, 2), 'lesson')

console.log('Assessment-to-experience bridge tests passed')
