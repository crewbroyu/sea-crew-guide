// src/pages/YugeReferral.jsx
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, User, FileText, MessageSquare, Users, Award, CheckCircle } from 'lucide-react'

const services = [
  {
    icon: FileText,
    title: '简历指导',
    description: '根据目标岗位优化简历内容'
  },
  {
    icon: MessageSquare,
    title: '面试辅导',
    description: '模拟面试训练，提高通过率'
  },
  {
    icon: Users,
    title: '渠道推荐',
    description: '内推直达邮轮公司HR'
  },
  {
    icon: Award,
    title: '全程DIY陪跑',
    description: '从0到1，全程一对一指导'
  }
]

export default function YugeReferral() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-amber-600 to-amber-800 px-6 pt-16 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/jobs/channels')}
            className="text-white hover:text-amber-200"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-white text-2xl font-bold">宇哥内推</h1>
        </div>
        <p className="text-white/80 text-sm mt-2">
          一对一求职指导，内推渠道直达
        </p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* 个人介绍 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-amber-200 rounded-full flex items-center justify-center">
              <User size={40} className="text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">宇哥</h2>
              <p className="text-gray-600 text-sm">前邮轮船员 · 6年海乘经验</p>
            </div>
          </div>
          <p className="text-gray-600">
            前邮轮船员，6年海乘经验，熟悉各大邮轮公司招聘流程，提供一对一上船指导。帮助过500+人成功上船！
          </p>
          
          {/* 数据展示 */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">500+</div>
              <div className="text-xs text-gray-500">成功上船</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">6年</div>
              <div className="text-xs text-gray-500">海乘经验</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">100%</div>
              <div className="text-xs text-gray-500">用心服务</div>
            </div>
          </div>
        </div>

        {/* 服务介绍 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">可提供的服务</h3>
          <div className="space-y-3">
            {services.map((service, index) => {
              const Icon = service.icon
              return (
                <div key={index} className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{service.title}</h4>
                    <p className="text-gray-600 text-sm mt-1">{service.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 联系方式 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">联系方式</h3>
          
          {/* 微信二维码 */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-400 rounded mx-auto mb-2 flex items-center justify-center">
                  <CheckCircle size={24} className="text-white" />
                </div>
                <p className="text-gray-500 text-sm">微信二维码</p>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-gray-600 mb-2">微信号：<span className="font-medium text-gray-800">YugeCruise</span></p>
            <p className="text-amber-700 text-sm">添加时请备注：海乘求职</p>
          </div>
        </div>

        {/* 温馨提示 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">温馨提示</h3>
          <p className="text-blue-700 text-sm">
            宇哥内推为第三方服务，请自行判断是否需要。本平台不对服务结果做任何保证。
          </p>
        </div>
      </div>
    </div>
  )
}
