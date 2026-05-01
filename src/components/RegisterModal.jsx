import { useState, useEffect } from 'react';
import { useAccessStore } from '../store/accessStore';
import { supabase } from '../supabase';

export default function RegisterModal() {
  const { showRegisterModal, closeRegisterModal, register } = useAccessStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState('register'); // 'register' or 'login'
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // 监听登录状态变化
  useEffect(() => {
    if (!showRegisterModal) return;

    // 立即检查当前 session
    const checkCurrentSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsProcessing(true);
        try {
          await supabase.from('profiles').upsert({
            id: user.id,
            name: name || user.email?.split('@')[0],
          });
          register(user.email, name || user.email?.split('@')[0]);
          setTimeout(() => {
            closeRegisterModal();
            resetForm();
          }, 1500);
        } catch (error) {
          console.error('Profile creation failed:', error);
          register(user.email, user.email?.split('@')[0]);
          setTimeout(() => {
            closeRegisterModal();
            resetForm();
          }, 1500);
        }
        setIsProcessing(false);
      }
    };

    checkCurrentSession();

    // 监听 auth 状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, session);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setIsProcessing(true);
          try {
            await supabase.from('profiles').upsert({
              id: session.user.id,
              name: name || session.user.email?.split('@')[0],
            });
            register(session.user.email, name || session.user.email?.split('@')[0]);
            setTimeout(() => {
              closeRegisterModal();
              resetForm();
            }, 1500);
          } catch (error) {
            console.error('Profile creation failed:', error);
            register(session.user.email, session.user.email?.split('@')[0]);
            setTimeout(() => {
              closeRegisterModal();
              resetForm();
            }, 1500);
          }
          setIsProcessing(false);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [showRegisterModal, name, register, closeRegisterModal]);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError('');
    setMode('register');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) {
      setError('请输入邮箱地址');
      return;
    }
    
    if (!email.includes('@')) {
      setError('请输入有效的邮箱地址');
      return;
    }
    
    if (!password) {
      setError('请输入密码');
      return;
    }
    
    if (password.length < 6) {
      setError('密码至少需要6位');
      return;
    }
    
    if (mode === 'register' && !name.trim()) {
      setError('请输入姓名');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      let result;
      
      console.log('当前模式:', mode);
      console.log('邮箱:', email.trim());
      
      if (mode === 'register') {
        // 注册新用户
        console.log('开始注册...');
        result = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              name: name.trim(),
            },
          },
        });
        console.log('注册结果:', result);
      } else {
        // 登录现有用户
        console.log('开始登录...');
        result = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
        console.log('登录结果:', result);
      }
      
      if (result.error) throw result.error;
      
      if (result.data?.user) {
        // 注册/登录成功，创建或更新 profile
        try {
          await supabase.from('profiles').upsert({
            id: result.data.user.id,
            name: name || result.data.user.email?.split('@')[0],
          });
        } catch (profileError) {
          console.error('Profile creation failed:', profileError);
        }
        register(result.data.user.email, name || result.data.user.email?.split('@')[0]);
      }
    } catch (error) {
      console.error('Auth error:', error);
      if (error.message?.includes('Email already registered')) {
        setError('该邮箱已注册，请直接登录');
        setMode('login');
      } else if (error.message?.includes('Invalid login credentials')) {
        setError('邮箱或密码错误');
      } else {
        setError(error.message || '操作失败，请重试');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (!showRegisterModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 mx-4">
        <button
          onClick={closeRegisterModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {mode === 'register' ? 'Create Account · 创建账户' : 'Sign In · 登录'}
          </h2>
          <p className="text-gray-600">
            {mode === 'register' ? '注册新账户' : '登录您的账户'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name · 姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="Your name · 您的名字"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email · 邮箱 <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              autoComplete="email"
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
              Password · 密码 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="至少6位 · min 6 characters"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              <span>
                {mode === 'register' ? 'Sign Up · 注册' : 'Sign In · 登录'}
              </span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'register' ? 'login' : 'register');
              setError('');
            }}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            {mode === 'register'
              ? 'Already have an account? Sign In · 已有账户？直接登录'
              : 'Need an account? Sign Up · 需要账户？注册'}
          </button>
        </div>
      </div>
    </div>
  );
}
