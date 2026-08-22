import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import TaskCompleteModal from './TaskCompleteModal'
import StageCompleteModal from './StageCompleteModal'
import pathData from '../data/pathData'

const TaskLayout = ({ taskId, taskTitle, canComplete, children }) => {
  const navigate = useNavigate()
  const [isTaskCompleteModalOpen, setIsTaskCompleteModalOpen] = useState(false)
  const [isStageCompleteModalOpen, setIsStageCompleteModalOpen] = useState(false)

  const getTaskMeta = () => {
    let taskNumber = 0

    for (const stage of pathData) {
      const taskIds = stage.tasks.map(task => task.id)

      for (const task of stage.tasks) {
        taskNumber += 1

        if (task.id === taskId) {
          return {
            taskNumber,
            stage,
            isLastTaskInStage: taskId === Math.max(...taskIds),
          }
        }
      }
    }

    return {
      taskNumber: 1,
      stage: null,
      isLastTaskInStage: false,
    }
  }

  const taskMeta = getTaskMeta()

  const handleCompleteTask = () => {
    if (!canComplete) return
    setIsTaskCompleteModalOpen(true)
  }

  const handleTaskCompleteModalClose = () => {
    setIsTaskCompleteModalOpen(false)

    if (taskMeta.isLastTaskInStage) {
      setTimeout(() => {
        setIsStageCompleteModalOpen(true)
      }, 300)
      return
    }

    navigate(`/tasks?justCompleted=${taskId}`)
  }

  const handleStageCompleteModalClose = () => {
    setIsStageCompleteModalOpen(false)
    navigate(`/tasks?justCompleted=${taskId}`)
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-5 pb-5 pt-12">
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
          >
            <ArrowLeft size={16} />
            返回路线
          </button>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-blue-700">
                任务 {taskMeta.taskNumber}/12
                {taskMeta.stage?.name ? ` · ${taskMeta.stage.name}` : ''}
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">
                {taskTitle}
              </h1>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">
              {canComplete ? '已满足完成条件' : '完成当前步骤后可提交'}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-6">
        {children}
      </main>

      <footer className="fixed bottom-16 left-0 right-0 z-10 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={handleCompleteTask}
            disabled={!canComplete}
            className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${
              canComplete
                ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                : 'cursor-not-allowed bg-slate-200 text-slate-500'
            }`}
          >
            <CheckCircle2 size={18} />
            完成任务
          </button>
        </div>
      </footer>

      <TaskCompleteModal
        isOpen={isTaskCompleteModalOpen}
        onClose={handleTaskCompleteModalClose}
        taskName={taskTitle}
        totalTasksCompleted={taskMeta.taskNumber}
        taskId={taskId}
      />

      {taskMeta.isLastTaskInStage && (
        <StageCompleteModal
          isOpen={isStageCompleteModalOpen}
          onClose={handleStageCompleteModalClose}
          stageId={taskMeta.stage?.id}
          totalXP={90}
        />
      )}
    </div>
  )
}

export default TaskLayout
