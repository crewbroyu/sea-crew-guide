// src/pages/tasks/phase2/Task7InterviewPractice.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Clock, Mic, Video, Play, Pause, X, RefreshCw, Check, BarChart3, ArrowLeft } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';
import { positionConfig } from '../../../data/interviewQuestions';
import interviewQuestions from '../../../data/interviewQuestions';

// 封装 localStorage 工具函数
const STORAGE_KEY = 'task7_data';

const saveToLocalStorage = (data) => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, serializedData);
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      alert('存储空间不足，请清理浏览器缓存后重试');
    }
    return false;
  }
};

const loadFromLocalStorage = (defaultValue) => {
  try {
    const serializedData = localStorage.getItem(STORAGE_KEY);
    if (serializedData === null) {
      return defaultValue;
    }
    return JSON.parse(serializedData);
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
};

// 问题分类颜色映射
const categoryColors = {
  personal: 'bg-blue-100 text-blue-700',
  experience: 'bg-green-100 text-green-700',
  scenario: 'bg-purple-100 text-purple-700',
  behavioral: 'bg-amber-100 text-amber-700',
  knowledge: 'bg-red-100 text-red-700',
  skill: 'bg-indigo-100 text-indigo-700'
};

// 录制状态
const RECORDING_STATUS = {
  IDLE: 'idle',
  RECORDING: 'recording',
  COMPLETED: 'completed'
};

function Task7InterviewPractice() {
  const navigate = useNavigate();
  
  // 直接跳转到海乘学院的面试训练模块
  useEffect(() => {
    // 保存当前职位到localStorage，确保面试训练模块能获取到
    const interviewPosition = localStorage.getItem('interviewSelectedPosition');
    if (!interviewPosition) {
      // 如果没有选择职位，先设置一个默认职位
      localStorage.setItem('interviewSelectedPosition', 'bar_server');
    }
    
    // 跳转到海乘学院的面试训练模块
    navigate('/academy/interview-questions');
  }, [navigate]);
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">正在跳转到面试训练模块...</p>
      </div>
    </div>
  );
}
export default Task7InterviewPractice;