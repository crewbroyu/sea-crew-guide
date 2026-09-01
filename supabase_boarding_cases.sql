create table if not exists public.boarding_cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  cruise_company text,
  final_position text,
  offer_status text not null default 'received'
    check (offer_status in ('received', 'reviewing', 'accepted', 'declined')),
  salary_amount numeric,
  salary_currency text not null default 'USD',
  salary_notes text,
  contract_start date,
  contract_end date,
  embarkation_date date,
  embarkation_port text,
  departure_city text,
  application_channel text,
  agency_fee numeric,
  offer_confirmed boolean not null default false,
  offer_checks jsonb not null default '{}'::jsonb
    check (jsonb_typeof(offer_checks) = 'object'),
  document_items jsonb not null default '[]'::jsonb
    check (jsonb_typeof(document_items) = 'array'),
  us_visa_requirement text not null default 'unknown'
    check (us_visa_requirement in ('unknown', 'required', 'not_required')),
  visa_status text not null default 'not_started'
    check (visa_status in (
      'not_started', 'loe_waiting', 'ds160_submitted', 'fee_paid',
      'appointment_booked', 'interview_completed',
      'administrative_processing', 'issued', 'refused'
    )),
  visa_reason text,
  visa_appointment_at timestamptz,
  visa_consulate text,
  visa_expiry_date date,
  visa_notes text,
  travel_items jsonb not null default '[]'::jsonb
    check (jsonb_typeof(travel_items) = 'array'),
  overall_readiness text not null default 'not_ready'
    check (overall_readiness in ('not_ready', 'ready', 'boarded')),
  boarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists boarding_cases_user_status_idx
  on public.boarding_cases (user_id, overall_readiness);

create index if not exists boarding_cases_embarkation_idx
  on public.boarding_cases (embarkation_date, embarkation_port);

alter table public.boarding_cases enable row level security;

revoke all on table public.boarding_cases from anon, authenticated;
grant select, insert, update, delete on table public.boarding_cases to authenticated;

drop policy if exists "Users can read own boarding case" on public.boarding_cases;
create policy "Users can read own boarding case"
on public.boarding_cases
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own boarding case" on public.boarding_cases;
create policy "Users can insert own boarding case"
on public.boarding_cases
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own boarding case" on public.boarding_cases;
create policy "Users can update own boarding case"
on public.boarding_cases
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own boarding case" on public.boarding_cases;
create policy "Users can delete own boarding case"
on public.boarding_cases
for delete
to authenticated
using ((select auth.uid()) = user_id);
