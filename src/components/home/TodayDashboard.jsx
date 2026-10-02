import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  RefreshCw,
  Target,
} from 'lucide-react'
import useEffectiveAccess from '../../hooks/useEffectiveAccess'
import { getHomeDashboard } from '../../services/homeDashboardService'

const formatDate = (value) => {
  if (!value) return ''
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' }).format(new Date(value))
}

const LoadingState = () => (
  <div className="mx-auto max-w-5xl animate-pulse px-5 py-10">
    <div className="h-4 w-20 rounded bg-slate-200" />
    <div className="mt-3 h-9 w-52 rounded bg-slate-200" />
    <div className="mt-8 h-40 rounded-lg bg-white" />
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <div className="h-56 rounded-lg bg-white" />
      <div className="h-56 rounded-lg bg-white" />
    </div>
  </div>
)

export default function TodayDashboard() {
  const navigate = useNavigate()
  const access = useEffectiveAccess()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isPartial, setIsPartial] = useState(false)

  const loadDashboard = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true)
    setError('')
    try {
      const result = await getHomeDashboard({
        isAdmin: access.isAdmin,
        role: access.role,
        productEntitlements: access.productEntitlements,
      })
      setDashboard(result.dashboard)
      setIsPartial(result.isPartial)
    } catch (loadError) {
      console.error('Unable to load Today dashboard:', loadError)
      setError('暂时无法读取你的最新训练进度。')
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [access.isAdmin, access.productEntitlements, access.role])

  useEffect(() => {
    const timeout = window.setTimeout(() => loadDashboard(), 0)
    return () => window.clearTimeout(timeout)
  }, [loadDashboard])

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') loadDashboard({ quiet: true })
    }
    const refreshOnPageShow = () => loadDashboard({ quiet: true })
    window.addEventListener('focus', refreshWhenVisible)
    window.addEventListener('pageshow', refreshOnPageShow)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    return () => {
      window.removeEventListener('focus', refreshWhenVisible)
      window.removeEventListener('pageshow', refreshOnPageShow)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [loadDashboard])

  if (loading && !dashboard) return <LoadingState />

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-slate-50 px-5 py-16">
        <div className="mx-auto max-w-lg rounded-lg border border-red-200 bg-white p-6 text-center">
          <AlertCircle className="mx-auto text-red-600" size={26} />
          <h1 className="mt-3 text-lg font-semibold text-slate-950">首页进度读取失败</h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <button type="button" onClick={() => loadDashboard()} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white">
            <RefreshCw size={16} />重新读取
          </button>
        </div>
      </div>
    )
  }

  const { targetRole, readiness, gap, todayAction, routeProgress, latestFeedback } = dashboard
  const upcomingItems = routeProgress.items?.filter((item) => !item.completed).slice(0, 3) || []

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-5 pb-7 pt-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-blue-700">今天</p>
              <h1 className="mt-1 text-3xl font-semibold text-slate-950">继续为目标岗位做准备</h1>
              <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                <Target size={16} className="text-blue-700" />
                当前目标：<strong className="font-semibold text-slate-900">{targetRole.label}</strong>
              </p>
            </div>
            <button type="button" onClick={() => loadDashboard()} className="inline-flex min-h-10 items-center gap-2 self-start rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700">
              <RefreshCw size={15} />刷新进度
            </button>
          </div>
          {isPartial && (
            <p className="mt-4 flex items-center gap-2 text-xs text-amber-700">
              <AlertCircle size={14} />部分云端记录暂时未读取，当前先显示已同步的训练进度。
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-5 py-7">
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-500">{readiness.metricLabel}</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {readiness.score == null ? '--' : readiness.score}
              {readiness.score != null && <span className="ml-1 text-sm font-semibold text-slate-400">/100</span>}
            </p>
            <p className="mt-1 text-xs text-slate-600">{readiness.label}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-500">训练证据</p>
            <p className="mt-2 text-3xl font-bold text-blue-700">{readiness.evidencePercent}%</p>
            <p className="mt-1 text-xs text-slate-600">完成更多实训后判断会更准确</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-500">{routeProgress.isBarPlan ? '14 天路线' : '求职路线'}</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">{routeProgress.completedCount}<span className="ml-1 text-sm font-semibold text-slate-400">/{routeProgress.total}</span></p>
            <p className="mt-1 text-xs text-slate-600">已完成 {routeProgress.percent}%</p>
          </div>
        </section>

        <section className="border-l-4 border-blue-600 bg-white px-5 py-5 shadow-sm">
          <p className="text-xs font-semibold text-blue-700">{todayAction.label}</p>
          <div className="mt-2 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">{todayAction.title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{todayAction.detail}</p>
            </div>
            <button type="button" onClick={() => navigate(todayAction.route)} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800">
              继续训练<ArrowRight size={17} />
            </button>
          </div>
        </section>

        <div className="grid gap-5 md:grid-cols-2">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <BarChart3 size={19} className="text-amber-700" />
              <h2 className="font-semibold text-slate-950">当前最大短板</h2>
            </div>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">{gap.label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{gap.detail}</p>
              </div>
              {gap.score != null && <span className="shrink-0 text-2xl font-bold text-amber-700">{gap.score}</span>}
            </div>
            <button type="button" onClick={() => navigate(gap.route)} className="mt-5 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-blue-700">
              {gap.action || '去完成这一步'}<ArrowRight size={15} />
            </button>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ClipboardList size={19} className="text-blue-700" />
                <h2 className="font-semibold text-slate-950">最近训练反馈</h2>
              </div>
              {latestFeedback?.completedAt && <span className="text-xs text-slate-400">{formatDate(latestFeedback.completedAt)}</span>}
            </div>
            {latestFeedback ? (
              <>
                <div className="mt-4 flex items-baseline justify-between gap-4">
                  <p className="text-sm font-semibold text-slate-900">{latestFeedback.type}</p>
                  <p className="text-2xl font-bold text-slate-950">{latestFeedback.score}<span className="text-xs text-slate-400">/100</span></p>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{latestFeedback.detail}</p>
                <button type="button" onClick={() => navigate(latestFeedback.route)} className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-blue-700">查看并继续<ArrowRight size={15} /></button>
              </>
            ) : (
              <div className="mt-4 rounded-lg bg-slate-50 p-4">
                <p className="text-sm leading-6 text-slate-600">完成一次岗位场景或班次挑战后，这里会保留最近的得分和改进重点。</p>
              </div>
            )}
          </section>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold text-blue-700"><CalendarDays size={16} />{routeProgress.isBarPlan ? '14 天岗位路线' : '完整求职路线'}</p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">{routeProgress.completedCount}/{routeProgress.total} 已完成</h2>
            </div>
            <span className="text-sm font-bold text-slate-700">{routeProgress.percent}%</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full bg-blue-600 transition-all" style={{ width: `${routeProgress.percent}%` }} />
          </div>
          {upcomingItems.length > 0 && (
            <div className="mt-5 divide-y divide-slate-100 border-y border-slate-100">
              {upcomingItems.map((item, index) => (
                <button key={item.id} type="button" onClick={() => navigate(item.route)} className="flex w-full items-center gap-3 py-3 text-left">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${index === 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{item.completed ? <Check size={14} /> : item.day}</span>
                  <span className="min-w-0 flex-1 text-sm font-medium text-slate-800">{item.title}</span>
                  <ChevronRight size={16} className="text-slate-400" />
                </button>
              ))}
            </div>
          )}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <button type="button" onClick={() => navigate(routeProgress.isBarPlan ? '/programs/bar-server' : '/tasks')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700"><BookOpenCheck size={16} />全部训练</button>
            <button type="button" onClick={() => navigate(routeProgress.isBarPlan ? (dashboard.hasBarServerPack ? '/programs/bar-server/report' : '/programs/bar-server/trial') : '/assessment')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700"><BarChart3 size={16} />查看报告</button>
            <button type="button" onClick={() => navigate('/profile')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700"><Target size={16} />我的目标</button>
          </div>
        </section>
      </main>
    </div>
  )
}

