create table if not exists public.interview_answer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  prepared_answer_count integer not null default 0,
  answer_cards jsonb not null default '[]'::jsonb,
  source_task_id integer not null default 6,
  preparation_status text not null default 'in_progress',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists interview_answer_profiles_status_idx
  on public.interview_answer_profiles (preparation_status);

create index if not exists interview_answer_profiles_prepared_count_idx
  on public.interview_answer_profiles (prepared_answer_count);

create index if not exists interview_answer_profiles_updated_at_idx
  on public.interview_answer_profiles (updated_at desc);

alter table public.interview_answer_profiles enable row level security;

drop policy if exists "Users can read own interview answers" on public.interview_answer_profiles;
create policy "Users can read own interview answers"
on public.interview_answer_profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own interview answers" on public.interview_answer_profiles;
create policy "Users can insert own interview answers"
on public.interview_answer_profiles
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own interview answers" on public.interview_answer_profiles;
create policy "Users can update own interview answers"
on public.interview_answer_profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
