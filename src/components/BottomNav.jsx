import { useNavigate, useLocation } from 'react-router-dom'
import { createElement } from 'react'
import { Home, Route, GraduationCap, Briefcase, User } from 'lucide-react'
import useEffectiveAccess from '../hooks/useEffectiveAccess'
import {
  getPrimaryNavigation,
  isPrimaryNavigationActive,
  isPrimaryNavigationVisible,
} from '../data/appNavigation'

const icons = {
  home: Home,
  route: Route,
  training: GraduationCap,
  jobs: Briefcase,
  profile: User,
}

const readPrimaryRole = () => {
  try {
    const task2 = JSON.parse(localStorage.getItem('task2_result') || '{}')
    return task2.selectedTargetJob || task2.target_position || ''
  } catch {
    return ''
  }
}

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isRegistered } = useEffectiveAccess()
  const tabs = getPrimaryNavigation({
    isRegistered,
    primaryRole: readPrimaryRole(),
  })

  if (!isPrimaryNavigationVisible(location.pathname)) {
    return null
  }

  return (
    <nav aria-label="主导航" className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto grid h-16 max-w-xl grid-cols-5 px-1">
        {tabs.map(({ id, icon, label, to }) => {
          const isActive = isPrimaryNavigationActive(location.pathname, id)
          return (
            <button
              key={id}
              type="button"
              onClick={() => navigate(to)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={label}
              className="flex min-w-0 flex-col items-center justify-center gap-1 px-1"
            >
              {createElement(icons[icon], {
                size: 21,
                strokeWidth: isActive ? 2.3 : 1.8,
                className: isActive ? 'text-blue-700' : 'text-slate-400',
              })}
              <span
                className={`truncate text-[11px] ${
                  isActive ? 'font-semibold text-blue-700' : 'font-medium text-slate-500'
                }`}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
