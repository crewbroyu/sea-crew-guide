const foundation = (day, id, title, description) => ({
  day,
  id: `${day}-${id}`,
  title,
  description,
  route: `/programs/bar-server/foundation/${id}`,
  requirement: { type: 'foundation_days', ids: [id] },
})

const listening = (day, id, title, description, ids) => ({
  day,
  id: `${day}-${id}`,
  title,
  description,
  route: '/programs/bar-server/listening',
  requirement: { type: 'listening_speaking_drills', ids },
})

const foundationGroups = {
  spiritsCocktails: ['spirit-map', 'classic-cocktails'],
  whiskeyWine: ['whiskey-service', 'wine-beer-zero'],
  glasswareMenu: ['glassware-garnish', 'cruise-menu-patterns'],
}

const listeningGroups = {
  ordersA: ['order-mojito-family', 'order-gin-tonic-modifiers'],
  ordersB: ['order-wine-water', 'order-beer-zero'],
  serviceA: ['order-whiskey-service', 'package-premium-check'],
  serviceB: ['recommendation-preference', 'clarify-last-drink'],
  pressureA: ['out-of-stock-mint', 'complaint-too-sweet'],
  pressureB: ['supervisor-restock', 'responsible-service-escalation'],
}

const groupedFoundation = (day, id, title, description, ids) => ({
  day,
  id: `${day}-${id}`,
  title,
  description,
  route: `/programs/bar-server/foundation/${ids[0]}`,
  requirement: { type: 'foundation_days', ids },
})

const milestone = (day, id, title, description, route, requirement) => ({
  day,
  id: `${day}-${id}`,
  title,
  description,
  route,
  requirement,
})

export const BAR_SERVER_STAGE_PLANS = {
  job_search: [
    foundation(1, 'service-role', '先弄清 Bar Server 到底做什么', '掌握完整服务闭环和最基本的确认表达。'),
    foundation(2, 'spirit-map', '建立六大基酒地图', '先会区分，再学习用简单英语描述。'),
    foundation(3, 'classic-cocktails', '掌握高频鸡尾酒结构', '把酒名、基酒和口味联系起来。'),
    foundation(4, 'whiskey-service', '补齐威士忌服务方式', '理解 neat、on the rocks 和 water on the side。'),
    foundation(5, 'wine-beer-zero', '葡萄酒、啤酒与无酒精选择', '达到面试和基础推荐所需的知识宽度。'),
    milestone(6, 'interview-stories', '整理自己的服务经历', '把已有经历整理成招聘官能听懂的英文素材。', '/tasks/phase2/Task6?source=bar-plan', { type: 'interview_ready' }),
    foundation(7, 'public-health', '安全、卫生与责任售酒', '优先掌握不能靠临场猜测的红线知识。'),
    foundation(8, 'glassware-garnish', '杯具与装饰基础', '减少面试和试工中的低级知识错误。'),
    foundation(9, 'cruise-menu-patterns', '读懂邮轮酒单与套餐规则', '练习不确定时先核实，不随口承诺。'),
    foundation(10, 'service-application', '完成岗位知识综合运用', '把前九天知识放回完整服务过程。'),
    listening(11, 'orders', '开始订单听说', '完成四个基础订单场景的听懂与回应。', [...listeningGroups.ordersA, ...listeningGroups.ordersB]),
    listening(12, 'service', '训练推荐与确认', '处理饮用方式、套餐、偏好和没听清。', [...listeningGroups.serviceA, ...listeningGroups.serviceB]),
    milestone(13, 'simulation', '完成一次岗位场景模拟', '用连续对话验证知识能否真正用于工作。', '/programs/bar-server/training', { type: 'scenario_count', count: 1 }),
    milestone(14, 'shift', '完成求职前班次验证', '正常语速、限时五题，达到 70 分再进入集中面试准备。', '/programs/bar-server/listening/shift', { type: 'shift_score', score: 70 }),
  ],
  first_contract: [
    foundation(1, 'service-role', '熟悉上船后的服务闭环', '先知道每次接待从欢迎到确认应该怎么走。'),
    groupedFoundation(2, 'drinks-core', '基酒与高频鸡尾酒', '用一个训练日建立最常用的饮品框架。', foundationGroups.spiritsCocktails),
    groupedFoundation(3, 'wine-whiskey', '威士忌、葡萄酒与啤酒', '补齐最常见的饮用方式和推荐问题。', foundationGroups.whiskeyWine),
    foundation(4, 'public-health', '卫生与责任售酒红线', '登船前先记住必须升级处理的情况。'),
    groupedFoundation(5, 'tools-menu', '杯具、装饰与酒单', '把产品知识接到实际出品和套餐确认。', foundationGroups.glasswareMenu),
    foundation(6, 'service-application', '完整服务流程演练', '把岗位知识连成一次完整班次动作。'),
    listening(7, 'orders-a', '两杯订单与修改要求', '先练少甜、无酒精和不同冰量。', listeningGroups.ordersA),
    listening(8, 'orders-b', '数量、酒款与送达要求', '练习多人订单和相似词辨别。', listeningGroups.ordersB),
    listening(9, 'service-a', '饮用方式与套餐确认', '不漏掉 on the side，也不随口承诺免费。', listeningGroups.serviceA),
    listening(10, 'service-b', '偏好推荐与没听清', '抓住真正影响推荐的条件，并学会追问。', listeningGroups.serviceB),
    listening(11, 'pressure-a', '缺货与客诉处理', '在压力下先回应影响，再给行动方案。', listeningGroups.pressureA),
    listening(12, 'pressure-b', '主管指令与安全升级', '听清任务顺序、禁止事项和升级条件。', listeningGroups.pressureB),
    milestone(13, 'simulation', '完成一次真实岗位模拟', '连续回应客人和追问，检查是否能独立处理。', '/programs/bar-server/training', { type: 'scenario_count', count: 1 }),
    milestone(14, 'shift', '完成登船前班次验证', '五个限时场景达到 70 分，确认能跟上基本班次。', '/programs/bar-server/listening/shift', { type: 'shift_score', score: 70 }),
  ],
  experienced: [
    milestone(1, 'baseline', '先做一次班次基线测试', '不预习，先看正常语速和限时条件下的真实水平。', '/programs/bar-server/listening/shift', { type: 'shift_attempts', count: 1 }),
    listening(2, 'safety-pressure', '补最危险的听说弱项', '优先完成客诉、主管指令和责任售酒。', ['complaint-too-sweet', 'supervisor-restock', 'responsible-service-escalation']),
    listening(3, 'service-pressure', '补推荐、确认与缺货处理', '把有经验但容易说得不完整的环节补齐。', ['recommendation-preference', 'clarify-last-drink', 'out-of-stock-mint']),
    groupedFoundation(4, 'safety-review', '复习卫生与综合服务红线', '只回炉最容易造成严重错误的基础内容。', ['public-health', 'service-application']),
    milestone(5, 'simulation-one', '完成第一轮岗位模拟', '让 AI 追问暴露经验表达和处理顺序问题。', '/programs/bar-server/training', { type: 'scenario_count', count: 1 }),
    milestone(6, 'listening-six', '完成至少六个听说场景', '补齐诊断后最需要处理的六题。', '/programs/bar-server/listening', { type: 'listening_count', count: 6 }),
    milestone(7, 'speaking-six', '完成至少六个开口回应', '避免只听得懂，却在现场组织不出话。', '/programs/bar-server/listening', { type: 'speaking_count', count: 6 }),
    milestone(8, 'shift-seventy', '班次挑战达到 70 分', '先达到基本可用，再进入高压模拟。', '/programs/bar-server/listening/shift', { type: 'shift_score', score: 70 }),
    milestone(9, 'simulation-two', '完成第二个岗位模拟', '用不同难度检查经验是否可迁移。', '/programs/bar-server/training', { type: 'scenario_count', count: 2 }),
    groupedFoundation(10, 'product-review', '定向复习产品知识', '快速复习威士忌、酒水与套餐表达。', ['whiskey-service', 'wine-beer-zero', 'cruise-menu-patterns']),
    milestone(11, 'listening-all', '完成全部十二个听力场景', '确保基础订单与高压指令都没有空白。', '/programs/bar-server/listening', { type: 'listening_count', count: 12 }),
    milestone(12, 'speaking-all', '完成全部十二个开口回应', '把正确处理顺序变成能直接说出的表达。', '/programs/bar-server/listening', { type: 'speaking_count', count: 12 }),
    milestone(13, 'simulation-three', '完成第三个岗位模拟', '用连续三次结果观察真实稳定性。', '/programs/bar-server/training', { type: 'scenario_count', count: 3 }),
    milestone(14, 'shift-eighty-five', '班次挑战达到 85 分', '以稳定工作水平完成最终验证。', '/programs/bar-server/listening/shift', { type: 'shift_score', score: 85 }),
  ],
}

export const getBarServerStagePlan = (stageId) => (
  BAR_SERVER_STAGE_PLANS[stageId] || BAR_SERVER_STAGE_PLANS.job_search
)

export const isBarServerPlanItemComplete = (item, context = {}) => {
  const requirement = item.requirement || {}
  const foundationProgress = context.foundationProgress || {}
  const listeningProgress = context.listeningProgress || {}
  const shiftHistory = context.shiftHistory || []

  if (requirement.type === 'foundation_days') {
    return requirement.ids.every((id) => Boolean(foundationProgress[id]?.completedAt))
  }
  if (requirement.type === 'listening_speaking_drills') {
    return requirement.ids.every((id) => (
      Boolean(listeningProgress[id]?.completedAt)
      && Boolean(listeningProgress[id]?.speakingPractice?.completedAt)
    ))
  }
  if (requirement.type === 'listening_count') {
    return Object.values(listeningProgress).filter((entry) => entry?.completedAt).length >= requirement.count
  }
  if (requirement.type === 'speaking_count') {
    return Object.values(listeningProgress).filter((entry) => entry?.speakingPractice?.completedAt).length >= requirement.count
  }
  if (requirement.type === 'shift_attempts') return shiftHistory.length >= requirement.count
  if (requirement.type === 'shift_score') return shiftHistory.some((attempt) => Number(attempt?.score || 0) >= requirement.score)
  if (requirement.type === 'scenario_count') return Number(context.scenarioCompletedCount || 0) >= requirement.count
  if (requirement.type === 'interview_ready') return Boolean(context.interviewCompleted)
  return false
}

export const getBarServerPlanProgress = (stageId, context = {}) => {
  const items = getBarServerStagePlan(stageId).map((item) => ({
    ...item,
    completed: isBarServerPlanItemComplete(item, context),
  }))
  const completedCount = items.filter((item) => item.completed).length
  const currentItem = items.find((item) => !item.completed) || items.at(-1)
  return {
    items,
    completedCount,
    percent: Math.round((completedCount / items.length) * 100),
    currentItem,
    isComplete: completedCount === items.length,
  }
}
