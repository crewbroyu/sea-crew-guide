// src/components/assessment/WelcomePage.jsx
import { BookOpen, Languages, MessageSquare, Heart, Zap, ChevronRight } from 'lucide-react'
import { DIMENSIONS } from '../../data/assessmentData'

export default function WelcomePage({ onStart }) {
  // 渲染维度图标
  const renderDimensionIcon = (iconName) => {
    const icons = {
      BookOpen: <BookOpen size={20} />,
      Languages: <Languages size={20} />,
      MessageSquare: <MessageSquare size={20} />,
      Heart: <Heart size={20} />,
      Zap: <Zap size={20} />,
    }
    return icons[iconName] || <BookOpen size={20} />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部背景 */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 px-6 pt-16 pb-10">
        <div className="text-center">
          <h1 className="text-white text-3xl font-bold mb-2">海乘求职五维测评</h1>
          <p className="text-white/80 text-lg">5-8分钟，全面了解你的上船准备度</p>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="flex-1 px-6 py-8">
        {/* 五个维度预览 */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">测评维度</h2>
          <div className="grid grid-cols-5 gap-4">
            {DIMENSIONS.map((dimension, index) => (
              <div key={dimension.id} className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 mb-2">
                  {renderDimensionIcon(dimension.icon)}
                </div>
                <p className="text-xs text-gray-600 text-center">{dimension.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 提示信息 */}
        <div className="bg-gray-100 rounded-lg p-5 mb-8">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-1">测评提示</h3>
              <p className="text-gray-600 text-sm">
                没有标准答案，选最接近你真实情况的选项就好。
                测评结果将帮助你了解自己的优势和需要提升的方向。
              </p>
            </div>
          </div>
        </div>

        {/* 开始测评按钮 */}
        <button
          onClick={onStart}
          className="w-full py-4 rounded-lg bg-green-600 text-white font-medium text-lg flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
        >
          开始测评
          <ChevronRight size={20} />
        </button>

        {/* 底部说明 */}
        <p className="text-center text-gray-500 text-sm mt-6">
          测评结果仅作为参考，不影响实际求职
        </p>
      </div>
    </div>
  )
}
