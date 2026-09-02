// src/pages/BoardingMaterials.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export default function BoardingMaterials() {
  const navigate = useNavigate()
  const [materials, setMaterials] = useState([
    { id: 1, name: '护照', description: '有效期需12个月以上', status: 'pending' },
    { id: 2, name: '海员证/服务簿', description: '国际航行必备证件', status: 'pending' },
    { id: 3, name: '基本安全培训合格证（四小证）', description: '上船必备安全证书', status: 'pending' },
    { id: 4, name: '保安意识培训证书（Security Awareness）', description: '国际海事组织要求', status: 'pending' },
    { id: 5, name: '负有指定保安职责船员培训证书（SDSD）', description: '部分岗位需要', status: 'pending' },
    { id: 6, name: '国际旅行健康检查证明（小红本）', description: '体检证明', status: 'pending' },
    { id: 7, name: '疫苗接种记录（小黄本）', description: '含黄热病等重点疫苗', status: 'pending' },
    { id: 8, name: '无犯罪记录证明', description: '需要公证', status: 'pending' },
    { id: 9, name: '最高学历证书 + 公证件', description: '学历证明', status: 'pending' },
    { id: 10, name: '英语等级证书（如有）', description: '提高竞争力', status: 'pending' },
    { id: 11, name: '2寸白底证件照', description: '电子版+纸质版', status: 'pending' },
    { id: 12, name: '英文简历', description: '可跳转简历制作模块', status: 'pending' },
  ])

  // 计算完成度
  const completedCount = materials.filter(m => m.status === 'completed').length
  const totalCount = materials.length
  const completionPercentage = Math.round((completedCount / totalCount) * 100)

  // 处理状态变更
  const handleStatusChange = (id, status) => {
    setMaterials(prev => prev.map(m => 
      m.id === id ? { ...m, status } : m
    ))
  }

  // 处理跳转到简历制作
  const handleGoToResume = () => {
    navigate('/tasks/phase2/Task4')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部导航 */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 px-6 pt-16 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/jobs/preparation')}
            className="text-white hover:text-green-200"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-white text-2xl font-bold">登船材料清单</h1>
        </div>
        <p className="text-white/80 text-sm mt-2">
          准备好所有必要材料，确保顺利登船
        </p>
      </div>

      {/* 完成度进度条 */}
      <div className="px-6 py-4 bg-white shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-700 font-medium">完成度</span>
          <span className="text-gray-600">已办理 {completedCount}/{totalCount} 项</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* 材料列表 */}
      <div className="px-6 py-6 space-y-4">
        {materials.map((material) => (
          <div key={material.id} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-gray-800">{material.name}</h3>
                <p className="text-gray-600 text-sm mt-1">{material.description}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleStatusChange(material.id, 'completed')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${material.status === 'completed'
                  ? 'bg-green-100 text-green-700 border-2 border-green-500'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                已办理 ✅
              </button>
              <button
                onClick={() => handleStatusChange(material.id, 'processing')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${material.status === 'processing'
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                办理中 🔄
              </button>
              <button
                onClick={() => handleStatusChange(material.id, 'pending')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${material.status === 'pending'
                  ? 'bg-gray-100 text-gray-700 border-2 border-gray-500'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                未办理 ⬜
              </button>
            </div>
            {material.id === 12 && (
              <button
                onClick={handleGoToResume}
                className="w-full mt-3 py-2 rounded-lg border border-green-600 text-green-600 font-medium text-sm hover:bg-green-50 transition-colors"
              >
                去制作简历
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 底部提示 */}
      <div className="px-6 py-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-medium text-amber-800 mb-2">提示</h3>
          <p className="text-amber-700 text-sm">
            材料状态仅保存在本地，页面刷新后会重置。请及时记录你的进度。
          </p>
        </div>
      </div>
    </div>
  )
}
