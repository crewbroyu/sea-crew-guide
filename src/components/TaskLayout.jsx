import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import TaskCompleteModal from './TaskCompleteModal'
import StageCompleteModal from './StageCompleteModal'
import pathData from '../data/pathData'

const TaskLayout = ({ taskId, taskTitle, canComplete, children }) => {
  const navigate = useNavigate()
  const [isTaskCompleteModalOpen, setIsTaskCompleteModalOpen] = useState(false)
  const [isStageCompleteModalOpen, setIsStageCompleteModalOpen] = useState(false)

  // 检查任务是否是阶段的最后一个任务
  const isLastTaskInStage = () => {
    for (const stage of pathData) {
      const taskIds = stage.tasks.map(t => t.id)
      if (taskIds.includes(taskId)) {
        return taskId === Math.max(...taskIds)
      }
    }
    return false
  }

  // 找到任务所属的阶段
  const getTaskStage = () => {
    for (const stage of pathData) {
      if (stage.tasks.some(t => t.id === taskId)) {
        return stage.id
      }
    }
    return null
  }

  // 处理完成任务按钮点击
  const handleCompleteTask = () => {
    if (!canComplete) return
    setIsTaskCompleteModalOpen(true)
  }

  // 关闭任务完成弹窗
  const handleTaskCompleteModalClose = () => {
    setIsTaskCompleteModalOpen(false)
    
    // 如果是阶段的最后一个任务，显示阶段通关弹窗
    if (isLastTaskInStage()) {
      setTimeout(() => {
        setIsStageCompleteModalOpen(true)
      }, 300)
    } else {
      // 否则直接跳转回任务列表页
      navigate(`/tasks?justCompleted=${taskId}`)
    }
  }

  // 关闭阶段通关弹窗
  const handleStageCompleteModalClose = () => {
    setIsStageCompleteModalOpen(false)
    // 跳转回任务列表页
    navigate(`/tasks?justCompleted=${taskId}`)
  }

  // 计算任务序号
  const getTaskNumber = () => {
    let count = 0
    for (const stage of pathData) {
      for (const task of stage.tasks) {
        count++
        if (task.id === taskId) {
          return count
        }
      }
    }
    return 1
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 pt-16 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/tasks')}
              className="p-1.5 rounded-full bg-white/20 text-white"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="text-white text-xl font-bold">{taskTitle}</h1>
          </div>
          <div className="bg-white/20 rounded-full px-3 py-1.5">
            <span className="text-white text-sm font-medium">任务 {getTaskNumber()}/12</span>
          </div>
        </div>
      </div>

      {/* 中间内容区域 */}
      <div className="px-6 py-6">
        {children}
      </div>

      {/* 底部固定栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <button
          onClick={handleCompleteTask}
          disabled={!canComplete}
          className={`w-full py-3 rounded-full font-medium transition-all duration-300 ${
            canComplete 
              ? 'bg-gradient-to-r from-indigo-600 to-purple-700 text-white hover:opacity-90' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          完成任务
        </button>
      </div>

      {/* 任务完成弹窗 */}
      <TaskCompleteModal
        isOpen={isTaskCompleteModalOpen}
        onClose={handleTaskCompleteModalClose}
        taskName={taskTitle}
        totalTasksCompleted={getTaskNumber()}
      />

      {/* 阶段通关弹窗 */}
      {isLastTaskInStage() && (
        <StageCompleteModal
          isOpen={isStageCompleteModalOpen}
          onClose={handleStageCompleteModalClose}
          stageId={getTaskStage()}
          totalXP={90} // 暂时固定，后续计算
        />
      )}
    </div>
  )
}

export default TaskLayout
