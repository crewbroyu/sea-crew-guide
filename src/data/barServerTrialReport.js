import { getBarServerTrialScenarios } from './barServerTrial.js'
import { getBarServerStagePlan } from './barServerLearningPlan.js'
import { barServerStagePlanTitlesEn } from './barServerLearningPlan.en.js'

export const BAR_TRIAL_VALIDATION_LINE = 70

const stagePlanMap = {
  waiting_onboard: 'first_contract',
  waiting_contract: 'first_contract',
  experienced: 'experienced',
}

const scenarioTraining = {
  zh: {
    bar_server_drink_recommendation_01: {
      title: '推荐与确认表达',
      description: '补齐酒水基础、偏好追问、风味解释和套餐确认。',
    },
    bar_server_complaint_recovery_02: {
      title: '客诉补救闭环',
      description: '练习承认影响、核对问题、执行补救、同步进度和结果回访。',
    },
    bar_server_responsible_service_03: {
      title: '责任售酒与安全升级',
      description: '练习停止供酒、提供替代、通知主管和必要时请求支援。',
    },
  },
  en: {
    bar_server_drink_recommendation_01: {
      title: 'Recommending and confirming',
      description: 'Build drinks basics, asking about preferences, explaining flavour and checking packages.',
    },
    bar_server_complaint_recovery_02: {
      title: 'Complete complaint recovery',
      description: 'Practise acknowledging the impact, checking the problem, fixing it, giving updates and following up.',
    },
    bar_server_responsible_service_03: {
      title: 'Responsible service and safety escalation',
      description: 'Practise stopping alcohol service, offering alternatives, informing your supervisor and asking for support when needed.',
    },
  },
}

const reportCopy = {
  zh: {
    fallbackStrength: '完成了两轮现场回答，并能根据反馈重新组织表达。',
    fallbackGap: '需要继续提高回答的完整性和现场稳定性。',
    firstPriority: (title) => `先补：${title}`,
    nextPriority: (title) => `再练：${title}`,
    shiftTitle: '最后做限时班次验证',
    shiftDescription: '在正常语速和时间压力下完成五题，确认能力不是只在熟悉题目时有效。',
    allPassed: '三类核心场景都达到最低验证线，可以进入更连续的岗位训练。',
    someUnstable: (count) => `整体分数已过线，但仍有 ${count} 类场景不稳定。`,
    belowLine: (line) => `当前仍低于最低验证线 ${line} 分，应先补最弱场景再进入限时验证。`,
  },
  en: {
    fallbackStrength: 'You completed two live answers and reorganised your reply using the feedback.',
    fallbackGap: 'Keep making your answers more complete and steadier under pressure.',
    firstPriority: (title) => `First: ${title}`,
    nextPriority: (title) => `Next: ${title}`,
    shiftTitle: 'Finally, pass a timed shift check',
    shiftDescription: 'Answer five scenarios at normal speed under time pressure, to prove your skills work beyond familiar questions.',
    allPassed: 'All three core scenarios reached the minimum pass line. You are ready for more continuous job training.',
    someUnstable: (count) => `Your overall score passed, but ${count} scenario type(s) are still not stable.`,
    belowLine: (line) => `You are still below the minimum pass line of ${line}. Fix your weakest scenario before the timed check.`,
  },
}

const uniqueStrings = (values, limit) => [...new Set(values.filter(Boolean))].slice(0, limit)
const getScore = (attempt) => Number(attempt?.evaluation?.overallScore || 0)
const getFeedback = (attempt) => attempt?.evaluation?.questionScores?.[0] || {}

const buildRoadmapPreview = (currentStage, language) => {
  const stagePlan = stagePlanMap[currentStage] || 'job_search'
  const plan = getBarServerStagePlan(stagePlan)
  const englishTitles = language === 'en' ? barServerStagePlanTitlesEn[stagePlan] || {} : null
  const getTitle = (item) => englishTitles?.[item.id] || item.title
  const groups = [
    [1, 3], [4, 7], [8, 11], [12, 14],
  ]

  return {
    stagePlan,
    phases: groups.map(([start, end]) => ({
      days: start === end ? `Day ${start}` : `Day ${start}-${end}`,
      titles: plan.filter((item) => item.day >= start && item.day <= end).map(getTitle),
    })),
  }
}

export const buildBarServerTrialReport = ({ attemptsByScenario = {}, currentStage = '', language = 'zh' } = {}) => {
  const copy = reportCopy[language] || reportCopy.zh
  const training = scenarioTraining[language] || scenarioTraining.zh
  const scenarios = getBarServerTrialScenarios(language).map((scenario) => {
    const attempts = attemptsByScenario[scenario.id] || []
    const firstAttempt = attempts[0]
    const retryAttempt = attempts[1] || attempts.at(-1)
    const firstScore = getScore(firstAttempt)
    const score = getScore(retryAttempt)
    const feedback = getFeedback(retryAttempt)
    const fallbackFeedback = getFeedback(firstAttempt)
    const strengths = feedback.strengths?.length ? feedback.strengths : fallbackFeedback.strengths || []
    const improvements = feedback.improvements?.length
      ? feedback.improvements
      : feedback.retryChecklist?.length
        ? feedback.retryChecklist
        : fallbackFeedback.improvements || []

    return {
      id: scenario.id,
      title: scenario.shortTitle,
      score,
      firstScore,
      delta: score - firstScore,
      passed: score >= BAR_TRIAL_VALIDATION_LINE,
      strength: strengths[0] || copy.fallbackStrength,
      gap: improvements[0] || copy.fallbackGap,
      training: training[scenario.id],
    }
  })

  const scores = scenarios.map((scenario) => scenario.score)
  const readiness = scores.length
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : 0
  const passedCount = scenarios.filter((scenario) => scenario.passed).length
  const weakestScenario = [...scenarios].sort((left, right) => left.score - right.score)[0]
  const strongestScenario = [...scenarios].sort((left, right) => right.score - left.score)[0]
  const provenAbilities = uniqueStrings(scenarios.map((scenario) => scenario.strength), 3)
  const workRisks = scenarios.map((scenario) => ({
    title: scenario.title,
    description: scenario.gap,
  }))
  const priorityTraining = [
    {
      title: copy.firstPriority(weakestScenario.training.title),
      description: weakestScenario.training.description,
    },
    ...scenarios
      .filter((scenario) => scenario.id !== weakestScenario.id)
      .sort((left, right) => left.score - right.score)
      .slice(0, 1)
      .map((scenario) => ({
        title: copy.nextPriority(scenario.training.title),
        description: scenario.training.description,
      })),
    {
      title: copy.shiftTitle,
      description: copy.shiftDescription,
    },
  ]

  const meetsValidationLine = passedCount === scenarios.length
  const status = meetsValidationLine
    ? copy.allPassed
    : readiness >= BAR_TRIAL_VALIDATION_LINE
      ? copy.someUnstable(scenarios.length - passedCount)
      : copy.belowLine(BAR_TRIAL_VALIDATION_LINE)

  return {
    readiness,
    validationLine: BAR_TRIAL_VALIDATION_LINE,
    passedCount,
    meetsValidationLine,
    status,
    scenarios,
    provenAbilities,
    workRisks,
    primaryGap: {
      scenarioId: weakestScenario.id,
      scenarioTitle: weakestScenario.title,
      score: weakestScenario.score,
      description: weakestScenario.gap,
    },
    strongestArea: strongestScenario.title,
    priorityTraining,
    roadmap: buildRoadmapPreview(currentStage, language),
  }
}
