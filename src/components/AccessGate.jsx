import { useCallback, useEffect, useRef } from 'react';
import { useAccessStore } from '../store/accessStore';
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
  const {
    register,
    reset,
    setAccessStatus,
    setCheckingAuth,
    setCheckingAccess,
    closeRegisterModal,
  } = useAccessStore();
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
      return;
    }

    clearUserScopedProgressIfNeeded(user);
    register(user, getDisplayName(user));
    closeRegisterModal();
    setCheckingAccess(true);

    try {
      const access = await activationService.getUserAccessStatus(user);
      setAccessStatus(access);
    } catch (error) {
      console.error('Access check failed:', error);
      activationService.clearAccessCache();
      setAccessStatus({ isUnlocked: false, unlockedAt: null, checked: true });
    }
  }, [
    clearUserScopedProgressIfNeeded,
    closeRegisterModal,
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
      setCheckingAuth(true);

      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        console.log('No authenticated user. Continuing as guest.');
        activationService.clearAccessCache();
        reset();
        return;
      }

      console.log('Supabase auth OK:', user.email);
      await refreshAccessForUser(user);
    };

    checkAuth();
  }, [refreshAccessForUser, reset, setCheckingAuth]);

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

  return (
    <>
      <RegisterModal />
      <UnlockModal />
    </>
  );
}
