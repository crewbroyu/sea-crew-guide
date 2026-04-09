import { useState, useEffect, useCallback, useRef, createElement } from 'react'
import useAuthStore from '../store/useAuthStore'
import { useNavigate } from 'react-router-dom'
import { completeTask as completeTaskRequest, getMyTasks, getTasks, initMyTasks } from '../services/taskService'
import {
  ChevronLeft, ChevronRight, Check, Lock, Play,
  X, Zap, Sparkles, ClipboardCheck, BookOpen, Target, Upload
} from 'lucide-react'

const stageConfig = [
  { id: 1, name: '认知启航', emoji: '🧭', gradient: 'from-blue-500 to-cyan-400', badgeBg: 'bg-blue-500/15', badgeText: 'text-blue-400' },
  { id: 2, name: '能力储备', emoji: '📚', gradient: 'from-violet-500 to-purple-400', badgeBg: 'bg-purple-500/15', badgeText: 'text-purple-400' },
  { id: 3, name: '实战冲刺', emoji: '🎯', gradient: 'from-orange-500 to-amber-400', badgeBg: 'bg-orange-500/15', badgeText: 'text-orange-400' },
  { id: 4, name: '扬帆起航', emoji: '🚢', gradient: 'from-emerald-500 to-teal-400', badgeBg: 'bg-emerald-500/15', badgeText: 'text-emerald-400' },
]

const taskTypeConfig = {
  assessment: { icon: ClipboardCheck, label: '测评', action: '开始测评' },
  action: { icon: Target, label: '行动', action: '完成任务' },
  learn: { icon: BookOpen, label: '学习', action: '开始学习' },
  upload: { icon: Upload, label: '上传', action: '上传文件' },
}

export default function Tasks() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [userTasks, setUserTasks] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState(null)
  const [completing, setCompleting] = useState(false)
  const initializingRef = useRef(false)
  const [showReward, setShowReward] = useState(null)

  const initUserTasks = useCallback(async (tasksData) => {
    if (initializingRef.current) return null
    initializingRef.current = true
    try {
      const records = tasksData.map((t, i) => ({
        user_id: user.id,
        task_id: t.id,
        status: i === 0 ? 'active' : 'locked'
      }))
      const data = await initMyTasks(records)
      if (data) {
        const map = {}
        data.forEach(ut => map[ut.task_id] = ut.status)
        setUserTasks(map)
      }
      return data
    } finally {
      initializingRef.current = false
    }
  }, [user?.id])

  const fetchData = useCallback(async () => {
    if (!user?.id) return
    try {
      const [tasksRes, utRes] = await Promise.all([
        getTasks(),
        getMyTasks(),
      ])

      const tasksData = tasksRes || []
      setTasks(tasksData)

      const utData = utRes || []
      if (utData.length === 0 && tasksData.length > 0) {
        await initUserTasks(tasksData)
      } else if (utData.length > 0) {
        const map = {}
        utData.forEach(ut => map[ut.task_id] = ut.status)
        setUserTasks(map)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }, [initUserTasks, user?.id])

  useEffect(() => {
    if (user?.id) fetchData()
  }, [fetchData, user?.id])

  const getStatus = (id) => userTasks[id] || 'locked'

  const completeTask = async (task) => {
    if (completing) return
    setCompleting(true)
    try {
      await completeTaskRequest(task.id)

      setSelectedTask(null)
      setShowReward({ xp: task.xp_reward, title: task.title })
      setTimeout(() => setShowReward(null), 2500)
      await fetchData()
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setCompleting(false)
    }
  }

  const completedCount = tasks.filter(t => getStatus(t.id) === 'completed').length
  const totalXP = tasks.filter(t => getStatus(t.id) === 'completed').reduce((sum, t) => sum + t.xp_reward, 0)
  const currentStage = tasks.find(t => getStatus(t.id) === 'active')?.stage || (completedCount === tasks.length ? 5 : 1)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60 text-sm">加载任务地图...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate('/')} className="p-1.5 rounded-xl bg-white/5 text-white/70">
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-lg font-bold text-white">🗺️ 任务地图</h1>
          <div className="flex items-center gap-1 bg-yellow-500/15 px-3 py-1.5 rounded-full">
            <Zap size={14} className="text-yellow-400" />
            <span className="text-yellow-400 text-xs font-bold">{totalXP} XP</span>
          </div>
        </div>
        <div className="px-4 pb-3">
          <div className="flex justify-between text-[11px] text-white/40 mb-1">
            <span>总进度 {completedCount}/{tasks.length}</span>
            <span>{Math.round((completedCount / Math.max(tasks.length, 1)) * 100)}%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${(completedCount / Math.max(tasks.length, 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stage Map */}
      <div className="px-4 pt-6 space-y-2">
        {stageConfig.map((stage, si) => {
          const stageTasks = tasks.filter(t => t.stage === stage.id)
          const doneCount = stageTasks.filter(t => getStatus(t.id) === 'completed').length
          const isCurrent = currentStage === stage.id
          const isLocked = stage.id > currentStage
          const allDone = doneCount === stageTasks.length && stageTasks.length > 0

          return (
            <div key={stage.id} className="relative">
              {/* Connecting line */}
              {si < stageConfig.length - 1 && (
                <div className={`absolute left-[23px] top-[56px] w-0.5 h-[calc(100%-40px)] ${allDone ? 'bg-emerald-500/40' : 'bg-white/5'}`} />
              )}

              {/* Stage header */}
              <div className={`flex items-center gap-3 mb-3 ${isLocked ? 'opacity-30' : ''}`}>
                <div className={`
                  relative w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0
                  ${allDone ? 'bg-emerald-500/20' : `bg-gradient-to-br ${stage.gradient}`}
                  ${isCurrent ? 'shadow-lg shadow-blue-500/20' : ''}
                `}>
                  {allDone ? <Check className="text-emerald-400" size={22} /> : stage.emoji}
                  {isCurrent && <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-400 rounded-full animate-ping" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-white font-bold text-[15px]">{stage.name}</h2>
                    {isCurrent && <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] rounded-md font-medium">进行中</span>}
                    {allDone && <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded-md font-medium">已完成</span>}
                  </div>
                  <p className="text-white/30 text-xs mt-0.5">{doneCount}/{stageTasks.length} 任务完成</p>
                </div>
              </div>

              {/* Tasks */}
              <div className={`ml-[23px] pl-5 mb-6 space-y-2.5 ${isLocked ? 'opacity-20 pointer-events-none' : ''}`}>
                {stageTasks.map(task => {
                  const s = getStatus(task.id)
                  const TypeIcon = taskTypeConfig[task.task_type]?.icon || Target

                  return (
                    <div
                      key={task.id}
                      onClick={() => s !== 'locked' && setSelectedTask(task)}
                      className={`
                        relative rounded-2xl p-3.5 transition-all duration-300
                        ${s === 'completed' ? 'bg-white/[0.03] border border-white/5' : ''}
                        ${s === 'active' ? 'bg-white/[0.08] border border-white/10 shadow-lg' : ''}
                        ${s === 'locked' ? 'bg-white/[0.02] border border-white/[0.03]' : ''}
                        ${s !== 'locked' ? 'cursor-pointer active:scale-[0.98]' : ''}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                          ${s === 'completed' ? 'bg-emerald-500/15' : ''}
                          ${s === 'active' ? `bg-gradient-to-br ${stage.gradient}` : ''}
                          ${s === 'locked' ? 'bg-white/5' : ''}
                        `}>
                          {s === 'completed' && <Check className="text-emerald-400" size={18} />}
                          {s === 'active' && createElement(TypeIcon, { className: 'text-white', size: 16 })}
                          {s === 'locked' && <Lock className="text-white/20" size={14} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${s === 'completed' ? 'text-white/40' : s === 'active' ? 'text-white' : 'text-white/20'}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] ${stage.badgeText}`}>{taskTypeConfig[task.task_type]?.label}</span>
                            <span className="text-[10px] text-yellow-500/50">+{task.xp_reward}XP</span>
                          </div>
                        </div>

                        {s === 'active' && <ChevronRight className="text-white/30 shrink-0" size={16} />}
                        {s === 'completed' && <span className="text-emerald-500/50 text-xs">✓</span>}
                      </div>

                      {s === 'active' && (
                        <div className="absolute -right-1 -top-1 w-2.5 h-2.5 bg-blue-400 rounded-full animate-ping" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTask(null)}>
          <div className="w-full bg-slate-800 rounded-t-3xl p-5 pb-28 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-0.5 rounded-lg text-[11px] ${stageConfig[selectedTask.stage - 1]?.badgeBg} ${stageConfig[selectedTask.stage - 1]?.badgeText}`}>
                {stageConfig[selectedTask.stage - 1]?.emoji} {stageConfig[selectedTask.stage - 1]?.name}
              </span>
              <span className="px-2 py-0.5 rounded-lg text-[11px] bg-white/10 text-white/50">
                {taskTypeConfig[selectedTask.task_type]?.label}
              </span>
            </div>

            <h2 className="text-xl font-bold text-white mb-1.5">{selectedTask.title}</h2>
            <p className="text-white/40 text-sm mb-5">{selectedTask.description}</p>

            <div className="flex items-center gap-3 bg-yellow-500/10 rounded-2xl p-3.5 mb-5">
              <div className="w-11 h-11 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <Sparkles className="text-yellow-400" size={22} />
              </div>
              <div>
                <p className="text-yellow-400 font-bold">+{selectedTask.xp_reward} XP</p>
                <p className="text-white/30 text-[11px]">完成后获得经验值奖励</p>
              </div>
            </div>

            {getStatus(selectedTask.id) === 'active' ? (
              <button
                onClick={() => completeTask(selectedTask)}
                disabled={completing}
                className={`w-full py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r ${stageConfig[selectedTask.stage - 1]?.gradient} active:scale-[0.98] transition-all disabled:opacity-50`}
              >
                {completing ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    处理中...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {(() => {
                      const I = taskTypeConfig[selectedTask.task_type]?.icon || Target
                      return createElement(I, { size: 18 })
                    })()}
                    {taskTypeConfig[selectedTask.task_type]?.action || '完成任务'}
                  </span>
                )}
              </button>
            ) : (
              <div className="w-full py-3.5 rounded-2xl text-center text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-medium">
                ✅ 任务已完成
              </div>
            )}
          </div>
        </div>
      )}

      {/* XP Reward Popup */}
      {showReward && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center animate-bounce-in">
            <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Sparkles className="text-yellow-400" size={40} />
            </div>
            <p className="text-yellow-400 font-bold text-3xl mb-2">+{showReward.xp} XP</p>
            <p className="text-white/60">「{showReward.title}」完成！</p>
          </div>
        </div>
      )}
    </div>
  )
}