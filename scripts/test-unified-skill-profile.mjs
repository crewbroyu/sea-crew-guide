import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  aggregateSkillEvidence,
  getJobKeyForPosition,
  mapAssessmentEvidence,
  mapMockInterviewEvidence,
  mapScenarioEvidence,
} from '../server/unifiedSkillProfile.js'

assert.equal(getJobKeyForPosition('Retail Sales Associate'), 'retail')
assert.equal(getJobKeyForPosition('Bar Server'), 'bar_server')
assert.equal(getJobKeyForPosition('Guest Services'), 'cruise_general')

const barEvidence = mapScenarioEvidence({
  jobKey: 'bar_server',
  scenarioId: 'bar_sim_allergy_safety',
  skillScores: {
    communication: 80,
    english: 90,
    barKnowledge: 60,
    service: 70,
    upselling: 50,
    problemSolving: 40,
  },
  weaknesses: ['交接顺序不完整。'],
})
assert.equal(barEvidence.find((item) => item.skillKey === 'speaking_clarity').score, 85)
assert.equal(barEvidence.find((item) => item.skillKey === 'safety_judgment').score, 57)
assert.equal(barEvidence.some((item) => item.skillKey === 'listening'), false, 'a scenario must not invent listening evidence')

const retailEvidence = mapScenarioEvidence({
  jobKey: 'retail',
  scenarioId: 'retail_sim_sea_day',
  skillScores: {
    communication: 72,
    english: 68,
    productKnowledge: 80,
    guestExperience: 76,
    selling: 64,
    operations: 60,
  },
})
assert.equal(retailEvidence.find((item) => item.skillKey === 'job_knowledge').score, 80)
assert.equal(retailEvidence.find((item) => item.skillKey === 'problem_solving').score, 68)

const mockEvidence = mapMockInterviewEvidence({ evaluation: {
  priorities: ['补充 STAR 结果。'],
  dimensionScores: {
    interviewStructure: 74,
    speakingClarity: 82,
    jobKnowledge: 68,
    guestHandling: 77,
    problemSolving: 71,
    safetyJudgment: 65,
  },
} })
assert.deepEqual(mockEvidence.map((item) => item.skillKey), [
  'interview_structure',
  'speaking_clarity',
  'job_knowledge',
  'guest_handling',
  'problem_solving',
  'safety_judgment',
])
assert.equal(mockEvidence.find((item) => item.skillKey === 'speaking_clarity').score, 82)

// Unobserved dimensions are not evidence: null, empty strings and booleans must never become a 0 score.
const partialMockEvidence = mapMockInterviewEvidence({ evaluation: {
  dimensionScores: {
    interviewStructure: 70,
    speakingClarity: 75,
    jobKnowledge: null,
    guestHandling: '',
    problemSolving: true,
    safetyJudgment: undefined,
  },
} })
assert.deepEqual(partialMockEvidence.map((item) => item.skillKey), ['interview_structure', 'speaking_clarity'])
assert.ok(partialMockEvidence.every((item) => item.score > 0))

const assessmentEvidence = mapAssessmentEvidence({
  evaluation: {
    englishScore: 70,
    serviceExperienceScore: 80,
    priorities: ['补充服务闭环。'],
    englishBreakdown: { deliveryEfficiency: 12, languageControl: 8, serviceSafetyJudgment: 15 },
    starBreakdown: { judgmentAndAction: 20, resultEvidence: 12 },
  },
})
assert.equal(assessmentEvidence.find((item) => item.skillKey === 'safety_judgment').score, 75)
assert.equal(assessmentEvidence.find((item) => item.skillKey === 'problem_solving').score, 70)
assert.deepEqual(assessmentEvidence.map((item) => item.weight), [1, 0.9, 1])

const fallbackAssessmentEvidence = mapAssessmentEvidence({
  evaluation: {
    englishScore: 70,
    serviceExperienceScore: 80,
    scoringMode: 'rules_fallback',
  },
})
assert.deepEqual(
  fallbackAssessmentEvidence.map((item) => item.score),
  [70, 80, 75],
  'Rules fallback keeps its scores; only the weight is reduced.',
)
assert.deepEqual(fallbackAssessmentEvidence.map((item) => item.weight), [0.5, 0.45, 0.5])

const profile = aggregateSkillEvidence([
  { skill_key: 'speaking_clarity', score: 80, weight: 1, source: 'assessment', source_id: 'assessment-1', occurred_at: '2026-10-01T00:00:00.000Z' },
  { skill_key: 'speaking_clarity', score: 60, weight: 1, source: 'interview', source_id: 'interview-1', occurred_at: '2026-09-01T00:00:00.000Z' },
  { skill_key: 'guest_handling', score: 70, weight: 1.4, source: 'scenario', source_id: 'scenario-1', occurred_at: '2026-10-01T00:00:00.000Z' },
  { skill_key: 'safety_judgment', score: 75, weight: 1.2, source: 'scenario', source_id: 'scenario-1', occurred_at: '2026-10-01T00:00:00.000Z' },
], new Date('2026-10-08T00:00:00.000Z'))
assert.equal(profile.skills.speaking_clarity, 71, 'recent evidence receives more weight')
assert.equal(profile.confidence.speaking_clarity.level, 'medium')
assert.equal(profile.evidenceCount, 3)
assert.equal(profile.sourceCounts.scenario, 1)
assert.equal(profile.coveragePercent, 38)

const atomicMigration = fs.readFileSync(new URL('../supabase/migrations/20261008170000_atomic_unified_skill_profiles.sql', import.meta.url), 'utf8')
assert.match(atomicMigration, /pg_advisory_xact_lock/i)
assert.match(atomicMigration, /count\(distinct \(source, source_id\)\)/i)
assert.match(atomicMigration, /complete_scenario_with_unified_profile/i)
assert.match(atomicMigration, /revoke all on function public\.upsert_unified_skill_evidence[\s\S]*from public, anon, authenticated/i)

const migration = fs.readFileSync(new URL('../supabase/migrations/20261008150000_unified_skill_profiles.sql', import.meta.url), 'utf8')
assert.match(migration, /force row level security/i)
assert.match(migration, /revoke all on table public\.user_skill_evidence from public, anon, authenticated/i)
assert.match(migration, /grant select on table public\.user_skill_profiles to authenticated/i)
assert.doesNotMatch(migration, /grant\s+(insert|update|delete).*authenticated/i)

const server = fs.readFileSync(new URL('../server/interviewAi.js', import.meta.url), 'utf8')
assert.match(server, /mapScenarioEvidence/)
assert.match(server, /mapMockInterviewEvidence/)
assert.match(server, /mapAssessmentEvidence/)
assert.match(server, /SUPABASE_SECRET_KEY/)

console.log('Unified capability profile passed: honest mappings, recency aggregation, server writes, and read-only learner access.')

