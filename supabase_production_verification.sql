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
    'job_preparation_profiles',
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
    'get_admin_ai_operations_overview'
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
    'job_preparation_profiles',
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
    'job_preparation_profiles',
    'user_entitlements'
  )
order by tablename, policyname;

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
