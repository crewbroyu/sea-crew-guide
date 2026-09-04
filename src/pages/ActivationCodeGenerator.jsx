import { useState } from 'react';
import { useAccessStore } from '../store/accessStore';
import { generateCode, insertBatchCodes, getAllCodes } from '../services/activationService';
import { getManualPurchaseRequests, updateManualPurchaseRequest } from '../services/manualPurchaseService';

export default function ActivationCodeGenerator() {
  const { isAdmin } = useAccessStore();
  const [generatedCodes, setGeneratedCodes] = useState([]);
  const [count, setCount] = useState(1);
  const [codeType, setCodeType] = useState('manual_paid');
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [existingCodes, setExistingCodes] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);

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
      const result = await insertBatchCodes(count, codeType);
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

  const handleLoadPurchaseRequests = async () => {
    try {
      const requests = await getManualPurchaseRequests();
      setPurchaseRequests(requests);
      setMessage(`已加载 ${requests.length} 条人工开通申请`);
    } catch (error) {
      setMessage(`加载人工申请失败: ${error.message}`);
    }
  };

  const handleUpdatePurchaseStatus = async (id, status) => {
    try {
      await updateManualPurchaseRequest(id, status);
      setPurchaseRequests((current) => current.map((request) => (
        request.id === id ? { ...request, status } : request
      )));
      setMessage(status === 'payment_confirmed' ? '已标记为已核款' : '已标记为激活码已发放');
    } catch (error) {
      setMessage(`更新人工申请失败: ${error.message}`);
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">发放类型</label>
              <select
                value={codeType}
                onChange={(event) => setCodeType(event.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="manual_paid">人工收款</option>
                <option value="beta">内测赠送</option>
              </select>
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

            <button
              onClick={handleLoadPurchaseRequests}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
            >
              查看人工开通申请
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
          <p className="mt-5 text-sm leading-6 text-gray-500">当前生成的码固定开通 Bar Server 单职位全流程包，有效期 180 天。请在确认到账后再把单条码发给对应用户。</p>
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

        {purchaseRequests.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">人工开通申请 ({purchaseRequests.length} 条)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">编号</th>
                    <th className="px-4 py-2 text-left">注册邮箱</th>
                    <th className="px-4 py-2 text-left">产品 / 价格</th>
                    <th className="px-4 py-2 text-left">状态</th>
                    <th className="px-4 py-2 text-left">申请时间</th>
                    <th className="px-4 py-2 text-left">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseRequests.map((request) => (
                    <tr key={request.id} className="border-t">
                      <td className="px-4 py-3 font-mono">{request.reference_code}</td>
                      <td className="px-4 py-3">{request.contact_email || '-'}</td>
                      <td className="px-4 py-3">{request.product_code} / ¥{request.price_cny}</td>
                      <td className="px-4 py-3">{request.status}</td>
                      <td className="px-4 py-3">{new Date(request.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {request.status === 'requested' && <button type="button" onClick={() => handleUpdatePurchaseStatus(request.id, 'payment_confirmed')} className="text-blue-600 hover:text-blue-700">核款完成</button>}
                        {request.status === 'payment_confirmed' && <button type="button" onClick={() => handleUpdatePurchaseStatus(request.id, 'activation_sent')} className="text-emerald-600 hover:text-emerald-700">已发激活码</button>}
                        {request.status === 'activation_sent' && <span className="text-gray-500">已完成</span>}
                      </td>
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
