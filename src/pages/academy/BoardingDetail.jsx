// src/pages/academy/BoardingDetail.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, AlertCircle, CheckCircle, ExternalLink, Calendar, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function BoardingDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { module } = location.state || {};

  if (!module) {
    navigate('/academy/boarding');
    return null;
  }

  // 任务状态管理
  const [tasks, setTasks] = useState([
    {
      id: 'seaman_book',
      title: '海员证',
      status: 'pending', // pending, in_progress, completed
      description: '最核心的证件，需要先参加基本安全培训',
      hint: '关键在培训机构选择，不同机构费用和时间差异大',
      button: '获取办理建议',
      priority: 1,
      isMain: true
    },
    {
      id: 'seaman-medical',
      title: '海员体检',
      status: 'pending',
      description: '去海事局指定医院体检，1-3天出结果',
      hint: '不同城市医院不同，有些需要提前预约',
      button: '获取体检机构信息',
      priority: 2
    },
    {
      id: 'international-medical',
      title: '国际旅行体检（黄皮书）',
      status: 'pending',
      description: '用于出入境，需要疫苗，一般1-3天',
      hint: '建议提前办理，不要等签证之后，否则可能影响登船',
      button: '获取办理建议',
      priority: 3
    },
    {
      id: 'no-criminal',
      title: '无犯罪记录',
      status: 'pending',
      description: '户籍所在地办理，一般1-3天',
      hint: '有效期6个月，别太早办',
      button: '获取办理方式',
      priority: 4
    }
  ]);

  // 检查任务状态，确保顺序执行
  useEffect(() => {
    setTasks(prevTasks => {
      const updatedTasks = [...prevTasks];
      let previousCompleted = false;

      for (let i = 0; i < updatedTasks.length; i++) {
        if (i === 0) {
          // 第一个任务（海员证）总是可操作的
          previousCompleted = true;
        } else {
          // 只有前一个任务完成了，当前任务才能操作
          if (updatedTasks[i-1].status === 'completed') {
            previousCompleted = true;
          } else {
            previousCompleted = false;
            // 如果前一个任务未完成，当前任务状态重置为pending
            if (updatedTasks[i].status !== 'pending') {
              updatedTasks[i].status = 'pending';
            }
          }
        }
      }

      return updatedTasks;
    });
  }, []); // 空依赖数组，只在组件挂载时执行一次

  // 处理任务状态更新
  const handleStatusUpdate = (taskId, status) => {
    setTasks(prev => {
      const updatedTasks = prev.map(task => 
        task.id === taskId ? { ...task, status } : task
      );

      // 检查并更新后续任务的状态
      let previousCompleted = false;
      for (let i = 0; i < updatedTasks.length; i++) {
        if (i === 0) {
          // 第一个任务（海员证）总是可操作的
          previousCompleted = true;
        } else {
          // 只有前一个任务完成了，当前任务才能操作
          if (updatedTasks[i-1].status === 'completed') {
            previousCompleted = true;
          } else {
            previousCompleted = false;
            // 如果前一个任务未完成，当前任务状态重置为pending
            if (updatedTasks[i].status !== 'pending') {
              updatedTasks[i].status = 'pending';
            }
          }
        }
      }

      return updatedTasks;
    });
  };

  // 处理任务按钮点击
  const handleTaskClick = (task) => {
    // 只有前一个任务完成了，才能操作当前任务
    const taskIndex = tasks.findIndex(t => t.id === task.id);
    if (taskIndex > 0 && tasks[taskIndex - 1].status !== 'completed') {
      return;
    }

    // 标记任务为进行中
    handleStatusUpdate(task.id, 'in_progress');

    // 导航到中间页面（获取建议）
    navigate('/academy/boarding/advice', {
      state: { task }
    });
  };

  // 处理任务完成
  const handleTaskComplete = (taskId) => {
    handleStatusUpdate(taskId, 'completed');
  };

  // 获取状态标签样式
  const getStatusStyle = (status) => {
    switch(status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 模块详细信息
  const getModuleDetails = (moduleId) => {
    switch(moduleId) {
      case 'seaman-qualification':
        return {
          title: '登船证件任务',
          subtitle: '按顺序做，别走弯路',
          overview: '办理海乘证件是登船的第一步，按顺序执行可以节省时间和精力。每个证件都有其重要性，海员证是核心，其他证件都是为了配合海员证使用。'
        };
      case 'c1d-visa':
        return {
          overview: 'C1D签证是海乘工作的必备签证，用于在美国港口登船工作。申请过程包括预约面谈、材料准备、面签和等待出签等步骤。',
          items: [
            {
              id: 'visa-appointment',
              title: '预约面谈',
              description: '填写DS-160表格、缴纳签证费（中信）',
              content: [
                '填写 DS-160 表格：登录美国签证申请系统，如实填写个人信息和申请目的',
                '缴纳签证费（中信）：通过中信银行缴纳签证申请费，获取缴费收据',
                '预约面签时间：使用缴费收据上的号码预约面签时间'
              ]
            },
            {
              id: 'visa-materials',
              title: '材料准备',
              description: '邮轮公司的派遣函（LOE）、海员证、无犯罪记录证明等',
              content: [
                '邮轮公司的派遣函（LOE）：包含职位、合同期限等详细信息',
                '海员证：有效的海员身份证件',
                '无犯罪记录证明：近期开具的无犯罪记录证明',
                '护照：有效期至少6个月',
                'DS-160确认页：填写完成后打印的确认页',
                '缴费收据：中信银行缴费后的收据',
                '照片：符合美国签证要求的照片'
              ]
            },
            {
              id: 'visa-interview',
              title: '面签攻略',
              description: '常见问题对策（侧重于职业真实性、合同期限等）',
              content: [
                '职业真实性：准备详细的工作经历和邮轮公司信息，证明你确实被雇佣为海乘',
                '合同期限：清楚说明合同起止日期，强调你会在合同结束后返回中国',
                '资金状况：提供足够的资金证明，确保你有能力支付签证费用和初期生活费用',
                '归国计划：强调你在国内的家庭、工作或学习等羁绊，证明你会按时归国',
                '英语准备：面签时需要用英语交流，提前准备常见问题的回答'
              ]
            },
            {
              id: 'visa-waiting',
              title: '出签等待',
              description: '拿到签证后，核对有效期和个人信息',
              content: [
                '拿到签证后，仔细核对有效期和个人信息',
                '确保签证页信息与护照一致',
                '保存好签证页，避免损坏或丢失',
                '签证到手后，开始准备登船所需的其他材料和行李'
              ]
            }
          ]
        };
      default:
        return {
          overview: '',
          items: []
        };
    }
  };

  const details = getModuleDetails(module.id);

  // 如果是海乘职业资质模块，显示任务列表
  if (module.id === 'seaman-qualification') {
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
            <span className="text-white font-medium">{details.title}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/academy/boarding')}
              className="text-white hover:text-green-200"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-white text-2xl font-bold">{details.title}</h1>
              <p className="text-white/80 text-sm mt-1">
                {details.subtitle}
              </p>
            </div>
          </div>
        </div>
        
        {/* 详情内容 */}
        <div className="px-6 py-6 space-y-6">
          {/* 模块概述 */}
          {details.overview && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <p className="text-gray-600">{details.overview}</p>
            </div>
          )}

          {/* 任务列表 */}
          <div className="space-y-4">
            {tasks.map((task, index) => {
              const taskIndex = tasks.findIndex(t => t.id === task.id);
              const isPreviousCompleted = taskIndex === 0 || tasks[taskIndex - 1].status === 'completed';
              
              return (
                <div key={task.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  {/* 任务头部 */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                          {index + 1}
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">{task.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(task.status)}`}>
                          {task.status === 'completed' ? '已完成' : task.status === 'in_progress' ? '进行中' : '未开始'}
                        </span>
                      </div>
                      {task.status === 'completed' && (
                        <CheckCircle size={20} className="text-green-600" />
                      )}
                    </div>
                  </div>
                  
                  {/* 任务内容 */}
                  <div className="p-4">
                    <p className="text-gray-600 mb-3">{task.description}</p>
                    
                    {/* 关键提示 */}
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-3 mb-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-amber-800 text-sm">{task.hint}</p>
                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleTaskClick(task)}
                        disabled={!isPreviousCompleted}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${isPreviousCompleted ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                      >
                        {task.button}
                      </button>
                      
                      {task.status !== 'completed' && isPreviousCompleted && (
                        <button
                          onClick={() => handleTaskComplete(task.id)}
                          className="px-4 py-2 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
                        >
                          标记完成
                        </button>
                      )}
                    </div>
                    
                    {/* 建议稍后提示 */}
                    {!isPreviousCompleted && (
                      <div className="mt-3 text-sm text-gray-500 flex items-center gap-2">
                        <Calendar size={16} />
                        <span>建议先完成前一项任务</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* 提示信息 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">过来人经验</h3>
            <p className="text-blue-700 text-sm">
              办理证件时一定要按顺序来，海员证是基础，其他证件都需要它。遇到问题及时咨询，避免走弯路。
            </p>
          </div>
          
          {/* 下一步指引 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-gray-800 mb-3">下一步指引</h3>
            <div className="flex items-center gap-2 text-green-600">
              <ArrowRight size={18} />
              <p>完成所有证件办理后，就可以准备申请C1D签证了</p>
            </div>
          </div>
          
          {/* 海事局官网查询 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <ExternalLink size={20} className="text-blue-600" />
              <h2 className="text-lg font-bold text-gray-800">海事局官网查询</h2>
            </div>
            <p className="text-gray-600 mb-4">
              点击下方按钮访问海事局官方网站，查询指定的体检机构信息。
            </p>
            <a
              href="https://cyxx.msa.gov.cn/crew_qey/qry/queryHealInit.action"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-6 py-3 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <ExternalLink size={18} />
              访问海事局官网查询体检机构
            </a>
          </div>
          
          {/* 返回按钮 */}
          <button
            onClick={() => navigate('/academy/boarding')}
            className="w-full px-6 py-3 rounded-lg font-medium transition-colors bg-green-600 text-white hover:bg-green-700"
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  // 其他模块（如C1D签证）保持原有结构
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
          <span className="text-white font-medium">{module.title}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/academy/boarding')}
            className="text-white hover:text-green-200"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-white text-2xl font-bold">{module.title}</h1>
          <p className="text-white/80 text-sm mt-2">
            {module.description}
          </p>
        </div>
      </div>
      
      {/* 详情内容 */}
      <div className="px-6 py-6 space-y-6">
        {/* 模块概述 */}
        {details.overview && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-gray-600">{details.overview}</p>
          </div>
        )}

        {/* 模块项目 */}
        {details.items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{item.title}</h3>
            
            {/* 内容列表 */}
            {item.content && (
              <div>
                <ul className="list-disc list-inside space-y-2 text-gray-600 pl-4">
                  {item.content.map((content, index) => (
                    <li key={index}>{content}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        {/* 提示信息 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">温馨提示</h3>
          <p className="text-blue-700 text-sm">
            以上信息仅供参考，具体办理流程和要求可能因地区和时间而有所不同。建议在办理前咨询当地相关机构或专业人士。
          </p>
        </div>

        {/* 返回按钮 */}
        <button
          onClick={() => navigate('/academy/boarding')}
          className="w-full px-6 py-3 rounded-lg font-medium transition-colors bg-green-600 text-white hover:bg-green-700"
        >
          返回列表
        </button>
      </div>
    </div>
  );
}