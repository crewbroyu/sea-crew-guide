create table if not exists public.real_interview_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cruise_company text not null,
  target_position text not null,
  interview_date timestamptz,
  interview_round text not null default 'first'
    check (interview_round in ('screening', 'first', 'second', 'final')),
  interview_format text not null default 'video'
    check (interview_format in ('video', 'phone', 'onsite', 'recorded')),
  platform text,
  interviewer_name text,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'waiting', 'next_round', 'passed', 'rejected', 'withdrawn')),
  questions jsonb not null default '[]'::jsonb
    check (jsonb_typeof(questions) = 'array'),
  overall_confidence smallint
    check (overall_confidence between 1 and 5),
  interviewer_feedback text,
  next_action text,
  next_action_at timestamptz,
  notes text,
  consent_anonymous_questions boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists real_interview_records_user_date_idx
  on public.real_interview_records (user_id, interview_date desc);

create index if not exists real_interview_records_user_status_idx
  on public.real_interview_records (user_id, status);

alter table public.real_interview_records enable row level security;

revoke all on table public.real_interview_records from anon, authenticated;
grant select, insert, update, delete on table public.real_interview_records to authenticated;

drop policy if exists "Users can read own real interview records" on public.real_interview_records;
create policy "Users can read own real interview records"
on public.real_interview_records
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own real interview records" on public.real_interview_records;
create policy "Users can insert own real interview records"
on public.real_interview_records
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own real interview records" on public.real_interview_records;
create policy "Users can update own real interview records"
on public.real_interview_records
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own real interview records" on public.real_interview_records;
create policy "Users can delete own real interview records"
on public.real_interview_records
for delete
to authenticated
using ((select auth.uid()) = user_id);
