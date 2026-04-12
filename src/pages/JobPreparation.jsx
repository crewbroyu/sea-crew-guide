// src/pages/JobPreparation.jsx
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Check, Briefcase, FileText, BookOpen, ClipboardList } from 'lucide-react'

export default function JobPreparation() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-green-600 to-green-800 px-6 pt-16 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/jobs')}
            className="text-white hover:text-green-200"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-white text-2xl font-bold">求职准备</h1>
        </div>
        <p className="text-white/80 text-sm mt-2">
          为你的海乘求职做好充分准备
        </p>
      </div>

      <div className="px-6 py-6 space-y-5">
        {/* 选择目标岗位 */}
        <div className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <Briefcase size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">选择目标岗位</h3>
              <p className="text-gray-600 text-sm mt-1">
                了解各岗位详情，找到最适合你的方向
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-gray-500">已选岗位：</span>
                <span className="text-sm font-medium text-gray-800">餐厅服务员</span>
                <Check size={16} className="text-green-500" />
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/tasks/Task2')}
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* 制作英文简历 */}
        <div className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">制作英文简历</h3>
              <p className="text-gray-600 text-sm mt-1">
                邮轮行业标准格式，支持AI一键生成
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm font-medium text-green-600">已完成</span>
                <Check size={16} className="text-green-500" />
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/tasks/phase2/Task4')}
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* 面试准备 */}
        <div className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
              <BookOpen size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">面试准备</h3>
              <p className="text-gray-600 text-sm mt-1">
                模拟面试练习，掌握高频面试问题
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/academy')}
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* 五维测评 */}
        <div className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center text-yellow-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">五维测评</h3>
              <p className="text-gray-600 text-sm mt-1">
                全面了解你的上船准备度，获取个性化提升建议
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/assessment')}
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* 登船材料清单 */}
        <div className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
              <ClipboardList size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">登船材料清单</h3>
              <p className="text-gray-600 text-sm mt-1">
                准备好所有必要材料，确保顺利登船
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/boarding-materials')}
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </div>
  )
}
