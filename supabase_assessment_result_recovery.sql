-- Add idempotent recovery for a completed practical assessment evaluation.
-- Apply after supabase_assessment_attempt_limits.sql.

begin;

create or replace function private.get_assessment_evaluation_result(
  input_attempt_id uuid,
  input_request_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := auth.uid();
  normalized_request_id text := nullif(left(trim(coalesce(input_request_id, '')), 200), '');
  target_attempt public.assessment_attempts%rowtype;
begin
  if actor_user_id is null then
    raise exception 'LOGIN_REQUIRED';
  end if;

  if input_attempt_id is null or normalized_request_id is null then
    raise exception 'ASSESSMENT_ATTEMPT_REQUIRED';
  end if;

  select *
  into target_attempt
  from public.assessment_attempts
  where id = input_attempt_id
    and user_id = actor_user_id;

  if target_attempt.id is null then
    raise exception 'ASSESSMENT_ATTEMPT_NOT_FOUND';
  end if;

  if target_attempt.status <> 'completed'
    or target_attempt.result_summary ->> 'requestId' is distinct from normalized_request_id
    or jsonb_typeof(target_attempt.result_summary -> 'evaluation') is distinct from 'object'
    or not exists (
      select 1
      from public.assessment_attempt_actions
      where attempt_id = input_attempt_id
        and user_id = actor_user_id
        and action = 'assessment_evaluate'
        and request_id = normalized_request_id
    ) then
    return null;
  end if;

  return target_attempt.result_summary -> 'evaluation';
end;
$$;

create or replace function public.get_assessment_evaluation_result(
  input_attempt_id uuid,
  input_request_id text
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.get_assessment_evaluation_result(input_attempt_id, input_request_id);
$$;

revoke all on function private.get_assessment_evaluation_result(uuid, text) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.get_assessment_evaluation_result(uuid, text) to authenticated;

revoke all on function public.get_assessment_evaluation_result(uuid, text) from public, anon;
grant execute on function public.get_assessment_evaluation_result(uuid, text) to authenticated;

commit;

select routine_schema, routine_name, security_type
from information_schema.routines
where routine_schema in ('private', 'public')
  and routine_name = 'get_assessment_evaluation_result'
order by routine_schema;
