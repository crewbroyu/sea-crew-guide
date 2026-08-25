create table if not exists public.interview_practice_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_position text not null,
  source text not null default 'ai_mock_interview',
  interviewer_name text,
  questions jsonb not null default '[]'::jsonb,
  answers jsonb not null default '[]'::jsonb,
  question_scores jsonb not null default '[]'::jsonb,
  overall_score integer not null default 0,
  rating integer,
  overall_suggestion text,
  weak_points jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists interview_practice_records_user_created_idx
  on public.interview_practice_records (user_id, created_at desc);

create index if not exists interview_practice_records_target_position_idx
  on public.interview_practice_records (target_position);

alter table public.interview_practice_records enable row level security;

grant select, insert on public.interview_practice_records to authenticated;

drop policy if exists "Users can read own interview records" on public.interview_practice_records;
create policy "Users can read own interview records"
on public.interview_practice_records
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own interview records" on public.interview_practice_records;
create policy "Users can insert own interview records"
on public.interview_practice_records
for insert
to authenticated
with check ((select auth.uid()) = user_id);
