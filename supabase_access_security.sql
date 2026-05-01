-- Run this in Supabase SQL editor before deploying the hardened access gate.
-- It moves paid access authority out of browser localStorage and into
-- authenticated, user-bound database state.

create table if not exists public.activation_codes (
  code text primary key,
  is_used boolean not null default false,
  used_by text,
  used_by_email text,
  used_at timestamptz,
  type text,
  created_at timestamptz not null default now()
);

alter table public.activation_codes
  add column if not exists is_used boolean not null default false,
  add column if not exists used_by text,
  add column if not exists used_by_email text,
  add column if not exists used_at timestamptz,
  add column if not exists type text,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.user_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  unlocked boolean not null default false,
  unlocked_at timestamptz,
  activation_code text references public.activation_codes(code),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.activation_codes enable row level security;
alter table public.user_access enable row level security;

drop policy if exists "Users can read their own access" on public.user_access;
create policy "Users can read their own access"
on public.user_access
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users cannot directly change access" on public.user_access;
create policy "Users cannot directly change access"
on public.user_access
for all
to authenticated
using (false)
with check (false);

drop policy if exists "Clients cannot read activation codes" on public.activation_codes;
create policy "Clients cannot read activation codes"
on public.activation_codes
for select
to authenticated
using (false);

drop policy if exists "Clients cannot modify activation codes" on public.activation_codes;
create policy "Clients cannot modify activation codes"
on public.activation_codes
for all
to authenticated
using (false)
with check (false);

create or replace function public.consume_activation_code(input_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_code text := upper(trim(input_code));
  consumed_code text;
  access_time timestamptz := now();
begin
  if auth.uid() is null then
    return jsonb_build_object('success', false, 'reason', 'Login required');
  end if;

  update public.activation_codes
  set
    is_used = true,
    used_by = auth.uid()::text,
    used_by_email = auth.email(),
    used_at = access_time
  where code = normalized_code
    and is_used = false
  returning code into consumed_code;

  if consumed_code is null then
    if exists (select 1 from public.activation_codes where code = normalized_code) then
      return jsonb_build_object('success', false, 'reason', 'Code already used');
    end if;

    return jsonb_build_object('success', false, 'reason', 'Invalid code');
  end if;

  insert into public.user_access (
    user_id,
    unlocked,
    unlocked_at,
    activation_code,
    updated_at
  )
  values (
    auth.uid(),
    true,
    access_time,
    consumed_code,
    access_time
  )
  on conflict (user_id)
  do update set
    unlocked = true,
    unlocked_at = excluded.unlocked_at,
    activation_code = excluded.activation_code,
    updated_at = excluded.updated_at;

  return jsonb_build_object(
    'success', true,
    'unlocked_at', access_time
  );
end;
$$;

revoke all on function public.consume_activation_code(text) from public;
grant execute on function public.consume_activation_code(text) to authenticated;
