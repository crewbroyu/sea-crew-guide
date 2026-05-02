import { supabase } from '../supabase';

const normalizeCode = (inputCode) => inputCode.trim().toUpperCase();

export const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';

  for (let i = 0; i < 6; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }

  return `CREW-${result}`;
};

export const generateBatchCodes = async (count = 50) => {
  const generatedCodes = new Set();
  const codes = [];

  while (codes.length < count) {
    const newCode = generateCode();

    if (!generatedCodes.has(newCode)) {
      generatedCodes.add(newCode);
      codes.push({
        code: newCode,
        is_used: false,
        type: 'beta',
      });
    }
  }

  return codes;
};

export const insertBatchCodes = async (count = 50) => {
  const codes = await generateBatchCodes(count);
  const { error } = await supabase.from('activation_codes').insert(codes);

  if (error) {
    throw error;
  }

  return { success: true, count: codes.length, codes };
};

export const getAllCodes = async () => {
  const { data, error } = await supabase.from('activation_codes').select('*');

  if (error) {
    throw error;
  }

  return data || [];
};

const clearAccessCache = () => {
  localStorage.removeItem('access_unlocked');
  localStorage.removeItem('access_unlocked_at');
  localStorage.removeItem('activationInfo');
  localStorage.removeItem('access_unlocked_cache');
  localStorage.removeItem('access_unlocked_at_cache');
  localStorage.removeItem('access-storage');
};

const writeAccessCache = ({ userId, unlockedAt }) => {
  if (!userId) return;

  localStorage.setItem('current_user_id', userId);
  localStorage.setItem('access_unlocked_cache', 'true');
  localStorage.setItem('access_unlocked_at_cache', unlockedAt || new Date().toISOString());
};

const requireSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Auth session check failed:', error);
    throw new Error('Auth check failed: ' + error.message);
  }

  if (!session?.access_token) {
    clearAccessCache();
    throw new Error('Login required');
  }

  return session;
};

const requireUser = async () => {
  const session = await requireSession();
  const { data: { user }, error } = await supabase.auth.getUser(session.access_token);

  if (error) {
    console.error('Auth user check failed:', error);
    throw new Error('Auth check failed: ' + error.message);
  }

  if (!user?.id) {
    clearAccessCache();
    throw new Error('Login required');
  }

  return user;
};

export const getUserAccessStatus = async (user) => {
  if (!user?.id) {
    clearAccessCache();
    throw new Error('Login required');
  }

  const { data, error } = await supabase
    .from('user_access')
    .select('unlocked, unlocked_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Access lookup failed:', error);
    throw new Error('Access check failed');
  }

  if (data?.unlocked) {
    writeAccessCache({ userId: user.id, unlockedAt: data.unlocked_at });
  } else {
    clearAccessCache();
  }

  return {
    isUnlocked: Boolean(data?.unlocked),
    unlockedAt: data?.unlocked_at || null,
  };
};

export const activationService = {
  async getCurrentUser() {
    return requireUser();
  },

  async getUserAccessStatus(user) {
    return getUserAccessStatus(user);
  },

  async activateCode(inputCode) {
    const cleanCode = normalizeCode(inputCode);

    if (!cleanCode) {
      throw new Error('Invalid code');
    }

    const user = await requireUser();

    console.log('========== Start activation flow ==========');
    console.log('Activation code:', cleanCode);
    console.log('Calling RPC consume_activation_code...');

    const { data, error } = await supabase.rpc('consume_activation_code', {
      input_code: cleanCode,
      input_user_id: user.id,
      input_user_email: user.email,
    });

    console.log('RPC response:', { data, error });

    if (error) {
      console.error('Activation RPC failed:', error);
      throw new Error('Activation failed: ' + error.message);
    }

    if (!data?.success) {
      throw new Error(data?.reason || 'Activation failed');
    }

    const access = await getUserAccessStatus(user);

    if (!access.isUnlocked) {
      throw new Error('Activation saved but access verification failed');
    }

    return {
      success: true,
      unlockedAt: access.unlockedAt || data.unlocked_at || new Date().toISOString(),
    };
  },

  clearAccessCache,
};

export default activationService;
