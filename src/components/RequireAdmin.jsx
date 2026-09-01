import { useAccessStore } from '../store/accessStore'

export default function RequireAdmin({ children }) {
  const { authChecked, accessChecked, isCheckingAuth, isCheckingAccess, isRegistered, isAdmin, openRegisterModal } = useAccessStore()

  if (!authChecked || !accessChecked || isCheckingAuth || isCheckingAccess) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600">正在检查管理员权限...</div>
  }

  if (!isRegistered) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <button type="button" onClick={openRegisterModal} className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white">登录管理员账号</button>
      </div>
    )
  }

  if (!isAdmin) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-center text-sm text-slate-600">此页面仅管理员可以访问。</div>
  }

  return children
}

