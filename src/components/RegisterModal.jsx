import { useState } from 'react';
import { useAccessStore } from '../store/accessStore';

export default function RegisterModal() {
  const { showRegisterModal, closeRegisterModal, register } = useAccessStore();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    
    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    // 模拟注册过程
    setTimeout(() => {
      register(email.trim(), name.trim() || 'User');
      setEmail('');
      setName('');
      setIsLoading(false);
    }, 500);
  };

  if (!showRegisterModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* 遮罩层 - 不可点击关闭 */}
      <div className="absolute inset-0 bg-black/70"></div>
      
      {/* 弹窗内容 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Sea Crew Guide</h2>
          <p className="text-gray-600">欢迎来到海乘指南</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="your@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name (Optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Processing...' : 'Continue'}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-4">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
