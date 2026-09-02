-- Lightweight first-party funnel events for product validation.

create table if not exists public.product_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  anonymous_id text,
  event_name text not null,
  route text,
  product_code text references public.products(code),
  properties jsonb not null default '{}'::jsonb check (jsonb_typeof(properties) = 'object'),
  created_at timestamptz not null default now(),
  check (user_id is not null or anonymous_id is not null)
);

create index if not exists product_events_funnel_idx
  on public.product_events (product_code, event_name, created_at desc);
create index if not exists product_events_user_idx
  on public.product_events (user_id, created_at desc);

alter table public.product_events enable row level security;
revoke all on table public.product_events from public, anon, authenticated;
grant insert on table public.product_events to anon, authenticated;
grant select on table public.product_events to authenticated;

drop policy if exists "Visitors can record product events" on public.product_events;
create policy "Visitors can record product events"
on public.product_events
for insert
to anon, authenticated
with check (
  ((select auth.uid()) is null and user_id is null and anonymous_id is not null)
  or ((select auth.uid()) is not null and user_id = (select auth.uid()))
);

drop policy if exists "Admins can read product events" on public.product_events;
create policy "Admins can read product events"
on public.product_events
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
