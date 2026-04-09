import { create } from 'zustand'
import { authClient } from '../lib/authClient'
import { getMyProfile } from '../services/profileService'

const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  loading: true,

  setUser: (user) => set({ user, loading: false }),
  setProfile: (profile) => set({ profile }),

  initialize: async () => {
    const { data: { session } } = await authClient.getSession()
    if (session?.user) {
      const profile = await getMyProfile()
      set({ user: session.user, profile, loading: false })
    } else {
      set({ user: null, profile: null, loading: false })
    }

    authClient.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await getMyProfile()
        set({ user: session.user, profile })
      } else {
        set({ user: null, profile: null })
      }
    })
  },

  updateProfile: (newProfile) => set({ profile: newProfile }),

  signOut: async () => {
    await authClient.signOut()
    set({ user: null, profile: null })
  },
}))

export default useAuthStore