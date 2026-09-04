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

export const generateBatchCodes = async (count = 50, type = 'manual_paid') => {
  const generatedCodes = new Set();
  const codes = [];

  while (codes.length < count) {
    const newCode = generateCode();

    if (!generatedCodes.has(newCode)) {
      generatedCodes.add(newCode);
      codes.push({
        code: newCode,
        is_used: false,
        type,
        product_code: 'bar_server_pack',
        access_days: 180,
      });
    }
  }

  return codes;
};

export const insertBatchCodes = async (count = 50, type = 'manual_paid') => {
  const codes = await generateBatchCodes(count, type);
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
    .select('unlocked, unlocked_at, role, plan, access_status, premium_until')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Access lookup failed:', error);
    throw new Error('Access check failed');
  }

  const premiumHasNotExpired = !data?.premium_until || new Date(data.premium_until).getTime() > Date.now();
  const isAdmin = data?.role === 'admin' && data?.access_status === 'active';
  const hasPremium = data?.access_status === 'active' && premiumHasNotExpired
    && (data?.unlocked || data?.plan === 'premium' || isAdmin);

  const { data: entitlementData, error: entitlementError } = await supabase
    .from('user_entitlements')
    .select('product_code, status, starts_at, expires_at, ai_feedback_limit, mock_interview_limit, source')
    .eq('user_id', user.id)
    .eq('status', 'active');

  if (entitlementError) {
    console.warn('Product entitlement lookup failed:', entitlementError);
  }

  const now = Date.now();
  const productEntitlements = (entitlementData || []).filter((entitlement) => (
    !entitlement.expires_at || new Date(entitlement.expires_at).getTime() > now
  ));

  let mentorProfile = null;
  const { data: mentorData, error: mentorError } = await supabase
    .from('mentor_profiles')
    .select('crew_verification_status, mentor_status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (mentorError) {
    console.warn('Mentor status lookup failed:', mentorError);
  } else {
    mentorProfile = mentorData;
  }

  if (hasPremium) {
    writeAccessCache({ userId: user.id, unlockedAt: data.unlocked_at });
  } else {
    clearAccessCache();
  }

  return {
    isUnlocked: Boolean(hasPremium),
    unlockedAt: data?.unlocked_at || null,
    role: data?.role || 'member',
    plan: data?.plan || 'free',
    accessStatus: data?.access_status || 'active',
    premiumUntil: data?.premium_until || null,
    productEntitlements,
    crewVerificationStatus: mentorProfile?.crew_verification_status || 'unverified',
    mentorStatus: mentorProfile?.mentor_status || 'inactive',
  };
};

export const hasProductEntitlement = (access, productCode) => {
  if (!productCode) return false;
  if (access?.isAdmin || access?.role === 'admin') return true;
  return (access?.productEntitlements || []).some((item) => item.product_code === productCode);
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

    const { data, error } = await supabase.rpc('consume_activation_code', {
      input_code: cleanCode,
    });

    if (error) {
      console.error('Activation RPC failed:', error);
      throw new Error('Activation failed: ' + error.message);
    }

    if (!data?.success) {
      throw new Error(data?.reason || 'Activation failed');
    }

    const access = await getUserAccessStatus(user);

    const activatedProductCode = data.product_code || null;
    if (!access.isUnlocked && !hasProductEntitlement(access, activatedProductCode)) {
      throw new Error('Activation saved but access verification failed');
    }

    return {
      success: true,
      productCode: activatedProductCode,
      unlockedAt: access.unlockedAt || data.unlocked_at || new Date().toISOString(),
    };
  },

  clearAccessCache,
};

export default activationService;
