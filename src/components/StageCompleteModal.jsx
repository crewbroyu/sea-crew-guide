import { motion, AnimatePresence } from 'framer-motion'
import pathData from '../data/pathData'

const StageCompleteModal = ({ isOpen, onClose, stageId, totalXP }) => {
  const stage = pathData.find(s => s.id === stageId)
  const isLastStage = stageId === pathData.length
  const nextStage = pathData.find(s => s.id === stageId + 1)

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
            {/* 阶段 emoji 动画 */}
            <div className="flex justify-center mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200 }}
              >
                <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-4xl">{stage?.icon}</span>
                </div>
              </motion.div>
            </div>

            {/* 标题和副标题 */}
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">恭喜！阶段通关！</h2>
            <p className="text-gray-500 text-center mb-6">「{stage?.name}」阶段已完成</p>

            {/* 总 XP */}
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.2 }}
                className="bg-yellow-100 rounded-full px-6 py-3"
              >
                <span className="text-xl font-bold text-yellow-700">+{totalXP} XP</span>
              </motion.div>
            </div>

            {/* 下一阶段预告或特殊文案 */}
            <div className="text-center mb-8">
              {isLastStage ? (
                <motion.p 
                  className="text-lg font-medium text-purple-700"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  你已经准备好出发了！🎉
                </motion.p>
              ) : (
                <motion.p 
                  className="text-gray-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  即将开启：{nextStage?.name}
                </motion.p>
              )}
            </div>

            {/* 底部按钮 */}
            <button
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-medium rounded-full hover:opacity-90 transition-opacity"
            >
              {isLastStage ? '查看成就' : '开启下一阶段'}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default StageCompleteModal
