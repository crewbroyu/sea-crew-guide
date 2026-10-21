-- Read-only per-user detail for everyone counted as paid in supabase_funnel_report.sql.
-- SELECT-only; safe to run in production. Shows emails, so keep the output private.
--
-- One row per user and product. "Paid" uses the funnel report's definition: an entitlement from
-- payment or an activation code, or a manual purchase request marked payment_confirmed /
-- activation_sent. Founder, admin and migration grants and staff accounts are left out.
--
-- Usage counts only what happened after the product was opened:
--   scenario_sessions / distinct_scenarios  completed scenarios for the pack's job (bar/retail)
--   interview_practices                     mock interview records (any product)
--   ai_calls                                successful AI requests charged to this product
-- last_active is the latest of sign-in, tracked events, scenario sessions and interviews.

with staff as (
  select user_id from public.user_access where role <> 'member'
),
paid_all as (
  select e.user_id, e.product_code, e.starts_at as at, e.source, e.source_reference,
    e.status, e.expires_at
  from public.user_entitlements e
  where e.source in ('payment', 'activation_code')
  union all
  select r.user_id, r.product_code, coalesce(r.payment_confirmed_at, r.updated_at),
    'manual_purchase', r.reference_code, r.status, null
  from public.manual_purchase_requests r
  where r.status in ('payment_confirmed', 'activation_sent')
),
paid as (
  select
    user_id,
    product_code,
    min(at) as paid_at,
    string_agg(distinct source, ' + ') as sources,
    max(source_reference) filter (where source = 'activation_code') as activation_code,
    max(source_reference) filter (where source = 'manual_purchase') as purchase_reference,
    max(status) filter (where source <> 'manual_purchase') as entitlement_status,
    max(expires_at) as expires_at
  from paid_all
  where user_id not in (select user_id from staff)
  group by user_id, product_code
)
select
  u.email,
  pd.product_code,
  pd.sources as 开通方式,
  pd.activation_code as 激活码,
  code.type as 激活码类型,
  pd.purchase_reference as 购买单号,
  u.created_at as 注册时间,
  pd.paid_at as 开通时间,
  pd.entitlement_status as 权益状态,
  pd.expires_at as 到期时间,
  usage.scenario_sessions,
  usage.distinct_scenarios,
  usage.interview_practices,
  usage.ai_calls,
  greatest(u.last_sign_in_at, activity.last_event, activity.last_session, activity.last_interview)
    as 最后活跃时间,
  pd.user_id
from paid pd
join auth.users u on u.id = pd.user_id
left join public.activation_codes code on code.code = pd.activation_code
left join (values ('bar_server_pack', 'bar_server'), ('retail_sales_pack', 'retail'))
  as pk(product_code, job_key) on pk.product_code = pd.product_code
cross join lateral (
  select
    (select count(*) from public.scenario_training_sessions s
      where s.user_id = pd.user_id and s.status = 'completed' and s.job_key = pk.job_key
        and coalesce(s.completed_at, s.created_at) >= pd.paid_at) as scenario_sessions,
    (select count(distinct s.scenario_id) from public.scenario_training_sessions s
      where s.user_id = pd.user_id and s.status = 'completed' and s.job_key = pk.job_key
        and coalesce(s.completed_at, s.created_at) >= pd.paid_at) as distinct_scenarios,
    (select count(*) from public.interview_practice_records r
      where r.user_id = pd.user_id and r.created_at >= pd.paid_at) as interview_practices,
    (select count(*) from public.ai_usage_events a
      where a.user_id = pd.user_id and a.product_code = pd.product_code and a.success
        and a.created_at >= pd.paid_at) as ai_calls
) usage
cross join lateral (
  select
    (select max(created_at) from public.product_events e where e.user_id = pd.user_id) as last_event,
    (select max(coalesce(completed_at, created_at)) from public.scenario_training_sessions s
      where s.user_id = pd.user_id) as last_session,
    (select max(created_at) from public.interview_practice_records r
      where r.user_id = pd.user_id) as last_interview
) activity
order by pd.paid_at desc, u.email;
