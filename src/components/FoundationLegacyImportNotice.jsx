import { useEffect, useState } from 'react'
import { CheckCircle2, CloudDownload, History, X } from 'lucide-react'
import useEffectiveAccess from '../hooks/useEffectiveAccess'
import { getLegacyFoundationImport, importLegacyFoundationProgress } from '../services/foundationLegacyImportService'

export default function FoundationLegacyImportNotice() {
  const access = useEffectiveAccess()
  const userId = access.isRegistered && !access.isPreviewing ? access.userId : null
  const [state, setState] = useState({ userId, plan: null, hidden: false, confirming: false, importing: false, result: '' })
  const current = state.userId === userId ? state : { userId, plan: null, hidden: false, confirming: false, importing: false, result: '' }

  useEffect(() => {
    if (!userId) return undefined
    let active = true
    Promise.resolve().then(() => {
      if (active) setState({ userId, plan: getLegacyFoundationImport(userId), hidden: false, confirming: false, importing: false, result: '' })
    })
    return () => { active = false }
  }, [userId])

  if (!userId || current.hidden || (!current.plan && !current.result)) return null

  const importProgress = async () => {
    setState((value) => ({ ...value, importing: true, result: '' }))
    try {
      const result = await importLegacyFoundationProgress(userId)
      setState((value) => ({
        ...value,
        importing: false,
        confirming: false,
        plan: result.status === 'done' ? null : getLegacyFoundationImport(userId),
        result: result.status === 'done'
          ? '旧学习记录已合并到当前账户，原本机记录仍然保留。'
          : '记录已保存到当前账户的本机分区，云端暂未同步。你可以稍后重试。',
      }))
    } catch {
      setState((value) => ({
        ...value,
        importing: false,
        result: '暂时无法读取或保存本机记录，请检查浏览器存储权限后重试。',
      }))
    }
  }

  if (current.result && !current.plan) {
    return (
      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm" role="status">
        <div className="flex items-start gap-3"><CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-700" /><div><h2 className="font-bold text-emerald-950">旧学习记录已导入</h2><p className="mt-1 text-sm leading-6 text-emerald-900">{current.result}</p></div></div>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm" aria-labelledby="legacy-progress-title">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-amber-700"><History size={20} /></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div><h2 id="legacy-progress-title" className="font-bold text-amber-950">发现此设备上的旧课程记录</h2><p className="mt-1 text-sm leading-6 text-amber-900">确认这些记录属于你后，可以合并到当前账户。导入不会删除原记录，也不会覆盖账户中较新的学习证据。</p></div>
            <button type="button" onClick={() => setState((value) => ({ ...value, hidden: true }))} aria-label="以后再处理旧课程记录" className="rounded-md p-1 text-amber-700 hover:bg-amber-100"><X size={18} /></button>
          </div>
          <div className="mt-3 space-y-2">
            {current.plan.summary.map((item) => <div key={item.jobKey} className="rounded-lg bg-white/80 px-3 py-2 text-sm text-amber-950"><strong>{item.title}</strong><span className="ml-2 text-xs text-amber-800">完成 {item.completedDays}/{item.totalDays} 天 · 收藏 {item.savedLineCount} 条{item.hasPlacement ? ' · 有入门检查' : ''}</span></div>)}
          </div>
          {current.result && <p className="mt-3 text-sm font-medium text-amber-900" role="status">{current.result}</p>}
          {!current.confirming ? (
            <button type="button" onClick={() => setState((value) => ({ ...value, confirming: true }))} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-amber-700 px-4 text-sm font-semibold text-white"><CloudDownload size={17} />查看并导入</button>
          ) : (
            <div className="mt-3 rounded-lg border border-amber-300 bg-white p-3"><p className="text-sm leading-6 text-gray-700">这些记录将绑定到当前账户 <strong>{access.userEmail || '当前登录账户'}</strong>。请确认它们确实属于你。</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={current.importing} onClick={importProgress} className="min-h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white disabled:bg-gray-300">{current.importing ? '正在导入…' : '确认导入到当前账户'}</button><button type="button" disabled={current.importing} onClick={() => setState((value) => ({ ...value, confirming: false }))} className="min-h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700">取消</button></div></div>
          )}
        </div>
      </div>
    </section>
  )
}
