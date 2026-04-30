import { Navigate, useLocation } from 'react-router-dom';
import { useAccessGuard } from '../hooks/useAccessGuard';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { canAccess } = useAccessGuard();

  const result = canAccess(location.pathname);

  // 如果不能访问，重定向到首页（弹窗会自动显示）
  if (!result.canAccess) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
}
