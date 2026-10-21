import { Plus, Trash2 } from 'lucide-react'
import { CHANNEL_TYPES, EXPERIENCE_LEVELS, FEE_DISCLOSURES, INTERVIEW_MODES, MAX_INTERVIEW_SESSIONS, MAX_POSITIONS } from '../../data/jobPostingDetails'

// Application channel as stated in the source, plus an admin-only verification that needs evidence.
export function ChannelEditor({ draft, onChange }) {
  const verified = Boolean(draft.channel_verified_at)
  const evidence = draft.channel_verification_url || ''
  const evidenceValid = /^https:\/\//.test(evidence.trim())
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 p-3">
      <span className="block text-xs font-semibold text-slate-600">申请渠道与费用</span>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">渠道类型（按原文）</span>
          <select className={inputClass} value={draft.channel_type || 'unspecified'} onChange={(event) => onChange({ ...draft, channel_type: event.target.value })}>
            {Object.entries(CHANNEL_TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-slate-500">费用说明</span>
          <select className={inputClass} value={draft.fee_disclosure || 'unspecified'} onChange={(event) => onChange({ ...draft, fee_disclosure: event.target.value })}>
            {Object.entries(FEE_DISCLOSURES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs text-slate-500">原文关于渠道的说法（原样摘录，前台显示为“原文称”）</span>
        <input className={inputClass} value={draft.channel_claim || ''} onChange={(event) => onChange({ ...draft, channel_claim: event.target.value })} maxLength={200} placeholder="如：皇家加勒比中国指定合作伙伴" />
      </label>
      <div className="rounded-lg bg-slate-50 p-2.5">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={verified}
            disabled={!evidenceValid && !verified}
            onChange={(event) => onChange({ ...draft, channel_verified_at: event.target.checked ? new Date().toISOString() : null })}
            className="h-4 w-4 accent-emerald-600"
          />
          已核验渠道
        </label>
        <input
          className={`${inputClass} mt-2`}
          value={evidence}
          onChange={(event) => onChange({ ...draft, channel_verification_url: event.target.value, ...(/^https:\/\//.test(event.target.value.trim()) ? {} : { channel_verified_at: null }) })}
          placeholder="证据链接（https），如邮轮公司官网的合作机构名单、海事局外派机构备案查询页"
        />
        <p className="mt-1 text-xs text-slate-400">只有拿到证据才勾选。推文里的“官方合作”“一代”不算证据；不要使用“二代”等无法证明的说法。</p>
      </div>
    </div>
  )
}

const inputClass = 'w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none'

// Per-position experience. "无需经验" only when the article says so for that position.
export function PositionDetailsEditor({ value, onChange }) {
  const rows = value || []
  const update = (index, patch) => onChange(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)))
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-600">招聘岗位与经验要求（{rows.length}/{MAX_POSITIONS}）</span>
        {rows.length > 1 && (
          <label className="flex items-center gap-1.5 text-xs text-slate-500">
            全部设为
            <select className="rounded-md border border-slate-300 px-1.5 py-1 text-xs" value="" onChange={(event) => event.target.value && onChange(rows.map((row) => ({ ...row, experience: event.target.value })))}>
              <option value="">选择…</option>
              {Object.entries(EXPERIENCE_LEVELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </label>
        )}
      </div>
      <p className="mb-2 text-xs text-slate-400">经验要求只按原文对该岗位的明确说法填写；原文没写就选“未说明”。“无需邮轮经验”不等于“无需相关工作经验”。</p>
      <div className="space-y-1.5">
        {rows.map((row, index) => (
          <div key={index} className="flex gap-1.5">
            <input className={inputClass} value={row.title} onChange={(event) => update(index, { title: event.target.value })} maxLength={80} placeholder="岗位名" aria-label={`岗位 ${index + 1}`} />
            <select className="w-36 shrink-0 rounded-lg border border-slate-300 px-1.5 text-sm" value={row.experience} onChange={(event) => update(index, { experience: event.target.value })} aria-label={`岗位 ${index + 1} 经验要求`}>
              {Object.entries(EXPERIENCE_LEVELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <button type="button" onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))} className="shrink-0 rounded-lg px-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`删除岗位 ${index + 1}`}><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
      {rows.length < MAX_POSITIONS && (
        <button type="button" onClick={() => onChange([...rows, { title: '', experience: 'unspecified' }])} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700"><Plus size={14} />添加岗位</button>
      )}
    </div>
  )
}

// One row per interview session: a city plus mode plus date must describe the same session.
export function InterviewSessionsEditor({ value, onChange }) {
  const rows = value || []
  const update = (index, patch) => onChange(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)))
  return (
    <div>
      <span className="mb-1 block text-xs font-semibold text-slate-600">面试场次（{rows.length}）</span>
      <p className="mb-2 text-xs text-slate-400">每一场单独一行，城市、方式、日期要属于同一场。线上面试可以不填城市；原文没写具体日期就留空。</p>
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={index} className="grid grid-cols-2 gap-1.5 rounded-lg bg-slate-50 p-2 sm:grid-cols-[1fr_7rem_9rem_1.5fr_auto]">
            <input className={inputClass} value={row.city || ''} onChange={(event) => update(index, { city: event.target.value })} maxLength={30} placeholder="城市，如 上海" aria-label={`场次 ${index + 1} 城市`} />
            <select className="rounded-lg border border-slate-300 px-1.5 text-sm" value={row.mode} onChange={(event) => update(index, { mode: event.target.value })} aria-label={`场次 ${index + 1} 方式`}>
              {Object.entries(INTERVIEW_MODES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
            <input type="date" className={inputClass} value={row.date || ''} onChange={(event) => update(index, { date: event.target.value })} aria-label={`场次 ${index + 1} 日期`} />
            <input className={inputClass} value={row.note || ''} onChange={(event) => update(index, { note: event.target.value })} maxLength={120} placeholder="补充，如地址、时间段" aria-label={`场次 ${index + 1} 补充`} />
            <button type="button" onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))} className="justify-self-end rounded-lg px-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`删除场次 ${index + 1}`}><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
      {rows.length < MAX_INTERVIEW_SESSIONS && (
        <button type="button" onClick={() => onChange([...rows, { city: '', mode: 'offline', date: '', note: '' }])} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700"><Plus size={14} />添加场次</button>
      )}
    </div>
  )
}
