import { apiClient } from './apiClient'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

function normalizeUser(raw) {
  if (!raw) return null
  return { ...raw, id: raw.id || raw.uid }
}

const listeners = new Set()

function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

function setStoredUser(user) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  else localStorage.removeItem(USER_KEY)
}

function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function emit(session) {
  listeners.forEach((cb) => cb('auth', session))
}

function buildSession(user, token) {
  if (!user || !token) return null
  return { user, access_token: token }
}

export const authClient = {
  async signUp({ email, password }) {
    try {
      const data = await apiClient.post('/auth/register', { email, password })
      const token = data?.accessToken || data?.token || null
      const user = normalizeUser(data?.user || null)
      setToken(token)
      setStoredUser(user)
      const session = buildSession(user, token)
      emit(session)
      return { data: { user, session }, error: null }
    } catch (err) {
      return { data: { user: null, session: null }, error: err.message || '注册失败' }
    }
  },

  async signInWithPassword({ email, password }) {
    try {
      const data = await apiClient.post('/auth/login', { email, password })
      const token = data?.accessToken || data?.token || null
      const user = normalizeUser(data?.user || null)
      setToken(token)
      setStoredUser(user)
      const session = buildSession(user, token)
      emit(session)
      return { data: { user, session }, error: null }
    } catch (err) {
      return { data: { user: null, session: null }, error: err.message || '登录失败' }
    }
  },

  async signOut() {
    try {
      await apiClient.post('/auth/logout', {})
    } catch {
      // Logout should still clear local state if backend is unreachable.
    }
    setToken(null)
    setStoredUser(null)
    emit(null)
    return { error: null }
  },

  async getSession() {
    const token = localStorage.getItem(TOKEN_KEY)
    const user = normalizeUser(getStoredUser())
    return { data: { session: buildSession(user, token) } }
  },

  onAuthStateChange(callback) {
    listeners.add(callback)
    return {
      data: {
        subscription: {
          unsubscribe: () => listeners.delete(callback),
        },
      },
    }
  },
}
