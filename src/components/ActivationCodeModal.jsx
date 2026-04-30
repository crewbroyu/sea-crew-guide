import { useState } from 'react';
import { activationService } from '../services/activationService';

export default function ActivationCodeModal({ isOpen, onClose, onSuccess }) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleActivate = async () => {
    if (!code.trim()) {
      setError('请输入激活码');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await activationService.activateCode(code.trim().toUpperCase());
      setShowSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose?.();
      }, 1500);
    } catch (err) {
      if (err.message === 'Invalid code') {
        setError('Invalid code');
      } else if (err.message === 'Code already used') {
        setError('Code already used');
      } else {
        setError('Activation failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-8 mx-4">
        {showSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Access granted. Full guide unlocked.</h3>
            <p className="text-gray-600">已解锁完整内容</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Full guide is available via activation code</h3>
              <p className="text-gray-600">完整内容需激活码解锁</p>
              <div className="mt-4 text-sm text-blue-600">
                <p>Limited early access</p>
                <p>当前为内测阶段，名额有限</p>
              </div>
              <div className="mt-2 text-gray-500">
                <p>Get your code via WeChat</p>
                <p>添加微信获取激活码</p>
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
                  placeholder="输入激活码"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
                />
              </div>

              {error && (
                <div className="text-red-600 text-center">{error}</div>
              )}

              <button
                onClick={handleActivate}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium disabled:opacity-50"
              >
                {isLoading ? '激活中...' : 'Activate'}
              </button>
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
