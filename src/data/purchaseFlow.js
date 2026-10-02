export const BAR_SERVER_PRODUCT_CODE = 'bar_server_pack'
export const ACTIVATION_RETURN_ROUTE_KEY = 'activation_return_route'

export const PURCHASE_STATUS_CONFIG = {
  requested: {
    step: 1,
    label: '申请已提交',
    description: '等待人工联系并确认付款方式。页面不会自动扣款。',
  },
  payment_confirmed: {
    step: 2,
    label: '付款已确认',
    description: '款项已经核对，正在生成并发送专属激活码。',
  },
  activation_sent: {
    step: 3,
    label: '激活码已发送',
    description: '请检查注册邮箱或约定的联系方式，然后输入激活码。',
  },
  cancelled: {
    step: 0,
    label: '申请已取消',
    description: '本次申请已关闭；仍需要时可以重新提交。',
  },
}

const sourceReturnRoutes = {
  'bar-server-trial': '/programs/bar-server/foundation',
  'bar-server-trial-report': '/programs/bar-server/foundation',
  'task6-ai-coach': '/tasks/phase2/Task6',
  'task7-ai-report': '/tasks/phase2/Task7/voice?position=bar_server',
  'task7-ai-quota': '/tasks/phase2/Task7/voice?position=bar_server',
  'task8-ai-quota': '/tasks/phase2/Task7/mock',
}

export const isSafeInternalRoute = (route) => {
  if (typeof route !== 'string') return false
  const value = route.trim()
  return value.startsWith('/')
    && !value.startsWith('//')
    && !value.includes('\\')
    && !value.startsWith('/premium')
}

export const resolvePurchaseReturnRoute = ({ search = '', state = null } = {}) => {
  const params = new URLSearchParams(search)
  const requestedRoute = state?.returnTo || params.get('returnTo')
  if (isSafeInternalRoute(requestedRoute)) return requestedRoute.trim()

  return sourceReturnRoutes[params.get('source')] || '/programs/bar-server/foundation'
}

export const rememberActivationReturnRoute = (route, storage = globalThis.sessionStorage) => {
  if (!storage || !isSafeInternalRoute(route)) return false
  try {
    storage.setItem(ACTIVATION_RETURN_ROUTE_KEY, route.trim())
    return true
  } catch {
    return false
  }
}

export const consumeActivationReturnRoute = (storage = globalThis.sessionStorage) => {
  if (!storage) return null
  try {
    const route = storage.getItem(ACTIVATION_RETURN_ROUTE_KEY)
    storage.removeItem(ACTIVATION_RETURN_ROUTE_KEY)
    return isSafeInternalRoute(route) ? route.trim() : null
  } catch {
    return null
  }
}

export const getPurchaseStatusConfig = (status) => PURCHASE_STATUS_CONFIG[status] || null

