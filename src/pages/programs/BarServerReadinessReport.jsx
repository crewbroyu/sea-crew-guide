import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  CircleAlert,
  Database,
  ShieldCheck,
  Target,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useEffectiveAccess from '../../hooks/useEffectiveAccess'
import {
  BAR_SERVER_SKILL_LABELS,
  getBarServerReadinessReport,
} from '../../data/barServerReadiness'
import useBarServerPracticeProgress from '../../hooks/useBarServerPracticeProgress'
import { readFoundationProgress } from '../../services/foundationProgressService'
import { getMyScenarioProfile } from '../../services/scenarioTrainingService'

const levelTone = {
  insufficient: 'border-slate-300 bg-slate-100 text-slate-700',
  not_ready: 'border-red-200 bg-red-50 text-red-800',
  developing: 'border-amber-200 bg-amber-50 text-amber-800',
  nearly_ready: 'border-blue-200 bg-blue-50 text-blue-800',
  stable: 'border-emerald-200 bg-emerald-50 text-emerald-800',
}

const scoreTone = (score) => {
  if (score >= 85) return 'bg-emerald-600'
  if (score >= 70) return 'bg-blue-600'
  if (score >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

export default function BarServerReadinessReport() {
  const navigate = useNavigate()
  const access = useEffectiveAccess()
  const { listeningProgress, shiftHistory, syncStatus } = useBarServerPracticeProgress()
  const [scenarioState, setScenarioState] = useState({ status: 'idle', profile: null, error: '' })

  useEffect(() => {
    if (!access.isRegistered) return undefined
    let active = true
    getMyScenarioProfile('bar_server')
      .then((profile) => {
        if (active) setScenarioState({ status: 'loaded', profile, error: '' })
      })
      .catch((error) => {
        console.warn('Unable to load Bar Server readiness profile:', error)
        if (active) setScenarioState({
          status: 'error',
          profile: null,
          error: '场景模拟结果暂时无法载入，其余训练记录仍可正常查看。',
        })
      })
    return () => { active = false }
  }, [access.isRegistered])

  const report = useMemo(() => getBarServerReadinessReport({
    foundationProgress: readFoundationProgress('bar_server'),
    listeningProgress,
    shiftHistory,
    scenarioProfile: scenarioState.profile,
  }), [listeningProgress, scenarioState.profile, shiftHistory])

  const scenarioLoading = access.isRegistered && scenarioState.status === 'idle'
  const scenarioError = scenarioState.error

  const foundation = report.dimensions.find((item) => item.id === 'foundation')
  const listening = report.dimensions.find((item) => item.id === 'listening')
  const speaking = report.dimensions.find((item) => item.id === 'speaking')
  const shift = report.dimensions.find((item) => item.id === 'shift')
  const scenario = report.dimensions.find((item) => item.id === 'scenario')
  const checks = [
    { label: '完成 9 天岗位基础课', passed: foundation.completed === foundation.total, value: foundation.evidence },
    { label: '至少 10 个听力场景达标', passed: listening.completed >= 10, value: listening.evidence },
    { label: '至少完成 8 个开口回应', passed: speaking.completed >= 8, value: speaking.evidence },
    { label: '最近一次班次挑战达到 70 分', passed: Number(shift.latestScore || 0) >= 70, value: shift.evidence },
    { label: '至少完成 2 个 AI 岗位场景', passed: scenario.completed >= 2, value: scenario.evidence },
  ]
  const skillEntries = Object.entries(report.skillScores)
    .filter(([key, score]) => BAR_SERVER_SKILL_LABELS[key] && Number.isFinite(Number(score)))

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-5 pb-8 pt-10">
          <button type="button" onClick={() => navigate('/programs/bar-server')} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700"><ArrowLeft size={17} />返回 Bar Server 学习包</button>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-blue-700"><BarChart3 size={18} />岗位准备度报告</p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight text-slate-950">不是学了多少，而是现在能不能处理真实班次</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">报告综合岗位知识、工作听力、现场回应、限时班次和 AI 场景模拟。未训练的部分按零计入，避免少量高分造成虚高结论。</p>
              <p className="mt-3 text-xs font-medium text-slate-500">{syncStatus === 'synced' ? '听说与班次记录已从账户同步' : syncStatus === 'local' ? '当前使用本机记录，联网后会再次同步' : '正在合并本机与账户记录…'}</p>
            </div>
            <div className="shrink-0 text-left md:text-right">
              <p className="text-xs font-semibold text-slate-500">综合准备度</p>
              <p className="mt-1 text-5xl font-bold text-slate-950">{report.overallScore}<span className="ml-1 text-base font-semibold text-slate-400">/100</span></p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-5 py-7">
        <section className={`border p-5 ${levelTone[report.level.id]}`}>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div><p className="text-xs font-semibold">当前判断</p><h2 className="mt-1 text-xl font-semibold">{report.level.label}</h2><p className="mt-2 max-w-2xl text-sm leading-6">{report.level.description}</p></div>
            <div className="shrink-0"><p className="text-xs font-semibold">证据完整度</p><p className="mt-1 text-2xl font-bold">{report.evidencePercent}%</p></div>
          </div>
        </section>

        {scenarioError && <p className="flex items-start gap-2 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"><CircleAlert size={18} className="mt-0.5 shrink-0" />{scenarioError}</p>}

        <section>
          <div className="flex items-center gap-2"><Target size={19} className="text-blue-700" /><h2 className="text-xl font-semibold text-slate-950">五项能力证据</h2></div>
          <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200 bg-white">
            {report.dimensions.map((dimension) => (
              <div key={dimension.id} className="grid gap-3 px-4 py-5 sm:grid-cols-[170px_minmax(0,1fr)_90px] sm:items-center">
                <div><p className="font-semibold text-slate-950">{dimension.label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{dimension.evidence}</p></div>
                <div><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className={`h-full ${scoreTone(dimension.score)}`} style={{ width: `${dimension.score}%` }} /></div><p className="mt-2 text-xs leading-5 text-slate-500">{dimension.description}</p></div>
                <p className="text-left text-2xl font-bold text-slate-950 sm:text-right">{dimension.score}<span className="text-xs font-semibold text-slate-400">/100</span></p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">下一步只练最影响结果的三项</h2>
            <div className="mt-4 space-y-3">
              {report.recommendations.length ? report.recommendations.map((item, index) => (
                <button key={item.id} type="button" onClick={() => navigate(item.route)} className="flex min-h-20 w-full items-center gap-4 border border-slate-200 bg-white px-4 py-3 text-left hover:border-blue-300">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700">{index + 1}</span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-950">{item.action}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{item.label}当前 {item.score} 分 · {item.evidence}</span></span>
                  <ArrowRight size={17} className="shrink-0 text-slate-400" />
                </button>
              )) : <p className="border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">五项能力均已达到稳定水平，继续定期完成班次挑战保持状态。</p>}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-950">最低上岗验证线</h2>
            <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200 bg-white px-4">
              {checks.map((check) => <div key={check.label} className="flex items-start gap-3 py-3"><span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${check.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>{check.passed ? <Check size={14} /> : <span className="h-2 w-2 rounded-full bg-current" />}</span><div><p className="text-sm font-medium text-slate-900">{check.label}</p><p className="mt-1 text-xs text-slate-500">{check.value}</p></div></div>)}
            </div>
            <p className={`mt-4 flex items-start gap-2 px-4 py-3 text-sm leading-6 ${report.readyForShift ? 'bg-emerald-50 text-emerald-900' : 'bg-slate-100 text-slate-700'}`}><ShieldCheck size={18} className="mt-0.5 shrink-0" />{report.readyForShift ? '已达到课程设定的最低班次验证线。' : '尚未同时达到五项最低线，不能仅凭综合分判断已经可以独立上岗。'}</p>
          </div>
        </section>

        {(scenarioLoading || skillEntries.length > 0) && (
          <section className="border-t border-slate-200 pt-7">
            <div className="flex items-center gap-2"><Database size={18} className="text-blue-700" /><h2 className="text-xl font-semibold text-slate-950">AI 岗位模拟能力</h2></div>
            {scenarioLoading ? <p className="mt-4 text-sm text-slate-500">正在从账户读取场景训练结果…</p> : <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{skillEntries.map(([key, score]) => <div key={key} className={`border-t-2 bg-white p-4 ${key === report.weakestSkill ? 'border-amber-500' : 'border-blue-500'}`}><p className="text-xs font-semibold text-slate-500">{BAR_SERVER_SKILL_LABELS[key]}{key === report.weakestSkill ? ' · 当前弱项' : ''}</p><p className="mt-2 text-2xl font-bold text-slate-950">{Math.round(Number(score))}</p></div>)}</div>}
          </section>
        )}

        <section className="border-t border-slate-200 pt-6 text-xs leading-5 text-slate-500">
          <p>本报告用于训练诊断，不代表邮轮公司录用、上岗授权或实际工作表现保证。班次挑战采用最近一次成绩；岗位模拟数据来自当前登录账户。</p>
        </section>
      </main>
    </div>
  )
}
