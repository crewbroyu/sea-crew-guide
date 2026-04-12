// src/pages/academy/PositionEnglish.jsx
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PositionEnglish() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center">
        <button 
          onClick={() => navigate('/academy')}
          className="mr-4"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-lg font-medium text-gray-800">岗位英语课程</h1>
      </div>

      {/* 主要内容 */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center py-12">
            <h2 className="text-xl font-bold text-gray-800 mb-4">功能即将上线</h2>
            <p className="text-gray-600">功能即将上线，敬请期待 🚀</p>
          </div>
        </div>
      </div>
    </div>
  )
}