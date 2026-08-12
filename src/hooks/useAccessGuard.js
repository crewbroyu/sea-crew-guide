import { useCallback } from 'react';
import { useAccessStore } from '../store/accessStore';

const LOGIN_REQUIRED_ROUTES = [
  '/tasks/phase2/Task4',
  '/jobs/applications',
  '/profile',
  '/my-offer',
  '/resume',
  '/messages',
];

const UNLOCK_REQUIRED_ROUTES = [
  '/boarding-materials',
  '/generate-codes',
];

const routeStartsWithAny = (pathname, prefixes) =>
  prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

export const checkRouteNeedsUnlock = (pathname) => {
  return routeStartsWithAny(pathname, UNLOCK_REQUIRED_ROUTES);
};

export const checkRouteNeedsLogin = (pathname) => {
  return checkRouteNeedsUnlock(pathname) || routeStartsWithAny(pathname, LOGIN_REQUIRED_ROUTES);
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
    if (checkRouteNeedsLogin(pathname) && !isRegistered) {
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
