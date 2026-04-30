import { useState, useEffect } from 'react';
import { useAccessStore } from '../store/accessStore';
import { supabase } from '../supabase';

export default function RegisterModal() {
  const { showRegisterModal, closeRegisterModal, register, isRegistered } = useAccessStore();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState('form');
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
          setStep('success');
          setTimeout(() => {
            closeRegisterModal();
            setStep('form');
            setEmail('');
            setName('');
          }, 1500);
        } catch (error) {
          console.error('Profile creation failed:', error);
          register(user.email, user.email?.split('@')[0]);
          setStep('success');
          setTimeout(() => {
            closeRegisterModal();
            setStep('form');
            setEmail('');
            setName('');
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
            setStep('success');
            setTimeout(() => {
              closeRegisterModal();
              setStep('form');
              setEmail('');
              setName('');
            }, 1500);
          } catch (error) {
            console.error('Profile creation failed:', error);
            register(session.user.email, session.user.email?.split('@')[0]);
            setStep('success');
            setTimeout(() => {
              closeRegisterModal();
              setStep('form');
              setEmail('');
              setName('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('请输入邮箱地址');
      return;
    }
    
    if (!email.includes('@')) {
      setError('请输入有效的邮箱地址');
      return;
    }
    
    setStep('checking');
    setError('');
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Sign in error:', error);
      setError('发送邮件失败，请重试');
      setStep('form');
    }
  };

  if (!showRegisterModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 mx-4">
        {step === 'form' && (
          <button
            onClick={closeRegisterModal}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {step === 'form' && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Sea Crew Guide</h2>
              <p className="text-gray-600">欢迎来到海乘指南</p>
              <div className="mt-4 text-sm text-blue-600">
                <p>Enter your email to continue</p>
                <p className="text-gray-500">输入邮箱即可继续</p>
              </div>
              <p className="mt-2 text-xs text-gray-500">No password needed · 无需密码</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email · 邮箱 <span className="text-red-500">*</span>
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
                  Name · 姓名
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name · 您的名字"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center">{error}</div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors"
              >
                Continue · 继续
              </button>
            </form>
          </>
        )}

        {step === 'checking' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Check your email to log in</h2>
            <p className="text-gray-600 mb-4">请前往邮箱完成登录</p>
            <p className="text-sm text-gray-500">已发送邮件到: {email}</p>
            
            <button
              onClick={() => setStep('form')}
              className="mt-6 text-blue-600 hover:text-blue-700"
            >
              返回修改邮箱
            </button>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Success! · 登录成功!</h2>
            <p className="text-gray-600">即将关闭...</p>
          </div>
        )}
      </div>
    </div>
  );
}
