// src/pages/academy/Boarding.jsx
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Ship, Stethoscope, Globe, Shield, IdCard } from 'lucide-react';

// 登船手续事项
const boardingItems = [
  {
    id: 'seaman-book',
    title: '海员证',
    description: '海事局签发的海员身份证件',
    icon: <IdCard size={24} className="text-blue-600" />,
    color: 'bg-blue-100'
  },
  {
    id: 'seaman-medical',
    title: '海员体检',
    description: '海事局指定机构的职业健康检查',
    icon: <Stethoscope size={24} className="text-green-600" />,
    color: 'bg-green-100'
  },
  {
    id: 'international-medical',
    title: '国际旅行体检',
    description: '出入境检验检疫局的健康证明',
    icon: <Globe size={24} className="text-purple-600" />,
    color: 'bg-purple-100'
  },
  {
    id: 'no-criminal',
    title: '无犯罪记录证明',
    description: '户籍所在地派出所开具',
    icon: <Shield size={24} className="text-red-600" />,
    color: 'bg-red-100'
  },
  {
    id: 'c1d-visa',
    title: 'C1D签证',
    description: '美国海员过境签证',
    icon: <Ship size={24} className="text-amber-600" />,
    color: 'bg-amber-100'
  }
];

export default function Boarding() {
  const navigate = useNavigate();

  const handleItemClick = (item) => {
    navigate('/academy/boarding/detail', {
      state: { item }
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
          <span className="text-white font-medium">登船手续</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/academy')}
            className="text-white hover:text-green-200"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-white text-2xl font-bold">登船手续</h1>
        </div>
        <p className="text-white/80 text-sm mt-2">
          海乘必备证件办理指南
        </p>
      </div>
      
      {/* 手续事项列表 */}
      <div className="px-6 py-6 space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <h2 className="text-lg font-bold text-gray-800">办理事项</h2>
          <p className="text-gray-600 mt-2">
            点击查看详细办理指南
          </p>
        </div>
        
        <div className="space-y-3">
          {boardingItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="w-full bg-white rounded-xl p-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center`}>
                  {item.icon}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-800">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              </div>
              <ChevronLeft size={20} className="text-gray-400 transform rotate-180" />
            </button>
          ))}
        </div>
        
        {/* 提示信息 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="font-medium text-blue-800 mb-2">温馨提示</h3>
          <p className="text-blue-700 text-sm">
            办理登船手续需要一定的时间，请提前规划。具体办理流程、费用、材料清单等详细信息将在详情页陆续更新。
          </p>
        </div>
      </div>
    </div>
  );
}
