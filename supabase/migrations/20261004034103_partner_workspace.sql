-- Additive pilot: existing personal-table policies and entitlements are unchanged.
begin;
create schema if not exists partner_private;
create table partner_private.partner_organizations (
 id uuid primary key default gen_random_uuid(),
 name text not null check (length(trim(name)) between 1 and 100),
 active boolean not null default true,
 created_at timestamptz not null default now()
);
create table partner_private.partner_memberships (
 organization_id uuid not null references partner_private.partner_organizations(id),
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check (role in ('manager','coach')),
 active boolean not null default true,
 primary key (organization_id,user_id)
);
create index partner_memberships_user_idx on partner_private.partner_memberships(user_id, organization_id);
create table partner_private.learner_access_grants (
 id uuid primary key default gen_random_uuid(),
 learner_id uuid not null references auth.users(id) on delete cascade,
 organization_id uuid references partner_private.partner_organizations(id),
 mentor_id uuid references auth.users(id) on delete cascade,
 assigned_coach_id uuid,
 purpose text not null check (length(trim(purpose)) between 1 and 200),
 scope text not null default 'progress_summary' check (scope = 'progress_summary'),
 status text not null default 'pending' check (status in ('pending','approved','revoked')),
 expires_at timestamptz not null,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 consent_at timestamptz,
 revoked_at timestamptz,
 check (num_nonnulls(organization_id,mentor_id)=1),
 check (assigned_coach_id is null or organization_id is not null),
 check (mentor_id is null or mentor_id <> learner_id),
 foreign key (organization_id,assigned_coach_id) references partner_private.partner_memberships(organization_id,user_id) on delete set null (assigned_coach_id)
);
create index learner_grants_learner_idx on partner_private.learner_access_grants(learner_id,status);
create index learner_grants_org_idx on partner_private.learner_access_grants(organization_id,status,expires_at);
create index learner_grants_mentor_idx on partner_private.learner_access_grants(mentor_id,status,expires_at);
create table partner_private.partner_access_audit (
 id bigint generated always as identity primary key,
 actor_id uuid references auth.users(id) on delete set null,
 action text not null,
 target_id text not null,
 details jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
alter table partner_private.partner_organizations enable row level security;
alter table partner_private.partner_memberships enable row level security;
alter table partner_private.learner_access_grants enable row level security;
alter table partner_private.partner_access_audit enable row level security;
-- No client table privileges or permissive policies. Only the checked RPC below.
revoke all on partner_private.partner_organizations, partner_private.partner_memberships,
 partner_private.learner_access_grants, partner_private.partner_access_audit from public, anon, authenticated;
revoke all on sequence partner_private.partner_access_audit_id_seq from public, anon, authenticated;

create function partner_private.partner_workspace_v1(input_action text, input_data jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
 actor uuid := auth.uid();
 admin_actor boolean;
 result_id uuid;
 org_id uuid;
 target_user uuid;
 mentor_user uuid;
 coach_user uuid;
 grant_row partner_private.learner_access_grants%rowtype;
 output jsonb;
 expiry timestamptz;
 enabled boolean;
begin
 if actor is null or not exists(select 1 from public.user_access where user_id=actor and access_status='active') then
   raise exception 'Active account required' using errcode='42501';
 end if;
 select coalesce(role='admin',false) into admin_actor from public.user_access where user_id=actor;
 if input_action in ('create_organization','set_organization','set_member','propose_grant') then
   if not admin_actor then raise exception 'Platform admin required' using errcode='42501'; end if;
   if input_action='create_organization' then
     insert into partner_private.partner_organizations(name) values(trim(input_data->>'name')) returning id into result_id;
   elsif input_action='set_organization' then
     enabled := (input_data->>'active')::boolean;
     update partner_private.partner_organizations set active=enabled where id=(input_data->>'organization_id')::uuid returning id into result_id;
     if result_id is null then raise exception 'Organization not found'; end if;
   elsif input_action='set_member' then
     org_id := (input_data->>'organization_id')::uuid;
     target_user := (input_data->>'user_id')::uuid;
     enabled := coalesce((input_data->>'active')::boolean,true);
     if enabled and not exists(select 1 from public.user_access where user_id=target_user and access_status='active') then
       raise exception 'Member account unavailable';
     end if;
     insert into partner_private.partner_memberships(organization_id,user_id,role,active)
     values(org_id,target_user,input_data->>'role',enabled)
     on conflict (organization_id,user_id) do update set role=excluded.role, active=excluded.active;
     result_id := org_id;
   else
     target_user := (input_data->>'learner_id')::uuid;
     org_id := nullif(input_data->>'organization_id','')::uuid;
     mentor_user := nullif(input_data->>'mentor_id','')::uuid;
     coach_user := nullif(input_data->>'assigned_coach_id','')::uuid;
     expiry := (input_data->>'expires_at')::timestamptz;
     if expiry is null or expiry <= now() or expiry > now()+interval '366 days' then raise exception 'Expiry must be within one year'; end if;
     if not exists(select 1 from public.user_access where user_id=target_user and access_status='active') then raise exception 'Learner unavailable'; end if;
     if org_id is not null and not exists(select 1 from partner_private.partner_organizations where id=org_id and active) then raise exception 'Organization unavailable'; end if;
     if coach_user is not null and not exists(select 1 from partner_private.partner_memberships where organization_id=org_id and user_id=coach_user and active) then raise exception 'Coach not assigned to organization'; end if;
     if mentor_user is not null and not exists(
       select 1 from public.mentor_profiles m join public.user_access a on a.user_id=m.user_id
       where m.user_id=mentor_user and m.mentor_status='active' and m.crew_verification_status='verified' and a.access_status='active'
     ) then raise exception 'Verified active mentor required'; end if;
     insert into partner_private.learner_access_grants(learner_id,organization_id,mentor_id,assigned_coach_id,purpose,expires_at,created_by)
     values(target_user,org_id,mentor_user,coach_user,trim(input_data->>'purpose'),expiry,actor) returning id into result_id;
   end if;
   insert into partner_private.partner_access_audit(actor_id,action,target_id,details)
   values(actor,input_action,result_id::text,input_data);
   return jsonb_build_object('id',result_id);
 elsif input_action in ('approve_grant','revoke_grant') then
   select * into grant_row from partner_private.learner_access_grants where id=(input_data->>'grant_id')::uuid for update;
   if grant_row.id is null or (grant_row.learner_id <> actor and not (admin_actor and input_action='revoke_grant')) then
     raise exception 'Grant unavailable' using errcode='42501';
   end if;
   if input_action='approve_grant' then
     if grant_row.status <> 'pending' or grant_row.expires_at <= now() then raise exception 'Grant cannot be approved'; end if;
     update partner_private.learner_access_grants set status='approved',consent_at=now() where id=grant_row.id;
   else
     update partner_private.learner_access_grants set status='revoked',revoked_at=coalesce(revoked_at,now()) where id=grant_row.id;
   end if;
   insert into partner_private.partner_access_audit(actor_id,action,target_id) values(actor,input_action,grant_row.id::text);
   return jsonb_build_object('id',grant_row.id);
 elsif input_action <> 'read' or input_action is null then
   raise exception 'Unknown action';
 end if;

 select jsonb_build_object(
 'version',1,'is_admin',admin_actor,
 'organizations',case when admin_actor then coalesce((select jsonb_agg(to_jsonb(o)) from partner_private.partner_organizations o),'[]'::jsonb) else '[]'::jsonb end,
 'members',case when admin_actor then coalesce((select jsonb_agg(to_jsonb(m)) from partner_private.partner_memberships m),'[]'::jsonb) else '[]'::jsonb end,
 'grants',case when admin_actor then coalesce((select jsonb_agg(to_jsonb(g)) from (select * from partner_private.learner_access_grants order by created_at desc limit 200) g),'[]'::jsonb) else '[]'::jsonb end,
 'mine',coalesce((
   select jsonb_agg(jsonb_build_object('id',g.id,'recipient',coalesce(o.name,m.display_name,'合作导师'),
    'purpose',g.purpose,'status',g.status,'expires_at',g.expires_at,'scope',g.scope))
   from partner_private.learner_access_grants g
   left join partner_private.partner_organizations o on o.id=g.organization_id
   left join public.mentor_profiles m on m.user_id=g.mentor_id
   where g.learner_id=actor
 ),'[]'::jsonb),
 'learners',coalesce((
   select jsonb_agg(to_jsonb(summary)) from (
     select g.id as grant_id,g.learner_id,p.name as learner_name,g.purpose,
       coalesce(o.name,'独立导师服务') as organization_name,
       p.target_position,p.career_stage,p.resume_status,p.interview_status,
       p.latest_assessment_score,p.updated_at as synced_at,
       case when p.user_id is null then null else
        (select count(*) from generate_series(1,12) n where p.task_progress->('task'||n::text)->>'completed'='true')
       end as completed_tasks
     from partner_private.learner_access_grants g
     left join public.user_path_profiles p on p.user_id=g.learner_id
     left join partner_private.partner_organizations o on o.id=g.organization_id
     where g.status='approved' and g.expires_at>now()
       and exists(select 1 from public.user_access a where a.user_id=g.learner_id and a.access_status='active')
       and (g.organization_id is null or o.active)
       and (
         admin_actor
         or (g.mentor_id=actor and exists(select 1 from public.mentor_profiles m where m.user_id=actor and m.mentor_status='active' and m.crew_verification_status='verified'))
         or exists(select 1 from partner_private.partner_memberships pm
           where pm.organization_id=g.organization_id and pm.user_id=actor and pm.active
             and (pm.role='manager' or (pm.role='coach' and g.assigned_coach_id=actor)))
       )
     order by g.created_at desc,g.id limit 200
   ) summary
 ),'[]'::jsonb)
 ) into output;
 insert into partner_private.partner_access_audit(actor_id,action,target_id,details)
 values(actor,'read_progress_summary',actor::text,jsonb_build_object('grant_ids',
   (select coalesce(jsonb_agg(x->>'grant_id'),'[]'::jsonb) from jsonb_array_elements(output->'learners') x)));
 return output;
end;
$$;
revoke all on function partner_private.partner_workspace_v1(text,jsonb) from public,anon,authenticated;

-- Public API wrapper is the only client entry point; privileged code stays private and validates auth.uid().
create function public.partner_workspace_v1(input_action text default 'read',input_data jsonb default '{}'::jsonb)
returns jsonb language sql security definer set search_path = ''
as $$ select partner_private.partner_workspace_v1(input_action,input_data); $$;
revoke all on function public.partner_workspace_v1(text,jsonb) from public,anon,authenticated;
grant execute on function public.partner_workspace_v1(text,jsonb) to authenticated;
commit;
