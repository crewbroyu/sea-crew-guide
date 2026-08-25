import { useCallback, useEffect, useRef } from 'react';
import { useAccessStore } from '../store/accessStore';
import { supabase } from '../supabase';
import { activationService } from '../services/activationService';
import RegisterModal from './RegisterModal';
import UnlockModal from './UnlockModal';

const PROGRESS_KEYS = [
  'boarding_progress',
  'assessment_result',
  'score_data',
  'checkin_data',
  'checkin_records',
  'messages',
  'job_applications',
  'port_daily_posts',
  'task1_data',
  'task2_data',
  'task2_result',
  'task4_data',
  'task5_data',
  'task7_data',
  'task8_data',
  'task9_data',
  'task10_data',
  'task10_docs',
  'task10_guide_viewed',
  'task11_data',
  'task12_data',
  'interviewSelectedPosition',
  'seafarer-resume',
];

const getDisplayName = (user) => user?.user_metadata?.name || user?.email?.split('@')[0];

const removeBlobUrlsFromValue = (value) => {
  if (typeof value === 'string') {
    return value.startsWith('blob:') ? null : value;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => removeBlobUrlsFromValue(item))
      .filter((item) => item !== null);
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((cleaned, [key, item]) => {
      const nextValue = removeBlobUrlsFromValue(item);
      if (nextValue !== null) {
        cleaned[key] = nextValue;
      }
      return cleaned;
    }, {});
  }

  return value;
};

const removePersistedBlobUrls = () => {
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    const value = key ? localStorage.getItem(key) : null;

    if (!key || !value?.includes('blob:')) continue;

    try {
      const parsedValue = JSON.parse(value);
      localStorage.setItem(key, JSON.stringify(removeBlobUrlsFromValue(parsedValue)));
    } catch {
      localStorage.removeItem(key);
    }
  }
};

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
    removePersistedBlobUrls();

    const checkAuth = async () => {
      setCheckingAuth(true);

      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        activationService.clearAccessCache();
        reset();
        return;
      }

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
