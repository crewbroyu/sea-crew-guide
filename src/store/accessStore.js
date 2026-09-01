import { create } from 'zustand';

const initialState = {
  isRegistered: false,
  authChecked: false,
  isCheckingAuth: true,
  userId: null,
  userEmail: null,
  userName: null,
  isUnlocked: false,
  unlockedAt: null,
  role: 'member',
  plan: 'free',
  accessStatus: 'active',
  premiumUntil: null,
  crewVerificationStatus: 'unverified',
  mentorStatus: 'inactive',
  isAdmin: false,
  previewMode: 'actual',
  accessChecked: false,
  isCheckingAccess: true,
  showRegisterModal: false,
  showUnlockModal: false,
};

export const useAccessStore = create((set, get) => ({
  ...initialState,

  register: (user, name) => {
    const userId = typeof user === 'string' ? null : user?.id || null;
    const email = typeof user === 'string' ? user : user?.email || null;

    set({
      isRegistered: Boolean(email || userId),
      authChecked: true,
      isCheckingAuth: false,
      userId,
      userEmail: email,
      userName: name || email?.split('@')[0] || null,
      showRegisterModal: false,
    });
  },

  setAccessStatus: ({
    isUnlocked,
    unlockedAt = null,
    role = 'member',
    plan = 'free',
    accessStatus = 'active',
    premiumUntil = null,
    crewVerificationStatus = 'unverified',
    mentorStatus = 'inactive',
    checked = true,
  }) => {
    const isAdmin = role === 'admin' && accessStatus === 'active';
    set((state) => ({
      isUnlocked: Boolean(isUnlocked || isAdmin),
      unlockedAt,
      role,
      plan,
      accessStatus,
      premiumUntil,
      crewVerificationStatus,
      mentorStatus,
      isAdmin,
      previewMode: isAdmin ? state.previewMode : 'actual',
      accessChecked: checked,
      isCheckingAccess: false,
      showUnlockModal: isUnlocked || isAdmin ? false : state.showUnlockModal,
    }));
  },

  setCheckingAccess: (isCheckingAccess) => set({ isCheckingAccess }),
  setCheckingAuth: (isCheckingAuth) => set({ isCheckingAuth }),

  markAuthChecked: () => set({ authChecked: true, isCheckingAuth: false }),

  unlock: ({ unlockedAt = new Date().toISOString() } = {}) => {
    set({
      isUnlocked: true,
      unlockedAt,
      plan: 'premium',
      accessStatus: 'active',
      accessChecked: true,
      isCheckingAccess: false,
      showUnlockModal: false,
    });
  },

  openRegisterModal: () => set({ showRegisterModal: true, showUnlockModal: false }),
  closeRegisterModal: () => set({ showRegisterModal: false }),
  openUnlockModal: () => set({ showUnlockModal: true, showRegisterModal: false }),
  closeUnlockModal: () => set({ showUnlockModal: false }),

  setPreviewMode: (previewMode) => {
    if (!get().isAdmin) return;
    const allowedModes = ['actual', 'anonymous', 'free', 'premium', 'mentor'];
    set({
      previewMode: allowedModes.includes(previewMode) ? previewMode : 'actual',
      showRegisterModal: false,
      showUnlockModal: false,
    });
  },

  reset: () => {
    localStorage.removeItem('access_unlocked');
    localStorage.removeItem('access_unlocked_at');
    localStorage.removeItem('activationInfo');
    localStorage.removeItem('access_unlocked_cache');
    localStorage.removeItem('access_unlocked_at_cache');
    localStorage.removeItem('access-storage');
    set({
      ...initialState,
      authChecked: true,
      isCheckingAuth: false,
      isCheckingAccess: false,
      accessChecked: true,
    });
  },
}));
