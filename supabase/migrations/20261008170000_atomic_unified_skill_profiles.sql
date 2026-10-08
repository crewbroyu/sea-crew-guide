-- Serialize unified profile rebuilds and complete scenario results atomically.
-- Both RPCs are callable only with the server-side service role.

begin;

create or replace function public.upsert_unified_skill_evidence(
  input_user_id uuid,
  input_job_key text,
  input_source text,
  input_source_id text,
  input_entries jsonb,
  input_metadata jsonb default '{}'::jsonb,
  input_occurred_at timestamptz default now()
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_job_key text;
  profile_result jsonb;
  requested_profile jsonb;
begin
  if input_user_id is null
    or input_job_key not in ('cruise_general', 'bar_server', 'retail')
    or input_source not in ('assessment', 'scenario', 'interview', 'foundation_quiz', 'listening', 'shift', 'retail_module')
    or nullif(trim(input_source_id), '') is null
    or jsonb_typeof(input_entries) <> 'array' then
    raise exception 'INVALID_UNIFIED_SKILL_EVIDENCE';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('unified-skill:' || input_user_id::text, 0));

  insert into public.user_skill_evidence (
    user_id, job_key, skill_key, score, weight, source, source_id,
    evidence_text, metadata, occurred_at
  )
  select
    input_user_id,
    input_job_key,
    entry.skill_key,
    greatest(0, least(100, entry.score)),
    greatest(0.1, least(5, coalesce(entry.weight, 1))),
    input_source,
    left(trim(input_source_id), 160),
    nullif(left(coalesce(entry.evidence_text, ''), 420), ''),
    coalesce(input_metadata, '{}'::jsonb),
    coalesce(input_occurred_at, now())
  from jsonb_to_recordset(input_entries) as entry(
    skill_key text,
    score integer,
    weight numeric,
    evidence_text text
  )
  where entry.skill_key in (
    'listening', 'speaking_clarity', 'interview_structure', 'job_knowledge',
    'guest_handling', 'sales', 'problem_solving', 'safety_judgment'
  )
  on conflict (user_id, source, source_id, skill_key) do update
  set job_key = excluded.job_key,
      score = excluded.score,
      weight = excluded.weight,
      evidence_text = excluded.evidence_text,
      metadata = excluded.metadata,
      occurred_at = excluded.occurred_at;

  for target_job_key in
    select input_job_key
    union
    select distinct profile.job_key
    from public.user_skill_profiles profile
    where input_job_key = 'cruise_general' and profile.user_id = input_user_id
    union
    select distinct evidence.job_key
    from public.user_skill_evidence evidence
    where input_job_key = 'cruise_general'
      and evidence.user_id = input_user_id
      and evidence.job_key <> 'cruise_general'
  loop
    with relevant as (
      select
        evidence.skill_key,
        evidence.score,
        evidence.source,
        evidence.source_id,
        evidence.weight * case
          when evidence.occurred_at >= now() - interval '30 days' then 1
          when evidence.occurred_at >= now() - interval '90 days' then 0.8
          else 0.6
        end as effective_weight
      from public.user_skill_evidence evidence
      where evidence.user_id = input_user_id
        and (
          (target_job_key = 'cruise_general' and evidence.job_key = 'cruise_general')
          or (target_job_key <> 'cruise_general' and evidence.job_key in (target_job_key, 'cruise_general'))
        )
    ),
    skill_aggregate as (
      select
        skill_key,
        round(sum(score * effective_weight) / nullif(sum(effective_weight), 0))::integer as score,
        count(*)::integer as observation_count,
        round(sum(effective_weight), 2) as total_weight
      from relevant
      group by skill_key
    ),
    source_aggregate as (
      select source, count(distinct source_id)::integer as event_count
      from relevant
      group by source
    )
    select jsonb_build_object(
      'readinessScore', coalesce((select round(avg(score))::integer from skill_aggregate), 0),
      'skills', coalesce((select jsonb_object_agg(skill_key, score) from skill_aggregate), '{}'::jsonb),
      'confidence', coalesce((
        select jsonb_object_agg(
          skill_key,
          jsonb_build_object(
            'evidenceCount', observation_count,
            'totalWeight', total_weight,
            'level', case when observation_count >= 3 then 'high' when observation_count >= 2 then 'medium' else 'low' end
          )
        )
        from skill_aggregate
      ), '{}'::jsonb),
      'weakest', coalesce((
        select jsonb_agg(jsonb_build_object('skillKey', ranked.skill_key, 'score', ranked.score) order by ranked.score, ranked.skill_key)
        from (select skill_key, score from skill_aggregate order by score, skill_key limit 3) ranked
      ), '[]'::jsonb),
      'evidenceCount', coalesce((select count(distinct (source, source_id))::integer from relevant), 0),
      'sourceCounts', coalesce((select jsonb_object_agg(source, event_count) from source_aggregate), '{}'::jsonb),
      'coveragePercent', coalesce((select round(count(*) * 100.0 / 8)::integer from skill_aggregate), 0)
    ) into profile_result;

    insert into public.user_skill_profiles (
      user_id, job_key, readiness_score, skills, confidence, weakest,
      evidence_count, source_counts, coverage_percent, updated_at
    ) values (
      input_user_id,
      target_job_key,
      (profile_result ->> 'readinessScore')::integer,
      profile_result -> 'skills',
      profile_result -> 'confidence',
      profile_result -> 'weakest',
      (profile_result ->> 'evidenceCount')::integer,
      profile_result -> 'sourceCounts',
      (profile_result ->> 'coveragePercent')::integer,
      coalesce(input_occurred_at, now())
    )
    on conflict (user_id, job_key) do update
    set readiness_score = excluded.readiness_score,
        skills = excluded.skills,
        confidence = excluded.confidence,
        weakest = excluded.weakest,
        evidence_count = excluded.evidence_count,
        source_counts = excluded.source_counts,
        coverage_percent = excluded.coverage_percent,
        updated_at = excluded.updated_at;

    if target_job_key = input_job_key then requested_profile := profile_result; end if;
  end loop;

  return requested_profile;
end;
$$;

create or replace function public.complete_scenario_with_unified_profile(
  input_user_id uuid,
  input_session_id uuid,
  input_job_key text,
  input_scenario_id text,
  input_completed_fields jsonb,
  input_skill_scores jsonb,
  input_evidence_entries jsonb,
  input_scenario_catalog jsonb,
  input_occurred_at timestamptz
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_session public.scenario_training_sessions%rowtype;
  previous_scores jsonb;
  blended_scores jsonb;
  weakest_skill text;
  readiness_score integer;
  completed_count integer;
  recommended_id text;
  unified_profile jsonb;
  legacy_profile jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended('unified-skill:' || input_user_id::text, 0));

  select * into target_session
  from public.scenario_training_sessions
  where id = input_session_id and user_id = input_user_id
  for update;

  if target_session.id is null
    or target_session.status <> 'in_progress'
    or target_session.job_key <> input_job_key
    or target_session.scenario_id <> input_scenario_id then
    raise exception 'SCENARIO_SESSION_INVALID';
  end if;

  select profile.skill_scores into previous_scores
  from public.user_job_skill_profiles profile
  where profile.user_id = input_user_id and profile.job_key = input_job_key
  for update;

  select jsonb_object_agg(
    score.key,
    case when previous_scores is null
      then round(score.value::numeric)::integer
      else round(coalesce((previous_scores ->> score.key)::numeric, 0) * 0.65 + score.value::numeric * 0.35)::integer
    end
  ) into blended_scores
  from jsonb_each_text(input_skill_scores) score;

  select score.key into weakest_skill
  from jsonb_each_text(blended_scores) score
  order by score.value::numeric, score.key
  limit 1;

  select round(avg(score.value::numeric))::integer into readiness_score
  from jsonb_each_text(blended_scores) score;

  update public.scenario_training_sessions
  set difficulty = (input_completed_fields ->> 'difficulty')::smallint,
      scenario_context = input_completed_fields -> 'scenario_context',
      turns = input_completed_fields -> 'turns',
      status = 'completed',
      overall_readiness = (input_completed_fields ->> 'overall_readiness')::integer,
      skill_scores = input_skill_scores,
      strengths = input_completed_fields -> 'strengths',
      weaknesses = input_completed_fields -> 'weaknesses',
      critical_mistakes = input_completed_fields -> 'critical_mistakes',
      better_response = input_completed_fields ->> 'better_response',
      next_recommendation = input_completed_fields ->> 'next_recommendation',
      completed_at = input_occurred_at
  where id = input_session_id;

  select count(distinct session.scenario_id)::integer into completed_count
  from public.scenario_training_sessions session
  where session.user_id = input_user_id and session.job_key = input_job_key and session.status = 'completed';

  select candidate.value ->> 'id' into recommended_id
  from jsonb_array_elements(input_scenario_catalog) with ordinality candidate(value, position)
  order by
    not exists (
      select 1 from public.scenario_training_sessions completed
      where completed.user_id = input_user_id
        and completed.job_key = input_job_key
        and completed.status = 'completed'
        and completed.scenario_id = candidate.value ->> 'id'
    ) desc,
    coalesce(candidate.value -> 'focus', '[]'::jsonb) ? weakest_skill desc,
    candidate.position
  limit 1;

  insert into public.user_job_skill_profiles (
    user_id, job_key, readiness_score, skill_scores, weakest_skill,
    recommended_scenario_id, completed_scenario_count, updated_at
  ) values (
    input_user_id, input_job_key, readiness_score, blended_scores, weakest_skill,
    recommended_id, completed_count, input_occurred_at
  )
  on conflict (user_id, job_key) do update
  set readiness_score = excluded.readiness_score,
      skill_scores = excluded.skill_scores,
      weakest_skill = excluded.weakest_skill,
      recommended_scenario_id = excluded.recommended_scenario_id,
      completed_scenario_count = excluded.completed_scenario_count,
      updated_at = excluded.updated_at;

  unified_profile := public.upsert_unified_skill_evidence(
    input_user_id,
    input_job_key,
    'scenario',
    input_session_id::text,
    input_evidence_entries,
    jsonb_build_object(
      'scenarioId', input_scenario_id,
      'difficulty', (input_completed_fields ->> 'difficulty')::integer,
      'overallReadiness', (input_completed_fields ->> 'overall_readiness')::integer
    ),
    input_occurred_at
  );

  legacy_profile := jsonb_build_object(
    'readinessScore', readiness_score,
    'skillScores', blended_scores,
    'weakestSkill', weakest_skill,
    'recommendedScenario', case when recommended_id is null then null else jsonb_build_object('id', recommended_id) end,
    'completedScenarioCount', completed_count
  );

  return jsonb_build_object(
    'session', (select to_jsonb(session_row) from (
      select id, scenario_id, job_key, difficulty, status, overall_readiness,
        skill_scores, weaknesses, next_recommendation, completed_at
      from public.scenario_training_sessions where id = input_session_id
    ) session_row),
    'profile', legacy_profile,
    'unifiedProfile', unified_profile
  );
end;
$$;

revoke all on function public.upsert_unified_skill_evidence(uuid, text, text, text, jsonb, jsonb, timestamptz)
  from public, anon, authenticated;
revoke all on function public.complete_scenario_with_unified_profile(uuid, uuid, text, text, jsonb, jsonb, jsonb, jsonb, timestamptz)
  from public, anon, authenticated;
grant execute on function public.upsert_unified_skill_evidence(uuid, text, text, text, jsonb, jsonb, timestamptz)
  to service_role;
grant execute on function public.complete_scenario_with_unified_profile(uuid, uuid, text, text, jsonb, jsonb, jsonb, jsonb, timestamptz)
  to service_role;

-- Profiles created before this migration counted one row per skill. Normalize the
-- displayed total and per-source totals to distinct training events immediately.
with event_counts as (
  select
    profile.user_id,
    profile.job_key,
    count(distinct (evidence.source, evidence.source_id))::integer as evidence_count
  from public.user_skill_profiles profile
  left join public.user_skill_evidence evidence
    on evidence.user_id = profile.user_id
    and (
      (profile.job_key = 'cruise_general' and evidence.job_key = 'cruise_general')
      or (profile.job_key <> 'cruise_general' and evidence.job_key in (profile.job_key, 'cruise_general'))
    )
  group by profile.user_id, profile.job_key
), source_counts as (
  select
    profile.user_id,
    profile.job_key,
    coalesce(jsonb_object_agg(counted.source, counted.event_count) filter (where counted.source is not null), '{}'::jsonb) as source_counts
  from public.user_skill_profiles profile
  left join lateral (
    select evidence.source, count(distinct evidence.source_id)::integer as event_count
    from public.user_skill_evidence evidence
    where evidence.user_id = profile.user_id
      and (
        (profile.job_key = 'cruise_general' and evidence.job_key = 'cruise_general')
        or (profile.job_key <> 'cruise_general' and evidence.job_key in (profile.job_key, 'cruise_general'))
      )
    group by evidence.source
  ) counted on true
  group by profile.user_id, profile.job_key
)
update public.user_skill_profiles profile
set evidence_count = event_counts.evidence_count,
    source_counts = source_counts.source_counts
from event_counts, source_counts
where event_counts.user_id = profile.user_id
  and event_counts.job_key = profile.job_key
  and source_counts.user_id = profile.user_id
  and source_counts.job_key = profile.job_key;

commit;
