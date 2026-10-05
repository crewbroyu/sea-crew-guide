begin;
-- Separate API: never expose the account directory to mentors or institutions.
create function partner_private.partner_directory_v1(input_action text, input_data jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
 actor uuid := auth.uid();
 query_text text := lower(trim(coalesce(input_data->>'query','')));
 kind text := coalesce(input_data->>'kind','account');
 result jsonb;
begin
 if actor is null or not exists(select 1 from public.user_access where user_id=actor and access_status='active') then
   raise exception 'Active account required' using errcode='42501';
 end if;
 if input_action='pending_count' then
   return jsonb_build_object('pending_count', (select count(*) from partner_private.learner_access_grants g
     where g.learner_id=actor and g.status='pending' and g.expires_at>now()));
 end if;
 if input_action is distinct from 'search_accounts' then raise exception 'Unknown action'; end if;
 if not exists(select 1 from public.user_access where user_id=actor and role='admin' and access_status='active') then
   raise exception 'Platform admin required' using errcode='42501';
 end if;
 if length(query_text)<2 or length(query_text)>254 or kind not in ('account','mentor') then
   raise exception 'Invalid search' using errcode='22023';
 end if;
 select coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) into result from (
   select a.user_id, coalesce(nullif(p.name,''),nullif(m.display_name,''),'未填写姓名') as display_name,
     u.email, a.access_status,
     coalesce(m.mentor_status='active' and m.crew_verification_status='verified',false) as verified_mentor
   from public.user_access a join auth.users u on u.id=a.user_id
   left join public.user_path_profiles p on p.user_id=a.user_id
   left join public.mentor_profiles m on m.user_id=a.user_id
   where a.access_status='active'
     and (kind='account' or (m.mentor_status='active' and m.crew_verification_status='verified'))
     and (a.user_id::text=query_text or lower(u.email)=query_text
       or strpos(lower(coalesce(p.name,'')),query_text)>0
       or strpos(lower(coalesce(m.display_name,'')),query_text)>0)
   order by a.user_id limit 20
 ) r;
 insert into partner_private.partner_access_audit(actor_id,action,target_id,details)
 values(actor,'search_accounts',actor::text,jsonb_build_object('kind',kind,'result_count',jsonb_array_length(result)));
 return jsonb_build_object('accounts',result);
end;
$$;
revoke all on function partner_private.partner_directory_v1(text,jsonb) from public,anon,authenticated;
create function public.partner_directory_v1(input_action text,input_data jsonb default '{}'::jsonb)
returns jsonb language sql security definer set search_path = ''
as $$ select partner_private.partner_directory_v1(input_action,input_data); $$;
revoke all on function public.partner_directory_v1(text,jsonb) from public,anon,authenticated;
grant execute on function public.partner_directory_v1(text,jsonb) to authenticated;
commit;
