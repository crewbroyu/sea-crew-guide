import { useState, useEffect, useCallback, useRef, createElement } from 'react'
import useAuthStore from '../store/useAuthStore'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ChevronLeft, ChevronDown, ChevronUp, CheckCircle, Lock, Clock, AlertCircle,
  ArrowRight
} from 'lucide-react'
import pathData, { TASK_STATUS } from '../data/pathData'

export default function Tasks() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // 从 localStorage 读取已完成任务列表
  const [completedTasks, setCompletedTasks] = useState(() => {
    const progressKey = 'boarding_progress';
    const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
    const completed = [];
    
    // 检查每个任务是否完成
    for (let i = 1; i <= 12; i++) {
      if (progress[`task${i}`] && progress[`task${i}`].completed) {
        completed.push(i);
      }
    }
    
    return completed;
  })
  // 模拟审核中的任务
  const [reviewingTasks, setReviewingTasks] = useState([])
  // 模拟被拒绝的任务
  const [rejectedTasks, setRejectedTasks] = useState([])
  // 当前展开的阶段ID
  const [expandedStage, setExpandedStage] = useState(null)

  // 处理 justCompleted 参数 - 必须在 useEffect 中
  useEffect(() => {
    const justCompletedId = searchParams.get('justCompleted');
    if (justCompletedId) {
      const taskId = parseInt(justCompletedId, 10);
      setCompletedTasks(prev => {
        if (prev.includes(taskId)) {
          return prev;
        }
        return [...prev, taskId];
      });
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 当 completedTasks 变化时，持久化到 localStorage
  useEffect(() => {
    const progressKey = 'boarding_progress';
    const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
    
    // 重置所有任务的完成状态
    for (let i = 1; i <= 12; i++) {
      progress[`task${i}`] = {
        completed: completedTasks.includes(i),
        completedAt: progress[`task${i}`]?.completedAt || new Date().toISOString()
      };
    }
    
    localStorage.setItem(progressKey, JSON.stringify(progress));
    console.log('任务完成状态已持久化到 localStorage:', progress);
  }, [completedTasks]);

  // 组件加载时打印当前进度状态
  useEffect(() => {
    const progressKey = 'boarding_progress';
    const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
    console.log('任务列表加载，当前进度:', progress);
  }, []);

  // 扁平化所有任务用于计算
  const allTasks = pathData.flatMap(stage => stage.tasks)
  
  // 计算当前任务ID（第一个未完成的任务）
  const getCurrentTaskId = useCallback(() => {
    for (const task of allTasks) {
      if (!completedTasks.includes(task.id)) {
        return task.id
      }
    }
    return null
  }, [allTasks, completedTasks])

  const currentTaskId = getCurrentTaskId()
  
  // 找到当前任务所属的阶段
  const getCurrentStageId = useCallback(() => {
    if (!currentTaskId) return null
    for (const stage of pathData) {
      if (stage.tasks.some(task => task.id === currentTaskId)) {
        return stage.id
      }
    }
    return null
  }, [currentTaskId])

  const currentStageId = getCurrentStageId()

  // 自动展开当前阶段
  useEffect(() => {
    if (!expandedStage && currentStageId) {
      setExpandedStage(currentStageId)
    }
  }, [expandedStage, currentStageId])

  // 计算阶段的完成状态
  const getStageProgress = (stageId) => {
    const stage = pathData.find(s => s.id === stageId)
    if (!stage) return { done: 0, total: 0, allDone: false }
    
    const done = stage.tasks.filter(task => completedTasks.includes(task.id)).length
    const total = stage.tasks.length
    const allDone = done === total
    
    return { done, total, allDone }
  }

  // 检查阶段是否已解锁
  const isStageUnlocked = (stageId) => {
    if (stageId === 1) return true
    
    // 前一阶段是否全部完成
    const previousStage = pathData.find(s => s.id === stageId - 1)
    if (!previousStage) return false
    
    return previousStage.tasks.every(task => completedTasks.includes(task.id))
  }

  // 检查任务状态
  const getTaskStatus = (taskId) => {
    if (completedTasks.includes(taskId)) return TASK_STATUS.COMPLETED
    if (reviewingTasks.includes(taskId)) return TASK_STATUS.REVIEWING
    if (rejectedTasks.includes(taskId)) return TASK_STATUS.REJECTED
    if (taskId === currentTaskId) return TASK_STATUS.CURRENT
    
    // 检查任务是否在当前任务之前
    const taskIndex = allTasks.findIndex(task => task.id === taskId)
    const currentTaskIndex = allTasks.findIndex(task => task.id === currentTaskId)
    
    if (taskIndex < currentTaskIndex) return TASK_STATUS.IN_PROGRESS
    return TASK_STATUS.LOCKED
  }

  // 切换阶段展开/收缩
  const toggleStage = (stageId) => {
    if (!isStageUnlocked(stageId)) return
    setExpandedStage(expandedStage === stageId ? null : stageId)
  }

  // 处理任务点击
  const handleTaskClick = (task) => {
    const status = getTaskStatus(task.id)
    
    // 定义任务路由映射
    const taskRoutes = {
      1: '/assessment', // 五维测评
      2: '/tasks/Task2', // 选择目标岗位
      3: '/tasks/Task3', // 确定申请路线
      4: '/tasks/phase2/Task4', // 制作英文简历
      5: '/tasks/job-course', // 学习岗位知识
      6: '/tasks/interview-skills', // 面试技巧学习
      7: '/tasks/interview-practice', // 面试问题演练
      8: '/tasks/phase2/Task8', // AI模拟面试
      9: '/my-offer', // 我的Offer
      10: '/tasks/certificates', // 考取证件
      11: '/tasks/luggage', // 准备行李
      12: '/tasks/boarding' // 登船准备
    }
    
    // 获取当前任务的路由
    const targetRoute = taskRoutes[task.id] || task.route
    
    switch(status) {
      case TASK_STATUS.COMPLETED:
        // 所有已完成任务都只弹出提示，不跳转
        alert('该任务已完成 ✅')
        break
        
      case TASK_STATUS.CURRENT:
      case TASK_STATUS.IN_PROGRESS:
      case TASK_STATUS.REVIEWING:
      case TASK_STATUS.REJECTED:
        // 进行中任务，跳转到对应页面
        if (targetRoute) {
          navigate(targetRoute)
        } else {
          alert('该任务页面暂未开发')
        }
        break
        
      case TASK_STATUS.LOCKED:
      default:
        // 未解锁任务，提示
        alert('请先完成前置任务')
        break
    }
  }

  // 计算总进度
  const totalCompleted = completedTasks.length
  const totalTasks = allTasks.length
  const progressPercentage = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部头部区域 */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 pt-16 pb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-white text-xl font-bold">登船路径</h1>
            <p className="text-white/80 text-sm mt-1">完成12个任务，开启你的海乘之旅</p>
          </div>
          <div className="bg-white/20 rounded-full px-3 py-1.5">
            <span className="text-white text-sm font-medium">{totalCompleted}/{totalTasks} 已完成</span>
          </div>
        </div>
        
        {/* 总进度条 */}
        <div className="mt-4">
          <div className="flex justify-between text-white/60 text-xs mb-1">
            <span>总进度</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="h-2 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 阶段列表 */}
      <div className="px-6 py-4 space-y-4">
        {pathData.map((stage, stageIndex) => {
          const { done, total, allDone } = getStageProgress(stage.id)
          const isUnlocked = isStageUnlocked(stage.id)
          const isCurrentStage = stage.id === currentStageId
          const isExpanded = expandedStage === stage.id
          
          return (
            <div key={stage.id} className="relative">
              {/* 阶段卡片 */}
              <div 
                className={`
                  rounded-xl border ${isUnlocked ? 'border-gray-200' : 'border-gray-100'}
                  ${isUnlocked ? 'bg-white' : 'bg-gray-50'}
                  ${isCurrentStage ? 'border-l-4 border-purple-500' : ''}
                  transition-all duration-300
                `}
              >
                {/* 阶段头部 */}
                <div 
                  className={`
                    flex items-center justify-between p-4 cursor-pointer
                    ${isUnlocked ? 'hover:bg-gray-50' : 'opacity-60 cursor-not-allowed'}
                  `}
                  onClick={() => toggleStage(stage.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${allDone ? 'bg-green-100' : isUnlocked ? 'bg-purple-100' : 'bg-gray-100'}
                    `}>
                      {allDone ? (
                        <CheckCircle size={20} className="text-green-500" />
                      ) : (
                        <span className="text-lg">{stage.icon}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className={`font-bold ${isUnlocked ? 'text-gray-800' : 'text-gray-400'}`}>
                          {stage.name}
                        </h2>
                        {!isUnlocked && (
                          <Lock size={14} className="text-gray-400" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {done}/{total} 已完成
                      </p>
                    </div>
                  </div>
                  {isUnlocked && (
                    isExpanded ? (
                      <ChevronUp size={20} className="text-gray-500" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-500" />
                    )
                  )}
                </div>
                
                {/* 任务列表 */}
                {isExpanded && isUnlocked && (
                  <div className="px-4 pb-4 pl-14 relative">
                    {/* 时间线 */}
                    <div className="absolute left-9 top-0 bottom-0 w-0.5 bg-gray-200" />
                    
                    {stage.tasks.map((task, taskIndex) => {
                      const status = getTaskStatus(task.id)
                      const isLastTask = taskIndex === stage.tasks.length - 1
                      
                      return (
                        <div key={task.id} className="relative mb-4 last:mb-0">
                          {/* 时间线节点 */}
                          <div className="absolute left-[-24px] top-2 w-4 h-4 rounded-full z-10">
                            {status === TASK_STATUS.LOCKED && (
                              <div className="w-4 h-4 rounded-full bg-gray-200" />
                            )}
                            {status === TASK_STATUS.CURRENT && (
                              <div className="w-4 h-4 rounded-full bg-purple-500 animate-pulse" />
                            )}
                            {status === TASK_STATUS.IN_PROGRESS && (
                              <div className="w-4 h-4 rounded-full bg-purple-500" />
                            )}
                            {status === TASK_STATUS.REVIEWING && (
                              <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center">
                                <Clock size={12} className="text-white" />
                              </div>
                            )}
                            {status === TASK_STATUS.REJECTED && (
                              <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                                <AlertCircle size={12} className="text-white" />
                              </div>
                            )}
                            {status === TASK_STATUS.COMPLETED && (
                              <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                                <CheckCircle size={12} className="text-white" />
                              </div>
                            )}
                          </div>
                          
                          {/* 任务行 */}
                          <div 
                            className={`
                              rounded-lg p-3 flex items-center justify-between
                              ${status === TASK_STATUS.LOCKED ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}
                            `}
                            onClick={() => handleTaskClick(task)}
                          >
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium ${status === TASK_STATUS.LOCKED ? 'text-gray-400' : 'text-gray-800'}`}>
                                {task.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {task.subtitle}
                              </p>
                            </div>
                            
                            {/* 右侧按钮或标签 */}
                            <div className="ml-3">
                              {status === TASK_STATUS.LOCKED && null}
                              {status === TASK_STATUS.CURRENT && (
                                <button className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                  开始
                                </button>
                              )}
                              {status === TASK_STATUS.IN_PROGRESS && (
                                <button className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                  继续
                                </button>
                              )}
                              {status === TASK_STATUS.REVIEWING && (
                                <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                                  审核中
                                </span>
                              )}
                              {status === TASK_STATUS.REJECTED && (
                                <button className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                                  重新提交
                                </button>
                              )}
                              {status === TASK_STATUS.COMPLETED && (
                                <div className="flex items-center gap-1">
                                  <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                    已完成
                                  </span>
                                  <ArrowRight size={16} className="text-gray-400" />
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* 时间线连接 */}
                          {!isLastTask && (
                            <div className={`
                              absolute left-[-22px] top-6 bottom-[-16px] w-0.5
                              ${status === TASK_STATUS.COMPLETED ? 'bg-green-500' : 
                                (status === TASK_STATUS.CURRENT || status === TASK_STATUS.IN_PROGRESS) ? 'bg-purple-500' : 'bg-gray-200'}
                            `} />
                          )}
                        </div>
                      )}
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
