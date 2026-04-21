// src/pages/academy/ListeningSpeaking.jsx
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Headphones } from 'lucide-react';

// 模拟数据：听说训练分类
const categories = [
  {
    id: 'eslpod',
    name: 'ESLPod',
    icon: <Headphones size={24} className="text-blue-600" />,
    description: '慢速英语播客，适合英语学习者',
    courses: [
      {
        id: 'eslpod-1',
        title: 'Daily English',
        mediaType: 'audio',
        mediaUrl: 'https://example.com/audio/eslpod1.mp3',
        transcript: 'Welcome to ESLPod! Today we\'re going to learn about daily English conversations.',
        translation: '欢迎来到ESLPod！今天我们将学习日常英语对话。'
      },
      {
        id: 'eslpod-2',
        title: 'Business English',
        mediaType: 'audio',
        mediaUrl: 'https://example.com/audio/eslpod2.mp3',
        transcript: 'In today\'s lesson, we\'ll cover business English vocabulary and expressions.',
        translation: '在今天的课程中，我们将涵盖商务英语词汇和表达。'
      }
    ]
  },
  {
    id: 'englishpod',
    name: 'EnglishPod',
    icon: <Headphones size={24} className="text-green-600" />,
    description: '标准语速英语播客，适合中高级学习者',
    courses: [
      {
        id: 'englishpod-1',
        title: 'Casual English',
        mediaType: 'audio',
        mediaUrl: 'https://example.com/audio/englishpod1.mp3',
        transcript: 'Hey there! Welcome to EnglishPod. Today we\'re talking about casual English phrases.',
        translation: '嘿！欢迎来到EnglishPod。今天我们谈论的是日常英语短语。'
      },
      {
        id: 'englishpod-2',
        title: 'Travel English',
        mediaType: 'audio',
        mediaUrl: 'https://example.com/audio/englishpod2.mp3',
        transcript: 'In this episode, we\'ll learn essential travel English for cruise ship workers.',
        translation: '在这一集中，我们将学习邮轮工作人员必备的旅行英语。'
      }
    ]
  }
];

export default function ListeningSpeaking() {
  const navigate = useNavigate();

  const handleCategoryClick = (category) => {
    navigate(`/academy/listening-speaking/${category.id}`, {
      state: {
        id: category.id,
        name: category.name,
        description: category.description,
        courses: category.courses
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部头部区域 */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 pt-16 pb-6">
        {/* 面包屑导航 */}
        <div className="flex items-center gap-2 text-indigo-200 text-sm mb-4">
          <span onClick={() => navigate('/academy')} className="cursor-pointer hover:text-white">海乘学院</span>
          <span className="breadcrumb-separator">›</span>
          <span className="text-white font-medium">听说训练</span>
        </div>
        
        <h1 className="text-white text-2xl font-bold">听说训练</h1>
        <p className="text-white/80 text-sm mt-2">
          通过ESLPod和EnglishPod提升你的英语听说能力
        </p>
      </div>
      
      {/* 分类列表 */}
      <div className="px-6 py-6 space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <h2 className="text-lg font-bold text-gray-800">训练分类</h2>
          <p className="text-gray-600 mt-2">
            选择一个场景开始练习
          </p>
        </div>
        
        <div className="space-y-3">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category)}
              className="w-full bg-white rounded-xl p-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  {category.icon}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-800">{category.name}</p>
                  <p className="text-xs text-gray-500">{category.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{category.courses.length} 个训练课程</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
