import { useNavigate } from 'react-router-dom'
import { createElement } from 'react'
import { BookOpen, Mic2, FileText, Ship, ArrowRight, Clock, MessageSquare } from 'lucide-react'

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
            {/* 每日英语打卡入口 */}
            <button
              onClick={() => navigate('/academy/checkin')}
              className="w-full bg-white rounded-xl p-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Mic2 size={24} className="text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">每日英语打卡</p>
                  <p className="text-xs text-gray-500">坚持跟读，提升口语</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-gray-400" />
            </button>

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
              onClick={() => navigate('/tasks/phase2/Task8')}
              className="w-full bg-white rounded-xl p-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <MessageSquare size={24} className="text-purple-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">常见面试问题</p>
                  <p className="text-xs text-gray-500">三大岗位25道高频面试题，录音模拟练习</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-gray-400" />
            </button>

            {/* AI 模拟面试 */}
            <button
              onClick={() => navigate('/tasks/phase2/Task8')}
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

            {/* 情景对话练习 */}
            <div className="w-full bg-white rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  <FileText size={24} className="text-gray-400" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">情景对话练习</p>
                  <p className="text-xs text-gray-500">模拟船上工作场景对话</p>
                </div>
              </div>
              <div className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                即将开放
              </div>
            </div>
          </div>
        </div>

        {/* 板块四：登船准备 */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-6 bg-green-500 rounded-full"></div>
            <h2 className="text-lg font-bold text-gray-800">登船准备</h2>
          </div>
          <div className="space-y-3">
            {/* 登船手续入口 */}
            <button
              onClick={() => navigate('/academy/boarding')}
              className="w-full bg-white rounded-xl p-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Ship size={24} className="text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">登船手续</p>
                  <p className="text-xs text-gray-500">海员证、体检、签证等办理指南</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* 板块五：能力测评 */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
            <h2 className="text-lg font-bold text-gray-800">能力测评</h2>
          </div>
          <div className="space-y-3">
            {/* 五维测评入口 */}
            <button
              onClick={() => navigate('/assessment')}
              className="w-full bg-white rounded-xl p-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <MessageSquare size={24} className="text-indigo-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-800">五维测评</p>
                  <p className="text-xs text-gray-500">全面评估你的海乘适配度</p>
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