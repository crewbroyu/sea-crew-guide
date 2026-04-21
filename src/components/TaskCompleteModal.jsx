import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Award } from 'lucide-react'
import { recordTaskComplete } from '../store/scoreStore'

const TaskCompleteModal = ({ isOpen, onClose, taskName, totalTasksCompleted, taskId }) => {
  // 记录任务完成并获取积分奖励
  if (isOpen && taskId) {
    recordTaskComplete(taskId, taskName)
  }
  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div 
            className="bg-white rounded-3xl p-6 max-w-md w-full mx-4"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 绿色勾动画 */}
            <div className="flex justify-center mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle size={40} className="text-green-500" />
                </div>
              </motion.div>
            </div>

            {/* 标题和副标题 */}
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">任务完成！</h2>
            <p className="text-gray-500 text-center mb-6">{taskName}</p>

            {/* 奖励动画 */}
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.2 }}
                className="bg-yellow-100 rounded-full px-4 py-2 flex items-center gap-1"
              >
                <Award size={16} className="text-yellow-600" />
                <span className="text-lg font-bold text-yellow-700">+50 积分</span>
              </motion.div>
            </div>

            {/* 进度提示 */}
            <p className="text-gray-500 text-center mb-8">
              已完成 {totalTasksCompleted}/12 个任务
            </p>

            {/* 底部按钮 */}
            <button
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-medium rounded-full hover:opacity-90 transition-opacity"
            >
              继续前进
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default TaskCompleteModal
