-- Role, membership and mentor foundation.
-- Keeps legacy `unlocked` access working while moving authorization into
-- database-owned fields that browser users cannot change directly.

create table if not exists public.activation_codes (
  code text primary key,
  is_used boolean not null default false,
  used_by text,
  used_by_email text,
  used_at timestamptz,
  type text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  unlocked boolean not null default false,
  unlocked_at timestamptz,
  activation_code text references public.activation_codes(code),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_access
  add column if not exists role text not null default 'member',
  add column if not exists plan text not null default 'free',
  add column if not exists access_status text not null default 'active',
  add column if not exists premium_until timestamptz;

alter table public.user_access
  drop constraint if exists user_access_role_check,
  drop constraint if exists user_access_plan_check,
  drop constraint if exists user_access_status_check;

alter table public.user_access
  add constraint user_access_role_check check (role in ('member', 'mentor', 'admin')),
  add constraint user_access_plan_check check (plan in ('free', 'premium')),
  add constraint user_access_status_check check (access_status in ('active', 'suspended'));

create index if not exists user_access_activation_code_idx
  on public.user_access (activation_code);

update public.user_access
set plan = 'premium'
where unlocked = true and plan = 'free';

insert into public.user_access (
  user_id,
  unlocked,
  unlocked_at,
  role,
  plan,
  access_status,
  updated_at
)
select
  id,
  true,
  coalesce(last_sign_in_at, now()),
  'admin',
  'premium',
  'active',
  now()
from auth.users
where lower(email) in (lower('crewbroyu@gmail.com'), lower('crewbroyu@outlook.com'))
on conflict (user_id)
do update set
  unlocked = true,
  unlocked_at = coalesce(public.user_access.unlocked_at, excluded.unlocked_at),
  role = 'admin',
  plan = 'premium',
  access_status = 'active',
  updated_at = now();

alter table public.user_access enable row level security;

revoke all on table public.user_access from public, anon, authenticated;
grant select on table public.user_access to authenticated;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'user_access'
  loop
    execute format('drop policy if exists %I on public.user_access', policy_record.policyname);
  end loop;
end;
$$;

create policy "Users can read own access"
on public.user_access
for select
to authenticated
using ((select auth.uid()) = user_id);

alter table public.activation_codes enable row level security;
alter table public.activation_codes no force row level security;

revoke all on table public.activation_codes from public, anon, authenticated;
grant select, insert, update, delete on table public.activation_codes to authenticated;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'activation_codes'
  loop
    execute format('drop policy if exists %I on public.activation_codes', policy_record.policyname);
  end loop;
end;
$$;

create policy "Admins can read activation codes"
on public.activation_codes
for select
to authenticated
using (
  exists (
    select 1
    from public.user_access access
    where access.user_id = (select auth.uid())
      and access.role = 'admin'
      and access.access_status = 'active'
  )
);

create policy "Admins can insert activation codes"
on public.activation_codes
for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_access access
    where access.user_id = (select auth.uid())
      and access.role = 'admin'
      and access.access_status = 'active'
  )
);

create policy "Admins can update activation codes"
on public.activation_codes
for update
to authenticated
using (
  exists (
    select 1
    from public.user_access access
    where access.user_id = (select auth.uid())
      and access.role = 'admin'
      and access.access_status = 'active'
  )
)
with check (
  exists (
    select 1
    from public.user_access access
    where access.user_id = (select auth.uid())
      and access.role = 'admin'
      and access.access_status = 'active'
  )
);

create policy "Admins can delete activation codes"
on public.activation_codes
for delete
to authenticated
using (
  exists (
    select 1
    from public.user_access access
    where access.user_id = (select auth.uid())
      and access.role = 'admin'
      and access.access_status = 'active'
  )
);

drop function if exists public.consume_activation_code(text, uuid, text);
drop function if exists public.consume_activation_code(text);

create function public.consume_activation_code(input_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_code text := upper(trim(input_code));
  actor_user_id uuid := auth.uid();
  actor_email text := auth.jwt() ->> 'email';
  consumed_code text;
  access_time timestamptz := now();
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
    role,
    plan,
    access_status,
    activation_code,
    updated_at
  )
  values (
    actor_user_id,
    true,
    access_time,
    'member',
    'premium',
    'active',
    consumed_code,
    access_time
  )
  on conflict (user_id)
  do update set
    unlocked = true,
    unlocked_at = excluded.unlocked_at,
    plan = 'premium',
    access_status = 'active',
    activation_code = excluded.activation_code,
    updated_at = excluded.updated_at;

  return jsonb_build_object(
    'success', true,
    'plan', 'premium',
    'unlocked_at', access_time
  );
end;
$$;

revoke all on function public.consume_activation_code(text) from public, anon;
grant execute on function public.consume_activation_code(text) to authenticated;

create table if not exists public.mentor_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  bio text,
  cruise_companies jsonb not null default '[]'::jsonb
    check (jsonb_typeof(cruise_companies) = 'array'),
  onboard_positions jsonb not null default '[]'::jsonb
    check (jsonb_typeof(onboard_positions) = 'array'),
  years_experience smallint
    check (years_experience between 0 and 50),
  crew_verification_status text not null default 'pending'
    check (crew_verification_status in ('unverified', 'pending', 'verified', 'rejected')),
  mentor_status text not null default 'pending'
    check (mentor_status in ('inactive', 'pending', 'active', 'suspended')),
  verification_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mentor_profiles_status_idx
  on public.mentor_profiles (crew_verification_status, mentor_status);

alter table public.mentor_profiles enable row level security;
revoke all on table public.mentor_profiles from public, anon, authenticated;
grant select, insert, update on table public.mentor_profiles to authenticated;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.protect_mentor_status_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_is_admin boolean;
begin
  select exists (
    select 1
    from public.user_access access
    where access.user_id = auth.uid()
      and access.role = 'admin'
      and access.access_status = 'active'
  ) into actor_is_admin;

  if (
    old.crew_verification_status is distinct from new.crew_verification_status
    or old.mentor_status is distinct from new.mentor_status
    or old.verification_notes is distinct from new.verification_notes
  ) and not actor_is_admin then
    raise exception 'Only administrators can change mentor verification status';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists protect_mentor_status_fields on public.mentor_profiles;
create trigger protect_mentor_status_fields
before update on public.mentor_profiles
for each row execute function private.protect_mentor_status_fields();

create or replace function private.sync_mentor_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.crew_verification_status = 'verified' and new.mentor_status = 'active' then
    insert into public.user_access (
      user_id,
      role,
      plan,
      access_status,
      updated_at
    )
    values (
      new.user_id,
      'mentor',
      'free',
      'active',
      now()
    )
    on conflict (user_id)
    do update set
      role = case
        when public.user_access.role = 'admin' then 'admin'
        else 'mentor'
      end,
      updated_at = now();
  elsif old.crew_verification_status = 'verified' and old.mentor_status = 'active' then
    update public.user_access
    set role = 'member', updated_at = now()
    where user_id = new.user_id and role = 'mentor';
  end if;

  return new;
end;
$$;

revoke all on function private.sync_mentor_role() from public, anon, authenticated;

drop trigger if exists sync_mentor_role on public.mentor_profiles;
create trigger sync_mentor_role
after update of crew_verification_status, mentor_status on public.mentor_profiles
for each row execute function private.sync_mentor_role();

drop policy if exists "Users can read own mentor profile" on public.mentor_profiles;
drop policy if exists "Admins can read mentor profiles" on public.mentor_profiles;
drop policy if exists "Users or admins can read mentor profiles" on public.mentor_profiles;
create policy "Users or admins can read mentor profiles"
on public.mentor_profiles
for select
to authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1
    from public.user_access access
    where access.user_id = (select auth.uid())
      and access.role = 'admin'
      and access.access_status = 'active'
  )
);

drop policy if exists "Users can create own mentor application" on public.mentor_profiles;
create policy "Users can create own mentor application"
on public.mentor_profiles
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and crew_verification_status = 'pending'
  and mentor_status = 'pending'
);

drop policy if exists "Users can update own mentor profile" on public.mentor_profiles;
drop policy if exists "Admins can update mentor profiles" on public.mentor_profiles;
drop policy if exists "Users or admins can update mentor profiles" on public.mentor_profiles;
create policy "Users or admins can update mentor profiles"
on public.mentor_profiles
for update
to authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1
    from public.user_access access
    where access.user_id = (select auth.uid())
      and access.role = 'admin'
      and access.access_status = 'active'
  )
)
with check (
  (select auth.uid()) = user_id
  or exists (
    select 1
    from public.user_access access
    where access.user_id = (select auth.uid())
      and access.role = 'admin'
      and access.access_status = 'active'
  )
);
