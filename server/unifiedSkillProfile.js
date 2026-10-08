const SKILL_KEYS = Object.freeze([
  'listening',
  'speaking_clarity',
  'interview_structure',
  'job_knowledge',
  'guest_handling',
  'sales',
  'problem_solving',
  'safety_judgment',
])

const clampScore = (value) => Math.round(Math.min(100, Math.max(0, Number(value) || 0)))
const average = (...values) => clampScore(values.reduce((sum, value) => sum + clampScore(value), 0) / values.length)
const textList = (value, limit = 3) => Array.isArray(value)
  ? value.map((item) => String(item || '').trim().slice(0, 220)).filter(Boolean).slice(0, limit)
  : []

export const getJobKeyForPosition = (position = '') => {
  const normalized = String(position || '').trim()
  if (/retail|sales associate|duty[\s-]*free|免税|零售/i.test(normalized)) return 'retail'
  if (/bar[\s_-]*server|bartender|酒吧|调酒/i.test(normalized)) return 'bar_server'
  return 'cruise_general'
}

const evidence = (skillKey, score, weight, note = '') => ({
  skillKey,
  score: clampScore(score),
  weight,
  note: String(note || '').trim().slice(0, 420),
})

export const mapScenarioEvidence = ({ jobKey, scenarioId = '', skillScores = {}, weaknesses = [] }) => {
  const note = textList(weaknesses).join('；')
  if (jobKey === 'retail') {
    return [
      evidence('speaking_clarity', average(skillScores.communication, skillScores.english), 1.2, note),
      evidence('job_knowledge', skillScores.productKnowledge, 1.4, note),
      evidence('guest_handling', skillScores.guestExperience, 1.4, note),
      evidence('sales', skillScores.selling, 1.4, note),
      evidence('problem_solving', average(skillScores.operations, skillScores.guestExperience), 1.1, note),
      evidence('safety_judgment', skillScores.operations, 0.8, note),
    ]
  }

  const rows = [
    evidence('speaking_clarity', average(skillScores.communication, skillScores.english), 1.2, note),
    evidence('job_knowledge', skillScores.barKnowledge, 1.4, note),
    evidence('guest_handling', skillScores.service, 1.4, note),
    evidence('sales', skillScores.upselling, 1.4, note),
    evidence('problem_solving', skillScores.problemSolving, 1.2, note),
  ]
  if (/allergy|responsible|intoxicat|safety/i.test(scenarioId)) {
    rows.push(evidence(
      'safety_judgment',
      average(skillScores.service, skillScores.problemSolving, skillScores.barKnowledge),
      1.5,
      note,
    ))
  }
  return rows
}

export const mapMockInterviewEvidence = ({ evaluation = {} }) => {
  const score = clampScore(evaluation.overallScore)
  const note = textList(evaluation.priorities).join('；') || String(evaluation.overallSuggestion || '').slice(0, 420)
  return [
    evidence('interview_structure', score, 1.4, note),
    evidence('speaking_clarity', score, 0.8, note),
  ]
}

export const mapAssessmentEvidence = ({ evaluation = {} }) => {
  const english = clampScore(evaluation.englishScore)
  const service = clampScore(evaluation.serviceExperienceScore)
  const englishBreakdown = evaluation.englishBreakdown || {}
  const starBreakdown = evaluation.starBreakdown || {}
  const note = textList(evaluation.priorities).join('；') || String(evaluation.summary || '').slice(0, 420)
  const speaking = Object.keys(englishBreakdown).length
    ? average(english, clampScore((Number(englishBreakdown.deliveryEfficiency || 0) / 15) * 100), clampScore((Number(englishBreakdown.languageControl || 0) / 10) * 100))
    : english
  const safety = Object.keys(englishBreakdown).length
    ? clampScore((Number(englishBreakdown.serviceSafetyJudgment || 0) / 20) * 100)
    : average(english, service)
  const problemSolving = Object.keys(starBreakdown).length
    ? average(
        clampScore((Number(starBreakdown.judgmentAndAction || 0) / 25) * 100),
        clampScore((Number(starBreakdown.resultEvidence || 0) / 20) * 100),
      )
    : service

  return [
    evidence('speaking_clarity', speaking, 1.0, note),
    evidence('guest_handling', service, 0.9, note),
    evidence('problem_solving', problemSolving, 0.9, note),
    evidence('safety_judgment', safety, 1.0, note),
  ]
}

const recencyFactor = (occurredAt, now) => {
  const ageDays = Math.max(0, (now.getTime() - new Date(occurredAt).getTime()) / 86_400_000)
  if (ageDays <= 30) return 1
  if (ageDays <= 90) return 0.8
  return 0.6
}

export const aggregateSkillEvidence = (records = [], now = new Date()) => {
  const grouped = Object.fromEntries(SKILL_KEYS.map((key) => [key, []]))
  const sourceCounts = {}
  records.forEach((row) => {
    if (!grouped[row.skill_key]) return
    grouped[row.skill_key].push(row)
    sourceCounts[row.source] = (sourceCounts[row.source] || 0) + 1
  })

  const skills = {}
  const confidence = {}
  SKILL_KEYS.forEach((key) => {
    const items = grouped[key]
    if (!items.length) return
    let weightedTotal = 0
    let totalWeight = 0
    items.forEach((item) => {
      const weight = Math.max(0.1, Number(item.weight) || 1) * recencyFactor(item.occurred_at || item.created_at, now)
      weightedTotal += clampScore(item.score) * weight
      totalWeight += weight
    })
    skills[key] = clampScore(weightedTotal / totalWeight)
    confidence[key] = {
      evidenceCount: items.length,
      totalWeight: Number(totalWeight.toFixed(2)),
      level: items.length >= 3 ? 'high' : items.length >= 2 ? 'medium' : 'low',
    }
  })

  const ranked = Object.entries(skills).sort((left, right) => left[1] - right[1])
  const values = Object.values(skills)
  return {
    readinessScore: values.length ? clampScore(values.reduce((sum, value) => sum + value, 0) / values.length) : 0,
    skills,
    confidence,
    weakest: ranked.slice(0, 3).map(([skillKey, score]) => ({ skillKey, score })),
    evidenceCount: records.length,
    sourceCounts,
    coveragePercent: Math.round((values.length / SKILL_KEYS.length) * 100),
  }
}

export const persistUnifiedSkillEvidence = async ({
  admin,
  userId,
  jobKey,
  source,
  sourceId,
  entries,
  metadata = {},
  occurredAt = new Date().toISOString(),
}) => {
  const validEntries = (entries || []).filter((item) => SKILL_KEYS.includes(item.skillKey))
  if (!validEntries.length || !sourceId) return null

  const evidenceRows = validEntries.map((item) => ({
    user_id: userId,
    job_key: jobKey,
    skill_key: item.skillKey,
    score: clampScore(item.score),
    weight: Math.max(0.1, Number(item.weight) || 1),
    source,
    source_id: String(sourceId).slice(0, 160),
    evidence_text: String(item.note || '').slice(0, 420) || null,
    metadata,
    occurred_at: occurredAt,
  }))
  const { error: evidenceError } = await admin
    .from('user_skill_evidence')
    .upsert(evidenceRows, { onConflict: 'user_id,source,source_id,skill_key' })
  if (evidenceError) throw evidenceError

  const targetKeys = new Set([jobKey])
  if (jobKey === 'cruise_general') {
    const { data: existingProfiles, error: profilesError } = await admin
      .from('user_skill_profiles')
      .select('job_key')
      .eq('user_id', userId)
    if (profilesError) throw profilesError
    ;(existingProfiles || []).forEach((row) => targetKeys.add(row.job_key))
  }

  let requestedProfile = null
  for (const targetKey of targetKeys) {
    let query = admin
      .from('user_skill_evidence')
      .select('skill_key, score, weight, source, occurred_at, created_at')
      .eq('user_id', userId)
    query = targetKey === 'cruise_general'
      ? query.eq('job_key', 'cruise_general')
      : query.in('job_key', [targetKey, 'cruise_general'])
    const { data: allEvidence, error: lookupError } = await query
    if (lookupError) throw lookupError

    const profile = aggregateSkillEvidence(allEvidence || [])
    const { error: profileError } = await admin.from('user_skill_profiles').upsert({
      user_id: userId,
      job_key: targetKey,
      readiness_score: profile.readinessScore,
      skills: profile.skills,
      confidence: profile.confidence,
      weakest: profile.weakest,
      evidence_count: profile.evidenceCount,
      source_counts: profile.sourceCounts,
      coverage_percent: profile.coveragePercent,
      updated_at: occurredAt,
    }, { onConflict: 'user_id,job_key' })
    if (profileError) throw profileError
    if (targetKey === jobKey) requestedProfile = profile
  }

  return requestedProfile
}

export { SKILL_KEYS }
