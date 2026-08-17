import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  RotateCcw,
  Save,
} from 'lucide-react'
import { DIMENSIONS } from '../../data/assessmentData'
import { getLevel } from '../../data/assessmentScoring'
import { useAccessStore } from '../../store/accessStore'
import { saveAssessmentSubmission } from '../../services/assessmentService'

const dimensionLabels = {
  professional: '服务知识',
  english: '英语沟通',
  interview: '面试表达',
  personality: '职业适应',
  adaptability: '应变意识',
}

const jobProfiles = [
  {
    id: 'retail',
    title: '免税店 / Retail Sales',
    weights: { english: 0.25, interview: 0.2, personality: 0.15, adaptability: 0.15, professional: 0.25 },
    strengths: ['销售沟通', '产品学习', '目标意识'],
    risks: ['销售 KPI 压力较明显', '需要主动开口推荐产品'],
    nextSteps: ['学习免税店岗位知识', '整理销售/服务经历', '优化英文简历'],
  },
  {
    id: 'front_office',
    title: '前台 / Guest Services',
    weights: { english: 0.3, interview: 0.2, adaptability: 0.25, personality: 0.15, professional: 0.1 },
    strengths: ['英语沟通', '投诉处理', '跨文化服务'],
    risks: ['客诉和突发情况较多', '对英语和情绪稳定性要求高'],
    nextSteps: ['练习客诉场景英语', '准备 STAR 面试故事', '学习前台服务流程'],
  },
  {
    id: 'bar',
    title: '酒吧服务 / Bar Server',
    weights: { english: 0.22, interview: 0.18, personality: 0.15, adaptability: 0.2, professional: 0.25 },
    strengths: ['服务节奏', '销售意识', '现场应变'],
    risks: ['需要酒水知识', '高峰期节奏快且体力消耗高'],
    nextSteps: ['学习基础酒水术语', '练习点单和推荐话术', '准备服务压力案例'],
  },
  {
    id: 'restaurant',
    title: '餐厅服务 / Restaurant',
    weights: { professional: 0.25, english: 0.2, interview: 0.15, personality: 0.15, adaptability: 0.25 },
    strengths: ['标准化服务', '团队协作', '执行力'],
    risks: ['工作强度较高', '需要稳定体力和服务细节'],
    nextSteps: ['学习西餐服务流程', '练习菜单和投诉英语', '补充餐饮服务经历'],
  },
  {
    id: 'youth_staff',
    title: 'Youth Staff / 儿童活动',
    weights: { english: 0.25, personality: 0.25, adaptability: 0.2, interview: 0.2, professional: 0.1 },
    strengths: ['亲和力', '活动组织', '安全意识'],
    risks: ['对儿童看护经验有要求', '需要耐心和边界感'],
    nextSteps: ['整理儿童/教育相关经历', '练习活动组织英语', '学习儿童安全规范'],
  },
  {
    id: 'housekeeping',
    title: '客房服务 / Housekeeping',
    weights: { professional: 0.25, adaptability: 0.25, personality: 0.2, english: 0.15, interview: 0.15 },
    strengths: ['细节执行', '稳定性', '服务标准'],
    risks: ['体力要求较高', '工作重复度较高'],
    nextSteps: ['了解客房清洁标准', '准备吃苦耐劳案例', '练习客房请求英语'],
  },
]

const serviceBackgroundBoosts = {
  retail: 'retail',
  front_office: 'front_office',
  bar_server: 'bar',
  restaurant: 'restaurant',
  youth_staff: 'youth_staff',
  housekeeping: 'housekeeping',
}

const calculateRecommendations = (dimensionScores, serviceBackground) => {
  return jobProfiles
    .map((job) => {
      const baseScore = Object.entries(job.weights).reduce((total, [dimension, weight]) => {
        return total + (dimensionScores[dimension] || 0) * weight
      }, 0)
      const boostedScore = serviceBackgroundBoosts[serviceBackground] === job.id ? baseScore + 6 : baseScore

      return {
        ...job,
        matchScore: Math.min(96, Math.round(boostedScore)),
      }
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3)
}

const getScoreColor = (score) => {
  if (score >= 80) return 'text-green-700 bg-green-50 border-green-100'
  if (score >= 65) return 'text-blue-700 bg-blue-50 border-blue-100'
  if (score >= 50) return 'text-amber-700 bg-amber-50 border-amber-100'
  return 'text-red-700 bg-red-50 border-red-100'
}

const getLowestDimensions = (dimensionScores) =>
  [...DIMENSIONS]
    .map((dimension) => ({
      id: dimension.id,
      name: dimensionLabels[dimension.id] || dimension.name,
      score: dimensionScores[dimension.id] || 0,
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)

export default function ResultPage({
  dimensionScores,
  overallScore,
  serviceBackground,
  answers,
  onRestart,
}) {
  const navigate = useNavigate()
  const { userId, userEmail } = useAccessStore()
  const [contact, setContact] = useState({
    name: '',
    phone: '',
    wechat: '',
    email: userEmail || '',
    goal: '',
  })
  const [saveState, setSaveState] = useState('idle')
  const [saveMessage, setSaveMessage] = useState('')

  const overallLevel = getLevel(overallScore)
  const recommendations = useMemo(
    () => calculateRecommendations(dimensionScores, serviceBackground),
    [dimensionScores, serviceBackground]
  )
  const lowestDimensions = useMemo(() => getLowestDimensions(dimensionScores), [dimensionScores])

  const handleContactChange = (field, value) => {
    setContact((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveSubmission = async () => {
    if (!contact.name.trim() && !contact.phone.trim() && !contact.wechat.trim() && !contact.email.trim()) {
      setSaveState('error')
      setSaveMessage('请至少填写一个联系方式，方便后续查看和跟进测评结果。')
      return
    }

    try {
      setSaveState('saving')
      setSaveMessage('')
      await saveAssessmentSubmission({
        userId,
        contact,
        serviceBackground,
        answers,
        dimensionScores,
        overallScore,
        level: overallLevel,
        recommendations,
      })
      setSaveState('saved')
      setSaveMessage('已保存。你可以在 Supabase 后台查看这条测评记录。')
    } catch (error) {
      console.error('保存测评结果失败:', error)
      setSaveState('error')
      setSaveMessage('保存失败。请确认 Supabase 已创建 assessment_submissions 表和 insert policy。')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-200 px-6 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">海乘职业适配报告</h1>
            <p className="text-sm text-gray-500 mt-0.5">基于服务经验、英语、面试表达和职业适应力</p>
          </div>
        </div>
      </div>

      <main className="px-6 py-6 max-w-3xl mx-auto">
        <section className="bg-white rounded-xl shadow-sm p-5 mb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">综合准备度</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-gray-900">{overallScore}</span>
                <span className="text-lg font-semibold text-gray-500 mb-1">/ 100</span>
              </div>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getScoreColor(overallScore)}`}>
              {overallLevel.label}
            </span>
          </div>

          <p className="text-sm text-gray-600 mt-4">
            这份结果不是简单判断“能不能做海乘”，而是帮你找到更合适的岗位方向，以及当前最应该补齐的准备项。
          </p>
        </section>

        <section className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase size={20} className="text-blue-600" />
            <h2 className="font-bold text-gray-900">推荐岗位 Top 3</h2>
          </div>

          <div className="space-y-3">
            {recommendations.map((job, index) => (
              <div key={job.id} className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs text-blue-600 font-medium mb-1">推荐 {index + 1}</p>
                    <h3 className="font-bold text-gray-900">{job.title}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getScoreColor(job.matchScore)}`}>
                    {job.matchScore}%
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">为什么适合</p>
                    <div className="flex flex-wrap gap-2">
                      {job.strengths.map((item) => (
                        <span key={item} className="text-xs bg-white border border-gray-200 rounded-full px-2 py-1 text-gray-700">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-amber-700 mb-2">需要提前知道的风险</p>
                    <ul className="space-y-1">
                      {job.risks.map((item) => (
                        <li key={item} className="text-xs text-amber-800 flex gap-1.5">
                          <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">下一步建议</p>
                  <div className="space-y-1.5">
                    {job.nextSteps.map((step) => (
                      <div key={step} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle2 size={15} className="text-green-600" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList size={20} className="text-blue-600" />
            <h2 className="font-bold text-gray-900">当前短板</h2>
          </div>
          <div className="space-y-3">
            {lowestDimensions.map((dimension) => (
              <div key={dimension.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{dimension.name}</span>
                  <span className="font-medium text-gray-900">{dimension.score}/100</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${dimension.score}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-4">
            建议先补齐这两个维度，再进入简历优化和面试训练，会比盲目投递更稳。
          </p>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-5 mb-5">
          <h2 className="font-bold text-gray-900 mb-3">保存报告并方便后续跟进</h2>
          <p className="text-sm text-gray-600 mb-4">
            填写联系方式后，这份测评结果会保存到后台。后续可以基于你的结果继续生成职业路线、简历建议和面试准备计划。
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={contact.name}
              onChange={(event) => handleContactChange('name', event.target.value)}
              placeholder="姓名"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
            />
            <input
              value={contact.phone}
              onChange={(event) => handleContactChange('phone', event.target.value)}
              placeholder="手机号"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
            />
            <input
              value={contact.wechat}
              onChange={(event) => handleContactChange('wechat', event.target.value)}
              placeholder="微信号"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
            />
            <input
              value={contact.email}
              onChange={(event) => handleContactChange('email', event.target.value)}
              placeholder="邮箱"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          <textarea
            value={contact.goal}
            onChange={(event) => handleContactChange('goal', event.target.value)}
            placeholder="你的目标或问题，例如：想半年内登船、想做免税店、英语一般不知道怎么准备"
            className="w-full mt-3 rounded-lg border border-gray-300 px-3 py-2.5 text-sm min-h-24 resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
          />

          {saveMessage && (
            <p className={`text-sm mt-3 ${saveState === 'error' ? 'text-red-600' : 'text-green-600'}`}>
              {saveMessage}
            </p>
          )}

          <button
            type="button"
            onClick={handleSaveSubmission}
            disabled={saveState === 'saving' || saveState === 'saved'}
            className="w-full mt-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {saveState === 'saving' ? '保存中...' : saveState === 'saved' ? '已保存报告' : '保存我的测评报告'}
          </button>
        </section>

        <section className="space-y-3">
          <button
            type="button"
            onClick={() => navigate('/tasks/Task2')}
            className="w-full py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            进入下一步：选择目标岗位
            <ArrowRight size={18} />
          </button>

          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="w-full py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            查看完整登船路线
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('重新测评会清除当前本地结果，确定继续吗？')) {
                localStorage.removeItem('assessment_result')
                onRestart()
              }
            }}
            className="w-full py-3 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw size={17} />
            重新测评
          </button>
        </section>
      </main>
    </div>
  )
}
