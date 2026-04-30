import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAccessStore = create(
  persist(
    (set, get) => ({
      // 用户注册状态
      isRegistered: false,
      userEmail: null,
      userName: null,
      
      // 激活解锁状态
      isUnlocked: false,
      unlockedAt: null,
      
      // 弹窗状态
      showRegisterModal: false,
      showUnlockModal: false,
      
      // 注册
      register: (email, name) => {
        set({
          isRegistered: true,
          userEmail: email,
          userName: name,
          showRegisterModal: false
        });
      },
      
      // 解锁
      unlock: () => {
        set({
          isUnlocked: true,
          unlockedAt: new Date().toISOString(),
          showUnlockModal: false
        });
        localStorage.setItem('access_unlocked', 'true');
      },
      
      // 显示注册弹窗
      openRegisterModal: () => set({ showRegisterModal: true }),
      
      // 关闭注册弹窗
      closeRegisterModal: () => set({ showRegisterModal: false }),
      
      // 显示解锁弹窗
      openUnlockModal: () => set({ showUnlockModal: true }),
      
      // 关闭解锁弹窗
      closeUnlockModal: () => set({ showUnlockModal: false }),
      
      // 检查是否已解锁
      checkUnlockStatus: () => {
        const unlocked = localStorage.getItem('access_unlocked') === 'true';
        if (unlocked && !get().isUnlocked) {
          set({ isUnlocked: true });
        }
        return unlocked;
      },
      
      // 重置（用于测试）
      reset: () => {
        set({
          isRegistered: false,
          userEmail: null,
          userName: null,
          isUnlocked: false,
          unlockedAt: null,
          showRegisterModal: false,
          showUnlockModal: false
        });
        localStorage.removeItem('access_unlocked');
      }
    }),
    {
      name: 'access-storage',
      partialize: (state) => ({
        isRegistered: state.isRegistered,
        userEmail: state.userEmail,
        userName: state.userName,
        isUnlocked: state.isUnlocked,
        unlockedAt: state.unlockedAt
      })
    }
  )
);
