const PRIMARY_NAV_PATHS = new Set([
  '/',
  '/tasks',
  '/academy',
  '/jobs',
  '/profile',
  '/programs/bar-server',
  '/programs/retail',
])

const normalizeRole = (value = '') => String(value).trim().toLowerCase().replace(/[\s-]+/g, '_')

export const getPreferredTrainingRoute = (primaryRole = '') => {
  const role = normalizeRole(primaryRole)
  if (['bar', 'bar_server', 'barserver'].includes(role) || role.includes('酒吧')) {
    return '/programs/bar-server'
  }
  if (['retail', 'retail_sales', 'retail_sales_associate', 'retailsales'].includes(role) || role.includes('免税')) {
    return '/programs/retail'
  }
  return '/academy'
}

export const getPrimaryNavigation = ({ isRegistered = false, primaryRole = '' } = {}) => [
  { id: 'today', icon: 'home', label: isRegistered ? '今天' : '首页', to: '/' },
  { id: 'route', icon: 'route', label: '路线', to: '/tasks' },
  { id: 'training', icon: 'training', label: '训练', to: getPreferredTrainingRoute(primaryRole) },
  { id: 'jobs', icon: 'jobs', label: '求职', to: '/jobs' },
  { id: 'profile', icon: 'profile', label: isRegistered ? '我的' : '登录', to: '/profile' },
]

export const isPrimaryNavigationVisible = (pathname = '') => PRIMARY_NAV_PATHS.has(pathname)

export const isPrimaryNavigationActive = (pathname, tabId) => {
  if (tabId === 'today') return pathname === '/'
  if (tabId === 'route') return pathname === '/tasks'
  if (tabId === 'training') return pathname === '/academy' || /^\/programs\/(bar-server|retail)$/.test(pathname)
  if (tabId === 'jobs') return pathname === '/jobs'
  if (tabId === 'profile') return pathname === '/profile'
  return false
}

