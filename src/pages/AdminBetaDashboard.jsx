import { createElement, useEffect, useMemo, useState } from 'react'
import { Activity, ArrowLeft, BarChart3, CircleAlert, Clock3, Coins, FileText, LoaderCircle, MessageSquareText, Mic2, RefreshCcw, UserCheck, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { buildConversionFunnel, buildTargetRoleBreakdown, CONVERSION_EVENT_NAMES } from '../data/productFunnel'

const countEvents = (events, name) => events.filter((event) => event.event_name === name).length

const feedbackCount = (events, response) => events.filter(
  (event) => event.event_name === 'quick_feedback_submitted' && event.properties?.response === response,
).length

const fetchProductEvents = async (since, until) => {
  const pageSize = 1000
  const allEvents = []

  for (let offset = 0; ; offset += pageSize) {
    const result = await supabase
      .from('product_events')
      .select('id, user_id, anonymous_id, event_name, route, product_code, properties, created_at')
      .in('event_name', CONVERSION_EVENT_NAMES)
      .gte('created_at', since)
      .lte('created_at', until)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (result.error) return result
    allEvents.push(...(result.data || []))
    if ((result.data || []).length < pageSize) return { data: allEvents, error: null }
  }
}

export default function AdminBetaDashboard() {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [requests, setRequests] = useState([])
  const [overview, setOverview] = useState(null)
  const [aiOverview, setAiOverview] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  const load = async () => {
    setStatus('loading')
    setError('')
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    const until = new Date().toISOString()

    const [eventsResult, requestsResult, purchasesResult, activationsResult, overviewResult, aiOverviewResult] = await Promise.all([
      fetchProductEvents(since, until),
      supabase
        .from('support_requests')
        .select('id, category, message, status, created_at')
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('manual_purchase_requests')
        .select('id, user_id, product_code, created_at')
        .gte('created_at', since)
        .lte('created_at', until),
      supabase
        .from('activation_codes')
        .select('code, used_by, product_code, used_at')
        .not('used_at', 'is', null)
        .gte('used_at', since)
        .lte('used_at', until),
      supabase.rpc('get_admin_beta_overview', { input_days: 14 }),
      supabase.rpc('get_admin_ai_operations_overview', { input_days: 14 }),
    ])

    if (eventsResult.error || requestsResult.error || purchasesResult.error || activationsResult.error || overviewResult.error) {
      setError(eventsResult.error?.message || requestsResult.error?.message || purchasesResult.error?.message || activationsResult.error?.message || overviewResult.error?.message || '内测数据暂时无法加载。')
      setStatus('error')
      return
    }

    const clientEvents = (eventsResult.data || []).filter(
      (event) => !['purchase_request_submitted', 'activation_succeeded'].includes(event.event_name),
    )
    const purchaseEvents = (purchasesResult.data || []).map((request) => ({
      id: `purchase:${request.id}`,
      user_id: request.user_id,
      anonymous_id: null,
      event_name: 'purchase_request_submitted',
      product_code: request.product_code,
      properties: { source: 'database' },
      created_at: request.created_at,
    }))
    const activationEvents = (activationsResult.data || []).map((activation) => ({
      id: `activation:${activation.code}`,
      user_id: activation.used_by,
      anonymous_id: null,
      event_name: 'activation_succeeded',
      product_code: activation.product_code,
      properties: { source: 'database' },
      created_at: activation.used_at,
    }))

    setEvents([...clientEvents, ...purchaseEvents, ...activationEvents])
    setRequests(requestsResult.data || [])
    setOverview(overviewResult.data || null)
    setAiOverview(aiOverviewResult.error ? null : aiOverviewResult.data || null)
    setStatus('ready')
  }

  useEffect(() => {
    const timer = window.setTimeout(load, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const funnel = useMemo(() => buildConversionFunnel(events), [events])
  const roleBreakdown = useMemo(() => buildTargetRoleBreakdown(events), [events])
  const stageById = useMemo(() => Object.fromEntries(funnel.map((stage) => [stage.id, stage])), [funnel])
  const openRequests = requests.filter((request) => request.status === 'open')

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-5 pb-7 pt-12">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <button type="button" onClick={() => navigate('/tasks')} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-700"><ArrowLeft size={16} />返回登船路径</button>
              <p className="text-sm font-medium text-blue-700">管理员 · 产品数据</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950">转化与使用观察</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">近 14 天数据。独立用户按登录账号与浏览器标识合并，用于判断用户在哪一步退出。</p>
            </div>
            <button type="button" onClick={load} disabled={status === 'loading'} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 disabled:opacity-60"><RefreshCcw size={16} className={status === 'loading' ? 'animate-spin' : ''} />刷新</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-5 py-6">
        {status === 'loading' && <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-600"><LoaderCircle size={18} className="animate-spin" />正在读取内测数据...</div>}
        {status === 'error' && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p>{error}</p><button type="button" onClick={load} className="mt-2 font-semibold underline underline-offset-2">重新读取</button></div>}
        {status === 'ready' && <>
          <section>
            <div className="mb-3">
              <h2 className="font-semibold text-slate-950">用户与训练概览</h2>
              <p className="mt-1 text-sm text-slate-600">注册总数为历史累计，其余为近 14 天实际入库数据。</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Metric icon={Users} label="累计注册" value={overview?.registered_total || 0} detail={`近 14 天新增 ${overview?.registered_period || 0}`} />
              <Metric icon={UserCheck} label="邮箱已确认" value={overview?.confirmed_period || 0} detail="近 14 天完成验证" tone="emerald" />
              <Metric icon={BarChart3} label="职业测评" value={overview?.assessment_period || 0} detail="近 14 天保存记录" />
              <Metric icon={FileText} label="AI 报告用户" value={stageById.career_report_generated?.actorCount || 0} detail={`${overview?.career_report_period || 0} 个报告版本`} />
              <Metric icon={Mic2} label="场景训练" value={overview?.scenario_session_period || 0} detail="近 14 天完成会话" />
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="font-semibold text-slate-950">最近注册用户</h2>
              <p className="mt-1 text-sm text-slate-600">用于确认用户注册后是否继续完成测评、报告和场景训练。</p>
            </div>
            {overview?.recent_users?.length ? (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-[760px] w-full text-left text-sm">
                  <thead className="border-b border-slate-200 text-xs text-slate-500">
                    <tr><th className="py-3 pr-4 font-medium">用户</th><th className="py-3 pr-4 font-medium">注册时间</th><th className="py-3 pr-4 font-medium">邮箱</th><th className="py-3 pr-4 font-medium">测评</th><th className="py-3 pr-4 font-medium">AI 报告</th><th className="py-3 font-medium">场景训练</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overview.recent_users.map((user) => (
                      <tr key={user.id}>
                        <td className="py-3 pr-4"><p className="font-medium text-slate-900">{user.email || '未提供邮箱'}</p><p className="mt-1 text-xs text-slate-400">{user.plan === 'premium' ? '付费会员' : '免费用户'}</p></td>
                        <td className="py-3 pr-4 text-slate-600">{new Date(user.created_at).toLocaleString('zh-CN')}</td>
                        <td className="py-3 pr-4"><StatusPill active={Boolean(user.email_confirmed_at)} activeText="已确认" inactiveText="未确认" /></td>
                        <td className="py-3 pr-4 font-medium text-slate-700">{user.assessment_count}</td>
                        <td className="py-3 pr-4 font-medium text-slate-700">{user.career_report_count}</td>
                        <td className="py-3 font-medium text-slate-700">{user.scenario_session_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="mt-4 text-sm text-slate-500">还没有注册用户。</p>}
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <Metric icon={Users} label="完成三场体验" value={stageById.free_trial_completed?.actorCount || 0} detail={`${stageById.free_trial_viewed?.actorCount || 0} 人进入免费体验`} />
            <Metric icon={MessageSquareText} label="快速反馈" value={countEvents(events, 'quick_feedback_submitted')} detail={`清楚 ${feedbackCount(events, 'clear')} · 犹豫 ${feedbackCount(events, 'uncertain')} · 卡住 ${feedbackCount(events, 'blocked')}`} />
            <Metric icon={CircleAlert} label="待处理支持单" value={openRequests.length} detail={`共读取 ${requests.length} 条最近记录`} tone={openRequests.length ? 'amber' : 'emerald'} />
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2"><Activity size={19} className="text-blue-700" /><h2 className="font-semibold text-slate-950">AI 运行健康度</h2></div>
            <p className="mt-1 text-sm text-slate-600">近 14 天，只统计动作、耗时、错误码和成本估算，不保存录音或完整回答。</p>
            {aiOverview ? <>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric icon={Activity} label="成功率" value={`${aiOverview.success_rate || 0}%`} detail={`${aiOverview.success_count || 0} 成功 · ${aiOverview.failure_count || 0} 失败`} tone={Number(aiOverview.success_rate) >= 95 ? 'emerald' : 'amber'} />
                <Metric icon={Mic2} label="ASR 总时长" value={`${aiOverview.asr_seconds || 0}s`} detail="成功转写累计秒数" />
                <Metric icon={Clock3} label="平均耗时" value={`${aiOverview.average_latency_ms || 0}ms`} detail={`${aiOverview.request_count || 0} 次请求`} />
                <Metric icon={Coins} label="ASR 估算" value={`¥${Number(aiOverview.estimated_cost_cny || 0).toFixed(4)}`} detail="以当前配置单价估算" />
              </div>
              <div className="mt-4 rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">失败码 Top 5</p>
                {aiOverview.top_errors?.length
                  ? <div className="mt-3 flex flex-wrap gap-2">{aiOverview.top_errors.map((item) => <span key={item.error_code} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700">{item.error_code} · {item.count}</span>)}</div>
                  : <p className="mt-2 text-sm text-slate-500">当前统计期没有 AI 失败记录。</p>}
              </div>
            </> : <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">运行 `supabase_ai_observability_and_career_guard.sql` 后，这里会开始显示成功率、ASR 秒数、耗时与失败码。</div>}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2"><BarChart3 size={19} className="text-blue-700" /><h2 className="font-semibold text-slate-950">测评到激活的完整漏斗</h2></div>
            <p className="mt-1 text-sm text-slate-600">大数字是独立用户；转化率只计算同时出现在相邻两步的人。登录是条件节点；购买申请和激活以数据库记录为准。</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {funnel.map((stage, index) => (
                <div key={stage.id} className={`rounded-lg border p-4 ${stage.optional ? 'border-amber-200 bg-amber-50' : 'border-slate-100 bg-slate-50'}`}>
                  <p className="text-xs leading-5 text-slate-500">{index + 1}. {stage.label}</p>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <p className="text-2xl font-semibold text-slate-950">{stage.actorCount}</p>
                    {stage.conversionFromPrevious != null && <p className="text-sm font-semibold text-blue-700">{stage.conversionFromPrevious}%</p>}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{stage.optional ? '条件节点' : stage.conversionFromPrevious == null ? '漏斗起点' : `${stage.continuedActorCount} 人承接上一步`} · {stage.eventCount} 次事件</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2"><FileText size={19} className="text-blue-700" /><h2 className="font-semibold text-slate-950">职业报告目标岗位</h2></div>
            <p className="mt-1 text-sm text-slate-600">按生成过报告的独立用户统计，同一用户重复生成不会重复计入同一岗位。</p>
            {roleBreakdown.length ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {roleBreakdown.map((item) => <div key={item.role} className="rounded-lg bg-slate-50 p-4"><p className="text-sm text-slate-600">{item.label}</p><p className="mt-2 text-2xl font-semibold text-slate-950">{item.count}</p></div>)}
              </div>
            ) : <p className="mt-4 text-sm text-slate-500">新埋点上线后，这里会开始显示岗位兴趣分布。</p>}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-950">最近支持单</h2><p className="mt-1 text-sm text-slate-600">优先处理 AI 训练、登录权益和付款问题。</p></div><button type="button" onClick={() => navigate('/support')} className="text-sm font-semibold text-blue-700 underline underline-offset-2">打开支持中心</button></div>
            {requests.length ? <div className="mt-4 divide-y divide-slate-100">{requests.slice(0, 10).map((request) => <article key={request.id} className="py-4 first:pt-0"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-slate-900">{request.category}</p><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${request.status === 'open' ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{request.status}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{request.message}</p><p className="mt-2 text-xs text-slate-400">{new Date(request.created_at).toLocaleString('zh-CN')}</p></article>)}</div> : <p className="mt-4 text-sm text-slate-500">还没有支持单。</p>}
          </section>
        </>}
      </main>
    </div>
  )
}

function StatusPill({ active, activeText, inactiveText }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${active ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>{active ? activeText : inactiveText}</span>
}

function Metric({ icon: Icon, label, value, detail, tone = 'blue' }) {
  const tones = {
    blue: 'border-blue-100 bg-blue-50 text-blue-950',
    amber: 'border-amber-200 bg-amber-50 text-amber-950',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  }

  return (
    <section className={`rounded-lg border p-4 ${tones[tone]}`}>
      <div className="flex items-center gap-2 text-sm font-medium">{createElement(Icon, { size: 17 })}{label}</div>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      <p className="mt-2 text-xs leading-5 opacity-75">{detail}</p>
    </section>
  )
}
