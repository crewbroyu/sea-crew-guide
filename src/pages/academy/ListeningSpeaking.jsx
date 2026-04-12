// src/pages/academy/ListeningSpeaking.jsx
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Ship, Home, Utensils, Building, MessageSquare, Headphones } from 'lucide-react';

// 模拟数据：听说训练分类
const categories = [
  {
    id: 'boarding',
    name: '登船接待',
    icon: <Ship size={24} className="text-blue-600" />,
    description: '学习登船、办理手续相关的英语对话',
    courses: [
      {
        id: 'boarding-1',
        title: '登船手续办理',
        mediaType: 'audio',
        mediaUrl: 'https://example.com/audio/boarding1.mp3',
        transcript: 'Welcome aboard! May I see your boarding pass and passport, please?',
        translation: '欢迎登船！请出示您的登机牌和护照好吗？'
      },
      {
        id: 'boarding-2',
        title: '房间介绍',
        mediaType: 'video',
        mediaUrl: 'https://example.com/video/boarding2.mp4',
        transcript: 'This is your cabin. The bathroom is on the left, and the wardrobe is on the right.',
        translation: '这是您的客舱。浴室在左边，衣柜在右边。'
      }
    ]
  },
  {
    id: 'cabin',
    name: '客舱服务',
    icon: <Home size={24} className="text-green-600" />,
    description: '学习客舱服务相关的英语对话',
    courses: [
      {
        id: 'cabin-1',
        title: '客房清洁服务',
        mediaType: 'audio',
        mediaUrl: 'https://example.com/audio/cabin1.mp3',
        transcript: 'Housekeeping! May I clean your cabin now?',
        translation: '客房服务！我现在可以打扫您的客舱吗？'
      },
      {
        id: 'cabin-2',
        title: '设施使用说明',
        mediaType: 'video',
        mediaUrl: 'https://example.com/video/cabin2.mp4',
        transcript: 'To adjust the temperature, use the controls on the wall.',
        translation: '要调节温度，请使用墙上的控制按钮。'
      }
    ]
  },
  {
    id: 'restaurant',
    name: '餐厅服务',
    icon: <Utensils size={24} className="text-amber-600" />,
    description: '学习餐厅服务相关的英语对话',
    courses: [
      {
        id: 'restaurant-1',
        title: '点餐服务',
        mediaType: 'audio',
        mediaUrl: 'https://example.com/audio/restaurant1.mp3',
        transcript: 'Good evening! Would you like to see our menu?',
        translation: '晚上好！您想看看我们的菜单吗？'
      },
      {
        id: 'restaurant-2',
        title: '特殊饮食需求',
        mediaType: 'video',
        mediaUrl: 'https://example.com/video/restaurant2.mp4',
        transcript: 'Do you have any dietary restrictions?',
        translation: '您有任何饮食限制吗？'
      }
    ]
  },
  {
    id: 'public',
    name: '公共区域',
    icon: <Building size={24} className="text-purple-600" />,
    description: '学习公共区域服务相关的英语对话',
    courses: [
      {
        id: 'public-1',
        title: '信息咨询',
        mediaType: 'audio',
        mediaUrl: 'https://example.com/audio/public1.mp3',
        transcript: 'How can I help you today?',
        translation: '今天我能帮您什么？'
      },
      {
        id: 'public-2',
        title: '活动介绍',
        mediaType: 'video',
        mediaUrl: 'https://example.com/video/public2.mp4',
        transcript: 'We have a variety of activities planned for today.',
        translation: '我们今天安排了各种各样的活动。'
      }
    ]
  },
  {
    id: 'emergency',
    name: '应急情况',
    icon: <MessageSquare size={24} className="text-red-600" />,
    description: '学习应急情况相关的英语对话',
    courses: [
      {
        id: 'emergency-1',
        title: '紧急疏散',
        mediaType: 'audio',
        mediaUrl: 'https://example.com/audio/emergency1.mp3',
        transcript: 'Please proceed to your assigned muster station.',
        translation: '请前往您指定的集合点。'
      },
      {
        id: 'emergency-2',
        title: '医疗救助',
        mediaType: 'video',
        mediaUrl: 'https://example.com/video/emergency2.mp4',
        transcript: 'We need to call the ships doctor immediately.',
        translation: '我们需要立即呼叫船上的医生。'
      }
    ]
  }
];

export default function ListeningSpeaking() {
  const navigate = useNavigate();

  const handleCategoryClick = (category) => {
    navigate('/academy/listening-speaking/category', {
      state: { category }
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
          按场景分类的英语听说练习，提升你的实际交流能力
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
