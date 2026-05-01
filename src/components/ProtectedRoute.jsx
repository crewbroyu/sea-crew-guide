import { Navigate, useLocation } from 'react-router-dom';
import { useAccessGuard } from '../hooks/useAccessGuard';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { canAccess } = useAccessGuard();
  const result = canAccess(location.pathname);

  if (result.reason === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-4" />
          <p className="text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!result.canAccess) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
}
