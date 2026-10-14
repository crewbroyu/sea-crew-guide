-- Read-only production verification. Safe to rerun after every deployment.
-- Every query below is SELECT-only and does not modify production data.

select code, name, is_active, access_days, ai_feedback_quota, mock_interview_quota
from public.products
where code in ('bar_server_pack', 'retail_sales_pack')
order by code;

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'ai_usage_events',
    'ai_usage_reservations',
    'ai_operation_logs',
    'career_reports',
    'career_report_reservations',
    'assessment_attempts',
    'assessment_attempt_actions',
    'job_preparation_profiles',
    'scenario_training_sessions',
    'user_job_skill_profiles',
    'user_skill_evidence',
    'user_skill_profiles',
    'user_entitlements'
  )
order by table_name;

select routine_name, routine_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'reserve_ai_usage_quota',
    'finalize_ai_usage_reservation',
    'record_ai_usage_event',
    'record_ai_operation_log',
    'reserve_career_report_generation',
    'finalize_career_report_generation',
    'save_ai_advisor_career_report',
    'get_admin_beta_overview',
    'get_admin_ai_operations_overview',
    'get_assessment_attempt_status',
    'start_assessment_attempt',
    'authorize_assessment_action',
    'complete_assessment_attempt',
    'get_assessment_evaluation_result',
    'upsert_unified_skill_evidence',
    'complete_scenario_with_unified_profile'
  )
order by routine_name;

select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'ai_usage_events',
    'ai_usage_reservations',
    'ai_operation_logs',
    'career_reports',
    'career_report_reservations',
    'assessment_attempts',
    'assessment_attempt_actions',
    'job_preparation_profiles',
    'scenario_training_sessions',
    'user_job_skill_profiles',
    'user_skill_evidence',
    'user_skill_profiles',
    'user_entitlements'
  )
order by tablename;

select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'ai_usage_events',
    'ai_usage_reservations',
    'ai_operation_logs',
    'career_reports',
    'career_report_reservations',
    'assessment_attempts',
    'assessment_attempt_actions',
    'job_preparation_profiles',
    'scenario_training_sessions',
    'user_job_skill_profiles',
    'user_skill_evidence',
    'user_skill_profiles',
    'user_entitlements'
  )
order by tablename, policyname;

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('scenario_training_sessions', 'user_job_skill_profiles', 'user_skill_evidence', 'user_skill_profiles')
  and grantee = 'authenticated'
order by table_name, privilege_type;

select grantee, table_name, column_name, privilege_type
from information_schema.role_column_grants
where table_schema = 'public'
  and table_name = 'scenario_training_sessions'
  and grantee = 'authenticated'
order by privilege_type, column_name;

select
  count(*) filter (where status = 'active' and (expires_at is null or expires_at > now())) as active_entitlements,
  count(*) filter (where status = 'active' and expires_at <= now()) as expired_but_active
from public.user_entitlements;

select action, success, count(*) as requests,
  coalesce(sum(duration_seconds), 0) as duration_seconds,
  coalesce(round(sum(estimated_cost_cny), 4), 0) as estimated_cost_cny
from public.ai_operation_logs
where created_at >= now() - interval '24 hours'
group by action, success
order by action, success desc;

-- Execute privileges for every RPC the server calls. Every row must show ok = true.
-- A missing function shows as a row with a null signature and ok = false.
-- authenticated_expected = false marks the server-write-only RPCs (service_role only).
with expected(routine_name, authenticated_expected) as (
  values
    ('reserve_ai_usage_quota', true),
    ('finalize_ai_usage_reservation', true),
    ('record_ai_usage_event', true),
    ('record_ai_operation_log', true),
    ('reserve_career_report_generation', true),
    ('finalize_career_report_generation', true),
    ('save_ai_advisor_career_report', true),
    ('authorize_assessment_action', true),
    ('complete_assessment_attempt', true),
    ('get_assessment_evaluation_result', true),
    ('upsert_unified_skill_evidence', false),
    ('complete_scenario_with_unified_profile', false)
)
select
  expected.routine_name,
  pg_get_function_identity_arguments(proc.oid) as signature,
  has_function_privilege('anon', proc.oid, 'execute') as anon_execute,
  has_function_privilege('authenticated', proc.oid, 'execute') as authenticated_execute,
  has_function_privilege('service_role', proc.oid, 'execute') as service_role_execute,
  coalesce(
    not has_function_privilege('anon', proc.oid, 'execute')
      and has_function_privilege('authenticated', proc.oid, 'execute') = expected.authenticated_expected
      and (expected.authenticated_expected or has_function_privilege('service_role', proc.oid, 'execute')),
    false
  ) as ok
from expected
left join pg_proc proc
  on proc.proname = expected.routine_name
  and proc.pronamespace = 'public'::regnamespace
order by ok, expected.routine_name;

-- Learner privileges on scenario sessions and job skill profiles after steps 11 and 12: no INSERT on
-- sessions (the server creates drafts), UPDATE on draft turns only (resume an unfinished draft), no
-- writes to job skill profiles, and no owner-only write policies left. Every row must show ok = true.
select check_name, actual, expected, actual = expected as ok
from (values
  ('authenticated INSERT on scenario_training_sessions',
    has_any_column_privilege('authenticated', 'public.scenario_training_sessions', 'INSERT'), false),
  ('authenticated UPDATE on scenario_training_sessions.turns',
    has_column_privilege('authenticated', 'public.scenario_training_sessions', 'turns', 'UPDATE'), true),
  ('authenticated UPDATE on scenario_training_sessions.status',
    has_column_privilege('authenticated', 'public.scenario_training_sessions', 'status', 'UPDATE'), false),
  ('authenticated UPDATE on scenario_training_sessions.overall_readiness',
    has_column_privilege('authenticated', 'public.scenario_training_sessions', 'overall_readiness', 'UPDATE'), false),
  ('authenticated UPDATE on scenario_training_sessions.skill_scores',
    has_column_privilege('authenticated', 'public.scenario_training_sessions', 'skill_scores', 'UPDATE'), false),
  ('authenticated INSERT on user_job_skill_profiles',
    has_any_column_privilege('authenticated', 'public.user_job_skill_profiles', 'INSERT'), false),
  ('authenticated UPDATE on user_job_skill_profiles',
    has_any_column_privilege('authenticated', 'public.user_job_skill_profiles', 'UPDATE'), false),
  ('scenario_training_sessions has one UPDATE policy, limited to in_progress drafts',
    (select count(*) = 1 and bool_and(qual like '%in_progress%' and with_check like '%in_progress%')
     from pg_policies
     where schemaname = 'public' and tablename = 'scenario_training_sessions' and cmd in ('UPDATE', 'ALL')), true),
  ('no INSERT policy on scenario_training_sessions',
    (select count(*) = 0 from pg_policies
     where schemaname = 'public' and tablename = 'scenario_training_sessions' and cmd = 'INSERT'), true),
  ('no learner write policy on user_job_skill_profiles',
    (select count(*) = 0 from pg_policies
     where schemaname = 'public' and tablename = 'user_job_skill_profiles' and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')), true)
) as checks(check_name, actual, expected)
order by ok, check_name;

-- Legacy tables outside the repository (step 13): anon and authenticated must not write them.
-- Every row must show ok = true; tables that do not exist are not listed.
select c.relname as table_name, r.role,
  not (has_any_column_privilege(r.role, c.oid, 'INSERT')
    or has_any_column_privilege(r.role, c.oid, 'UPDATE')
    or has_table_privilege(r.role, c.oid, 'DELETE')
    or has_table_privilege(r.role, c.oid, 'TRUNCATE')) as ok
from pg_class c
cross join (values ('anon'), ('authenticated')) as r(role)
where c.relnamespace = 'public'::regnamespace
  and c.relname in ('interview_records', 'profiles', 'task_progress', 'users')
order by ok, c.relname, r.role;

-- Task 5 completion photos (step 14): no inline photo may remain. ok = true only after step 14.
select count(*) as remaining_task5_photos, count(*) = 0 as ok
from public.job_preparation_profiles j
cross join lateral jsonb_each(
  case when jsonb_typeof(j.completed_course_details) = 'object' then j.completed_course_details else '{}'::jsonb end
) e
where jsonb_typeof(e.value) = 'object' and e.value ? 'image';

-- Summary of every ok check above, in one result set. Keep this query last: the Supabase SQL Editor
-- shows only the last result. Rows with ok = false sort first; every row must show ok = true.
with expected_tables(name) as (
  values ('ai_usage_events'), ('ai_usage_reservations'), ('ai_operation_logs'), ('career_reports'),
    ('career_report_reservations'), ('assessment_attempts'), ('assessment_attempt_actions'),
    ('job_preparation_profiles'), ('scenario_training_sessions'), ('user_job_skill_profiles'),
    ('user_skill_evidence'), ('user_skill_profiles'), ('user_entitlements')
),
expected_functions(name) as (
  values ('reserve_ai_usage_quota'), ('finalize_ai_usage_reservation'), ('record_ai_usage_event'),
    ('record_ai_operation_log'), ('reserve_career_report_generation'), ('finalize_career_report_generation'),
    ('save_ai_advisor_career_report'), ('get_admin_beta_overview'), ('get_admin_ai_operations_overview'),
    ('get_assessment_attempt_status'), ('start_assessment_attempt'), ('authorize_assessment_action'),
    ('complete_assessment_attempt'), ('get_assessment_evaluation_result'), ('upsert_unified_skill_evidence'),
    ('complete_scenario_with_unified_profile')
),
expected_rpcs(routine_name, authenticated_expected) as (
  values ('reserve_ai_usage_quota', true), ('finalize_ai_usage_reservation', true), ('record_ai_usage_event', true),
    ('record_ai_operation_log', true), ('reserve_career_report_generation', true),
    ('finalize_career_report_generation', true), ('save_ai_advisor_career_report', true),
    ('authorize_assessment_action', true), ('complete_assessment_attempt', true),
    ('get_assessment_evaluation_result', true), ('upsert_unified_skill_evidence', false),
    ('complete_scenario_with_unified_profile', false)
),
checks(section, check_name, detail, ok) as (
  select '1 table exists', t.name, null::text, to_regclass('public.' || t.name) is not null
  from expected_tables t

  union all
  select '2 RLS enabled', t.name, null,
    coalesce((select c.relrowsecurity from pg_class c where c.oid = to_regclass('public.' || t.name)), false)
  from expected_tables t

  union all
  select '3 function exists', f.name, null,
    exists (select 1 from pg_proc p where p.proname = f.name and p.pronamespace = 'public'::regnamespace)
  from expected_functions f

  union all
  select '4 RPC execute privileges', e.routine_name,
    case when proc.oid is null then 'missing'
      else 'anon=' || has_function_privilege('anon', proc.oid, 'execute')
        || ' authenticated=' || has_function_privilege('authenticated', proc.oid, 'execute')
        || ' service_role=' || has_function_privilege('service_role', proc.oid, 'execute') end,
    coalesce(
      not has_function_privilege('anon', proc.oid, 'execute')
        and has_function_privilege('authenticated', proc.oid, 'execute') = e.authenticated_expected
        and (e.authenticated_expected or has_function_privilege('service_role', proc.oid, 'execute')),
      false)
  from expected_rpcs e
  left join pg_proc proc on proc.proname = e.routine_name and proc.pronamespace = 'public'::regnamespace

  union all
  select '5 learner privileges (steps 11-12)', l.check_name,
    'actual=' || l.actual || ' expected=' || l.expected, coalesce(l.actual = l.expected, false)
  from (values
    ('authenticated INSERT on scenario_training_sessions',
      has_any_column_privilege('authenticated', 'public.scenario_training_sessions', 'INSERT'), false),
    ('authenticated UPDATE on scenario_training_sessions.turns',
      has_column_privilege('authenticated', 'public.scenario_training_sessions', 'turns', 'UPDATE'), true),
    ('authenticated UPDATE on scenario_training_sessions.status',
      has_column_privilege('authenticated', 'public.scenario_training_sessions', 'status', 'UPDATE'), false),
    ('authenticated UPDATE on scenario_training_sessions.overall_readiness',
      has_column_privilege('authenticated', 'public.scenario_training_sessions', 'overall_readiness', 'UPDATE'), false),
    ('authenticated UPDATE on scenario_training_sessions.skill_scores',
      has_column_privilege('authenticated', 'public.scenario_training_sessions', 'skill_scores', 'UPDATE'), false),
    ('authenticated INSERT on user_job_skill_profiles',
      has_any_column_privilege('authenticated', 'public.user_job_skill_profiles', 'INSERT'), false),
    ('authenticated UPDATE on user_job_skill_profiles',
      has_any_column_privilege('authenticated', 'public.user_job_skill_profiles', 'UPDATE'), false),
    ('scenario_training_sessions has one UPDATE policy, limited to in_progress drafts',
      (select count(*) = 1 and bool_and(qual like '%in_progress%' and with_check like '%in_progress%')
       from pg_policies
       where schemaname = 'public' and tablename = 'scenario_training_sessions' and cmd in ('UPDATE', 'ALL')), true),
    ('no INSERT policy on scenario_training_sessions',
      (select count(*) = 0 from pg_policies
       where schemaname = 'public' and tablename = 'scenario_training_sessions' and cmd = 'INSERT'), true),
    ('no learner write policy on user_job_skill_profiles',
      (select count(*) = 0 from pg_policies
       where schemaname = 'public' and tablename = 'user_job_skill_profiles' and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')), true)
  ) as l(check_name, actual, expected)

  union all
  select '6 legacy tables (step 13)', c.relname || ' / ' || r.role, null,
    not (has_any_column_privilege(r.role, c.oid, 'INSERT')
      or has_any_column_privilege(r.role, c.oid, 'UPDATE')
      or has_table_privilege(r.role, c.oid, 'DELETE')
      or has_table_privilege(r.role, c.oid, 'TRUNCATE'))
  from pg_class c
  cross join (values ('anon'), ('authenticated')) as r(role)
  where c.relnamespace = 'public'::regnamespace
    and c.relname in ('interview_records', 'profiles', 'task_progress', 'users')

  union all
  select '7 Task 5 photos (step 14)', 'no inline photos remain', count(*) || ' remaining', count(*) = 0
  from public.job_preparation_profiles j
  cross join lateral jsonb_each(
    case when jsonb_typeof(j.completed_course_details) = 'object' then j.completed_course_details else '{}'::jsonb end
  ) e
  where jsonb_typeof(e.value) = 'object' and e.value ? 'image'

  union all
  select '8 activation code rate limit (step 15)', a.check_name, null, coalesce(a.ok, false)
  from (values
    ('attempt log exists', to_regclass('public.activation_code_attempts') is not null),
    ('clients cannot read or write the attempt log',
      not (has_table_privilege('anon', to_regclass('public.activation_code_attempts'), 'SELECT')
        or has_table_privilege('anon', to_regclass('public.activation_code_attempts'), 'INSERT')
        or has_table_privilege('authenticated', to_regclass('public.activation_code_attempts'), 'SELECT')
        or has_table_privilege('authenticated', to_regclass('public.activation_code_attempts'), 'INSERT')
        or has_table_privilege('authenticated', to_regclass('public.activation_code_attempts'), 'UPDATE')
        or has_table_privilege('authenticated', to_regclass('public.activation_code_attempts'), 'DELETE'))),
    ('consume_activation_code checks the attempt log',
      exists (select 1 from pg_proc p where p.proname = 'consume_activation_code'
        and p.pronamespace = 'public'::regnamespace and p.prosrc like '%activation_code_attempts%')),
    ('consume_activation_code: authenticated only',
      (select bool_and(not has_function_privilege('anon', p.oid, 'execute') and has_function_privilege('authenticated', p.oid, 'execute'))
       from pg_proc p where p.proname = 'consume_activation_code' and p.pronamespace = 'public'::regnamespace))
  ) as a(check_name, ok)
)
select section, check_name, detail, ok
from checks
order by ok, section, check_name;
