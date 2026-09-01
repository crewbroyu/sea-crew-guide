import { useState } from 'react'
import { FileCheck2, LoaderCircle, Plus, Save, Trash2 } from 'lucide-react'
import TaskLayout from '../../components/TaskLayout'
import useBoardingCase from '../../hooks/useBoardingCase'
import { DOCUMENT_STATUS_OPTIONS } from '../../services/boardingCaseService'
import { completeTaskAndSyncPathProfile } from '../../services/userPathService'

const inputClass = 'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

const statusTone = {
  not_started: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  ready: 'bg-emerald-100 text-emerald-700',
  not_required: 'bg-slate-100 text-slate-600',
  expired: 'bg-red-100 text-red-700',
}

export default function Task10() {
  const { boardingCase, updateBoardingCase, loading, saving, syncState, error, save } = useBoardingCase()
  const [newDocumentName, setNewDocumentName] = useState('')
  const documents = boardingCase.document_items || []
  const completedCount = documents.filter((item) => ['ready', 'not_required'].includes(item.status)).length
  const expiringBeforeBoarding = boardingCase.embarkation_date
    ? documents.filter((item) => item.status === 'ready' && item.expiry_date && item.expiry_date < boardingCase.embarkation_date)
    : []
  const canComplete = documents.length > 0 && completedCount === documents.length && expiringBeforeBoarding.length === 0

  const updateDocument = (id, field, value) => {
    updateBoardingCase((current) => ({
      ...current,
      document_items: current.document_items.map((item) => (
        item.id === id ? { ...item, [field]: value } : item
      )),
    }))
  }

  const addDocument = () => {
    const name = newDocumentName.trim()
    if (!name) return
    updateBoardingCase((current) => ({
      ...current,
      document_items: [
        ...current.document_items,
        { id: `custom_${Date.now()}`, name, description: '按公司或航线要求补充', status: 'not_started', expiry_date: '', notes: '', custom: true },
      ],
    }))
    setNewDocumentName('')
  }

  const removeDocument = (id) => {
    updateBoardingCase((current) => ({
      ...current,
      document_items: current.document_items.filter((item) => item.id !== id),
    }))
  }

  const handleComplete = async () => {
    await save(boardingCase)
    await completeTaskAndSyncPathProfile(10, { application_stage: 'documents' })
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600"><LoaderCircle size={20} className="mr-2 animate-spin" /> 正在加载证件清单</div>
  }

  return (
    <TaskLayout taskId={10} taskTitle="登船证件进度" canComplete={canComplete} onComplete={handleComplete}>
      <div className="space-y-5">
        <section className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <FileCheck2 size={20} className="mt-0.5 shrink-0 text-blue-700" />
            <div>
              <h2 className="font-semibold text-blue-950">按实际要求管理，不上传敏感原件</h2>
              <p className="mt-1 text-sm leading-6 text-blue-900">不同船公司、岗位、旗国和航线的要求可能不同。请以公司或代理的书面清单为准，只记录状态、有效期和备注。</p>
            </div>
          </div>
        </section>

        {(boardingCase.cruise_company || boardingCase.final_position) && (
          <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
            <div><p className="text-xs text-slate-500">船公司</p><p className="mt-1 font-semibold text-slate-950">{boardingCase.cruise_company || '待确认'}</p></div>
            <div><p className="text-xs text-slate-500">岗位</p><p className="mt-1 font-semibold text-slate-950">{boardingCase.final_position || '待确认'}</p></div>
          </section>
        )}

        {syncState === 'local' && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">当前进度已保存在此设备，建表后会同步到账号。</div>}
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-end justify-between gap-4">
            <div><h2 className="font-semibold text-slate-950">准备进度</h2><p className="mt-1 text-sm text-slate-600">{completedCount} / {documents.length} 项已处理</p></div>
            <span className="text-2xl font-semibold text-blue-700">{documents.length ? Math.round((completedCount / documents.length) * 100) : 0}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-blue-600 transition-all" style={{ width: `${documents.length ? (completedCount / documents.length) * 100 : 0}%` }} /></div>
        </section>

        {expiringBeforeBoarding.length > 0 && (
          <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">
            <p className="font-semibold">有效期早于预计登船日期</p>
            <p className="mt-1">{expiringBeforeBoarding.map((item) => item.name).join('、')}需要重新确认或更新后才能完成任务。</p>
          </section>
        )}

        <div className="space-y-3">
          {documents.map((document) => (
            <article key={document.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><h3 className="font-semibold text-slate-950">{document.name}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{document.description}</p></div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusTone[document.status] || statusTone.not_started}`}>{DOCUMENT_STATUS_OPTIONS.find((option) => option.value === document.status)?.label || '未开始'}</span>
                  {document.custom && <button type="button" title="删除此项" onClick={() => removeDocument(document.id)} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-700"><Trash2 size={16} /></button>}
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">当前状态<select value={document.status} onChange={(event) => updateDocument(document.id, 'status', event.target.value)} className={inputClass}>{DOCUMENT_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                <label className="text-sm font-medium text-slate-700">有效期<input type="date" value={document.expiry_date || ''} onChange={(event) => updateDocument(document.id, 'expiry_date', event.target.value)} className={inputClass} /></label>
              </div>
              <label className="mt-4 block text-sm font-medium text-slate-700">办理备注<input value={document.notes || ''} onChange={(event) => updateDocument(document.id, 'notes', event.target.value)} placeholder="预约时间、办理机构、公司反馈等" className={inputClass} /></label>
            </article>
          ))}
        </div>

        <section className="rounded-lg border border-dashed border-slate-300 bg-white p-4">
          <label className="text-sm font-medium text-slate-700">公司要求的其他材料</label>
          <div className="mt-2 flex gap-2">
            <input value={newDocumentName} onChange={(event) => setNewDocumentName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addDocument() } }} placeholder="例如：疫苗证明" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
            <button type="button" onClick={addDocument} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white"><Plus size={17} /> 添加</button>
          </div>
        </section>

        <button type="button" onClick={() => save(boardingCase)} disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:text-slate-400">
          {saving ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}{saving ? '保存中...' : '保存证件进度'}
        </button>
      </div>
    </TaskLayout>
  )
}
