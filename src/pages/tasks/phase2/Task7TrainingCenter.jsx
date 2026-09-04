import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Crown,
  Mic,
  Sparkles,
  Target,
} from 'lucide-react'
import { getInterviewPositionMeta } from '../../../utils/interviewPosition'
import { getMyProductUsage } from '../../../services/productUsageService'

const readJson = (key, fallback = {}) => {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch (error) {
    console.warn(`Unable to read ${key}:`, error)
    return fallback
  }
}

const getPosition = () => {
  const task2Result = readJson('task2_result')
  const selected = task2Result.selectedTargetJob || localStorage.getItem('interviewSelectedPosition')
  return getInterviewPositionMeta(selected) || (selected ? { nameZh: selected, nameEn: '目标岗位' } : null)
}

export default function Task7TrainingCenter() {
  const navigate = useNavigate()
  const position = useMemo(() => getPosition(), [])
  const progress = useMemo(() => readJson('boarding_progress'), [])
  const voiceResult = useMemo(() => readJson('task7_result', null), [])
  const voiceCompleted = Boolean(progress.task7?.completed)
  const mockCompleted = Boolean(progress.task7AiMock?.completed)
  const [usage, setUsage] = useState(null)

  useEffect(() => {
    if (position?.key !== 'bar_server') return undefined

    let active = true
    getMyProductUsage('bar_server_pack')
      .then((nextUsage) => { if (active) setUsage(nextUsage) })
      .catch((error) => console.warn('Unable to load AI usage status:', error))

    return () => { active = false }
  }, [position?.key])

  const trainingModes = [
    {
      id: 'question-bank',
      title: '岗位题库',
      description: '先看高频真题与考察重点，建立岗位回答框架。',
      meta: '适合第一次准备',
      action: '查看题库',
      route: '/academy/interview-questions',
      icon: BookOpenCheck,
      tone: 'slate',
      completed: false,
    },
    {
      id: 'voice-practice',
      title: '单题语音练习',
      description: '逐题录音、确认转写并获得针对性的 AI 改进建议。',
      meta: voiceResult?.evaluation?.overallScore
        ? `最近得分 ${voiceResult.evaluation.overallScore}/100`
        : '8 道题 · 可反复练习',
      action: voiceCompleted ? '继续练习' : '开始练习',
      route: '/tasks/phase2/Task7/voice',
      icon: Mic,
      tone: 'blue',
      completed: voiceCompleted,
    },
    {
      id: 'ai-mock',
      title: '完整 AI 模拟面试',
      description: '连续完成一轮英文面试，训练追问节奏和临场表达。',
      meta: '激活权益 · 约 10-15 分钟',
      action: mockCompleted ? '再次模拟' : '进入模拟',
      route: '/tasks/phase2/Task7/mock',
      icon: Sparkles,
      tone: 'amber',
      premium: true,
      completed: mockCompleted,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-5 pb-5 pt-12">
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
          >
            <ArrowLeft size={16} />
            返回路线
          </button>

          <p className="text-sm font-medium text-blue-700">任务 7/12 · 拿到 Offer</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">面试训练中心</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            从看题、单题开口到完整模拟都在这里完成。任务8将用于记录真正发生的船公司面试。
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-5 py-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Target size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500">当前训练岗位</p>
              <h2 className="mt-1 font-semibold text-slate-950">
                {position ? `${position.nameZh} · ${position.nameEn}` : '尚未选择目标岗位'}
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {position
                  ? '题库和AI反馈会围绕这个岗位组织。'
                  : '可以先预览训练方式，正式练习前建议在任务2确定岗位。'}
              </p>
            </div>
            {!position && (
              <button
                type="button"
                onClick={() => navigate('/tasks/Task2')}
                className="shrink-0 text-sm font-semibold text-blue-700"
              >
                去选择
              </button>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">单题练习</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                {voiceCompleted && <CheckCircle2 size={15} className="text-emerald-600" />}
                {voiceCompleted ? '已完成一轮' : '待开始'}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">完整模拟</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                {mockCompleted && <CheckCircle2 size={15} className="text-emerald-600" />}
                {mockCompleted ? '已有模拟记录' : '待开始'}
              </p>
            </div>
          </div>

          {position?.key === 'bar_server' && usage?.active && (
            <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-800">Bar Server 权益与 AI 额度</p>
              <div className="mt-2 grid grid-cols-2 gap-3 text-sm text-amber-950">
                <p>逐题反馈：{usage.feedback.limit === null ? '不限次' : `${usage.feedback.remaining}/${usage.feedback.limit} 剩余`}</p>
                <p>完整模拟：{usage.mockInterview.limit === null ? '不限次' : `${usage.mockInterview.remaining}/${usage.mockInterview.limit} 剩余`}</p>
              </div>
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-blue-700">选择训练方式</p>
              <h2 className="mt-1 font-semibold text-slate-950">按你现在的准备程度开始</h2>
            </div>
            <span className="text-xs text-slate-500">建议从上到下</span>
          </div>

          <div className="space-y-3">
            {trainingModes.map((mode) => {
              const Icon = mode.icon
              const toneClasses = {
                slate: 'bg-slate-100 text-slate-700',
                blue: 'bg-blue-50 text-blue-700',
                amber: 'bg-amber-50 text-amber-700',
              }

              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => navigate(mode.route)}
                  className="flex w-full items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:shadow"
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${toneClasses[mode.tone]}`}>
                    <Icon size={21} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-950">{mode.title}</h3>
                      {mode.premium && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                          <Crown size={12} /> 激活
                        </span>
                      )}
                      {mode.completed && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                          <CheckCircle2 size={13} /> 已完成
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{mode.description}</p>
                    <p className="mt-2 text-xs font-medium text-slate-500">{mode.meta}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-sm font-semibold text-blue-700">
                    <span className="hidden sm:inline">{mode.action}</span>
                    <ArrowRight size={17} />
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-950">训练和真实面试分开记录</p>
          <p className="mt-1 text-sm leading-6 text-blue-800">
            这里保存练习文字与AI评分；真正收到的面试邀请、现场问题和结果会进入任务8，便于后续跟进。
          </p>
        </section>
      </main>
    </div>
  )
}
