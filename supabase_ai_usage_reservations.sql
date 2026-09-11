-- Atomic AI quota reservations for paid training.
-- Run this after supabase_products_and_entitlements.sql.
-- A reservation is counted before the model call, so concurrent requests cannot
-- both pass the last available quota. Failed model calls are released by the API.

create table if not exists public.ai_usage_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_code text not null references public.products(code),
  action text not null check (action in ('evaluate', 'mock_interview')),
  mode text not null,
  scenario_id text,
  request_id text not null,
  status text not null default 'reserved' check (status in ('reserved', 'completed', 'released')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create unique index if not exists ai_usage_reservations_request_idx
  on public.ai_usage_reservations (user_id, product_code, action, request_id);

create index if not exists ai_usage_reservations_active_lookup_idx
  on public.ai_usage_reservations (user_id, product_code, action, status, created_at desc);

alter table public.ai_usage_reservations enable row level security;
revoke all on table public.ai_usage_reservations from public, anon, authenticated;

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
begin
  if actor_user_id is null then
    raise exception 'LOGIN_REQUIRED';
  end if;

  if input_product_code <> 'bar_server_pack'
    or input_action not in ('evaluate', 'mock_interview')
    or nullif(trim(input_request_id), '') is null then
    raise exception 'INVALID_QUOTA_REQUEST';
  end if;

  -- Serializes quota decisions for this user and product.
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
    else active_entitlement.ai_feedback_limit
  end;

  if quota_limit is null then
    return jsonb_build_object('reservation_id', null, 'unlimited', true);
  end if;

  select *
  into existing_reservation
  from public.ai_usage_reservations
  where user_id = actor_user_id
    and product_code = input_product_code
    and action = input_action
    and request_id = left(trim(input_request_id), 200)
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

  -- Stale reservations are abandoned requests, not successful training.
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
    and created_at >= coalesce(active_entitlement.starts_at, '-infinity'::timestamptz);

  select count(*)
  into reservation_count
  from public.ai_usage_reservations
  where user_id = actor_user_id
    and product_code = input_product_code
    and action = input_action
    and status = 'reserved';

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
    nullif(left(coalesce(input_scenario_id, ''), 160), ''),
    left(trim(input_request_id), 200),
    'reserved'
  )
  returning id into reservation_id;

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
  if actor_user_id is null then
    raise exception 'LOGIN_REQUIRED';
  end if;

  if input_outcome not in ('completed', 'released') then
    raise exception 'INVALID_RESERVATION_OUTCOME';
  end if;

  update public.ai_usage_reservations
  set
    status = input_outcome,
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
