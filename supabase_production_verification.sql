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

-- Learner privileges on scenario sessions after step 11: no INSERT on any column (the server creates
-- drafts), UPDATE on turns only (resume an unfinished draft). Every row must show ok = true.
select check_name, actual, expected, actual = expected as ok
from (values
  ('authenticated INSERT on scenario_training_sessions',
    has_any_column_privilege('authenticated', 'public.scenario_training_sessions', 'INSERT'), false),
  ('authenticated UPDATE on scenario_training_sessions.turns',
    has_column_privilege('authenticated', 'public.scenario_training_sessions', 'turns', 'UPDATE'), true),
  ('authenticated UPDATE on scenario_training_sessions.status',
    has_column_privilege('authenticated', 'public.scenario_training_sessions', 'status', 'UPDATE'), false)
) as checks(check_name, actual, expected)
order by ok, check_name;
