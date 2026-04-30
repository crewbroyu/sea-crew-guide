import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAccessStore } from '../store/accessStore';
import { useAccessGuard } from '../hooks/useAccessGuard';
import { supabase } from '../supabase';
import RegisterModal from './RegisterModal';
import UnlockModal from './UnlockModal';

export default function AccessGate() {
  const location = useLocation();
  const { register, checkUnlockStatus } = useAccessStore();
  const { guardRoute } = useAccessGuard();
  const hasCheckedAuth = useRef(false);

  // 页面首次加载时检查注册状态
  useEffect(() => {
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;

    const checkAuth = async () => {
      try {
        // 检查 Supabase session
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // 用户已登录（通过 Supabase session）
          register(user.email, user.email?.split('@')[0]);
        } else {
          // 检查本地存储的注册状态
          checkUnlockStatus();
          
          // 如果未注册，显示注册弹窗
          const state = useAccessStore.getState();
          if (!state.isRegistered) {
            state.openRegisterModal();
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };

    checkAuth();
  }, [register, checkUnlockStatus]);

  // 路由变化时检查权限
  useEffect(() => {
    const state = useAccessStore.getState();
    if (state.isRegistered) {
      guardRoute(location.pathname);
    }
  }, [location.pathname, guardRoute]);

  return (
    <>
      <RegisterModal />
      <UnlockModal />
    </>
  );
}
