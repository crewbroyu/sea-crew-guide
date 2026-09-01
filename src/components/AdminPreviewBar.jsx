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
  if (!isAdmin) return null

  return (
    <div className="fixed bottom-20 right-4 z-[80] w-52 rounded-lg border border-slate-300 bg-white p-3 shadow-lg">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
        <ShieldCheck size={16} className="text-blue-700" />
        管理员预览
      </div>
      <select
        value={previewMode}
        onChange={(event) => setPreviewMode(event.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
      >
        {modes.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
      </select>
      {previewMode !== 'actual' && <p className="mt-2 text-xs leading-5 text-amber-700">当前仅模拟页面权限，不修改你的真实账号。</p>}
    </div>
  )
}

