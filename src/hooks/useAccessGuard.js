import { useCallback } from 'react';
import { useAccessStore } from '../store/accessStore';

const UNLOCK_REQUIRED_ROUTES = {
  tasks: ['/tasks/phase2/Task5'],
  academy: [
    '/academy/listening-speaking',
    '/academy/boarding',
    '/academy/position-english',
    '/academy/interview-questions',
    '/academy/scenarios',
    '/academy/port-daily',
  ],
  jobs: [
    '/jobs/preparation',
    '/jobs/channels',
    '/jobs/company-jobs',
    '/jobs/platforms',
    '/jobs/latest',
    '/jobs/yuge',
    '/jobs/brand-partners',
    '/jobs/applications',
  ],
};

const routeStartsWithAny = (pathname, prefixes) =>
  prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

export const checkRouteNeedsUnlock = (pathname) => {
  if (pathname.startsWith('/academy/wiki')) return false;
  if (UNLOCK_REQUIRED_ROUTES.tasks.includes(pathname)) return true;
  if (routeStartsWithAny(pathname, UNLOCK_REQUIRED_ROUTES.academy)) return true;
  if (UNLOCK_REQUIRED_ROUTES.jobs.includes(pathname)) return true;
  return false;
};

export const useAccessGuard = () => {
  const {
    isRegistered,
    isUnlocked,
    accessChecked,
    isCheckingAccess,
    openRegisterModal,
    openUnlockModal,
  } = useAccessStore();

  const canAccess = useCallback((pathname) => {
    if (!isRegistered) {
      return { canAccess: false, reason: 'register' };
    }

    if (isCheckingAccess || !accessChecked) {
      return { canAccess: false, reason: 'checking' };
    }

    if (checkRouteNeedsUnlock(pathname) && !isUnlocked) {
      return { canAccess: false, reason: 'unlock' };
    }

    return { canAccess: true, reason: null };
  }, [accessChecked, isCheckingAccess, isRegistered, isUnlocked]);

  const guardRoute = useCallback((pathname) => {
    const result = canAccess(pathname);

    if (result.reason === 'register') {
      openRegisterModal();
    } else if (result.reason === 'unlock') {
      openUnlockModal();
    }

    return result;
  }, [canAccess, openRegisterModal, openUnlockModal]);

  const guardClick = useCallback((targetPath, callback) => {
    return (event) => {
      const result = canAccess(targetPath);

      if (!result.canAccess) {
        event?.preventDefault?.();
        event?.stopPropagation?.();

        if (result.reason === 'register') {
          openRegisterModal();
        } else if (result.reason === 'unlock') {
          openUnlockModal();
        }

        return false;
      }

      callback?.(event);
      return true;
    };
  }, [canAccess, openRegisterModal, openUnlockModal]);

  return {
    isRegistered,
    isUnlocked,
    accessChecked,
    isCheckingAccess,
    canAccess,
    guardRoute,
    guardClick,
  };
};
