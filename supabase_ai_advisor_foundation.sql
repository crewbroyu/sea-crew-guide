-- AI Crew Yuge: reusable, privacy-aware consultation data foundation.
-- Run this after supabase_career_reports.sql.

create table if not exists public.ai_advisor_consultations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('career_report', 'chat', 'task_context', 'human_import')),
  framework_version text not null,
  model text,
  profile_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(profile_snapshot) = 'object'),
  assessment_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(assessment_snapshot) = 'object'),
  status text not null default 'completed' check (status in ('active', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_advisor_consultations_user_created_idx
  on public.ai_advisor_consultations (user_id, created_at desc);

create table if not exists public.ai_advisor_messages (
  id bigint generated always as identity primary key,
  consultation_id uuid not null references public.ai_advisor_consultations(id) on delete cascade,
  sender text not null check (sender in ('user', 'assistant', 'system', 'human_reviewer')),
  content text not null check (char_length(content) <= 6000),
  content_type text not null default 'text' check (content_type in ('text', 'structured_report', 'system_note')),
  created_at timestamptz not null default now()
);

create index if not exists ai_advisor_messages_consultation_idx
  on public.ai_advisor_messages (consultation_id, created_at);

create table if not exists public.ai_advisor_case_signals (
  consultation_id uuid primary key references public.ai_advisor_consultations(id) on delete cascade,
  intent_tags text[] not null default '{}',
  decision_stage text,
  confidence text check (confidence in ('high', 'medium', 'low')),
  missing_information text[] not null default '{}',
  risk_flags text[] not null default '{}',
  user_replied_after boolean,
  user_follow_up_count integer not null default 0 check (user_follow_up_count >= 0),
  user_marked_helpful boolean,
  human_quality_score smallint check (human_quality_score between 1 and 5),
  human_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_advisor_events (
  id bigint generated always as identity primary key,
  consultation_id uuid references public.ai_advisor_consultations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('report_generated', 'position_confirmed', 'route_confirmed', 'task_started', 'task_completed', 'feedback_submitted')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists ai_advisor_events_user_type_idx
  on public.ai_advisor_events (user_id, event_type, created_at desc);

-- This table is browser-inaccessible by design. Use it later for reviewed,
-- source-tagged industry knowledge and anonymized human consultation patterns.
create table if not exists public.ai_advisor_knowledge_items (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  cruise_line text,
  department text,
  position text,
  statement text not null,
  applicable_scope text,
  exceptions text,
  source_type text not null check (source_type in ('official', 'verified_experience', 'anonymized_case', 'human_judgment')),
  source_reference text,
  confidence text not null check (confidence in ('high', 'medium', 'low')),
  last_verified date,
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_advisor_knowledge_lookup_idx
  on public.ai_advisor_knowledge_items (topic, cruise_line, department, position, status);

alter table public.ai_advisor_consultations enable row level security;
alter table public.ai_advisor_messages enable row level security;
alter table public.ai_advisor_case_signals enable row level security;
alter table public.ai_advisor_events enable row level security;
alter table public.ai_advisor_knowledge_items enable row level security;

revoke all on table public.ai_advisor_consultations from public, anon, authenticated;
revoke all on table public.ai_advisor_messages from public, anon, authenticated;
revoke all on table public.ai_advisor_case_signals from public, anon, authenticated;
revoke all on table public.ai_advisor_events from public, anon, authenticated;
revoke all on table public.ai_advisor_knowledge_items from public, anon, authenticated;

grant select on table public.ai_advisor_consultations to authenticated;
grant select on table public.ai_advisor_messages to authenticated;
grant select on table public.ai_advisor_case_signals to authenticated;
grant select on table public.ai_advisor_events to authenticated;

create policy "Users can read own AI advisor consultations"
on public.ai_advisor_consultations for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read own AI advisor messages"
on public.ai_advisor_messages for select to authenticated
using (exists (
  select 1 from public.ai_advisor_consultations consultation
  where consultation.id = consultation_id and consultation.user_id = (select auth.uid())
));

create policy "Users can read own AI advisor signals"
on public.ai_advisor_case_signals for select to authenticated
using (exists (
  select 1 from public.ai_advisor_consultations consultation
  where consultation.id = consultation_id and consultation.user_id = (select auth.uid())
));

create policy "Users can read own AI advisor events"
on public.ai_advisor_events for select to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.save_ai_advisor_career_report(
  input_profile jsonb,
  input_assessment jsonb,
  input_report jsonb,
  input_model text default null,
  input_intent_tags text[] default '{}',
  input_decision_stage text default null,
  input_confidence text default null,
  input_missing_information text[] default '{}',
  input_risk_flags text[] default '{}',
  input_framework_version text default 'unknown'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := auth.uid();
  consultation_id uuid;
  report_id uuid;
begin
  if actor_user_id is null then
    raise exception 'Login required';
  end if;

  if jsonb_typeof(input_profile) <> 'object'
    or jsonb_typeof(input_assessment) <> 'object'
    or jsonb_typeof(input_report) <> 'object' then
    raise exception 'Invalid report payload';
  end if;

  insert into public.ai_advisor_consultations (
    user_id, source, framework_version, model, profile_snapshot, assessment_snapshot
  ) values (
    actor_user_id, 'career_report', left(input_framework_version, 80), left(input_model, 120), input_profile, input_assessment
  ) returning id into consultation_id;

  insert into public.ai_advisor_case_signals (
    consultation_id, intent_tags, decision_stage, confidence, missing_information, risk_flags
  ) values (
    consultation_id,
    coalesce(input_intent_tags, '{}'),
    nullif(left(input_decision_stage, 80), ''),
    case when input_confidence in ('high', 'medium', 'low') then input_confidence else null end,
    coalesce(input_missing_information, '{}'),
    coalesce(input_risk_flags, '{}')
  );

  insert into public.ai_advisor_messages (consultation_id, sender, content, content_type)
  values (consultation_id, 'assistant', left(input_report::text, 6000), 'structured_report');

  insert into public.ai_advisor_events (consultation_id, user_id, event_type, metadata)
  values (consultation_id, actor_user_id, 'report_generated', jsonb_build_object('framework_version', input_framework_version));

  insert into public.career_reports (user_id, profile, assessment_snapshot, report, model)
  values (actor_user_id, input_profile, input_assessment, input_report, left(input_model, 120))
  returning id into report_id;

  return jsonb_build_object('consultation_id', consultation_id, 'report_id', report_id);
end;
$$;

revoke all on function public.save_ai_advisor_career_report(jsonb, jsonb, jsonb, text, text[], text, text, text[], text[], text)
  from public, anon;
grant execute on function public.save_ai_advisor_career_report(jsonb, jsonb, jsonb, text, text[], text, text, text[], text[], text)
  to authenticated;
