import { createElement, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileSearch,
  Globe,
  MessageSquareText,
  Mic2,
  Radio,
  Target,
} from 'lucide-react'
import { listJobApplications } from '../services/jobApplicationService'

const interviewActions = [
  {
    title: '准备个人面试答案',
    description: '任务6：把真实经历整理成岗位动机、服务案例和压力案例。',
    route: '/tasks/phase2/Task6',
    icon: MessageSquareText,
    progressKey: 'task6',
  },
  {
    title: 'AI 模拟面试',
    description: '由招聘官连续提问，训练临场表达并生成完整评估。',
    route: '/tasks/phase2/Task7/mock',
    icon: Mic2,
    progressKey: 'task7AiMock',
  },
  {
    title: '真实面试跟进',
    description: '任务8：记录面试邀请、现场问题、反馈和下一步。',
    route: '/tasks/phase2/Task8',
    icon: ClipboardList,
    progressKey: 'task8',
  },
]

const applicationActions = [
  {
    title: '申请渠道',
    description: '比较官网、一代、中介、招聘平台和内推路线',
    route: '/jobs/channels',
    icon: Globe,
  },
  {
    title: '邮轮公司官网',
    description: '查看主要船公司的官方招聘入口',
    route: '/jobs/company-jobs',
    icon: Building2,
  },
  {
    title: '招聘平台',
    description: '集中查看常见国际邮轮招聘网站',
    route: '/jobs/platforms',
    icon: Radio,
  },
  {
    title: '最新招聘',
    description: '查看已整理并标注来源的招聘动态',
    route: '/jobs/latest',
    icon: FileSearch,
  },
  {
    title: '我的申请记录',
    description: '管理投递、等待回复、面试和 Offer 状态',
    route: '/jobs/applications',
    icon: ClipboardList,
  },
]

const readJson = (key, fallback = {}) => {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function getJobSnapshot() {
  const task2Result = readJson('task2_result')
  const progress = readJson('boarding_progress')
  const applications = readJson('job_applications', [])

  return {
    targetJob: task2Result.selectedTargetJob || task2Result.currentJob?.[0]?.name || '',
    hasResume: Boolean(progress.task4?.completed),
    taskProgress: progress,
    applicationCount: applications.length,
  }
}

const getPrimaryAction = (snapshot) => {
  if (!snapshot.targetJob) {
    return {
      label: '先完成免费决策',
      title: '确定主申岗位和申请路线',
      description: '先完成路径中的岗位选择与路线判断，后面的面试准备才有明确方向。',
      route: '/tasks',
    }
  }
  if (!snapshot.taskProgress.task3?.completed) {
    return {
      label: '免费决策还差一步',
      title: '确定适合你的申请路线',
      description: '根据预算、时间和执行能力，判断 DIY、指导型 DIY 或中介辅助路线。',
      route: '/tasks/Task3',
    }
  }
  if (!snapshot.hasResume) {
    return {
      label: '当前求职准备',
      title: '先完成目标岗位英文简历',
      description: '简历中的经历会成为个人面试答案和 AI 追问的重要素材。',
      route: '/tasks/phase2/Task4',
    }
  }
  if (!snapshot.taskProgress.task6?.completed) {
    return {
      label: '当前面试准备',
      title: '整理个人面试答案',
      description: '先把岗位动机和真实经历整理清楚，再进入完整模拟。',
      route: '/tasks/phase2/Task6',
    }
  }
  if (!snapshot.taskProgress.task7AiMock?.completed) {
    return {
      label: '下一步',
      title: '完成一次 AI 模拟面试',
      description: '用连续追问检查岗位理解、经历表达和英文临场反应。',
      route: '/tasks/phase2/Task7/mock',
    }
  }
  return {
    label: '开始申请执行',
    title: '选择渠道并记录投递',
    description: '面试准备已有基础，现在开始投递并持续记录反馈。',
    route: '/jobs/channels',
  }
}

export default function JobsCenter() {
  const navigate = useNavigate()
  const initialSnapshot = useMemo(() => getJobSnapshot(), [])
  const [snapshot, setSnapshot] = useState(initialSnapshot)
  const primaryAction = getPrimaryAction(snapshot)

  useEffect(() => {
    let active = true

    listJobApplications()
      .then((applications) => {
        if (active) setSnapshot((current) => ({ ...current, applicationCount: applications.length }))
      })
      .catch((error) => console.error('加载申请记录统计失败:', error))

    return () => { active = false }
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white px-6 pb-7 pt-12">
        <div className="mx-auto max-w-4xl">
          <button type="button" onClick={() => navigate('/')} className="mb-5 flex items-center gap-1 text-sm text-slate-500">
            <ChevronLeft size={17} />返回首页
          </button>
          <p className="text-sm font-medium text-blue-700">求职中心</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-slate-950">从面试准备到申请跟进</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            岗位能力在学院训练；这里把个人经历整理成面试表现，再选择渠道、投递并跟进结果。
          </p>
          {snapshot.targetJob && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm text-blue-800">
              <Target size={15} />当前主申岗位：{snapshot.targetJob}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-6 py-6">
        <section className="border-l-4 border-blue-600 bg-white px-5 py-5 shadow-sm">
          <p className="text-xs font-semibold text-blue-700">{primaryAction.label}</p>
          <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-950">{primaryAction.title}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{primaryAction.description}</p>
            </div>
            <button type="button" onClick={() => navigate(primaryAction.route)} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">
              去完成<ArrowRight size={16} />
            </button>
          </div>
        </section>

        <section>
          <div className="mb-3">
            <p className="text-xs font-medium text-blue-700">准备通过面试</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">面试准备与复盘</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {interviewActions.map((item) => {
              const completed = Boolean(snapshot.taskProgress[item.progressKey]?.completed)
              return (
                <button key={item.title} type="button" onClick={() => navigate(item.route)} className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">{createElement(item.icon, { size: 20 })}</div>
                    {completed && <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 size={14} />已完成</span>}
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-950">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-blue-700">把准备变成结果</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">申请执行</h2>
            </div>
            <span className="text-sm text-slate-500">已记录 {snapshot.applicationCount} 次申请</span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {applicationActions.map((item) => (
              <button key={item.title} type="button" onClick={() => navigate(item.route)} className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-blue-700">{createElement(item.icon, { size: 20 })}</div>
                <h3 className="text-sm font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-200 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <BookOpen size={20} className="mt-0.5 shrink-0 text-blue-700" />
              <div>
                <h2 className="font-semibold text-slate-950">岗位知识或口语还不稳？</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">回海乘学院学习目标岗位课程、单题口语和真实工作场景。</p>
              </div>
            </div>
            <button type="button" onClick={() => navigate('/academy/position-english')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 hover:bg-blue-50">
              进入岗位课程<ChevronRight size={16} />
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
