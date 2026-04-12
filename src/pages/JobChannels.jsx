// src/pages/JobChannels.jsx
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Globe, Users, Newspaper, User, ArrowRight, Search, Zap, Sparkles, Star } from 'lucide-react'

export default function JobChannels() {
  const navigate = useNavigate()

  const channels = [
    {
      id: 'cruise-companies',
      icon: Globe,
      title: '邮轮公司官网合辑',
      description: '多家邮轮公司职位，支持多维度筛选',
      color: 'bg-blue-500',
      to: '/jobs/channels/cruise-companies',
      tag: '核心功能',
      tagColor: 'bg-blue-100 text-blue-700'
    },
    {
      id: 'job-platforms',
      icon: Users,
      title: '海乘招聘平台',
      description: '专业海乘招聘平台，岗位多更新快',
      color: 'bg-green-500',
      to: '/jobs/channels/platforms',
      tag: '',
      tagColor: ''
    },
    {
      id: 'latest-news',
      icon: Newspaper,
      title: '最新招聘动态',
      description: '实时跟踪各大邮轮公司招聘信息',
      color: 'bg-purple-500',
      to: '/jobs/channels/news',
      tag: '',
      tagColor: ''
    },
    {
      id: 'yuge-referral',
      icon: User,
      title: '宇哥内推',
      description: '一对一求职指导，内推渠道直达',
      color: 'bg-amber-500',
      to: '/jobs/channels/yuge',
      tag: '',
      tagColor: ''
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部头部 */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 px-6 pt-16 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/jobs')}
            className="text-white hover:text-green-200"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-white text-2xl font-bold">招聘渠道</h1>
        </div>
        <p className="text-white/80 text-sm mt-2">
          多种渠道，帮你找到心仪的岗位
        </p>
      </div>

      <div className="px-6 py-6 space-y-4">
        {/* 渠道列表 */}
        {channels.map((channel) => {
          const Icon = channel.icon
          return (
            <button
              key={channel.id}
              onClick={() => navigate(channel.to)}
              className="w-full bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 active:scale-[0.98] transition"
            >
              <div className={`w-14 h-14 ${channel.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon size={28} className="text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-800 text-lg">{channel.title}</h3>
                  {channel.tag && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${channel.tagColor}`}>
                      {channel.tag}
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-sm mt-1">{channel.description}</p>
              </div>
              <ArrowRight size={20} className="text-gray-400" />
            </button>
          )
        })}

        {/* 提示信息 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
          <div className="flex items-start gap-2">
            <Search size={18} className="text-green-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-green-800 mb-1">渠道说明</h3>
              <p className="text-green-700 text-sm">
                建议优先使用「邮轮公司官网合辑」查找职位，这是最直接的申请渠道。
              </p>
            </div>
          </div>
        </div>

        {/* 特色标签 */}
        <div className="flex flex-wrap gap-2 mt-4">
          <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 rounded-full">
            <Zap size={14} className="text-blue-600" />
            <span className="text-blue-700 text-xs font-medium">直接申请</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1.5 bg-green-50 rounded-full">
            <Sparkles size={14} className="text-green-600" />
            <span className="text-green-700 text-xs font-medium">实时更新</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 rounded-full">
            <Star size={14} className="text-purple-600" />
            <span className="text-purple-700 text-xs font-medium">内推渠道</span>
          </div>
        </div>
      </div>
    </div>
  )
}
