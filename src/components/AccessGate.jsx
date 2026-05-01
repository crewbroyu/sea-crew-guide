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
  } = useAccessStore();
  const { guardRoute } = useAccessGuard();
  const hasCheckedAuth = useRef(false);

  const refreshAccessForUser = useCallback(async (user) => {
    if (!user) {
      reset();
      openRegisterModal();
      return;
    }

    register(user, user.user_metadata?.name || user.email?.split('@')[0]);
    setCheckingAccess(true);

    try {
      const access = await activationService.getUserAccessStatus();
      setAccessStatus(access);
    } catch (error) {
      console.error('Access check failed:', error);
      setAccessStatus({ isUnlocked: false, unlockedAt: null, checked: true });
    }
  }, [openRegisterModal, register, reset, setAccessStatus, setCheckingAccess]);

  useEffect(() => {
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;

    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('Auth check failed:', error);
        reset();
        openRegisterModal();
        return;
      }

      await refreshAccessForUser(user);
    };

    checkAuth();
  }, [openRegisterModal, refreshAccessForUser, reset]);

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
