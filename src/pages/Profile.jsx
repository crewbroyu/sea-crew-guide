import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createElement } from 'react'
import useAuthStore from '../store/useAuthStore'
import {
  User, FileText, Target, Route, Award, Shield,
  Settings, LogOut, ChevronRight, Bell, X, CheckCircle
} from 'lucide-react'

export default function Profile() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuthStore()
  const [unreadCount, setUnreadCount] = useState(0)
  const [assessmentResult, setAssessmentResult] = useState(null)
  const [showReportModal, setShowReportModal] = useState(false)

  // 加载未读消息数量和测评结果
  useEffect(() => {
    // 加载未读消息
    const messages = JSON.parse(localStorage.getItem('messages') || '[]')
    const count = messages.filter(msg => !msg.isRead).length
    setUnreadCount(count)
    
    // 加载测评结果
    const savedResult = localStorage.getItem('assessment_result')
    if (savedResult) {
      const result = JSON.parse(savedResult)
      if (result.completed) {
        setAssessmentResult(result)
      }
    }
  }, [])

  const handleLogout = async () => {
    await signOut()
  }

  // 加载打卡记录
  const [checkInRecords, setCheckInRecords] = useState([])
  const [checkInCount, setCheckInCount] = useState(0)
  const [showCheckInModal, setShowCheckInModal] = useState(false)

  useEffect(() => {
    // 加载打卡记录
    const records = JSON.parse(localStorage.getItem('checkin_records') || '[]')
    setCheckInRecords(records)
    setCheckInCount(records.length)
  }, [])

  const menuItems = [
    { 
      icon: CheckCircle, 
      label: `每日打卡 · ${checkInCount}次`, 
      to: '/',
      suffix: '去打卡',
      onClick: () => setShowCheckInModal(true)
    },
    {
      icon: Target, 
      label: assessmentResult ? `适配度${assessmentResult.level.label} · ${assessmentResult.overallScore}分` : '海乘适配评估', 
      to: '/assessment',
      suffix: !assessmentResult && '去测评',
      onClick: () => {
        if (assessmentResult) {
          setShowReportModal(true)
        } else {
          navigate('/assessment')
        }
      }
    },
    { icon: Route, label: '确定申请路线', to: '/route-select' },
    { icon: FileText, label: '个人简历', to: '/resume' },
    { icon: Award, label: '邮轮合同', to: '/my-offer' },
    { icon: Shield, label: '登船证件', to: '/tasks/Task10' },
    { icon: Bell, label: '站内消息', to: '/messages', hasBadge: unreadCount > 0, badgeCount: unreadCount },
    { icon: Settings, label: '设置', to: '/settings' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部用户信息 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 pt-12 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <User size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-white text-lg font-bold">
              {profile?.nickname || '新船员'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                Lv.{profile?.level || 1}
              </span>
              <span className="text-blue-200 text-xs">{profile?.xp || 0} XP</span>
            </div>
            {profile?.selected_job && (
              <p className="text-blue-200 text-xs mt-1">
                目标岗位：{profile.selected_job}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 菜单列表 */}
      <div className="px-6 py-4 space-y-2">
        {menuItems.map(({ icon, label, to, hasBadge, badgeCount, suffix, onClick }) => (
          <button
            key={to}
            onClick={() => {
              if (onClick) {
                onClick()
              } else {
                navigate(to)
              }
            }}
            className="w-full bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm"
          >
            <div className="relative">
              {createElement(icon, { size: 20, className: 'text-gray-500' })}
              {hasBadge && (
                <div className="absolute -top-1 -right-1">
                  <div className="bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                    {badgeCount}
                  </div>
                </div>
              )}
            </div>
            <div className="flex-1 text-left">
              <span className="text-sm text-gray-800">{label}</span>
            </div>
            <div className="flex items-center gap-2">
              {suffix && (
                <span className="text-xs text-blue-600 font-medium">{suffix}</span>
              )}
              <ChevronRight size={18} className="text-gray-300" />
            </div>
          </button>
        ))}

        <button
          onClick={handleLogout}
          className="w-full bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm mt-4"
        >
          <LogOut size={20} className="text-red-500" />
          <span className="text-sm text-red-500">退出登录</span>
        </button>
      </div>

      {/* 评估报告弹窗 */}
      {showReportModal && assessmentResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">海乘评估报告</h2>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* 总体评估 */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">总体适配度</span>
                <span className="text-xl font-bold">{assessmentResult.overallScore}分</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">评估等级</span>
                <span className="text-lg font-semibold">{assessmentResult.level.label}</span>
              </div>
            </div>

            {/* 各维度评估 */}
            <div className="mb-4">
              <h3 className="text-md font-semibold text-gray-800 mb-3">维度评估</h3>
              {assessmentResult.scores && Object.entries(assessmentResult.scores).map(([dimension, score]) => (
                <div key={dimension} className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">
                      {dimension === 'language' && '语言能力'}
                      {dimension === 'service' && '服务意识'}
                      {dimension === 'personality' && '性格特质'}
                      {dimension === 'adaptability' && '适应能力'}
                      {dimension === 'professionalism' && '职业素养'}
                      {dimension === 'professional' && '专业服务知识'}
                      {dimension === 'english' && '英语听说能力'}
                      {dimension === 'interview' && '面试表达能力'}
                    </span>
                    <span className="text-sm font-medium text-gray-800">{score}分</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${(score / 100) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 评估结论 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
              <h3 className="text-md font-semibold text-gray-800 mb-2">评估结论</h3>
              <p className="text-sm text-gray-600">
                {assessmentResult.conclusion}
              </p>
            </div>

            {/* 完成时间 */}
            <div className="text-xs text-gray-500 mb-4">
              评估完成时间：{new Date(assessmentResult.completedAt).toLocaleString()}
            </div>

            <button
              onClick={() => setShowReportModal(false)}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 打卡记录弹窗 */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">打卡记录</h2>
              <button
                onClick={() => setShowCheckInModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* 打卡统计 */}
            <div className="bg-gradient-to-r from-green-600 to-green-800 text-white rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm">总打卡次数</span>
                <span className="text-xl font-bold">{checkInCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">最近打卡</span>
                <span className="text-sm">
                  {checkInRecords.length > 0 ? new Date(checkInRecords[checkInRecords.length - 1].date).toLocaleDateString() : '暂无'}
                </span>
              </div>
            </div>

            {/* 打卡历史 */}
            <div className="mb-4">
              <h3 className="text-md font-semibold text-gray-800 mb-3">打卡历史</h3>
              {checkInRecords.length > 0 ? (
                <div className="space-y-3">
                  {checkInRecords.slice(-10).reverse().map((record, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-800">
                          {new Date(record.date).toLocaleString()}
                        </span>
                        <span className="text-xs text-green-600">已打卡</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {record.sentence}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">暂无打卡记录</p>
                  <button
                    onClick={() => {
                      setShowCheckInModal(false)
                      navigate('/academy/checkin')
                    }}
                    className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                  >
                    去打卡
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCheckInModal(false)}
                className="flex-1 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  setShowCheckInModal(false)
                  navigate('/academy/checkin')
                }}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
              >
                去打卡
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}