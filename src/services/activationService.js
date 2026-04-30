import { supabase } from '../supabase';

export const activationService = {
  // 验证并激活码
  async activateCode(inputCode) {
    try {
      // 输入处理：去除空格并转换为大写
      const cleanCode = inputCode.trim().toUpperCase();
      
      // 调试日志
      console.log('用户输入:', inputCode);
      console.log('清洗后:', cleanCode);

      // 1. 查询激活码（使用 maybeSingle 避免无数据时报错）
      const { data, error } = await supabase
        .from('activation_codes')
        .select('*')
        .eq('code', cleanCode)
        .maybeSingle();

      // 调试日志
      console.log('查询结果:', data);
      console.log('查询错误:', error);

      // 处理错误
      if (error) {
        console.error('查询错误:', error);
        throw new Error('Network error');
      }

      // 处理无数据情况
      if (!data) {
        throw new Error('Invalid code');
      }

      // 检查是否已使用
      if (data.is_used) {
        throw new Error('Code already used');
      }

      // 2. 更新激活码状态
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

      // 3. 保存解锁状态到 localStorage
      localStorage.setItem('access_unlocked', 'true');
      localStorage.setItem('access_unlocked_at', new Date().toISOString());

      console.log('激活成功:', cleanCode);
      return { success: true };
    } catch (error) {
      console.error('激活失败:', error.message);
      throw error;
    }
  },

  // 检查是否已解锁
  isUnlocked() {
    return localStorage.getItem('access_unlocked') === 'true';
  },

  // 清除解锁状态
  clearAccess() {
    localStorage.removeItem('access_unlocked');
    localStorage.removeItem('access_unlocked_at');
  },

  // 测试数据库连接
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

  // 获取所有激活码（用于测试）
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
  }
};
