// src/pages/academy/BoardingWechat.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, MessageCircle, QrCode, CheckCircle } from 'lucide-react';

export default function BoardingWechat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { task, formData } = location.state || {};

  if (!task) {
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
          <span onClick={() => navigate('/academy/boarding')} className="cursor-pointer hover:text-white">登船准备</span>
          <span className="breadcrumb-separator">›</span>
          <span onClick={() => navigate('/academy/boarding/detail', { state: { module: { id: 'seaman-qualification' } } })} className="cursor-pointer hover:text-white">登船证件任务</span>
          <span className="breadcrumb-separator">›</span>
          <span className="text-white font-medium">添加微信</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/academy/boarding/advice', { state: { task } })}
            className="text-white hover:text-green-200"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-white text-2xl font-bold">添加微信获取建议</h1>
        </div>
        <p className="text-white/80 text-sm mt-2">
          {task.title} - 专业顾问为您提供一对一指导
        </p>
      </div>
      
      {/* 内容区域 */}
      <div className="px-6 py-6 space-y-6">
        {/* 微信信息 */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center">
          <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <QrCode size={160} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">扫码添加微信</h2>
          <p className="text-gray-600 text-center mb-4">
            微信号：crewbroyu
          </p>
          <div className="flex items-center gap-2 text-green-600 mb-6">
            <CheckCircle size={18} />
            <span className="text-sm font-medium">专业海乘顾问在线指导</span>
          </div>
          <div className="flex items-center gap-2 text-green-600 mb-6">
            <CheckCircle size={18} />
            <span className="text-sm font-medium">根据您的情况提供定制建议</span>
          </div>
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle size={18} />
            <span className="text-sm font-medium">24小时内回复，解决您的疑问</span>
          </div>
        </div>
        
        {/* 提示信息 */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
          <div className="flex items-start gap-2">
            <MessageCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-amber-800 text-sm">
              添加微信时请备注：{formData?.city || '城市'} + {task.title}，我们会优先处理您的请求。
            </p>
          </div>
        </div>
        
        {/* 后续步骤 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">后续步骤</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-600 pl-4">
            <li>添加微信并发送您的情况</li>
            <li>顾问会在24小时内回复您</li>
            <li>根据建议开始办理证件</li>
            <li>办理完成后在任务列表标记完成</li>
          </ol>
        </div>
        
        {/* 按钮 */}
        <div className="space-y-4">
          <button
            onClick={() => navigate('/academy/boarding/detail', { state: { module: { id: 'seaman-qualification' } } })}
            className="w-full px-6 py-3 rounded-lg font-medium transition-colors bg-green-600 text-white hover:bg-green-700"
          >
            返回任务列表
          </button>
          <button
            onClick={() => navigate('/academy')}
            className="w-full px-6 py-3 rounded-lg font-medium transition-colors bg-gray-600 text-white hover:bg-gray-700"
          >
            返回海乘学院
          </button>
        </div>
      </div>
    </div>
  );
}