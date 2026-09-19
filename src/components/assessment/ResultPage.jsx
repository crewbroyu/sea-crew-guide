import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  AlertTriangle,
  ChevronLeft,
  ClipboardList,
  RotateCcw,
  Save,
} from 'lucide-react'
import { DIMENSIONS } from '../../data/assessmentData'
import { getCareerConclusion, getLevel } from '../../data/assessmentScoring'
import { useAccessStore } from '../../store/accessStore'
import { saveAssessmentSubmission } from '../../services/assessmentService'
import { syncLocalPathProfile } from '../../services/userPathService'
import CareerReportPanel from './CareerReportPanel'

const dimensionLabels = {
  eligibility: '基础可行性',
  english: '英语服务沟通',
  service_experience: '服务与岗位背景',
  work_preference: '岗位偏好匹配',
  ship_adaptability: '船上适应力',
  application_readiness: '求职准备度',
}

const jobProfiles = [
  {
    id: 'retail',
    title: '免税店 / Retail Sales',
    detailRoute: '/jobs',
    weights: { english: 0.24, service_experience: 0.22, work_preference: 0.2, application_readiness: 0.18, ship_adaptability: 0.16 },
    strengths: ['适合有销售或主动沟通经验的人', '收入上限相对更依赖表现', '容易连接奢侈品、美妆或零售职业发展'],
    risks: ['KPI 压力明显', '需要主动开口推荐产品', '不适合极度抗拒销售的人'],
    nextSteps: ['补齐英文销售表达', '整理销售或服务案例', '学习免税店岗位职责和品牌基础知识'],
  },
  {
    id: 'front_office',
    title: '前台 / Guest Services',
    detailRoute: '/jobs',
    weights: { english: 0.3, ship_adaptability: 0.22, service_experience: 0.18, application_readiness: 0.16, work_preference: 0.14 },
    strengths: ['适合英语沟通稳定的人', '更接近酒店前厅职业路径', '能积累投诉处理和跨文化服务经验'],
    risks: ['客诉和突发问题较多', '英语和情绪稳定要求高', '面试会重点考察服务判断'],
    nextSteps: ['练习客诉场景英语', '准备 STAR 服务案例', '了解邮轮 Guest Services 日常流程'],
  },
  {
    id: 'bar',
    title: '酒吧服务 / Bar Server',
    detailRoute: '/programs/bar-server',
    weights: { service_experience: 0.24, english: 0.22, work_preference: 0.2, ship_adaptability: 0.2, application_readiness: 0.14 },
    strengths: ['适合节奏快、愿意互动的人', '小费和销售意识会影响收入', '服务技能迁移性较强'],
    risks: ['高峰期强度大', '需要酒水和推荐话术', '晚班和嘈杂环境较常见'],
    nextSteps: ['学习基础酒水英文', '练习点单和推荐话术', '准备高压服务案例'],
  },
  {
    id: 'restaurant',
    title: '餐厅服务 / Restaurant',
    detailRoute: '/jobs',
    weights: { service_experience: 0.26, ship_adaptability: 0.22, eligibility: 0.18, english: 0.18, work_preference: 0.16 },
    strengths: ['适合有餐饮或酒店服务基础的人', '岗位需求量相对稳定', '标准化流程清晰'],
    risks: ['体力消耗较高', '工作重复度较高', '需要接受排班和团队协作压力'],
    nextSteps: ['梳理餐饮服务经历', '补齐菜单和客诉英语', '确认自己能接受工作强度'],
  },
  {
    id: 'housekeeping',
    title: '客房服务 / Housekeeping',
    detailRoute: '/jobs',
    weights: { eligibility: 0.24, ship_adaptability: 0.24, service_experience: 0.22, application_readiness: 0.16, english: 0.14 },
    strengths: ['适合执行力强、细节稳定的人', '英语门槛通常低于前台', '能快速理解标准化服务'],
    risks: ['体力要求高', '重复劳动较多', '晋升需要长期稳定表现'],
    nextSteps: ['了解客房清洁标准', '准备吃苦耐劳案例', '练习基础客房请求英语'],
  },
  {
    id: 'youth_staff',
    title: 'Youth Staff / 儿童青少年活动',
    detailRoute: '/jobs',
    weights: { english: 0.25, ship_adaptability: 0.22, work_preference: 0.2, service_experience: 0.18, application_readiness: 0.15 },
    strengths: ['适合有教育、活动或儿童照看经验的人', '工作内容更偏互动和活动组织', '英语表达和责任边界很重要'],
    risks: ['对安全意识要求高', '需要耐心和情绪稳定', '部分公司会要求相关经验或证书'],
    nextSteps: ['整理儿童、教育或活动经历', '练习活动组织英语', '学习儿童安全和边界意识'],
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

const calculateRecommendations = (dimensionScores, serviceBackground) =>
  jobProfiles
    .map((job) => {
      const baseScore = Object.entries(job.weights).reduce(
        (total, [dimension, weight]) => total + (dimensionScores[dimension] || 0) * weight,
        0
      )
      const backgroundBoost = serviceBackgroundBoosts[serviceBackground] === job.id ? 6 : 0

      return { ...job, matchScore: Math.min(96, Math.round(baseScore + backgroundBoost)) }
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3)

const getScoreColor = (score) => {
  if (score >= 82) return 'text-emerald-700 bg-emerald-50 border-emerald-100'
  if (score >= 68) return 'text-blue-700 bg-blue-50 border-blue-100'
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

const buildRoutePlan = (recommendations, lowestDimensions) => {
  const primaryJob = recommendations[0]?.title || '目标岗位'
  const firstGap = lowestDimensions[0]?.name || '英语服务沟通'
  const secondGap = lowestDimensions[1]?.name || '求职准备度'

  return [
    {
      period: '第 1-30 天',
      title: '确认岗位方向',
      tasks: [
        `优先研究 ${primaryJob} 的职责、收入结构和不适合人群。`,
        `补齐 ${firstGap} 的基础要求，避免盲目投递。`,
        '整理 2-3 个能证明服务、销售、抗压或团队协作的真实案例。',
      ],
    },
    {
      period: '第 31-60 天',
      title: '准备申请材料',
      tasks: [
        '把中文经历改写成英文简历里的岗位能力表达。',
        `针对 ${secondGap} 制作一份短板补齐清单。`,
        '确定申请方式：官网、一代、指导型 DIY 或其他渠道。',
      ],
    },
    {
      period: '第 61-90 天',
      title: '进入面试与投递',
      tasks: [
        `围绕 ${primaryJob} 练习岗位问题、服务场景和英文自我介绍。`,
        '每周复盘投递进度、回复情况和面试卡点。',
        '根据反馈调整目标岗位和申请渠道。',
      ],
    },
  ]
}

const getSavedCareerReport = () => {
  try {
    return JSON.parse(localStorage.getItem('assessment_result') || '{}').careerReport || null
  } catch {
    return null
  }
}

const getSavedCareerProfile = () => {
  try {
    return JSON.parse(localStorage.getItem('assessment_result') || '{}').careerProfile || null
  } catch {
    return null
  }
}

export default function ResultPage({
  dimensionScores,
  overallScore,
  serviceBackground,
  answers,
  onRestart,
}) {
  const navigate = useNavigate()
  const { userId, userEmail, openRegisterModal } = useAccessStore()
  const [contact, setContact] = useState({
    name: '',
    phone: '',
    wechat: '',
    email: userEmail || '',
    goal: '',
  })
  const [saveState, setSaveState] = useState('idle')
  const [saveMessage, setSaveMessage] = useState('')
  const [careerReport, setCareerReport] = useState(getSavedCareerReport)

  const overallLevel = getLevel(overallScore)
  const conclusion = getCareerConclusion(overallScore, dimensionScores)
  const recommendations = useMemo(
    () => calculateRecommendations(dimensionScores, serviceBackground),
    [dimensionScores, serviceBackground]
  )
  const lowestDimensions = useMemo(() => getLowestDimensions(dimensionScores), [dimensionScores])
  const routePlan = useMemo(
    () => buildRoutePlan(recommendations, lowestDimensions),
    [lowestDimensions, recommendations]
  )

  useEffect(() => {
    try {
      const savedResult = JSON.parse(localStorage.getItem('assessment_result') || '{}')
      if (!savedResult?.completed) return

      localStorage.setItem(
        'assessment_result',
        JSON.stringify({
          ...savedResult,
          // The AI report narrows the comparison set; Task 2 remains the user's decision step.
          // Keep the rule-based comparison only before that report exists.
          recommendations: savedResult.careerReport
            ? savedResult.recommendations
            : recommendations.map((job) => ({
                id: job.id,
                title: job.title,
                matchScore: job.matchScore,
                strengths: job.strengths,
                risks: job.risks,
                nextSteps: job.nextSteps,
              })),
          lowestDimensions,
          routePlan,
        })
      )
    } catch (error) {
      console.warn('Unable to update assessment result recommendations:', error)
    }
  }, [lowestDimensions, recommendations, routePlan])

  const activeRecommendations = useMemo(() => {
    if (!careerReport?.recommendedPositions?.length) return recommendations

    return careerReport.recommendedPositions.map((position) => {
      const fallback = recommendations.find((job) => job.id === position.id)

      return {
        ...fallback,
        id: position.id,
        title: position.title || fallback?.title || position.id,
        matchScore: position.matchScore,
        strengths: position.reasons || [],
        risks: position.risks || [],
        nextSteps: position.nextSteps || [],
      }
    })
  }, [careerReport, recommendations])

  const handleContactChange = (field, value) => {
    setContact((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveSubmission = async () => {
    if (!userId) {
      openRegisterModal()
      return
    }

    if (!contact.phone.trim() && !contact.wechat.trim()) {
      setSaveState('error')
      setSaveMessage('如需人工校准，请至少填写手机号或微信号。')
      return
    }

    if (!contact.goal.trim()) {
      setSaveState('error')
      setSaveMessage('请说明你最想校准的问题，方便人工判断重点。')
      return
    }

    try {
      setSaveState('saving')
      setSaveMessage('')
      await saveAssessmentSubmission({
        contact,
        serviceBackground,
        answers,
        dimensionScores,
        overallScore,
        level: overallLevel,
        conclusion,
        recommendations: activeRecommendations,
      })
      await syncLocalPathProfile({
        name: contact.name || undefined,
        latest_assessment_score: overallScore,
        latest_assessment_level: overallLevel.label,
        career_stage: 'assessment_done',
        application_stage: 'assessed',
      })
      setSaveState('saved')
      setSaveMessage('人工校准需求已提交，我们会结合你的报告和问题进行查看。')
    } catch (error) {
      console.error('保存测评结果失败:', error)
      setSaveState('error')
      setSaveMessage(error?.message?.includes('ASSESSMENT_RATE_LIMITED')
        ? '保存次数过于频繁，请稍后再试。'
        : '暂时无法保存测评结果，请稍后重试。')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white px-6 pb-6 pt-12">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mb-5 flex items-center gap-1 text-sm text-slate-500"
          >
            <ChevronLeft size={17} />
            返回首页
          </button>
          <p className="mb-2 text-sm font-medium text-blue-700">测评报告</p>
          <h1 className="text-3xl font-bold leading-tight text-slate-950">海乘职业适配报告</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            根据你的基础条件、英语、服务经历、岗位偏好、船上适应力和求职准备度生成。
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pt-6">
        <section className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-700" />
            <div>
              <h2 className="font-semibold text-amber-950">AI 帮你缩小选择范围，但不替你做最终决定。</h2>
              <p className="mt-1 text-sm leading-relaxed text-amber-900">AI 测评结果仅作为岗位方向参考，不代表唯一或最终选择。实际决策还需要结合收入目标、英语水平、工作强度接受度、上船速度、职业发展和转岗计划综合判断。</p>
            </div>
          </div>
        </section>
        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">综合准备度</p>
              <div className="mt-1 flex items-end gap-2">
                <span className="text-5xl font-bold text-slate-950">{overallScore}</span>
                <span className="mb-1 text-lg font-semibold text-slate-400">/100</span>
              </div>
            </div>
            <span className={`rounded-full border px-3 py-1.5 text-sm font-medium ${getScoreColor(overallScore)}`}>
              {overallLevel.label}
            </span>
          </div>

          <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h2 className="font-bold text-blue-950">{conclusion.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-blue-900">{conclusion.summary}</p>
          </div>
        </section>

        <CareerReportPanel
          assessment={{ overallScore, level: overallLevel.label, serviceBackground, dimensionScores, careerReport, careerProfile: getSavedCareerProfile() }}
          fallbackRecommendations={recommendations}
          onReportGenerated={setCareerReport}
        />

        {careerReport && (
          <section className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="font-semibold text-emerald-950">报告已自动保存</p>
            <p className="mt-1 text-sm leading-relaxed text-emerald-900">无需再次填写联系方式。之后可从“我的 → 职业测评报告”回来查看，换设备登录后也会从云端恢复。</p>
          </section>
        )}

        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-bold text-slate-950">六维能力画像</h2>
          <div className="space-y-4">
            {DIMENSIONS.map((dimension) => {
              const score = dimensionScores[dimension.id] || 0

              return (
                <div key={dimension.id}>
                  <div className="mb-1 flex justify-between gap-3 text-sm">
                    <span className="text-slate-700">{dimensionLabels[dimension.id] || dimension.name}</span>
                    <span className="font-medium text-slate-900">{score}/100</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${score}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {!careerReport && (
          <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-950">先补充资料，获得更具体的岗位比较</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">上方的免费岗位方向分析会结合你的真实经历、目标和顾虑，解释哪些岗位值得优先比较、判断依据是什么，以及有哪些现实冲突需要先确认。</p>
          </section>
        )}

        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList size={20} className="text-blue-700" />
            <h2 className="font-bold text-slate-950">当前最该补的短板</h2>
          </div>
          <div className="space-y-4">
            {lowestDimensions.map((dimension) => (
              <div key={dimension.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-700">{dimension.name}</span>
                  <span className="font-medium text-slate-900">{dimension.score}/100</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${dimension.score}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            建议先补齐这两个维度，再进入简历优化和面试训练。这样比盲目投递更容易形成稳定路径。
          </p>
        </section>

        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 font-bold text-slate-950">需要人工校准或后续提醒？</h2>
          <p className="mb-4 text-sm leading-relaxed text-slate-600">
            此项完全选填，不影响报告保存。如希望人工协助比较岗位，请留下手机号或微信，并写清最想确认的问题。
          </p>
          <p className="mb-4 text-xs leading-5 text-slate-500">不要填写身份证号、银行卡号、密码等敏感信息。提交即表示你了解这些资料会按<a href="/service-info" className="font-medium text-blue-700 underline underline-offset-2">服务与数据说明</a>用于人工校准和后续联系。</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <input value={contact.name} onChange={(event) => handleContactChange('name', event.target.value)} placeholder="姓名" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            <input value={contact.phone} onChange={(event) => handleContactChange('phone', event.target.value)} placeholder="手机号" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            <input value={contact.wechat} onChange={(event) => handleContactChange('wechat', event.target.value)} placeholder="微信号" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            <input value={contact.email} readOnly aria-label="登录邮箱" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 outline-none" />
          </div>

          <textarea
            value={contact.goal}
            onChange={(event) => handleContactChange('goal', event.target.value)}
            placeholder="必填：你最想人工校准的问题，例如：尽快上船和收入上限之间该怎么选？"
            className="mt-3 min-h-24 w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          {saveMessage && (
            <p className={`mt-3 text-sm ${saveState === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
              {saveMessage}
            </p>
          )}

          <button
            type="button"
            onClick={handleSaveSubmission}
            disabled={saveState === 'saving' || saveState === 'saved'}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Save size={18} />
            {saveState === 'saving'
                ? '提交中...'
              : saveState === 'saved'
                ? '已提交人工校准需求'
                : userId ? '提交人工咨询需求' : '登录后提交人工咨询'}
          </button>
        </section>

        <section className="space-y-3">
          <button
            type="button"
            onClick={() => navigate('/tasks/Task2')}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700"
          >
            进入下一步：选择目标岗位
            <ArrowRight size={18} />
          </button>
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="w-full rounded-lg border border-slate-300 bg-white py-3 font-medium text-slate-700 transition hover:bg-slate-50"
          >
            查看完整申请路线
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('重新测评会清除当前本地结果，确定继续吗？')) {
                localStorage.removeItem('assessment_result')
                onRestart()
              }
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-3 font-medium text-slate-500 transition hover:bg-slate-100"
          >
            <RotateCcw size={17} />
            重新测评
          </button>
        </section>
      </main>
    </div>
  )
}
