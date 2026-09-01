import { ExternalLink, FileQuestion, LoaderCircle, Save } from 'lucide-react'
import TaskLayout from '../../components/TaskLayout'
import useBoardingCase from '../../hooks/useBoardingCase'
import { VISA_STATUS_OPTIONS } from '../../services/boardingCaseService'
import { completeTaskAndSyncPathProfile } from '../../services/userPathService'

const inputClass = 'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

const requirementOptions = [
  { value: 'unknown', label: '尚未确认' },
  { value: 'required', label: '公司或行程确认需要' },
  { value: 'not_required', label: '公司或行程确认不需要' },
]

export default function Task11() {
  const { boardingCase, updateBoardingCase, loading, saving, syncState, error, save } = useBoardingCase()

  const updateField = (field, value) => {
    updateBoardingCase((current) => ({ ...current, [field]: value }))
  }

  const canComplete = boardingCase.us_visa_requirement === 'required'
    ? boardingCase.visa_status === 'issued'
    : boardingCase.us_visa_requirement === 'not_required' && Boolean(boardingCase.visa_reason.trim())

  const handleComplete = async () => {
    await save(boardingCase)
    await completeTaskAndSyncPathProfile(11, { application_stage: 'documents' })
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600"><LoaderCircle size={20} className="mr-2 animate-spin" /> 正在加载签证进度</div>
  }

  return (
    <TaskLayout taskId={11} taskTitle="签证与通行许可" canComplete={canComplete} onComplete={handleComplete}>
      <div className="space-y-5">
        <section className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <FileQuestion size={20} className="mt-0.5 shrink-0 text-blue-700" />
            <div>
              <h2 className="font-semibold text-blue-950">先判断航线，再进入办理流程</h2>
              <p className="mt-1 text-sm leading-6 text-blue-900">船员签证取决于国籍、登船港口、过境安排和公司要求。不要在行程未确认时默认所有人都需要同一种签证。</p>
            </div>
          </div>
        </section>

        {syncState === 'local' && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">当前进度已保存在此设备，建表后会同步到账号。</div>}
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">是否需要美国船员或过境签证</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">请根据公司、LOE、机票路线或官方要求确认。</p>
          <div className="mt-4 space-y-2">
            {requirementOptions.map((option) => (
              <label key={option.value} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm font-medium ${boardingCase.us_visa_requirement === option.value ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-slate-200 text-slate-700'}`}>
                <input type="radio" name="visa_requirement" value={option.value} checked={boardingCase.us_visa_requirement === option.value} onChange={(event) => updateField('us_visa_requirement', event.target.value)} />
                {option.label}
              </label>
            ))}
          </div>
          <a href="https://travel.state.gov/content/travel/en/us-visas/other-visa-categories/crewmember-visa.html" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800">
            查看美国国务院船员签证说明 <ExternalLink size={15} />
          </a>
        </section>

        {boardingCase.us_visa_requirement === 'required' && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-950">办理进度</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">当前状态<select value={boardingCase.visa_status} onChange={(event) => updateField('visa_status', event.target.value)} className={inputClass}>{VISA_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
              <label className="text-sm font-medium text-slate-700">面谈城市 / 领馆<input value={boardingCase.visa_consulate} onChange={(event) => updateField('visa_consulate', event.target.value)} placeholder="例如 上海" className={inputClass} /></label>
              <label className="text-sm font-medium text-slate-700">预约时间<input type="datetime-local" value={boardingCase.visa_appointment_at || ''} onChange={(event) => updateField('visa_appointment_at', event.target.value)} className={inputClass} /></label>
              <label className="text-sm font-medium text-slate-700">签证有效期<input type="date" value={boardingCase.visa_expiry_date || ''} onChange={(event) => updateField('visa_expiry_date', event.target.value)} className={inputClass} /></label>
            </div>
            <label className="mt-4 block text-sm font-medium text-slate-700">办理备注<textarea value={boardingCase.visa_notes} onChange={(event) => updateField('visa_notes', event.target.value)} placeholder="LOE 状态、补充材料、护照返还安排等" className={`${inputClass} h-24 resize-none`} /></label>
          </section>
        )}

        {boardingCase.us_visa_requirement === 'not_required' && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-950">不需要的确认依据</h2>
            <label className="mt-4 block text-sm font-medium text-slate-700">公司或行程说明 <span className="text-red-600">*</span><textarea value={boardingCase.visa_reason} onChange={(event) => updateField('visa_reason', event.target.value)} placeholder="例如：公司书面确认本次登船路线不经美国" className={`${inputClass} h-24 resize-none`} /></label>
          </section>
        )}

        {boardingCase.us_visa_requirement === 'unknown' && (
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <p className="font-semibold">下一步不是立即填表</p>
            <p className="mt-1">先向船公司或代理确认登船港口、机票路线和所需签证类型，再记录办理进度。</p>
          </section>
        )}

        <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
          <p className="font-semibold text-slate-900">重要说明</p>
          <p className="mt-1">签证是否签发由领事机构决定。平台记录仅用于准备进度，不构成法律意见或签证结果保证；在签证签发前避免做不可退改的最终行程安排。</p>
        </section>

        <button type="button" onClick={() => save(boardingCase)} disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:text-slate-400">
          {saving ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}{saving ? '保存中...' : '保存签证进度'}
        </button>
      </div>
    </TaskLayout>
  )
}
