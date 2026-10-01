import { barServerFoundationDays } from './barServerFoundation.js'
import { BAR_SERVER_LISTENING_DRILLS } from './barServerListening.js'

const clamp = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)))
const ratioScore = (completed, total) => total ? clamp((completed / total) * 100) : 0

const DIMENSION_CONFIG = {
  foundation: {
    label: '岗位知识',
    description: '酒水、服务流程、卫生和责任售酒',
    route: '/programs/bar-server/foundation',
    action: '继续岗位基础课',
    weight: 0.25,
  },
  listening: {
    label: '工作听力',
    description: '订单、偏好、客诉和主管指令捕捉',
    route: '/programs/bar-server/listening',
    action: '训练工作听力',
    weight: 0.2,
  },
  speaking: {
    label: '现场回应',
    description: '听懂后能直接开口确认与处理',
    route: '/programs/bar-server/listening',
    action: '完成开口回应',
    weight: 0.15,
  },
  shift: {
    label: '班次反应',
    description: '正常语速、单次播放和限时作答',
    route: '/programs/bar-server/listening/shift',
    action: '完成班次挑战',
    weight: 0.2,
  },
  scenario: {
    label: '场景判断',
    description: '连续服务、销售、安全与问题处理',
    route: '/programs/bar-server/training',
    action: '完成岗位模拟',
    weight: 0.2,
  },
}

const getFoundationScore = (progress = {}) => {
  const completed = barServerFoundationDays.filter((day) => progress[day.id]?.completedAt).length
  return {
    score: ratioScore(completed, barServerFoundationDays.length),
    completed,
    total: barServerFoundationDays.length,
    evidence: `${completed}/${barServerFoundationDays.length} 天完成`,
  }
}

const getListeningScore = (progress = {}) => {
  const scores = BAR_SERVER_LISTENING_DRILLS.map((drill) => clamp(progress[drill.id]?.bestScore))
  const attempted = BAR_SERVER_LISTENING_DRILLS.filter((drill) => Number.isFinite(progress[drill.id]?.bestScore)).length
  const completed = BAR_SERVER_LISTENING_DRILLS.filter((drill) => progress[drill.id]?.completedAt).length
  return {
    score: clamp(scores.reduce((sum, score) => sum + score, 0) / BAR_SERVER_LISTENING_DRILLS.length),
    completed,
    total: BAR_SERVER_LISTENING_DRILLS.length,
    attempted,
    evidence: `${completed}/${BAR_SERVER_LISTENING_DRILLS.length} 题达标`,
  }
}

const getSpeakingScore = (progress = {}) => {
  const completed = BAR_SERVER_LISTENING_DRILLS.filter(
    (drill) => progress[drill.id]?.speakingPractice?.completedAt,
  ).length
  return {
    score: ratioScore(completed, BAR_SERVER_LISTENING_DRILLS.length),
    completed,
    total: BAR_SERVER_LISTENING_DRILLS.length,
    evidence: `${completed}/${BAR_SERVER_LISTENING_DRILLS.length} 个回应完成`,
  }
}

const getShiftScore = (history = []) => {
  const validHistory = history.filter((attempt) => Number.isFinite(Number(attempt?.score)))
  const latest = validHistory[0] || null
  const best = validHistory.length
    ? Math.max(...validHistory.map((attempt) => clamp(attempt.score)))
    : 0
  return {
    score: latest ? clamp(latest.score) : 0,
    attempts: validHistory.length,
    latestScore: latest ? clamp(latest.score) : null,
    bestScore: validHistory.length ? best : null,
    evidence: latest ? `最近 ${clamp(latest.score)} 分 · 共 ${validHistory.length} 次` : '尚未挑战',
  }
}

const getScenarioScore = (profile = null) => {
  const completed = Number(profile?.completed_scenario_count || 0)
  const score = completed ? clamp(profile?.readiness_score) : 0
  return {
    score,
    completed,
    skillScores: profile?.skill_scores || {},
    weakestSkill: profile?.weakest_skill || '',
    evidence: completed ? `${completed} 个场景 · ${score} 分` : '尚未完成',
  }
}

const getEvidencePercent = ({ foundation, listening, speaking, shift, scenario }) => clamp((
  (foundation.completed / foundation.total) * 20
  + (listening.attempted / listening.total) * 20
  + (speaking.completed / speaking.total) * 20
  + Math.min(shift.attempts, 1) * 20
  + Math.min(scenario.completed / 2, 1) * 20
))

const getReadinessLevel = (score, evidencePercent) => {
  if (evidencePercent < 40) {
    return {
      id: 'insufficient',
      label: '训练数据不足',
      description: '先完成核心训练，系统才有足够证据判断真实工作准备度。',
    }
  }
  if (score >= 85) return { id: 'stable', label: '班次准备稳定', description: '各项能力较完整，继续用高压场景保持稳定性。' }
  if (score >= 70) return { id: 'nearly_ready', label: '接近可上岗', description: '核心能力已经形成，补齐最弱项后再做一次班次验证。' }
  if (score >= 50) return { id: 'developing', label: '基础正在形成', description: '部分场景已经能处理，但真实班次中仍容易遗漏或反应不完整。' }
  return { id: 'not_ready', label: '仍需系统训练', description: '当前证据显示知识、听说或现场判断仍存在明显空白。' }
}

export const BAR_SERVER_SKILL_LABELS = {
  communication: '沟通确认',
  barKnowledge: '酒吧知识',
  service: '服务流程',
  upselling: '自然销售',
  problemSolving: '问题处理',
  english: '工作英语',
}

export const getBarServerReadinessReport = ({
  foundationProgress = {},
  listeningProgress = {},
  shiftHistory = [],
  scenarioProfile = null,
} = {}) => {
  const metrics = {
    foundation: getFoundationScore(foundationProgress),
    listening: getListeningScore(listeningProgress),
    speaking: getSpeakingScore(listeningProgress),
    shift: getShiftScore(shiftHistory),
    scenario: getScenarioScore(scenarioProfile),
  }

  const dimensions = Object.entries(DIMENSION_CONFIG).map(([id, config]) => ({
    id,
    ...config,
    ...metrics[id],
  }))
  const overallScore = clamp(dimensions.reduce(
    (sum, dimension) => sum + dimension.score * dimension.weight,
    0,
  ))
  const evidencePercent = getEvidencePercent(metrics)
  const level = getReadinessLevel(overallScore, evidencePercent)
  const recommendations = dimensions
    .filter((dimension) => dimension.score < 85)
    .sort((left, right) => left.score - right.score)
    .slice(0, 3)

  const readyForShift = overallScore >= 70
    && metrics.foundation.completed === metrics.foundation.total
    && metrics.listening.completed >= 10
    && metrics.speaking.completed >= 8
    && Number(metrics.shift.latestScore || 0) >= 70
    && metrics.scenario.completed >= 2

  return {
    overallScore,
    evidencePercent,
    level,
    dimensions,
    recommendations,
    readyForShift,
    skillScores: metrics.scenario.skillScores,
    weakestSkill: metrics.scenario.weakestSkill,
    scenarioCompletedCount: metrics.scenario.completed,
  }
}
