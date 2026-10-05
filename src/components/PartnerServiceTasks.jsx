import { useEffect, useState } from 'react'
import { partnerServiceTasks } from '../services/partnerWorkspaceService'

const button = 'rounded-lg bg-blue-700 px-3 py-2 text-sm text-white disabled:opacity-50'
const input = 'mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm'
const types = { consultation: '关键节点咨询', mock_interview: '真人模拟面试' }
const states = { pending: '待安排', proposed: '待学员确认时间', scheduled: '已预约', awaiting_confirmation: '待学员确认完成', completed: '学员已确认完成', disputed: '有异议 · 待平台处理', cancelled: '已取消' }
const format = value => value ? new Date(value).toLocaleString('zh-CN') : '尚未安排'

function TaskCard({ task, busy, run, isAdmin, checkedAt }) {
  const [cancelReview, setCancelReview] = useState(false)
  const closed = ['completed', 'cancelled'].includes(task.status)
  const field = async (event, action) => {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    if (values.scheduled_at) values.scheduled_at = new Date(values.scheduled_at).toISOString()
    await run(action, { ...values, task_id: task.id, expected_version: task.version })
  }
  const action = name => run(name, { task_id: task.id, expected_version: task.version })
  return <article className="rounded-lg border border-slate-200 p-4 space-y-3">
    <div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{types[task.service_type]} · {task.duration_minutes} 分钟</h3><span className="text-sm text-blue-800">{states[task.status]}</span></div>
    <p className="text-sm">学员：{task.learner_name || '未填写姓名'} · 执行导师：{task.provider_name} · {task.organization_name}</p>
    <p className="text-sm">服务时间：{format(task.scheduled_at)}（当前设备时区）</p>
    <p className="text-xs text-slate-500">最后更新：{format(task.updated_at)}</p>
    {task.completion_note && <p className="whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-sm">服务记录：{task.completion_note}</p>}
    {task.dispute_note && <p className="whitespace-pre-wrap break-words rounded-lg bg-amber-50 p-3 text-sm">学员异议：{task.dispute_note}</p>}
    {!closed && !task.access_active && <p className="text-sm text-amber-800">授权或执行导师状态已失效，履约操作暂停；平台可处理取消；学员可取消尚未报完成的任务。</p>}
    {task.access_active && !closed && <>
      {task.can_manage && ['pending', 'proposed', 'scheduled'].includes(task.status) && <form className="space-y-2" onSubmit={event => field(event, 'propose_time')}>
        <label className="block text-sm">提出服务时间<input className={input} name="scheduled_at" type="datetime-local" required /></label>
        <p className="text-xs text-slate-500">与学员沟通后提出时间；改期后需学员重新确认，服务须在授权到期前结束。</p>
        <button disabled={busy} className={button}>提交时间供学员确认</button>
      </form>}
      {task.is_learner && task.status === 'proposed' && <button disabled={busy || new Date(task.scheduled_at).getTime() <= checkedAt} className={button} onClick={() => action('accept_time')}>确认这个预约时间</button>}
      {task.can_manage && task.status === 'scheduled' && <form className="space-y-2" onSubmit={event => field(event, 'report_delivery')}>
        <label className="block text-sm">本次服务记录<textarea className={input} name="note" maxLength={1000} required rows={3} placeholder="记录已提供的辅导内容与后续建议" /></label>
        <p className="text-xs text-slate-500">预约时段结束后可报完成；服务记录对学员、执行导师、机构负责人及平台可见。</p>
        <button disabled={busy || checkedAt < new Date(task.scheduled_at).getTime() + task.duration_minutes * 60000} className={button}>报完成，等待学员确认</button>
      </form>}
      {task.is_learner && task.status === 'awaiting_confirmation' && <div className="space-y-3">
        <button disabled={busy} className={button} onClick={() => action('confirm_delivery')}>确认本次服务已完成</button>
        <form className="space-y-2" onSubmit={event => field(event, 'dispute')}>
          <label className="block text-sm">若有异议，请说明<textarea className={input} name="note" required maxLength={1000} rows={2} /></label>
          <button disabled={busy} className="text-sm text-amber-800">提交异议，交由平台核对</button>
        </form>
      </div>}
      {task.status === 'disputed' && <p className="text-sm text-amber-800">等待平台线下核对。存在异议的服务不会自动标记完成。</p>}
    </>}
    {task.can_cancel && !closed && (!['awaiting_confirmation', 'disputed'].includes(task.status) || isAdmin) && <div className="space-y-2">
      {cancelReview && <p className="text-sm">取消后将关闭此任务，保留记录。如需重新安排，应另建服务任务。</p>}
      <button disabled={busy} className="text-sm text-red-700" onClick={() => cancelReview ? action('cancel') : setCancelReview(true)}>{cancelReview ? '确认取消此服务任务' : '取消服务任务'}</button>
      {cancelReview && <button disabled={busy} className="ml-3 text-sm" onClick={() => setCancelReview(false)}>保留任务</button>}
    </div>}
  </article>
}

export default function PartnerServiceTasks({ isAdmin, grants = [], learners = [] }) {
  const [snapshot, setSnapshot] = useState(null)
  const [revision, setRevision] = useState(0)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID())
  useEffect(() => {
    let active = true
    partnerServiceTasks().then(data => { if (active) setSnapshot({ data, checkedAt: Date.now() }) }).catch(error => { if (active) setSnapshot({ error: error.message }) })
    return () => { active = false }
  }, [revision])
  useEffect(() => {
    const refresh = () => setRevision(value => value + 1)
    const timer = window.setInterval(() => { if (!document.hidden) refresh() }, 30000)
    window.addEventListener('focus', refresh)
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [])
  async function run(action, values) {
    if (busy) return false
    setBusy(true)
    setNotice('')
    try {
      await partnerServiceTasks(action, values)
      setNotice('服务任务已更新。')
      return true
    } catch (error) {
      setNotice(error.message)
      return false
    } finally { setBusy(false); setRevision(value => value + 1) }
  }
  const availableGrants = grants.filter(grant => grant.status === 'approved' && (grant.mentor_id || grant.assigned_coach_id) && learners.some(learner => learner.grant_id === grant.id))
  return <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
    <h2 className="text-lg font-bold">咨询与真人模拟面试 · 服务任务</h2>
    <p className="text-sm text-slate-600">提出时间 → 学员确认预约 → 导师提交服务记录 → 学员确认完成。确认预约后，履约状态和服务记录对学员、执行导师、机构负责人及平台可见。此处记录履约，不自动收款或结算。最多展示最近 200 条。</p>
    {notice && <p role="status" className="rounded-lg bg-blue-50 p-3 text-sm">{notice}</p>}
    <button className="text-sm text-blue-700" disabled={busy} onClick={() => setRevision(value => value + 1)}>刷新服务任务</button>
    {!snapshot && <p role="status">正在读取服务任务…</p>}
    {snapshot?.error && <p role="alert" className="text-sm text-amber-800">{snapshot.error}</p>}
    {snapshot?.data && <>
      {isAdmin && <form key={requestKey} className="space-y-3 rounded-lg bg-slate-50 p-4" onSubmit={async event => {
        event.preventDefault()
        const values = Object.fromEntries(new FormData(event.currentTarget))
        if (await run('create', { ...values, duration_minutes: Number(values.duration_minutes), request_key: requestKey })) setRequestKey(crypto.randomUUID())
      }}>
        <h3 className="font-semibold">创建服务任务</h3>
        <label className="block text-sm">已获同意且已指定执行导师的授权<select name="grant_id" className={input} required>
          <option value="">请选择服务对象</option>
          {availableGrants.map(grant => <option key={grant.id} value={grant.id}>{learners.find(learner => learner.grant_id === grant.id)?.learner_name || grant.learner_id} · {grant.purpose} · {grant.id}</option>)}
        </select></label>
        <p className="text-xs text-slate-500">机构授权须已指定教练。执行人取自此授权，不另外扩大访问范围。</p>
        <label className="block text-sm">服务类型<select name="service_type" className={input}><option value="consultation">关键节点咨询</option><option value="mock_interview">真人模拟面试</option></select></label>
        <label className="block text-sm">服务时长<select name="duration_minutes" className={input}><option value="30">30 分钟</option><option value="60">60 分钟</option></select></label>
        <button disabled={busy || !availableGrants.length} className={button}>创建任务</button>
      </form>}
      {!snapshot.data.tasks.length && <p className="text-sm text-slate-500">暂无服务任务。平台分配后，学员与对应导师可在这里安排和确认服务。</p>}
      {snapshot.data.tasks.map(task => <TaskCard key={`${task.id}:${task.version}`} task={task} busy={busy} run={run} isAdmin={isAdmin} checkedAt={snapshot.checkedAt} />)}
    </>}
  </section>
}
