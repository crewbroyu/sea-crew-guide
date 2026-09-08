-- CrewPathGuide job application records.
-- Run once in the Supabase SQL Editor after the existing access tables.

create table if not exists public.job_application_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  job_title text not null,
  company_url text,
  notes text,
  status text not null default '未完成'
    check (status in ('未完成', '已申请', '等待回复', '面试中', 'Offer', '拒信')),
  source_type text not null default 'manual'
    check (source_type in ('cruise_company', 'brand_partner', 'job_channel', 'manual')),
  legacy_local_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists job_application_records_user_legacy_id_key
  on public.job_application_records (user_id, legacy_local_id);

create index if not exists job_application_records_user_updated_idx
  on public.job_application_records (user_id, updated_at desc);

create index if not exists job_application_records_user_status_idx
  on public.job_application_records (user_id, status);

alter table public.job_application_records enable row level security;

revoke all on table public.job_application_records from public, anon, authenticated;
grant select, insert, update, delete on table public.job_application_records to authenticated;

drop policy if exists "Users can read own job application records" on public.job_application_records;
create policy "Users can read own job application records"
on public.job_application_records
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own job application records" on public.job_application_records;
create policy "Users can insert own job application records"
on public.job_application_records
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own job application records" on public.job_application_records;
create policy "Users can update own job application records"
on public.job_application_records
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own job application records" on public.job_application_records;
create policy "Users can delete own job application records"
on public.job_application_records
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Admins can read job application records" on public.job_application_records;
create policy "Admins can read job application records"
on public.job_application_records
for select
to authenticated
using (
  exists (
    select 1
    from public.user_access access
    where access.user_id = (select auth.uid())
      and access.role = 'admin'
      and access.access_status = 'active'
  )
);
