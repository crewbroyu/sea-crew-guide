import { useNavigate } from 'react-router-dom'
import { createElement } from 'react'
import { BookOpen, Mic2, FileText, Ship, ArrowRight, Clock, MessageSquare, Video } from 'lucide-react'

export default function Academy() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 pt-12 pb-6">
        <h1 className="text-white text-lg font-bold">海乘学院</h1>
        <p className="text-purple-200 text-sm mt-1">系统学习，全面提升</p>
      </div>

      <div className="px-6 py-4 space-y-6">
        {/* 板块一：海乘百科 */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-6 bg-amber-500 rounded-full"></div>
            <h2 className="text-lg font-bold text-gray-800">海乘百科</h2>
          </div>
          <div className="space-y-3">
            {/* 海乘百科入口 */}
            <button
              onClick={() => navigate('/academy/wiki')}
              className="w-full bg-white rounded-xl p-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <BookOpen size={24} className="text-amber-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">海乘百科</p>
                  <p className="text-xs text-gray-500">入行认知、DIY上船、岗位选择等知识</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* 板块二：英语学习 */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
            <h2 className="text-lg font-bold text-gray-800">英语学习</h2>
          </div>
          <div className="space-y-3">
            {/* 岗位英语课程入口 */}
            <button
              onClick={() => navigate('/academy/position-english')}
              className="w-full bg-white rounded-xl p-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <BookOpen size={24} className="text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">岗位英语课程</p>
                  <p className="text-xs text-gray-500">按目标岗位系统学习专业英语</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-gray-400" />
            </button>

            {/* 听说训练入口 */}
            <button
              onClick={() => navigate('/academy/listening-speaking')}
              className="w-full bg-white rounded-xl p-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Mic2 size={24} className="text-indigo-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">听说训练</p>
                  <p className="text-xs text-gray-500">按场景分类的英语听说练习</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* 板块三：面试训练 */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
            <h2 className="text-lg font-bold text-gray-800">面试训练</h2>
          </div>
          <div className="space-y-3">
            {/* 常见面试问题入口 */}
            <button
              onClick={() => navigate('/academy/interview-questions')}
              className="w-full bg-white rounded-xl p-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <MessageSquare size={24} className="text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">常见面试问题</p>
                  <p className="text-xs text-gray-500">8大岗位25道高频面试题，录音模拟练习</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-gray-400" />
            </button>

            {/* 岗位场景训练入口 */}
            <button
              onClick={() => navigate('/academy/scenarios')}
              className="w-full bg-white rounded-xl p-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Video size={24} className="text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">岗位场景训练</p>
                  <p className="text-xs text-gray-500">10天沉浸式工作场景，听力口语训练</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-gray-400" />
            </button>

            {/* AI 模拟面试 */}
            <button
              onClick={() => navigate('/tasks/phase2/Task8', { state: { from: 'academy' } })}
              className="w-full bg-white rounded-xl p-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Mic2 size={24} className="text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">AI 模拟面试</p>
                  <p className="text-xs text-gray-500">7道题目，AI 评分，提升面试技巧</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* 板块四：登船准备 */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-6 bg-green-500 rounded-full"></div>
            <h2 className="text-lg font-bold text-gray-800">登船准备</h2>
          </div>
          <div className="space-y-3">
            {/* 海乘职业资质入口 */}
            <button
              onClick={() => navigate('/academy/boarding/detail', { state: { module: { id: 'seaman-qualification', title: '海乘职业资质', description: '包含海员证、海员体检、国际旅行体检、无犯罪记录证明' } } })}
              className="w-full bg-white rounded-xl p-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText size={24} className="text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">海乘职业资质</p>
                  <p className="text-xs text-gray-500">海员证、海员体检、国际旅行体检、无犯罪记录证明</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-gray-400" />
            </button>
            
            {/* 申请C1D签证入口 */}
            <button
              onClick={() => navigate('/academy/boarding/detail', { state: { module: { id: 'c1d-visa', title: '申请C1D签证', description: '包含预约面谈、材料准备、面签攻略、出签等待' } } })}
              className="w-full bg-white rounded-xl p-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Ship size={24} className="text-amber-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">申请C1D签证</p>
                  <p className="text-xs text-gray-500">预约面谈、材料准备、面签攻略、出签等待</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* 板块五：海乘生活 */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
            <h2 className="text-lg font-bold text-gray-800">海乘生活</h2>
          </div>
          <div className="space-y-3">
            {/* 海乘到港日常入口 */}
            <button
              onClick={() => navigate('/academy/port-daily')}
              className="w-full bg-white rounded-xl p-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">海乘到港日常</p>
                  <p className="text-xs text-gray-500">分享到港经历和图片</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-gray-400" />
            </button>
          </div>
        </div>


      </div>
    </div>
  )
}