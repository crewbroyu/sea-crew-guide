-- Run once after supabase_scenario_training.sql.
-- Adds resumable drafts for paid scenario training while preserving own-row RLS.

alter table public.scenario_training_sessions
  drop constraint if exists scenario_training_sessions_status_check;

alter table public.scenario_training_sessions
  add constraint scenario_training_sessions_status_check
  check (status in ('in_progress', 'completed', 'abandoned'));

grant update on table public.scenario_training_sessions to authenticated;

drop policy if exists "Users can update own scenario sessions" on public.scenario_training_sessions;
create policy "Users can update own scenario sessions"
on public.scenario_training_sessions for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create index if not exists scenario_training_sessions_user_job_draft_idx
  on public.scenario_training_sessions (user_id, job_key, created_at desc)
  where status = 'in_progress';
