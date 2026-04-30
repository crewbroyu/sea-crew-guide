import { createClient } from '@supabase/supabase-js';

// 您的 Supabase 项目地址
const supabaseUrl = 'https://pdvmyaenjkvohsmjbxha.supabase.co';

// 公开密钥（从 Supabase 获取的 Publishable Key）
const supabaseAnonKey = 'sb_publishable_JfAenPf7RYl6gEnJ5MOd3Q_vIB6EUit';

// 创建 Supabase 客户端，添加额外的配置
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'apiKey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
  },
});
