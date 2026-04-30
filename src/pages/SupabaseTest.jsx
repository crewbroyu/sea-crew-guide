import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function SupabaseTest() {
  const [status, setStatus] = useState('正在检查连接...');
  const [activationTableCreated, setActivationTableCreated] = useState(false);
  const [profilesTableCreated, setProfilesTableCreated] = useState(false);
  const [testCodes, setTestCodes] = useState([]);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      // 测试 activation_codes 表
      const { error: activationError } = await supabase
        .from('activation_codes')
        .select('*')
        .limit(1);

      if (activationError?.code === '42P01') {
        setStatus('⚠️ 部分表不存在，请在 Supabase 创建表');
      } else {
        setActivationTableCreated(true);
        
        // 检查测试激活码
        const { data: codesData } = await supabase
          .from('activation_codes')
          .select('*')
          .limit(5);
        
        setTestCodes(codesData || []);
      }

      // 测试 profiles 表
      const { error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      if (!profilesError) {
        setProfilesTableCreated(true);
      }

      if (activationTableCreated && profilesTableCreated) {
        setStatus('✅ Supabase 连接成功，所有表就绪');
      }
    } catch (error) {
      console.error('连接错误:', error);
      setStatus(`❌ 连接失败: ${error.message}`);
    }
  };

  const showSql = () => {
    alert(
      `=== Supabase SQL 建表脚本 ===\n\n` +
      `-- 1. 创建 profiles 表\n` +
      `CREATE TABLE profiles (\n` +
      `  id UUID PRIMARY KEY,\n` +
      `  name TEXT,\n` +
      `  created_at TIMESTAMP DEFAULT NOW()\n` +
      `);\n\n` +
      `-- 2. 创建 activation_codes 表\n` +
      `CREATE TABLE activation_codes (\n` +
      `  code TEXT PRIMARY KEY,\n` +
      `  is_used BOOLEAN DEFAULT false,\n` +
      `  used_by TEXT,\n` +
      `  used_at TIMESTAMP,\n` +
      `  type TEXT,\n` +
      `  created_at TIMESTAMP DEFAULT now()\n` +
      `);\n\n` +
      `-- 3. 插入测试激活码\n` +
      `INSERT INTO activation_codes (code, type) VALUES\n` +
      `  ('TEST001', 'premium'),\n` +
      `  ('TEST002', 'premium'),\n` +
      `  ('TEST003', 'premium');\n`
    );
  };

  const insertTestCodes = async () => {
    try {
      const { error } = await supabase
        .from('activation_codes')
        .insert([
          { code: 'TEST001', type: 'premium' },
          { code: 'TEST002', type: 'premium' },
          { code: 'TEST003', type: 'premium' },
        ]);

      if (error) throw error;
      alert('测试激活码已添加！');
      testConnection();
    } catch (error) {
      console.error('插入失败:', error);
      alert('插入失败: ' + error.message);
    }
  };

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        alert(`✅ 当前用户已登录\nEmail: ${user.email}\nUID: ${user.id}`);
        
        // 检查 profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          alert(`✅ 用户信息已存在\nName: ${profileData.name}\nCreated: ${profileData.created_at}`);
        } else {
          alert('⚠️ 用户已登录但 profile 表无数据');
        }
      } else {
        alert('⚠️ 未登录状态');
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
      alert('检查失败: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Supabase 连接测试</h1>

        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-4">连接状态</h2>
          <p className="text-lg">{status}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm mb-6 space-y-4">
          <h2 className="text-lg font-semibold mb-4">功能检查</h2>
          
          <div className="flex justify-between items-center">
            <span>profiles 表</span>
            <span className={profilesTableCreated ? 'text-green-600' : 'text-red-600'}>
              {profilesTableCreated ? '✅ 已创建' : '❌ 不存在'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span>activation_codes 表</span>
            <span className={activationTableCreated ? 'text-green-600' : 'text-red-600'}>
              {activationTableCreated ? '✅ 已创建' : '❌ 不存在'}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-4">测试激活码</h2>
          {testCodes.length > 0 ? (
            <div className="space-y-2">
              {testCodes.map((code) => (
                <div key={code.code} className="flex justify-between items-center border p-3 rounded">
                  <div>
                    <span className="font-mono">{code.code}</span>
                    <span className="ml-3 text-sm text-gray-500">
                      {code.is_used ? '已使用' : '可用'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">暂无测试激活码</p>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={showSql}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700"
          >
            查看建表 SQL
          </button>

          <button
            onClick={insertTestCodes}
            disabled={!activationTableCreated}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 disabled:opacity-50"
          >
            插入测试激活码
          </button>

          <button
            onClick={checkAuth}
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-medium hover:bg-purple-700"
          >
            检查用户登录状态
          </button>

          <button
            onClick={testConnection}
            className="w-full bg-gray-200 text-gray-800 py-3 rounded-xl font-medium hover:bg-gray-300"
          >
            重新测试连接
          </button>
        </div>

        <div className="mt-8 bg-blue-50 p-6 rounded-xl border border-blue-200">
          <h3 className="font-semibold mb-3">使用说明</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>在 Supabase 控制台执行 SQL 建表</li>
            <li>插入测试激活码（可选）</li>
            <li>前往首页注册/登录</li>
            <li>使用测试激活码解锁内容</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
