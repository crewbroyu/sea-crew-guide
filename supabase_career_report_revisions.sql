-- Allow one initial AI career report plus one user-requested revision.
-- Run this in Supabase SQL Editor after supabase_ai_observability_and_career_guard.sql.

create or replace function public.reserve_career_report_generation(input_request_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := auth.uid();
  normalized_request_id text := nullif(left(trim(coalesce(input_request_id, '')), 200), '');
  existing_reservation public.career_report_reservations%rowtype;
  completed_report_count integer;
begin
  if actor_user_id is null then raise exception 'LOGIN_REQUIRED'; end if;
  if normalized_request_id is null then raise exception 'REQUEST_ID_REQUIRED'; end if;

  perform pg_advisory_xact_lock(hashtextextended(actor_user_id::text || ':career-report', 0));

  select count(*) into completed_report_count
  from public.career_reports
  where user_id = actor_user_id;

  if completed_report_count >= 2 then
    raise exception 'CAREER_REPORT_LIMIT_REACHED';
  end if;

  select * into existing_reservation
  from public.career_report_reservations
  where user_id = actor_user_id;

  if existing_reservation.status = 'reserved'
    and existing_reservation.updated_at >= now() - interval '3 minutes' then
    raise exception 'CAREER_REPORT_IN_PROGRESS';
  end if;

  insert into public.career_report_reservations (user_id, request_id, status)
  values (actor_user_id, normalized_request_id, 'reserved')
  on conflict (user_id) do update set
    request_id = excluded.request_id,
    status = 'reserved',
    updated_at = now()
  returning * into existing_reservation;

  return jsonb_build_object(
    'reservation_id', existing_reservation.id,
    'generation_number', completed_report_count + 1,
    'generation_limit', 2
  );
end;
$$;

revoke all on function public.reserve_career_report_generation(text) from public, anon;
grant execute on function public.reserve_career_report_generation(text) to authenticated;
