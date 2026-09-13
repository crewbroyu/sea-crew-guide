-- Production AI cost controls.
-- Run once after supabase_launch_hardening.sql, then deploy the matching API code.

begin;

alter table public.ai_usage_reservations
  drop constraint if exists ai_usage_reservations_status_check;
alter table public.ai_usage_reservations
  add constraint ai_usage_reservations_status_check
  check (status in ('reserved', 'completed', 'released', 'failed'));

create index if not exists ai_usage_reservations_failure_lookup_idx
  on public.ai_usage_reservations (user_id, product_code, status, created_at desc);

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
begin
  if actor_user_id is null then raise exception 'LOGIN_REQUIRED'; end if;
  if input_product_code <> 'bar_server_pack'
    or input_action not in ('transcribe', 'evaluate', 'mock_interview', 'scenario_turn', 'scenario_evaluate')
    or normalized_request_id = '' then
    raise exception 'INVALID_QUOTA_REQUEST';
  end if;

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
      when input_action = 'mock_interview' then active_entitlement.mock_interview_limit
      when input_action = 'transcribe' then
        case when active_entitlement.ai_feedback_limit is null then null
          else active_entitlement.ai_feedback_limit * 3 end
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
    and product_code = input_product_code
    and action = input_action
    and (not is_free_trial or scenario_id = normalized_scenario_id)
    and (is_free_trial or created_at >= coalesce(active_entitlement.starts_at, '-infinity'::timestamptz));

  select count(*) into reservation_count
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
    actor_user_id, input_product_code, input_action,
    left(coalesce(input_mode, ''), 80), normalized_scenario_id,
    normalized_request_id, 'reserved'
  ) returning id into reservation_id;

  return jsonb_build_object('reservation_id', reservation_id, 'unlimited', false);
end;
$$;

create or replace function public.finalize_ai_usage_reservation(
  input_reservation_id uuid,
  input_outcome text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := auth.uid();
begin
  if actor_user_id is null then raise exception 'LOGIN_REQUIRED'; end if;
  if input_outcome not in ('completed', 'released', 'failed') then
    raise exception 'INVALID_RESERVATION_OUTCOME';
  end if;

  update public.ai_usage_reservations
  set status = input_outcome,
      updated_at = now(),
      completed_at = case when input_outcome = 'completed' then now() else null end
  where id = input_reservation_id
    and user_id = actor_user_id
    and status = 'reserved';
  return found;
end;
$$;

revoke all on function public.reserve_ai_usage_quota(text, text, text, text, text) from public, anon;
revoke all on function public.finalize_ai_usage_reservation(uuid, text) from public, anon;
grant execute on function public.reserve_ai_usage_quota(text, text, text, text, text) to authenticated;
grant execute on function public.finalize_ai_usage_reservation(uuid, text) to authenticated;

commit;

select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('reserve_ai_usage_quota', 'finalize_ai_usage_reservation')
order by routine_name;
