-- Persist AI-generated career decision reports. The browser may only read its
-- own reports; writes go through the authenticated RPC below.

create table if not exists public.career_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile jsonb not null check (jsonb_typeof(profile) = 'object'),
  assessment_snapshot jsonb not null check (jsonb_typeof(assessment_snapshot) = 'object'),
  report jsonb not null check (jsonb_typeof(report) = 'object'),
  model text,
  created_at timestamptz not null default now()
);

create index if not exists career_reports_user_created_idx
  on public.career_reports (user_id, created_at desc);

alter table public.career_reports enable row level security;
revoke all on table public.career_reports from public, anon, authenticated;
grant select on table public.career_reports to authenticated;

drop policy if exists "Users can read own career reports" on public.career_reports;
create policy "Users can read own career reports"
on public.career_reports
for select
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.save_career_report(
  input_profile jsonb,
  input_assessment jsonb,
  input_report jsonb,
  input_model text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := auth.uid();
  report_id uuid;
begin
  if actor_user_id is null then
    raise exception 'Login required';
  end if;

  if jsonb_typeof(input_profile) <> 'object'
    or jsonb_typeof(input_assessment) <> 'object'
    or jsonb_typeof(input_report) <> 'object' then
    raise exception 'Invalid report payload';
  end if;

  insert into public.career_reports (user_id, profile, assessment_snapshot, report, model)
  values (actor_user_id, input_profile, input_assessment, input_report, left(input_model, 120))
  returning id into report_id;

  return report_id;
end;
$$;

revoke all on function public.save_career_report(jsonb, jsonb, jsonb, text) from public, anon;
grant execute on function public.save_career_report(jsonb, jsonb, jsonb, text) to authenticated;
