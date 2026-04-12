// src/pages/tasks/phase2/Task7CareerPath.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, CheckCircle, Star, Award, MapPin, Clock, DollarSign, Users, Ship, Menu, X, ArrowRight } from 'lucide-react';

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

// 职业路径等级配置
const careerLevels = [
  {
    id: 1,
    title: '初级服务员',
    position: 'Waiter/Waitress',
    salary: '800-1200美元/月 + 小费',
    duration: '6-9个月',
    experience: '无经验要求',
    duties: [
      '为客人提供餐饮服务',
      '清理餐桌和餐厅',
      '学习基本的邮轮服务流程',
      '与团队成员协作'
    ],
    skills: [
      '基本英语沟通能力',
      '服务意识',
      '团队合作精神',
      '适应能力'
    ],
    growth: '积累服务经验，熟悉邮轮环境',
    color: 'bg-blue-500',
    icon: <Users size={24} />
  },
  {
    id: 2,
    title: '高级服务员',
    position: 'Senior Waiter/Waitress',
    salary: '1200-1800美元/月 + 小费',
    duration: '12-18个月',
    experience: '1年以上邮轮或高级餐厅经验',
    duties: [
      '为VIP客人提供高级服务',
      '培训新员工',
      '管理餐厅区域',
      '处理客人投诉'
    ],
    skills: [
      '流利的英语沟通能力',
      '领导力',
      '问题解决能力',
      '客户关系管理'
    ],
    growth: '晋升为餐厅主管或其他部门高级职位',
    color: 'bg-green-500',
    icon: <Star size={24} />
  },
  {
    id: 3,
    title: '餐厅主管',
    position: 'Restaurant Supervisor',
    salary: '2000-3000美元/月',
    duration: '18-24个月',
    experience: '2年以上邮轮服务经验',
    duties: [
      '管理餐厅运营',
      '制定工作安排',
      '培训和评估员工',
      '确保服务质量'
    ],
    skills: [
      '出色的领导能力',
      '团队管理',
      '预算管理',
      '服务质量管理'
    ],
    growth: '晋升为餐厅经理或其他部门管理职位',
    color: 'bg-yellow-500',
    icon: <Award size={24} />
  },
  {
    id: 4,
    title: '部门经理',
    position: 'Department Manager',
    salary: '3000-4500美元/月',
    duration: '24-36个月',
    experience: '3年以上管理经验',
    duties: [
      '管理整个部门运营',
      '制定部门策略',
      '预算规划和控制',
      '与其他部门协作'
    ],
    skills: [
      '战略规划',
      '财务管理',
      '跨部门协作',
      '人才发展'
    ],
    growth: '晋升为船上高级管理职位',
    color: 'bg-orange-500',
    icon: <Ship size={24} />
  },
  {
    id: 5,
    title: '船上总监',
    position: 'Ship Director',
    salary: '4500-6000美元/月',
    duration: '36-48个月',
    experience: '5年以上邮轮管理经验',
    duties: [
      '监督多个部门运营',
      '制定船上服务标准',
      '处理紧急情况',
      '与总部沟通'
    ],
    skills: [
      '高级领导力',
      '危机管理',
      '战略决策',
      '跨文化管理'
    ],
    growth: '晋升为酒店总监或岸上管理职位',
    color: 'bg-red-500',
    icon: <MapPin size={24} />
  },
  {
    id: 6,
    title: '酒店总监',
    position: 'Hotel Director',
    salary: '6000-10000美元/月',
    duration: '48+个月',
    experience: '8年以上高级管理经验',
    duties: [
      '全面负责酒店运营',
      '制定酒店战略',
      '管理预算和财务',
      '领导高级管理团队'
    ],
    skills: [
      '卓越的领导力',
      '战略思维',
      '财务分析',
      '品牌管理'
    ],
    growth: '成为公司高管或开设自己的业务',
    color: 'bg-purple-500',
    icon: <DollarSign size={24} />
  }
];

// 主组件
function Task7CareerPath() {
  const navigate = useNavigate();
  
  // 检查任务6是否已完成
  useEffect(() => {
    const progressKey = 'boarding_progress';
    const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
    if (!progress.task6 || !progress.task6.completed) {
      // 任务6未完成，重定向到任务列表
      navigate('/tasks');
    }
  }, [navigate]);
  
  // 从 localStorage 加载初始数据
  const [progress, setProgress] = useState(() => {
    const data = loadFromLocalStorage({});
    return data.progress || { completedLevels: [] };
  });
  const [currentLevel, setCurrentLevel] = useState(null);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // 当数据变化时，保存到 localStorage
  useEffect(() => {
    const data = {
      progress
    };
    saveToLocalStorage(data);
  }, [progress]);
  
  // 检查等级是否已完成
  const isLevelCompleted = (levelId) => {
    return progress.completedLevels.includes(levelId);
  };
  
  // 检查等级是否已解锁
  const isLevelUnlocked = (levelId) => {
    if (levelId === 1) return true;
    return isLevelCompleted(levelId - 1);
  };
  
  // 检查等级是否为当前学习等级
  const isCurrentLevel = (levelId) => {
    const completedCount = progress.completedLevels.length;
    return levelId === completedCount + 1;
  };
  
  // 计算已完成等级数量
  const completedCount = progress.completedLevels.length;
  
  // 处理等级点击
  const handleLevelClick = (level) => {
    if (!isLevelUnlocked(level.id)) {
      setSelectedLevel(level);
      setShowLevelModal(true);
      return;
    }
    setCurrentLevel(level.id);
  };
  
  // 处理完成等级
  const handleCompleteLevel = (levelId) => {
    setProgress(prev => {
      if (!prev.completedLevels.includes(levelId)) {
        const newCompletedLevels = [...prev.completedLevels, levelId].sort((a, b) => a - b);
        if (newCompletedLevels.length === careerLevels.length) {
          setShowSummary(true);
          
          // 标记任务7为已完成
          const progressKey = 'boarding_progress';
          const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
          progress.task7 = {
            completed: true,
            completedAt: new Date().toISOString()
          };
          localStorage.setItem(progressKey, JSON.stringify(progress));
          console.log('Task7 完成状态已写入:', progress);
        }
        return {
          ...prev,
          completedLevels: newCompletedLevels
        };
      }
      return prev;
    });
    setCurrentLevel(null);
  };
  
  // 渲染等级详情
  const renderLevelDetail = () => {
    if (!currentLevel) return null;
    
    const level = careerLevels[currentLevel - 1];
    
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
            <button 
              onClick={() => setCurrentLevel(null)}
              className="text-gray-500 mr-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{level.title}</h1>
              <p className="text-sm text-gray-500">等级 {level.id}/6</p>
            </div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* 等级概览卡片 */}
          <div className={`rounded-2xl p-6 text-white ${level.color} shadow-lg`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 p-3 rounded-full">
                  {level.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{level.title}</h2>
                  <p className="opacity-90">{level.position}</p>
                </div>
              </div>
              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-full text-sm font-medium">
                等级 {level.id}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-white bg-opacity-10 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign size={18} />
                  <h3 className="font-medium">薪资范围</h3>
                </div>
                <p>{level.salary}</p>
              </div>
              <div className="bg-white bg-opacity-10 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={18} />
                  <h3 className="font-medium">合同期限</h3>
                </div>
                <p>{level.duration}</p>
              </div>
              <div className="bg-white bg-opacity-10 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={18} />
                  <h3 className="font-medium">经验要求</h3>
                </div>
                <p>{level.experience}</p>
              </div>
              <div className="bg-white bg-opacity-10 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Star size={18} />
                  <h3 className="font-medium">职业成长</h3>
                </div>
                <p>{level.growth}</p>
              </div>
            </div>
          </div>
          
          {/* 工作职责 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4">工作职责</h3>
            <ul className="space-y-3">
              {level.duties.map((duty, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700">{duty}</p>
                </li>
              ))}
            </ul>
          </div>
          
          {/* 所需技能 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4">所需技能</h3>
            <div className="flex flex-wrap gap-2">
              {level.skills.map((skill, index) => (
                <span key={index} className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full text-sm font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          
          {/* 完成按钮 */}
          <div className="mt-8">
            <button
              onClick={() => handleCompleteLevel(level.id)}
              className="w-full py-4 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 shadow-md"
            >
              完成本等级
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // 渲染总结页面
  const renderSummary = () => {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 pt-12 pb-24">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-white text-2xl font-bold mb-4">职业发展路径总结</h1>
            <p className="text-purple-200 text-lg mb-8">恭喜你完成了所有职业路径探索！</p>
            
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <h2 className="text-xl font-bold text-gray-900 mb-6">你的邮轮职业发展规划</h2>
              
              <div className="space-y-6">
                <p className="text-gray-700">
                  通过本次职业路径探索，你已经了解了邮轮行业的完整职业发展路径，从初级服务员到酒店总监的成长历程。
                </p>
                
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-gray-800 mb-4">职业发展关键要素</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700">持续学习和提升英语能力</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700">积累服务经验和专业技能</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700">培养领导力和管理能力</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700">建立良好的职业网络</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700">保持积极的工作态度和专业精神</p>
                    </li>
                  </ul>
                </div>
                
                <p className="text-gray-700">
                  记住，邮轮行业的职业发展需要时间和努力，但只要你保持专注和热情，就一定能够实现自己的职业目标。
                </p>
                
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => setShowSummary(false)}
                    className="flex-1 py-3 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
                  >
                    重新探索
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="flex-1 py-3 rounded-lg font-medium transition-colors bg-gray-200 text-gray-800 hover:bg-gray-300"
                  >
                    返回首页
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // 渲染主页面
  const renderMainPage = () => {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 pt-12 pb-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-white text-2xl font-bold">职业发展路径</h1>
            <p className="text-blue-200 text-sm mt-1">探索邮轮行业的职业成长机会</p>
            
            {/* 进度条 */}
            <div className="mt-4">
              <div className="flex justify-between text-white/60 text-xs mb-1">
                <span>探索进度</span>
                <span>{completedCount}/6 等级</span>
              </div>
              <div className="w-full bg-white/30 rounded-full h-2">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${(completedCount / 6) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* 等级导航 */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-2">邮轮职业发展路径</h2>
            <p className="text-gray-600">
              从初级服务员到酒店总监，探索邮轮行业的职业成长机会和发展路径。
            </p>
          </div>
          
          {/* 等级卡片网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {careerLevels.map((level) => {
              const isCompleted = isLevelCompleted(level.id);
              const isUnlocked = isLevelUnlocked(level.id);
              const isCurrent = isCurrentLevel(level.id);
              
              return (
                <div 
                  key={level.id}
                  onClick={() => handleLevelClick(level)}
                  className={`rounded-xl overflow-hidden transition-all cursor-pointer shadow-sm border ${isCurrent ? 'border-2 border-blue-500 shadow-md' : 'border-gray-100'} ${isUnlocked ? 'bg-white' : 'bg-gray-50 opacity-70'}`}
                >
                  <div className={`${level.color} p-4 text-white`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-white bg-opacity-20 p-2 rounded-full">
                          {level.icon}
                        </div>
                        <div>
                          <h3 className="font-bold">等级 {level.id}</h3>
                          <p className="text-sm opacity-90">{level.title}</p>
                        </div>
                      </div>
                      {isCompleted && (
                        <CheckCircle size={24} className="text-white" />
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-medium text-gray-900 mb-2">{level.position}</p>
                    <p className="text-xs text-gray-500 mb-3">薪资: {level.salary}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">经验要求: {level.experience}</p>
                      <ArrowRight size={16} className={`${isUnlocked ? 'text-gray-400' : 'text-gray-300'}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* 锁定提示弹窗 */}
        {showLevelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-5 max-w-md w-full mx-4">
              <div className="flex items-center gap-2 mb-4">
                <Star size={24} className="text-amber-500" />
                <h3 className="text-lg font-bold text-gray-900">等级未解锁</h3>
              </div>
              <p className="text-gray-600 mb-4">
                请先完成等级 {selectedLevel?.id - 1}，才能探索等级 {selectedLevel?.id}。
              </p>
              <button
                onClick={() => setShowLevelModal(false)}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                我知道了
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  if (showSummary) {
    return renderSummary();
  }
  
  return currentLevel ? renderLevelDetail() : renderMainPage();
}

export default Task7CareerPath;