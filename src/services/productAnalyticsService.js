import { supabase } from '../supabase'

const ANONYMOUS_ID_KEY = 'crewpath_anonymous_id'

const getAnonymousId = () => {
  let value = localStorage.getItem(ANONYMOUS_ID_KEY)
  if (!value) {
    value = window.crypto?.randomUUID?.() || `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem(ANONYMOUS_ID_KEY, value)
  }
  return value
}

export const trackProductEvent = async (eventName, {
  productCode = 'bar_server_pack',
  properties = {},
} = {}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      user_id: user?.id || null,
      anonymous_id: user ? null : getAnonymousId(),
      event_name: eventName,
      route: `${window.location.pathname}${window.location.search}`.slice(0, 500),
      product_code: productCode,
      properties,
    }
    const { error } = await supabase.from('product_events').insert(payload)
    if (error) console.warn('Product event tracking failed:', error.message)
  } catch (error) {
    console.warn('Product event tracking failed:', error)
  }
}
