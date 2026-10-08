-- Confidence describes repeated observations, not the scoring weight of one event.
-- Normalize any profiles created by the first application deployment.

update public.user_skill_profiles as profile
set confidence = (
  select coalesce(
    jsonb_object_agg(
      item.key,
      item.value || jsonb_build_object(
        'level',
        case
          when coalesce((item.value ->> 'evidenceCount')::integer, 0) >= 3 then 'high'
          when coalesce((item.value ->> 'evidenceCount')::integer, 0) >= 2 then 'medium'
          else 'low'
        end
      )
    ),
    '{}'::jsonb
  ) as value
  from jsonb_each(profile.confidence) as item
),
updated_at = now();

