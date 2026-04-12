import { useNavigate, useLocation } from 'react-router-dom'
import { createElement } from 'react'
import { Home, Map, GraduationCap, Briefcase, User } from 'lucide-react'

const tabs = [
  { icon: Home, label: '首页', to: '/' },
  { icon: Map, label: '登船路径', to: '/tasks' },
  { icon: GraduationCap, label: '海乘学院', to: '/academy' },
  { icon: Briefcase, label: '求职中心', to: '/jobs' },
  { icon: User, label: '我的', to: '/profile' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 pb-safe z-50">
      <div className="flex justify-around">
        {tabs.map(({ icon, label, to }) => {
          const isActive = location.pathname === to
          return (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="flex flex-col items-center py-2 px-3"
            >
              {createElement(icon, {
                size: 22,
                className: isActive ? 'text-blue-600' : 'text-gray-400',
              })}
              <span
                className={`text-[10px] mt-1 ${
                  isActive ? 'text-blue-600 font-medium' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}