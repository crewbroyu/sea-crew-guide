// src/pages/CruiseJobPlatforms.jsx
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ExternalLink } from 'lucide-react'

const platforms = [
  {
    id: 'castaway',
    name: 'Castaway',
    description: '海乘招聘专业平台',
    features: ['岗位最多', '更新快'],
    url: 'https://www.castaway.com'
  },
  {
    id: 'allcruisejobs',
    name: 'All Cruise Jobs',
    description: '全球邮轮招聘',
    features: ['国际平台', '职位全面'],
    url: 'https://www.allcruisejobs.com'
  },
  {
    id: 'cruisejobfinder',
    name: 'Cruise Job Finder',
    description: '专业海乘求职平台',
    features: ['精准匹配', '经验分享'],
    url: 'https://www.cruisejobfinder.com'
  },
  {
    id: 'cruiseshipjobs',
    name: 'CruiseShipJobs',
    description: '邮轮行业专业招聘网站',
    features: ['直接投递', '公司直招'],
    url: 'https://www.cruiseshipjobs.com'
  },
  {
    id: 'crewcareers',
    name: 'Crew Careers',
    description: '海员求职社区',
    features: ['社区交流', '内推机会'],
    url: 'https://www.crewcareers.com'
  }
]

export default function CruiseJobPlatforms() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-green-600 to-green-800 px-6 pt-16 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/jobs/channels')}
            className="text-white hover:text-green-200"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-white text-2xl font-bold">海乘招聘平台</h1>
        </div>
        <p className="text-white/80 text-sm mt-2">
          专业海乘招聘平台，岗位多更新快
        </p>
      </div>

      <div className="px-6 py-6 space-y-4">
        {platforms.map((platform) => (
          <div key={platform.id} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">{platform.name}</h3>
                <p className="text-gray-600 text-sm mt-1">{platform.description}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {platform.features.map((feature, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => window.open(platform.url, '_blank')}
              className="w-full mt-4 py-2.5 rounded-lg font-medium text-sm bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <ExternalLink size={16} />
              前往网站
            </button>
          </div>
        ))}
      
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
          <h3 className="font-medium text-amber-800 mb-2">平台说明</h3>
          <p className="text-amber-700 text-sm">
            以上平台为第三方招聘网站，请自行判断信息真实性，注意保护个人信息。
          </p>
        </div>
      </div>
    </div>
  )
}
