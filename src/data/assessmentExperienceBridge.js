const dimensionLabels = {
  eligibility: '基础可行性',
  english: '英语服务沟通',
  service_experience: '服务与岗位背景',
  work_preference: '岗位方向清晰度',
  ship_adaptability: '船上适应力',
  application_readiness: '求职准备度',
}

const concernLabels = {
  english: '英语听说', interview: '面试表现', experience: '相关经验',
  role_knowledge: '岗位知识', medical_visa: '体检与签证', route_reliability: '申请渠道',
  cost: '前期费用', onboard_adaptation: '上船适应', other: '其他问题',
}

const stageLabels = {
  exploring: '刚开始了解海乘', position_selected: '已经确定目标岗位',
  interview_preparation: '正在准备或参加面试', waiting_contract: '已通过面试，等待合同',
  waiting_onboard: '已拿到合同，等待登船', experienced: '有过上船经历',
}

const positionKeys = {
  retail: 'retail', front_office: 'front_office', bar: 'bar_server', restaurant: 'restaurant',
  housekeeping: 'housekeeping', youth_staff: 'youth_staff', beauty_spa: 'beauty_spa',
}

const publicQuestionPositions = new Set([
  'retail', 'front_office', 'bar_server', 'restaurant', 'housekeeping', 'youth_staff',
])

export const barTrialFocus = [
  {
    shortTitle: '饮品推荐',
    dimensions: ['english', 'work_preference'],
    concerns: ['english', 'role_knowledge'],
    description: '检查你能否听懂客人需求、确认关键偏好，并用英文给出具体而可靠的推荐。',
  },
  {
    shortTitle: '客诉补救',
    dimensions: ['service_experience', 'application_readiness'],
    concerns: ['experience', 'interview'],
    description: '检查你能否在压力下接住投诉、确认问题，并给出符合岗位权限的解决方案。',
  },
  {
    shortTitle: '安全拒酒',
    dimensions: ['ship_adaptability', 'eligibility'],
    concerns: ['onboard_adaptation'],
    description: '检查你能否守住安全边界、稳定沟通，并在必要时正确升级处理。',
  },
]

export const chooseBarTrialScenario = ({ lowestDimension, primaryConcern } = {}) => {
  const dimensionMatch = barTrialFocus.findIndex((focus) => focus.dimensions.includes(lowestDimension))
  if (dimensionMatch >= 0) return dimensionMatch
  const concernMatch = barTrialFocus.findIndex((focus) => focus.concerns.includes(primaryConcern))
  return concernMatch >= 0 ? concernMatch : 0
}

export const buildAssessmentExperience = ({ primaryJob, lowestDimension, careerProfile = {} } = {}) => {
  if (!primaryJob?.id) return null

  const gapLabel = dimensionLabels[lowestDimension?.id] || lowestDimension?.name || '当前核心短板'
  const primaryConcern = careerProfile.primaryConcern || ''
  const currentStage = careerProfile.currentStage || ''

  if (primaryJob.id === 'bar') {
    const scenarioIndex = chooseBarTrialScenario({
      lowestDimension: lowestDimension?.id,
      primaryConcern,
    })
    const focus = barTrialFocus[scenarioIndex]
    const params = new URLSearchParams({
      source: 'assessment',
      scenario: String(scenarioIndex + 1),
      recommendation: 'bar',
      gap: lowestDimension?.id || '',
      concern: primaryConcern,
      stage: currentStage,
    })

    return {
      kind: 'bar_trial',
      productCode: 'bar_server_pack',
      route: `/programs/bar-server/trial?${params.toString()}`,
      eyebrow: '根据测评匹配的实战验证',
      title: `你的主要差距是${gapLabel}，先用“${focus.shortTitle}”验证一次`,
      description: focus.description,
      cta: '验证我的现场处理能力',
      scenarioIndex,
      gapLabel,
      concernLabel: concernLabels[primaryConcern] || '',
      stageLabel: stageLabels[currentStage] || '',
    }
  }

  const positionKey = positionKeys[primaryJob.id] || primaryJob.id
  const preparationRoute = primaryJob.id === 'retail'
    ? '/programs/retail'
    : primaryJob.id === 'beauty_spa'
      ? '/jobs'
      : `/tasks/phase2/Task5?position=${encodeURIComponent(positionKey)}&source=assessment-result`
  const questionsRoute = publicQuestionPositions.has(positionKey)
    ? `/academy/interview-questions?position=${encodeURIComponent(positionKey)}`
    : '/academy/interview-questions'

  return {
    kind: 'resources',
    productCode: primaryJob.id === 'retail' ? 'retail_sales_pack' : null,
    route: preparationRoute,
    questionsRoute,
    eyebrow: '按推荐岗位继续准备',
    title: `先围绕${primaryJob.title}补齐${gapLabel}`,
    description: '先核对岗位职责、进入门槛和准备动作，再用公开题库检查自己能否说清真实经历与岗位判断。',
    cta: '查看岗位准备清单',
    secondaryCta: '查看公开岗位题库',
    gapLabel,
    concernLabel: concernLabels[primaryConcern] || '',
    stageLabel: stageLabels[currentStage] || '',
  }
}

export const readAssessmentTrialContext = (search = '') => {
  const params = new URLSearchParams(search)
  if (params.get('source') !== 'assessment') return null

  const scenarioNumber = Number(params.get('scenario'))
  if (!Number.isInteger(scenarioNumber) || scenarioNumber < 1 || scenarioNumber > barTrialFocus.length) return null

  const gap = params.get('gap') || ''
  const concern = params.get('concern') || ''
  const stage = params.get('stage') || ''

  return {
    scenarioIndex: scenarioNumber - 1,
    gap,
    gapLabel: dimensionLabels[gap] || '当前核心短板',
    concern,
    concernLabel: concernLabels[concern] || '',
    currentStage: stage,
    stageLabel: stageLabels[stage] || '',
  }
}
