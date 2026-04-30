import { supabase } from '../supabase';

export const activationService = {
  // 验证并激活码
  async activateCode(code) {
    try {
      // 1. 查询激活码
      const { data: codeData, error: fetchError } = await supabase
        .from('activation_codes')
        .select('*')
        .eq('code', code)
        .single();

      if (fetchError || !codeData) {
        if (fetchError?.code === 'PGRST116' || !codeData) {
          throw new Error('Invalid code');
        }
      }

      // 2. 检查是否已使用
      if (codeData.is_used) {
        throw new Error('Code already used');
      }

      // 3. 更新激活码状态
      const { error: updateError } = await supabase
        .from('activation_codes')
        .update({
          is_used: true,
          used_by: '',  // 后续扩展：可与用户关联
          used_at: new Date().toISOString()
        })
        .eq('code', code);

      if (updateError) {
        throw new Error('Activation failed');
      }

      // 4. 保存解锁状态到 localStorage
      localStorage.setItem('access_unlocked', 'true');
      localStorage.setItem('access_unlocked_at', new Date().toISOString());

      return { success: true };
    } catch (error) {
      console.error('激活失败:', error);
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
  }
};
