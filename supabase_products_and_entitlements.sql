-- Product entitlements and persistent AI usage foundation.
-- Legacy premium access remains valid and is backfilled into the first
-- commercial product so existing founding members do not lose access.

create table if not exists public.products (
  code text primary key,
  name text not null,
  product_type text not null check (product_type in ('position_pack', 'site_pass', 'ai_addon', 'service')),
  price_cny numeric(10, 2) check (price_cny is null or price_cny >= 0),
  access_days integer check (access_days is null or access_days > 0),
  ai_feedback_quota integer not null default 0 check (ai_feedback_quota >= 0),
  mock_interview_quota integer not null default 0 check (mock_interview_quota >= 0),
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.products (
  code,
  name,
  product_type,
  price_cny,
  access_days,
  ai_feedback_quota,
  mock_interview_quota,
  metadata
)
values (
  'bar_server_pack',
  'Bar Server 单职位全流程包',
  'position_pack',
  199,
  180,
  120,
  10,
  jsonb_build_object(
    'position', 'bar_server',
    'reference_price', true,
    'includes', jsonb_build_array('foundation', 'scenarios', 'question_bank', 'ai_feedback', 'mock_interview')
  )
)
on conflict (code) do update set
  name = excluded.name,
  product_type = excluded.product_type,
  price_cny = excluded.price_cny,
  access_days = excluded.access_days,
  ai_feedback_quota = excluded.ai_feedback_quota,
  mock_interview_quota = excluded.mock_interview_quota,
  metadata = excluded.metadata,
  updated_at = now();

create table if not exists public.user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_code text not null references public.products(code),
  status text not null default 'active' check (status in ('active', 'expired', 'revoked')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  ai_feedback_limit integer check (ai_feedback_limit is null or ai_feedback_limit >= 0),
  mock_interview_limit integer check (mock_interview_limit is null or mock_interview_limit >= 0),
  source text not null default 'manual' check (source in ('activation_code', 'payment', 'founder', 'admin', 'migration')),
  source_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_code)
);

create index if not exists user_entitlements_active_lookup_idx
  on public.user_entitlements (user_id, product_code, status, expires_at);

create table if not exists public.ai_usage_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_code text references public.products(code),
  action text not null check (action in ('transcribe', 'evaluate', 'mock_interview')),
  mode text not null,
  scenario_id text,
  provider text,
  model text,
  request_id text,
  success boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_events_user_product_idx
  on public.ai_usage_events (user_id, product_code, action, created_at desc);

-- A client request can be retried after a network interruption. Keep one paid
-- usage record for that logical request instead of charging the quota twice.
create unique index if not exists ai_usage_events_paid_request_id_idx
  on public.ai_usage_events (user_id, product_code, action, request_id)
  where product_code is not null and request_id is not null;

alter table public.activation_codes
  add column if not exists product_code text references public.products(code),
  add column if not exists access_days integer check (access_days is null or access_days > 0);

alter table public.activation_codes
  alter column product_code set default 'bar_server_pack',
  alter column access_days set default 180;

update public.activation_codes
set product_code = 'bar_server_pack'
where product_code is null;

update public.activation_codes
set access_days = 180
where is_used = false and access_days is null;

insert into public.user_entitlements (
  user_id,
  product_code,
  status,
  starts_at,
  expires_at,
  ai_feedback_limit,
  mock_interview_limit,
  source,
  source_reference
)
select
  access.user_id,
  'bar_server_pack',
  'active',
  coalesce(access.unlocked_at, access.created_at, now()),
  null,
  null,
  null,
  'founder',
  access.activation_code
from public.user_access access
where access.access_status = 'active'
  and (access.unlocked = true or access.plan = 'premium' or access.role = 'admin')
on conflict (user_id, product_code) do nothing;

alter table public.products enable row level security;
alter table public.user_entitlements enable row level security;
alter table public.ai_usage_events enable row level security;

revoke all on table public.products from public, anon, authenticated;
revoke all on table public.user_entitlements from public, anon, authenticated;
revoke all on table public.ai_usage_events from public, anon, authenticated;

grant select on table public.products to anon, authenticated;
grant select on table public.user_entitlements to authenticated;
grant select on table public.ai_usage_events to authenticated;

drop policy if exists "Active products are publicly readable" on public.products;
create policy "Active products are publicly readable"
on public.products
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Users can read own entitlements" on public.user_entitlements;
create policy "Users can read own entitlements"
on public.user_entitlements
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own AI usage" on public.ai_usage_events;
create policy "Users can read own AI usage"
on public.ai_usage_events
for select
to authenticated
using ((select auth.uid()) = user_id);

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
begin
  if actor_user_id is null then
    return jsonb_build_object('success', false, 'reason', 'Login required');
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
  if actor_user_id is null then
    raise exception 'Login required';
  end if;

  if input_action not in ('transcribe', 'evaluate', 'mock_interview') then
    raise exception 'Invalid AI action';
  end if;

  if input_product_code is not null and input_request_id is not null then
    insert into public.ai_usage_events (
      user_id,
      product_code,
      action,
      mode,
      scenario_id,
      provider,
      model,
      request_id,
      success
    )
    values (
      actor_user_id,
      input_product_code,
      input_action,
      left(input_mode, 80),
      left(input_scenario_id, 160),
      left(input_provider, 80),
      left(input_model, 120),
      left(input_request_id, 200),
      true
    )
    on conflict (user_id, product_code, action, request_id)
      where product_code is not null and request_id is not null
    do nothing
    returning id into inserted_id;

    if inserted_id is null then
      select id
      into inserted_id
      from public.ai_usage_events
      where user_id = actor_user_id
        and product_code = input_product_code
        and action = input_action
        and request_id = left(input_request_id, 200);
    end if;
  else
    insert into public.ai_usage_events (
      user_id,
      product_code,
      action,
      mode,
      scenario_id,
      provider,
      model,
      request_id,
      success
    )
    values (
      actor_user_id,
      input_product_code,
      input_action,
      left(input_mode, 80),
      left(input_scenario_id, 160),
      left(input_provider, 80),
      left(input_model, 120),
      left(input_request_id, 200),
      true
    )
    returning id into inserted_id;
  end if;

  return inserted_id;
end;
$$;

revoke all on function public.record_ai_usage_event(text, text, text, text, text, text, text)
  from public, anon;
grant execute on function public.record_ai_usage_event(text, text, text, text, text, text, text)
  to authenticated;

-- The RPC above is the only write path. Clients may read their own usage but
-- cannot create arbitrary rows or manipulate their remaining quota display.
revoke insert on table public.ai_usage_events from authenticated;
drop policy if exists "Users can record own AI usage" on public.ai_usage_events;
