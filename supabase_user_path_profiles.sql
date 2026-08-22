create table if not exists public.user_path_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  career_stage text not null default 'exploring',
  target_position text,
  target_company text,
  target_ship text,
  target_interview_month text,
  target_boarding_month text,
  city text,
  training_city text,
  application_method text,
  application_stage text not null default 'exploring',
  resume_status text not null default 'not_started',
  interview_status text not null default 'not_started',
  buddy_intent text,
  buddy_opt_in boolean not null default false,
  needs jsonb not null default '[]'::jsonb,
  can_help_with jsonb not null default '[]'::jsonb,
  latest_assessment_score integer,
  latest_assessment_level text,
  last_completed_task_id integer,
  task_progress jsonb not null default '{}'::jsonb,
  lead_score integer not null default 0,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_path_profiles_career_stage_idx
  on public.user_path_profiles (career_stage);

create index if not exists user_path_profiles_target_position_idx
  on public.user_path_profiles (target_position);

create index if not exists user_path_profiles_application_stage_idx
  on public.user_path_profiles (application_stage);

create index if not exists user_path_profiles_buddy_opt_in_idx
  on public.user_path_profiles (buddy_opt_in);

alter table public.user_path_profiles enable row level security;

drop policy if exists "Users can read own path profile" on public.user_path_profiles;
create policy "Users can read own path profile"
on public.user_path_profiles
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own path profile" on public.user_path_profiles;
create policy "Users can insert own path profile"
on public.user_path_profiles
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own path profile" on public.user_path_profiles;
create policy "Users can update own path profile"
on public.user_path_profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
