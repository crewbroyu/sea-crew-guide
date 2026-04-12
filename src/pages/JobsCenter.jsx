// src/pages/JobsCenter.jsx
import { useNavigate } from 'react-router-dom'
import { BookOpen, Users, Briefcase, Target, FileText, MessageSquare } from 'lucide-react'

export default function JobsCenter() {
  const navigate = useNavigate()

  const sections = [
    {
      id: 'preparation',
      icon: Target,
      title: '求职准备',
      description: '选择岗位、制作简历、准备面试，全面准备求职',
      color: 'bg-blue-500',
      to: '/jobs/preparation'
    },
    {
      id: 'channels',
      icon: Users,
      title: '招聘渠道',
      description: '邮轮公司官网、招聘平台、最新动态等多种渠道',
      color: 'bg-green-500',
      to: '/jobs/channels'
    },
    {
      id: 'applications',
      icon: Briefcase,
      title: '我的申请',
      description: '跟踪投递进度，管理申请记录',
      color: 'bg-purple-500',
      to: '/jobs/applications'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部头部 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 pt-16 pb-6">
        <h1 className="text-white text-2xl font-bold">求职中心</h1>
        <p className="text-white/80 text-sm mt-2">
          一站式海乘求职解决方案
        </p>
      </div>

      <div className="px-6 py-6 space-y-4">
        {/* 板块入口 */}
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <button
              key={section.id}
              onClick={() => navigate(section.to)}
              className="w-full bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 active:scale-[0.98] transition"
            >
              <div className={`w-14 h-14 ${section.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon size={28} className="text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-gray-800 text-lg">{section.title}</h3>
                <p className="text-gray-500 text-sm mt-1">{section.description}</p>
              </div>
            </button>
          )
        })}

        {/* 提示信息 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <div className="flex items-start gap-2">
            <BookOpen size={18} className="text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800 mb-1">求职建议</h3>
              <p className="text-blue-700 text-sm">
                建议先完成「求职准备」板块的内容，再去「招聘渠道」投递简历，最后在「我的申请」中跟踪进度。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
