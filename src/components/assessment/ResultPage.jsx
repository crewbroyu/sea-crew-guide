// src/components/assessment/ResultPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { DIMENSIONS, DIMENSION_FEEDBACK } from '../../data/assessmentData'
import { getLevel } from '../../data/assessmentScoring'

export default function ResultPage({ dimensionScores, overallScore, onRestart }) {
  const navigate = useNavigate()
  const [expandedDimension, setExpandedDimension] = useState(null)
  const [displayScore, setDisplayScore] = useState(0)

  // 数字递增动画
  useEffect(() => {
    let current = 0
    const interval = setInterval(() => {
      current += 1
      if (current <= overallScore) {
        setDisplayScore(current)
      } else {
        clearInterval(interval)
      }
    }, 20)

    return () => clearInterval(interval)
  }, [overallScore])

  // 准备雷达图数据
  const radarData = DIMENSIONS.map(dimension => ({
    subject: dimension.name,
    score: dimensionScores[dimension.id] || 0,
    fullMark: 100
  }))

  // 获取等级信息
  const overallLevel = getLevel(overallScore)

  // 渲染等级颜色
  const getLevelColor = (color) => {
    const colors = {
      green: 'text-green-600 bg-green-100',
      blue: 'text-blue-600 bg-blue-100',
      yellow: 'text-yellow-600 bg-yellow-100',
      red: 'text-red-600 bg-red-100'
    }
    return colors[color] || 'text-gray-600 bg-gray-100'
  }

  // 处理进入下一任务
  const handleNextTask = () => {
    navigate('/tasks/Task2')
  }

  // 处理查看提升计划
  const handleViewImprovementPlan = () => {
    navigate('/academy')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/jobs/preparation')}
            className="text-gray-600 hover:text-gray-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800">测评结果</h1>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="flex-1 px-6 py-8 pb-24">
        <div className="max-w-md mx-auto">
          {/* 综合就绪度 */}
          <div className="text-center mb-10">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">综合就绪度</h2>
            <div className="relative w-48 h-48 mx-auto mb-4">
              {/* 圆形进度环 */}
              <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* 背景圆环 */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                {/* 进度圆环 */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(displayScore / 100) * 283}`}
                  strokeDashoffset="283"
                  transform="rotate(-90 50 50)"
                  className="transition-all duration-1000"
                />
              </svg>
              {/* 中心分数 */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-gray-800">{displayScore}%</span>
                <span className={`mt-2 px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(overallLevel.color)}`}>
                  {overallLevel.label}
                </span>
              </div>
            </div>
            <p className="text-gray-600">
              你的整体准备度为 {overallScore}%，{overallLevel.label}。
              {overallScore >= 80 ? '你已经做好了上船的准备！' : 
               overallScore >= 60 ? '英语和面试表达是你的提升重点。' : 
               '建议系统学习后再参加测评。'}
            </p>
          </div>

          {/* 五维雷达图 */}
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">五维分析</h2>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart outerRadius={90} data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="得分"
                    dataKey="score"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-5 gap-2 mt-4">
                {DIMENSIONS.map((dimension) => {
                  const score = dimensionScores[dimension.id] || 0
                  const level = getLevel(score)
                  return (
                    <div key={dimension.id} className="text-center">
                      <p className="text-xs text-gray-500 mb-1">{dimension.name}</p>
                      <p className={`text-sm font-medium ${getLevelColor(level.color)} px-2 py-1 rounded-full`}>
                        {score}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 各维度详细反馈 */}
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">详细反馈</h2>
            <div className="space-y-3">
              {DIMENSIONS.map((dimension) => {
                const score = dimensionScores[dimension.id] || 0
                const level = getLevel(score)
                const feedback = DIMENSION_FEEDBACK[dimension.id][level.level]
                
                return (
                  <div key={dimension.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <button
                      onClick={() => setExpandedDimension(expandedDimension === dimension.id ? null : dimension.id)}
                      className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                          {dimension.icon === 'BookOpen' && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                            </svg>
                          )}
                          {dimension.icon === 'Languages' && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10H3"></path>
                              <path d="M21 6H3"></path>
                              <path d="M21 14H3"></path>
                              <path d="M21 18H3"></path>
                              <circle cx="12" cy="12" r="4"></circle>
                            </svg>
                          )}
                          {dimension.icon === 'MessageSquare' && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                            </svg>
                          )}
                          {dimension.icon === 'Heart' && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                          )}
                          {dimension.icon === 'Zap' && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.9 6.3a1 1 0 0 0 .78 1.23 10.7 10.7 0 0 0 3.2 0 1 1 0 0 0 .78-1.23l-1.9-6.3a.5.5 0 0 1 .86-.46l9.9 10.2A1 1 0 0 1 20 14z"></path>
                            </svg>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-800">{dimension.name}</h3>
                          <p className="text-sm text-gray-500">{score} 分 | {level.label}</p>
                        </div>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-400 transition-transform ${expandedDimension === dimension.id ? 'rotate-180' : ''}`}>
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                    {expandedDimension === dimension.id && (
                      <div className="px-5 py-4 border-t border-gray-200">
                        <p className="text-gray-700 mb-3">{feedback.feedback}</p>
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-800 mb-2">提升建议：</h4>
                          <ul className="space-y-1">
                            {feedback.suggestions.map((suggestion, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 mt-0.5">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <button className="w-full py-2 rounded-lg border border-green-600 text-green-600 font-medium text-sm hover:bg-green-50 transition-colors">
                          去学习
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 底部操作 */}
          <div className="space-y-3">
            <button
              onClick={() => {
                if (window.confirm('重新测评将清除当前结果，确定吗？')) {
                  // 清除localStorage中的测评结果
                  localStorage.removeItem('assessment_result')
                  onRestart()
                }
              }}
              className="w-full py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              重新测评
            </button>
            <button
              onClick={handleNextTask}
              className="w-full py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              进入下一任务
            </button>
            <button
              onClick={handleViewImprovementPlan}
              className="w-full py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
            >
              查看提升计划
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
