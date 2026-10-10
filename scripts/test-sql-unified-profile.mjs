import assert from 'node:assert/strict'
import fs from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { aggregateSkillEvidence } from '../server/unifiedSkillProfile.js'

// Runs the real Supabase migrations in an in-memory Postgres (PGlite) and checks the behavior
// of the unified skill profile RPCs, grants, and RLS. The shim below mirrors the parts of a
// Supabase project these migrations rely on: the three API roles, auth.uid(), and the default
// privileges Supabase grants on new tables and functions in the public schema.
const SUPABASE_SHIM = `
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable
  as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`

const MIGRATIONS = {
  scenarioTraining: 'supabase_scenario_training.sql',
  scenarioResume: 'supabase_scenario_training_resume.sql',
  trustedTraining: 'supabase/migrations/20261008090000_trusted_training_results.sql',
  unifiedProfiles: 'supabase/migrations/20261008150000_unified_skill_profiles.sql',
  normalizeConfidence: 'supabase/migrations/20261008160000_normalize_skill_confidence.sql',
  atomicProfiles: 'supabase/migrations/20261008170000_atomic_unified_skill_profiles.sql',
  revokeDraftInsert: 'supabase/migrations/20261010090000_revoke_learner_scenario_draft_insert.sql',
}
const ORDER = Object.keys(MIGRATIONS)
const readMigration = (key) => fs.readFileSync(new URL(`../${MIGRATIONS[key]}`, import.meta.url), 'utf8')

const createDb = async (upTo = ORDER.at(-1)) => {
  const db = await PGlite.create()
  await db.exec(SUPABASE_SHIM)
  for (const key of ORDER.slice(0, ORDER.indexOf(upTo) + 1)) await db.exec(readMigration(key))
  return db
}

const applyMigration = (db, key) => db.exec(readMigration(key))

const USER_A = '00000000-0000-4000-8000-00000000000a'
const USER_B = '00000000-0000-4000-8000-00000000000b'

const addUsers = (db) => db.exec(`insert into auth.users (id) values ('${USER_A}'), ('${USER_B}')`)

const asRole = async (db, role, fn, sub = '') => {
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [sub])
  await db.exec(`set role ${role}`)
  try {
    return await fn()
  } finally {
    await db.exec('reset role')
    await db.query("select set_config('request.jwt.claim.sub', '', false)")
  }
}

const upsertEvidence = (db, {
  userId = USER_A,
  jobKey = 'bar_server',
  source = 'assessment',
  sourceId,
  entries,
  metadata = {},
  occurredAt = new Date().toISOString(),
}) => db.query(
  'select public.upsert_unified_skill_evidence($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::timestamptz) as profile',
  [userId, jobKey, source, sourceId, JSON.stringify(entries), JSON.stringify(metadata), occurredAt],
).then((result) => result.rows[0].profile)

const evidenceRows = async (db, userId = USER_A) => (await db.query(
  `select skill_key, score, weight::float8 as weight, source, source_id, job_key, occurred_at
   from public.user_skill_evidence where user_id = $1 order by source, source_id, skill_key`,
  [userId],
)).rows

const storedProfile = async (db, jobKey, userId = USER_A) => (await db.query(
  'select * from public.user_skill_profiles where user_id = $1 and job_key = $2',
  [userId, jobKey],
)).rows[0]

const expectError = async (promise, pattern, message) => {
  await assert.rejects(promise, (error) => {
    assert.match(String(error.message), pattern, message)
    return true
  }, message)
}

const daysAgo = (days) => new Date(Date.now() - days * 86_400_000).toISOString()

const db = await createDb()
await addUsers(db)

// 1. Grants: the two RPCs are server-only; learners can read their own rows and write nothing.
const sampleEntries = [{ skill_key: 'speaking_clarity', score: 70, weight: 1 }]
for (const role of ['anon', 'authenticated']) {
  await expectError(
    asRole(db, role, () => upsertEvidence(db, { sourceId: `denied-${role}`, entries: sampleEntries }), USER_A),
    /permission denied for function upsert_unified_skill_evidence/,
    `${role} must not call upsert_unified_skill_evidence`,
  )
  await expectError(
    asRole(db, role, () => db.query(
      `select public.complete_scenario_with_unified_profile($1, gen_random_uuid(), 'bar_server', 'x',
        '{}'::jsonb, '{}'::jsonb, '[]'::jsonb, '[]'::jsonb, now())`,
      [USER_A],
    ), USER_A),
    /permission denied for function complete_scenario_with_unified_profile/,
    `${role} must not call complete_scenario_with_unified_profile`,
  )
}
await expectError(
  asRole(db, 'authenticated', () => db.query(
    `insert into public.user_skill_evidence (user_id, job_key, skill_key, score, source, source_id)
     values ($1, 'bar_server', 'sales', 100, 'assessment', 'forged')`,
    [USER_A],
  ), USER_A),
  /permission denied for table user_skill_evidence/,
  'Learners must not insert capability evidence directly.',
)
await expectError(
  asRole(db, 'authenticated', () => db.query(
    `insert into public.user_skill_profiles (user_id, job_key, readiness_score) values ($1, 'bar_server', 100)`,
    [USER_A],
  ), USER_A),
  /permission denied for table user_skill_profiles/,
  'Learners must not write capability profiles directly.',
)

await asRole(db, 'service_role', () => upsertEvidence(db, { userId: USER_A, sourceId: 'rls-a', entries: sampleEntries }))
await asRole(db, 'service_role', () => upsertEvidence(db, { userId: USER_B, sourceId: 'rls-b', entries: sampleEntries }))
const visibleToA = await asRole(db, 'authenticated', async () => ({
  evidence: (await db.query('select user_id, source_id from public.user_skill_evidence')).rows,
  profiles: (await db.query('select user_id from public.user_skill_profiles')).rows,
}), USER_A)
assert.deepEqual(visibleToA.evidence, [{ user_id: USER_A, source_id: 'rls-a' }], 'RLS must hide other learners’ evidence.')
assert.deepEqual(visibleToA.profiles, [{ user_id: USER_A }], 'RLS must hide other learners’ profiles.')
const visibleToAnon = await asRole(db, 'anon', () => db.query('select count(*)::int as n from public.user_skill_evidence').then(
  (result) => result.rows[0].n,
  (error) => error.message,
))
assert.match(String(visibleToAnon), /permission denied/, 'anon must not read capability evidence.')
await db.exec('delete from public.user_skill_evidence; delete from public.user_skill_profiles;')

// 2. Input validation rejects the whole write.
for (const [label, args] of [
  ['unknown job', { jobKey: 'captain', sourceId: 'bad-job' }],
  ['unknown source', { source: 'gossip', sourceId: 'bad-source' }],
  ['blank source id', { sourceId: '   ' }],
  ['entries not an array', { sourceId: 'bad-entries', entries: { skill_key: 'sales', score: 50 } }],
]) {
  await expectError(
    asRole(db, 'service_role', () => upsertEvidence(db, { entries: sampleEntries, ...args })),
    /INVALID_UNIFIED_SKILL_EVIDENCE/,
    `Invalid evidence must be rejected: ${label}.`,
  )
}
assert.equal((await evidenceRows(db)).length, 0, 'Rejected writes must not leave evidence behind.')

// 3. Clamping and filtering: scores to 0-100, weights to 0.1-5, unknown skills dropped.
await asRole(db, 'service_role', () => upsertEvidence(db, {
  sourceId: 'clamp-1',
  entries: [
    { skill_key: 'speaking_clarity', score: 150, weight: 9 },
    { skill_key: 'problem_solving', score: -20, weight: 0.01 },
    { skill_key: 'safety_judgment', score: 64, weight: 0.45 },
    { skill_key: 'charisma', score: 99, weight: 1 },
  ],
}))
assert.deepEqual(
  (await evidenceRows(db)).map(({ skill_key, score, weight }) => [skill_key, score, weight]),
  [['problem_solving', 0, 0.1], ['safety_judgment', 64, 0.45], ['speaking_clarity', 100, 5]],
)
await db.exec('delete from public.user_skill_evidence; delete from public.user_skill_profiles;')

// 4. Idempotency: rewriting the same (source, source_id) replaces rows instead of adding events.
const firstWrite = await asRole(db, 'service_role', () => upsertEvidence(db, {
  sourceId: 'attempt-1',
  entries: [
    { skill_key: 'speaking_clarity', score: 60, weight: 1 },
    { skill_key: 'problem_solving', score: 50, weight: 0.9 },
    { skill_key: 'safety_judgment', score: 40, weight: 1 },
  ],
}))
assert.equal(firstWrite.evidenceCount, 1, 'Three skills from one attempt are one training event.')
assert.deepEqual(firstWrite.sourceCounts, { assessment: 1 })
const retryWrite = await asRole(db, 'service_role', () => upsertEvidence(db, {
  sourceId: 'attempt-1',
  entries: [
    { skill_key: 'speaking_clarity', score: 80, weight: 0.5 },
    { skill_key: 'problem_solving', score: 70, weight: 0.45 },
    { skill_key: 'safety_judgment', score: 60, weight: 0.5 },
  ],
}))
assert.equal((await evidenceRows(db)).length, 3, 'A retry must not duplicate evidence rows.')
assert.equal(retryWrite.evidenceCount, 1)
assert.deepEqual(retryWrite.skills, { speaking_clarity: 80, problem_solving: 70, safety_judgment: 60 })
assert.equal(retryWrite.readinessScore, 70)
assert.equal((await storedProfile(db, 'bar_server')).evidence_count, 1)

// 5. Cross-job rebuild, recency weighting, and parity with the JS aggregator.
await asRole(db, 'service_role', () => upsertEvidence(db, {
  source: 'scenario',
  sourceId: 'scenario-old',
  occurredAt: daysAgo(60),
  entries: [
    { skill_key: 'speaking_clarity', score: 55, weight: 1.2 },
    { skill_key: 'guest_handling', score: 73, weight: 1.4 },
    { skill_key: 'sales', score: 41, weight: 1.4 },
  ],
}))
const barBefore = await storedProfile(db, 'bar_server')
const cruiseWrite = await asRole(db, 'service_role', () => upsertEvidence(db, {
  jobKey: 'cruise_general',
  source: 'interview',
  sourceId: 'interview-older',
  occurredAt: daysAgo(120),
  entries: [
    { skill_key: 'interview_structure', score: 66, weight: 1.4 },
    { skill_key: 'speaking_clarity', score: 90, weight: 1 },
    { skill_key: 'guest_handling', score: 58, weight: 0.9 },
  ],
}))
const barAfter = await storedProfile(db, 'bar_server')
assert.equal(cruiseWrite.evidenceCount, 1, 'The cruise_general profile only counts general evidence.')
assert.equal(barBefore.evidence_count, 2)
assert.equal(barAfter.evidence_count, 3, 'General evidence must also rebuild every job-specific profile.')
assert.deepEqual(barAfter.source_counts, { assessment: 1, scenario: 1, interview: 1 })

const allRows = await evidenceRows(db)
const jsRowsFor = (jobKey) => allRows
  .filter((row) => (jobKey === 'cruise_general' ? row.job_key === 'cruise_general' : [jobKey, 'cruise_general'].includes(row.job_key)))
for (const jobKey of ['bar_server', 'cruise_general']) {
  const expected = aggregateSkillEvidence(jsRowsFor(jobKey), new Date())
  const actual = await storedProfile(db, jobKey)
  assert.equal(actual.readiness_score, expected.readinessScore, `${jobKey} readiness must match the JS aggregator.`)
  assert.deepEqual(actual.skills, expected.skills, `${jobKey} skills must match the JS aggregator.`)
  assert.deepEqual(actual.weakest, expected.weakest, `${jobKey} weakest skills must match the JS aggregator.`)
  assert.equal(actual.evidence_count, expected.evidenceCount)
  assert.deepEqual(actual.source_counts, expected.sourceCounts)
  assert.equal(actual.coverage_percent, expected.coveragePercent)
  for (const [skillKey, confidence] of Object.entries(expected.confidence)) {
    assert.equal(actual.confidence[skillKey].evidenceCount, confidence.evidenceCount)
    assert.equal(actual.confidence[skillKey].level, confidence.level)
    assert.equal(Number(actual.confidence[skillKey].totalWeight), confidence.totalWeight)
  }
}
// speaking_clarity in bar_server: 80*0.5 (recent) + 55*1.2*0.8 (60 days) + 90*1*0.6 (120 days).
assert.equal(barAfter.skills.speaking_clarity, Math.round((80 * 0.5 + 55 * 0.96 + 90 * 0.6) / (0.5 + 0.96 + 0.6)))
await db.exec('delete from public.user_skill_evidence; delete from public.user_skill_profiles;')

// 6. Scenario completion: one transaction for session, legacy profile, and unified evidence.
// The server creates the first-turn draft with the service role; learners cannot insert sessions.
const createDraft = (scenarioId, userId = USER_A) => asRole(db, 'service_role', () => db.query(
  `insert into public.scenario_training_sessions (user_id, job_key, scenario_id, difficulty, status)
   values ($1, 'bar_server', $2, 2, 'in_progress') returning id`,
  [userId, scenarioId],
)).then((result) => result.rows[0].id)

const scenarioCatalog = [
  { id: 'wine-pairing', focus: ['barKnowledge'] },
  { id: 'allergy-guest', focus: ['service', 'problemSolving'] },
]
const completedFields = {
  difficulty: 2,
  scenario_context: { guest: 'Ana' },
  turns: [{ role: 'guest', text: 'Hi' }],
  overall_readiness: 68,
  strengths: ['Warm greeting'],
  weaknesses: ['Missed upsell'],
  critical_mistakes: [],
  better_response: 'Offer a pairing.',
  next_recommendation: 'Practice upselling.',
}
const completeScenario = (sessionId, { userId = USER_A, scenarioId, skillScores, entries }) => asRole(db, 'service_role', () => db.query(
  `select public.complete_scenario_with_unified_profile($1, $2, 'bar_server', $3, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, now()) as result`,
  [userId, sessionId, scenarioId, JSON.stringify(completedFields), JSON.stringify(skillScores), JSON.stringify(entries), JSON.stringify(scenarioCatalog)],
)).then((result) => result.rows[0].result)
const sessionStatus = async (sessionId) => (await db.query(
  'select status from public.scenario_training_sessions where id = $1', [sessionId],
)).rows[0].status

// Learners cannot forge a completed score through the draft insert path.
await expectError(
  asRole(db, 'authenticated', () => db.query(
    `insert into public.scenario_training_sessions (user_id, job_key, scenario_id, difficulty, status, overall_readiness)
     values ($1, 'bar_server', 'wine-pairing', 2, 'completed', 100)`,
    [USER_A],
  ), USER_A),
  /permission denied for table scenario_training_sessions/,
  'Learners must not insert completed scenario scores.',
)

// Learners cannot create even a plain draft any more (migration 20261010090000).
await expectError(
  asRole(db, 'authenticated', () => db.query(
    `insert into public.scenario_training_sessions (user_id, job_key, scenario_id, difficulty, status)
     values ($1, 'bar_server', 'wine-pairing', 2, 'in_progress')`,
    [USER_A],
  ), USER_A),
  /permission denied for table scenario_training_sessions/,
  'Learners must not insert scenario drafts.',
)

const firstSession = await createDraft('wine-pairing')

// Learners still save their second answer into their own unfinished draft, and nothing else.
const learnerTurnUpdate = await asRole(db, 'authenticated', () => db.query(
  `update public.scenario_training_sessions set turns = '[{"role":"trainee","content":"Second answer"}]'::jsonb
   where id = $1 returning id`,
  [firstSession],
), USER_A)
assert.equal(learnerTurnUpdate.rows.length, 1, 'Learners can update their own draft turns.')
const otherLearnerUpdate = await asRole(db, 'authenticated', () => db.query(
  `update public.scenario_training_sessions set turns = '[]'::jsonb where id = $1 returning id`,
  [firstSession],
), USER_B)
assert.equal(otherLearnerUpdate.rows.length, 0, "RLS hides another learner's draft from updates.")
await expectError(
  asRole(db, 'authenticated', () => db.query(
    `update public.scenario_training_sessions set status = 'completed', overall_readiness = 100 where id = $1`,
    [firstSession],
  ), USER_A),
  /permission denied for table scenario_training_sessions/,
  'Learners must not complete or score their own draft.',
)

// The production verification check for learner draft privileges passes after the migration.
const verificationSql = fs.readFileSync(new URL('../supabase_production_verification.sql', import.meta.url), 'utf8')
const learnerPrivilegeCheck = verificationSql.slice(verificationSql.indexOf('-- Learner privileges on scenario sessions'))
const privilegeRows = (await db.query(learnerPrivilegeCheck)).rows
assert.equal(privilegeRows.length, 3)
assert.ok(privilegeRows.every((row) => row.ok === true), `Learner draft privilege check failed: ${JSON.stringify(privilegeRows)}`)
const scenarioScores = { communication: 70, english: 60, barKnowledge: 80, service: 50, upselling: 40, problemSolving: 90 }
const scenarioEntries = [
  { skill_key: 'speaking_clarity', score: 65, weight: 1.2 },
  { skill_key: 'job_knowledge', score: 80, weight: 1.4 },
  { skill_key: 'sales', score: 40, weight: 1.4 },
]

// A failing evidence write must roll back the whole completion.
await expectError(
  completeScenario(firstSession, { scenarioId: 'wine-pairing', skillScores: scenarioScores, entries: { not: 'an array' } }),
  /INVALID_UNIFIED_SKILL_EVIDENCE/,
)
assert.equal(await sessionStatus(firstSession), 'in_progress', 'A failed completion must leave the draft resumable.')
assert.equal((await db.query('select count(*)::int as n from public.user_job_skill_profiles')).rows[0].n, 0)
assert.equal((await evidenceRows(db)).length, 0)

// Another learner's session cannot be completed.
await expectError(
  completeScenario(firstSession, { userId: USER_B, scenarioId: 'wine-pairing', skillScores: scenarioScores, entries: scenarioEntries }),
  /SCENARIO_SESSION_INVALID/,
)
// A mismatched scenario id cannot be completed.
await expectError(
  completeScenario(firstSession, { scenarioId: 'allergy-guest', skillScores: scenarioScores, entries: scenarioEntries }),
  /SCENARIO_SESSION_INVALID/,
)

const firstResult = await completeScenario(firstSession, { scenarioId: 'wine-pairing', skillScores: scenarioScores, entries: scenarioEntries })
assert.equal(firstResult.session.status, 'completed')
assert.equal(firstResult.session.overall_readiness, 68)
assert.deepEqual(firstResult.profile.skillScores, scenarioScores, 'The first scenario sets the legacy profile directly.')
assert.equal(firstResult.profile.weakestSkill, 'upselling')
assert.equal(firstResult.profile.readinessScore, 65)
assert.equal(firstResult.profile.completedScenarioCount, 1)
assert.deepEqual(firstResult.profile.recommendedScenario, { id: 'allergy-guest' }, 'Recommend an uncompleted scenario first.')
assert.equal(firstResult.unifiedProfile.evidenceCount, 1)
assert.deepEqual(firstResult.unifiedProfile.sourceCounts, { scenario: 1 })

// Completing the same session again is rejected and adds nothing.
await expectError(
  completeScenario(firstSession, { scenarioId: 'wine-pairing', skillScores: scenarioScores, entries: scenarioEntries }),
  /SCENARIO_SESSION_INVALID/,
)
assert.equal((await evidenceRows(db)).length, 3)

// A second scenario blends 65% previous and 35% new into the legacy profile.
const secondSession = await createDraft('allergy-guest')
const secondScores = { communication: 90, english: 80, barKnowledge: 60, service: 100, upselling: 80, problemSolving: 50 }
const secondResult = await completeScenario(secondSession, {
  scenarioId: 'allergy-guest',
  skillScores: secondScores,
  entries: [{ skill_key: 'safety_judgment', score: 70, weight: 1.5 }],
})
const blended = Object.fromEntries(Object.entries(secondScores).map(([key, value]) => [key, Math.round(scenarioScores[key] * 0.65 + value * 0.35)]))
assert.deepEqual(secondResult.profile.skillScores, blended)
assert.equal(secondResult.profile.completedScenarioCount, 2)
assert.equal(secondResult.unifiedProfile.evidenceCount, 2)
assert.deepEqual(secondResult.unifiedProfile.sourceCounts, { scenario: 2 })
await db.close()

// 7. Backfill: profiles written by the first deployment counted rows, not events, and
// derived confidence from weight. Migrations 160000 and 170000 must normalize them.
const legacyDb = await createDb('unifiedProfiles')
await addUsers(legacyDb)
await legacyDb.exec(`
  insert into public.user_skill_evidence (user_id, job_key, skill_key, score, weight, source, source_id) values
    ('${USER_A}', 'bar_server', 'speaking_clarity', 70, 1.2, 'scenario', 's-1'),
    ('${USER_A}', 'bar_server', 'sales', 50, 1.4, 'scenario', 's-1'),
    ('${USER_A}', 'bar_server', 'job_knowledge', 60, 1.4, 'scenario', 's-1'),
    ('${USER_A}', 'cruise_general', 'speaking_clarity', 80, 1, 'interview', 'i-1');
  insert into public.user_skill_profiles (user_id, job_key, readiness_score, skills, confidence, evidence_count, source_counts)
  values ('${USER_A}', 'bar_server', 64,
    '{"speaking_clarity": 74, "sales": 50, "job_knowledge": 60}',
    '{"speaking_clarity": {"evidenceCount": 2, "totalWeight": 2.2, "level": "high"},
      "sales": {"evidenceCount": 1, "totalWeight": 1.4, "level": "high"}}',
    4, '{"scenario": 3, "interview": 1}');
`)
await applyMigration(legacyDb, 'normalizeConfidence')
const normalized = await storedProfile(legacyDb, 'bar_server')
assert.equal(normalized.confidence.speaking_clarity.level, 'medium', 'Two observations are medium confidence.')
assert.equal(normalized.confidence.sales.level, 'low', 'One high-weight observation is still low confidence.')
assert.equal(normalized.confidence.speaking_clarity.totalWeight, 2.2, 'Normalization keeps the other confidence fields.')

await applyMigration(legacyDb, 'atomicProfiles')
const backfilled = await storedProfile(legacyDb, 'bar_server')
assert.equal(backfilled.evidence_count, 2, 'Evidence count becomes distinct training events.')
assert.deepEqual(backfilled.source_counts, { scenario: 1, interview: 1 })

// The atomic migration is safe to rerun (create or replace plus a recount).
await applyMigration(legacyDb, 'atomicProfiles')
assert.deepEqual(await storedProfile(legacyDb, 'bar_server'), backfilled)
await legacyDb.close()

console.log('Unified profile SQL passed: server-only grants, learner RLS, validation, idempotent evidence, JS parity, atomic scenario completion, and legacy backfill.')
