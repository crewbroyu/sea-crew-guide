import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite')
const db = new PGlite()
const ids = Array.from({ length: 9 }, (_, i) => `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`)
const [admin, learner, learner2, manager, coach, other, mentor, stranger, unverified] = ids
await db.exec(`
create role anon; create role authenticated;
create schema auth;
create table auth.users(id uuid primary key,email text);
create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth to authenticated,anon;
create table public.user_access(user_id uuid primary key,role text,access_status text);
create table public.mentor_profiles(user_id uuid primary key,display_name text,mentor_status text,crew_verification_status text);
create table public.user_path_profiles(user_id uuid primary key,name text,email text,target_position text,career_stage text,resume_status text,interview_status text,latest_assessment_score int,task_progress jsonb,updated_at timestamptz default now());
alter table public.user_path_profiles enable row level security;
grant select on public.user_path_profiles to authenticated;
create policy self_only on public.user_path_profiles for select to authenticated using (user_id=auth.uid());
`)
for (const id of ids) {
  await db.query('insert into auth.users values($1,$2)', [id, id === learner ? 'learner@example.test' : id + '@example.test'])
  await db.query('insert into public.user_access values($1,$2,$3)', [id, id === admin ? 'admin' : 'member', 'active'])
}
await db.query("insert into public.mentor_profiles values($1,'导师','active','verified'),($2,'待认证','active','unverified')", [mentor, unverified])
await db.query(`insert into public.user_path_profiles(user_id,name,email,task_progress) values($1,'学员一','PRIVATE_EMAIL','{"task1":{"completed":true},"task7AiMock":{"completed":true}}'),($2,'学员二','PRIVATE_EMAIL_2','{}')`, [learner, learner2])
await db.exec(await readFile(new URL('../supabase/migrations/20261004034103_partner_workspace.sql', import.meta.url), 'utf8'))
await db.exec(await readFile(new URL('../supabase/migrations/20261004035617_partner_directory_and_invites.sql', import.meta.url), 'utf8'))
await db.exec(await readFile(new URL('../supabase/migrations/20261004105657_partner_service_tasks.sql', import.meta.url), 'utf8'))
let assertions = 0
const check = (actual, expected) => { assert.deepEqual(actual, expected); assertions++ }
async function rpc(actor, action = 'read', data = {}, role = 'authenticated', rpcName = 'partner_workspace_v1') {
  await db.exec(`set role ${role}`)
  try {
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [actor || ''])
    return (await db.query(`select public.${rpcName}($1,$2::jsonb) result`, [action, JSON.stringify(data)])).rows[0].result
  } finally { await db.exec('reset role') }
}
const directory = (actor, action, data = {}, role = 'authenticated') => rpc(actor,action,data,role,'partner_directory_v1')
const service = (actor, action = 'read', data = {}, role = 'authenticated') => rpc(actor,action,data,role,'partner_service_tasks_v1')
const deny = async (fn) => { await assert.rejects(fn); assertions++ }
try {
  await deny(() => rpc(null, 'read', {}, 'anon'))
  await deny(() => rpc(null))
  await deny(() => rpc(stranger, 'create_organization', { name: '冒充' }))
  await deny(() => directory(null,'pending_count',{},'anon'))
  await deny(() => directory(stranger,'search_accounts',{ query:'学员' }))
  await deny(() => directory(manager,'search_accounts',{ query:'学员' }))
  await deny(() => directory(mentor,'search_accounts',{ query:'学员' }))
  await deny(() => directory(admin,'search_accounts',{ query:'' }))
  await deny(() => directory(admin,'search_accounts',{ query:'学' }))
  await deny(() => directory(admin,'search_accounts',{ query:'学员',kind:'admin' }))
  check((await directory(admin,'search_accounts',{ query:'学员' })).accounts.length,2)
  check((await directory(admin,'search_accounts',{ query:' LEARNER@EXAMPLE.TEST ' })).accounts[0].user_id,learner)
  check((await directory(admin,'search_accounts',{ query:learner })).accounts[0].email,'learner@example.test')
  check((await directory(admin,'search_accounts',{ query:'%_' })).accounts.length,0)
  check((await directory(admin,'search_accounts',{ query:'导师',kind:'mentor' })).accounts[0].user_id,mentor)
  check((await directory(admin,'search_accounts',{ query:'待认证',kind:'mentor' })).accounts.length,0)
  check((await directory(learner,'pending_count')).pending_count,0)
  await db.query("update public.user_access set role=null where user_id=$1",[stranger])
  await deny(() => rpc(stranger,'create_organization',{name:'空角色越权'}))
  await deny(() => service(stranger,'create',{}))
  await db.query("update public.user_access set role='member' where user_id=$1",[stranger])
  const org = (await rpc(admin, 'create_organization', { name: '机构甲' })).id
  const org2 = (await rpc(admin, 'create_organization', { name: '机构乙' })).id
  for (const [user_id, role, organization_id] of [[manager,'manager',org],[coach,'coach',org],[other,'manager',org2]]) {
    await rpc(admin,'set_member',{ organization_id,user_id,role,active:true })
  }
  const propose = (data) => rpc(admin,'propose_grant',{ learner_id:learner,purpose:'面试辅导',expires_at:new Date(Date.now()+86400000).toISOString(),...data })
  await deny(() => propose({ mentor_id:unverified }))
  await deny(() => propose({ organization_id:org,assigned_coach_id:other }))
  await deny(() => propose({ mentor_id:mentor,organization_id:org }))
  const grant = (await propose({ organization_id:org,assigned_coach_id:coach })).id
  check((await directory(learner,'pending_count')).pending_count,1)
  check((await directory(learner2,'pending_count',{ learner_id:learner })).pending_count,0)
  check((await rpc(manager)).learners.length,0)
  await deny(() => rpc(admin,'approve_grant',{ grant_id:grant }))
  await deny(() => rpc(learner2,'approve_grant',{ grant_id:grant }))
  check((await rpc(learner)).mine.length,1)
  await rpc(learner,'approve_grant',{ grant_id:grant })
  check((await directory(learner,'pending_count')).pending_count,0)
  check((await rpc(manager)).learners[0].completed_tasks,1)
  check((await rpc(coach)).learners.length,1)
  await rpc(admin,'set_member',{ organization_id:org,user_id:stranger,role:'coach',active:true })
  check((await rpc(stranger)).learners.length,0)
  check((await rpc(other)).learners.length,0)
  check((await rpc(stranger)).learners.length,0)
  check((await rpc(mentor)).learners.length,0)
  assert.ok(!JSON.stringify(await rpc(manager)).includes('PRIVATE_EMAIL')); assertions++
  await db.exec('set role authenticated')
  check((await db.query('select * from public.user_path_profiles')).rows.length,0)
  await deny(() => db.query('select * from partner_private.learner_access_grants'))
  await db.exec('reset role')

  await deny(() => service(null,'read',{},'anon'))
  await deny(() => service(coach,'create',{}))
  const request = {request_key:'10000000-0000-4000-8000-000000000001',grant_id:grant,service_type:'mock_interview',duration_minutes:60}
  const taskId = (await service(admin,'create',request)).id
  check((await service(admin,'create',request)).id,taskId)
  await deny(() => service(admin,'create',{...request,duration_minutes:30}))
  check((await service(learner)).tasks.length,1)
  check((await service(coach)).tasks.length,1)
  check((await service(manager)).tasks.length,1)
  check((await service(manager)).tasks[0].can_manage,false)
  check((await service(other)).tasks.length,0)
  check((await service(stranger)).tasks.length,0)
  await deny(() => service(stranger,'cancel',{task_id:taskId,expected_version:1}))
  await deny(() => service(manager,'cancel',{task_id:taskId,expected_version:1}))
  const time = new Date(Date.now()+3600000).toISOString()
  await deny(() => service(learner,'propose_time',{task_id:taskId,expected_version:1,scheduled_at:time}))
  await deny(() => service(coach,'propose_time',{task_id:taskId,expected_version:1,scheduled_at:new Date(Date.now()-1000).toISOString()}))
  await service(coach,'propose_time',{task_id:taskId,expected_version:1,scheduled_at:time})
  await deny(() => service(coach,'propose_time',{task_id:taskId,expected_version:1,scheduled_at:time}))
  await deny(() => service(admin,'accept_time',{task_id:taskId,expected_version:2}))
  await service(learner,'accept_time',{task_id:taskId,expected_version:2})
  const task2 = (await service(admin,'create',{...request,request_key:'10000000-0000-4000-8000-000000000002'})).id
  await deny(() => service(coach,'propose_time',{task_id:task2,expected_version:1,scheduled_at:time}))
  await deny(() => service(coach,'report_delivery',{task_id:taskId,expected_version:3,note:'提前报完成'}))
  await db.query("update partner_private.service_tasks set scheduled_at=now()-interval '2 hours' where id=$1",[taskId])
  await deny(() => service(coach,'report_delivery',{task_id:taskId,expected_version:3,note:' '}))
  await service(coach,'report_delivery',{task_id:taskId,expected_version:3,note:'完成两轮模拟面试与反馈'})
  await deny(() => service(coach,'cancel',{task_id:taskId,expected_version:4}))
  await deny(() => service(coach,'confirm_delivery',{task_id:taskId,expected_version:4}))
  await deny(() => service(admin,'confirm_delivery',{task_id:taskId,expected_version:4}))
  await service(learner,'confirm_delivery',{task_id:taskId,expected_version:4})
  check((await service(learner)).tasks.find(t=>t.id===taskId).status,'completed')
  await deny(() => service(admin,'cancel',{task_id:taskId,expected_version:5}))
  await service(coach,'propose_time',{task_id:task2,expected_version:1,scheduled_at:time})
  await service(learner,'accept_time',{task_id:task2,expected_version:2})
  await db.query("update partner_private.service_tasks set scheduled_at=now()-interval '2 hours' where id=$1",[task2])
  await service(coach,'report_delivery',{task_id:task2,expected_version:3,note:'咨询反馈'})
  await service(learner,'dispute',{task_id:task2,expected_version:4,note:'需要核对服务时长'})
  await deny(() => service(coach,'cancel',{task_id:task2,expected_version:5}))
  check((await service(admin)).tasks.find(t=>t.id===task2).status,'disputed')
  await service(admin,'cancel',{task_id:task2,expected_version:5})
  const frozenTask = (await service(admin,'create',{...request,request_key:'10000000-0000-4000-8000-000000000003'})).id
  await rpc(admin,'set_member',{ organization_id:org,user_id:coach,role:'coach',active:false })
  check((await service(coach)).tasks.length,0)
  await deny(() => service(admin,'propose_time',{task_id:frozenTask,expected_version:1,scheduled_at:time}))
  await db.exec('set role authenticated')
  await deny(() => db.query('select * from partner_private.service_tasks'))
  await deny(() => db.query('select partner_private.grant_is_live($1)',[grant]))
  await db.exec('reset role')

  check((await rpc(coach)).learners.length,0)
  await rpc(admin,'set_organization',{ organization_id:org,active:false })
  check((await rpc(manager)).learners.length,0)
  await rpc(admin,'set_organization',{ organization_id:org,active:true })
  await rpc(learner,'revoke_grant',{ grant_id:grant })
  check((await rpc(manager)).learners.length,0)
  await deny(() => rpc(learner,'approve_grant',{ grant_id:grant }))
  check((await service(manager)).tasks.length,0)
  check((await service(learner)).tasks.length,3)
  await service(learner,'cancel',{task_id:frozenTask,expected_version:1})
  const mentorGrant = (await propose({ mentor_id:mentor })).id
  await rpc(learner,'approve_grant',{ grant_id:mentorGrant })
  check((await rpc(mentor)).learners.length,1)
  const independentTask = (await service(admin,'create',{...request,grant_id:mentorGrant,request_key:'10000000-0000-4000-8000-000000000004'})).id
  check((await service(mentor)).tasks[0].id,independentTask)
  check((await service(manager)).tasks.length,0)
  assert.ok(!Object.hasOwn((await service(mentor)).tasks[0],'request_key')); assertions++

  await db.query("update public.user_access set access_status='suspended' where user_id=$1",[learner])
  check((await rpc(mentor)).learners.length,0)
  await db.query("update public.user_access set access_status='active' where user_id=$1",[learner])
  await db.query("update public.mentor_profiles set mentor_status='inactive' where user_id=$1",[mentor])
  check((await rpc(mentor)).learners.length,0)
  check((await service(mentor)).tasks.length,0)
  await db.query("update public.mentor_profiles set mentor_status='active' where user_id=$1",[mentor])
  await db.query("update public.user_access set access_status='suspended' where user_id=$1",[mentor])
  await deny(() => rpc(mentor))
  check((await directory(admin,'search_accounts',{ query:mentor })).accounts.length,0)
  await deny(() => directory(mentor,'pending_count'))
  await db.query("update public.user_access set access_status='active' where user_id=$1",[mentor])
  await db.query("update partner_private.learner_access_grants set expires_at=now()-interval '1 minute' where id=$1",[mentorGrant])
  check((await rpc(mentor)).learners.length,0)
  check((await rpc(manager)).organizations.length,0)
  check((await service(mentor)).tasks.length,0)
  await deny(() => service(mentor,'propose_time',{task_id:independentTask,expected_version:1,scheduled_at:time}))
  await db.query("update public.user_access set access_status='suspended' where user_id=$1",[admin])
  await deny(() => directory(admin,'search_accounts',{ query:'学员' }))
  await deny(() => rpc(admin,'create_organization',{ name:'失效管理员' }))
  await db.query("update public.user_access set access_status='active' where user_id=$1",[admin])
  const expiredPending = (await propose({ mentor_id:mentor })).id
  await db.query("update partner_private.learner_access_grants set expires_at=now()-interval '1 minute' where id=$1",[expiredPending])
  check((await directory(learner,'pending_count')).pending_count,0)
  const revokedPending = (await propose({ mentor_id:mentor })).id
  await rpc(learner,'revoke_grant',{ grant_id:revokedPending })
  check((await directory(learner,'pending_count')).pending_count,0)
  await db.query('delete from auth.users where id=$1',[coach])
  check((await db.query('select assigned_coach_id from partner_private.learner_access_grants where id=$1',[grant])).rows[0].assigned_coach_id,null)
  await db.query('delete from auth.users where id=$1',[learner])
  check((await db.query('select count(*)::int n from partner_private.learner_access_grants')).rows[0].n,0)
  assert.ok((await db.query('select count(*)::int n from partner_private.partner_access_audit')).rows[0].n > 10); assertions++
  console.log(`Partner SQL integration: ${assertions} checks passed (isolated PostgreSQL/PGlite).`)
} finally { await db.close() }
