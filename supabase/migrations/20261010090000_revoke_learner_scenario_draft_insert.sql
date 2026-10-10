-- The server now creates the scenario draft together with the charged first turn, so learners no
-- longer insert scenario sessions. They keep updating their own draft's turns to resume later.
-- Apply only after the application release that rejects outdated scenario pages (CLIENT_OUTDATED)
-- is live; see SUPABASE_MIGRATION_ORDER.md.

begin;

-- Revoking the table privilege also removes the column-level INSERT grants from the earlier migration.
revoke insert on table public.scenario_training_sessions from authenticated;
drop policy if exists "Users can create own scenario drafts" on public.scenario_training_sessions;

commit;

-- Verification: authenticated must have no INSERT on any column and must keep UPDATE on turns only.
select
  has_any_column_privilege('authenticated', 'public.scenario_training_sessions', 'INSERT') as learner_can_insert,
  has_column_privilege('authenticated', 'public.scenario_training_sessions', 'turns', 'UPDATE') as learner_can_update_turns,
  has_column_privilege('authenticated', 'public.scenario_training_sessions', 'status', 'UPDATE') as learner_can_update_status;
