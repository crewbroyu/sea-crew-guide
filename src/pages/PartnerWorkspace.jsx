import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccessStore } from '../store/accessStore'
import PartnerServiceTasks from '../components/PartnerServiceTasks'
import PartnerAccountPicker from '../components/PartnerAccountPicker'
import { partnerWorkspace } from '../services/partnerWorkspaceService'

const button = 'rounded-lg bg-blue-700 px-4 py-2 text-sm text-white disabled:opacity-50'
const panel = 'rounded-xl border border-slate-200 bg-white p-5 space-y-3'
const labels = { pending: '等待确认', approved: '已同意', revoked: '已撤销', exploring: '了解阶段', assessment_done: '完成测评', position_planning: '岗位选择', resume_preparation: '准备简历', interview_preparation: '准备面试', interview_process: '面试中', offer_received: '已获 Offer', boarding_preparation: '登船准备', not_started: '未开始', draft_ready: '已有草稿', learning: '学习中', practicing: '练习中', ai_mock_done: '完成 AI 模拟', real_interview_recorded: '已有面试记录' }
const date = value => value ? new Date(value).toLocaleString('zh-CN') : '尚未同步'
const label = value => labels[value] || value || '未填写'

function Field({ name, title, type = 'text', required = true, maxLength, children }) {
  const props = { name, required, className: 'mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm' }
  return <label className="block text-sm text-slate-700">{title}{children ? <select {...props}>{children}</select> : <input {...props} type={type} maxLength={maxLength} />}</label>
}

function ActionForm({ title, action, submit, children, disabled, transform = value => value }) {
  const [review, setReview] = useState(null)
  const [generation, setGeneration] = useState(0)
  const [error, setError] = useState('')
  const needsReview = ['set_member', 'propose_grant'].includes(action)
  return <form className={panel} onSubmit={async event => {
    event.preventDefault()
    const form = event.currentTarget
    setError('')
    try {
      if (needsReview && !review) {
        const values = transform(Object.fromEntries(new FormData(form)))
        const lines = [...form.elements].filter(el => el.name).map(el => ({
          name: el.name,
          label: el.closest('label')?.firstChild?.textContent || el.name,
          value: el.tagName === 'SELECT' ? el.selectedOptions[0]?.textContent : el.value,
        }))
        setReview({ values, lines })
        return
      }
      const values = review?.values || transform(Object.fromEntries(new FormData(form)))
      if (await submit(action, values)) { setReview(null); setGeneration(value => value + 1) }
    } catch { setError('请检查日期和填写内容后重试。') }
  }}>
    <h3 className="font-semibold">{title}</h3>
    <fieldset key={generation} disabled={disabled || Boolean(review)} className="space-y-3">{children}</fieldset>
    {review && <div className="rounded-lg bg-amber-50 p-3 text-sm space-y-2">
      <h4 className="font-bold">提交前核对</h4>
      {review.lines.map(line => <p className="break-all" key={line.name}>{line.label}：{line.value || '未指定'}</p>)}
      <p>{action === 'set_member' ? '负责人将能查看该机构所有获授权学员，教练仅查看分配给自己的学员。' : '只创建邀请；仍须学员本人同意共享。'}</p>
      <button type="button" disabled={disabled} onClick={() => setReview(null)} className="text-blue-700">返回修改</button>
    </div>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <button className={button} disabled={disabled} type="submit">{review ? '确认提交' : needsReview ? '核对后继续' : title}</button>
  </form>
}

function WorkspaceSession({ userId }) {
  const [revision, setRevision] = useState(0)
  const [snapshot, setSnapshot] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    let active = true
    partnerWorkspace().then(data => {
      if (active) setSnapshot({ revision, data })
    }).catch(error => {
      if (active) setSnapshot({ revision, error: error.message })
    })
    return () => { active = false }
  }, [revision])
  useEffect(() => {
    const refresh = () => { setRevision(value => value + 1); setHidden(document.hidden) }
    const visibility = () => { if (document.hidden) setHidden(true); else refresh() }
    const timer = window.setInterval(() => { if (!document.hidden) refresh() }, 30000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', visibility)
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', visibility) }
  }, [])
  const current = !hidden ? snapshot : null
  const data = current?.data
  async function submit(action, values) {
    if (busy) return false
    setBusy(true)
    setNotice('')
    try {
      await partnerWorkspace(action, values)
      setNotice(action === 'propose_grant' ? '邀请已创建，学员同意后才会共享进度。' : '操作已保存。')
      return true
    } catch (error) {
      setNotice(error.message)
      return false
    } finally {
      setBusy(false)
      setRevision(value => value + 1)
    }
  }
  const orgOptions = <><option value="">请选择机构</option>{data?.organizations.map(org => <option key={org.id} value={org.id}>{org.name}{org.active ? '' : '（停用）'}</option>)}</>
  return <main className="min-h-screen bg-slate-50 px-4 py-6 pb-32 text-slate-900"><div className="mx-auto max-w-5xl space-y-5">
    <Link to="/profile" className="text-sm text-blue-700">← 返回个人中心</Link>
    <h1 className="text-2xl font-bold">合作与进度授权</h1>
    <p className="text-sm text-slate-600">导师只查看获授权的学员；机构负责人查看本机构获授权的学员，教练只查看分配给自己的学员。</p>
    <p className="break-all text-sm">我的账号编号：<code>{userId}</code></p>
    <button className={button} disabled={busy} onClick={() => setRevision(value => value + 1)}>刷新授权与进度</button>
    {notice && <p role="status" className="rounded-lg bg-blue-50 p-3 text-sm">{notice}</p>}
    {current?.error && <p role="alert" className="rounded-lg bg-amber-50 p-4">{current.error}</p>}
    {!current && <p role="status">正在核对授权…</p>}
    {data && <>
      <section className={panel}>
        <h2 className="text-lg font-bold">我的进度共享授权</h2>
        <p className="text-sm text-slate-600">同意后，共享姓名、目标岗位、申请阶段、简历和面试状态、测评分数、已完成任务数及同步时间。机构授权对机构负责人及指定教练可见。不共享联系方式、简历正文、证件、录音或订单。你可随时撤销，后续读取立即停止；对方页面每 30 秒重新核对权限，网络失败时清除摘要。</p>
        {!data.mine.length && <p className="text-sm text-slate-500">暂无邀请。请将上方账号编号提供给平台管理员进行分配。</p>}
        {data.mine.map(grant => <article className="rounded-lg border p-3 space-y-2" key={grant.id}>
          <h3 className="font-semibold">{grant.recipient}</h3><p className="text-sm">服务目的：{grant.purpose}</p>
          <p className="text-sm">{new Date(grant.expires_at) <= new Date() ? '已到期' : label(grant.status)} · 截止 {date(grant.expires_at)}</p>
          {grant.status === 'pending' && new Date(grant.expires_at) > new Date() && <button className={button} disabled={busy} onClick={() => submit('approve_grant', { grant_id: grant.id })}>同意共享上述进度</button>}
          {grant.status !== 'revoked' && <button className="ml-3 text-sm text-red-700 disabled:opacity-50" disabled={busy} onClick={() => submit('revoke_grant', { grant_id: grant.id })}>{grant.status === 'pending' ? '拒绝邀请' : '撤销共享'}</button>}
        </article>)}
      </section>
      <section className={panel}>
        <h2 className="text-lg font-bold">获授权的学员进度</h2>
        <p className="text-sm text-slate-600">仅显示最近同步的进度摘要，最多 200 条。进度来自学员记录，不代表就业结果或资格认证。页面每 30 秒核对一次权限。</p>
        {!data.learners.length && <p className="text-sm text-slate-500">暂无有效授权。请确认学员已同意、服务未到期且合作身份有效。</p>}
        <div className="grid gap-3 md:grid-cols-2">{data.learners.map(learner => <article key={learner.grant_id} className="rounded-lg border p-4 space-y-2 text-sm">
          <h3 className="text-base font-semibold">{learner.learner_name || '尚未填写姓名'}</h3>
          <p>{learner.organization_name} · {learner.purpose}</p>
          <p>目标岗位：{label(learner.target_position)} · {label(learner.career_stage)}</p>
          <p>简历：{label(learner.resume_status)} · 面试：{label(learner.interview_status)}</p>
          <p>任务：{learner.completed_tasks == null ? '尚未同步' : `${learner.completed_tasks} / 12`} · 测评：{learner.latest_assessment_score ?? '尚未同步'}</p>
          <p className="text-slate-500">同步时间：{date(learner.synced_at)}</p>
        </article>)}</div>
      </section>
      <PartnerServiceTasks isAdmin={data.is_admin} grants={data.grants} learners={data.learners} />
      {data.is_admin && <section className="space-y-4">
        <h2 className="text-xl font-bold">平台管理 · 合作关系</h2>
        <p className="text-sm text-slate-600">机构身份不附带管理员权限或付费课程权益。导师需已有有效认证。首次分配请核对学员和合作方账号编号；创建邀请不会代替学员同意。</p>
        <div className="grid gap-4 md:grid-cols-2">
          <ActionForm title="创建机构" action="create_organization" submit={submit} disabled={busy}><Field name="name" title="机构名称" maxLength={100} /></ActionForm>
          <ActionForm title="设置机构成员" action="set_member" submit={submit} disabled={busy}>
            <Field name="organization_id" title="所属机构">{orgOptions}</Field><PartnerAccountPicker name="user_id" title="机构成员" />
            <Field name="role" title="机构角色"><option value="coach">教练：仅自己分配的学员</option><option value="manager">负责人：本机构授权学员</option></Field>
          </ActionForm>
          <ActionForm title="邀请学员授权机构" action="propose_grant" submit={submit} disabled={busy} transform={values => ({ ...values, expires_at: new Date(values.expires_at).toISOString() })}>
            <PartnerAccountPicker name="learner_id" title="学员" /><Field name="organization_id" title="服务机构">{orgOptions}</Field>
            <PartnerAccountPicker name="assigned_coach_id" title="指定教练（需先加入所选机构）" required={false} />
            <Field name="purpose" title="服务目的（学员可见）" maxLength={200} /><Field name="expires_at" title="共享截止时间（最长一年）" type="datetime-local" />
          </ActionForm>
          <ActionForm title="邀请学员授权导师" action="propose_grant" submit={submit} disabled={busy} transform={values => ({ ...values, expires_at: new Date(values.expires_at).toISOString() })}>
            <PartnerAccountPicker name="learner_id" title="学员" /><PartnerAccountPicker name="mentor_id" title="已认证导师" kind="mentor" />
            <Field name="purpose" title="服务目的（学员可见）" maxLength={200} /><Field name="expires_at" title="共享截止时间（最长一年）" type="datetime-local" />
          </ActionForm>
        </div>
        <div className={panel}><h3 className="font-bold">机构与成员</h3>
          {data.organizations.map(org => <div key={org.id} className="border-b py-3 space-y-2">
            <p>{org.name} · {org.active ? '启用' : '停用'} <button className="ml-2 text-sm text-blue-700" disabled={busy} onClick={() => submit('set_organization', { organization_id: org.id, active: !org.active })}>{org.active ? '停用机构' : '恢复机构'}</button></p>
            {data.members.filter(member => member.organization_id === org.id).map(member => <p key={member.user_id} className="break-all text-xs">{member.user_id} · {member.role === 'manager' ? '负责人' : '教练'} · {member.active ? '启用' : '停用'} <button className="ml-2 text-blue-700" disabled={busy} onClick={() => submit('set_member', { ...member, active: !member.active })}>{member.active ? '停用成员' : '恢复成员'}</button></p>)}
          </div>)}
        </div>
        <div className={panel}><h3 className="font-bold">最近 200 条授权邀请</h3>
          {data.grants.map(grant => <div key={grant.id} className="border-b py-3 text-sm space-y-1">
            <p className="break-all">学员：{grant.learner_id}</p><p>{grant.purpose} · {label(grant.status)} · 截止 {date(grant.expires_at)}</p>
            <p className="break-all text-xs text-slate-500">接收方：{grant.organization_id || grant.mentor_id}</p>
            {grant.status !== 'revoked' && <button disabled={busy} className="text-red-700" onClick={() => submit('revoke_grant', { grant_id: grant.id })}>撤销此邀请或授权</button>}
          </div>)}
        </div>
      </section>}
    </>}
  </div></main>
}

export default function PartnerWorkspace() {
  const { userId, isRegistered, accessStatus } = useAccessStore()
  if (!isRegistered || !userId || accessStatus !== 'active') return <p className="p-8">请使用有效账号登录后查看合作授权。</p>
  return <WorkspaceSession key={`${userId}:${accessStatus}`} userId={userId} />
}
