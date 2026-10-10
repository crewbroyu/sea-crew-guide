-- Legacy tables created outside this repository (interview_records, profiles, task_progress, users)
-- are empty and unused by the application, yet still carried Supabase's default grants: anon and
-- authenticated could INSERT, UPDATE, DELETE, and TRUNCATE them, held back only by RLS policies.
-- Remove those write privileges. SELECT, the tables, and their data are left unchanged.
-- Tables that do not exist (for example in a fresh environment) are skipped. Safe to rerun.

begin;

do $$
declare
  legacy_table text;
begin
  foreach legacy_table in array array['interview_records', 'profiles', 'task_progress', 'users'] loop
    if to_regclass(format('public.%I', legacy_table)) is not null then
      execute format(
        'revoke insert, update, delete, truncate, references, trigger on table public.%I from public, anon, authenticated',
        legacy_table
      );
    end if;
  end loop;
end;
$$;

commit;

-- Verification: no row may show true. Missing tables are not listed.
select c.relname as table_name, r.role,
  has_any_column_privilege(r.role, c.oid, 'INSERT') as can_insert,
  has_any_column_privilege(r.role, c.oid, 'UPDATE') as can_update,
  has_table_privilege(r.role, c.oid, 'DELETE') as can_delete,
  has_table_privilege(r.role, c.oid, 'TRUNCATE') as can_truncate
from pg_class c
cross join (values ('anon'), ('authenticated')) as r(role)
where c.relnamespace = 'public'::regnamespace
  and c.relname in ('interview_records', 'profiles', 'task_progress', 'users')
order by c.relname, r.role;
