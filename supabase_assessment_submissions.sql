create table if not exists public.assessment_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  name text,
  phone text,
  wechat text,
  email text,
  goal text,
  service_background text,
  answers jsonb not null default '{}'::jsonb,
  dimension_scores jsonb not null default '{}'::jsonb,
  overall_score integer not null default 0,
  level text,
  level_label text,
  recommendations jsonb not null default '[]'::jsonb,
  contact_status text not null default 'new',
  admin_notes text,
  source text not null default 'web_assessment',
  created_at timestamptz not null default now()
);

create index if not exists assessment_submissions_created_at_idx
  on public.assessment_submissions (created_at desc);

create index if not exists assessment_submissions_user_id_idx
  on public.assessment_submissions (user_id);

create index if not exists assessment_submissions_overall_score_idx
  on public.assessment_submissions (overall_score);

alter table public.assessment_submissions enable row level security;

-- Direct browser inserts stay closed. The authenticated, rate-limited
-- save_assessment_submission RPC is created by supabase_launch_hardening.sql.
drop policy if exists "Anyone can submit assessment" on public.assessment_submissions;
drop policy if exists "Users can submit own assessment" on public.assessment_submissions;
revoke insert on table public.assessment_submissions from anon, authenticated;
grant select on table public.assessment_submissions to authenticated;

drop policy if exists "Users can read own assessment submissions" on public.assessment_submissions;
create policy "Users can read own assessment submissions"
on public.assessment_submissions
for select
to authenticated
using ((select auth.uid()) = user_id);
