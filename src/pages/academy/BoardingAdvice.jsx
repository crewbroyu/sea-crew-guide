// src/pages/academy/BoardingAdvice.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, MessageCircle, MapPin, UserCheck, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function BoardingAdvice() {
  const navigate = useNavigate();
  const location = useLocation();
  const { task } = location.state || {};

  if (!task) {
    navigate('/academy/boarding');
    return null;
  }

  // 表单状态
  const [formData, setFormData] = useState({
    city: '',
    hasInterview: 'no'
  });

  // 处理表单输入
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 处理提交
  const handleSubmit = (e) => {
    e.preventDefault();
    // 这里可以添加表单验证
    // 然后导航到微信引导页面
    navigate('/academy/boarding/wechat', {
      state: { task, formData }
    });
  };

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
          <span className="text-white font-medium">获取建议</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/academy/boarding/detail', { state: { module: { id: 'seaman-qualification' } } })}
            className="text-white hover:text-green-200"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-white text-2xl font-bold">获取办理建议</h1>
        </div>
        <p className="text-white/80 text-sm mt-2">
          {task.title} - {task.description}
        </p>
      </div>
      
      {/* 内容区域 */}
      <div className="px-6 py-6 space-y-6">
        {/* 提示信息 */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-amber-800 text-sm">
              不同情况办理方式不一样，选错会浪费时间
            </p>
          </div>
        </div>
        
        {/* 表单 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">请填写以下信息</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 所在城市 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <MapPin size={16} className="text-green-600" />
                所在城市
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="请输入您所在的城市"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            
            {/* 是否已面试 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <UserCheck size={16} className="text-green-600" />
                是否已通过邮轮公司面试
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="hasInterview"
                    value="yes"
                    checked={formData.hasInterview === 'yes'}
                    onChange={handleInputChange}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <span className="text-gray-700">是</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="hasInterview"
                    value="no"
                    checked={formData.hasInterview === 'no'}
                    onChange={handleInputChange}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <span className="text-gray-700">否</span>
                </label>
              </div>
            </div>
            
            {/* 提交按钮 */}
            <button
              type="submit"
              className="w-full px-6 py-3 rounded-lg font-medium transition-colors bg-green-600 text-white hover:bg-green-700"
            >
              获取具体建议
            </button>
          </form>
        </div>
        
        {/* 说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">为什么需要这些信息？</h3>
          <p className="text-blue-700 text-sm">
            不同城市的办理流程和机构可能不同，是否通过面试也会影响办理顺序。我们会根据您的具体情况，提供最适合的办理建议。
          </p>
        </div>
        
        {/* 返回按钮 */}
        <button
          onClick={() => navigate('/academy/boarding/detail', { state: { module: { id: 'seaman-qualification' } } })}
          className="w-full px-6 py-3 rounded-lg font-medium transition-colors bg-gray-600 text-white hover:bg-gray-700"
        >
          返回任务列表
        </button>
      </div>
    </div>
  );
}