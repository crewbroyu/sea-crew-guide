export const BAR_LISTENING_VERSION = 1
export const BAR_LISTENING_PROGRESS_KEY = 'bar_server_listening_progress_v1'
export const BAR_SERVER_STAGE_KEY = 'bar_server_learning_stage'
export const BAR_SHIFT_HISTORY_KEY = 'bar_server_shift_challenge_history_v1'
export const BAR_SHIFT_QUESTION_SECONDS = 30

export const BAR_SERVER_LEARNING_STAGES = [
  {
    id: 'job_search',
    label: '正在准备求职',
    description: '先快速掌握岗位知识和面试表达，再补工作听说。',
  },
  {
    id: 'first_contract',
    label: '已签合同，第一次上船',
    description: '先补岗位知识，再重点训练点单、确认和班次沟通。',
  },
  {
    id: 'experienced',
    label: '已有船上或酒吧经验',
    description: '先诊断听说弱项，再进入高压场景和针对性复习。',
  },
]

const captureField = (key, label, options, correct) => ({ key, label, options, correct })

export const BAR_SERVER_LISTENING_DRILLS = [
  {
    id: 'order-mojito-family',
    unit: '订单捕捉',
    level: 1,
    role: 'Guest',
    context: 'Atrium Bar · 登船日晚间，一家三口第一次点单。',
    prompt: 'Hi. Could I have one mojito, but not too sweet? And my wife would like a virgin piña colada.',
    task: '记录两杯饮品及关键修改要求。',
    response: "Certainly. One mojito, not too sweet, and one virgin piña colada. I'll bring those for you.",
    responseCue: '复述两杯饮品，并明确保留少甜和无酒精要求',
    type: 'capture',
    fields: [
      captureField('firstDrink', '第一杯', ['Mojito', 'Margarita', 'Mai Tai'], 'Mojito'),
      captureField('firstModification', '第一杯要求', ['Less sweet', 'No ice', 'Double'], 'Less sweet'),
      captureField('secondDrink', '第二杯', ['Piña Colada', 'Virgin Piña Colada', 'Daiquiri'], 'Virgin Piña Colada'),
    ],
    explanation: '需要抓住 one、not too sweet 和 virgin。Virgin 表示无酒精，不能漏记。',
  },
  {
    id: 'order-gin-tonic-modifiers',
    unit: '订单捕捉',
    level: 1,
    role: 'Guest',
    context: 'Lounge Bar · 两位客人同时点相同饮品，但修改不同。',
    prompt: 'Two gin and tonics, please. One with no ice, and the other with light ice and extra lime.',
    task: '区分两杯相同饮品的不同要求。',
    response: 'Let me confirm: one gin and tonic with no ice, and one with light ice and extra lime.',
    responseCue: '分别复述两杯相同饮品的不同修改要求',
    type: 'capture',
    fields: [
      captureField('quantity', '数量', ['One', 'Two', 'Three'], 'Two'),
      captureField('firstModification', '第一杯', ['No ice', 'Light ice', 'Extra lime'], 'No ice'),
      captureField('secondModification', '第二杯', ['Light ice and extra lime', 'No lime', 'Double gin'], 'Light ice and extra lime'),
    ],
    explanation: '多人订单最容易把修改要求混在一起。复述时要分别确认 each drink。',
  },
  {
    id: 'order-wine-water',
    unit: '订单捕捉',
    level: 1,
    role: 'Guest',
    context: 'Wine Bar · 晚餐前快速点单。',
    prompt: 'May I have a glass of Cabernet Sauvignon and a bottle of sparkling water?',
    task: '识别酒类和水的类型。',
    response: 'Certainly. One glass of Cabernet Sauvignon and one bottle of sparkling water.',
    responseCue: '简洁复述酒款和水的类型',
    type: 'capture',
    fields: [
      captureField('wine', '葡萄酒', ['Cabernet Sauvignon', 'Chardonnay', 'Prosecco'], 'Cabernet Sauvignon'),
      captureField('water', '水', ['Still water', 'Sparkling water', 'Tonic water'], 'Sparkling water'),
    ],
    explanation: 'Cabernet Sauvignon 是红葡萄酒；sparkling water 不能听成 still water。',
  },
  {
    id: 'order-beer-zero',
    unit: '订单捕捉',
    level: 1,
    role: 'Guest',
    context: 'Pool Bar · 四位客人一起点啤酒。',
    prompt: 'We’ll have three lagers and one non-alcoholic beer. Please bring all four together.',
    task: '记录数量并识别无酒精饮品。',
    response: "That's three lagers and one non-alcoholic beer, all served together.",
    responseCue: '确认数量、无酒精饮品和一起送达',
    type: 'capture',
    fields: [
      captureField('lagerQuantity', '普通 Lager', ['Two', 'Three', 'Four'], 'Three'),
      captureField('zeroQuantity', '无酒精啤酒', ['None', 'One', 'Two'], 'One'),
      captureField('delivery', '上饮要求', ['Bring all four together', 'Bring them separately', 'Bring the zero-alcohol beer first'], 'Bring all four together'),
    ],
    explanation: '总数是四杯，其中三杯 lager、一杯 non-alcoholic beer，并要求一起送达。',
  },
  {
    id: 'order-whiskey-service',
    unit: '订单捕捉',
    level: 2,
    role: 'Guest',
    context: 'Whiskey Bar · 客人指定饮用方式。',
    prompt: 'I’d like a bourbon on the rocks, with just a small splash of water on the side.',
    task: '识别基酒、饮用方式和附加要求。',
    response: 'Certainly. One bourbon on the rocks, with a little water on the side.',
    responseCue: '确认基酒、加冰方式和水需分开放',
    type: 'capture',
    fields: [
      captureField('spirit', '基酒', ['Bourbon', 'Scotch', 'Brandy'], 'Bourbon'),
      captureField('serve', '饮用方式', ['Neat', 'On the rocks', 'With soda'], 'On the rocks'),
      captureField('extra', '附加要求', ['Water on the side', 'Extra ice', 'Lemon on the side'], 'Water on the side'),
    ],
    explanation: 'On the rocks 表示加冰；water on the side 表示水分开放，不是直接倒进酒里。',
  },
  {
    id: 'package-premium-check',
    unit: '套餐与价格',
    level: 2,
    role: 'Guest',
    context: 'Atrium Bar · 客人询问升级基酒是否包含在套餐内。',
    prompt: 'Is the margarita with premium tequila included in my package, or will there be an extra charge?',
    task: '判断客人真正需要你确认的信息。',
    response: 'Let me check your beverage package and confirm whether premium tequila has an additional charge.',
    responseCue: '不做价格承诺，先说明会核实套餐范围',
    type: 'choice',
    options: [
      { id: 'a', text: '客人只是在问 Margarita 的配方' },
      { id: 'b', text: '客人在确认 premium tequila 是否需要额外付费' },
      { id: 'c', text: '客人要求免费升级套餐' },
    ],
    correctOptionId: 'b',
    explanation: '不能直接保证免费。应核实当前套餐范围和 premium tequila 的额外费用。',
  },
  {
    id: 'recommendation-preference',
    unit: '需求与推荐',
    level: 2,
    role: 'Guest',
    context: 'Pool Bar · 客人没有指定酒名，只描述口味。',
    prompt: 'I’m looking for something light and citrusy, but not too sweet. Gin is fine, but I don’t want anything creamy.',
    task: '抓住会改变推荐结果的偏好。',
    response: "Certainly. I can recommend a light, citrusy gin cocktail that isn't too sweet or creamy.",
    responseCue: '把口味偏好转成清晰的推荐方向',
    type: 'capture',
    fields: [
      captureField('style', '风格', ['Light and citrusy', 'Strong and smoky', 'Rich and creamy'], 'Light and citrusy'),
      captureField('sweetness', '甜度', ['Not too sweet', 'Very sweet', 'No preference'], 'Not too sweet'),
      captureField('acceptedSpirit', '可接受基酒', ['Gin', 'Rum only', 'No alcohol'], 'Gin'),
      captureField('avoid', '明确不要', ['Creamy drinks', 'Citrus', 'Soda'], 'Creamy drinks'),
    ],
    explanation: '推荐前要同时保留 light、citrusy、not too sweet、gin is fine，并排除 creamy。',
  },
  {
    id: 'clarify-last-drink',
    unit: '没听清时确认',
    level: 2,
    role: 'Guest',
    context: 'Busy Bar · 背景嘈杂，你没有听清最后一杯。',
    prompt: 'That’s a lager, a mojito with no straw, and a... sorry, did you get the last one?',
    task: '选择最专业的处理方式。',
    response: 'I have the lager and the mojito with no straw. Could you repeat the last drink, please?',
    responseCue: '先复述已听清内容，再只追问遗漏部分',
    type: 'choice',
    options: [
      { id: 'a', text: '凭感觉输入一杯常见饮品' },
      { id: 'b', text: 'Could you repeat the last drink, please?' },
      { id: 'c', text: '只确认前两杯，然后直接离开' },
    ],
    correctOptionId: 'b',
    explanation: '没听清时必须明确请求重复，不能猜测或遗漏。',
  },
  {
    id: 'out-of-stock-mint',
    unit: '缺货与替代',
    level: 2,
    role: 'Bartender',
    context: 'Pool Bar · Bartender 告诉你薄荷暂时用完。',
    prompt: 'We’re out of mint, so please stop taking mojito orders and offer a similar refreshing alternative.',
    task: '判断你接下来要执行的动作。',
    response: "I'm sorry, we're currently out of mint, so the mojito isn't available. May I suggest another refreshing cocktail?",
    responseCue: '透明说明缺货，并主动提供相近替代',
    type: 'choice',
    options: [
      { id: 'a', text: '继续接 Mojito，等客人催单再解释' },
      { id: 'b', text: '停止接 Mojito，并向客人透明说明后推荐清爽替代品' },
      { id: 'c', text: '不告诉客人，直接让 bartender 换一种原料' },
    ],
    correctOptionId: 'b',
    explanation: 'Out of mint 会直接影响 Mojito。应停止接单、透明说明并提供真正相近的替代。',
  },
  {
    id: 'complaint-too-sweet',
    unit: '客诉处理',
    level: 3,
    role: 'Guest',
    context: 'Lounge Bar · 客人等了很久，收到的酒又太甜。',
    prompt: 'This isn’t what I ordered. I’ve waited twenty minutes, and now it’s far too sweet.',
    task: '选择能同时回应等待和饮品问题的开场。',
    response: "I'm sorry about the wait and that the drink isn't right. Let me confirm your order and have it corrected.",
    responseCue: '同时承认等待和饮品错误，再给出处理动作',
    type: 'choice',
    options: [
      { id: 'a', text: 'The bartender made it, so you need to speak to him.' },
      { id: 'b', text: 'I’m sorry about the wait and that the drink isn’t right. Let me confirm your order and fix this.' },
      { id: 'c', text: 'This cocktail is normally sweet.' },
    ],
    correctOptionId: 'b',
    explanation: '先承认两层影响，再核对订单并提出具体行动，不能甩锅或争辩。',
  },
  {
    id: 'supervisor-restock',
    unit: '同事与主管',
    level: 3,
    role: 'Supervisor',
    context: 'Opening Shift · 主管连续交代两项任务。',
    prompt: 'Please restock the highball glasses first, then check the lime and mint levels before we open.',
    task: '记录任务顺序。',
    response: "Understood. I'll restock the highball glasses first, then check the lime and mint levels.",
    responseCue: '按原顺序复述主管交代的两项任务',
    type: 'capture',
    fields: [
      captureField('firstTask', '先做什么', ['Restock highball glasses', 'Check lime', 'Check mint'], 'Restock highball glasses'),
      captureField('secondTask', '然后做什么', ['Check lime and mint levels', 'Clean the wine glasses', 'Open the bar immediately'], 'Check lime and mint levels'),
    ],
    explanation: 'First 和 then 给出了明确顺序：先补 highball glasses，再检查 lime 和 mint。',
  },
  {
    id: 'responsible-service-escalation',
    unit: '安全与升级',
    level: 3,
    role: 'Supervisor',
    context: 'Casino Bar · 客人继续要求烈酒，主管给出处理指令。',
    prompt: 'Do not serve him another alcoholic drink. Offer water, stay nearby, and call me if he becomes aggressive.',
    task: '识别禁止事项、替代方案和升级条件。',
    response: "Understood. I won't serve him any more alcohol. I'll offer water and call you if he becomes aggressive.",
    responseCue: '复述停止供酒、提供水和升级条件',
    type: 'capture',
    fields: [
      captureField('doNot', '不能做', ['Serve more alcohol', 'Offer water', 'Stay nearby'], 'Serve more alcohol'),
      captureField('alternative', '提供什么', ['Water', 'A double whisky', 'A free cocktail'], 'Water'),
      captureField('escalation', '何时呼叫主管', ['If he becomes aggressive', 'Only after the bar closes', 'Never'], 'If he becomes aggressive'),
    ],
    explanation: '安全指令包含三部分：停止供酒、提供水、客人变得 aggressive 时立即升级。',
  },
]

export const readBarListeningProgress = () => {
  try {
    return JSON.parse(localStorage.getItem(BAR_LISTENING_PROGRESS_KEY) || '{}')
  } catch {
    return {}
  }
}

export const writeBarListeningProgress = (progress = {}) => {
  localStorage.setItem(BAR_LISTENING_PROGRESS_KEY, JSON.stringify(progress))
}

export const writeBarShiftHistory = (history = []) => {
  localStorage.setItem(BAR_SHIFT_HISTORY_KEY, JSON.stringify(history.slice(0, 10)))
}

export const getCompletedListeningDrills = (progress = readBarListeningProgress()) => (
  BAR_SERVER_LISTENING_DRILLS.filter((drill) => progress[drill.id]?.completedAt).length
)

export const getListeningDrillStatus = (drill, progress = {}) => {
  const entry = progress[drill.id] || {}
  if (!entry.normalPlays && !entry.attempts) return 'not_started'
  if (!entry.completedAt) return 'needs_listening'
  if (!entry.speakingPractice?.completedAt) return 'needs_speaking'
  if (Number(entry.slowPlays || 0) >= 2) return 'needs_normal_speed'
  return 'mastered'
}

export const getRecommendedListeningDrill = (progress = readBarListeningProgress()) => {
  const candidates = BAR_SERVER_LISTENING_DRILLS.map((drill, index) => {
    const entry = progress[drill.id] || {}
    const status = getListeningDrillStatus(drill, progress)
    const priorities = {
      needs_listening: 500 + Number(entry.attempts || 0) * 10,
      needs_speaking: 400,
      not_started: 300 - index,
      needs_normal_speed: 200 + Number(entry.slowPlays || 0),
      mastered: 100,
    }
    const reasons = {
      needs_listening: '这题已经开始但还没通过，先把遗漏的关键信息补齐。',
      needs_speaking: '你已经听懂这题，接下来完成两次现场回应。',
      not_started: '继续进入下一道未训练的工作场景。',
      needs_normal_speed: '这题较依赖慢速播放，建议回到正常语速巩固。',
      mastered: '全部训练已完成，从较早的场景开始保持熟练度。',
    }
    return {
      drill,
      index,
      status,
      priority: priorities[status],
      reason: reasons[status],
      lastAttemptAt: entry.lastAttemptAt || '',
    }
  })

  return candidates.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority
    if (a.status === 'mastered' && b.status === 'mastered') {
      return a.lastAttemptAt.localeCompare(b.lastAttemptAt)
    }
    return a.index - b.index
  })[0]
}

export const getListeningUnitStats = (progress = readBarListeningProgress()) => {
  const units = new Map()
  BAR_SERVER_LISTENING_DRILLS.forEach((drill) => {
    const current = units.get(drill.unit) || {
      unit: drill.unit,
      total: 0,
      listeningCompleted: 0,
      speakingCompleted: 0,
      needsReview: 0,
    }
    const entry = progress[drill.id] || {}
    const status = getListeningDrillStatus(drill, progress)
    current.total += 1
    if (entry.completedAt) current.listeningCompleted += 1
    if (entry.speakingPractice?.completedAt) current.speakingCompleted += 1
    if (['needs_listening', 'needs_normal_speed'].includes(status)) current.needsReview += 1
    units.set(drill.unit, current)
  })
  return [...units.values()]
}

export const scoreBarListeningAnswer = (drill, answers = {}) => {
  if (drill.type === 'choice') {
    return {
      score: answers.choice === drill.correctOptionId ? 100 : 0,
      fields: [],
    }
  }

  const fields = drill.fields.map((field) => ({
    key: field.key,
    label: field.label,
    answer: answers[field.key] || '',
    correct: field.correct,
    isCorrect: answers[field.key] === field.correct,
  }))
  const correctCount = fields.filter((field) => field.isCorrect).length
  return {
    score: Math.round((correctCount / fields.length) * 100),
    fields,
  }
}

export const isBarListeningAnswerComplete = (drill, answers = {}) => (
  drill.type === 'choice'
    ? Boolean(answers.choice)
    : drill.fields.every((field) => answers[field.key])
)

export const getShiftChallengeDrills = (progress = readBarListeningProgress(), count = 5) => {
  const statusPriority = {
    needs_listening: 500,
    needs_normal_speed: 450,
    needs_speaking: 350,
    mastered: 300,
    not_started: 200,
  }
  const candidates = BAR_SERVER_LISTENING_DRILLS.map((drill, index) => ({
    drill,
    index,
    status: getListeningDrillStatus(drill, progress),
  })).sort((a, b) => (
    statusPriority[b.status] - statusPriority[a.status]
    || Number(progress[a.drill.id]?.bestScore || 0) - Number(progress[b.drill.id]?.bestScore || 0)
    || a.index - b.index
  ))

  const selected = []
  const selectedIds = new Set()
  const addCandidate = (candidate) => {
    if (!candidate || selectedIds.has(candidate.drill.id) || selected.length >= count) return
    selected.push(candidate.drill)
    selectedIds.add(candidate.drill.id)
  }

  candidates
    .filter((candidate) => ['needs_listening', 'needs_normal_speed'].includes(candidate.status))
    .slice(0, 2)
    .forEach(addCandidate)

  const requiredLevels = [1, 2, 3]
  requiredLevels.forEach((level) => addCandidate(
    candidates.find((candidate) => candidate.drill.level === level && !selectedIds.has(candidate.drill.id)),
  ))

  const selectedUnits = new Set(selected.map((drill) => drill.unit))
  candidates.forEach((candidate) => {
    if (!selectedUnits.has(candidate.drill.unit) && selected.length < count) {
      addCandidate(candidate)
      selectedUnits.add(candidate.drill.unit)
    }
  })
  candidates.forEach(addCandidate)

  return selected.slice(0, count)
}

export const readBarShiftHistory = () => {
  try {
    const history = JSON.parse(localStorage.getItem(BAR_SHIFT_HISTORY_KEY) || '[]')
    return Array.isArray(history) ? history : []
  } catch {
    return []
  }
}
