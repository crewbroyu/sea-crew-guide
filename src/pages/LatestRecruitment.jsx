// src/pages/LatestRecruitment.jsx
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Newspaper, Calendar, Users, Briefcase, ArrowRight } from 'lucide-react'

const newsItems = [
  {
    id: 1,
    source: '海乘求职助手',
    title: 'Royal Caribbean 2025年春季招聘开启',
    publishTime: '2025-04-10',
    companies: ['Royal Caribbean'],
    categories: ['酒吧服务', '餐饮服务'],
    summary: '皇家加勒比邮轮2025年春季大规模招聘正式启动，开放多个岗位。',
    content: '详细内容整理中……'
  },
  {
    id: 2,
    source: '邮轮招聘网',
    title: 'MSC Cruises 中国区专场招聘',
    publishTime: '2025-04-08',
    companies: ['MSC Cruises'],
    categories: ['前台/宾客服务', '客房服务'],
    summary: 'MSC邮轮针对中国籍船员的专场招聘，要求具备中英文双语能力。',
    content: '详细内容整理中……'
  },
  {
    id: 3,
    source: '海乘百科',
    title: 'Disney Cruise Line 暑期岗位急招',
    publishTime: '2025-04-05',
    companies: ['Disney Cruise Line'],
    categories: ['娱乐表演', '餐饮服务'],
    summary: '迪士尼邮轮暑期旺季急招娱乐表演人员和餐饮服务人员。',
    content: '详细内容整理中……'
  },
  {
    id: 4,
    source: '宇哥海乘',
    title: 'Norwegian Cruise Line 管理岗招聘',
    publishTime: '2025-04-03',
    companies: ['Norwegian Cruise Line'],
    categories: ['管理岗位'],
    summary: '诺唯真邮轮开放多个管理岗位，要求有相关工作经验。',
    content: '详细内容整理中……'
  },
  {
    id: 5,
    source: '邮轮招聘信息',
    title: 'Celebrity Cruises 水疗健身岗位招聘',
    publishTime: '2025-04-01',
    companies: ['Celebrity Cruises'],
    categories: ['水疗/健身'],
    summary: '精致邮轮招聘水疗师、健身教练等岗位，提供专业培训。',
    content: '详细内容整理中……'
  },
  {
    id: 6,
    source: '海乘求职圈',
    title: '多家邮轮公司免税店岗位联合招聘',
    publishTime: '2025-03-28',
    companies: ['Princess Cruises', 'Viking Cruises'],
    categories: ['免税店/零售'],
    summary: '公主邮轮、维京邮轮等多家公司联合招聘免税店销售岗位。',
    content: '详细内容整理中……'
  }
]

export default function LatestRecruitment() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 pt-16 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/jobs/channels')}
            className="text-white hover:text-purple-200"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-white text-2xl font-bold">最新招聘动态</h1>
        </div>
        <p className="text-white/80 text-sm mt-2">
          实时跟踪各大邮轮公司招聘信息
        </p>
      </div>

      <div className="px-6 py-6 space-y-4">
        {newsItems.map((item) => (
        <button
          key={item.id}
          className="w-full bg-white rounded-xl shadow-sm p-5 text-left active:scale-[0.98] transition"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Newspaper size={14} />
                  {item.source}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar size={14} />
                  {item.publishTime}
                </span>
              </div>
              <h3 className="font-bold text-gray-800 text-lg mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm mb-3">{item.summary}</p>
              <div className="flex flex-wrap gap-2">
                {item.companies.map((company, index) => (
                  <span key={index} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full flex items-center gap-1">
                    <Users size={12} />
                    {company}
                  </span>
                ))}
                {item.categories.map((category, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
                    <Briefcase size={12} />
                    {category}
                  </span>
                ))}
              </div>
            </div>
            <ArrowRight size={20} className="text-gray-400 flex-shrink-0" />
          </div>
        </button>
      ))}
      </div>
    </div>
  )
}
