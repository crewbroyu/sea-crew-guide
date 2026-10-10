# Supabase production migration order

The root SQL files before `supabase_retail_ai_quota_support.sql` are historical baselines. Do not rerun an older baseline against production merely because its file changed locally: several of them replace functions with the schema that existed at that point in development.

For the current production database, apply only new forward migrations in this order:

1. `supabase_retail_sales_pack.sql` if the Retail product and entitlement tables have not been installed.
2. `supabase_retail_ai_quota_support.sql` to allow atomic Retail AI reservations while keeping the free trial Bar-only.
3. `supabase_ai_observability_and_career_guard.sql` to add AI health telemetry and atomic one-report-per-account reservations.
4. `supabase_assessment_attempt_limits.sql` to enforce three completed career assessments per account and bind every assessment AI call to a two-hour database session.
5. `supabase_assessment_result_recovery.sql` to restore a completed practical score after a lost response without calling AI or charging again.
6. `supabase/migrations/20261008090000_trusted_training_results.sql` to keep resumable scenario drafts client-owned while making completed scores and capability profiles server-write-only.
7. `supabase/migrations/20261008150000_unified_skill_profiles.sql` to add server-written cross-module capability evidence and aggregated profiles for assessment, scenario, and mock-interview results.
8. `supabase/migrations/20261008160000_normalize_skill_confidence.sql` to ensure confidence reflects repeated evidence rather than a single high-weight event.
9. `supabase/migrations/20261008170000_atomic_unified_skill_profiles.sql` to serialize concurrent evidence writes, atomically complete scenario scoring, and count distinct training events.
10. Run `supabase_production_verification.sql`. It is SELECT-only and may be rerun after every deployment.
11. `supabase/migrations/20261010090000_revoke_learner_scenario_draft_insert.sql` to stop learners inserting scenario sessions; the server creates the first-turn draft. **Apply this step only after the application release that returns `CLIENT_OUTDATED` to outdated scenario pages is live.** It is the one step that follows the code deploy instead of preceding it: an older release still inserts drafts from the browser and would fail after the first turn was already charged. The current release works both before and after this step. Rerun step 10 afterwards.

Application code may be deployed only after steps 2 through 9 have been applied (step 1 only when Retail is not yet installed). Step 9 is required, not optional: it creates `upsert_unified_skill_evidence` and `complete_scenario_with_unified_profile`, which the server calls on every scored assessment, scenario, and mock interview. Before those migrations are applied, Retail AI, new career-report generation, practical assessment AI, trusted scenario persistence, and unified capability persistence intentionally fail closed rather than bypassing quota or score-integrity controls; without step 9 specifically, practical assessment scoring and scenario completion return errors and mock-interview results are still returned but flagged `unifiedProfileSyncPending`.

After step 10, every row of the `has_function_privilege` query must show `ok = true`. The final learner draft privilege query shows `ok = true` only after step 11. A `false` row means a migration is missing or a grant has drifted: the two unified-profile RPCs must be callable only by `service_role`, and no RPC may be callable by `anon`.

## Partner workspace (additive pilot)

See PARTNER_WORKSPACE.md before applying supabase/migrations/20261004034103_partner_workspace.sql. This migration is independent of the historical product/AI baselines above; it requires the existing user_access, mentor_profiles and user_path_profiles tables. Do not replay old baseline files. The new UI fails closed until its RPC is installed.

Apply `supabase/migrations/20261004035617_partner_directory_and_invites.sql` after the partner workspace migration for admin account search and personal pending-invite counts. The account directory is admin-only; it is not exposed to partner roles.

Then apply `supabase/migrations/20261004105657_partner_service_tasks.sql` for service scheduling and learner-confirmed delivery. This is not a billing or settlement migration.
