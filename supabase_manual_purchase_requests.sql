-- Manual-payment queue for the initial paid-product test.
-- Run this AFTER supabase_products_and_entitlements.sql.

create table if not exists public.manual_purchase_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_email text not null,
  product_code text not null references public.products(code),
  price_cny numeric(10, 2) not null check (price_cny >= 0),
  reference_code text not null unique,
  status text not null default 'requested'
    check (status in ('requested', 'payment_confirmed', 'activation_sent', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  payment_confirmed_at timestamptz,
  activation_sent_at timestamptz
);

create index if not exists manual_purchase_requests_user_created_idx
  on public.manual_purchase_requests (user_id, created_at desc);

create index if not exists manual_purchase_requests_status_created_idx
  on public.manual_purchase_requests (status, created_at asc);

alter table public.manual_purchase_requests enable row level security;
revoke all on table public.manual_purchase_requests from public, anon, authenticated;
grant select, update on table public.manual_purchase_requests to authenticated;

drop policy if exists "Users can read own manual purchase requests" on public.manual_purchase_requests;
create policy "Users can read own manual purchase requests"
on public.manual_purchase_requests
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Admins can read manual purchase requests" on public.manual_purchase_requests;
create policy "Admins can read manual purchase requests"
on public.manual_purchase_requests
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

drop policy if exists "Admins can update manual purchase requests" on public.manual_purchase_requests;
create policy "Admins can update manual purchase requests"
on public.manual_purchase_requests
for update
to authenticated
using (
  exists (
    select 1
    from public.user_access access
    where access.user_id = (select auth.uid())
      and access.role = 'admin'
      and access.access_status = 'active'
  )
)
with check (
  exists (
    select 1
    from public.user_access access
    where access.user_id = (select auth.uid())
      and access.role = 'admin'
      and access.access_status = 'active'
  )
);

create or replace function public.create_manual_purchase_request(input_product_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := auth.uid();
  actor_email text := coalesce(auth.jwt() ->> 'email', '');
  selected_product public.products%rowtype;
  existing_request public.manual_purchase_requests%rowtype;
  created_request public.manual_purchase_requests%rowtype;
begin
  if actor_user_id is null then
    raise exception 'Login required';
  end if;

  select *
  into selected_product
  from public.products
  where code = trim(input_product_code)
    and is_active = true;

  if selected_product.code is null then
    raise exception 'Product unavailable';
  end if;

  select *
  into existing_request
  from public.manual_purchase_requests
  where user_id = actor_user_id
    and product_code = selected_product.code
    and status in ('requested', 'payment_confirmed')
  order by created_at desc
  limit 1;

  if existing_request.id is not null then
    return jsonb_build_object(
      'id', existing_request.id,
      'reference_code', existing_request.reference_code,
      'product_code', existing_request.product_code,
      'price_cny', existing_request.price_cny,
      'status', existing_request.status,
      'created_at', existing_request.created_at,
      'existing', true
    );
  end if;

  insert into public.manual_purchase_requests (
    user_id,
    contact_email,
    product_code,
    price_cny,
    reference_code
  )
  values (
    actor_user_id,
    actor_email,
    selected_product.code,
    selected_product.price_cny,
    'CPG-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  )
  returning * into created_request;

  return jsonb_build_object(
    'id', created_request.id,
    'reference_code', created_request.reference_code,
    'product_code', created_request.product_code,
    'price_cny', created_request.price_cny,
    'status', created_request.status,
    'created_at', created_request.created_at,
    'existing', false
  );
end;
$$;

revoke all on function public.create_manual_purchase_request(text) from public, anon;
grant execute on function public.create_manual_purchase_request(text) to authenticated;
