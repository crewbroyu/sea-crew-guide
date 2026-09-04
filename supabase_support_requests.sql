-- Run this in the Supabase SQL Editor before enabling the in-app support form.
-- Requests are private to the submitting user and active administrators.

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('account_access', 'ai_training', 'payment', 'bug', 'suggestion', 'other')),
  message text not null check (char_length(message) between 10 and 2000),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_requests_user_created_idx
  on public.support_requests (user_id, created_at desc);

create index if not exists support_requests_status_created_idx
  on public.support_requests (status, created_at desc);

alter table public.support_requests enable row level security;
revoke all on table public.support_requests from public, anon, authenticated;
grant select, insert on table public.support_requests to authenticated;

drop policy if exists "Users can read own support requests" on public.support_requests;
create policy "Users can read own support requests"
on public.support_requests
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own support requests" on public.support_requests;
create policy "Users can create own support requests"
on public.support_requests
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Admins can read support requests" on public.support_requests;
create policy "Admins can read support requests"
on public.support_requests
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
