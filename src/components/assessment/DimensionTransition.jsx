// src/components/assessment/DimensionTransition.jsx
import { useState, useEffect } from 'react'
import { ChevronRight } from 'lucide-react'

export default function DimensionTransition({ dimension, completedDimensions, totalDimensions, onContinue }) {
  const [isAnimationComplete, setIsAnimationComplete] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimationComplete(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // 随机正向反馈语
  const feedbacks = [
    '做得不错，继续保持！',
    '很好，你的回答很有想法！',
    '已完成大半，加油！',
    '很棒，继续努力！',
    '非常好，你已经掌握了关键要点！'
  ]

  const randomFeedback = feedbacks[Math.floor(Math.random() * feedbacks.length)]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="max-w-md mx-auto text-center">
        {/* 动画区域 */}
        <div className="mb-8">
          <div className={`w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto ${isAnimationComplete ? 'scale-110' : 'scale-100'} transition-transform duration-500`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        </div>

        {/* 完成信息 */}
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          ✓ {dimension.name} 已完成！
        </h2>
        <p className="text-gray-600 mb-6">{randomFeedback}</p>

        {/* 进度信息 */}
        <div className="bg-gray-100 rounded-lg p-4 mb-8">
          <p className="text-gray-700">
            {completedDimensions}/{totalDimensions} 维度已完成
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-green-600 h-2 rounded-full"
              style={{ width: `${(completedDimensions / totalDimensions) * 100}%` }}
            />
          </div>
        </div>

        {/* 继续按钮 */}
        <button
          onClick={onContinue}
          className="w-full py-4 rounded-lg bg-green-600 text-white font-medium text-lg flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
        >
          继续下一维度
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}
