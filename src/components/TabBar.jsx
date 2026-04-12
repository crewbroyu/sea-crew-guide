import { NavLink } from 'react-router-dom'
import { createElement } from 'react'
import { Home, Map, GraduationCap, Briefcase, User } from 'lucide-react'

const tabs = [
  { to: '/', icon: Home, label: '首页' },
  { to: '/tasks', icon: Map, label: '登船路径' },
  { to: '/academy', icon: GraduationCap, label: '学院' },
  { to: '/jobs', icon: Briefcase, label: '求职' },
  { to: '/profile', icon: User, label: '我的' },
]

export default function TabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-50">
      {tabs.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-xs ${isActive ? 'text-blue-600' : 'text-gray-400'}`
          }
        >
          {createElement(icon, { size: 22 })}
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}