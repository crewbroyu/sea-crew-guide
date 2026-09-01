import { createElement, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Award,
  Bell,
  ChevronRight,
  FileText,
  LogOut,
  MessageSquare,
  Route,
  Save,
  Shield,
  Target,
  User,
  Users,
} from 'lucide-react'
import { supabase } from '../supabase'
import { useAccessStore } from '../store/accessStore'
import useEffectiveAccess from '../hooks/useEffectiveAccess'
import {
  buildLocalPathProfile,
  getMyPathProfile,
  syncLocalPathProfile,
} from '../services/userPathService'
import { getLatestInterviewPracticeRecord } from '../services/interviewPracticeService'

const stageLabels = {
  exploring: '了解阶段',
  assessment_done: '已完成测评',
  position_planning: '岗位选择中',
  resume_preparation: '准备简历',
  interview_preparation: '准备面试',
  interview_process: '真实面试中',
  offer_received: '已拿 Offer',
  boarding_preparation: '登船准备',
}

const applicationStageLabels = {
  exploring: '了解中',
  assessed: '已测评',
  position_selected: '已选岗位',
  resume: '准备简历',
  interview: '准备面试',
  offer_received: '已拿 Offer',
  documents: '办理证件',
  boarding_ready: '准备登船',
}

const resumeStatusLabels = {
  not_started: '未开始',
  draft_ready: '已有简历草稿',
}

const interviewStatusLabels = {
  not_started: '未开始',
  learning: '学习面试技巧',
  practicing: '练习中',
  ai_mock_done: '已完成 AI 模拟',
  real_interview_recorded: '已有真实面试记录',
}

const applicationMethods = [
  { value: '', label: '还不确定' },
  { value: 'diy', label: 'DIY 申请' },
  { value: 'agency', label: '中介' },
  { value: 'first_agent', label: '一代/官方合作方' },
  { value: 'company_site', label: '船公司官网' },
]

const buddyIntentOptions = [
  { value: '', label: '暂不需要' },
  { value: 'interview_practice', label: '面试互练' },
  { value: 'english_practice', label: '英语练习' },
  { value: 'resume_review', label: '简历互改' },
  { value: 'application_accountability', label: '投递监督' },
  { value: 'training_together', label: '同期培训' },
  { value: 'boarding_together', label: '同期登船' },
]

const fieldDefaults = {
  target_position: '',
  target_company: '',
  target_boarding_month: '',
  city: '',
  training_city: '',
  application_method: '',
  buddy_intent: '',
  buddy_opt_in: false,
}

const roleLabels = {
  anonymous: '访客预览',
  member: '普通会员',
  mentor: 'Crew Mentor',
  admin: '管理员',
}

const planLabels = {
  free: '免费版',
  premium: '付费会员',
}

export default function Profile() {
  const navigate = useNavigate()
  const { userEmail, userName, reset } = useAccessStore()
  const {
    isUnlocked,
    effectiveRole,
    effectivePlan,
    crewVerificationStatus,
    mentorStatus,
    isPreviewing,
  } = useEffectiveAccess()
  const [pathProfile, setPathProfile] = useState(() => buildLocalPathProfile())
  const [latestInterviewRecord, setLatestInterviewRecord] = useState(null)
  const [form, setForm] = useState(fieldDefaults)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      const localProfile = buildLocalPathProfile()

      try {
        const remoteProfile = await getMyPathProfile()
        const mergedProfile = remoteProfile || localProfile
        setPathProfile(mergedProfile)
        setForm({
          ...fieldDefaults,
          target_position: mergedProfile.target_position || '',
          target_company: mergedProfile.target_company || '',
          target_boarding_month: mergedProfile.target_boarding_month || '',
          city: mergedProfile.city || '',
          training_city: mergedProfile.training_city || '',
          application_method: mergedProfile.application_method || '',
          buddy_intent: mergedProfile.buddy_intent || '',
          buddy_opt_in: Boolean(mergedProfile.buddy_opt_in),
        })

        if (!remoteProfile) {
          await syncLocalPathProfile()
        }

        try {
          const interviewRecord = await getLatestInterviewPracticeRecord()
          setLatestInterviewRecord(interviewRecord)
        } catch (error) {
          console.error('加载最近面试记录失败:', error)
          setLatestInterviewRecord(null)
        }
      } catch (error) {
        console.error('加载路径档案失败:', error)
        setPathProfile(localProfile)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const completedTasks = useMemo(() => {
    const progress = pathProfile?.task_progress || {}
    return Array.from({ length: 12 }, (_, index) => progress[`task${index + 1}`])
      .filter((task) => task?.completed).length
  }, [pathProfile])

  const nextAction = useMemo(() => {
    if (!pathProfile?.latest_assessment_score) {
      return { label: '完成海乘适配测评', route: '/assessment' }
    }
    if (!isUnlocked) {
      return { label: '解锁完整职业路线和 AI 面试', route: '/premium' }
    }
    if (!pathProfile?.target_position) {
      return { label: '选择目标岗位', route: '/tasks/Task2' }
    }
    if (pathProfile?.resume_status !== 'draft_ready') {
      return { label: '制作英文简历', route: '/tasks/phase2/Task4' }
    }
    if (!['ai_mock_done', 'real_interview_recorded'].includes(pathProfile?.interview_status)) {
      return { label: '进入面试训练', route: '/tasks/phase2/Task7' }
    }
    if (pathProfile?.interview_status !== 'real_interview_recorded') {
      return { label: '记录真实面试', route: '/tasks/phase2/Task8' }
    }
    return { label: '查看完整登船路线', route: '/tasks' }
  }, [isUnlocked, pathProfile])

  const serviceRecommendation = useMemo(() => {
    if (!pathProfile?.latest_assessment_score) {
      return {
        title: '先完成职业适配测评',
        description: '测评会生成岗位推荐和短板，后续才能判断该卖路线报告、简历优化还是面试训练。',
        route: '/assessment',
        cta: '开始测评',
        tone: 'blue',
      }
    }

    if (!isUnlocked) {
      return {
        title: '推荐解锁完整职业路线',
        description: '你已经留下了测评或申请状态，下一步应该把岗位、简历、面试和申请渠道合成一条可执行路线。',
        route: '/premium',
        cta: '查看激活权益',
        tone: 'amber',
      }
    }

    if (latestInterviewRecord && latestInterviewRecord.overall_score < 70) {
      return {
        title: '优先继续 AI 面试训练',
        description: `最近一次 AI 面试 ${latestInterviewRecord.overall_score}/100，建议围绕低分问题继续练回答结构和英文表达。`,
        route: '/tasks/phase2/Task7/mock',
        cta: '继续练面试',
        tone: 'amber',
      }
    }

    if (pathProfile?.resume_status !== 'draft_ready') {
      return {
        title: '下一步适合做英文简历',
        description: '目标岗位确定后，简历是进入投递和面试前最重要的材料，需要先把经历翻译成岗位能力。',
        route: '/tasks/phase2/Task4',
        cta: '制作简历',
        tone: 'blue',
      }
    }

    if (!['ai_mock_done', 'real_interview_recorded'].includes(pathProfile?.interview_status)) {
      return {
        title: '下一步适合做 AI 模拟面试',
        description: '简历有雏形后，最该暴露的问题通常是英文表达、服务案例和岗位理解。',
        route: '/tasks/phase2/Task7/mock',
        cta: '开始 AI 面试',
        tone: 'blue',
      }
    }

    if (pathProfile?.interview_status !== 'real_interview_recorded') {
      return {
        title: '开始跟进真实面试',
        description: '模拟训练完成后，把收到的面试邀请、现场问题和结果记录下来，才能形成可执行的申请反馈。',
        route: '/tasks/phase2/Task8',
        cta: '记录真实面试',
        tone: 'green',
      }
    }

    return {
      title: '进入申请执行阶段',
      description: '你已经完成核心判断和面试训练，接下来应该按渠道投递、记录反馈并准备证件节点。',
      route: '/tasks',
      cta: '查看申请路线',
      tone: 'green',
    }
  }, [isUnlocked, latestInterviewRecord, pathProfile])

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      buddy_opt_in: field === 'buddy_intent' && value ? true : prev.buddy_opt_in,
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    try {
      const updatedProfile = await syncLocalPathProfile({
        ...form,
        target_position: form.target_position || null,
        target_company: form.target_company || null,
        target_boarding_month: form.target_boarding_month || null,
        city: form.city || null,
        training_city: form.training_city || null,
        application_method: form.application_method || null,
        buddy_intent: form.buddy_intent || null,
        buddy_opt_in: Boolean(form.buddy_opt_in && form.buddy_intent),
      })

      if (updatedProfile) {
        setPathProfile(updatedProfile)
        setMessage('申请进度已保存到后台')
      } else {
        setMessage('暂时无法同步，请确认登录状态')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    reset()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 pt-12 pb-7">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
            <User size={28} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-blue-100 text-sm">我的海乘申请进度</p>
            <h1 className="text-white text-lg font-bold truncate">
              {userName || userEmail || 'Crew Path 用户'}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white/15 px-2 py-1 text-white">{roleLabels[effectiveRole] || effectiveRole}</span>
              <span className="rounded-full bg-white/15 px-2 py-1 text-white">{planLabels[effectivePlan] || effectivePlan}</span>
              {crewVerificationStatus === 'verified' && <span className="rounded-full bg-emerald-400/25 px-2 py-1 text-white">Crew 已认证</span>}
              {mentorStatus === 'active' && <span className="rounded-full bg-emerald-400/25 px-2 py-1 text-white">Mentor 已启用</span>}
              {isPreviewing && <span className="rounded-full bg-amber-300/25 px-2 py-1 text-white">预览模式</span>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="bg-white/12 border border-white/20 rounded-lg p-3">
            <p className="text-blue-100 text-xs">当前阶段</p>
            <p className="text-white text-sm font-semibold mt-1">
              {stageLabels[pathProfile?.career_stage] || '了解阶段'}
            </p>
          </div>
          <div className="bg-white/12 border border-white/20 rounded-lg p-3">
            <p className="text-blue-100 text-xs">已完成任务</p>
            <p className="text-white text-sm font-semibold mt-1">{completedTasks}/12</p>
          </div>
          <div className="bg-white/12 border border-white/20 rounded-lg p-3">
            <p className="text-blue-100 text-xs">意向分</p>
            <p className="text-white text-sm font-semibold mt-1">{pathProfile?.lead_score || 0}/100</p>
          </div>
        </div>
      </div>

      <main className="px-6 -mt-3 space-y-5">
        <section className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-gray-900">下一步</h2>
              <p className="text-sm text-gray-600 mt-1">{nextAction.label}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(nextAction.route)}
              className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium"
            >
              去完成
            </button>
          </div>
        </section>

        <section className={`rounded-xl border p-4 shadow-sm ${
          serviceRecommendation.tone === 'amber'
            ? 'border-amber-200 bg-amber-50'
            : serviceRecommendation.tone === 'green'
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-blue-200 bg-blue-50'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white ${
              serviceRecommendation.tone === 'amber'
                ? 'text-amber-700'
                : serviceRecommendation.tone === 'green'
                  ? 'text-emerald-700'
                  : 'text-blue-700'
            }`}>
              {createElement(isUnlocked ? Target : Shield, { size: 20 })}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-500">推荐服务</p>
              <h2 className="mt-1 font-bold text-gray-950">{serviceRecommendation.title}</h2>
              <p className="mt-1 text-sm leading-6 text-gray-700">{serviceRecommendation.description}</p>
              <button
                type="button"
                onClick={() => navigate(serviceRecommendation.route)}
                className="mt-3 inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-sm"
              >
                {serviceRecommendation.cta}
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-bold text-gray-900 mb-4">申请档案</h2>
          {loading ? (
            <p className="text-sm text-gray-500">加载中...</p>
          ) : (
            <div className="space-y-3">
              <input
                value={form.target_position}
                onChange={(event) => handleChange('target_position', event.target.value)}
                placeholder="目标岗位，例如 Retail / Guest Services"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <input
                value={form.target_company}
                onChange={(event) => handleChange('target_company', event.target.value)}
                placeholder="目标船公司，例如 Princess / Royal Caribbean"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={form.city}
                  onChange={(event) => handleChange('city', event.target.value)}
                  placeholder="所在城市"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <input
                  value={form.training_city}
                  onChange={(event) => handleChange('training_city', event.target.value)}
                  placeholder="培训城市"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <input
                value={form.target_boarding_month}
                onChange={(event) => handleChange('target_boarding_month', event.target.value)}
                placeholder="预计登船月份，例如 2026-10"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <select
                value={form.application_method}
                onChange={(event) => handleChange('application_method', event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {applicationMethods.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              <select
                value={form.buddy_intent}
                onChange={(event) => handleChange('buddy_intent', event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {buddyIntentOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              <label className="flex items-center justify-between gap-3 bg-gray-50 rounded-lg px-3 py-3">
                <span className="text-sm text-gray-700">开启同行者匹配</span>
                <input
                  type="checkbox"
                  checked={form.buddy_opt_in}
                  onChange={(event) => handleChange('buddy_opt_in', event.target.checked)}
                  className="w-4 h-4"
                />
              </label>

              {message && (
                <p className="text-sm text-green-600">{message}</p>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium disabled:bg-gray-300 flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {saving ? '保存中...' : '保存申请进度'}
              </button>
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-bold text-gray-900 mb-3">当前状态</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatusCard icon={Target} label="目标岗位" value={pathProfile?.target_position || '未选择'} />
            <StatusCard icon={Route} label="申请阶段" value={applicationStageLabels[pathProfile?.application_stage] || '了解中'} />
            <StatusCard icon={FileText} label="简历状态" value={resumeStatusLabels[pathProfile?.resume_status] || '未开始'} />
            <StatusCard icon={MessageSquare} label="面试状态" value={interviewStatusLabels[pathProfile?.interview_status] || '未开始'} />
            <StatusCard icon={Users} label="同行者" value={pathProfile?.buddy_opt_in ? '已开启' : '未开启'} />
            <StatusCard icon={Award} label="测评分数" value={pathProfile?.latest_assessment_score ? `${pathProfile.latest_assessment_score}/100` : '未测评'} />
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
          <MenuButton icon={FileText} label="个人简历" onClick={() => navigate('/resume')} />
          <MenuButton icon={Shield} label="登船证件" onClick={() => navigate('/tasks/Task10')} />
          <MenuButton icon={Bell} label="站内消息" onClick={() => navigate('/messages')} />
        </section>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm text-red-500"
        >
          <LogOut size={20} />
          <span className="text-sm">退出登录</span>
        </button>
      </main>
    </div>
  )
}

function StatusCard({ icon, label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      {createElement(icon, { size: 18, className: 'text-blue-600 mb-2' })}
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900 mt-1">{value}</p>
    </div>
  )
}

function MenuButton({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full p-4 flex items-center gap-3"
    >
      {createElement(icon, { size: 20, className: 'text-gray-500' })}
      <span className="flex-1 text-left text-sm text-gray-800">{label}</span>
      <ChevronRight size={18} className="text-gray-300" />
    </button>
  )
}
