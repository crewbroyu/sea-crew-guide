import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'
import { updateMyProfile } from '../services/profileService'
import { findTaskByTitle, getMyTaskStatus, getTaskByStageAndOrder, upsertMyTask } from '../services/taskService'
import { ArrowLeft, Check, Briefcase, Star, AlertCircle } from 'lucide-react'

const allJobs = [
  {
    id: 'restaurant',
    title: '餐厅服务员',
    dept: '餐饮部',
    desc: '负责餐厅日常服务，包括点餐、上菜、清洁等',
    requirements: '英语基础沟通，服务意识强',
    difficulty: 2,
  },
  {
    id: 'bar',
    title: '酒吧员工',
    dept: '餐饮部',
    desc: '负责酒水调配和吧台服务',
    requirements: '英语基础沟通，了解酒水知识',
    difficulty: 2,
  },
  {
    id: 'cabin',
    title: '客房服务员',
    dept: '客房部',
    desc: '负责客舱清洁、整理及宾客日常需求',
    requirements: '英语基础，注重细节',
    difficulty: 1,
  },
  {
    id: 'guest_service',
    title: '宾客服务',
    dept: '宾客服务部',
    desc: '前台接待，处理宾客咨询、投诉和各类需求',
    requirements: '英语流利，沟通能力强',
    difficulty: 3,
  },
  {
    id: 'reception',
    title: '前台接待',
    dept: '宾客服务部',
    desc: '负责登船/离船手续、信息咨询等',
    requirements: '英语流利，形象气质佳',
    difficulty: 3,
  },
  {
    id: 'shore_excursion',
    title: '岸上观光',
    dept: '岸上观光部',
    desc: '组织和协调靠港观光活动',
    requirements: '英语流利，组织协调能力强',
    difficulty: 3,
  },
  {
    id: 'duty_free',
    title: '免税店销售',
    dept: '零售部',
    desc: '负责船上免税商品的销售和顾客服务',
    requirements: '英语中级以上，销售经验优先',
    difficulty: 2,
  },
  {
    id: 'photographer',
    title: '邮轮摄影师',
    dept: '娱乐部',
    desc: '为宾客拍摄照片，负责照片销售',
    requirements: '摄影技能，英语基础沟通',
    difficulty: 2,
  },
  {
    id: 'kids_club',
    title: '儿童俱乐部',
    dept: '娱乐部',
    desc: '组织儿童活动，照看和陪伴小宾客',
    requirements: '英语流利，喜欢与小朋友互动',
    difficulty: 3,
  },
]

export default function JobSelect() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const [selected, setSelected] = useState(profile?.selected_job || null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pendingJob, setPendingJob] = useState(null)

  // 根据测评推荐（简化逻辑）
  const getRecommended = () => {
    // 后续可以根据 assessment_results 细化
    return ['restaurant', 'bar', 'cabin', 'duty_free']
  }

  const recommended = getRecommended()

  const handleSelect = (jobId) => {
    if (profile?.selected_job && profile.selected_job !== jobId) {
      setPendingJob(jobId)
      setShowConfirm(true)
    } else {
      setSelected(jobId)
    }
  }

  const confirmChange = () => {
    setSelected(pendingJob)
    setShowConfirm(false)
    setPendingJob(null)
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)

    await updateMyProfile({ selected_job: selected })

    // 如果是从任务地图来的，完成任务2
    const tasks = await findTaskByTitle('选择目标岗位')

    if (tasks) {
      const userTask = await getMyTaskStatus(tasks.id)

      if (userTask?.status === 'active') {
        // 完成当前任务
        await upsertMyTask({
          task_id: tasks.id,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })

        // 解锁下一个任务
        const nextTask = await getTaskByStageAndOrder(1, 3)

        if (nextTask) {
          await upsertMyTask({
            task_id: nextTask.id,
            status: 'active',
          })
        }

        // 更新经验值
        const newXp = (profile?.xp || 0) + 20
        const newLevel = Math.floor(newXp / 100) + 1
        const newTaskCount = (profile?.current_task || 0) + 1

        await updateMyProfile({ xp: newXp, level: newLevel, current_task: newTaskCount })

        useAuthStore.getState().setProfile({
          ...profile,
          selected_job: selected,
          xp: newXp,
          level: newLevel,
          current_task: newTaskCount,
        })
      } else {
        useAuthStore.getState().setProfile({ ...profile, selected_job: selected })
      }
    }

    setSaving(false)
    navigate('/tasks')
  }

  const getDifficultyStars = (level) => {
    return Array.from({ length: 3 }, (_, i) => (
      <Star
        key={i}
        size={12}
        className={i < level ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
      />
    ))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="text-white">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-white text-lg font-bold">选择目标岗位</h1>
        </div>
        <p className="text-blue-200 text-sm">
          根据你的测评结果，为你推荐以下岗位
        </p>
      </div>

      <div className="px-6 py-4">
        {/* 推荐岗位 */}
        <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Star size={16} className="text-yellow-500 fill-yellow-500" />
          为你推荐
        </h2>
        <div className="space-y-3 mb-6">
          {allJobs
            .filter((j) => recommended.includes(j.id))
            .map((job) => (
              <JobCard
                key={job.id}
                job={job}
                selected={selected === job.id}
                onSelect={() => handleSelect(job.id)}
                getDifficultyStars={getDifficultyStars}
                isRecommended
              />
            ))}
        </div>

        {/* 全部岗位 */}
        <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Briefcase size={16} className="text-gray-500" />
          全部岗位
        </h2>
        <div className="space-y-3 mb-6">
          {allJobs
            .filter((j) => !recommended.includes(j.id))
            .map((job) => (
              <JobCard
                key={job.id}
                job={job}
                selected={selected === job.id}
                onSelect={() => handleSelect(job.id)}
                getDifficultyStars={getDifficultyStars}
              />
            ))}
        </div>

        {/* 确认按钮 */}
        <button
          onClick={handleSave}
          disabled={!selected || saving}
          className={`w-full py-3 rounded-xl text-sm font-medium ${
            selected
              ? 'bg-blue-600 text-white active:scale-[0.98]'
              : 'bg-gray-200 text-gray-400'
          } transition`}
        >
          {saving ? '保存中...' : selected ? '确认选择' : '请选择一个岗位'}
        </button>
      </div>

      {/* 改选确认弹窗 */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-8">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={20} className="text-orange-500" />
              <h3 className="font-bold text-gray-800">确认修改岗位？</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              修改目标岗位将重置任务5-8的进度（学习岗位知识、面试技巧学习、面试训练中心、真实面试跟进），需要重新完成。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600"
              >
                取消
              </button>
              <button
                onClick={confirmChange}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium"
              >
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function JobCard({ job, selected, onSelect, getDifficultyStars, isRecommended }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl border-2 p-4 transition ${
        selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-100 bg-white'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-800">{job.title}</span>
            {isRecommended && (
              <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                推荐
              </span>
            )}
          </div>
          <p className="text-xs text-blue-500 mt-0.5">{job.dept}</p>
          <p className="text-xs text-gray-500 mt-2">{job.desc}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] text-gray-400">申请难度</span>
            <div className="flex gap-0.5">{getDifficultyStars(job.difficulty)}</div>
          </div>
        </div>
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
          selected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
        }`}>
          {selected && <Check size={14} className="text-white" />}
        </div>
      </div>
    </button>
  )
}
