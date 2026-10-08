-- Keep learner-owned resumable drafts while making scores and capability profiles server-write-only.
-- Apply after supabase_scenario_training.sql and supabase_scenario_training_resume.sql.

begin;

revoke insert, update on table public.scenario_training_sessions from authenticated;
grant insert (
  user_id,
  job_key,
  scenario_id,
  difficulty,
  scenario_context,
  turns,
  status
) on table public.scenario_training_sessions to authenticated;
grant update (turns) on table public.scenario_training_sessions to authenticated;

drop policy if exists "Users can insert own scenario sessions" on public.scenario_training_sessions;
create policy "Users can create own scenario drafts"
on public.scenario_training_sessions for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and status = 'in_progress'
  and overall_readiness = 0
  and skill_scores = '{}'::jsonb
  and strengths = '[]'::jsonb
  and weaknesses = '[]'::jsonb
  and critical_mistakes = '[]'::jsonb
  and better_response is null
  and next_recommendation is null
  and completed_at is null
);

drop policy if exists "Users can update own scenario sessions" on public.scenario_training_sessions;
create policy "Users can update own scenario draft turns"
on public.scenario_training_sessions for update to authenticated
using ((select auth.uid()) = user_id and status = 'in_progress')
with check ((select auth.uid()) = user_id and status = 'in_progress');

revoke insert, update on table public.user_job_skill_profiles from authenticated;
drop policy if exists "Users can insert own job skill profile" on public.user_job_skill_profiles;
drop policy if exists "Users can update own job skill profile" on public.user_job_skill_profiles;

commit;

-- Verification: authenticated keeps SELECT on both tables, draft-only column writes on
-- scenario_training_sessions, and no direct write privilege on user_job_skill_profiles.
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('scenario_training_sessions', 'user_job_skill_profiles')
  and grantee = 'authenticated'
order by table_name, privilege_type;

select grantee, table_name, column_name, privilege_type
from information_schema.role_column_grants
where table_schema = 'public'
  and table_name = 'scenario_training_sessions'
  and grantee = 'authenticated'
order by privilege_type, column_name;
