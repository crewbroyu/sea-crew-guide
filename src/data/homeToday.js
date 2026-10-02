import pathData from './pathData.js'
import { getBarServerPlanProgress } from './barServerLearningPlan.js'
import { getBarServerReadinessReport } from './barServerReadiness.js'

const ROLE_LABELS = {
  bar: '酒吧服务 / Bar Server',
  bar_server: '酒吧服务 / Bar Server',
  barServer: '酒吧服务 / Bar Server',
  retail: '免税店 / Retail Sales',
  front_office: '前台 / Guest Services',
  restaurant: '餐厅服务 / Restaurant',
  housekeeping: '客房服务 / Housekeeping',
  youth_staff: '儿童青少年活动 / Youth Staff',
  beauty_spa: '美容 SPA / 技能服务',
  undecided: '尚未确定',
}

const STAGE_MAP = {
  waiting_contract: 'first_contract',
  waiting_onboard: 'first_contract',
  experienced: 'experienced',
}

const allTasks = pathData.flatMap((stage) => stage.tasks.map((task) => ({ ...task, stageName: stage.name })))

const isBarRole = (value = '') => /(^bar$|bar.?server|酒吧)/i.test(String(value))

const getCompletedTasks = (progress = {}) => allTasks.filter((task) => progress[`task${task.id}`]?.completed)

const getCurrentPathTask = (progress = {}) => (
  allTasks.find((task) => !progress[`task${task.id}`]?.completed) || allTasks.at(-1)
)

const getTrialCompletedCount = (trial = {}) => Object.values(trial.attemptsByScenario || {})
  .filter((attempts) => Array.isArray(attempts) && attempts.length >= 2).length

const toTime = (value) => {
  const timestamp = new Date(value || 0).getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}

const buildLatestFeedback = ({ scenarioHistory = [], shiftHistory = [] }) => {
  const scenario = scenarioHistory[0]
  const shift = shiftHistory[0]

  if (!scenario && !shift) return null

  if (scenario && toTime(scenario.completed_at) >= toTime(shift?.completedAt)) {
    return {
      type: '岗位场景模拟',
      score: Number(scenario.overall_readiness || 0),
      detail: scenario.weaknesses?.[0]
        || scenario.next_recommendation
        || '结果已计入岗位准备度，继续完成系统推荐的弱项训练。',
      completedAt: scenario.completed_at,
      route: '/programs/bar-server/training',
    }
  }

  const weakResult = shift.results?.find((result) => Number(result?.score || 0) < 70)
  return {
    type: '限时班次挑战',
    score: Number(shift.score || 0),
    detail: weakResult
      ? `${weakResult.unit || '现场反应'}仍需加强，先复盘遗漏信息再挑战一次。`
      : '最近一次班次挑战已完成，可以继续用岗位场景验证稳定性。',
    completedAt: shift.completedAt,
    route: '/programs/bar-server/listening/shift',
  }
}

const resolveTargetRole = ({ pathProfile, jobPreparation, careerReport }) => {
  const raw = pathProfile?.target_position
    || jobPreparation?.selected_role
    || careerReport?.profile?.targetRole
    || ''
  const fallbackTitle = jobPreparation?.role_title || ''
  return {
    raw,
    label: ROLE_LABELS[raw] || fallbackTitle || raw || '尚未确定',
    isBarServer: isBarRole(raw) || isBarRole(fallbackTitle),
  }
}

export const buildHomeToday = ({
  pathProfile = null,
  jobPreparation = null,
  careerReport = null,
  foundationProgress = {},
  listeningProgress = {},
  shiftHistory = [],
  scenarioProfile = null,
  scenarioHistory = [],
  trial = {},
  interviewCompleted = false,
  hasBarServerPack = false,
  learningStage = 'job_search',
} = {}) => {
  const targetRole = resolveTargetRole({ pathProfile, jobPreparation, careerReport })
  const taskProgress = pathProfile?.task_progress || {}
  const completedTasks = getCompletedTasks(taskProgress)
  const currentTask = getCurrentPathTask(taskProgress)
  const assessmentScore = Number(
    pathProfile?.latest_assessment_score
      || careerReport?.assessment_snapshot?.overallScore
      || careerReport?.assessment_snapshot?.overall_score
      || 0,
  )
  const hasAssessment = Boolean(assessmentScore || careerReport?.report)

  if (!hasAssessment) {
    return {
      targetRole,
      readiness: { score: null, evidencePercent: 0, label: '等待首次评估', metricLabel: '当前准备度' },
      gap: { label: '岗位方向尚未确定', detail: '先完成职业适配测评，后续训练才会按你的目标岗位排序。', route: '/assessment' },
      todayAction: { label: '今天只做这一件事', title: '完成职业适配测评', detail: '约 5-8 分钟，生成岗位方向、现实风险和下一步建议。', route: '/assessment' },
      routeProgress: { completedCount: completedTasks.length, total: allTasks.length, percent: Math.round((completedTasks.length / allTasks.length) * 100), items: [], currentItem: null, isBarPlan: false },
      latestFeedback: null,
    }
  }

  if (!targetRole.isBarServer) {
    return {
      targetRole,
      readiness: {
        score: assessmentScore || null,
        evidencePercent: assessmentScore ? 100 : 0,
        label: pathProfile?.latest_assessment_level || '职业适配结果',
        metricLabel: '职业适配度',
      },
      gap: {
        label: `当前待完成：${currentTask.title}`,
        detail: currentTask.subtitle,
        route: currentTask.route,
      },
      todayAction: {
        label: '今天只做这一件事',
        title: currentTask.title,
        detail: currentTask.subtitle,
        route: currentTask.route,
      },
      routeProgress: {
        completedCount: completedTasks.length,
        total: allTasks.length,
        percent: Math.round((completedTasks.length / allTasks.length) * 100),
        items: [],
        currentItem: null,
        isBarPlan: false,
      },
      latestFeedback: null,
    }
  }

  const readiness = getBarServerReadinessReport({
    foundationProgress,
    listeningProgress,
    shiftHistory,
    scenarioProfile,
  })
  const stageId = STAGE_MAP[careerReport?.profile?.currentStage] || learningStage || 'job_search'
  const plan = getBarServerPlanProgress(stageId, {
    foundationProgress,
    listeningProgress,
    shiftHistory,
    scenarioCompletedCount: readiness.scenarioCompletedCount,
    interviewCompleted,
  })
  const weakest = readiness.recommendations[0]
  const trialCompletedCount = getTrialCompletedCount(trial)

  let todayAction
  if (!hasBarServerPack) {
    todayAction = trialCompletedCount < 3
      ? {
          label: '今天只做这一件事',
          title: `继续免费岗位体验（${trialCompletedCount}/3）`,
          detail: '完成一次真实工作回应和重练，先确认这种训练是否适合你。',
          route: '/programs/bar-server/trial',
        }
      : {
          label: '你的体验已完成',
          title: '查看完整岗位训练方案',
          detail: '查看 14 天路线、正式课程内容和开通方式。',
          route: '/premium?product=bar_server_pack',
        }
  } else {
    todayAction = {
      label: plan.isComplete ? '保持工作状态' : `第 ${plan.currentItem.day} 训练日`,
      title: plan.isComplete ? '再做一次岗位场景验证' : plan.currentItem.title,
      detail: plan.isComplete ? '你的 14 天路线已完成，用高压场景继续验证稳定性。' : plan.currentItem.description,
      route: plan.isComplete ? '/programs/bar-server/training' : plan.currentItem.route,
    }
  }

  return {
    targetRole,
    readiness: {
      score: readiness.overallScore,
      evidencePercent: readiness.evidencePercent,
      label: readiness.level.label,
      metricLabel: '岗位准备度',
    },
    gap: weakest ? {
      label: weakest.label,
      score: weakest.score,
      detail: `${weakest.description} · ${weakest.evidence}`,
      route: weakest.route,
      action: weakest.action,
    } : {
      label: '继续保持稳定',
      detail: '目前没有明显低分项，继续用岗位场景检验稳定性。',
      route: '/programs/bar-server/training',
    },
    todayAction,
    routeProgress: { ...plan, total: plan.items.length, isBarPlan: true },
    latestFeedback: buildLatestFeedback({ scenarioHistory, shiftHistory }),
    hasBarServerPack,
  }
}

