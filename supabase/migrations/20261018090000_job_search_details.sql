-- Structured details for recruitment search on /jobs/latest.
-- 1. position_details: [{ "title", "experience" }], experience per position (none, related, cruise,
--    unspecified), because one article often mixes entry roles with roles that need experience.
-- 2. interview_sessions: [{ "city", "mode", "date", "note" }], one entry per interview session, so
--    "Shanghai offline, Beijing online" cannot be matched as "Beijing offline".
-- 3. The positions limit rises from 20 to 60 for large group recruitment posts.
-- Existing rows get position_details from their positions with experience "unspecified" and no
-- interview sessions. deadline keeps its meaning (application deadline only); older rows may hold
-- an interview date there and must be reviewed by hand (see SUPABASE_MIGRATION_ORDER.md, step 18).
-- Safe to rerun.

begin;

-- A real calendar date in YYYY-MM-DD (rejects 2026-02-31, accepts 2028-02-29). The CASE runs its
-- checks in order, so malformed text never reaches a cast that would raise an error.
create or replace function public.job_posting_date_valid(value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when value !~ '^\d{4}-\d{2}-\d{2}$' then false
    when substr(value, 1, 4)::int < 1 or substr(value, 6, 2)::int not between 1 and 12 then false
    else substr(value, 9, 2)::int between 1 and extract(day from (
      make_date(substr(value, 1, 4)::int, substr(value, 6, 2)::int, 1) + interval '1 month - 1 day'
    ))::int
  end
$$;

create or replace function public.job_posting_details_valid(details jsonb, sessions jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(details) = 'array'
    and jsonb_array_length(details) <= 60
    and jsonb_typeof(sessions) = 'array'
    and jsonb_array_length(sessions) <= 20
    and not exists (
      select 1 from jsonb_array_elements(details) item
      where jsonb_typeof(item) <> 'object'
        or coalesce(jsonb_typeof(item -> 'title'), '') <> 'string'
        or char_length(coalesce(item ->> 'title', '')) not between 1 and 80
        or coalesce(item ->> 'experience', '') not in ('none', 'related', 'cruise', 'unspecified')
    )
    and not exists (
      select 1 from jsonb_array_elements(sessions) item
      where jsonb_typeof(item) <> 'object'
        or coalesce(item ->> 'mode', '') not in ('online', 'offline', 'unspecified')
        or (item ->> 'city') is not null and char_length(item ->> 'city') > 30
        or (item ->> 'note') is not null and char_length(item ->> 'note') > 120
        or (item ->> 'date') is not null and not public.job_posting_date_valid(item ->> 'date')
    )
$$;

alter table public.job_postings
  add column if not exists position_details jsonb not null default '[]'::jsonb,
  add column if not exists interview_sessions jsonb not null default '[]'::jsonb;

alter table public.job_postings drop constraint if exists job_postings_positions_check;
alter table public.job_postings add constraint job_postings_positions_check check (cardinality(positions) <= 60);

alter table public.job_postings drop constraint if exists job_postings_details_valid;
alter table public.job_postings add constraint job_postings_details_valid
  check (public.job_posting_details_valid(position_details, interview_sessions));

update public.job_postings
set position_details = (
  select coalesce(jsonb_agg(jsonb_build_object('title', title, 'experience', 'unspecified') order by ordinality), '[]'::jsonb)
  from unnest(positions) with ordinality as listed(title, ordinality)
  where char_length(title) between 1 and 80
)
where position_details = '[]'::jsonb and cardinality(positions) > 0;

-- The check constraint runs with the writer's privileges, so admins (authenticated) need EXECUTE.
-- The function only validates shapes and reads no data.
revoke all on function public.job_posting_details_valid(jsonb, jsonb) from public, anon;
grant execute on function public.job_posting_details_valid(jsonb, jsonb) to authenticated;
revoke all on function public.job_posting_date_valid(text) from public, anon;
grant execute on function public.job_posting_date_valid(text) to authenticated;

commit;
