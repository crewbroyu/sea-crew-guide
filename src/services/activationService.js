import { supabase } from '../supabase';

const normalizeCode = (inputCode) => inputCode.trim().toUpperCase();

const requireUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error('Auth check failed');
  }

  if (!user) {
    throw new Error('Login required');
  }

  return user;
};

export const activationService = {
  async getUserAccessStatus() {
    const user = await requireUser();

    const { data, error } = await supabase
      .from('user_access')
      .select('unlocked, unlocked_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Access lookup failed:', error);
      throw new Error('Access check failed');
    }

    return {
      isUnlocked: Boolean(data?.unlocked),
      unlockedAt: data?.unlocked_at || null,
    };
  },

  async activateCode(inputCode) {
    const cleanCode = normalizeCode(inputCode);

    if (!cleanCode) {
      throw new Error('Invalid code');
    }

    const user = await requireUser();

    const { data, error } = await supabase.rpc('consume_activation_code', {
      input_code: cleanCode,
    });

    if (error) {
      console.error('Activation RPC failed:', error);
      throw new Error('Activation failed');
    }

    if (!data?.success) {
      throw new Error(data?.reason || 'Activation failed');
    }

    // 保存激活信息到 localStorage（用于调试）
    const activationInfo = {
      code: cleanCode,
      activatedAt: data.unlocked_at || new Date().toISOString(),
      user: user.email
    };
    localStorage.setItem('activationInfo', JSON.stringify(activationInfo));

    return {
      success: true,
      unlockedAt: data.unlocked_at || new Date().toISOString(),
    };
  },

  clearAccessCache() {
    localStorage.removeItem('access_unlocked');
    localStorage.removeItem('access_unlocked_at');
    localStorage.removeItem('access-storage');
  },
};

export default activationService;
