import { createElement, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Lock,
  MessageSquare,
  Route,
  ShieldCheck,
  Target,
} from 'lucide-react'
import pathData from '../data/pathData'
import { getMyPathProfile, syncLocalPathProfile, writeLocalTaskProgress } from '../services/userPathService'

const stageMeta = {
  1: {
    label: '职业判断',
    summary: '先确认适不适合，再决定目标岗位和申请方式。',
    icon: Target,
  },
  2: {
    label: '能力准备',
    summary: '把经历、英语和面试表达准备成可投递状态。',
    icon: FileText,
  },
  3: {
    label: '拿到 Offer',
    summary: '完成模拟训练，跟进真实面试并记录结果。',
    icon: MessageSquare,
  },
  4: {
    label: '登船启航',
    summary: '完成证件、签证和登船物品准备。',
    icon: ShieldCheck,
  },
}

function readCompletedTasks() {
  const progress = JSON.parse(localStorage.getItem('boarding_progress') || '{}')
  const completed = []

  for (let taskId = 1; taskId <= 12; taskId += 1) {
    if (progress[`task${taskId}`]?.completed) {
      completed.push(taskId)
    }
  }

  const justCompletedId = Number(new URLSearchParams(window.location.search).get('justCompleted'))
  if (justCompletedId && !completed.includes(justCompletedId)) {
    completed.push(justCompletedId)
  }

  return completed
}

function getCompletedFromProgress(progress = {}) {
  const completed = []

  for (let taskId = 1; taskId <= 12; taskId += 1) {
    if (progress[`task${taskId}`]?.completed) {
      completed.push(taskId)
    }
  }

  return completed
}

function mergeProgress(localProgress = {}, remoteProgress = {}) {
  const merged = { ...remoteProgress }

  for (let taskId = 1; taskId <= 12; taskId += 1) {
    const key = `task${taskId}`
    const localTask = localProgress[key]
    const remoteTask = remoteProgress[key]

    if (localTask?.completed || remoteTask?.completed) {
      merged[key] = {
        ...remoteTask,
        ...localTask,
        completed: true,
        completedAt: localTask?.completedAt || remoteTask?.completedAt || new Date().toISOString(),
      }
    }
  }

  return merged
}

function persistCompletedTasks(completedTasks) {
  const progress = JSON.parse(localStorage.getItem('boarding_progress') || '{}')

  completedTasks.forEach((taskId) => {
    progress[`task${taskId}`] = {
      completed: true,
      completedAt: progress[`task${taskId}`]?.completedAt || new Date().toISOString(),
    }
  })

  Object.keys(progress).forEach((key) => {
    const taskId = Number(key.replace('task', ''))
    if (taskId && !completedTasks.includes(taskId)) {
      progress[key] = {
        ...progress[key],
        completed: false,
      }
    }
  })

  localStorage.setItem('boarding_progress', JSON.stringify(progress))
}

function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return undefined
    const timer = setTimeout(onClose, 1800)
    return () => clearTimeout(timer)
  }, [message, onClose])

  if (!message) return null

  return (
    <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-5 py-3 text-sm text-white shadow-lg">
      {message}
    </div>
  )
}

function getTaskAction(status) {
  if (status === 'completed') return '查看'
  if (status === 'current') return '继续'
  return '预览'
}

function getTaskStatus(task, currentTaskId, completedTasks) {
  if (completedTasks.includes(task.id)) return 'completed'
  if (task.id === currentTaskId) return 'current'
  return 'upcoming'
}

export default function Tasks() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [completedTasks, setCompletedTasks] = useState(readCompletedTasks)
  const [hasHydratedProgress, setHasHydratedProgress] = useState(false)
  const [toast, setToast] = useState('')

  const allTasks = useMemo(() => pathData.flatMap((stage) => stage.tasks), [])
  const totalTasks = allTasks.length
  const currentTask = allTasks.find((task) => !completedTasks.includes(task.id)) || null
  const currentTaskId = currentTask?.id || null
  const currentStage =
    pathData.find((stage) => stage.tasks.some((task) => task.id === currentTaskId)) ||
    pathData[pathData.length - 1]
  const progressPercentage = totalTasks ? Math.round((completedTasks.length / totalTasks) * 100) : 0

  useEffect(() => {
    if (searchParams.has('justCompleted')) {
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    let isMounted = true

    const hydrateProgress = async () => {
      try {
        const remoteProfile = await getMyPathProfile()
        if (!isMounted) return

        const remoteProgress = remoteProfile?.task_progress || {}
        const localProgress = JSON.parse(localStorage.getItem('boarding_progress') || '{}')
        const mergedProgress = mergeProgress(localProgress, remoteProgress)
        const mergedCompletedTasks = getCompletedFromProgress(mergedProgress)

        if (mergedCompletedTasks.length > 0) {
          writeLocalTaskProgress(mergedProgress)
          setCompletedTasks(mergedCompletedTasks)
        }
      } catch (error) {
        console.warn('Unable to hydrate task progress:', error)
      } finally {
        if (isMounted) {
          setHasHydratedProgress(true)
        }
      }
    }

    hydrateProgress()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!hasHydratedProgress) return

    persistCompletedTasks(completedTasks)
    syncLocalPathProfile()
  }, [completedTasks, hasHydratedProgress])

  const showToast = useCallback((message) => {
    setToast(message)
  }, [])

  const handleTaskClick = (task) => {
    const route = task.route

    if (!route) {
      showToast('这个功能还在整理中')
      return
    }

    navigate(route)
  }

  const handleMarkCurrentDone = () => {
    if (!currentTaskId) {
      showToast('所有任务都已完成')
      return
    }

    setCompletedTasks((prev) => (prev.includes(currentTaskId) ? prev : [...prev, currentTaskId]))
    showToast('已更新当前进度')
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Toast message={toast} onClose={() => setToast('')} />

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

          <p className="mb-2 text-sm font-medium text-blue-700">申请进度中心</p>
          <h1 className="text-3xl font-bold leading-tight text-slate-950">
            按顺序准备海乘申请
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            这里不需要一次做完。先完成当前最重要的一步，再进入下一阶段。
          </p>

          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">总进度</span>
              <span className="text-slate-500">
                {completedTasks.length}/{totalTasks} · {progressPercentage}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pt-6">
        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Route size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-500">当前下一步</p>
              <h2 className="mt-1 text-lg font-bold text-slate-950">
                {currentTask ? currentTask.title : '全部任务已完成'}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                {currentTask
                  ? currentTask.subtitle
                  : '你已经完成这条路线，可以回到个人中心查看完整申请进度。'}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => (currentTask ? handleTaskClick(currentTask) : navigate('/profile'))}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700"
            >
              {currentTask ? '继续当前任务' : '查看个人中心'}
              <ArrowRight size={18} />
            </button>
            {currentTask && (
              <button
                type="button"
                onClick={handleMarkCurrentDone}
                className="rounded-lg border border-slate-300 bg-white py-3 font-medium text-slate-700 transition hover:bg-slate-50"
              >
                标记当前步骤已完成
              </button>
            )}
          </div>
        </section>

        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-slate-950">四阶段路线</h2>
            <span className="text-sm text-slate-500">可预览后续步骤</span>
          </div>

          <div className="space-y-4">
            {pathData.map((stage) => {
              const meta = stageMeta[stage.id] || {
                label: stage.name,
                summary: '',
                icon: ClipboardCheck,
              }
              const done = stage.tasks.filter((task) => completedTasks.includes(task.id)).length
              const isCurrentStage = stage.id === currentStage?.id
              const isFutureStage = currentStage?.id && stage.id > currentStage.id

              return (
                <article
                  key={stage.id}
                  className={`rounded-lg border bg-white p-5 shadow-sm ${
                    isCurrentStage ? 'border-blue-200' : 'border-slate-200'
                  }`}
                >
                  <div className="mb-4 flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        isCurrentStage ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-600'
                      }`}
                    >
                      {createElement(meta.icon, { size: 20 })}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-950">
                          {stage.id}. {meta.label}
                        </h3>
                        {isFutureStage && <Lock size={14} className="text-slate-400" />}
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-slate-500">{meta.summary}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {done}/{stage.tasks.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {stage.tasks.map((task) => {
                      const status = getTaskStatus(task, currentTaskId, completedTasks)
                      const isCompleted = status === 'completed'
                      const isCurrent = status === 'current'

                      return (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => handleTaskClick(task)}
                          className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition ${
                            isCurrent ? 'bg-blue-50' : 'bg-slate-50 hover:bg-blue-50'
                          }`}
                        >
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-full ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-700'
                                : isCurrent
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-slate-400'
                            }`}
                          >
                            {isCompleted ? <CheckCircle2 size={16} /> : <span className="text-xs">{task.id}</span>}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                              {task.subtitle}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              isCompleted
                                ? 'bg-emerald-50 text-emerald-700'
                                : isCurrent
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white text-slate-500'
                            }`}
                          >
                            {getTaskAction(status)}
                          </span>
                          <ChevronRight size={16} className="text-slate-400" />
                        </button>
                      )
                    })}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}
