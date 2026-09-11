-- Admin-only beta overview. This function can read auth.users, but verifies the
-- caller against database-owned access data before returning any information.

create or replace function public.get_admin_beta_overview(input_days integer default 14)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := auth.uid();
  safe_days integer := greatest(1, least(coalesce(input_days, 14), 90));
  since_time timestamptz;
  result jsonb;
begin
  if actor_user_id is null or not exists (
    select 1
    from public.user_access access
    where access.user_id = actor_user_id
      and access.role = 'admin'
      and access.access_status = 'active'
  ) then
    raise exception 'Administrator access required';
  end if;

  since_time := now() - make_interval(days => safe_days);

  select jsonb_build_object(
    'period_days', safe_days,
    'registered_total', (
      select count(*)
      from auth.users users
      where not exists (
        select 1 from public.user_access access
        where access.user_id = users.id and access.role = 'admin'
      )
    ),
    'registered_period', (
      select count(*)
      from auth.users users
      where users.created_at >= since_time
        and not exists (
          select 1 from public.user_access access
          where access.user_id = users.id and access.role = 'admin'
        )
    ),
    'confirmed_period', (
      select count(*) from auth.users users
      where users.created_at >= since_time
        and users.email_confirmed_at is not null
        and not exists (
          select 1 from public.user_access access
          where access.user_id = users.id and access.role = 'admin'
        )
    ),
    'assessment_period', (
      select count(*) from public.assessment_submissions where created_at >= since_time
    ),
    'career_report_period', (
      select count(*) from public.career_reports where created_at >= since_time
    ),
    'scenario_session_period', (
      select count(*) from public.scenario_training_sessions where created_at >= since_time
    ),
    'recent_users', coalesce((
      select jsonb_agg(to_jsonb(recent_user) order by recent_user.created_at desc)
      from (
        select
          users.id,
          users.email,
          users.created_at,
          users.email_confirmed_at,
          users.last_sign_in_at,
          coalesce(access.plan, 'free') as plan,
          coalesce(access.role, 'member') as role,
          (select count(*) from public.assessment_submissions submissions where submissions.user_id = users.id) as assessment_count,
          (select count(*) from public.career_reports reports where reports.user_id = users.id) as career_report_count,
          (select count(*) from public.scenario_training_sessions sessions where sessions.user_id = users.id) as scenario_session_count
        from auth.users users
        left join public.user_access access on access.user_id = users.id
        where coalesce(access.role, 'member') <> 'admin'
        order by users.created_at desc
        limit 30
      ) recent_user
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.get_admin_beta_overview(integer) from public, anon;
grant execute on function public.get_admin_beta_overview(integer) to authenticated;
