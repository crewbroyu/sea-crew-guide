// src/pages/academy/BoardingDetail.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Clock } from 'lucide-react';

export default function BoardingDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { item } = location.state || {};

  if (!item) {
    navigate('/academy/boarding');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部头部区域 */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 px-6 pt-16 pb-6">
        {/* 面包屑导航 */}
        <div className="flex items-center gap-2 text-green-200 text-sm mb-4">
          <span onClick={() => navigate('/academy')} className="cursor-pointer hover:text-white">海乘学院</span>
          <span className="breadcrumb-separator">›</span>
          <span onClick={() => navigate('/academy/boarding')} className="cursor-pointer hover:text-white">登船手续</span>
          <span className="breadcrumb-separator">›</span>
          <span className="text-white font-medium">{item.title}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/academy/boarding')}
            className="text-white hover:text-green-200"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-white text-2xl font-bold">{item.title}</h1>
        </div>
        <p className="text-white/80 text-sm mt-2">
          {item.description}
        </p>
      </div>
      
      {/* 详情内容 */}
      <div className="px-6 py-6">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Clock size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-3">办理指南即将上线</h2>
          <p className="text-gray-600 mb-6">
            详细的办理流程、费用、材料清单、相关机构列表及评价将在近期更新，敬请期待！
          </p>
          <button
            onClick={() => navigate('/academy/boarding')}
            className="px-6 py-3 rounded-lg font-medium transition-colors bg-green-600 text-white hover:bg-green-700"
          >
            返回列表
          </button>
        </div>
        
        {/* 预留区域 */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <h3 className="font-medium text-gray-800 mb-2">未来内容预告</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
            <li>办理流程详解</li>
            <li>所需材料清单</li>
            <li>费用明细</li>
            <li>相关机构列表</li>
            <li>办理经验分享</li>
            <li>常见问题解答</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
