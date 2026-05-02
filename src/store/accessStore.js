import { create } from 'zustand';

const initialState = {
  isRegistered: false,
  userId: null,
  userEmail: null,
  userName: null,
  isUnlocked: false,
  unlockedAt: null,
  accessChecked: false,
  isCheckingAccess: true,
  showRegisterModal: false,
  showUnlockModal: false,
};

export const useAccessStore = create((set) => ({
  ...initialState,

  register: (user, name) => {
    const userId = typeof user === 'string' ? null : user?.id || null;
    const email = typeof user === 'string' ? user : user?.email || null;

    set({
      isRegistered: Boolean(email || userId),
      userId,
      userEmail: email,
      userName: name || email?.split('@')[0] || null,
      showRegisterModal: false,
    });
  },

  setAccessStatus: ({ isUnlocked, unlockedAt = null, checked = true }) => {
    set((state) => ({
      isUnlocked: Boolean(isUnlocked),
      unlockedAt,
      accessChecked: checked,
      isCheckingAccess: false,
      showUnlockModal: isUnlocked ? false : state.showUnlockModal,
    }));
  },

  setCheckingAccess: (isCheckingAccess) => set({ isCheckingAccess }),

  unlock: ({ unlockedAt = new Date().toISOString() } = {}) => {
    set({
      isUnlocked: true,
      unlockedAt,
      accessChecked: true,
      isCheckingAccess: false,
      showUnlockModal: false,
    });
  },

  openRegisterModal: () => set({ showRegisterModal: true, showUnlockModal: false }),
  closeRegisterModal: () => set({ showRegisterModal: false }),
  openUnlockModal: () => set({ showUnlockModal: true, showRegisterModal: false }),
  closeUnlockModal: () => set({ showUnlockModal: false }),

  reset: () => {
    localStorage.removeItem('access_unlocked');
    localStorage.removeItem('access_unlocked_at');
    localStorage.removeItem('activationInfo');
    localStorage.removeItem('access_unlocked_cache');
    localStorage.removeItem('access_unlocked_at_cache');
    localStorage.removeItem('access-storage');
    set({ ...initialState, isCheckingAccess: false, accessChecked: true });
  },
}));
