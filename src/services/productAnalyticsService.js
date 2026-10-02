import { supabase } from '../supabase'

const ANONYMOUS_ID_KEY = 'crewpath_anonymous_id'

const getAnonymousId = () => {
  try {
    let value = localStorage.getItem(ANONYMOUS_ID_KEY)
    if (!value) {
      value = window.crypto?.randomUUID?.() || `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`
      localStorage.setItem(ANONYMOUS_ID_KEY, value)
    }
    return value
  } catch {
    return window.crypto?.randomUUID?.() || `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

const readSessionMarker = (key) => {
  try { return sessionStorage.getItem(key) } catch { return null }
}

const writeSessionMarker = (key, value) => {
  try { sessionStorage.setItem(key, value) } catch { /* Analytics must never block the product flow. */ }
}

const removeSessionMarker = (key) => {
  try { sessionStorage.removeItem(key) } catch { /* Analytics must never block the product flow. */ }
}

export const trackProductEvent = async (eventName, {
  productCode = 'bar_server_pack',
  properties = {},
  oncePerSession = false,
  dedupeKey = '',
} = {}) => {
  const sessionKey = `product_event:${eventName}:${dedupeKey || window.location.pathname}`
  if (oncePerSession && readSessionMarker(sessionKey)) return false

  if (oncePerSession) writeSessionMarker(sessionKey, 'pending')
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user || null
    const payload = {
      user_id: user?.id || null,
      anonymous_id: getAnonymousId(),
      event_name: eventName,
      route: `${window.location.pathname}${window.location.search}`.slice(0, 500),
      product_code: productCode,
      properties,
    }
    const { error } = await supabase.from('product_events').insert(payload)
    if (error) throw error
    if (oncePerSession) writeSessionMarker(sessionKey, 'recorded')
    return true
  } catch (error) {
    if (oncePerSession) removeSessionMarker(sessionKey)
    console.warn('Product event tracking failed:', error)
    return false
  }
}
