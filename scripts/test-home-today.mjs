import assert from 'node:assert/strict'
import { buildHomeToday } from '../src/data/homeToday.js'

const assessmentReport = {
  profile: { targetRole: 'bar', currentStage: 'waiting_onboard' },
  assessment_snapshot: { overallScore: 76 },
  report: { recommendedPositions: [] },
}

const newUser = buildHomeToday()
assert.equal(newUser.todayAction.route, '/assessment')
assert.equal(newUser.readiness.score, null)

const freeBarUser = buildHomeToday({
  careerReport: assessmentReport,
  trial: { attemptsByScenario: { first: [{}, {}] } },
})
assert.equal(freeBarUser.targetRole.isBarServer, true)
assert.equal(freeBarUser.todayAction.route, '/programs/bar-server/trial')
assert.match(freeBarUser.todayAction.title, /1\/3/)
assert.equal(freeBarUser.routeProgress.total, 14)

const paidBarUser = buildHomeToday({
  careerReport: assessmentReport,
  hasBarServerPack: true,
  foundationProgress: {
    'service-role': { completedAt: '2026-10-01T00:00:00.000Z' },
  },
  shiftHistory: [{ score: 64, completedAt: '2026-10-02T00:00:00.000Z', results: [{ score: 50, unit: '订单捕捉' }] }],
})
assert.equal(paidBarUser.hasBarServerPack, true)
assert.equal(paidBarUser.todayAction.label, '第 2 训练日')
assert.equal(paidBarUser.latestFeedback.type, '限时班次挑战')
assert.match(paidBarUser.latestFeedback.detail, /订单捕捉/)

const scenarioFeedback = buildHomeToday({
  careerReport: assessmentReport,
  hasBarServerPack: true,
  scenarioProfile: { completed_scenario_count: 1, readiness_score: 71 },
  scenarioHistory: [{
    overall_readiness: 72,
    weaknesses: ['需要先确认客人是否接受含酒精饮品。'],
    completed_at: '2026-10-03T00:00:00.000Z',
  }],
})
assert.equal(scenarioFeedback.latestFeedback.score, 72)
assert.match(scenarioFeedback.latestFeedback.detail, /先确认/)

const retailUser = buildHomeToday({
  pathProfile: {
    target_position: 'retail',
    latest_assessment_score: 81,
    latest_assessment_level: '匹配度较高',
    task_progress: { task1: { completed: true } },
  },
})
assert.equal(retailUser.targetRole.label, '免税店 / Retail Sales')
assert.equal(retailUser.readiness.metricLabel, '职业适配度')
assert.equal(retailUser.todayAction.route, '/tasks/Task2')

const retentionLoop = buildHomeToday({
  careerReport: assessmentReport,
  hasBarServerPack: true,
  now: new Date('2026-10-03T12:00:00.000Z').getTime(),
  foundationProgress: {
    'service-role': { completedAt: '2026-10-01T08:00:00.000Z' },
  },
  listeningProgress: {
    'order-mojito-family': {
      bestScore: 100,
      completedAt: '2026-10-02T08:00:00.000Z',
      speakingPractice: { completedAt: '2026-10-03T08:00:00.000Z' },
    },
  },
  shiftHistory: [{ score: 72, completedAt: '2026-10-02T10:00:00.000Z' }],
})
assert.equal(retentionLoop.activity.recent[0].type, '工作听说')
assert.equal(retentionLoop.activity.weeklyCount, 3)
assert.equal(retentionLoop.activity.activeDays, 3)
assert.match(retentionLoop.activity.message, /今天已经推进过/)

const afterMidnight = buildHomeToday({
  careerReport: assessmentReport,
  hasBarServerPack: true,
  now: new Date(2026, 9, 3, 0, 15).getTime(),
  shiftHistory: [{
    score: 78,
    completedAt: new Date(2026, 9, 2, 23, 45).toISOString(),
  }],
})
assert.equal(afterMidnight.activity.daysSinceLatest, 1)
assert.match(afterMidnight.activity.message, /昨天完成过/)

console.log('Home Today dashboard tests passed.')

