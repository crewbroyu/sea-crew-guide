import { useEffect } from 'react';
import { useAccessStore } from '../store/accessStore';

function ActivationCheckingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-600 mb-4" />
        <p className="text-gray-600">Checking activation...</p>
      </div>
    </div>
  );
}

function ActivationRequiredFallback({ message, onActivate }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="max-w-sm text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Activation required</h2>
        <p className="text-gray-600 text-sm">
          {message || 'Preview is free. Activate your account to start this premium feature.'}
        </p>
        <button
          type="button"
          onClick={onActivate}
          className="mt-5 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          Activate
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
      className="w-full py-4 rounded-lg font-medium transition-colors text-lg bg-blue-600 text-white hover:bg-blue-700"
    >
      {label}
    </button>
  );
}

export default function RequireActivation({
  children,
  fallback,
  loginFallback,
  message,
  variant = 'page',
  autoOpen,
}) {
  const {
    isRegistered,
    isUnlocked,
    authChecked,
    isCheckingAuth,
    accessChecked,
    isCheckingAccess,
    openRegisterModal,
    openUnlockModal,
  } = useAccessStore();

  const shouldAutoOpen = autoOpen ?? variant === 'page';

  useEffect(() => {
    if (!shouldAutoOpen) return;

    if (authChecked && !isCheckingAuth && !isRegistered) {
      openRegisterModal();
    } else if (accessChecked && !isCheckingAccess && !isUnlocked) {
      openUnlockModal();
    }
  }, [
    accessChecked,
    authChecked,
    isCheckingAccess,
    isCheckingAuth,
    isRegistered,
    isUnlocked,
    openRegisterModal,
    openUnlockModal,
    shouldAutoOpen,
  ]);

  if (isCheckingAuth || !authChecked || isCheckingAccess || !accessChecked) {
    if (variant === 'inline') {
      return fallback || <InlineFallback label="Checking access..." onClick={() => {}} />;
    }

    return fallback || <ActivationCheckingFallback />;
  }

  if (!isRegistered) {
    if (variant === 'inline') {
      return loginFallback || fallback || (
        <InlineFallback label="Sign in to start" onClick={openRegisterModal} />
      );
    }

    return loginFallback || fallback || (
      <ActivationRequiredFallback
        message="Please sign in before using this feature."
        onActivate={openRegisterModal}
      />
    );
  }

  if (!isUnlocked) {
    if (variant === 'inline') {
      return fallback || <InlineFallback label="Activate to start" onClick={openUnlockModal} />;
    }

    return fallback || (
      <ActivationRequiredFallback message={message} onActivate={openUnlockModal} />
    );
  }

  return children;
}
