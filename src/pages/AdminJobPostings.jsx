import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, ExternalLink, Loader2, Sparkles } from 'lucide-react'
import {
  JOB_DEPARTMENTS,
  deleteJobPosting,
  extractJobPosting,
  isJobPostingExpired,
  listAllJobPostings,
  saveJobPosting,
  setJobPostingStatus,
} from '../services/jobPostingService'

const statusLabels = { draft: '草稿', published: '已发布', archived: '已下架' }
const statusStyles = {
  draft: 'bg-amber-100 text-amber-800',
  published: 'bg-emerald-100 text-emerald-800',
  archived: 'bg-slate-200 text-slate-600',
}
const joinList = (value) => (Array.isArray(value) ? value.join('、') : value || '')
const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none'

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  )
}

function DraftEditor({ draft, onChange, onSave, onCancel, saving }) {
  const set = (field) => (event) => onChange({ ...draft, [field]: event.target.value })
  const departments = Array.isArray(draft.departments) ? draft.departments : []
  const toggleDepartment = (department) => onChange({
    ...draft,
    departments: departments.includes(department) ? departments.filter((item) => item !== department) : [...departments, department],
  })
  const riskFlags = Array.isArray(draft.risk_flags) ? draft.risk_flags : []

  return (
    <section className="space-y-4 rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-900">{draft.id ? '编辑招聘信息' : '核对 AI 提取结果'}</h2>
        <button type="button" onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-800">取消</button>
      </div>

      {riskFlags.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <p className="flex items-center gap-1 font-semibold"><AlertTriangle size={16} />AI 风险提示（仅管理员可见）</p>
          <ul className="mt-1 list-disc pl-5">{riskFlags.map((flag) => <li key={flag}>{flag}</li>)}</ul>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="标题 *"><input className={inputClass} value={draft.title || ''} onChange={set('title')} maxLength={120} /></Field>
        <Field label="来源名称 *" hint="公众号名或网站名"><input className={inputClass} value={draft.source_name || ''} onChange={set('source_name')} maxLength={80} /></Field>
        <Field label="原文链接 *"><input className={inputClass} value={draft.source_url || ''} onChange={set('source_url')} /></Field>
        <Field label="原文发布日期"><input type="date" className={inputClass} value={draft.source_published_on || ''} onChange={set('source_published_on')} /></Field>
      </div>
      <Field label="摘要 *" hint={`${(draft.summary || '').length}/400`}>
        <textarea className={inputClass} rows={3} value={draft.summary || ''} onChange={set('summary')} maxLength={400} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="邮轮公司" hint="用顿号或逗号分隔"><input className={inputClass} value={joinList(draft.cruise_lines)} onChange={set('cruise_lines')} /></Field>
        <Field label="具体岗位" hint="用顿号或逗号分隔"><input className={inputClass} value={joinList(draft.positions)} onChange={set('positions')} /></Field>
        <Field label="招聘机构"><input className={inputClass} value={draft.agency || ''} onChange={set('agency')} maxLength={120} /></Field>
        <Field label="面试/报名地点"><input className={inputClass} value={draft.locations || ''} onChange={set('locations')} maxLength={200} /></Field>
        <Field label="薪资"><input className={inputClass} value={draft.salary || ''} onChange={set('salary')} maxLength={200} /></Field>
        <Field label="截止日期" hint="过期后前台自动标记为已截止"><input type="date" className={inputClass} value={draft.deadline || ''} onChange={set('deadline')} /></Field>
      </div>
      <Field label="岗位要求">
        <textarea className={inputClass} rows={3} value={draft.requirements || ''} onChange={set('requirements')} maxLength={800} />
      </Field>
      <div>
        <span className="mb-2 block text-xs font-semibold text-slate-600">部门分类</span>
        <div className="flex flex-wrap gap-2">
          {JOB_DEPARTMENTS.map((department) => (
            <button
              key={department}
              type="button"
              onClick={() => toggleDepartment(department)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${departments.includes(department) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              {department}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        <button type="button" disabled={saving} onClick={() => onSave('published')} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">保存并发布</button>
        <button type="button" disabled={saving} onClick={() => onSave('draft')} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">存为草稿</button>
      </div>
    </section>
  )
}

export default function AdminJobPostings() {
  const navigate = useNavigate()
  const [sourceUrl, setSourceUrl] = useState('')
  const [articleText, setArticleText] = useState('')
  const [showPaste, setShowPaste] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [postings, setPostings] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)

  const load = async () => {
    try {
      setPostings(await listAllJobPostings())
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  useEffect(() => {
    let active = true
    listAllJobPostings()
      .then((data) => { if (active) setPostings(data) })
      .catch((error) => { if (active) setMessage({ type: 'error', text: error.message }) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const handleExtract = async (event) => {
    event.preventDefault()
    setExtracting(true)
    setMessage(null)
    try {
      const result = await extractJobPosting({ sourceUrl, articleText: showPaste ? articleText : '' })
      if (!result.is_recruitment) setMessage({ type: 'warning', text: 'AI 判断这篇文章可能不是海乘招聘信息，请仔细核对。' })
      setDraft(result)
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
      if (['SOURCE_BLOCKED', 'SOURCE_FETCH_FAILED'].includes(error.code)) setShowPaste(true)
    } finally {
      setExtracting(false)
    }
  }

  const handleSave = async (status) => {
    setSaving(true)
    setMessage(null)
    try {
      await saveJobPosting({ ...draft, status })
      setDraft(null)
      setSourceUrl('')
      setArticleText('')
      setShowPaste(false)
      setMessage({ type: 'success', text: status === 'published' ? '已发布到“最新招聘”。' : '已存为草稿。' })
      await load()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  const runAction = async (action) => {
    setMessage(null)
    try {
      await action()
      await load()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    }
  }

  const messageStyles = {
    error: 'border-red-200 bg-red-50 text-red-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <div className="mx-auto max-w-4xl space-y-5 px-4 py-8">
        <button type="button" onClick={() => navigate('/profile')} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-700"><ArrowLeft size={16} />返回我的</button>
        <div>
          <h1 className="text-2xl font-bold text-slate-950">招聘信息整理</h1>
          <p className="mt-1 text-sm text-slate-600">粘贴公众号招聘推文链接，AI 提取字段，人工核对后发布到“最新招聘”。前台只展示摘要并链接回原文。</p>
        </div>

        {message && <div className={`rounded-lg border p-3 text-sm ${messageStyles[message.type]}`}>{message.text}</div>}

        {!draft && (
          <form onSubmit={handleExtract} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <Field label="公众号文章链接">
              <input className={inputClass} value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://mp.weixin.qq.com/s/..." required />
            </Field>
            {showPaste ? (
              <Field label="文章正文" hint="原文打不开时，在微信里复制全文粘贴到这里（至少 80 字）">
                <textarea className={inputClass} rows={6} value={articleText} onChange={(event) => setArticleText(event.target.value)} />
              </Field>
            ) : (
              <button type="button" onClick={() => setShowPaste(true)} className="text-xs text-blue-700 underline underline-offset-2">原文打不开？改为粘贴正文</button>
            )}
            <button type="submit" disabled={extracting} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {extracting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {extracting ? '正在提取…' : 'AI 提取'}
            </button>
          </form>
        )}

        {draft && <DraftEditor draft={draft} onChange={setDraft} onSave={handleSave} onCancel={() => setDraft(null)} saving={saving} />}

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3">
            <h2 className="font-semibold text-slate-900">全部招聘信息（{postings.length}）</h2>
          </div>
          {loading ? (
            <p className="px-5 py-6 text-sm text-slate-500">加载中…</p>
          ) : postings.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">还没有整理过招聘信息。</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {postings.map((posting) => (
                <li key={posting.id} className="space-y-2 px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyles[posting.status]}`}>{statusLabels[posting.status]}</span>
                    {isJobPostingExpired(posting) && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">已截止</span>}
                    {posting.risk_flags?.length > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700"><AlertTriangle size={12} />风险 {posting.risk_flags.length}</span>}
                    <span className="text-xs text-slate-400">{posting.source_name}</span>
                  </div>
                  <p className="font-semibold text-slate-900">{posting.title}</p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <a href={posting.source_url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-blue-700"><ExternalLink size={12} />原文</a>
                    <button type="button" onClick={() => { setDraft(posting); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="text-slate-700 underline underline-offset-2">编辑</button>
                    {posting.status !== 'published' && <button type="button" onClick={() => runAction(() => setJobPostingStatus(posting.id, 'published'))} className="text-emerald-700 underline underline-offset-2">发布</button>}
                    {posting.status === 'published' && <button type="button" onClick={() => runAction(() => setJobPostingStatus(posting.id, 'archived'))} className="text-amber-700 underline underline-offset-2">下架</button>}
                    <button
                      type="button"
                      onClick={() => window.confirm(`确定删除“${posting.title}”？`) && runAction(() => deleteJobPosting(posting.id))}
                      className="text-red-600 underline underline-offset-2"
                    >
                      删除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
