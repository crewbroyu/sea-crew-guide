-- Task 5 completion proofs used to carry an optional photo as an inline base64 `image` field inside
-- job_preparation_profiles.completed_course_details. The photos filled learners' browser storage and
-- were downloaded with every read and write of the row. The application no longer collects or keeps
-- them; remove the stored copies. Every other field of each course entry (completedAt, notes) is kept.
-- updated_at is advanced so that any page that read the row before this runs re-reads it before writing.
-- Apply only after the application release that strips the photos is live. Safe to rerun.

begin;

update public.job_preparation_profiles j
set completed_course_details = (
      select jsonb_object_agg(
        e.key,
        case when jsonb_typeof(e.value) = 'object' then e.value - 'image' else e.value end
      )
      from jsonb_each(j.completed_course_details) e
    ),
    updated_at = greatest(now(), j.updated_at + interval '1 millisecond')
where jsonb_typeof(j.completed_course_details) = 'object'
  and exists (
    select 1
    from jsonb_each(j.completed_course_details) e
    where jsonb_typeof(e.value) = 'object' and e.value ? 'image'
  );

commit;

-- Verification: remaining_photos must be 0.
select count(*) as remaining_photos
from public.job_preparation_profiles j
cross join lateral jsonb_each(
  case when jsonb_typeof(j.completed_course_details) = 'object' then j.completed_course_details else '{}'::jsonb end
) e
where jsonb_typeof(e.value) = 'object' and e.value ? 'image';
