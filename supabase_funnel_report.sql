-- Read-only conversion funnel: registration -> free trial -> paywall -> purchase request -> paid
-- -> started paid content -> completed paid content. SELECT-only; safe to run in production.
-- Returns one result set so the Supabase SQL editor shows everything at once.
--
-- Section "overall": members who registered inside the window, followed through every stage.
-- Section "<product_code>": users who paid for that product inside the window.
--
-- users            people who reached the stage (some skip earlier stages, e.g. an offline payer
--                  who was handed an activation code never views the paywall)
-- continued        people who reached the stage AND the stage before it
-- pct_continued    continued / users of the previous stage
-- median_days      median days from the previous stage to this one, among `continued`
--
-- Definitions (edit `params` to change):
--   paid       entitlement from payment (and activation codes unless disabled), or a manual
--              purchase request marked payment_confirmed / activation_sent. Founder, admin and
--              migration grants are not paid.
--   started    bar/retail pack: a completed scenario session after paying;
--              interview pack: a mock interview record after paying.
--   completed  bar/retail pack: every scenario of that job completed at least once (any time);
--              interview pack: `interview_practices_to_complete` mock interviews after paying.
-- Admin and mentor accounts are excluded.

with params as (
  select
    now() - interval '90 days' as since,
    now() as until,
    true as count_activation_codes_as_paid,
    8 as scenarios_per_pack,
    3 as interview_practices_to_complete
),
staff as (
  select user_id from public.user_access where role <> 'member'
),
cohort as (
  select u.id as user_id, u.created_at as registered_at
  from auth.users u, params p
  where u.created_at >= p.since and u.created_at < p.until
    and u.id not in (select user_id from staff)
),
anon_links as (
  select distinct on (anonymous_id) anonymous_id, user_id
  from public.product_events
  where user_id is not null and anonymous_id is not null
  order by anonymous_id, created_at
),
events as (
  select coalesce(e.user_id, l.user_id) as user_id, e.event_name, e.created_at as at
  from public.product_events e
  left join anon_links l on e.user_id is null and l.anonymous_id = e.anonymous_id
  where coalesce(e.user_id, l.user_id) is not null
),
free_activity as (
  select user_id, at from events
  where event_name in ('assessment_completed', 'free_trial_scenario_completed', 'career_report_generated')
  union all
  select user_id, coalesce(completed_at, created_at) from public.scenario_training_sessions
  where status = 'completed'
  union all
  select user_id, created_at from public.interview_practice_records
),
paywall as (
  select user_id, at from events
  where event_name in (
    'product_page_viewed', 'paywall_reached', 'reference_answer_paywall_clicked',
    'purchase_cta_clicked', 'activation_cta_clicked', 'free_trial_report_cta_clicked'
  )
),
purchase_requests as (
  select user_id, created_at as at from public.manual_purchase_requests where status <> 'cancelled'
  union all
  select user_id, at from events where event_name = 'manual_purchase_requested'
),
paid_all as (
  select e.user_id, e.product_code, e.starts_at as at
  from public.user_entitlements e, params p
  where e.source = 'payment'
     or (e.source = 'activation_code' and p.count_activation_codes_as_paid)
  union all
  select user_id, product_code, coalesce(payment_confirmed_at, updated_at)
  from public.manual_purchase_requests
  where status in ('payment_confirmed', 'activation_sent')
),
paid as (
  select user_id, product_code, min(at) as paid_at
  from paid_all
  where user_id not in (select user_id from staff)
  group by user_id, product_code
),
-- First completion of each scenario per user and job.
scenario_firsts as (
  select user_id, job_key, scenario_id, min(coalesce(completed_at, created_at)) as at
  from public.scenario_training_sessions
  where status = 'completed'
  group by user_id, job_key, scenario_id
),
product_progress as (
  select
    pd.user_id,
    pd.product_code,
    pd.paid_at,
    case
      when pd.product_code = 'interview_practice_pack' then (
        select min(r.created_at) from public.interview_practice_records r
        where r.user_id = pd.user_id and r.created_at >= pd.paid_at)
      else (
        select min(coalesce(s.completed_at, s.created_at)) from public.scenario_training_sessions s
        where s.user_id = pd.user_id and s.status = 'completed'
          and s.job_key = pk.job_key and coalesce(s.completed_at, s.created_at) >= pd.paid_at)
    end as started_at,
    case
      when pd.product_code = 'interview_practice_pack' then (
        select r.created_at from public.interview_practice_records r
        where r.user_id = pd.user_id and r.created_at >= pd.paid_at
        order by r.created_at offset (p.interview_practices_to_complete - 1) limit 1)
      else (
        select f.at from scenario_firsts f
        where f.user_id = pd.user_id and f.job_key = pk.job_key
        order by f.at offset (p.scenarios_per_pack - 1) limit 1)
    end as completed_at
  from paid pd
  cross join params p
  left join (values ('bar_server_pack', 'bar_server'), ('retail_sales_pack', 'retail'))
    as pk(product_code, job_key) on pk.product_code = pd.product_code
),
overall as (
  select
    c.user_id,
    c.registered_at as s1,
    (select min(at) from free_activity f where f.user_id = c.user_id) as s2,
    (select min(at) from paywall w where w.user_id = c.user_id) as s3,
    (select min(at) from purchase_requests r where r.user_id = c.user_id) as s4,
    (select min(paid_at) from paid pd where pd.user_id = c.user_id) as s5,
    (select min(started_at) from product_progress pp where pp.user_id = c.user_id) as s6,
    (select min(greatest(completed_at, paid_at)) filter (where completed_at is not null)
      from product_progress pp where pp.user_id = c.user_id) as s7
  from cohort c
),
overall_stages as (
  select 'overall' as section, s.step, s.stage, s.at, s.prev_at
  from overall o
  cross join lateral (values
    (1, '注册', o.s1, null::timestamptz),
    (2, '免费体验（测评/场景/面试）', o.s2, o.s1),
    (3, '查看付费页或点购买', o.s3, o.s2),
    (4, '提交开通申请', o.s4, o.s3),
    (5, '付费开通', o.s5, o.s4),
    (6, '开始使用付费内容', o.s6, o.s5),
    (7, '完成付费内容', o.s7, o.s6)
  ) as s(step, stage, at, prev_at)
),
product_stages as (
  select pp.product_code as section, s.step, s.stage, s.at, s.prev_at
  from product_progress pp
  cross join params p
  cross join lateral (values
    (1, '付费开通', pp.paid_at, null::timestamptz),
    (2, '开始使用', pp.started_at, pp.paid_at),
    (3, '完成', case when pp.completed_at is not null then greatest(pp.completed_at, pp.paid_at) end, pp.started_at)
  ) as s(step, stage, at, prev_at)
  where pp.paid_at >= p.since and pp.paid_at < p.until
),
stages as (
  select * from overall_stages
  union all
  select * from product_stages
),
summary as (
  select
    section,
    step,
    stage,
    count(*) filter (where at is not null) as users,
    count(*) filter (where at is not null and prev_at is not null) as continued,
    count(*) filter (where prev_at is not null) as previous_users,
    round((percentile_cont(0.5) within group (order by extract(epoch from (at - prev_at)) / 86400)
      filter (where at is not null and prev_at is not null and at >= prev_at))::numeric, 1) as median_days
  from stages
  group by section, step, stage
)
select
  section,
  step,
  stage,
  users,
  case when step = 1 then null else continued end as continued,
  case when step = 1 or previous_users = 0 then null
    else round(100.0 * continued / previous_users, 1) end as pct_continued,
  median_days
from summary
order by section = 'overall' desc, section, step;
