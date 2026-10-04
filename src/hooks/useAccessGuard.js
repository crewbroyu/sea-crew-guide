import { requiresAdministrator, isActiveAdministrator, hasLegacyAccess } from '../utils/accessPolicy.js';
import { useAccessStore } from '../store/accessStore';
import { useCallback } from 'react';
import useEffectiveAccess from './useEffectiveAccess';

const LOGIN_REQUIRED_ROUTES = [
  '/tasks/phase2/Task4',
  '/tasks/phase2/Task8',
  '/jobs/applications',
  '/profile',
  '/my-offer',
  '/tasks/Task10',
  '/tasks/Task11',
  '/tasks/Task12',
  '/resume',
  '/messages',
];

const UNLOCK_REQUIRED_ROUTES = [
  '/boarding-materials',
];

const routeStartsWithAny = (pathname, prefixes) =>
  prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

export const checkRouteNeedsUnlock = (pathname) => {
  return routeStartsWithAny(pathname, UNLOCK_REQUIRED_ROUTES);
};

export const checkRouteNeedsLogin = (pathname) => {
  return requiresAdministrator(pathname) || checkRouteNeedsUnlock(pathname) || routeStartsWithAny(pathname, LOGIN_REQUIRED_ROUTES);
};

export const useAccessGuard = () => {
  const actualAccess = useAccessStore();
  const effectiveAccess = useEffectiveAccess();
  const {
    isRegistered,
    isUnlocked,
    accessChecked,
    isCheckingAccess,
    openRegisterModal,
    openUnlockModal,
  } = effectiveAccess;

  const canAccess = useCallback((pathname) => {
    if (requiresAdministrator(pathname)) {
      if (!actualAccess.authChecked || !actualAccess.accessChecked || actualAccess.isCheckingAuth || actualAccess.isCheckingAccess) return { canAccess: false, reason: 'checking' };
      if (!actualAccess.isRegistered) return { canAccess: false, reason: 'register' };
      return isActiveAdministrator(actualAccess) ? { canAccess: true, reason: null } : { canAccess: false, reason: 'admin' };
    }
    if (checkRouteNeedsLogin(pathname) && !isRegistered) {
      return { canAccess: false, reason: 'register' };
    }

    if (isCheckingAccess || !accessChecked) {
      return { canAccess: false, reason: 'checking' };
    }

    if (checkRouteNeedsUnlock(pathname) && effectiveAccess.accessStatus !== 'active') {
      return { canAccess: false, reason: 'restricted' };
    }

    if (checkRouteNeedsUnlock(pathname) && !hasLegacyAccess(effectiveAccess)) {
      return { canAccess: false, reason: 'unlock' };
    }

    return { canAccess: true, reason: null };
  }, [accessChecked, isCheckingAccess, isRegistered, actualAccess, effectiveAccess]);

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
