import { useState } from 'react';
import { useAccessStore } from '../store/accessStore';
import { activationService, hasProductEntitlement } from '../services/activationService';

export default function UnlockModal() {
  const {
    showUnlockModal,
    closeUnlockModal,
    setAccessStatus,
    openRegisterModal,
  } = useAccessStore();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleActivate = async () => {
    if (!code.trim()) {
      setError('Please enter activation code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const user = await activationService.getCurrentUser();
      const result = await activationService.activateCode(code);
      const access = await activationService.getUserAccessStatus(user);

      if (!access.isUnlocked && !hasProductEntitlement(access, result.productCode)) {
        throw new Error('Activation saved but access verification failed');
      }

      setShowSuccess(true);
      setAccessStatus({ ...access, unlockedAt: access.unlockedAt || result.unlockedAt, checked: true });
      
      setTimeout(() => {
        closeUnlockModal();
        setShowSuccess(false);
        setCode('');
      }, 1500);
    } catch (err) {
      const errorMsg = err.message;
      console.error('激活失败:', errorMsg);
      
      if (errorMsg?.includes('Invalid code')) {
        setError('Invalid code');
      } else if (errorMsg?.includes('Code already used')) {
        setError('Code already used');
      } else if (errorMsg?.includes('Login required')) {
        setError('Please sign in before activating');
        closeUnlockModal();
        openRegisterModal();
      } else {
        setError(errorMsg || 'Activation failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!showUnlockModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={closeUnlockModal}></div>
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 mx-4">
        {showSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Activation successful</h3>
            <p className="text-gray-600">对应产品权益已解锁</p>
          </div>
        ) : (
          <>
            <button
              onClick={closeUnlockModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Full access requires activation</h3>
              <p className="text-gray-600">完整功能需激活后使用</p>
              <div className="mt-4 text-sm text-blue-600">
                <p>Limited early access</p>
                <p>当前为内测阶段，名额有限</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter activation code"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center">{error}</div>
              )}

              <button
                onClick={handleActivate}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Processing...' : 'Activate Code'}
              </button>

              <div className="text-center text-gray-500 text-sm">
                <p>Get your code via WeChat</p>
                <p className="text-xs mt-1">添加微信获取激活码</p>
              </div>
              
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    closeUnlockModal();
                    openRegisterModal();
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Already have an account? Sign In · 已有账户？登录
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
