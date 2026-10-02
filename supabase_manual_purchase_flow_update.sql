-- Tighten the existing manual-purchase RPC used by the paid conversion page.
-- Run once in Supabase SQL Editor after supabase_manual_purchase_requests.sql.

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

  if exists (
    select 1
    from public.user_entitlements
    where user_id = actor_user_id
      and product_code = selected_product.code
      and status = 'active'
      and (expires_at is null or expires_at > now())
  ) then
    raise exception 'Product already active';
  end if;

  select *
  into existing_request
  from public.manual_purchase_requests
  where user_id = actor_user_id
    and product_code = selected_product.code
    and status in ('requested', 'payment_confirmed', 'activation_sent')
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

