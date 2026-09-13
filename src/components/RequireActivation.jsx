import { useEffect } from 'react';
import useEffectiveAccess from '../hooks/useEffectiveAccess';
import { hasProductEntitlement } from '../services/activationService';

function ActivationCheckingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-600 mb-4" />
        <p className="text-gray-600">正在检查访问权限...</p>
      </div>
    </div>
  );
}

function ActivationRequiredFallback({ message, onActivate }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="max-w-sm text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">需要激活</h2>
        <p className="text-gray-600 text-sm">
          {message || '免费内容可直接体验，激活后可使用完整功能。'}
        </p>
        <button
          type="button"
          onClick={onActivate}
          className="mt-5 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          前往激活
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
  productCode,
}) {
  const access = useEffectiveAccess();
  const {
    isRegistered,
    isUnlocked,
    authChecked,
    isCheckingAuth,
    accessChecked,
    isCheckingAccess,
    openRegisterModal,
    openUnlockModal,
  } = access;
  const hasRequiredAccess = productCode
    ? hasProductEntitlement(access, productCode)
    : isUnlocked;

  const shouldAutoOpen = autoOpen ?? variant === 'page';

  useEffect(() => {
    if (!shouldAutoOpen) return;

    if (authChecked && !isCheckingAuth && !isRegistered) {
      openRegisterModal();
    } else if (accessChecked && !isCheckingAccess && !hasRequiredAccess) {
      openUnlockModal();
    }
  }, [
    accessChecked,
    authChecked,
    isCheckingAccess,
    isCheckingAuth,
    isRegistered,
    hasRequiredAccess,
    openRegisterModal,
    openUnlockModal,
    shouldAutoOpen,
  ]);

  if (isCheckingAuth || !authChecked || isCheckingAccess || !accessChecked) {
    if (variant === 'inline') {
      return fallback || <InlineFallback label="正在检查权限..." onClick={() => {}} />;
    }

    return fallback || <ActivationCheckingFallback />;
  }

  if (!isRegistered) {
    if (variant === 'inline') {
      return loginFallback || fallback || (
        <InlineFallback label="登录后继续" onClick={openRegisterModal} />
      );
    }

    return loginFallback || fallback || (
      <ActivationRequiredFallback
        message="请先登录，再使用此功能。"
        onActivate={openRegisterModal}
      />
    );
  }

  if (!hasRequiredAccess) {
    if (variant === 'inline') {
      return fallback || <InlineFallback label="激活后继续" onClick={openUnlockModal} />;
    }

    return fallback || (
      <ActivationRequiredFallback message={message} onActivate={openUnlockModal} />
    );
  }

  return children;
}
