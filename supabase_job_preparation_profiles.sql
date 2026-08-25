create table if not exists public.job_preparation_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  selected_role text,
  role_title text,
  preparation_checklist jsonb not null default '[]'::jsonb,
  completed_resources jsonb not null default '[]'::jsonb,
  learning_records jsonb not null default '{}'::jsonb,
  completed_course_details jsonb not null default '{}'::jsonb,
  completed_checklist_count integer not null default 0,
  checklist_total integer not null default 0,
  source_task_id integer not null default 5,
  preparation_status text not null default 'in_progress',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists job_preparation_profiles_selected_role_idx
  on public.job_preparation_profiles (selected_role);

create index if not exists job_preparation_profiles_status_idx
  on public.job_preparation_profiles (preparation_status);

create index if not exists job_preparation_profiles_updated_at_idx
  on public.job_preparation_profiles (updated_at desc);

alter table public.job_preparation_profiles enable row level security;

drop policy if exists "Users can read own job preparation" on public.job_preparation_profiles;
create policy "Users can read own job preparation"
on public.job_preparation_profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own job preparation" on public.job_preparation_profiles;
create policy "Users can insert own job preparation"
on public.job_preparation_profiles
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own job preparation" on public.job_preparation_profiles;
create policy "Users can update own job preparation"
on public.job_preparation_profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
