import { useCallback } from 'react';
import { useAccessStore } from '../store/accessStore';

// 需要解锁的路由配置
const UNLOCK_REQUIRED_ROUTES = {
  // 任务路由
  tasks: {
    '/tasks/phase2/Task5': true,  // 任务5需要解锁
  },
  // 海乘学院路由（海乘百科除外）
  academy: {
    '/academy/listening-speaking': true,
    '/academy/listening-speaking/:category': true,
    '/academy/listening-speaking/:category/:course': true,
    '/academy/boarding': true,
    '/academy/boarding/detail': true,
    '/academy/boarding/advice': true,
    '/academy/boarding/wechat': true,
    '/academy/position-english': true,
    '/academy/interview-questions': true,
    '/academy/scenarios': true,
    '/academy/scenarios/detail': true,
    '/academy/port-daily': true,
    // 海乘百科免费
    '/academy/wiki': false,
    '/academy/wiki/:id': false,
  },
  // 求职中心路由
  jobs: {
    '/jobs/preparation': true,
    '/jobs/channels': true,
    '/jobs/company-jobs': true,
    '/jobs/platforms': true,
    '/jobs/latest': true,
    '/jobs/yuge': true,
    '/jobs/brand-partners': true,
    '/jobs/applications': true,
  }
};

// 检查路由是否需要解锁
const checkRouteNeedsUnlock = (pathname) => {
  // 检查任务路由
  for (const route in UNLOCK_REQUIRED_ROUTES.tasks) {
    if (pathname === route) {
      return UNLOCK_REQUIRED_ROUTES.tasks[route];
    }
  }
  
  // 检查海乘学院路由
  for (const route in UNLOCK_REQUIRED_ROUTES.academy) {
    if (pathname === route || pathname.startsWith(route.replace('/:category', '').replace('/:course', '').replace('/:id', ''))) {
      // 特殊处理：海乘百科免费
      if (pathname.startsWith('/academy/wiki')) {
        return false;
      }
      return UNLOCK_REQUIRED_ROUTES.academy[route];
    }
  }
  
  // 检查求职中心路由
  for (const route in UNLOCK_REQUIRED_ROUTES.jobs) {
    if (pathname === route) {
      return UNLOCK_REQUIRED_ROUTES.jobs[route];
    }
  }
  
  return false;
};

export const useAccessGuard = () => {
  const { 
    isRegistered, 
    isUnlocked, 
    openRegisterModal, 
    openUnlockModal,
    checkUnlockStatus 
  } = useAccessStore();

  // 检查是否可以访问路由
  const canAccess = useCallback((pathname) => {
    // 先检查解锁状态
    checkUnlockStatus();
    
    // 如果未注册，需要先注册
    if (!isRegistered) {
      return { canAccess: false, reason: 'register' };
    }
    
    // 检查路由是否需要解锁
    const needsUnlock = checkRouteNeedsUnlock(pathname);
    
    if (needsUnlock && !isUnlocked) {
      return { canAccess: false, reason: 'unlock' };
    }
    
    return { canAccess: true, reason: null };
  }, [isRegistered, isUnlocked, checkUnlockStatus]);

  // 拦截路由访问
  const guardRoute = useCallback((pathname) => {
    const result = canAccess(pathname);
    
    if (!result.canAccess) {
      if (result.reason === 'register') {
        openRegisterModal();
      } else if (result.reason === 'unlock') {
        openUnlockModal();
      }
    }
    
    return result;
  }, [canAccess, openRegisterModal, openUnlockModal]);

  // 拦截点击事件
  const guardClick = useCallback((targetPath, callback) => {
    return (e) => {
      const result = canAccess(targetPath);
      
      if (!result.canAccess) {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        
        if (result.reason === 'register') {
          openRegisterModal();
        } else if (result.reason === 'unlock') {
          openUnlockModal();
        }
        
        return false;
      }
      
      // 允许访问，执行回调
      if (callback) {
        callback(e);
      }
      
      return true;
    };
  }, [canAccess, openRegisterModal, openUnlockModal]);

  return {
    isRegistered,
    isUnlocked,
    canAccess,
    guardRoute,
    guardClick,
    checkUnlockStatus
  };
};
