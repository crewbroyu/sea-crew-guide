// src/pages/tasks/phase2/Task9ScenarioTraining.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Task9ScenarioTraining() {
  const navigate = useNavigate();
  
  // 直接跳转到海乘学院的岗位场景训练模块
  useEffect(() => {
    // 保存当前职位到localStorage，确保场景训练模块能获取到
    const interviewPosition = localStorage.getItem('interviewSelectedPosition');
    if (!interviewPosition) {
      // 如果没有选择职位，先设置一个默认职位
      localStorage.setItem('interviewSelectedPosition', 'bar_server');
    }
    
    // 跳转到我的Offer页面（邮轮合同）
    navigate('/my-offer');
  }, [navigate]);
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">正在跳转到岗位场景训练模块...</p>
      </div>
    </div>
  );
}

export default Task9ScenarioTraining;