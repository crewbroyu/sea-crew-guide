import { useNavigate } from 'react-router-dom'
import { createElement } from 'react'
import useAuthStore from '../store/useAuthStore'
import {
  Ship, ClipboardCheck, Map, GraduationCap,
  Mic, Bell, ChevronRight, Anchor
} from 'lucide-react'

const features = [
  {
    icon: ClipboardCheck,
    label: '五维测评',
    desc: '了解你的能力水平',
    to: '/assessment',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Map,
    label: '任务地图',
    desc: '一步步完成求职准备',
    to: '/tasks',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: GraduationCap,
    label: '海乘学院',
    desc: '学习专业知识',
    to: '/academy',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: Mic,
    label: '每日打卡',
    desc: '口语练习不间断',
    to: '/checkin',
    color: 'bg-orange-100 text-orange-600',
  },
]

export default function Home() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部蓝色区域 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 pt-12 pb-20 relative">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-blue-200 text-sm">欢迎回来</p>
            <h1 className="text-white text-xl font-bold mt-1">
              {profile?.nickname || '新船员'}
            </h1>
          </div>
          <button
            disabled
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center opacity-50 cursor-not-allowed"
          >
            <Bell size={20} className="text-white" />
          </button>
        </div>

        {/* 等级信息 */}
        <div className="flex items-center gap-2 mt-4">
          <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
            Lv.{profile?.level || 1}
          </span>
          <div className="flex-1 bg-white/20 rounded-full h-2">
            <div
              className="bg-yellow-400 h-2 rounded-full transition-all"
              style={{ width: `${((profile?.xp || 0) % 100)}%` }}
            />
          </div>
          <span className="text-white/70 text-xs">{profile?.xp || 0} XP</span>
        </div>
      </div>

      {/* 进度卡片 */}
      <div className="px-6 -mt-12 relative z-10">
        <div className="bg-white rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800">当前进度</h2>
            <Anchor size={18} className="text-blue-500" />
          </div>
          <div className="flex justify-between text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {profile?.current_stage || 1}
              </p>
              <p className="text-xs text-gray-500 mt-1">当前阶段</p>
            </div>
            <div className="w-px bg-gray-200" />
            <div>
              <p className="text-2xl font-bold text-green-600">
                {profile?.current_task || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">已完成任务</p>
            </div>
            <div className="w-px bg-gray-200" />
            <div>
              <p className="text-2xl font-bold text-orange-500">0</p>
              <p className="text-xs text-gray-500 mt-1">连续打卡</p>
            </div>
          </div>
        </div>
      </div>

      {/* 功能入口 */}
      <div className="px-6 mt-6">
        <h2 className="font-bold text-gray-800 mb-3">功能中心</h2>
        <div className="space-y-3">
          {features.map(({ icon, label, desc, to, color }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="w-full bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm active:scale-[0.98] transition"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
                {createElement(icon, { size: 22 })}
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </button>
          ))}
        </div>
      </div>

      {/* 底部提示 */}
      <div className="px-6 mt-6 mb-6">
        <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
          <Ship size={24} className="text-blue-500 shrink-0" />
          <p className="text-sm text-blue-700">
            完成五维测评，解锁你的专属求职路线！
          </p>
        </div>
      </div>
    </div>
  )
}