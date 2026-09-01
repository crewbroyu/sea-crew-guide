import { AlertTriangle, BriefcaseBusiness, CheckCircle2, LoaderCircle, Save } from 'lucide-react'
import TaskLayout from '../components/TaskLayout'
import useBoardingCase from '../hooks/useBoardingCase'
import { completeTaskAndSyncPathProfile } from '../services/userPathService'

const inputClass = 'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

const offerStatusOptions = [
  { value: 'received', label: '刚收到，正在核对' },
  { value: 'reviewing', label: '正在与公司确认条款' },
  { value: 'accepted', label: '已接受 Offer' },
  { value: 'declined', label: '已拒绝 Offer' },
]

const checkItems = [
  { key: 'salary', label: '收入结构', detail: '确认底薪、提成、小费、扣款和发薪币种。' },
  { key: 'contract', label: '合同期限', detail: '确认合同起止日期、试用期和提前解约规则。' },
  { key: 'fees', label: '申请费用', detail: '确认中介费、培训费、体检费和机票由谁承担。' },
  { key: 'joining', label: '登船安排', detail: '确认登船日期、港口、LOE 和行程责任方。' },
]

export default function MyOffer() {
  const {
    boardingCase,
    updateBoardingCase,
    loading,
    saving,
    syncState,
    error,
    save,
  } = useBoardingCase()

  const updateField = (field, value) => {
    updateBoardingCase((current) => ({ ...current, [field]: value }))
  }

  const toggleCheck = (key) => {
    updateBoardingCase((current) => ({
      ...current,
      offer_checks: {
        ...current.offer_checks,
        [key]: !current.offer_checks?.[key],
      },
    }))
  }

  const allChecksComplete = checkItems.every((item) => boardingCase.offer_checks?.[item.key])
  const canComplete = Boolean(
    boardingCase.cruise_company.trim()
    && boardingCase.final_position.trim()
    && boardingCase.offer_status === 'accepted'
    && boardingCase.offer_confirmed
    && allChecksComplete,
  )

  const risks = [
    !boardingCase.salary_amount && '尚未记录收入金额或收入结构',
    (!boardingCase.contract_start || !boardingCase.contract_end) && '合同起止日期尚未完整记录',
    !boardingCase.embarkation_date && '登船日期尚未确定',
    !boardingCase.embarkation_port && '登船港口尚未确定',
    Number(boardingCase.agency_fee) > 0 && '记录了申请或服务费用，请确认收款方、用途和退款规则',
  ].filter(Boolean)

  const handleSave = () => save(boardingCase)

  const handleComplete = async () => {
    await save(boardingCase)
    await completeTaskAndSyncPathProfile(9, {
      target_company: boardingCase.cruise_company,
      target_position: boardingCase.final_position,
      target_boarding_month: boardingCase.embarkation_date?.slice(0, 7) || null,
      application_stage: 'offer_received',
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600">
        <LoaderCircle size={20} className="mr-2 animate-spin" /> 正在加载 Offer 档案
      </div>
    )
  }

  return (
    <TaskLayout taskId={9} taskTitle="Offer 决策中心" canComplete={canComplete} onComplete={handleComplete}>
      <div className="space-y-5">
        <section className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex gap-3">
            <BriefcaseBusiness size={20} className="mt-0.5 shrink-0 text-blue-700" />
            <div>
              <h2 className="font-semibold text-blue-950">先核对条款，再进入登船准备</h2>
              <p className="mt-1 text-sm leading-6 text-blue-900">这里保存结构化信息，不要求上传包含姓名、证件号或签名的 Offer 原件。</p>
            </div>
          </div>
        </section>

        {syncState === 'local' && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            内容已保存在当前设备。执行项目中的 supabase_boarding_cases.sql 后即可同步到账号。
          </div>
        )}
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">录用信息</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">邮轮公司 <span className="text-red-600">*</span><input value={boardingCase.cruise_company} onChange={(event) => updateField('cruise_company', event.target.value)} placeholder="例如 Royal Caribbean" className={inputClass} /></label>
            <label className="text-sm font-medium text-slate-700">最终岗位 <span className="text-red-600">*</span><input value={boardingCase.final_position} onChange={(event) => updateField('final_position', event.target.value)} placeholder="例如 Retail Sales Associate" className={inputClass} /></label>
            <label className="text-sm font-medium text-slate-700">Offer 状态<select value={boardingCase.offer_status} onChange={(event) => updateField('offer_status', event.target.value)} className={inputClass}>{offerStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700">申请渠道<input value={boardingCase.application_channel} onChange={(event) => updateField('application_channel', event.target.value)} placeholder="官网、代理、内推等" className={inputClass} /></label>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">合同与收入</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">收入金额<div className="mt-2 flex gap-2"><input type="number" min="0" value={boardingCase.salary_amount ?? ''} onChange={(event) => updateField('salary_amount', event.target.value)} placeholder="金额" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500" /><select value={boardingCase.salary_currency} onChange={(event) => updateField('salary_currency', event.target.value)} className="w-24 rounded-lg border border-slate-300 bg-white px-2 text-sm"><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="CNY">CNY</option></select></div></label>
            <label className="text-sm font-medium text-slate-700">申请或服务费用<input type="number" min="0" value={boardingCase.agency_fee ?? ''} onChange={(event) => updateField('agency_fee', event.target.value)} placeholder="没有则填 0" className={inputClass} /></label>
            <label className="text-sm font-medium text-slate-700">合同开始日期<input type="date" value={boardingCase.contract_start || ''} onChange={(event) => updateField('contract_start', event.target.value)} className={inputClass} /></label>
            <label className="text-sm font-medium text-slate-700">合同结束日期<input type="date" value={boardingCase.contract_end || ''} onChange={(event) => updateField('contract_end', event.target.value)} className={inputClass} /></label>
          </div>
          <label className="mt-4 block text-sm font-medium text-slate-700">收入说明<textarea value={boardingCase.salary_notes} onChange={(event) => updateField('salary_notes', event.target.value)} placeholder="底薪、提成、小费、扣款或保底规则" className={`${inputClass} h-20 resize-none`} /></label>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">登船安排</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">预计登船日期<input type="date" value={boardingCase.embarkation_date || ''} onChange={(event) => updateField('embarkation_date', event.target.value)} className={inputClass} /></label>
            <label className="text-sm font-medium text-slate-700">登船港口<input value={boardingCase.embarkation_port} onChange={(event) => updateField('embarkation_port', event.target.value)} placeholder="城市 / 港口" className={inputClass} /></label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">出发城市<input value={boardingCase.departure_city} onChange={(event) => updateField('departure_city', event.target.value)} placeholder="用于后续行程规划和搭子匹配" className={inputClass} /></label>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">关键条款核对</h2>
          <div className="mt-4 space-y-3">
            {checkItems.map((item) => (
              <label key={item.key} className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:border-blue-300">
                <input type="checkbox" checked={Boolean(boardingCase.offer_checks?.[item.key])} onChange={() => toggleCheck(item.key)} className="mt-1 h-4 w-4 rounded border-slate-300" />
                <span><span className="block text-sm font-semibold text-slate-900">{item.label}</span><span className="mt-0.5 block text-sm leading-6 text-slate-600">{item.detail}</span></span>
              </label>
            ))}
          </div>
        </section>

        <section className={`rounded-lg border p-4 ${risks.length ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
          <div className="flex items-start gap-3">
            {risks.length ? <AlertTriangle size={19} className="mt-0.5 shrink-0 text-amber-700" /> : <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-emerald-700" />}
            <div className="text-sm leading-6"><p className={`font-semibold ${risks.length ? 'text-amber-950' : 'text-emerald-950'}`}>{risks.length ? '还有信息需要确认' : '主要信息已记录'}</p>{risks.map((risk) => <p key={risk} className="text-amber-900">{risk}</p>)}</div>
          </div>
        </section>

        <label className="flex items-start gap-3 rounded-lg border border-slate-300 bg-white p-4 text-sm leading-6 text-slate-700">
          <input type="checkbox" checked={boardingCase.offer_confirmed} onChange={(event) => updateField('offer_confirmed', event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300" />
          我已根据 Offer 或公司书面信息核对以上内容。此记录用于规划，不代表平台对合同真实性或合法性的认证。
        </label>

        <button type="button" onClick={handleSave} disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:text-slate-400">
          {saving ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}{saving ? '保存中...' : '保存当前信息'}
        </button>
      </div>
    </TaskLayout>
  )
}
