import { createElement, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Briefcase,
  Building2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Map,
  MessageSquare,
  Route,
  Sparkles,
  Target,
  UserCheck,
  X,
} from 'lucide-react'
import { useAccessStore } from '../store/accessStore'
import { getScoreData } from '../store/scoreStore'
import pathData from '../data/pathData'

const taskRoutes = {
  1: '/assessment',
  2: '/tasks/Task2',
  3: '/tasks/Task3',
  4: '/tasks/phase2/Task4',
  5: '/tasks/phase2/Task5',
  6: '/tasks/phase2/Task6',
  7: '/tasks/phase2/Task7',
  8: '/tasks/phase2/Task8',
  9: '/my-offer',
  10: '/tasks/Task10',
  11: '/tasks/Task11',
  12: '/tasks/Task12',
}

const publicLinks = [
  {
    label: '海乘百科',
    description: '先看清工资、合同、休假和船上生活',
    route: '/academy/wiki',
    icon: BookOpen,
  },
  {
    label: '岗位介绍',
    description: '免税店、餐厅、前台、客房等方向',
    route: '/jobs',
    icon: Briefcase,
  },
  {
    label: '申请渠道',
    description: '中介、一代、官网和低成本路线',
    route: '/jobs/channels',
    icon: Map,
  },
  {
    label: '英语预习',
    description: '先试学岗位英语和服务表达',
    route: '/academy/listening-speaking',
    icon: GraduationCap,
  },
]

const routeSteps = [
  { label: '判断适不适合', description: '完成职业适配测评', route: '/assessment', icon: UserCheck },
  { label: '选目标岗位', description: '匹配岗位和风险', route: '/tasks/Task2', icon: Target },
  { label: '准备材料', description: '简历、英语和面试', route: '/tasks', icon: FileText },
  { label: '开始申请', description: '渠道、证件和登船', route: '/jobs/channels', icon: ClipboardCheck },
]

const serviceLinks = [
  {
    label: '生成职业路线',
    description: '了解完整路线报告、简历优化和 AI 面试训练',
    icon: Sparkles,
    route: '/premium',
  },
  {
    label: '英文简历优化',
    description: '把经历整理成更像邮轮岗位的英文简历',
    icon: FileText,
    route: '/tasks/phase2/Task4',
  },
  {
    label: '人工咨询',
    description: '需要具体判断申请路线时，再一对一沟通',
    icon: MessageSquare,
    action: 'wechat',
  },
]

const getHomeSnapshot = () => {
  const progress = JSON.parse(localStorage.getItem('boarding_progress') || '{}')
  const allTasks = pathData.flatMap((stage) => stage.tasks)
  const currentTask = allTasks.find((task) => !progress[`task${task.id}`]?.completed) || allTasks[0]
  const currentStage =
    pathData.find((stage) => stage.tasks.some((task) => task.id === currentTask?.id)) || pathData[0]
  const completedCount = allTasks.filter((task) => progress[`task${task.id}`]?.completed).length
  const task2Result = JSON.parse(localStorage.getItem('task2_result') || '{}')
  const targetJob = task2Result.selectedTargetJob || task2Result.currentJob?.[0]?.name || ''

  return {
    currentTask,
    currentStage,
    completedCount,
    totalTasks: allTasks.length,
    targetJob,
    scoreData: getScoreData(),
  }
}

export default function Home() {
  const navigate = useNavigate()
  const { isRegistered } = useAccessStore()
  const [showWechatModal, setShowWechatModal] = useState(false)
  const snapshot = useMemo(() => getHomeSnapshot(), [])

  const handleServiceClick = (item) => {
    if (item.action === 'wechat') {
      setShowWechatModal(true)
      return
    }

    navigate(item.route)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-white px-6 pt-12 pb-8 border-b border-slate-200">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm font-medium text-blue-700 mb-3">Crew PathGuide</p>
          <h1 className="text-3xl font-bold text-slate-950 leading-tight">
            先判断适不适合，再准备海乘申请
          </h1>
          <p className="text-slate-600 mt-3 leading-relaxed">
            用百科建立认知，用测评找到岗位方向，再按路线准备简历、英语、面试和登船材料。
          </p>

          {snapshot.targetJob && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm text-blue-800">
              <Target size={15} />
              当前目标岗位：{snapshot.targetJob}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => navigate('/assessment')}
              className="rounded-lg bg-blue-600 px-5 py-4 text-left text-white shadow-sm transition hover:bg-blue-700"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">测测我适合哪些岗位</p>
                  <p className="mt-1 text-sm text-blue-100">5-8 分钟生成职业适配报告</p>
                </div>
                <ChevronRight size={22} />
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate('/academy/wiki')}
              className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4 text-left transition hover:bg-white"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">先了解海乘真实情况</p>
                  <p className="mt-1 text-sm text-slate-500">工资、合同、岗位和常见误区</p>
                </div>
                <ChevronRight size={22} className="text-slate-400" />
              </div>
            </button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-6">
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-slate-950">先免费了解</h2>
            <button
              type="button"
              onClick={() => navigate('/academy')}
              className="flex items-center gap-1 text-sm text-blue-700"
            >
              海乘学院
              <ChevronRight size={15} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {publicLinks.map(({ label, description, route, icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => navigate(route)}
                className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.98]"
              >
                {createElement(icon, { size: 20, className: 'mb-3 text-blue-700' })}
                <p className="text-sm font-semibold text-slate-900">{label}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-bold text-slate-950">从了解海乘到准备登船</h2>
              <p className="mt-1 text-sm text-slate-500">
                首页只保留主路径，详细任务放到路线页里继续做。
              </p>
            </div>
            <Route size={22} className="text-blue-700" />
          </div>

          <div className="space-y-3">
            {routeSteps.map(({ label, description, route, icon }, index) => (
              <button
                key={label}
                type="button"
                onClick={() => navigate(route)}
                className="flex w-full items-center gap-3 rounded-lg bg-slate-50 p-3 text-left transition hover:bg-blue-50"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-700">
                  {createElement(icon, { size: 18 })}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {index + 1}. {label}
                  </p>
                  <p className="text-xs text-slate-500">{description}</p>
                </div>
                <ChevronRight size={17} className="text-slate-400" />
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-950">
                {isRegistered ? '你的申请进度' : '个性化功能'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {isRegistered ? '继续你当前最该完成的一步' : '登录后保存测评、岗位、简历和任务进度'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(isRegistered ? '/profile' : '/tasks')}
              className="text-sm text-blue-700"
            >
              查看
            </button>
          </div>

          {isRegistered ? (
            <>
              <div className="mb-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xl font-bold text-blue-700">{snapshot.completedCount}</p>
                  <p className="mt-1 text-xs text-slate-500">完成任务</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xl font-bold text-emerald-700">{snapshot.scoreData?.totalScore || 0}</p>
                  <p className="mt-1 text-xs text-slate-500">积分</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xl font-bold text-amber-600">{snapshot.scoreData?.continuousDays || 0}</p>
                  <p className="mt-1 text-xs text-slate-500">连续打卡</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate(taskRoutes[snapshot.currentTask?.id] || '/tasks')}
                className="flex w-full items-center justify-between rounded-lg bg-blue-600 px-4 py-3 text-left text-white transition hover:bg-blue-700"
              >
                <span>
                  <span className="block text-sm text-blue-100">
                    第 {snapshot.currentStage?.id || 1} 阶段 · {snapshot.currentStage?.name}
                  </span>
                  <span className="font-semibold">{snapshot.currentTask?.title || '继续申请路线'}</span>
                </span>
                <ChevronRight size={20} />
              </button>
            </>
          ) : (
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                你可以先免费浏览内容。只有保存进度、简历、个人中心和申请记录时才需要登录。
              </p>
              <button
                type="button"
                onClick={() => navigate('/assessment')}
                className="mt-4 w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700"
              >
                先做一次职业测评
              </button>
            </div>
          )}
        </section>

        <section className="mb-8">
          <h2 className="mb-3 font-bold text-slate-950">需要更具体的帮助</h2>
          <div className="space-y-3">
            {serviceLinks.map((item) => {
              const Icon = item.icon

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleServiceClick(item)}
                  className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.98]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{item.label}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{item.description}</p>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-lg bg-slate-900 p-5 text-white">
          <div className="flex items-start gap-3">
            <Building2 size={22} className="mt-0.5 text-blue-200" />
            <div>
              <h2 className="font-bold">还不确定要不要做海乘？</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-300">
                先看百科和岗位介绍，再做测评。不要一上来就花钱，也不要只看工资就决定。
              </p>
              <button
                type="button"
                onClick={() => navigate('/academy/wiki')}
                className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950"
              >
                从入门百科开始
              </button>
            </div>
          </div>
        </section>
      </main>

      {showWechatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">人工咨询</h3>
              <button
                type="button"
                onClick={() => setShowWechatModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              这里建议后续放你的微信号或二维码。当前首页先把咨询作为最后一步，不在用户还没了解清楚时过早打扰。
            </p>
            <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              适合咨询的问题：岗位选择、简历方向、申请渠道、时间规划。
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
