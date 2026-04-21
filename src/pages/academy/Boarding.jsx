// src/pages/academy/Boarding.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { ChevronLeft, Ship, Stethoscope, Globe, Shield, IdCard } from 'lucide-react';

// 登船手续模块
const boardingModules = [
  {
    id: 'seaman-qualification',
    title: '海乘职业资质',
    description: '包含海员证、海员体检、国际旅行体检、无犯罪记录证明',
    icon: <IdCard size={24} className="text-blue-600" />,
    color: 'bg-blue-100',
    items: [
      {
        id: 'seaman_book',
        title: '1. 海员证',
        description: '海事局签发的海员身份证件'
      },
      {
        id: 'seaman-medical',
        title: '2. 海员体检',
        description: '海事局指定机构的职业健康检查'
      },
      {
        id: 'international-medical',
        title: '3. 国际旅行体检',
        description: '出入境检验检疫局的健康证明'
      },
      {
        id: 'no-criminal',
        title: '4. 无犯罪记录证明',
        description: '户籍所在地派出所开具'
      }
    ]
  },
  {
    id: 'c1d-visa',
    title: '申请C1D签证',
    description: '包含预约面谈、材料准备、面签攻略、出签等待',
    icon: <Ship size={24} className="text-amber-600" />,
    color: 'bg-amber-100',
    items: [
      {
        id: 'visa-appointment',
        title: '预约面谈',
        description: '填写DS-160表格、缴纳签证费（中信）'
      },
      {
        id: 'visa-materials',
        title: '材料准备',
        description: '邮轮公司的派遣函（LOE）、海员证、无犯罪记录证明等'
      },
      {
        id: 'visa-interview',
        title: '面签攻略',
        description: '常见问题对策（侧重于职业真实性、合同期限等）'
      },
      {
        id: 'visa-waiting',
        title: '出签等待',
        description: '拿到签证后，核对有效期和个人信息'
      }
    ]
  }
];

export default function Boarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const { moduleId } = location.state || {};

  // 如果有moduleId参数，直接跳转到对应模块的详情页面
  useEffect(() => {
    console.log('Boarding moduleId:', moduleId);
    if (moduleId) {
      const module = boardingModules.find(m => m.id === moduleId);
      console.log('Found module:', module);
      if (module) {
        // 只传递必要的数据，不包含React元素和items
        const { icon, items, ...moduleData } = module;
        console.log('Navigating to detail with module:', moduleData);
        navigate('/academy/boarding/detail', {
          state: { module: moduleData }
        });
      }
    }
  }, [moduleId, navigate]);

  const handleModuleClick = (module) => {
    // 只传递必要的数据，不包含React元素和items
    const { icon, items, ...moduleData } = module;
    navigate('/academy/boarding/detail', {
      state: { module: moduleData }
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
          <span className="text-white font-medium">登船准备</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/academy')}
            className="text-white hover:text-green-200"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-white text-2xl font-bold">登船准备</h1>
        </div>
        <p className="text-white/80 text-sm mt-2">
          海乘必备证件办理指南
        </p>
      </div>
      
      {/* 手续模块列表 */}
      <div className="px-6 py-6 space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <h2 className="text-lg font-bold text-gray-800">办理模块</h2>
          <p className="text-gray-600 mt-2">
            点击查看详细办理指南
          </p>
        </div>
        
        <div className="space-y-4">
          {boardingModules.map((module) => (
            <div key={module.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* 模块标题 */}
              <button
                onClick={() => handleModuleClick(module)}
                className="w-full p-4 flex items-center justify-between active:scale-[0.98] transition"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${module.color} rounded-xl flex items-center justify-center`}>
                    {module.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-800">{module.title}</p>
                    <p className="text-xs text-gray-500">{module.description}</p>
                  </div>
                </div>
                <ChevronLeft size={20} className="text-gray-400 transform rotate-180" />
              </button>
              
              {/* 模块内项目 */}
              <div className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-3">
                  {module.items.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition" onClick={() => handleModuleClick(module)}>
                      <p className="font-medium text-gray-800 text-sm">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
