-- Connect recruitment postings to application records, and label how a posting is applied for.
-- 1. job_application_records gains source_type 'job_posting', a link to the posting (kept as a
--    snapshot: company_name, job_title, and company_url already store the text, so the record
--    survives when the posting is archived or deleted), and an interview date.
-- 2. job_postings gains the application channel as stated in the source (official site,
--    claimed authorized agency, agency, unspecified) with the source wording, an admin-only
--    verification that requires an evidence link, the fee disclosure, and the last review time.
-- Existing rows get "unspecified" and last_checked_at = updated_at. Safe to rerun.

begin;

-- 1. Application records -------------------------------------------------------------------

-- The source_type check was declared inline, so its name may differ between environments.
do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any(con.conkey)
    where con.conrelid = 'public.job_application_records'::regclass
      and con.contype = 'c'
      and att.attname = 'source_type'
  loop
    execute format('alter table public.job_application_records drop constraint %I', constraint_name);
  end loop;
end;
$$;

alter table public.job_application_records
  add constraint job_application_records_source_type_check
  check (source_type in ('cruise_company', 'brand_partner', 'job_channel', 'job_posting', 'manual'));

alter table public.job_application_records
  add column if not exists job_posting_id uuid references public.job_postings(id) on delete set null,
  add column if not exists interview_date date;

create index if not exists job_application_records_user_posting_idx
  on public.job_application_records (user_id, job_posting_id)
  where job_posting_id is not null;

-- 2. Posting channel, verification, fees, review time ---------------------------------------

alter table public.job_postings
  add column if not exists channel_type text not null default 'unspecified',
  add column if not exists channel_claim text,
  add column if not exists channel_verified_at timestamptz,
  add column if not exists channel_verification_url text,
  add column if not exists fee_disclosure text not null default 'unspecified',
  add column if not exists last_checked_at timestamptz;

alter table public.job_postings drop constraint if exists job_postings_channel_type_check;
alter table public.job_postings add constraint job_postings_channel_type_check
  check (channel_type in ('official_direct', 'claimed_authorized', 'agency', 'unspecified'));

alter table public.job_postings drop constraint if exists job_postings_channel_claim_check;
alter table public.job_postings add constraint job_postings_channel_claim_check
  check (channel_claim is null or char_length(channel_claim) between 1 and 200);

-- "Verified" is never a bare flag: it needs an https evidence link (official partner list,
-- maritime administration filing, or similar).
alter table public.job_postings drop constraint if exists job_postings_channel_verification_check;
alter table public.job_postings add constraint job_postings_channel_verification_check
  check (
    (channel_verification_url is null or (channel_verification_url ~ '^https://' and char_length(channel_verification_url) <= 1000))
    and (channel_verified_at is null or channel_verification_url is not null)
  );

alter table public.job_postings drop constraint if exists job_postings_fee_disclosure_check;
alter table public.job_postings add constraint job_postings_fee_disclosure_check
  check (fee_disclosure in ('fees_stated', 'no_fee_stated', 'unspecified'));

update public.job_postings set last_checked_at = updated_at where last_checked_at is null;

commit;
