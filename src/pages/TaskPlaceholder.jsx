import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import TaskCompleteModal from '../components/TaskCompleteModal'
import StageCompleteModal from '../components/StageCompleteModal'
import pathData from '../data/pathData'

export default function TaskPlaceholder() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // 状态管理
  const [isTaskCompleteModalOpen, setIsTaskCompleteModalOpen] = useState(false)
  const [isStageCompleteModalOpen, setIsStageCompleteModalOpen] = useState(false)
  const [completedTaskName, setCompletedTaskName] = useState('')
  const [completedStageId, setCompletedStageId] = useState(null)

  // 从路径中提取任务名称
  const getTaskName = () => {
    const path = location.pathname
    const taskSlug = path.split('/').pop()
    // 简单的任务名称映射
    const taskNames = {
      assessment: '海乘适配评估',
      'choose-job': '选择目标岗位',
      'choose-route': '确定申请路线',
      resume: '制作英文简历',
      'job-course': '学习岗位知识',
      'interview-skills': '面试技巧学习',
      'interview-practice': '面试训练中心',
      'ai-interview': '真实面试跟进',
      'my-offer': '我的Offer',
      certificates: '考取证件',
      luggage: '准备行李',
      boarding: '登船准备'
    }
    return taskNames[taskSlug] || '任务'
  }

  // 从路径中提取任务ID
  const getTaskId = () => {
    const path = location.pathname
    const taskSlug = path.split('/').pop()
    // 任务ID映射
    const taskIds = {
      assessment: 1,
      'choose-job': 2,
      'choose-route': 3,
      resume: 4,
      'job-course': 5,
      'interview-skills': 6,
      'interview-practice': 7,
      'ai-interview': 8,
      'my-offer': 9,
      certificates: 10,
      luggage: 11,
      boarding: 12
    }
    return taskIds[taskSlug] || null
  }

  // 检查任务是否是阶段的最后一个任务
  const isLastTaskInStage = (taskId) => {
    for (const stage of pathData) {
      const taskIds = stage.tasks.map(t => t.id)
      if (taskIds.includes(taskId)) {
        return taskId === Math.max(...taskIds)
      }
    }
    return false
  }

  // 找到任务所属的阶段
  const getTaskStage = (taskId) => {
    for (const stage of pathData) {
      if (stage.tasks.some(t => t.id === taskId)) {
        return stage.id
      }
    }
    return null
  }

  // 模拟完成任务
  const handleCompleteTask = () => {
    const taskName = getTaskName()
    const taskId = getTaskId()
    const stageId = getTaskStage(taskId)
    
    setCompletedTaskName(taskName)
    setCompletedStageId(stageId)
    setIsTaskCompleteModalOpen(true)
  }

  // 关闭任务完成弹窗
  const handleTaskCompleteModalClose = () => {
    setIsTaskCompleteModalOpen(false)
    
    // 如果是阶段的最后一个任务，显示阶段通关弹窗
    const taskId = getTaskId()
    if (isLastTaskInStage(taskId)) {
      setTimeout(() => {
        setIsStageCompleteModalOpen(true)
      }, 300)
    } else {
      // 否则直接跳转回任务列表页
      navigate(`/tasks?justCompleted=${getTaskId()}`)
    }
  }

  // 关闭阶段通关弹窗
  const handleStageCompleteModalClose = () => {
    setIsStageCompleteModalOpen(false)
    // 跳转回任务列表页
    navigate(`/tasks?justCompleted=${getTaskId()}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部头部 */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 pt-16 pb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/tasks')}
            className="p-1.5 rounded-full bg-white/20 text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-white text-xl font-bold">{getTaskName()}</h1>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex flex-col items-center justify-center mt-20 px-6">
        <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">🚧</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">该功能正在开发中</h2>
        <p className="text-gray-500 text-center mb-8">
          我们正在努力开发这个功能，敬请期待！
        </p>

        {/* 模拟完成任务按钮 */}
        <button
          onClick={handleCompleteTask}
          className="px-6 py-3 bg-purple-600 text-white font-medium rounded-full hover:bg-purple-700 transition-colors duration-300"
        >
          模拟完成任务
        </button>
      </div>

      {/* 任务完成弹窗 */}
      <TaskCompleteModal
        isOpen={isTaskCompleteModalOpen}
        onClose={handleTaskCompleteModalClose}
        taskName={completedTaskName}
        totalTasksCompleted={6} // 暂时固定，后续从全局状态获取
      />

      {/* 阶段通关弹窗 */}
      <StageCompleteModal
        isOpen={isStageCompleteModalOpen}
        onClose={handleStageCompleteModalClose}
        stageId={completedStageId}
        totalXP={90} // 暂时固定，后续计算
      />
    </div>
  )
}
