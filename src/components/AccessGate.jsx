import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAccessStore } from '../store/accessStore';
import { useAccessGuard } from '../hooks/useAccessGuard';
import { supabase } from '../supabase';
import { activationService } from '../services/activationService';
import RegisterModal from './RegisterModal';
import UnlockModal from './UnlockModal';

const PROGRESS_KEYS = [
  'boarding_progress',
  'score_data',
  'checkin_data',
  'task1_data',
  'task2_data',
  'task4_data',
  'task5_data',
  'task7_data',
  'task8_data',
  'task9_data',
  'task10_data',
  'task11_data',
  'task12_data',
];

const getDisplayName = (user) => user?.user_metadata?.name || user?.email?.split('@')[0];

export default function AccessGate() {
  const location = useLocation();
  const {
    register,
    reset,
    setAccessStatus,
    setCheckingAccess,
    openRegisterModal,
    openUnlockModal,
    closeRegisterModal,
  } = useAccessStore();
  const { guardRoute } = useAccessGuard();
  const hasCheckedAuth = useRef(false);

  const clearUserScopedProgressIfNeeded = useCallback((user) => {
    const previousUserId = localStorage.getItem('current_user_id');

    if (previousUserId && previousUserId !== user.id) {
      PROGRESS_KEYS.forEach((key) => localStorage.removeItem(key));
      activationService.clearAccessCache();
    }

    localStorage.setItem('current_user_id', user.id);
  }, []);

  const refreshAccessForUser = useCallback(async (user) => {
    if (!user?.id) {
      activationService.clearAccessCache();
      reset();
      openRegisterModal();
      return;
    }

    clearUserScopedProgressIfNeeded(user);
    register(user, getDisplayName(user));
    closeRegisterModal();
    setCheckingAccess(true);

    try {
      const access = await activationService.getUserAccessStatus(user);
      setAccessStatus(access);

      if (!access.isUnlocked) {
        openUnlockModal();
      }
    } catch (error) {
      console.error('Access check failed:', error);
      activationService.clearAccessCache();
      setAccessStatus({ isUnlocked: false, unlockedAt: null, checked: true });
      openUnlockModal();
    }
  }, [
    clearUserScopedProgressIfNeeded,
    closeRegisterModal,
    openRegisterModal,
    openUnlockModal,
    register,
    reset,
    setAccessStatus,
    setCheckingAccess,
  ]);

  useEffect(() => {
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;

    const checkAuth = async () => {
      console.log('========== AccessGate auth check ==========');

      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        console.log('No authenticated user. Opening login modal.');
        activationService.clearAccessCache();
        reset();
        openRegisterModal();
        return;
      }

      console.log('Supabase auth OK:', user.email);
      await refreshAccessForUser(user);
    };

    checkAuth();
  }, [openRegisterModal, refreshAccessForUser, reset]);

  useEffect(() => {
    let refreshTimer = null;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (refreshTimer) {
          clearTimeout(refreshTimer);
        }

        refreshTimer = setTimeout(() => {
          refreshAccessForUser(session?.user || null);
        }, 0);
      }
    );

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      subscription?.unsubscribe();
    };
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
