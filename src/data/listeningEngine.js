export const createListeningEngine = (drills, readProgress = () => ({})) => {
const getCompletedListeningDrills = (progress = readProgress()) => (
  drills.filter((drill) => progress[drill.id]?.completedAt).length
)

const getListeningDrillStatus = (drill, progress = readProgress()) => {
  const entry = progress[drill.id] || {}
  if (!entry.normalPlays && !entry.attempts) return 'not_started'
  if (!entry.completedAt) return 'needs_listening'
  if (!entry.speakingPractice?.completedAt) return 'needs_speaking'
  if (Number(entry.slowPlays || 0) >= 2) return 'needs_normal_speed'
  return 'mastered'
}

const getRecommendedListeningDrill = (progress = readProgress()) => {
  const candidates = drills.map((drill, index) => {
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

const getListeningUnitStats = (progress = readProgress()) => {
  const units = new Map()
  drills.forEach((drill) => {
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

const scoreBarListeningAnswer = (drill, answers = {}) => {
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

const isBarListeningAnswerComplete = (drill, answers = {}) => (
  drill.type === 'choice'
    ? Boolean(answers.choice)
    : drill.fields.every((field) => answers[field.key])
)

const getShiftChallengeDrills = (progress = readProgress(), count = 5) => {
  const statusPriority = {
    needs_listening: 500,
    needs_normal_speed: 450,
    needs_speaking: 350,
    mastered: 300,
    not_started: 200,
  }
  const candidates = drills.map((drill, index) => ({
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


return { getCompletedListeningDrills, getListeningDrillStatus, getRecommendedListeningDrill, getListeningUnitStats, scoreBarListeningAnswer, isBarListeningAnswerComplete, getShiftChallengeDrills }
}
