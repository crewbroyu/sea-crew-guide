// src/components/assessment/BackgroundSelect.jsx
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SERVICE_BACKGROUNDS } from '../../data/assessmentData'

export default function BackgroundSelect({ onSelect }) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/jobs/preparation')}
            className="text-gray-600 hover:text-gray-800"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-800">选择服务背景</h1>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-md mx-auto">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">
            请选择你的服务行业背景
          </h2>

          <div className="space-y-4">
            {SERVICE_BACKGROUNDS.map((background) => (
              <button
                key={background.id}
                onClick={() => onSelect(background.id)}
                className="w-full py-4 px-5 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-green-300 hover:shadow-md transition-all flex items-center justify-between"
              >
                <span className="text-gray-800 font-medium">{background.label}</span>
                <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>

          <p className="text-center text-gray-500 text-sm mt-8">
            你的选择将影响第一维度的题目内容
          </p>
        </div>
      </div>
    </div>
  )
}
