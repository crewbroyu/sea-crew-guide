-- Interview practice pack (¥99, 90 days, 60 AI feedback units): voice practice, AI feedback, and
-- reviewed reference answers for Bar Server, Retail, Restaurant, Housekeeping, and Front Office.
-- 1. Adds the product. It is sold through the existing manual purchase and activation code flow.
-- 2. Replaces reserve_ai_usage_quota to accept the new product code for transcribe and evaluate
--    only. The body is otherwise unchanged from supabase_voice_entitlements.sql; before applying,
--    confirm production still runs that version (see SUPABASE_MIGRATION_ORDER.md, step 17).
-- 3. Adds interview_reference_answers, readable only by holders of the practice pack, the matching
--    position pack, or active admins. Answers are loaded by SQL after human review.
-- Safe to rerun.

begin;

insert into public.products (
  code, name, product_type, price_cny, access_days, ai_feedback_quota, mock_interview_quota, is_active, metadata, updated_at
)
values (
  'interview_practice_pack',
  '面试练习包',
  'site_pass',
  99,
  90,
  60,
  0,
  true,
  jsonb_build_object(
    'positions', jsonb_build_array('bar_server', 'retail', 'restaurant', 'housekeeping', 'front_office'),
    'includes', jsonb_build_array('question_bank', 'reference_answers', 'voice_practice', 'ai_feedback'),
    'upgrade_note', 'Holders upgrading to a position pack pay the difference.'
  ),
  now()
)
on conflict (code) do update set
  name = excluded.name,
  product_type = excluded.product_type,
  price_cny = excluded.price_cny,
  access_days = excluded.access_days,
  ai_feedback_quota = excluded.ai_feedback_quota,
  mock_interview_quota = excluded.mock_interview_quota,
  is_active = excluded.is_active,
  metadata = excluded.metadata,
  updated_at = now();

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
  if input_product_code not in ('bar_server_pack', 'retail_sales_pack', 'interview_practice_pack')
    or input_action not in (
      'transcribe', 'evaluate', 'mock_interview',
      'scenario_turn', 'scenario_evaluate', 'tts'
    )
    or normalized_request_id = '' then
    raise exception 'INVALID_QUOTA_REQUEST';
  end if;

  -- The interview practice pack covers voice answers and AI feedback only: no mock interviews,
  -- scenario training, natural TTS, or free trial.
  if input_product_code = 'interview_practice_pack'
    and (input_action not in ('transcribe', 'evaluate') or is_free_trial) then
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

revoke all on function public.reserve_ai_usage_quota(text, text, text, text, text) from public, anon;
grant execute on function public.reserve_ai_usage_quota(text, text, text, text, text) to authenticated;

create table if not exists public.interview_reference_answers (
  position_key text not null check (position_key in ('bar_server', 'retail', 'restaurant', 'housekeeping', 'front_office')),
  question_id text not null check (char_length(question_id) between 1 and 80),
  answer_en text not null check (char_length(answer_en) between 1 and 2000),
  key_points_zh text check (char_length(key_points_zh) <= 1000),
  reviewed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (position_key, question_id)
);

alter table public.interview_reference_answers enable row level security;

drop policy if exists "Pack holders can read reference answers" on public.interview_reference_answers;
create policy "Pack holders can read reference answers"
  on public.interview_reference_answers for select
  to authenticated
  using (
    exists (
      select 1 from public.user_entitlements entitlement
      where entitlement.user_id = (select auth.uid())
        and entitlement.status = 'active'
        and entitlement.starts_at <= now()
        and (entitlement.expires_at is null or entitlement.expires_at > now())
        and (
          entitlement.product_code = 'interview_practice_pack'
          or (entitlement.product_code = 'bar_server_pack' and position_key = 'bar_server')
          or (entitlement.product_code = 'retail_sales_pack' and position_key = 'retail')
        )
    )
    or exists (
      select 1 from public.user_access access
      where access.user_id = (select auth.uid())
        and access.role = 'admin'
        and access.access_status = 'active'
    )
  );

revoke all on table public.interview_reference_answers from public, anon, authenticated;
grant select on table public.interview_reference_answers to authenticated;

commit;
