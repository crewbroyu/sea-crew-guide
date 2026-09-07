-- Reusable job-simulator records. Run once in Supabase SQL Editor before deploying
-- the UI that writes these tables.

create table if not exists public.scenario_training_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_key text not null,
  scenario_id text not null,
  difficulty smallint not null check (difficulty between 1 and 5),
  scenario_context jsonb not null default '{}'::jsonb check (jsonb_typeof(scenario_context) = 'object'),
  turns jsonb not null default '[]'::jsonb check (jsonb_typeof(turns) = 'array'),
  status text not null default 'completed' check (status in ('completed', 'abandoned')),
  overall_readiness integer not null default 0 check (overall_readiness between 0 and 100),
  skill_scores jsonb not null default '{}'::jsonb check (jsonb_typeof(skill_scores) = 'object'),
  strengths jsonb not null default '[]'::jsonb check (jsonb_typeof(strengths) = 'array'),
  weaknesses jsonb not null default '[]'::jsonb check (jsonb_typeof(weaknesses) = 'array'),
  critical_mistakes jsonb not null default '[]'::jsonb check (jsonb_typeof(critical_mistakes) = 'array'),
  better_response text,
  next_recommendation text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists scenario_training_sessions_user_job_completed_idx
  on public.scenario_training_sessions (user_id, job_key, completed_at desc);
create index if not exists scenario_training_sessions_user_scenario_idx
  on public.scenario_training_sessions (user_id, scenario_id, completed_at desc);

create table if not exists public.user_job_skill_profiles (
  user_id uuid not null references auth.users(id) on delete cascade,
  job_key text not null,
  readiness_score integer not null default 0 check (readiness_score between 0 and 100),
  skill_scores jsonb not null default '{}'::jsonb check (jsonb_typeof(skill_scores) = 'object'),
  weakest_skill text,
  recommended_scenario_id text,
  completed_scenario_count integer not null default 0 check (completed_scenario_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, job_key)
);

alter table public.scenario_training_sessions enable row level security;
alter table public.user_job_skill_profiles enable row level security;

revoke all on table public.scenario_training_sessions from public, anon, authenticated;
revoke all on table public.user_job_skill_profiles from public, anon, authenticated;
grant select, insert on table public.scenario_training_sessions to authenticated;
grant select, insert, update on table public.user_job_skill_profiles to authenticated;

drop policy if exists "Users can read own scenario sessions" on public.scenario_training_sessions;
create policy "Users can read own scenario sessions"
on public.scenario_training_sessions for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own scenario sessions" on public.scenario_training_sessions;
create policy "Users can insert own scenario sessions"
on public.scenario_training_sessions for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can read own job skill profile" on public.user_job_skill_profiles;
create policy "Users can read own job skill profile"
on public.user_job_skill_profiles for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own job skill profile" on public.user_job_skill_profiles;
create policy "Users can insert own job skill profile"
on public.user_job_skill_profiles for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own job skill profile" on public.user_job_skill_profiles;
create policy "Users can update own job skill profile"
on public.user_job_skill_profiles for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
