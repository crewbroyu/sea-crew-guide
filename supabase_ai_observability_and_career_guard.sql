-- Forward-only production migration: AI operation telemetry and atomic career-report guard.
-- Run after supabase_launch_hardening.sql and supabase_ai_advisor_foundation.sql.

begin;

create table if not exists public.ai_operation_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_code text references public.products(code),
  action text not null,
  mode text not null,
  request_id text,
  provider text,
  model text,
  success boolean not null,
  status_code integer,
  error_code text,
  latency_ms integer not null default 0 check (latency_ms >= 0),
  duration_seconds integer check (duration_seconds is null or duration_seconds between 1 and 120),
  input_tokens integer check (input_tokens is null or input_tokens >= 0),
  output_tokens integer check (output_tokens is null or output_tokens >= 0),
  estimated_cost_cny numeric(12, 6) check (estimated_cost_cny is null or estimated_cost_cny >= 0),
  created_at timestamptz not null default now()
);

create index if not exists ai_operation_logs_created_idx
  on public.ai_operation_logs (created_at desc);
create index if not exists ai_operation_logs_product_action_idx
  on public.ai_operation_logs (product_code, action, created_at desc);
create index if not exists ai_operation_logs_error_idx
  on public.ai_operation_logs (error_code, created_at desc)
  where success = false;

alter table public.ai_operation_logs enable row level security;
revoke all on table public.ai_operation_logs from public, anon, authenticated;

create or replace function public.record_ai_operation_log(
  input_product_code text,
  input_action text,
  input_mode text,
  input_request_id text default null,
  input_provider text default null,
  input_model text default null,
  input_success boolean default false,
  input_status_code integer default null,
  input_error_code text default null,
  input_latency_ms integer default 0,
  input_duration_seconds integer default null,
  input_estimated_cost_cny numeric default null
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
  if input_action not in ('transcribe', 'evaluate', 'scenario_turn', 'scenario_evaluate', 'answer_coach') then
    raise exception 'INVALID_AI_ACTION';
  end if;
  if input_duration_seconds is not null and input_duration_seconds not between 1 and 120 then
    raise exception 'INVALID_AUDIO_DURATION';
  end if;

  insert into public.ai_operation_logs (
    user_id, product_code, action, mode, request_id, provider, model,
    success, status_code, error_code, latency_ms, duration_seconds, estimated_cost_cny
  ) values (
    actor_user_id,
    case when input_product_code in ('bar_server_pack', 'retail_sales_pack') then input_product_code else null end,
    input_action,
    left(coalesce(input_mode, ''), 80),
    nullif(left(coalesce(input_request_id, ''), 200), ''),
    nullif(left(coalesce(input_provider, ''), 80), ''),
    nullif(left(coalesce(input_model, ''), 120), ''),
    coalesce(input_success, false),
    case when input_status_code between 100 and 599 then input_status_code else null end,
    nullif(left(coalesce(input_error_code, ''), 120), ''),
    greatest(0, least(coalesce(input_latency_ms, 0), 300000)),
    input_duration_seconds,
    greatest(0, least(coalesce(input_estimated_cost_cny, 0), 1000))
  ) returning id into inserted_id;

  return inserted_id;
end;
$$;

revoke all on function public.record_ai_operation_log(text, text, text, text, text, text, boolean, integer, text, integer, integer, numeric)
  from public, anon;
grant execute on function public.record_ai_operation_log(text, text, text, text, text, text, boolean, integer, text, integer, integer, numeric)
  to authenticated;

create table if not exists public.career_report_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id text not null,
  status text not null check (status in ('reserved', 'completed', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.career_report_reservations enable row level security;
revoke all on table public.career_report_reservations from public, anon, authenticated;

create or replace function public.reserve_career_report_generation(input_request_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := auth.uid();
  normalized_request_id text := nullif(left(trim(coalesce(input_request_id, '')), 200), '');
  existing_reservation public.career_report_reservations%rowtype;
begin
  if actor_user_id is null then raise exception 'LOGIN_REQUIRED'; end if;
  if normalized_request_id is null then raise exception 'REQUEST_ID_REQUIRED'; end if;

  perform pg_advisory_xact_lock(hashtextextended(actor_user_id::text || ':career-report', 0));

  if exists (select 1 from public.career_reports where user_id = actor_user_id) then
    raise exception 'CAREER_REPORT_ALREADY_GENERATED';
  end if;

  select * into existing_reservation
  from public.career_report_reservations
  where user_id = actor_user_id;

  if existing_reservation.status = 'reserved'
    and existing_reservation.updated_at >= now() - interval '3 minutes' then
    raise exception 'CAREER_REPORT_IN_PROGRESS';
  end if;
  if existing_reservation.status = 'completed' then
    raise exception 'CAREER_REPORT_ALREADY_GENERATED';
  end if;

  insert into public.career_report_reservations (user_id, request_id, status)
  values (actor_user_id, normalized_request_id, 'reserved')
  on conflict (user_id) do update set
    request_id = excluded.request_id,
    status = 'reserved',
    updated_at = now()
  returning * into existing_reservation;

  return jsonb_build_object('reservation_id', existing_reservation.id);
end;
$$;

create or replace function public.finalize_career_report_generation(
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
  if input_outcome not in ('completed', 'failed') then raise exception 'INVALID_OUTCOME'; end if;

  update public.career_report_reservations
  set status = input_outcome, updated_at = now()
  where id = input_reservation_id and user_id = actor_user_id and status = 'reserved';

  return found;
end;
$$;

revoke all on function public.reserve_career_report_generation(text) from public, anon;
grant execute on function public.reserve_career_report_generation(text) to authenticated;
revoke all on function public.finalize_career_report_generation(uuid, text) from public, anon;
grant execute on function public.finalize_career_report_generation(uuid, text) to authenticated;

create or replace function public.get_admin_ai_operations_overview(input_days integer default 14)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := auth.uid();
  safe_days integer := greatest(1, least(coalesce(input_days, 14), 90));
  since_time timestamptz := now() - make_interval(days => safe_days);
  result jsonb;
begin
  if actor_user_id is null or not exists (
    select 1 from public.user_access
    where user_id = actor_user_id and role = 'admin' and access_status = 'active'
  ) then raise exception 'Administrator access required'; end if;

  select jsonb_build_object(
    'request_count', count(*),
    'success_count', count(*) filter (where success),
    'failure_count', count(*) filter (where not success),
    'success_rate', case when count(*) = 0 then 0 else round(100.0 * count(*) filter (where success) / count(*), 1) end,
    'asr_seconds', coalesce(sum(duration_seconds) filter (where action = 'transcribe' and success), 0),
    'estimated_cost_cny', coalesce(round(sum(estimated_cost_cny) filter (where success), 4), 0),
    'average_latency_ms', coalesce(round(avg(latency_ms)), 0),
    'top_errors', coalesce((
      select jsonb_agg(to_jsonb(error_row) order by error_row.count desc)
      from (
        select coalesce(error_code, 'UNKNOWN') as error_code, count(*) as count
        from public.ai_operation_logs
        where created_at >= since_time and success = false
        group by coalesce(error_code, 'UNKNOWN')
        order by count(*) desc
        limit 5
      ) error_row
    ), '[]'::jsonb)
  ) into result
  from public.ai_operation_logs
  where created_at >= since_time;

  return result;
end;
$$;

revoke all on function public.get_admin_ai_operations_overview(integer) from public, anon;
grant execute on function public.get_admin_ai_operations_overview(integer) to authenticated;

commit;

select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'record_ai_operation_log',
    'reserve_career_report_generation',
    'finalize_career_report_generation',
    'get_admin_ai_operations_overview'
  )
order by routine_name;
