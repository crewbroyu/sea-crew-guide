import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAccessStore } from '../store/accessStore';
import { useAccessGuard } from '../hooks/useAccessGuard';
import RegisterModal from './RegisterModal';
import UnlockModal from './UnlockModal';

export default function AccessGate() {
  const location = useLocation();
  const { isRegistered, checkUnlockStatus } = useAccessStore();
  const { guardRoute } = useAccessGuard();

  // 页面首次加载时检查注册状态
  useEffect(() => {
    checkUnlockStatus();
    
    // 如果未注册，显示注册弹窗
    if (!isRegistered) {
      useAccessStore.getState().openRegisterModal();
    }
  }, []);

  // 路由变化时检查权限
  useEffect(() => {
    if (isRegistered) {
      guardRoute(location.pathname);
    }
  }, [location.pathname, isRegistered, guardRoute]);

  return (
    <>
      <RegisterModal />
      <UnlockModal />
    </>
  );
}
