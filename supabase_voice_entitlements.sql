-- Forward-only voice entitlement and quota upgrade.
-- Run after supabase_ai_cost_controls.sql and supabase_retail_ai_quota_support.sql.
-- Safe to rerun: constraints and functions are replaced in place.

begin;

alter table public.ai_usage_events
  drop constraint if exists ai_usage_events_action_check;
alter table public.ai_usage_events
  add constraint ai_usage_events_action_check
  check (action in (
    'transcribe', 'evaluate', 'mock_interview',
    'scenario_turn', 'scenario_evaluate', 'tts'
  ));

alter table public.ai_usage_reservations
  drop constraint if exists ai_usage_reservations_action_check;
alter table public.ai_usage_reservations
  add constraint ai_usage_reservations_action_check
  check (action in (
    'transcribe', 'evaluate', 'mock_interview',
    'scenario_turn', 'scenario_evaluate', 'tts'
  ));

alter table public.ai_usage_reservations
  drop constraint if exists ai_usage_reservations_status_check;
alter table public.ai_usage_reservations
  add constraint ai_usage_reservations_status_check
  check (status in ('reserved', 'completed', 'released', 'failed'));

create index if not exists ai_usage_events_daily_tts_idx
  on public.ai_usage_events (user_id, product_code, created_at desc)
  where action = 'tts';

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
  recent_failure_count integer;
  failure_limit integer;
  reservation_id uuid;
  existing_reservation public.ai_usage_reservations%rowtype;
  normalized_request_id text := left(trim(coalesce(input_request_id, '')), 200);
  normalized_scenario_id text := nullif(left(trim(coalesce(input_scenario_id, '')), 160), '');
  is_free_trial boolean := input_mode = 'scenario_trial';
  is_tts boolean := input_action = 'tts';
  shanghai_day_start timestamptz :=
    date_trunc('day', now() at time zone 'Asia/Shanghai') at time zone 'Asia/Shanghai';
begin
  if actor_user_id is null then raise exception 'LOGIN_REQUIRED'; end if;
  if input_product_code not in ('bar_server_pack', 'retail_sales_pack')
    or input_action not in (
      'transcribe', 'evaluate', 'mock_interview',
      'scenario_turn', 'scenario_evaluate', 'tts'
    )
    or normalized_request_id = '' then
    raise exception 'INVALID_QUOTA_REQUEST';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(
      actor_user_id::text || ':' ||
      case when is_tts then 'all-products:tts' else input_product_code || ':' || input_action end,
      0
    )
  );

  if is_free_trial then
    if input_product_code <> 'bar_server_pack'
      or is_tts
      or input_action not in ('transcribe', 'evaluate', 'scenario_turn', 'scenario_evaluate')
      or normalized_scenario_id not in (
        'bar_server_drink_recommendation_01',
        'bar_server_complaint_recovery_02',
        'bar_server_responsible_service_03'
      ) then
      raise exception 'INVALID_FREE_TRIAL_REQUEST';
    end if;

    -- Free users receive three ASR conversions in total, not three per scenario.
    quota_limit := case when input_action = 'transcribe' then 3 else 2 end;
    failure_limit := 6;
  else
    select * into active_entitlement
    from public.user_entitlements
    where user_id = actor_user_id
      and product_code = input_product_code
      and status = 'active'
      and (expires_at is null or expires_at > now())
    for update;

    if not found then raise exception 'ACTIVATION_REQUIRED'; end if;

    quota_limit := case
      -- Natural TTS is independent from AI feedback and resets at midnight in China.
      when is_tts then 60
      when input_action = 'mock_interview' then active_entitlement.mock_interview_limit
      -- One paid ASR conversion consumes one feedback allowance unit.
      when input_action = 'transcribe' then active_entitlement.ai_feedback_limit
      else active_entitlement.ai_feedback_limit
    end;
    failure_limit := 20;
  end if;

  select count(*) into recent_failure_count
  from public.ai_usage_reservations
  where user_id = actor_user_id
    and product_code = input_product_code
    and status = 'failed'
    and created_at >= now() - interval '24 hours'
    and (not is_free_trial or mode = 'scenario_trial');

  if recent_failure_count >= failure_limit then
    raise exception 'AI_FAILURE_LIMIT_REACHED';
  end if;

  if quota_limit is null then
    return jsonb_build_object('reservation_id', null, 'unlimited', true);
  end if;

  select * into existing_reservation
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
  if found and existing_reservation.status = 'failed' then
    raise exception 'AI_REQUEST_PREVIOUSLY_FAILED';
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

  select count(*) into usage_count
  from public.ai_usage_events
  where user_id = actor_user_id
    and (is_tts or product_code = input_product_code)
    and action = input_action
    and case
      when is_tts then created_at >= shanghai_day_start
      when is_free_trial and input_action = 'transcribe' then mode = 'scenario_trial'
      when is_free_trial then scenario_id = normalized_scenario_id
      else created_at >= coalesce(active_entitlement.starts_at, '-infinity'::timestamptz)
    end;

  select count(*) into reservation_count
  from public.ai_usage_reservations
  where user_id = actor_user_id
    and (is_tts or product_code = input_product_code)
    and action = input_action
    and status = 'reserved'
    and case
      when is_tts then created_at >= shanghai_day_start
      when is_free_trial and input_action = 'transcribe' then mode = 'scenario_trial'
      when is_free_trial then scenario_id = normalized_scenario_id
      else true
    end;

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
  ) returning id into reservation_id;

  return jsonb_build_object(
    'reservation_id', reservation_id,
    'unlimited', false,
    'limit', quota_limit,
    'used', usage_count + reservation_count
  );
end;
$$;

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
  if input_action not in (
    'transcribe', 'evaluate', 'mock_interview',
    'scenario_turn', 'scenario_evaluate', 'tts'
  ) then
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

revoke all on function public.reserve_ai_usage_quota(text, text, text, text, text) from public, anon;
revoke all on function public.record_ai_usage_event(text, text, text, text, text, text, text) from public, anon;
grant execute on function public.reserve_ai_usage_quota(text, text, text, text, text) to authenticated;
grant execute on function public.record_ai_usage_event(text, text, text, text, text, text, text) to authenticated;

commit;

-- Verification: both routines should be returned and tts must appear in both checks.
select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('reserve_ai_usage_quota', 'record_ai_usage_event')
order by routine_name;

select
  table_row.table_name,
  table_row.constraint_name,
  check_row.check_clause
from information_schema.check_constraints check_row
join information_schema.table_constraints table_row
  on table_row.constraint_catalog = check_row.constraint_catalog
  and table_row.constraint_schema = check_row.constraint_schema
  and table_row.constraint_name = check_row.constraint_name
where table_row.table_schema = 'public'
  and table_row.table_name in ('ai_usage_events', 'ai_usage_reservations')
  and check_row.check_clause like '%tts%'
order by table_name, constraint_name;
