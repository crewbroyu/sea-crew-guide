create table if not exists public.resume_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  phone text,
  nationality text,
  location text,
  passport_status text,
  professional_summary text,
  work_experience jsonb not null default '[]'::jsonb,
  education jsonb not null default '[]'::jsonb,
  skills jsonb not null default '[]'::jsonb,
  certificates jsonb not null default '[]'::jsonb,
  languages jsonb not null default '[]'::jsonb,
  source_task_id integer not null default 4,
  resume_status text not null default 'draft_ready',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resume_profiles_resume_status_idx
  on public.resume_profiles (resume_status);

create index if not exists resume_profiles_updated_at_idx
  on public.resume_profiles (updated_at desc);

alter table public.resume_profiles enable row level security;

drop policy if exists "Users can read own resume profile" on public.resume_profiles;
create policy "Users can read own resume profile"
on public.resume_profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own resume profile" on public.resume_profiles;
create policy "Users can insert own resume profile"
on public.resume_profiles
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own resume profile" on public.resume_profiles;
create policy "Users can update own resume profile"
on public.resume_profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
