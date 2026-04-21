// src/pages/BrandPartners.jsx
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Star, ArrowRight, Search, Zap, Sparkles } from 'lucide-react'
import JobApplicationCard from '../components/JobApplicationCard'
import { useState } from 'react'

export default function BrandPartners() {
  const navigate = useNavigate()
  const [showApplicationCard, setShowApplicationCard] = useState(false)
  const [currentBrand, setCurrentBrand] = useState(null)

  const saveApplication = (applicationData) => {
    const applicationsKey = 'job_applications'
    const applications = JSON.parse(localStorage.getItem(applicationsKey) || '[]')
    
    applications.push({
      ...applicationData,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      status: 'pending'
    })
    
    localStorage.setItem(applicationsKey, JSON.stringify(applications))
    
    // 跳转到官网
    window.open(applicationData.companyUrl, '_blank')
    setShowApplicationCard(false)
  }

  const handleApply = (brand) => {
    setCurrentBrand(brand)
    setShowApplicationCard(true)
  }

  const handleCancel = () => {
    setShowApplicationCard(false)
    setCurrentBrand(null)
  }

  const handleJustLooking = () => {
    setShowApplicationCard(false)
    setCurrentBrand(null)
  }

  const brandPartners = [
    {
      name: 'Starboard免税店',
      description: '全球领先的邮轮免税店运营商',
      url: 'https://www.starboardretailgroup.com/careers/',
      positions: ['Sales Associate', 'Beauty Specialist', 'Watch Specialist']
    },
    {
      name: 'HARDING免税店',
      description: '欧洲知名邮轮零售运营商',
      url: 'https://www.hardingretail.com/shipboard-careers/',
      positions: ['Retail Sales Associate', 'Assistant Manager', 'Store Manager']
    },
    {
      name: 'Park West画廊',
      description: '邮轮艺术品拍卖与销售',
      url: 'https://www.parkwestgallery.com/careers/',
      positions: ['Art Auctioneer', 'Gallery Assistant', 'Art Consultant']
    },
    {
      name: 'One Spa World按摩',
      description: '邮轮 spa 服务提供商',
      url: 'https://www.londonwellnessacademy.com/?RegionID=8',
      positions: ['Spa Therapist', 'Massage Therapist', 'Spa Manager']
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部头部 */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 pt-16 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/jobs/channels')}
            className="text-white hover:text-indigo-200"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-white text-2xl font-bold">品牌合作运营</h1>
        </div>
        <p className="text-white/80 text-sm mt-2">
          免税店、Art Gallery、Spa等部门的招聘信息
        </p>
      </div>

      <div className="px-6 py-6 space-y-4">
        {/* 合作伙伴列表 */}
        <div className="space-y-4">
          {brandPartners.map((partner, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{partner.name}</h3>
                    <p className="text-gray-500 text-sm mt-1">{partner.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {partner.positions.map((position, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                          {position}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleApply({ name: partner.name, url: partner.url })}
                    className="text-blue-600 text-sm font-medium flex items-center gap-1"
                  >
                    访问官网
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 mt-4">* 包含：免税店、Art Gallery、Spa等部门</p>

        {/* 提示信息 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <div className="flex items-start gap-2">
            <Search size={18} className="text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800 mb-1">申请说明</h3>
              <p className="text-blue-700 text-sm">
                这些品牌合作伙伴是邮轮上的独立运营部门，招聘流程通常独立于邮轮公司。点击"访问官网"可以直接进入他们的招聘页面。
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
            <span className="text-green-700 text-xs font-medium">全球机会</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 rounded-full">
            <Star size={14} className="text-purple-600" />
            <span className="text-purple-700 text-xs font-medium">专业领域</span>
          </div>
        </div>
      </div>
      
      {/* 申请记录卡片 */}
      {showApplicationCard && currentBrand && (
        <JobApplicationCard
          company={currentBrand}
          onApply={saveApplication}
          onCancel={handleCancel}
          onJustLooking={handleJustLooking}
        />
      )}
    </div>
  )
}