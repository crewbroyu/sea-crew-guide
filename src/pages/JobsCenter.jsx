import { createElement, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileSearch,
  FileText,
  Globe,
  Map,
  Target,
} from 'lucide-react'

const primaryActions = [
  {
    title: '先测适合哪些岗位',
    description: '根据英语、经历和偏好生成岗位建议',
    route: '/assessment',
    icon: Target,
    primary: true,
  },
  {
    title: '查看完整申请路线',
    description: '按顺序准备简历、英语、面试和材料',
    route: '/tasks',
    icon: Map,
  },
]

const decisionCards = [
  {
    title: '岗位介绍',
    description: '了解免税店、餐厅、前台、客房等岗位差异',
    route: '/jobs/preparation',
    icon: Briefcase,
  },
  {
    title: '申请渠道',
    description: '比较官网、一代、中介、招聘平台和内推路线',
    route: '/jobs/channels',
    icon: Globe,
  },
  {
    title: '邮轮公司',
    description: '查看主要船公司官网和常见招聘入口',
    route: '/jobs/company-jobs',
    icon: Building2,
  },
  {
    title: '申请记录',
    description: '登录后管理投递、面试、Offer 和跟进状态',
    route: '/jobs/applications',
    icon: FileSearch,
  },
]

const preparationChecklist = [
  '先确定目标岗位，不要同时乱投太多方向',
  '英文简历要围绕岗位经历重写，不要只翻译中文简历',
  '投递前先准备 3-5 个英文服务案例',
  '优先比较低成本渠道，再决定是否找中介或内推',
]

function getJobSnapshot() {
  const task2Result = JSON.parse(localStorage.getItem('task2_result') || '{}')
  const progress = JSON.parse(localStorage.getItem('boarding_progress') || '{}')
  const applications = JSON.parse(localStorage.getItem('job_applications') || '[]')

  return {
    targetJob: task2Result.selectedTargetJob || task2Result.currentJob?.[0]?.name || '',
    hasResume: !!progress.task4?.completed,
    applicationCount: applications.length,
  }
}

export default function JobsCenter() {
  const navigate = useNavigate()
  const snapshot = useMemo(() => getJobSnapshot(), [])

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white px-6 pb-8 pt-12">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mb-5 flex items-center gap-1 text-sm text-slate-500"
          >
            <ChevronLeft size={17} />
            返回首页
          </button>

          <p className="mb-2 text-sm font-medium text-blue-700">求职中心</p>
          <h1 className="text-3xl font-bold leading-tight text-slate-950">
            先选对岗位，再开始投递
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            这里集中处理岗位判断、申请渠道、邮轮公司和投递记录。先做决策，再进入执行。
          </p>

          {snapshot.targetJob && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm text-blue-800">
              <Target size={15} />
              当前目标岗位：{snapshot.targetJob}
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {primaryActions.map(({ title, description, route, icon, primary }) => (
              <button
                key={title}
                type="button"
                onClick={() => navigate(route)}
                className={`rounded-lg px-5 py-4 text-left transition ${
                  primary
                    ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700'
                    : 'border border-slate-200 bg-slate-50 text-slate-900 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                        primary ? 'bg-white/15 text-white' : 'bg-white text-blue-700'
                      }`}
                    >
                      {createElement(icon, { size: 19 })}
                    </div>
                    <div>
                      <p className="font-semibold">{title}</p>
                      <p className={`mt-1 text-sm ${primary ? 'text-blue-100' : 'text-slate-500'}`}>
                        {description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={20} className={primary ? 'text-white' : 'text-slate-400'} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pt-6">
        <section className="mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-center shadow-sm">
            <p className="text-lg font-bold text-blue-700">{snapshot.targetJob ? '已选' : '未选'}</p>
            <p className="mt-1 text-xs text-slate-500">目标岗位</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-center shadow-sm">
            <p className="text-lg font-bold text-emerald-700">{snapshot.hasResume ? '已做' : '未做'}</p>
            <p className="mt-1 text-xs text-slate-500">英文简历</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-center shadow-sm">
            <p className="text-lg font-bold text-amber-600">{snapshot.applicationCount}</p>
            <p className="mt-1 text-xs text-slate-500">申请记录</p>
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-slate-950">求职决策入口</h2>
            <span className="text-sm text-slate-500">按需进入</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {decisionCards.map(({ title, description, route, icon }) => (
              <button
                key={title}
                type="button"
                onClick={() => navigate(route)}
                className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50 active:scale-[0.98]"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  {createElement(icon, { size: 20 })}
                </div>
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-8 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-950">投递前先检查这 4 件事</h2>
              <p className="mt-1 text-sm text-slate-500">
                不建议还没想清楚岗位和渠道就直接投递。
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {preparationChecklist.map((item) => (
              <div key={item} className="flex gap-2 text-sm leading-relaxed text-slate-700">
                <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-emerald-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg bg-slate-900 p-5 text-white">
          <div className="flex items-start gap-3">
            <BookOpen size={22} className="mt-0.5 text-blue-200" />
            <div className="flex-1">
              <h2 className="font-bold">还在早期了解阶段？</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-300">
                先看海乘百科和岗位介绍，再做测评。不要只看工资就决定投递方向。
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => navigate('/academy/wiki')}
                  className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-slate-950"
                >
                  查看海乘百科
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/tasks/phase2/Task4')}
                  className="flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white"
                >
                  准备英文简历
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
