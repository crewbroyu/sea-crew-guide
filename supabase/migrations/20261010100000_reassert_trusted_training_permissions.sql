-- Reassert the trusted-training permissions from 20261008090000 without undoing 20261010090000.
-- Production still had the original learner write access (whole-table UPDATE on scenario sessions
-- with an owner-only policy, and INSERT/UPDATE on job skill profiles), so learners could rewrite
-- their own completed scores and readiness profile. Safe to rerun; changes permissions only.

begin;

-- scenario_training_sessions: learners update only the turns of their own unfinished draft.
-- Revoking the table privilege also removes any column-level UPDATE grants before re-granting turns.
revoke update on table public.scenario_training_sessions from authenticated;
grant update (turns) on table public.scenario_training_sessions to authenticated;
drop policy if exists "Users can insert own scenario sessions" on public.scenario_training_sessions;
drop policy if exists "Users can create own scenario drafts" on public.scenario_training_sessions;
drop policy if exists "Users can update own scenario sessions" on public.scenario_training_sessions;
drop policy if exists "Users can update own scenario draft turns" on public.scenario_training_sessions;
create policy "Users can update own scenario draft turns"
on public.scenario_training_sessions for update to authenticated
using ((select auth.uid()) = user_id and status = 'in_progress')
with check ((select auth.uid()) = user_id and status = 'in_progress');

-- user_job_skill_profiles: written only by the server (complete_scenario_with_unified_profile).
revoke insert, update, delete on table public.user_job_skill_profiles from authenticated;
drop policy if exists "Users can insert own job skill profile" on public.user_job_skill_profiles;
drop policy if exists "Users can update own job skill profile" on public.user_job_skill_profiles;

commit;

-- Verification: every value must be false except learner_can_update_turns.
select
  has_any_column_privilege('authenticated', 'public.scenario_training_sessions', 'INSERT') as learner_can_insert_session,
  has_column_privilege('authenticated', 'public.scenario_training_sessions', 'turns', 'UPDATE') as learner_can_update_turns,
  has_column_privilege('authenticated', 'public.scenario_training_sessions', 'status', 'UPDATE') as learner_can_update_status,
  has_column_privilege('authenticated', 'public.scenario_training_sessions', 'overall_readiness', 'UPDATE') as learner_can_update_score,
  has_any_column_privilege('authenticated', 'public.user_job_skill_profiles', 'INSERT') as learner_can_insert_profile,
  has_any_column_privilege('authenticated', 'public.user_job_skill_profiles', 'UPDATE') as learner_can_update_profile;
