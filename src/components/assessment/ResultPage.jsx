import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  Lock,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { DIMENSIONS } from '../../data/assessmentData'
import { getCareerConclusion, getLevel } from '../../data/assessmentScoring'
import { useAccessStore } from '../../store/accessStore'
import { saveAssessmentSubmission } from '../../services/assessmentService'
import { syncLocalPathProfile } from '../../services/userPathService'

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
    detailRoute: '/jobs',
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

const premiumReportItems = [
  {
    title: '90 天准备路线',
    description: '按当前短板拆成英语、岗位知识、简历和面试四条执行线。',
  },
  {
    title: '英文简历修改方向',
    description: '告诉你哪些经历应该放大，哪些表达需要改成邮轮岗位语言。',
  },
  {
    title: '面试训练重点',
    description: '根据目标岗位判断该先练服务案例、销售案例、客诉处理还是英文表达。',
  },
  {
    title: '申请渠道建议',
    description: '判断更适合低成本 DIY、指导型 DIY，还是需要更稳妥的渠道支持。',
  },
]

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

export default function ResultPage({
  dimensionScores,
  overallScore,
  serviceBackground,
  answers,
  onRestart,
}) {
  const navigate = useNavigate()
  const { userId, userEmail, isRegistered, isUnlocked, openRegisterModal } = useAccessStore()
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
          recommendations: recommendations.map((job) => ({
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

  const handleContactChange = (field, value) => {
    setContact((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveSubmission = async () => {
    if (!contact.name.trim() && !contact.phone.trim() && !contact.wechat.trim() && !contact.email.trim()) {
      setSaveState('error')
      setSaveMessage('请至少填写一种联系方式，方便后续查看和跟进测评结果。')
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
        conclusion,
        recommendations,
      })
      await syncLocalPathProfile({
        name: contact.name || undefined,
        latest_assessment_score: overallScore,
        latest_assessment_level: overallLevel.label,
        career_stage: 'assessment_done',
        application_stage: 'assessed',
      })
      setSaveState('saved')
      setSaveMessage('已保存。你可以在 Supabase 后台查看这条测评记录。')
    } catch (error) {
      console.error('保存测评结果失败:', error)
      setSaveState('error')
      setSaveMessage('保存失败。请确认 Supabase 已创建 assessment_submissions 表和 insert policy。')
    }
  }

  const handlePremiumAction = () => {
    if (!isRegistered) {
      openRegisterModal()
      return
    }

    if (!isUnlocked) {
      navigate('/premium')
      return
    }

    navigate('/profile')
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

        <section className="mb-6 overflow-hidden rounded-lg border border-blue-200 bg-white shadow-sm">
          <div className="border-b border-blue-100 bg-blue-50 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700">
                {isUnlocked ? <ShieldCheck size={21} /> : <Lock size={21} />}
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">付费核心</p>
                <h2 className="mt-1 font-bold text-slate-950">完整职业路线报告</h2>
                <p className="mt-1 text-sm leading-relaxed text-blue-900">
                  基础测评告诉你适合什么岗位，完整报告解决下一步怎么准备、怎么申请、哪里最容易卡住。
                </p>
              </div>
            </div>
          </div>

          {!isUnlocked ? (
            <div className="p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {premiumReportItems.map((item) => (
                  <div key={item.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <Sparkles size={16} className="text-blue-600" />
                      <h3 className="text-sm font-semibold text-slate-950">{item.title}</h3>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600">{item.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-lg border border-dashed border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-medium text-blue-950">你当前可预览的结论</p>
                <p className="mt-1 text-sm leading-relaxed text-blue-900">
                  优先岗位是 {recommendations[0]?.title || '待确认岗位'}，最需要补的是 {lowestDimensions[0]?.name || '当前短板'}。
                  激活后再生成完整 90 天路线、简历方向、面试训练重点和申请策略。
                </p>
              </div>

              <button
                type="button"
                onClick={handlePremiumAction}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700"
              >
                {isRegistered ? '查看激活方式' : '登录后解锁完整报告'}
                <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div className="p-5">
              <div className="space-y-3">
                {routePlan.map((phase) => (
                  <article key={phase.period} className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs font-medium text-blue-700">{phase.period}</p>
                    <h3 className="mt-1 font-semibold text-slate-950">{phase.title}</h3>
                    <div className="mt-3 space-y-2">
                      {phase.tasks.map((task) => (
                        <div key={task} className="flex gap-2 text-sm leading-relaxed text-slate-700">
                          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                          <span>{task}</span>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>

              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700"
              >
                保存到申请进度中心
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </section>

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

        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <Briefcase size={20} className="text-blue-700" />
            <h2 className="font-bold text-slate-950">推荐岗位 Top 3</h2>
          </div>

          <div className="space-y-3">
            {recommendations.map((job, index) => (
              <article key={job.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="mb-1 text-xs font-medium text-blue-700">推荐 {index + 1}</p>
                    <h3 className="font-bold text-slate-950">{job.title}</h3>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${getScoreColor(job.matchScore)}`}>
                    {job.matchScore}%
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-medium text-slate-500">为什么适合</p>
                    <ul className="space-y-1.5">
                      {job.strengths.map((item) => (
                        <li key={item} className="flex gap-1.5 text-xs leading-relaxed text-slate-700">
                          <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0 text-emerald-600" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg bg-amber-50 p-3">
                    <p className="mb-2 text-xs font-medium text-amber-700">提前知道的风险</p>
                    <ul className="space-y-1.5">
                      {job.risks.map((item) => (
                        <li key={item} className="flex gap-1.5 text-xs leading-relaxed text-amber-800">
                          <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium text-slate-500">下一步建议</p>
                  <div className="space-y-1.5">
                    {job.nextSteps.map((step) => (
                      <div key={step} className="flex items-center gap-2 text-sm text-slate-700">
                        <CheckCircle2 size={15} className="text-emerald-600" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(job.detailRoute)}
                  className="mt-4 w-full rounded-lg border border-slate-300 bg-white py-2.5 font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  查看岗位介绍
                </button>
              </article>
            ))}
          </div>
        </section>

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
          <h2 className="mb-2 font-bold text-slate-950">保存报告，后续生成职业路线</h2>
          <p className="mb-4 text-sm leading-relaxed text-slate-600">
            填写联系方式后，这份结果会保存到后台，后续可用于职业路线、简历建议、面试准备计划和找搭子匹配。
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <input value={contact.name} onChange={(event) => handleContactChange('name', event.target.value)} placeholder="姓名" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            <input value={contact.phone} onChange={(event) => handleContactChange('phone', event.target.value)} placeholder="手机号" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            <input value={contact.wechat} onChange={(event) => handleContactChange('wechat', event.target.value)} placeholder="微信号" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            <input value={contact.email} onChange={(event) => handleContactChange('email', event.target.value)} placeholder="邮箱" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>

          <textarea
            value={contact.goal}
            onChange={(event) => handleContactChange('goal', event.target.value)}
            placeholder="你的目标或问题，例如：想半年内登船、想做免税店、英语一般不知道怎么准备"
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
            {saveState === 'saving' ? '保存中...' : saveState === 'saved' ? '已保存报告' : '保存我的测评报告'}
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
