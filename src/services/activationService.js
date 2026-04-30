import { supabase } from '../supabase';

// 生成单个激活码
export const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 排除易混淆字符
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
  
  // 生成不重复的激活码
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

// 激活码验证（保持原有逻辑）
export const activationService = {
  async activateCode(inputCode) {
    try {
      const cleanCode = inputCode.trim().toUpperCase();
      
      console.log('用户输入:', inputCode);
      console.log('清洗后:', cleanCode);

      const { data, error } = await supabase
        .from('activation_codes')
        .select('*')
        .eq('code', cleanCode)
        .maybeSingle();

      console.log('查询结果:', data);
      console.log('查询错误:', error);

      if (error) {
        console.error('查询错误:', error);
        throw new Error('Network error');
      }

      if (!data) {
        throw new Error('Invalid code');
      }

      if (data.is_used) {
        throw new Error('Code already used');
      }

      const { error: updateError } = await supabase
        .from('activation_codes')
        .update({
          is_used: true,
          used_by: '',
          used_at: new Date().toISOString()
        })
        .eq('code', cleanCode);

      if (updateError) {
        console.error('更新错误:', updateError);
        throw new Error('Activation failed');
      }

      localStorage.setItem('access_unlocked', 'true');
      localStorage.setItem('access_unlocked_at', new Date().toISOString());

      console.log('激活成功:', cleanCode);
      return { success: true };
    } catch (error) {
      console.error('激活失败:', error.message);
      throw error;
    }
  },

  isUnlocked() {
    return localStorage.getItem('access_unlocked') === 'true';
  },

  clearAccess() {
    localStorage.removeItem('access_unlocked');
    localStorage.removeItem('access_unlocked_at');
  },

  async testConnection() {
    try {
      const { data, error } = await supabase
        .from('activation_codes')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('连接测试失败:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async getAllCodes() {
    try {
      const { data, error } = await supabase
        .from('activation_codes')
        .select('*');

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('获取激活码失败:', error);
      throw error;
    }
  },
};

// 导出旧版本兼容
export { activationService as default };
