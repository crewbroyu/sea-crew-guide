import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccessStore } from '../store/accessStore';
import { getAuthCallbackUrl, supabase } from '../supabase';
import { trackProductEvent } from '../services/productAnalyticsService';
import { getCurrentAuthIntentRoute } from '../utils/authIntent';

export default function RegisterModal() {
  const { showRegisterModal, authModalMode, closeRegisterModal, register } = useAccessStore();
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState(() => authModalMode === 'login' ? 'login' : 'register');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  function resetForm() {
    setEmail('');
    setPassword('');
    setName('');
    setError('');
    setConfirmationEmail('');
    setAcceptedTerms(false);
    setMode('register');
  }

  // 监听登录状态变化
  useEffect(() => {
    if (!showRegisterModal) return;

    // 立即检查当前 session
    const checkCurrentSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsProcessing(true);
        register(user, user.user_metadata?.name || user.email?.split('@')[0]);
        setTimeout(() => {
          closeRegisterModal();
          resetForm();
        }, 1500);
        setIsProcessing(false);
      }
    };

    checkCurrentSession();

    // 监听 auth 状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setIsProcessing(true);
          register(session.user, session.user.user_metadata?.name || session.user.email?.split('@')[0]);
          setTimeout(() => {
            closeRegisterModal();
            resetForm();
          }, 1500);
          setIsProcessing(false);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [showRegisterModal, register, closeRegisterModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim()) {
      setError(t('errors.emailRequired'));
      return;
    }
    
    if (!email.includes('@')) {
      setError(t('errors.emailInvalid'));
      return;
    }
    
    if (!password) {
      setError(t('errors.passwordRequired'));
      return;
    }
    
    if (password.length < 6) {
      setError(t('errors.passwordTooShort'));
      return;
    }
    
    if (mode === 'register' && !name.trim()) {
      setError(t('errors.nameRequired'));
      return;
    }

    if (mode === 'register' && !acceptedTerms) {
      setError(t('errors.termsRequired'));
      return;
    }
    
    const intentRoute = getCurrentAuthIntentRoute();
    try { sessionStorage.setItem('auth_intent_route', intentRoute); } catch { /* Continue without attribution. */ }
    setIsProcessing(true);
    
    try {
      let result;
      
      if (mode === 'register') {
        // 注册新用户
        result = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              name: name.trim(),
              terms_version: '1.0-2026-09-15',
              terms_accepted_at: new Date().toISOString(),
            },
            emailRedirectTo: getAuthCallbackUrl(),
          },
        });
      } else {
        // 登录现有用户
        result = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
      }
      
      if (result.error) throw result.error;

      if (!result.data?.session) {
        setConfirmationEmail(email.trim());
        setError(mode === 'register'
          ? t('errors.confirmationSent')
          : t('errors.loginIncomplete'));
        return;
      }
      
      if (result.data?.user) {
        // 注册/登录成功
        register(result.data.user, name || result.data.user.user_metadata?.name || result.data.user.email?.split('@')[0]);
        trackProductEvent('auth_completed', {
          productCode: null,
          properties: { authMode: mode, intentRoute },
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
      const errorMessage = error.message || '';
      if (/failed to fetch|networkerror|load failed|fetch failed/i.test(errorMessage)) {
        setError(t('errors.network'));
      } else if (/already registered|already been registered/i.test(errorMessage)) {
        setError(t('errors.alreadyRegistered'));
        setMode('login');
      } else if (errorMessage.includes('Invalid login credentials')) {
        setError(t('errors.invalidCredentials'));
      } else if (/email not confirmed/i.test(errorMessage)) {
        setConfirmationEmail(email.trim());
        setError(t('errors.emailNotConfirmed'));
      } else {
        setError(errorMessage || t('errors.generic'));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResendConfirmation = async () => {
    const address = confirmationEmail || email.trim();
    if (!address) return;

    setIsProcessing(true);
    setError('');

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: address,
        options: { emailRedirectTo: getAuthCallbackUrl() },
      });
      if (resendError) throw resendError;
      setConfirmationEmail(address);
      setError(t('errors.resent'));
    } catch (resendError) {
      const resendMessage = resendError.message || '';
      setError(/failed to fetch|networkerror|load failed|fetch failed/i.test(resendMessage)
        ? t('errors.resendNetwork')
        : resendMessage || t('errors.resendFailed'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (!showRegisterModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto px-4 py-4 sm:items-center">
      <div className="absolute inset-0 bg-black/70" />
      
      <div className="relative my-auto w-full max-w-md rounded-lg bg-white p-5 shadow-2xl sm:p-8">
        <button
          type="button"
          aria-label={t('close')}
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
          <h2 className="mb-2 text-xl font-bold text-gray-800 sm:text-2xl">
            {mode === 'register' ? t('registerTitle') : t('loginTitle')}
          </h2>
          <p className="text-gray-600">
            {mode === 'register' ? t('registerSubtitle') : t('loginSubtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('nameLabel')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder={t('namePlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('emailLabel')} <span className="text-red-500">*</span>
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
              {t('passwordLabel')} <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder={t('passwordPlaceholder')}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {mode === 'register' && (
            <label className="flex items-start gap-3 rounded-lg bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-600">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => { setAcceptedTerms(event.target.checked); setError(''); }}
                className="mt-1 h-4 w-4 shrink-0 accent-blue-600"
              />
              <span>{t('termsBefore')}<a href="/legal/terms" target="_blank" rel="noreferrer" className="font-semibold text-blue-700 underline">{t('terms')}</a>{t('termsBetween')}<a href="/legal/privacy" target="_blank" rel="noreferrer" className="font-semibold text-blue-700 underline">{t('privacy')}</a>{t('termsAfter')}</span>
            </label>
          )}

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          {confirmationEmail && (
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={isProcessing}
              className="w-full text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              {t('resend')}
            </button>
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
                {t('processing')}
              </span>
            ) : (
              <span>
                {mode === 'register' ? t('submitRegister') : t('submitLogin')}
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
              ? t('switchToLogin')
              : t('switchToRegister')}
          </button>
        </div>
      </div>
    </div>
  );
}
