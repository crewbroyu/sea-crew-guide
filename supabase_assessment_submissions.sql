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

drop policy if exists "Anyone can submit assessment" on public.assessment_submissions;
create policy "Anyone can submit assessment"
on public.assessment_submissions
for insert
with check (true);

drop policy if exists "Users can read own assessment submissions" on public.assessment_submissions;
create policy "Users can read own assessment submissions"
on public.assessment_submissions
for select
using (auth.uid() = user_id);
