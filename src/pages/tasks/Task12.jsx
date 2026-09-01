import { CalendarClock, CheckCircle2, Circle, LoaderCircle, Save, Ship, TriangleAlert } from 'lucide-react'
import TaskLayout from '../../components/TaskLayout'
import useBoardingCase from '../../hooks/useBoardingCase'
import { completeTaskAndSyncPathProfile } from '../../services/userPathService'

const getDaysUntil = (dateValue) => {
  if (!dateValue) return null
  const target = new Date(`${dateValue}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

const getVisaReady = (boardingCase) => (
  boardingCase.us_visa_requirement === 'not_required'
  || (boardingCase.us_visa_requirement === 'required' && boardingCase.visa_status === 'issued')
)

export default function Task12() {
  const { boardingCase, updateBoardingCase, loading, saving, syncState, error, save } = useBoardingCase()
  const travelItems = boardingCase.travel_items || []
  const criticalItems = travelItems.filter((item) => item.critical)
  const criticalCompleted = criticalItems.filter((item) => item.completed).length
  const offerReady = boardingCase.offer_status === 'accepted' && boardingCase.offer_confirmed
  const documentsReady = boardingCase.document_items?.length > 0
    && boardingCase.document_items.every((item) => (
      ['ready', 'not_required'].includes(item.status)
      && !(item.status === 'ready' && item.expiry_date && boardingCase.embarkation_date && item.expiry_date < boardingCase.embarkation_date)
    ))
  const visaReady = getVisaReady(boardingCase)
  const travelReady = criticalItems.length > 0 && criticalCompleted === criticalItems.length
  const canComplete = offerReady && documentsReady && visaReady && travelReady
  const daysUntil = getDaysUntil(boardingCase.embarkation_date)

  const groupedItems = travelItems.reduce((groups, item) => {
    const category = item.category || '其他'
    return { ...groups, [category]: [...(groups[category] || []), item] }
  }, {})

  const toggleTravelItem = (id) => {
    updateBoardingCase((current) => ({
      ...current,
      travel_items: current.travel_items.map((item) => (
        item.id === id ? { ...item, completed: !item.completed } : item
      )),
    }))
  }

  const handleComplete = async () => {
    const readyCase = { ...boardingCase, overall_readiness: 'ready' }
    await save(readyCase)
    await completeTaskAndSyncPathProfile(12, {
      application_stage: 'boarding_ready',
      target_company: boardingCase.cruise_company || null,
      target_position: boardingCase.final_position || null,
      target_boarding_month: boardingCase.embarkation_date?.slice(0, 7) || null,
    })
  }

  const confirmBoarded = async () => {
    const boardedCase = {
      ...boardingCase,
      overall_readiness: 'boarded',
      boarded_at: new Date().toISOString(),
    }
    await save(boardedCase)
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600"><LoaderCircle size={20} className="mr-2 animate-spin" /> 正在汇总登船准备</div>
  }

  return (
    <TaskLayout taskId={12} taskTitle="登船出发工作台" canComplete={canComplete} onComplete={handleComplete}>
      <div className="space-y-5">
        <section className="rounded-lg border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-blue-800">{boardingCase.cruise_company || '船公司待确认'} · {boardingCase.final_position || '岗位待确认'}</p>
              <h2 className="mt-1 text-xl font-semibold text-blue-950">{boardingCase.embarkation_port || '登船港口待确认'}</h2>
              <p className="mt-1 text-sm text-blue-900">预计登船：{boardingCase.embarkation_date || '日期待确认'}</p>
            </div>
            <div className="rounded-lg bg-white px-3 py-2 text-center shadow-sm">
              <CalendarClock size={18} className="mx-auto text-blue-700" />
              <p className="mt-1 text-lg font-semibold text-slate-950">{daysUntil === null ? '--' : daysUntil < 0 ? '已到期' : daysUntil}</p>
              <p className="text-xs text-slate-500">{daysUntil !== null && daysUntil >= 0 ? '天后登船' : '倒计时'}</p>
            </div>
          </div>
        </section>

        {syncState === 'local' && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">当前进度已保存在此设备，建表后会同步到账号。</div>}
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">前置准备汇总</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Offer 已确认', ready: offerReady, action: '返回任务9核对条款' },
              { label: '证件已备妥', ready: documentsReady, action: '返回任务10更新状态' },
              { label: '签证已确认', ready: visaReady, action: '返回任务11确认要求' },
            ].map((item) => (
              <div key={item.label} className={`rounded-lg border p-3 ${item.ready ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                <div className="flex items-center gap-2">{item.ready ? <CheckCircle2 size={18} className="text-emerald-700" /> : <TriangleAlert size={18} className="text-amber-700" />}<p className={`text-sm font-semibold ${item.ready ? 'text-emerald-900' : 'text-amber-900'}`}>{item.label}</p></div>
                {!item.ready && <p className="mt-2 text-xs leading-5 text-amber-800">{item.action}</p>}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-end justify-between gap-4">
            <div><h2 className="font-semibold text-slate-950">出发准备</h2><p className="mt-1 text-sm text-slate-600">关键项目 {criticalCompleted} / {criticalItems.length}</p></div>
            <span className="text-sm font-semibold text-blue-700">标有“关键”的项目决定任务是否完成</span>
          </div>
          <div className="mt-5 space-y-5">
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-slate-800">{category}</h3>
                <div className="mt-2 space-y-2">
                  {items.map((item) => (
                    <button key={item.id} type="button" onClick={() => toggleTravelItem(item.id)} className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition ${item.completed ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 hover:border-blue-300'}`}>
                      {item.completed ? <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-700" /> : <Circle size={20} className="mt-0.5 shrink-0 text-slate-400" />}
                      <span className="flex-1 text-sm leading-6 text-slate-800">{item.name}</span>
                      {item.critical && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">关键</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">
          <p className="font-semibold">关键文件必须放在随身行李</p>
          <p className="mt-1">护照、签证、合同、LOE、上船通知和公司要求的健康文件不要放入托运行李。保存离线副本，但不要在公共相册或群聊公开证件页面。</p>
        </section>

        <button type="button" onClick={() => save(boardingCase)} disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:text-slate-400">
          {saving ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}{saving ? '保存中...' : '保存出发进度'}
        </button>

        {boardingCase.overall_readiness === 'ready' && !boardingCase.boarded_at && (
          <button type="button" onClick={confirmBoarded} disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            <Ship size={18} /> 我已顺利登船
          </button>
        )}

        {boardingCase.boarded_at && (
          <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
            <Ship size={24} className="mx-auto text-emerald-700" />
            <p className="mt-2 font-semibold text-emerald-950">已记录顺利登船</p>
            <p className="mt-1 text-sm text-emerald-800">{new Date(boardingCase.boarded_at).toLocaleString('zh-CN')}</p>
          </section>
        )}
      </div>
    </TaskLayout>
  )
}
