# Supabase production migration order

The root SQL files before `supabase_retail_ai_quota_support.sql` are historical baselines. Do not rerun an older baseline against production merely because its file changed locally: several of them replace functions with the schema that existed at that point in development.

For the current production database, apply only new forward migrations in this order:

1. `supabase_retail_sales_pack.sql` if the Retail product and entitlement tables have not been installed.
2. `supabase_retail_ai_quota_support.sql` to allow atomic Retail AI reservations while keeping the free trial Bar-only.
3. `supabase_ai_observability_and_career_guard.sql` to add AI health telemetry and atomic one-report-per-account reservations.
4. Run `supabase_production_verification.sql`. It is SELECT-only and may be rerun after every deployment.

Application code may be deployed after steps 2 and 3. Before those migrations are applied, Retail AI and new career-report generation intentionally fail closed rather than bypassing quota controls.
