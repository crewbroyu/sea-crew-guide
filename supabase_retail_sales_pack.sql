-- Retail Sales Associate second-position beta product.
-- Run once in Supabase SQL Editor after supabase_products_and_entitlements.sql.

begin;

insert into public.products (
  code,
  name,
  product_type,
  price_cny,
  access_days,
  ai_feedback_quota,
  mock_interview_quota,
  is_active,
  metadata,
  updated_at
)
values (
  'retail_sales_pack',
  'Retail Sales Associate 单职位全流程包',
  'position_pack',
  null,
  180,
  120,
  10,
  true,
  jsonb_build_object(
    'position', 'retail',
    'beta', true,
    'public_sale', false,
    'includes', jsonb_build_array('foundation', 'scenarios', 'question_bank', 'ai_feedback', 'mock_interview')
  ),
  now()
)
on conflict (code) do update set
  name = excluded.name,
  product_type = excluded.product_type,
  access_days = excluded.access_days,
  ai_feedback_quota = excluded.ai_feedback_quota,
  mock_interview_quota = excluded.mock_interview_quota,
  is_active = excluded.is_active,
  metadata = excluded.metadata,
  updated_at = excluded.updated_at;

commit;

select code, name, price_cny, access_days, ai_feedback_quota, mock_interview_quota, is_active, metadata
from public.products
where code = 'retail_sales_pack';
