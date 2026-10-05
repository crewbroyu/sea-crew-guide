begin;
create table partner_private.service_tasks (
 id uuid primary key default gen_random_uuid(),
 request_key uuid not null unique,
 grant_id uuid not null references partner_private.learner_access_grants(id) on delete cascade,
 provider_id uuid not null references auth.users(id) on delete cascade,
 service_type text not null check(service_type in ('consultation','mock_interview')),
 duration_minutes integer not null check(duration_minutes in (30,60)),
 status text not null default 'pending' check(status in ('pending','proposed','scheduled','awaiting_confirmation','completed','disputed','cancelled')),
 scheduled_at timestamptz,
 completion_note text check(length(completion_note)<=1000),
 dispute_note text check(length(dispute_note)<=1000),
 completed_at timestamptz,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 version integer not null default 1
);
create index service_tasks_grant_idx on partner_private.service_tasks(grant_id,created_at desc);
create index service_tasks_provider_idx on partner_private.service_tasks(provider_id,created_at desc);
alter table partner_private.service_tasks enable row level security;
revoke all on partner_private.service_tasks from public,anon,authenticated;

-- Internal predicate. Not callable by clients; all callers supply auth.uid().
create function partner_private.grant_is_live(grant_id uuid)
returns boolean language sql stable security invoker set search_path = '' as $$
 select exists(select 1 from partner_private.learner_access_grants g
 join public.user_access a on a.user_id=g.learner_id and a.access_status='active'
 where g.id=grant_id and g.status='approved' and g.expires_at>now()
 and ((g.organization_id is not null and exists(select 1 from partner_private.partner_organizations o where o.id=g.organization_id and o.active))
 or (g.mentor_id is not null and exists(select 1 from public.mentor_profiles m join public.user_access u on u.user_id=m.user_id
 where m.user_id=g.mentor_id and m.mentor_status='active' and m.crew_verification_status='verified' and u.access_status='active'))));
$$;
revoke all on function partner_private.grant_is_live(uuid) from public,anon,authenticated;

create function partner_private.partner_service_tasks_v1(input_action text,input_data jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
 actor uuid := auth.uid();
 admin_actor boolean;
 task partner_private.service_tasks%rowtype;
 permission partner_private.learner_access_grants%rowtype;
 live boolean;
 provider_active boolean;
 new_date timestamptz;
 note text;
 output jsonb;
begin
 if actor is null or not exists(select 1 from public.user_access where user_id=actor and access_status='active') then
   raise exception 'Active account required' using errcode='42501';
 end if;
 select coalesce(role='admin',false) into admin_actor from public.user_access where user_id=actor;
 if input_action='read' then
   select jsonb_build_object('version',1,'tasks',coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb)) into output from (
     select t.id,t.grant_id,t.provider_id,t.service_type,t.duration_minutes,t.status,t.scheduled_at,
       t.completion_note,t.dispute_note,t.completed_at,t.created_at,t.updated_at,t.version,g.learner_id,p.name as learner_name,coalesce(m.display_name,pp.name,'服务导师') as provider_name,
       coalesce(o.name,'独立导师') as organization_name,
       (partner_private.grant_is_live(g.id) and exists(select 1 from public.user_access u where u.user_id=t.provider_id and u.access_status='active')
         and (g.mentor_id=t.provider_id or exists(select 1 from partner_private.partner_memberships pm where pm.organization_id=g.organization_id and pm.user_id=t.provider_id and pm.active))) as access_active,
       (admin_actor or actor=t.provider_id) as can_manage,
       (actor=g.learner_id) as is_learner,
       (admin_actor or actor=t.provider_id or actor=g.learner_id) as can_cancel
     from partner_private.service_tasks t join partner_private.learner_access_grants g on g.id=t.grant_id
     left join public.user_path_profiles p on p.user_id=g.learner_id
     left join public.user_path_profiles pp on pp.user_id=t.provider_id
     left join public.mentor_profiles m on m.user_id=t.provider_id
     left join partner_private.partner_organizations o on o.id=g.organization_id
     where admin_actor or actor=g.learner_id or (
       partner_private.grant_is_live(g.id) and (
         (actor=t.provider_id and (g.mentor_id=actor or exists(select 1 from partner_private.partner_memberships pm where pm.organization_id=g.organization_id and pm.user_id=actor and pm.active)))
         or exists(select 1 from partner_private.partner_memberships pm where pm.organization_id=g.organization_id and pm.user_id=actor and pm.active and pm.role='manager')))
     order by t.created_at desc,t.id limit 200
   ) r;
   insert into partner_private.partner_access_audit(actor_id,action,target_id,details)
   values(actor,'read_service_tasks',actor::text,jsonb_build_object('task_ids',(select coalesce(jsonb_agg(x->>'id'),'[]'::jsonb) from jsonb_array_elements(output->'tasks') x)));
   return output;
 elsif input_action='create' then
   if not admin_actor then raise exception 'Platform admin required' using errcode='42501'; end if;
   select * into permission from partner_private.learner_access_grants where id=(input_data->>'grant_id')::uuid for share;
   if not partner_private.grant_is_live(permission.id) then raise exception 'Approved active grant required' using errcode='42501'; end if;
   if coalesce(permission.mentor_id,permission.assigned_coach_id) is null then raise exception 'Assign a coach first' using errcode='22023'; end if;
   if not exists(select 1 from public.user_access where user_id=coalesce(permission.mentor_id,permission.assigned_coach_id) and access_status='active')
     or (permission.organization_id is not null and not exists(select 1 from partner_private.partner_memberships where organization_id=permission.organization_id and user_id=permission.assigned_coach_id and active)) then
     raise exception 'Provider unavailable' using errcode='42501';
   end if;
   insert into partner_private.service_tasks(request_key,grant_id,provider_id,service_type,duration_minutes,created_by)
   values((input_data->>'request_key')::uuid,permission.id,coalesce(permission.mentor_id,permission.assigned_coach_id),input_data->>'service_type',(input_data->>'duration_minutes')::integer,actor)
   on conflict(request_key) do nothing returning * into task;
   if task.id is null then
     select * into task from partner_private.service_tasks where request_key=(input_data->>'request_key')::uuid;
     if task.created_by is distinct from actor or task.grant_id is distinct from permission.id
       or task.service_type is distinct from input_data->>'service_type'
       or task.duration_minutes is distinct from (input_data->>'duration_minutes')::integer then
       raise exception 'Request key conflict' using errcode='22023';
     end if;
     return jsonb_build_object('id',task.id);
   end if;
 else
   select * into task from partner_private.service_tasks where id=(input_data->>'task_id')::uuid for update;
   select * into permission from partner_private.learner_access_grants where id=task.grant_id for share;
   if task.id is null then raise exception 'Task unavailable' using errcode='42501'; end if;
   live := partner_private.grant_is_live(permission.id);
   provider_active := exists(select 1 from public.user_access where user_id=task.provider_id and access_status='active')
     and (coalesce(permission.mentor_id=task.provider_id,false) or exists(select 1 from partner_private.partner_memberships where organization_id=permission.organization_id and user_id=task.provider_id and active));
   if not (admin_actor or permission.learner_id=actor or (task.provider_id=actor and live and provider_active)) then
     raise exception 'Task unavailable' using errcode='42501';
   end if;
   if task.version is distinct from (input_data->>'expected_version')::integer then raise exception 'Refresh task before changing' using errcode='40001'; end if;
   if task.status in ('completed','cancelled') then raise exception 'Task already closed' using errcode='22023'; end if;
   if input_action='cancel' then
     if task.status in ('awaiting_confirmation','disputed') and not admin_actor then raise exception 'Admin must resolve dispute' using errcode='42501'; end if;
     task.status := 'cancelled';
   else
     if not live or not provider_active then raise exception 'Service authorization unavailable' using errcode='42501'; end if;
     if input_action='propose_time' then
       if not (admin_actor or actor=task.provider_id) or task.status not in ('pending','proposed','scheduled') then raise exception 'Cannot schedule task' using errcode='42501'; end if;
       new_date := (input_data->>'scheduled_at')::timestamptz;
       if new_date is null or new_date<=now() or new_date+make_interval(mins=>task.duration_minutes)>permission.expires_at then raise exception 'Time outside authorization' using errcode='22023'; end if;
       perform pg_advisory_xact_lock(hashtextextended(task.provider_id::text,0));
       if exists(select 1 from partner_private.service_tasks other where other.id<>task.id and other.provider_id=task.provider_id
         and other.status in ('proposed','scheduled') and partner_private.grant_is_live(other.grant_id)
         and other.scheduled_at<new_date+make_interval(mins=>task.duration_minutes)
         and other.scheduled_at+make_interval(mins=>other.duration_minutes)>new_date) then
         raise exception 'Provider time already reserved' using errcode='23P01';
       end if;
       task.scheduled_at := new_date;
       task.status := 'proposed';
     elsif input_action='accept_time' then
       if actor<>permission.learner_id or task.status<>'proposed' then raise exception 'Learner confirmation required' using errcode='42501'; end if;
       if task.scheduled_at<=now() then raise exception 'Proposed time expired' using errcode='22023'; end if;
       task.status := 'scheduled';
     elsif input_action='report_delivery' then
       if not (admin_actor or actor=task.provider_id) or task.status<>'scheduled' then raise exception 'Cannot report delivery' using errcode='42501'; end if;
       if now()<task.scheduled_at+make_interval(mins=>task.duration_minutes) then raise exception 'Service window not finished' using errcode='22023'; end if;
       note := trim(input_data->>'note');
       if note is null or length(note) not between 1 and 1000 then raise exception 'Delivery note required' using errcode='22023'; end if;
       task.completion_note := note;
       task.status := 'awaiting_confirmation';
     elsif input_action in ('confirm_delivery','dispute') then
       if actor<>permission.learner_id or task.status<>'awaiting_confirmation' then raise exception 'Learner confirmation required' using errcode='42501'; end if;
       if input_action='confirm_delivery' then task.status := 'completed'; task.completed_at := now();
       else
         note := trim(input_data->>'note');
         if note is null or length(note) not between 1 and 1000 then raise exception 'Dispute note required' using errcode='22023'; end if;
         task.dispute_note := note; task.status := 'disputed';
       end if;
     else raise exception 'Unknown action' using errcode='22023';
     end if;
   end if;
   update partner_private.service_tasks set status=task.status,scheduled_at=task.scheduled_at,
     completion_note=task.completion_note,dispute_note=task.dispute_note,completed_at=task.completed_at,
     updated_at=now(),version=version+1 where id=task.id;
 end if;
 insert into partner_private.partner_access_audit(actor_id,action,target_id,details)
 values(actor,'service_'||input_action,task.id::text,jsonb_build_object('status',task.status));
 return jsonb_build_object('id',task.id);
end;
$$;
revoke all on function partner_private.partner_service_tasks_v1(text,jsonb) from public,anon,authenticated;
create function public.partner_service_tasks_v1(input_action text default 'read',input_data jsonb default '{}'::jsonb)
returns jsonb language sql security definer set search_path = '' as $$ select partner_private.partner_service_tasks_v1(input_action,input_data); $$;
revoke all on function public.partner_service_tasks_v1(text,jsonb) from public,anon,authenticated;
grant execute on function public.partner_service_tasks_v1(text,jsonb) to authenticated;
commit;
