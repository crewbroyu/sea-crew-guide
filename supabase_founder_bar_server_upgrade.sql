-- One-time founder upgrade for the first paid product.
-- Run this AFTER supabase_products_and_entitlements.sql.
-- It gives each existing legacy premium member a Bar Server pack for 365 days,
-- without converting the offer into a permanent all-products membership.

begin;

insert into public.user_entitlements (
  user_id,
  product_code,
  status,
  starts_at,
  expires_at,
  ai_feedback_limit,
  mock_interview_limit,
  source,
  source_reference,
  updated_at
)
select
  access.user_id,
  'bar_server_pack',
  'active',
  now(),
  now() + interval '365 days',
  120,
  10,
  'founder',
  'founder_upgrade_2026',
  now()
from public.user_access access
where access.access_status = 'active'
  and (access.unlocked = true or access.plan = 'premium')
  and coalesce(access.role, 'member') <> 'admin'
on conflict (user_id, product_code)
do update set
  status = 'active',
  starts_at = excluded.starts_at,
  expires_at = excluded.expires_at,
  ai_feedback_limit = excluded.ai_feedback_limit,
  mock_interview_limit = excluded.mock_interview_limit,
  source_reference = excluded.source_reference,
  updated_at = excluded.updated_at
where public.user_entitlements.source = 'founder';

commit;

-- Review the upgraded cohort after the transaction completes.
select
  entitlement.user_id,
  entitlement.product_code,
  entitlement.status,
  entitlement.starts_at,
  entitlement.expires_at,
  entitlement.ai_feedback_limit,
  entitlement.mock_interview_limit,
  entitlement.source_reference
from public.user_entitlements entitlement
where entitlement.product_code = 'bar_server_pack'
  and entitlement.source = 'founder'
order by entitlement.created_at desc;
