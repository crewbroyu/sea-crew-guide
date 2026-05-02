import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAccessStore } from '../store/accessStore';
import { useAccessGuard } from '../hooks/useAccessGuard';
import { supabase } from '../supabase';
import { activationService } from '../services/activationService';
import RegisterModal from './RegisterModal';
import UnlockModal from './UnlockModal';

export default function AccessGate() {
  const location = useLocation();
  const {
    register,
    reset,
    setAccessStatus,
    setCheckingAccess,
    openRegisterModal,
    openUnlockModal,
  } = useAccessStore();
  const { guardRoute } = useAccessGuard();
  const hasCheckedAuth = useRef(false);

  const refreshAccessForUser = useCallback(async (user) => {
    // 先检查 localStorage 是否有解锁信息
    const localStorageUnlocked = localStorage.getItem('access_unlocked') === 'true';
    if (localStorageUnlocked) {
      console.log('从 localStorage 读取到解锁状态');
      // 如果有用户信息，注册用户
      if (user) {
        register(user, user.user_metadata?.name || user.email?.split('@')[0]);
      } else {
        register('unlocked_user', 'User');
      }
      setAccessStatus({ isUnlocked: true, unlockedAt: localStorage.getItem('access_unlocked_at'), checked: true });
      return;
    }

    // 如果没有 localStorage 解锁状态，但有用户，检查数据库
    if (user) {
      // 获取之前存储的用户ID
      const previousUserId = localStorage.getItem('current_user_id');
      const currentUserId = user.id;

      // 如果用户切换了，清除之前用户的任务进度和积分数据
      if (previousUserId && previousUserId !== currentUserId) {
        console.log('用户切换，清除旧数据');
        localStorage.removeItem('boarding_progress');
        localStorage.removeItem('score_data');
        localStorage.removeItem('checkin_data');
        localStorage.removeItem('task1_data');
        localStorage.removeItem('task2_data');
        localStorage.removeItem('task4_data');
        localStorage.removeItem('task5_data');
        localStorage.removeItem('task7_data');
        localStorage.removeItem('task8_data');
        localStorage.removeItem('task9_data');
        localStorage.removeItem('task10_data');
        localStorage.removeItem('task11_data');
        localStorage.removeItem('task12_data');
      }

      // 保存当前用户ID
      localStorage.setItem('current_user_id', currentUserId);

      register(user, user.user_metadata?.name || user.email?.split('@')[0]);

      setCheckingAccess(true);

      try {
        const access = await activationService.getUserAccessStatus();
        setAccessStatus(access);
      } catch (error) {
        console.error('Access check failed:', error);
        setAccessStatus({ isUnlocked: false, unlockedAt: null, checked: true });
      }
    }
  }, [register, setAccessStatus, setCheckingAccess]);

  useEffect(() => {
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;

    const checkAuth = async () => {
      console.log('========== AccessGate 检查认证 ==========');
      
      // 首先检查 localStorage 是否有解锁信息
      const localStorageUnlocked = localStorage.getItem('access_unlocked') === 'true';
      console.log('检查localStorage解锁状态:', localStorageUnlocked);
      
      if (localStorageUnlocked) {
        console.log('✓ 从 localStorage 读取到解锁状态');
        register('unlocked_user', 'User');
        setAccessStatus({ isUnlocked: true, unlockedAt: localStorage.getItem('access_unlocked_at'), checked: true });
        return;
      }
      
      // 然后检查 Supabase 认证
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        console.log('没有有效的认证，打开激活码弹窗');
        reset();
        openUnlockModal(); // 优先打开激活码弹窗
        return;
      }

      console.log('✓ Supabase认证成功，用户:', user?.email);
      await refreshAccessForUser(user);
    };

    checkAuth();
  }, [openUnlockModal, refreshAccessForUser, register, reset, setAccessStatus]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await refreshAccessForUser(session?.user || null);
      }
    );

    return () => subscription?.unsubscribe();
  }, [refreshAccessForUser]);

  useEffect(() => {
    guardRoute(location.pathname);
  }, [location.pathname, guardRoute]);

  return (
    <>
      <RegisterModal />
      <UnlockModal />
    </>
  );
}
