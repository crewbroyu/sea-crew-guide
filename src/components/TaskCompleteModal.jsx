import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Award, CheckCircle2 } from 'lucide-react'
import { recordTaskComplete } from '../store/scoreStore'

const TaskCompleteModal = ({ isOpen, onClose, taskName, totalTasksCompleted, taskId }) => {
  useEffect(() => {
    if (isOpen && taskId) {
      recordTaskComplete(taskId, taskName)
    }
  }, [isOpen, taskId, taskName])

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-5 backdrop-blur-sm"
          onClick={onClose}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CheckCircle2 size={26} />
            </div>

            <h2 className="text-xl font-semibold text-slate-950">任务已完成</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{taskName}</p>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-950">路线进度已更新</p>
                  <p className="mt-1 text-xs text-slate-500">
                    已完成 {totalTasksCompleted}/12 个申请任务
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-2 text-sm font-semibold text-amber-700 shadow-sm">
                  <Award size={15} />
                  +50
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              返回申请路线
            </button>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default TaskCompleteModal
