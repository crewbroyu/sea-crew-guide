import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronRight } from 'lucide-react'

const feedbacks = [
  '这一部分已经完成，继续进入下一项评估。',
  '你的回答会用于生成最终岗位建议。',
  '继续保持真实选择，结果会更有参考价值。',
  '还剩几个维度，完成后会生成完整报告。',
]

export default function DimensionTransition({
  dimension,
  completedDimensions,
  totalDimensions,
  onContinue,
}) {
  const [isAnimationComplete, setIsAnimationComplete] = useState(false)
  const feedback = useMemo(
    () => feedbacks[(completedDimensions - 1) % feedbacks.length],
    [completedDimensions]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimationComplete(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-8">
          <div className={`w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto ${isAnimationComplete ? 'scale-110' : 'scale-100'} transition-transform duration-500`}>
            <Check size={48} className="text-blue-600" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {dimension.name}已完成
        </h2>
        <p className="text-gray-600 mb-6">{feedback}</p>

        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-8">
          <p className="text-gray-700">
            {completedDimensions}/{totalDimensions} 个维度已完成
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${(completedDimensions / totalDimensions) * 100}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="w-full py-4 rounded-lg bg-blue-600 text-white font-medium text-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
        >
          继续下一维度
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}
