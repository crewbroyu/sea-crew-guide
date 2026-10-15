-- Curated recruitment postings for /jobs/latest. Administrators paste a public article link
-- (usually a WeChat official account post), the server extracts structured fields with AI, and
-- an administrator reviews them before publishing. Only a summary and the source link are kept,
-- never the article body. Everyone, signed in or not, may read published rows; only active
-- administrators may read drafts or write. Safe to rerun.

begin;

create table if not exists public.job_postings (
  id uuid primary key default gen_random_uuid(),
  source_type text not null default 'wechat' check (source_type in ('wechat', 'official', 'board', 'other')),
  source_name text not null check (char_length(source_name) between 1 and 80),
  source_url text not null check (source_url ~ '^https://' and char_length(source_url) <= 1000),
  source_published_on date,
  title text not null check (char_length(title) between 1 and 120),
  summary text not null check (char_length(summary) between 1 and 400),
  cruise_lines text[] not null default '{}' check (cardinality(cruise_lines) <= 10),
  departments text[] not null default '{}' check (cardinality(departments) <= 10),
  positions text[] not null default '{}' check (cardinality(positions) <= 20),
  agency text check (char_length(agency) <= 120),
  locations text check (char_length(locations) <= 200),
  requirements text check (char_length(requirements) <= 800),
  salary text check (char_length(salary) <= 200),
  deadline date,
  risk_flags text[] not null default '{}' check (cardinality(risk_flags) <= 10),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists job_postings_source_url_key on public.job_postings (source_url);
create index if not exists job_postings_published_idx
  on public.job_postings (published_at desc) where status = 'published';

create or replace function public.touch_job_posting()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists touch_job_posting on public.job_postings;
create trigger touch_job_posting
  before insert or update on public.job_postings
  for each row execute function public.touch_job_posting();

alter table public.job_postings enable row level security;

drop policy if exists "Anyone can read published job postings" on public.job_postings;
create policy "Anyone can read published job postings"
  on public.job_postings for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "Admins can manage job postings" on public.job_postings;
create policy "Admins can manage job postings"
  on public.job_postings for all
  to authenticated
  using (exists (
    select 1 from public.user_access access
    where access.user_id = auth.uid()
      and access.role = 'admin'
      and access.access_status = 'active'
  ))
  with check (exists (
    select 1 from public.user_access access
    where access.user_id = auth.uid()
      and access.role = 'admin'
      and access.access_status = 'active'
  ));

revoke all on table public.job_postings from public, anon, authenticated;
grant select on table public.job_postings to anon;
grant select, insert, update, delete on table public.job_postings to authenticated;
revoke all on function public.touch_job_posting() from public, anon, authenticated;

commit;
