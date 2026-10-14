-- Limit activation code guessing. consume_activation_code had no attempt limit, so any signed-in
-- account could script guesses against the 6-character code space. Each user may now fail at most
-- 5 times in 15 minutes and 20 times in a day; beyond that the code is not looked up at all.
-- The function body is otherwise unchanged from supabase_products_and_entitlements.sql.
-- Safe to rerun; existing codes, entitlements, and access rows are not modified.

begin;

create table if not exists public.activation_code_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  succeeded boolean not null,
  attempted_at timestamptz not null default now()
);

create index if not exists activation_code_attempts_user_time_idx
  on public.activation_code_attempts (user_id, attempted_at desc);

-- No policies and no grants: only the security definer redemption function reads and writes it.
alter table public.activation_code_attempts enable row level security;
revoke all on table public.activation_code_attempts from public, anon, authenticated;

create or replace function public.consume_activation_code(input_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_code text := upper(trim(input_code));
  actor_user_id uuid := auth.uid();
  actor_email text := auth.jwt() ->> 'email';
  consumed_code public.activation_codes%rowtype;
  access_time timestamptz := now();
  entitlement_expires_at timestamptz;
  recent_failures integer;
  daily_failures integer;
begin
  if actor_user_id is null then
    return jsonb_build_object('success', false, 'reason', 'Login required');
  end if;

  -- One redemption at a time per user, so parallel requests cannot all pass the failure count.
  perform pg_advisory_xact_lock(hashtextextended('activation-attempt:' || actor_user_id::text, 0));

  select
    count(*) filter (where attempted_at > access_time - interval '15 minutes'),
    count(*)
  into recent_failures, daily_failures
  from public.activation_code_attempts
  where user_id = actor_user_id
    and not succeeded
    and attempted_at > access_time - interval '1 day';

  if recent_failures >= 5 or daily_failures >= 20 then
    return jsonb_build_object('success', false, 'reason', 'Too many attempts');
  end if;

  update public.activation_codes
  set
    is_used = true,
    used_by = actor_user_id::text,
    used_by_email = actor_email,
    used_at = access_time
  where code = normalized_code
    and is_used = false
  returning * into consumed_code;

  if consumed_code.code is null then
    insert into public.activation_code_attempts (user_id, succeeded) values (actor_user_id, false);
    if exists (select 1 from public.activation_codes where code = normalized_code) then
      return jsonb_build_object('success', false, 'reason', 'Code already used');
    end if;
    return jsonb_build_object('success', false, 'reason', 'Invalid code');
  end if;

  insert into public.user_access (
    user_id, unlocked, unlocked_at, role, plan, access_status, activation_code, premium_until, updated_at
  )
  values (
    actor_user_id,
    consumed_code.product_code is null,
    case when consumed_code.product_code is null then access_time else null end,
    'member',
    case when consumed_code.product_code is null then 'premium' else 'free' end,
    'active',
    consumed_code.code,
    case
      when consumed_code.product_code is not null or consumed_code.access_days is null then null
      else access_time + make_interval(days => consumed_code.access_days)
    end,
    access_time
  )
  on conflict (user_id)
  do update set
    unlocked = public.user_access.unlocked or excluded.unlocked,
    unlocked_at = coalesce(public.user_access.unlocked_at, excluded.unlocked_at),
    plan = case when public.user_access.plan = 'premium' then 'premium' else excluded.plan end,
    access_status = 'active',
    activation_code = excluded.activation_code,
    premium_until = case when excluded.unlocked then excluded.premium_until else public.user_access.premium_until end,
    updated_at = excluded.updated_at;

  if consumed_code.product_code is not null then
    entitlement_expires_at := case
      when consumed_code.access_days is null then null
      else access_time + make_interval(days => consumed_code.access_days)
    end;

    insert into public.user_entitlements (
      user_id,
      product_code,
      status,
      starts_at,
      expires_at,
      ai_feedback_limit,
      mock_interview_limit,
      source,
      source_reference,
      updated_at
    )
    select
      actor_user_id,
      product.code,
      'active',
      access_time,
      entitlement_expires_at,
      product.ai_feedback_quota,
      product.mock_interview_quota,
      'activation_code',
      consumed_code.code,
      access_time
    from public.products product
    where product.code = consumed_code.product_code
    on conflict (user_id, product_code)
    do update set
      status = 'active',
      starts_at = excluded.starts_at,
      expires_at = excluded.expires_at,
      ai_feedback_limit = excluded.ai_feedback_limit,
      mock_interview_limit = excluded.mock_interview_limit,
      source = excluded.source,
      source_reference = excluded.source_reference,
      updated_at = excluded.updated_at;
  end if;

  insert into public.activation_code_attempts (user_id, succeeded) values (actor_user_id, true);

  return jsonb_build_object(
    'success', true,
    'plan', 'premium',
    'product_code', consumed_code.product_code,
    'unlocked_at', access_time,
    'expires_at', entitlement_expires_at
  );
end;
$$;

revoke all on function public.consume_activation_code(text) from public, anon;
grant execute on function public.consume_activation_code(text) to authenticated;

commit;

-- Verification: the attempt log is not readable or writable by clients, and redemption uses it.
select
  to_regclass('public.activation_code_attempts') is not null as attempt_log_exists,
  has_table_privilege('authenticated', 'public.activation_code_attempts', 'SELECT') as learner_can_read_attempts,
  has_table_privilege('authenticated', 'public.activation_code_attempts', 'INSERT') as learner_can_write_attempts,
  (select prosrc like '%activation_code_attempts%' from pg_proc
   where proname = 'consume_activation_code' and pronamespace = 'public'::regnamespace) as redemption_is_rate_limited;
