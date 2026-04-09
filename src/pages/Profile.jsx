import { useNavigate } from 'react-router-dom'
import { createElement } from 'react'
import useAuthStore from '../store/useAuthStore'
import {
  User, FileText, Target, Route, Award,
  Settings, LogOut, ChevronRight
} from 'lucide-react'

export default function Profile() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuthStore()

  const handleLogout = async () => {
    await signOut()
  }

  const menuItems = [
    { icon: Target, label: '海乘适配评估', to: '/assessment' },
    { icon: Route, label: '确定申请路线', to: '/route-select' },
    { icon: FileText, label: '我的简历', to: '/resume' },
    { icon: Award, label: '我的Offer', to: '/my-offer' },
    { icon: Settings, label: '设置', to: '/settings' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部用户信息 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 pt-12 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <User size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-white text-lg font-bold">
              {profile?.nickname || '新船员'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                Lv.{profile?.level || 1}
              </span>
              <span className="text-blue-200 text-xs">{profile?.xp || 0} XP</span>
            </div>
            {profile?.selected_job && (
              <p className="text-blue-200 text-xs mt-1">
                目标岗位：{profile.selected_job}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 菜单列表 */}
      <div className="px-6 py-4 space-y-2">
        {menuItems.map(({ icon, label, to }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="w-full bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm"
          >
            {createElement(icon, { size: 20, className: 'text-gray-500' })}
            <span className="flex-1 text-left text-sm text-gray-800">{label}</span>
            <ChevronRight size={18} className="text-gray-300" />
          </button>
        ))}

        <button
          onClick={handleLogout}
          className="w-full bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm mt-4"
        >
          <LogOut size={20} className="text-red-500" />
          <span className="text-sm text-red-500">退出登录</span>
        </button>
      </div>
    </div>
  )
}