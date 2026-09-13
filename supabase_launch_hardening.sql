-- Production launch hardening for AI quotas, assessment submissions and articles.
-- Run once in Supabase SQL Editor before deploying the matching application code.

begin;

-- Store the actual free-trial action so every costly operation can be limited.
alter table public.ai_usage_events
  drop constraint if exists ai_usage_events_action_check;
alter table public.ai_usage_events
  add constraint ai_usage_events_action_check
  check (action in ('transcribe', 'evaluate', 'mock_interview', 'scenario_turn', 'scenario_evaluate'));

alter table public.ai_usage_reservations
  drop constraint if exists ai_usage_reservations_action_check;
alter table public.ai_usage_reservations
  add constraint ai_usage_reservations_action_check
  check (action in ('transcribe', 'evaluate', 'mock_interview', 'scenario_turn', 'scenario_evaluate'));

create or replace function public.reserve_ai_usage_quota(
  input_product_code text,
  input_action text,
  input_mode text,
  input_scenario_id text,
  input_request_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := auth.uid();
  active_entitlement public.user_entitlements%rowtype;
  quota_limit integer;
  usage_count integer;
  reservation_count integer;
  reservation_id uuid;
  existing_reservation public.ai_usage_reservations%rowtype;
  normalized_request_id text := left(trim(coalesce(input_request_id, '')), 200);
  normalized_scenario_id text := nullif(left(trim(coalesce(input_scenario_id, '')), 160), '');
  is_free_trial boolean := input_mode = 'scenario_trial';
begin
  if actor_user_id is null then
    raise exception 'LOGIN_REQUIRED';
  end if;

  if input_product_code <> 'bar_server_pack'
    or input_action not in ('transcribe', 'evaluate', 'mock_interview', 'scenario_turn', 'scenario_evaluate')
    or normalized_request_id = '' then
    raise exception 'INVALID_QUOTA_REQUEST';
  end if;

  -- One quota decision at a time for the same user, product and action.
  perform pg_advisory_xact_lock(
    hashtextextended(actor_user_id::text || ':' || input_product_code || ':' || input_action, 0)
  );

  if is_free_trial then
    if input_action not in ('transcribe', 'evaluate', 'scenario_turn', 'scenario_evaluate')
      or normalized_scenario_id not in (
        'bar_server_drink_recommendation_01',
        'bar_server_complaint_recovery_02',
        'bar_server_responsible_service_03'
      ) then
      raise exception 'INVALID_FREE_TRIAL_REQUEST';
    end if;
    quota_limit := 2;
  else
    select *
    into active_entitlement
    from public.user_entitlements
    where user_id = actor_user_id
      and product_code = input_product_code
      and status = 'active'
      and (expires_at is null or expires_at > now())
    for update;

    if not found then
      raise exception 'ACTIVATION_REQUIRED';
    end if;

    quota_limit := case
      when input_action = 'mock_interview' then active_entitlement.mock_interview_limit
      when input_action = 'transcribe' then
        case
          when active_entitlement.ai_feedback_limit is null then null
          else active_entitlement.ai_feedback_limit * 3
        end
      else active_entitlement.ai_feedback_limit
    end;
  end if;

  if quota_limit is null then
    return jsonb_build_object('reservation_id', null, 'unlimited', true);
  end if;

  select *
  into existing_reservation
  from public.ai_usage_reservations
  where user_id = actor_user_id
    and product_code = input_product_code
    and action = input_action
    and request_id = normalized_request_id
  for update;

  if found and existing_reservation.status = 'reserved'
    and existing_reservation.updated_at > now() - interval '10 minutes' then
    raise exception 'AI_REQUEST_IN_PROGRESS';
  end if;
  if found and existing_reservation.status = 'completed' then
    raise exception 'AI_REQUEST_ALREADY_COMPLETED';
  end if;
  if found then
    delete from public.ai_usage_reservations where id = existing_reservation.id;
  end if;

  update public.ai_usage_reservations
  set status = 'released', updated_at = now()
  where user_id = actor_user_id
    and product_code = input_product_code
    and action = input_action
    and status = 'reserved'
    and updated_at <= now() - interval '10 minutes';

  select count(*)
  into usage_count
  from public.ai_usage_events
  where user_id = actor_user_id
    and product_code = input_product_code
    and action = input_action
    and (not is_free_trial or scenario_id = normalized_scenario_id)
    and (is_free_trial or created_at >= coalesce(active_entitlement.starts_at, '-infinity'::timestamptz));

  select count(*)
  into reservation_count
  from public.ai_usage_reservations
  where user_id = actor_user_id
    and product_code = input_product_code
    and action = input_action
    and status = 'reserved'
    and (not is_free_trial or scenario_id = normalized_scenario_id);

  if usage_count + reservation_count >= quota_limit then
    raise exception 'AI_QUOTA_EXHAUSTED';
  end if;

  insert into public.ai_usage_reservations (
    user_id, product_code, action, mode, scenario_id, request_id, status
  ) values (
    actor_user_id,
    input_product_code,
    input_action,
    left(coalesce(input_mode, ''), 80),
    normalized_scenario_id,
    normalized_request_id,
    'reserved'
  )
  returning id into reservation_id;

  return jsonb_build_object('reservation_id', reservation_id, 'unlimited', false);
end;
$$;

revoke all on function public.reserve_ai_usage_quota(text, text, text, text, text) from public, anon;
grant execute on function public.reserve_ai_usage_quota(text, text, text, text, text) to authenticated;

create or replace function public.record_ai_usage_event(
  input_product_code text,
  input_action text,
  input_mode text,
  input_scenario_id text default null,
  input_provider text default null,
  input_model text default null,
  input_request_id text default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := auth.uid();
  inserted_id bigint;
begin
  if actor_user_id is null then raise exception 'LOGIN_REQUIRED'; end if;
  if input_action not in ('transcribe', 'evaluate', 'mock_interview', 'scenario_turn', 'scenario_evaluate') then
    raise exception 'INVALID_AI_ACTION';
  end if;

  insert into public.ai_usage_events (
    user_id, product_code, action, mode, scenario_id, provider, model, request_id, success
  ) values (
    actor_user_id,
    input_product_code,
    input_action,
    left(coalesce(input_mode, ''), 80),
    nullif(left(coalesce(input_scenario_id, ''), 160), ''),
    nullif(left(coalesce(input_provider, ''), 80), ''),
    nullif(left(coalesce(input_model, ''), 120), ''),
    nullif(left(coalesce(input_request_id, ''), 200), ''),
    true
  )
  on conflict (user_id, product_code, action, request_id)
    where product_code is not null and request_id is not null
  do nothing
  returning id into inserted_id;

  if inserted_id is null and input_product_code is not null and input_request_id is not null then
    select id into inserted_id
    from public.ai_usage_events
    where user_id = actor_user_id
      and product_code = input_product_code
      and action = input_action
      and request_id = left(input_request_id, 200);
  end if;

  return inserted_id;
end;
$$;

revoke all on function public.record_ai_usage_event(text, text, text, text, text, text, text)
  from public, anon;
grant execute on function public.record_ai_usage_event(text, text, text, text, text, text, text)
  to authenticated;

-- Assessment records contain contact information. Only authenticated users can
-- submit, and the RPC enforces ownership, payload size and a small hourly limit.
drop policy if exists "Anyone can submit assessment" on public.assessment_submissions;
drop policy if exists "Users can submit own assessment" on public.assessment_submissions;
revoke insert on table public.assessment_submissions from anon, authenticated;
grant select on table public.assessment_submissions to authenticated;

drop policy if exists "Users can read own assessment submissions" on public.assessment_submissions;
create policy "Users can read own assessment submissions"
on public.assessment_submissions
for select
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.save_assessment_submission(input_payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := auth.uid();
  submission_id uuid;
begin
  if actor_user_id is null then raise exception 'LOGIN_REQUIRED'; end if;
  if jsonb_typeof(input_payload) <> 'object' or pg_column_size(input_payload) > 131072 then
    raise exception 'INVALID_ASSESSMENT_PAYLOAD';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(actor_user_id::text || ':assessment', 0));
  if (
    select count(*)
    from public.assessment_submissions
    where user_id = actor_user_id and created_at >= now() - interval '1 hour'
  ) >= 3 then
    raise exception 'ASSESSMENT_RATE_LIMITED';
  end if;

  insert into public.assessment_submissions (
    user_id, name, phone, wechat, email, goal, service_background,
    answers, dimension_scores, overall_score, level, level_label, recommendations
  ) values (
    actor_user_id,
    nullif(left(trim(coalesce(input_payload ->> 'name', '')), 120), ''),
    nullif(left(trim(coalesce(input_payload ->> 'phone', '')), 40), ''),
    nullif(left(trim(coalesce(input_payload ->> 'wechat', '')), 120), ''),
    nullif(left(trim(coalesce(input_payload ->> 'email', '')), 320), ''),
    nullif(left(trim(coalesce(input_payload ->> 'goal', '')), 1000), ''),
    nullif(left(trim(coalesce(input_payload ->> 'service_background', '')), 120), ''),
    case when jsonb_typeof(input_payload -> 'answers') = 'object' then input_payload -> 'answers' else '{}'::jsonb end,
    case when jsonb_typeof(input_payload -> 'dimension_scores') = 'object' then input_payload -> 'dimension_scores' else '{}'::jsonb end,
    greatest(0, least(100, coalesce((input_payload ->> 'overall_score')::integer, 0))),
    nullif(left(trim(coalesce(input_payload ->> 'level', '')), 80), ''),
    nullif(left(trim(coalesce(input_payload ->> 'level_label', '')), 120), ''),
    coalesce(input_payload -> 'recommendations', '[]'::jsonb)
  ) returning id into submission_id;

  return submission_id;
end;
$$;

revoke all on function public.save_assessment_submission(jsonb) from public, anon;
grant execute on function public.save_assessment_submission(jsonb) to authenticated;

-- Public encyclopedia readers only need published rows. Browser users cannot
-- write article HTML directly.
alter table public.articles enable row level security;
revoke insert, update, delete on table public.articles from anon, authenticated;
grant select on table public.articles to anon, authenticated;
do $$
declare
  policy_row record;
begin
  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'articles'
  loop
    execute format('drop policy %I on public.articles', policy_row.policyname);
  end loop;
end;
$$;
create policy "Published articles are publicly readable"
on public.articles
for select
to anon, authenticated
using (status = 'published');

commit;

-- Verification queries.
select action, count(*) from public.ai_usage_events group by action order by action;
select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('reserve_ai_usage_quota', 'record_ai_usage_event', 'save_assessment_submission')
order by routine_name;
