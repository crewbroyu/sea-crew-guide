-- Cross-module capability evidence is written only by the trusted application server.
-- Learners can read their own evidence and aggregated profiles.

begin;

create table if not exists public.user_skill_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_key text not null check (job_key in ('cruise_general', 'bar_server', 'retail')),
  skill_key text not null check (skill_key in (
    'listening',
    'speaking_clarity',
    'interview_structure',
    'job_knowledge',
    'guest_handling',
    'sales',
    'problem_solving',
    'safety_judgment'
  )),
  score smallint not null check (score between 0 and 100),
  weight numeric(4,2) not null default 1 check (weight > 0 and weight <= 5),
  source text not null check (source in (
    'assessment',
    'scenario',
    'interview',
    'foundation_quiz',
    'listening',
    'shift',
    'retail_module'
  )),
  source_id text not null check (char_length(source_id) between 1 and 160),
  evidence_text text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, source, source_id, skill_key)
);

create index if not exists user_skill_evidence_profile_idx
  on public.user_skill_evidence (user_id, job_key, occurred_at desc);

create table if not exists public.user_skill_profiles (
  user_id uuid not null references auth.users(id) on delete cascade,
  job_key text not null check (job_key in ('cruise_general', 'bar_server', 'retail')),
  readiness_score smallint not null default 0 check (readiness_score between 0 and 100),
  skills jsonb not null default '{}'::jsonb,
  confidence jsonb not null default '{}'::jsonb,
  weakest jsonb not null default '[]'::jsonb,
  evidence_count integer not null default 0 check (evidence_count >= 0),
  source_counts jsonb not null default '{}'::jsonb,
  coverage_percent smallint not null default 0 check (coverage_percent between 0 and 100),
  updated_at timestamptz not null default now(),
  primary key (user_id, job_key)
);

alter table public.user_skill_evidence enable row level security;
alter table public.user_skill_evidence force row level security;
alter table public.user_skill_profiles enable row level security;
alter table public.user_skill_profiles force row level security;

revoke all on table public.user_skill_evidence from public, anon, authenticated;
revoke all on table public.user_skill_profiles from public, anon, authenticated;
grant select on table public.user_skill_evidence to authenticated;
grant select on table public.user_skill_profiles to authenticated;

drop policy if exists "Users can read own unified skill evidence" on public.user_skill_evidence;
create policy "Users can read own unified skill evidence"
on public.user_skill_evidence for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own unified skill profiles" on public.user_skill_profiles;
create policy "Users can read own unified skill profiles"
on public.user_skill_profiles for select to authenticated
using ((select auth.uid()) = user_id);

commit;

-- Verification: authenticated has SELECT only. All writes require the server secret key.
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('user_skill_evidence', 'user_skill_profiles')
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;
