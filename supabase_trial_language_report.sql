-- Read-only Bar Server free trial funnel, split by the language the visitor used.
-- SELECT-only; safe to run in production. Returns one result set for the Supabase SQL editor.
--
-- Sections:
--   zh / en     visitors who opened /programs/bar-server/trial, followed through the trial
--   switches    visitors who used the language switcher, by direction
--
-- Columns:
--   actors           visitors who reached the stage (a visitor is one account, or one browser
--                    before sign-in; a browser that later signs in is merged into the account)
--   pct_of_opened    actors / visitors who opened the trial in that language
--   pct_of_previous  actors / actors of the previous stage
--
-- A visitor's language is the last one they used on the trial: the language of their latest
-- trial view, scenario completion or language switch. Events from before the bilingual pilot
-- carry no language, so the window starts at the pilot release (edit `params` to change).
-- Stages are reached at any time in the window, not necessarily in order; "查看付费页" counts any
-- visit to a product page by a trial visitor. Admin and mentor accounts are excluded.

with params as (
  select
    timestamptz '2026-10-29 09:50:00+00' as since,
    now() as until
),
staff as (
  select user_id from public.user_access where role <> 'member'
),
anon_links as (
  select distinct on (anonymous_id) anonymous_id, user_id
  from public.product_events
  where user_id is not null and anonymous_id is not null
  order by anonymous_id, created_at
),
events as (
  select
    coalesce(e.user_id, l.user_id) as user_id,
    coalesce(coalesce(e.user_id, l.user_id)::text, 'anon:' || e.anonymous_id) as actor,
    e.event_name,
    e.created_at as at,
    case
      when e.event_name = 'language_switched' then e.properties->>'to'
      when e.event_name in ('free_trial_viewed', 'free_trial_scenario_completed') then e.properties->>'language'
    end as language,
    e.properties->>'from' as switched_from
  from public.product_events e
  left join anon_links l on e.user_id is null and l.anonymous_id = e.anonymous_id
  cross join params p
  where e.created_at >= p.since and e.created_at < p.until
    and e.event_name in (
      'free_trial_viewed', 'free_trial_scenario_completed', 'free_trial_completed',
      'free_trial_report_viewed', 'free_trial_report_cta_clicked', 'product_page_viewed',
      'language_switched'
    )
    and (coalesce(e.user_id, l.user_id) is null or coalesce(e.user_id, l.user_id) not in (select user_id from staff))
),
visitors as (
  select
    actor,
    bool_or(user_id is not null) as signed_in,
    coalesce(
      (array_agg(language order by at desc) filter (where language in ('zh', 'en')))[1],
      'zh'
    ) as language,
    bool_or(event_name = 'free_trial_scenario_completed') as completed_one,
    bool_or(event_name = 'free_trial_completed') as completed_all,
    bool_or(event_name = 'free_trial_report_viewed') as viewed_report,
    bool_or(event_name = 'free_trial_report_cta_clicked') as clicked_report_cta,
    bool_or(event_name = 'product_page_viewed') as viewed_product_page
  from events
  group by actor
  having bool_or(event_name = 'free_trial_viewed')
),
stages as (
  select v.language as section, s.step, s.stage, s.reached
  from visitors v
  cross join lateral (values
    (1, '打开试用页', true),
    (2, '已登录', v.signed_in),
    (3, '完成至少 1 个场景', v.completed_one),
    (4, '完成全部 3 个场景', v.completed_all),
    (5, '查看完成报告', v.viewed_report),
    (6, '点击报告里的继续按钮', v.clicked_report_cta),
    (7, '查看付费页', v.viewed_product_page)
  ) as s(step, stage, reached)
),
stage_counts as (
  select section, step, stage, count(*) filter (where reached) as actors
  from stages
  group by section, step, stage
),
funnel as (
  select
    section,
    step,
    stage,
    actors,
    round(100.0 * actors / nullif(first_value(actors) over w, 0), 1) as pct_of_opened,
    case when step = 1 then null
      else round(100.0 * actors / nullif(lag(actors) over w, 0), 1) end as pct_of_previous
  from stage_counts
  window w as (partition by section order by step)
),
switches as (
  select
    'switches' as section,
    row_number() over (order by switched_from, language)::int as step,
    coalesce(switched_from, '?') || ' → ' || language as stage,
    count(distinct actor) as actors,
    null::numeric as pct_of_opened,
    null::numeric as pct_of_previous
  from events
  where event_name = 'language_switched'
  group by switched_from, language
)
select * from (
  select * from funnel
  union all
  select * from switches
) report
order by section = 'zh' desc, section = 'en' desc, section, step;
