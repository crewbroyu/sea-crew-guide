import { useEffect } from 'react';
import useEffectiveAccess from '../hooks/useEffectiveAccess';

function AuthCheckingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-4" />
        <p className="text-gray-600">Checking sign-in...</p>
      </div>
    </div>
  );
}

function LoginRequiredFallback({ message, onLogin }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="max-w-sm text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to continue</h2>
        <p className="text-gray-600 text-sm">
          {message || 'This feature saves personal data, so it needs an account.'}
        </p>
        <button
          type="button"
          onClick={onLogin}
          className="mt-5 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}

function InlineFallback({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full py-3 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
    >
      {label}
    </button>
  );
}

export default function RequireLogin({
  children,
  fallback,
  message,
  variant = 'page',
  autoOpen,
}) {
  const {
    isRegistered,
    authChecked,
    isCheckingAuth,
    openRegisterModal,
  } = useEffectiveAccess();

  const shouldAutoOpen = autoOpen ?? variant === 'page';

  useEffect(() => {
    if (shouldAutoOpen && authChecked && !isCheckingAuth && !isRegistered) {
      openRegisterModal();
    }
  }, [authChecked, isCheckingAuth, isRegistered, openRegisterModal, shouldAutoOpen]);

  if (isCheckingAuth || !authChecked) {
    return fallback || <AuthCheckingFallback />;
  }

  if (!isRegistered) {
    if (variant === 'inline') {
      return fallback || <InlineFallback label="Sign in to continue" onClick={openRegisterModal} />;
    }

    return fallback || <LoginRequiredFallback message={message} onLogin={openRegisterModal} />;
  }

  return children;
}
