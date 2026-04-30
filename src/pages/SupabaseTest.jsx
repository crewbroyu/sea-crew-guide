import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { activationService, generateCode, generateBatchCodes, insertBatchCodes } from '../services/activationService';

export default function SupabaseTest() {
  const [status, setStatus] = useState('正在检查连接...');
  const [testCode, setTestCode] = useState('CREW-XXXXX');
  const [testResult, setTestResult] = useState(null);
  const [codes, setCodes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [batchCount, setBatchCount] = useState(50);
  const [newCodes, setNewCodes] = useState([]);

  useEffect(() => {
    initTest();
  }, []);

  const addLog = (message) => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message }]);
  };

  const initTest = async () => {
    addLog('开始测试连接...');
    setStatus('正在检查连接...');

    try {
      const { data, error } = await supabase
        .from('activation_codes')
        .select('*')
        .limit(5);

      if (error) {
        addLog(`连接失败: ${error.message}`);
        setStatus(`❌ 连接失败: ${error.message}`);
        return;
      }

      addLog('连接成功');
      setCodes(data || []);
      setStatus('✅ Supabase 连接成功');
    } catch (err) {
      addLog(`异常: ${err.message}`);
      setStatus(`❌ 异常: ${err.message}`);
    }
  };

  const testActivation = async () => {
    addLog(`测试激活码: ${testCode}`);
    setTestResult(null);

    try {
      const result = await activationService.activateCode(testCode);
      setTestResult({ success: true, message: '激活成功!' });
      addLog('激活成功');
      initTest();
    } catch (err) {
      setTestResult({ success: false, message: err.message });
      addLog(`激活失败: ${err.message}`);
    }
  };

  const generateSingleCode = () => {
    const newCode = generateCode();
    setTestCode(newCode);
    addLog(`生成激活码: ${newCode}`);
  };

  const handleBatchGenerate = async () => {
    addLog(`开始批量生成 ${batchCount} 个激活码...`);
    setNewCodes([]);

    try {
      const result = await insertBatchCodes(batchCount);
      addLog(`成功生成 ${result.count} 个激活码`);
      setNewCodes(result.codes);
      initTest();
    } catch (err) {
      addLog(`批量生成失败: ${err.message}`);
      alert(`批量生成失败: ${err.message}`);
    }
  };

  const resetCode = async (code) => {
    addLog(`重置激活码: ${code}`);
    try {
      const { error } = await supabase
        .from('activation_codes')
        .update({ is_used: false, used_by: null, used_at: null })
        .eq('code', code);

      if (error) {
        addLog(`重置失败: ${error.message}`);
        return;
      }

      addLog('重置成功');
      initTest();
    } catch (err) {
      addLog(`异常: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">激活码系统测试工具</h1>

        {/* 连接状态 */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-4">连接状态</h2>
          <p className="text-lg">{status}</p>
        </div>

        {/* 批量生成区域 */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-4">批量生成激活码</h2>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">生成数量</label>
              <input
                type="number"
                value={batchCount}
                onChange={(e) => setBatchCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg"
                min="1"
                max="200"
              />
            </div>
            <button
              onClick={handleBatchGenerate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              批量生成
            </button>
            <button
              onClick={generateSingleCode}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              生成单个
            </button>
          </div>

          {/* 新生成的激活码 */}
          {newCodes.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium text-gray-700 mb-3">新生成的激活码：</h3>
              <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {newCodes.map((c, i) => (
                    <div key={i} className="bg-white px-3 py-2 rounded border text-sm font-mono">
                      {c.code}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 测试激活码 */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-4">测试激活码</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={testCode}
              onChange={(e) => setTestCode(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-mono"
              placeholder="输入激活码"
            />
            <button
              onClick={testActivation}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium"
            >
              测试激活
            </button>
          </div>

          {testResult && (
            <div className={`mt-4 p-4 rounded-xl ${testResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className={`font-medium ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                {testResult.message}
              </p>
            </div>
          )}
        </div>

        {/* 激活码列表 */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-4">激活码列表 ({codes.length}个)</h2>

          {codes.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {codes.map((code) => (
                <div key={code.code} className="flex justify-between items-center border p-3 rounded">
                  <div>
                    <span className="font-mono">{code.code}</span>
                    <span className={`ml-3 px-2 py-1 rounded text-xs ${code.is_used ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {code.is_used ? '已使用' : '可用'}
                    </span>
                    {code.type && (
                      <span className="ml-2 text-xs text-gray-500">({code.type})</span>
                    )}
                  </div>
                  {code.is_used && (
                    <button
                      onClick={() => resetCode(code.code)}
                      className="text-blue-600 text-sm hover:text-blue-700"
                    >
                      重置
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">暂无激活码，点击上方批量生成按钮添加</p>
          )}
        </div>

        {/* 日志 */}
        <div className="bg-gray-900 text-gray-300 p-6 rounded-xl mb-6">
          <h2 className="text-lg font-semibold mb-4">调试日志</h2>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="text-sm">
                <span className="text-gray-500">[{log.time}]</span> {log.message}
              </div>
            ))}
          </div>
        </div>

        {/* SQL 参考 */}
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
          <h3 className="font-semibold mb-3">SQL 建表脚本</h3>
          <pre className="text-sm bg-white p-4 rounded overflow-x-auto">
{`CREATE TABLE activation_codes (
  code TEXT PRIMARY KEY,
  is_used BOOLEAN DEFAULT false,
  used_by TEXT,
  used_at TIMESTAMP,
  type TEXT,
  created_at TIMESTAMP DEFAULT now()
);`}
          </pre>
        </div>
      </div>
    </div>
  );
}
