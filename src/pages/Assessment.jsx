import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import useAuthStore from '../store/useAuthStore'
import { ArrowLeft, ChevronRight, RotateCcw, AlertCircle } from 'lucide-react'

const questions = [
  {
    dimension: '英语能力',
    key: 'english_score',
    color: 'bg-blue-500',
    items: [
      { q: '你能用英语进行日常对话吗？', options: ['完全不能', '简单几句', '基本流畅', '非常流利'] },
      { q: '你的英语证书情况？', options: ['没有证书', 'CET-4', 'CET-6', '雅思6分以上'] },
      { q: '你能听懂英语广播吗？', options: ['完全听不懂', '能听懂少部分', '能听懂大部分', '完全能听懂'] },
    ],
  },
  {
    dimension: '形象气质',
    key: 'appearance_score',
    color: 'bg-pink-500',
    items: [
      { q: '你的身高体重是否符合标准？', options: ['不确定', '基本符合', '比较符合', '完全符合'] },
      { q: '你是否有良好的仪态习惯？', options: ['没注意过', '偶尔注意', '比较注意', '非常注重'] },
      { q: '你是否有面试着装经验？', options: ['没有', '有一点', '比较有经验', '非常有经验'] },
    ],
  },
  {
    dimension: '服务意识',
    key: 'service_score',
    color: 'bg-green-500',
    items: [
      { q: '你是否有服务行业工作经验？', options: ['完全没有', '短期兼职', '半年以上', '一年以上'] },
      { q: '遇到客人投诉你会怎么做？', options: ['不知所措', '尝试解释', '耐心倾听并处理', '专业流程应对'] },
      { q: '你觉得服务工作最重要的是？', options: ['不清楚', '态度好', '细心周到', '超越期望'] },
    ],
  },
  {
    dimension: '行业知识',
    key: 'knowledge_score',
    color: 'bg-purple-500',
    items: [
      { q: '你了解邮轮上有哪些部门吗？', options: ['完全不了解', '知道一两个', '了解大部分', '非常清楚'] },
      { q: '你知道主要的邮轮公司吗？', options: ['一个都不知道', '知道一两家', '知道三四家', '非常了解'] },
      { q: '你了解海乘的工作内容吗？', options: ['完全不了解', '大概了解', '比较了解', '非常清楚'] },
    ],
  },
  {
    dimension: '证件资料',
    key: 'document_score',
    color: 'bg-orange-500',
    items: [
      { q: '你是否有有效护照？', options: ['没有', '已过期', '正在办理', '已持有'] },
      { q: '你是否有海员证？', options: ['没有', '不知道怎么办', '正在了解', '已持有'] },
      { q: '你的简历准备情况？', options: ['还没写', '有中文简历', '有中英文简历', '已针对海乘优化'] },
    ],
  },
]

export default function Assessment() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [started, setStarted] = useState(false)
  const [currentDim, setCurrentDim] = useState(0)
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchResult = useCallback(async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      setError(null)

      const { data, error: queryError } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (queryError) {
        console.error('查询测评结果失败:', queryError)
        // 表可能不存在，不阻塞，让用户重新测
      }

      if (data) setResult(data)
    } catch (err) {
      console.error('fetchResult 异常:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      fetchResult()
    } else {
      setLoading(false)
    }
  }, [fetchResult, user?.id])

  const handleAnswer = async (score) => {
    const dim = questions[currentDim]
    const key = dim.key
    const newAnswers = { ...answers }
    if (!newAnswers[key]) newAnswers[key] = []
    newAnswers[key][currentQ] = score
    setAnswers(newAnswers)

    if (currentQ < dim.items.length - 1) {
      setCurrentQ(currentQ + 1)
    } else if (currentDim < questions.length - 1) {
      setCurrentDim(currentDim + 1)
      setCurrentQ(0)
    } else {
      // 全部答完，计算结果
      try {
        const scores = {}
        let total = 0
        questions.forEach((d) => {
          const dimAnswers = newAnswers[d.key] || []
          const dimScore = Math.round(
            (dimAnswers.reduce((a, b) => a + b, 0) / (d.items.length * 3)) * 100
          )
          scores[d.key] = dimScore
          total += dimScore
        })
        scores.total_score = Math.round(total / 5)
        scores.user_id = user.id

        const { data, error: upsertError } = await supabase
          .from('assessment_results')
          .upsert(scores, { onConflict: 'user_id' })
          .select()
          .single()

        if (upsertError) {
          console.error('保存测评结果失败:', upsertError)
          // 即使保存失败也显示结果
          setResult(scores)
        } else {
          setResult(data || scores)
        }
      } catch (err) {
        console.error('handleAnswer 异常:', err)
      }
    }
  }

  const totalQuestions = questions.reduce((a, d) => a + d.items.length, 0)
  const answeredCount = Object.values(answers).reduce((a, b) => a + b.length, 0)
  const progress = (answeredCount / totalQuestions) * 100

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-6">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <p className="text-red-600 text-center text-sm mb-4">{error}</p>
        <button
          onClick={fetchResult}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm"
        >
          重试
        </button>
      </div>
    )
  }

  // 显示结果页
  if (result) {
    const dims = [
      { label: '英语能力', key: 'english_score', color: 'bg-blue-500' },
      { label: '形象气质', key: 'appearance_score', color: 'bg-pink-500' },
      { label: '服务意识', key: 'service_score', color: 'bg-green-500' },
      { label: '行业知识', key: 'knowledge_score', color: 'bg-purple-500' },
      { label: '证件资料', key: 'document_score', color: 'bg-orange-500' },
    ]

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 pt-12 pb-8">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate('/')} className="text-white">
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-white text-lg font-bold">测评结果</h1>
          </div>
          <div className="flex items-center justify-center">
            <div className="w-28 h-28 rounded-full border-4 border-white/30 flex items-center justify-center">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{result.total_score}</p>
                <p className="text-blue-200 text-xs">综合得分</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-4">
          {dims.map(({ label, key, color }) => (
            <div key={key} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <span className="text-sm font-bold text-gray-800">{result[key]}分</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${color} transition-all duration-500`}
                  style={{ width: `${result[key]}%` }}
                />
              </div>
            </div>
          ))}

          <button
            onClick={() => {
              setResult(null)
              setStarted(false)
              setCurrentDim(0)
              setCurrentQ(0)
              setAnswers({})
            }}
            className="w-full py-3 bg-white border border-blue-600 text-blue-600 font-medium rounded-xl text-sm flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} />
            重新测评
          </button>
        </div>
      </div>
    )
  }

  // 开始前的介绍页
  if (!started) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 pt-12 pb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-white">
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-white text-lg font-bold">五维测评</h1>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-2">了解你的海乘准备度</h2>
            <p className="text-sm text-gray-500 mb-6">
              通过5个维度、15道题目，全面评估你的海乘求职准备情况，生成专属提升方案。
            </p>
            <div className="space-y-3 mb-6">
              {questions.map(({ dimension, color }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span className="text-sm text-gray-700">{dimension}</span>
                  <span className="text-xs text-gray-400 ml-auto">3题</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mb-4">预计用时 3-5 分钟</p>
            <button
              onClick={() => setStarted(true)}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-2"
            >
              开始测评
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 答题页面
  const dim = questions[currentDim]
  const item = dim.items[currentQ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/')} className="text-white">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-white text-lg font-bold">{dim.dimension}</h1>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-blue-200 text-xs mt-2">
          {answeredCount + 1} / {totalQuestions}
        </p>
      </div>

      <div className="px-6 py-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-base font-medium text-gray-800 mb-6">{item.q}</p>
          <div className="space-y-3">
            {item.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className="w-full text-left px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-blue-500 hover:bg-blue-50 active:scale-95 transition"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}