import { supabase } from '../supabase';

const normalizeCode = (inputCode) => inputCode.trim().toUpperCase();

// 生成单个激活码
export const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return `CREW-${result}`;
};

// 批量生成激活码（内置防重复）
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

// 批量插入激活码到 Supabase
export const insertBatchCodes = async (count = 50) => {
  try {
    const codes = await generateBatchCodes(count);
    const { error } = await supabase.from('activation_codes').insert(codes);
    
    if (error) {
      throw error;
    }
    
    return { success: true, count: codes.length, codes: codes };
  } catch (error) {
    console.error('批量插入激活码失败:', error);
    throw error;
  }
};

// 获取所有激活码（仅供管理员使用）
export const getAllCodes = async () => {
  try {
    const { data, error } = await supabase.from('activation_codes').select('*');
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('获取激活码失败:', error);
    throw error;
  }
};

const requireUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Auth error details:', error);
    throw new Error('Auth check failed: ' + error.message);
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

    console.log('========== 开始激活流程 ==========');
    console.log('输入的激活码:', inputCode);
    console.log('清洗后的激活码:', cleanCode);

    let user;
    try {
      user = await requireUser();
      console.log('✓ Supabase认证成功，当前用户:', user?.email);
    } catch (authError) {
      console.error('✗ Supabase认证失败:', authError.message);
      
      // 检查localStorage是否有之前的激活信息
      const localStorageUnlocked = localStorage.getItem('access_unlocked') === 'true';
      const accessUserEmail = localStorage.getItem('access_user_email');
      
      console.log('检查localStorage:', { localStorageUnlocked, accessUserEmail });
      
      if (localStorageUnlocked && accessUserEmail) {
        console.log('✓ 使用localStorage中的用户信息进行激活');
        // 使用localStorage中的用户信息
        user = { id: 'local', email: accessUserEmail };
      } else {
        console.error('✗ 没有找到有效的激活信息，需要登录');
        throw authError;
      }
    }

    console.log('调用 RPC consume_activation_code...');
    const { data, error } = await supabase.rpc('consume_activation_code', {
      input_code: cleanCode,
    });

    console.log('RPC 返回:', { data, error });

    if (error) {
      console.error('✗ Activation RPC failed:', error);
      throw new Error('Activation failed: ' + error.message);
    }

    if (!data?.success) {
      console.log('✗ 激活失败原因:', data?.reason);
      throw new Error(data?.reason || 'Activation failed');
    }

    console.log('✓ 激活成功！');

    // 保存激活信息到 localStorage（用于调试）
    const activationInfo = {
      code: cleanCode,
      activatedAt: data.unlocked_at || new Date().toISOString(),
      user: user.email
    };
    localStorage.setItem('activationInfo', JSON.stringify(activationInfo));
    console.log('✓ 已保存激活信息到localStorage');
    
    // 保存解锁状态到 localStorage（用于 session 丢失时的回退）
    localStorage.setItem('access_unlocked', 'true');
    localStorage.setItem('access_unlocked_at', data.unlocked_at || new Date().toISOString());
    localStorage.setItem('access_user_email', user.email);
    console.log('✓ 已保存解锁状态到localStorage');

    console.log('========== 激活流程完成 ==========');

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
