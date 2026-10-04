import { Link, useLocation } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { useAccessStore } from '../store/accessStore'

const modes = [
  { value: 'actual', label: '管理员实际权限' },
  { value: 'anonymous', label: '匿名访客' },
  { value: 'free', label: '免费会员' },
  { value: 'premium', label: '付费会员' },
  { value: 'mentor', label: '认证 Mentor' },
]

export default function AdminPreviewBar() {
  const { isAdmin, previewMode, setPreviewMode } = useAccessStore()
  const location = useLocation()
  if (!isAdmin || location.pathname === '/admin/inspection') return null

  return (
    <div className="fixed bottom-20 right-4 z-[80] w-52 rounded-lg border border-slate-300 bg-white p-3 shadow-lg">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
        <ShieldCheck size={16} className="text-blue-700" />
        管理员预览
      </div>
      <Link to="/admin/inspection" className="mt-2 block rounded-lg bg-blue-600 px-3 py-2 text-center text-xs font-semibold text-white">打开只读巡检 · 自由跳步</Link>
      <select
        value={previewMode}
        onChange={(event) => setPreviewMode(event.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
      >
        {modes.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
      </select>
      {previewMode !== 'actual' && <p className="mt-2 text-xs leading-5 text-amber-700">仅模拟页面权限；操作仍使用真实账号，可能保存记录。安全查看内容请使用只读巡检。</p>}
    </div>
  )
}
