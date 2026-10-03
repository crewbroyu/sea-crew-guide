const AUTH_INTENT_ORIGIN = 'https://crewpath.local'

export const getSafeAuthIntentRoute = (value, fallback = '/') => {
  if (typeof value !== 'string' || !value.trim().startsWith('/')) return fallback

  try {
    const url = new URL(value.trim(), AUTH_INTENT_ORIGIN)
    if (url.origin !== AUTH_INTENT_ORIGIN || url.pathname === '/auth/callback') return fallback
    return `${url.pathname}${url.search}`
  } catch {
    return fallback
  }
}

export const getCurrentAuthIntentRoute = (locationValue = window.location) => (
  getSafeAuthIntentRoute(`${locationValue.pathname || '/'}${locationValue.search || ''}`)
)
