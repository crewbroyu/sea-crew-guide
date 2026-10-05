import { useRef, useState } from 'react'
import { partnerDirectory } from '../services/partnerWorkspaceService'

export default function PartnerAccountPicker({ name, title, kind = 'account', required = true }) {
  const [query, setQuery] = useState('')
  const [accounts, setAccounts] = useState([])
  const [selected, setSelected] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const requestId = useRef(0)
  async function search() {
    const id = ++requestId.current
    setBusy(true)
    setSelected('')
    setAccounts([])
    setNotice('')
    try {
      const result = await partnerDirectory('search_accounts', { query: query.trim(), kind })
      if (id !== requestId.current) return
      setAccounts(result.accounts)
      setNotice(result.accounts.length ? '请核对登录邮箱和账号编号；同名不代表同一人。最多显示 20 个结果。' : '未找到有效账号，请使用完整登录邮箱或账号编号查询。')
    } catch (error) {
      if (id === requestId.current) setNotice(error.message)
    } finally {
      if (id === requestId.current) setBusy(false)
    }
  }
  return <div className="space-y-2 rounded-lg border border-slate-200 p-3">
    <label className="block text-sm">查找{title}
      <input className="mt-1 w-full rounded-lg border p-2" value={query} maxLength={254}
        placeholder="姓名（至少两字）、完整登录邮箱或账号编号"
        onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); if (query.trim().length >= 2) search() } }}
        onChange={event => { requestId.current++; setQuery(event.target.value); setAccounts([]); setSelected(''); setNotice(''); setBusy(false) }} />
    </label>
    <button type="button" disabled={busy || query.trim().length < 2} onClick={search} className="text-sm text-blue-700 disabled:opacity-50">{busy ? '正在查找…' : `搜索${title}`}</button>
    {notice && <p role="status" className="text-xs text-slate-600">{notice}</p>}
    <label className="block text-sm">{title}
      <select name={name} required={required} value={selected} onChange={event => setSelected(event.target.value)} className="mt-1 w-full rounded-lg border p-2 text-sm">
        <option value="">{required ? '请搜索并选择账号' : '不指定'}</option>
        {accounts.map(account => <option key={account.user_id} value={account.user_id}>{account.display_name} · {account.email || '未绑定邮箱'} · {account.user_id}{account.verified_mentor ? ' · 已认证导师' : ''}</option>)}
      </select>
    </label>
  </div>
}
