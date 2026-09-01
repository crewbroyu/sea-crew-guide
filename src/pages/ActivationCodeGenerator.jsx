import { useState } from 'react';
import { useAccessStore } from '../store/accessStore';
import { generateCode, insertBatchCodes, getAllCodes } from '../services/activationService';

export default function ActivationCodeGenerator() {
  const { isAdmin } = useAccessStore();
  const [generatedCodes, setGeneratedCodes] = useState([]);
  const [count, setCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [existingCodes, setExistingCodes] = useState([]);

  // 生成激活码但不保存
  const handleGenerate = () => {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(generateCode());
    }
    setGeneratedCodes(codes);
    setMessage(`已生成 ${codes.length} 个激活码`);
  };

  // 生成并保存到数据库
  const handleGenerateAndSave = async () => {
    setIsGenerating(true);
    setMessage('正在生成并保存...');
    
    try {
      const result = await insertBatchCodes(count);
      setGeneratedCodes(result.codes.map(c => c.code));
      setMessage(`成功保存 ${result.count} 个激活码到数据库`);
    } catch (error) {
      setMessage(`保存失败: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // 获取现有激活码
  const handleLoadExisting = async () => {
    try {
      const codes = await getAllCodes();
      setExistingCodes(codes);
      setMessage(`已加载 ${codes.length} 个激活码`);
    } catch (error) {
      setMessage(`加载失败: ${error.message}`);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">仅管理员可以访问此页面</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">激活码生成器</h1>
        
        {message && (
          <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-lg">
            {message}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">生成数量</label>
              <input
                type="number"
                min="1"
                max="100"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              只生成（不保存）
            </button>
            
            <button
              onClick={handleGenerateAndSave}
              disabled={isGenerating}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isGenerating ? '保存中...' : '生成并保存'}
            </button>
            
            <button
              onClick={handleLoadExisting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              查看现有激活码
            </button>
          </div>

          {generatedCodes.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">生成的激活码:</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {generatedCodes.map((code, index) => (
                  <div key={index} className="p-2 bg-gray-100 rounded text-center font-mono text-sm">
                    {code}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {existingCodes.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              数据库中的激活码 ({existingCodes.length} 个)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">激活码</th>
                    <th className="px-4 py-2 text-left">类型</th>
                    <th className="px-4 py-2 text-left">是否已使用</th>
                    <th className="px-4 py-2 text-left">使用者</th>
                    <th className="px-4 py-2 text-left">使用时间</th>
                  </tr>
                </thead>
                <tbody>
                  {existingCodes.map((code) => (
                    <tr key={code.code} className="border-t">
                      <td className="px-4 py-2 font-mono">{code.code}</td>
                      <td className="px-4 py-2">{code.type || '-'}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${code.is_used ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {code.is_used ? '已使用' : '未使用'}
                        </span>
                      </td>
                      <td className="px-4 py-2">{code.used_by_email || '-'}</td>
                      <td className="px-4 py-2">{code.used_at ? new Date(code.used_at).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
