import { useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpenCheck, CheckCircle2, FileText, Headphones, Mic, Sparkles, Target } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useEffectiveAccess from '../../hooks/useEffectiveAccess'
import { hasProductEntitlement } from '../../services/activationService'
import { barServerFoundationDays, getCompletedFoundationDays } from '../../data/barServerFoundation'
import {
  BAR_SERVER_LEARNING_STAGES,
  BAR_SERVER_STAGE_KEY,
  getCompletedListeningDrills,
  readBarListeningProgress,
} from '../../data/barServerListening'

const readFoundationProgress = () => {
  try {
    return JSON.parse(localStorage.getItem('task5_data') || '{}')?.foundationProgress || {}
  } catch {
    return {}
  }
}

const courseSections = {
  foundation: {
    label: '第一部分 · 任务5',
    title: '岗位基础课程',
    description: '9 天掌握酒水、杯具、服务流程、公共卫生和负责任售酒。每个知识点都带跟读与 Guest Challenge。',
    icon: BookOpenCheck,
    route: '/programs/bar-server/foundation',
    action: '进入 9 天基础课',
  },
  listening: {
    label: '工作听力 · 12 个短场景',
    title: '酒吧日常听力训练',
    description: '先隐藏原文听订单、偏好、客诉和主管指令，再提交关键信息。正常语速与慢速分开训练。',
    icon: Headphones,
    route: '/programs/bar-server/listening',
    action: '开始工作听力',
  },
  simulation: {
    label: '工作能力 · 情境决策',
    title: 'Bar Server 岗位场景模拟',
    description: '连续处理点单、推荐、客诉和拒酒场景；结果进入岗位能力面板，不是面试答题。',
    icon: Sparkles,
    route: '/programs/bar-server/training',
    action: '进入岗位模拟器',
  },
  interview: {
    label: '面试表达 · 任务6与任务7',
    title: '把岗位能力转成面试表达',
    description: '先整理自己的服务经历，再进入公开题库和单题语音练习。完整 AI 模拟面试仍放在求职中心。',
    icon: FileText,
    route: '/tasks/phase2/Task6?source=task5',
    action: '整理英文回答',
  },
}

const stageCourseOrder = {
  job_search: ['foundation', 'interview', 'listening', 'simulation'],
  first_contract: ['foundation', 'listening', 'simulation', 'interview'],
  experienced: ['listening', 'simulation', 'foundation', 'interview'],
}

const readLearningStage = () => localStorage.getItem(BAR_SERVER_STAGE_KEY) || 'job_search'

export default function BarServerPreparationPack() {
  const navigate = useNavigate()
  const [learningStage, setLearningStage] = useState(readLearningStage)
  const access = useEffectiveAccess()
  const hasPack = hasProductEntitlement(access, 'bar_server_pack')
  const completedDays = getCompletedFoundationDays(readFoundationProgress())
  const completedListening = getCompletedListeningDrills(readBarListeningProgress())
  const selectedStage = BAR_SERVER_LEARNING_STAGES.find((stage) => stage.id === learningStage)
    || BAR_SERVER_LEARNING_STAGES[0]
  const orderedSections = stageCourseOrder[selectedStage.id].map((id) => courseSections[id])

  const selectLearningStage = (stageId) => {
    setLearningStage(stageId)
    localStorage.setItem(BAR_SERVER_STAGE_KEY, stageId)
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-5 pb-7 pt-11">
          <button type="button" onClick={() => navigate('/academy/position-english?position=bar_server')} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700"><ArrowLeft size={17} />返回 Bar Server 岗位课程</button>
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_280px] md:items-center">
            <div>
              <p className="text-sm font-medium text-blue-700">完整岗位课程 · Bar Server</p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight text-slate-950">从基础知识，到真实服务，再到面试表达</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">这是岗位包总目录。基础课程负责教会你需要知道什么，岗位模拟负责检查你能不能处理工作，面试训练负责让你向招聘官讲清楚。</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-md bg-blue-50 px-2.5 py-1.5 text-blue-700">基础课程</span><span className="rounded-md bg-emerald-50 px-2.5 py-1.5 text-emerald-700">工作场景</span><span className="rounded-md bg-amber-50 px-2.5 py-1.5 text-amber-800">面试表达</span></div>
            </div>
            <img src="/images/bar-server/ep01-busy-night.png" alt="A Bar Server working during a busy cruise ship bar shift" className="aspect-video w-full rounded-lg object-cover" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-7 px-5 py-7">
        <section className="border-b border-slate-200 pb-7">
          <p className="text-xs font-semibold text-blue-700">你目前在哪个阶段？</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">课程顺序会按你的目标调整</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {BAR_SERVER_LEARNING_STAGES.map((stage) => {
              const selected = stage.id === selectedStage.id
              return <button key={stage.id} type="button" onClick={() => selectLearningStage(stage.id)} className={`min-h-24 rounded-lg border p-4 text-left transition ${selected ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-200 bg-white hover:border-blue-300'}`}><span className={`text-sm font-semibold ${selected ? 'text-blue-800' : 'text-slate-900'}`}>{stage.label}</span><span className="mt-2 block text-xs leading-5 text-slate-600">{stage.description}</span></button>
            })}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-slate-500">基础课进度</p><p className="mt-1 text-xl font-bold text-slate-950">{completedDays}/{barServerFoundationDays.length} 天</p></div>
          <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-slate-500">工作听力</p><p className="mt-1 text-xl font-bold text-slate-950">{completedListening}/12 题</p></div>
          <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-slate-500">岗位场景</p><p className="mt-1 text-xl font-bold text-slate-950">4 个等级</p></div>
          <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-slate-500">岗位权益</p><p className="mt-1 text-xl font-bold text-slate-950">{hasPack ? '已开通' : '未开通'}</p></div>
        </section>

        <section>
          <p className="text-xs font-semibold text-blue-700">正式课程目录</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">为“{selectedStage.label}”推荐的学习顺序</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {orderedSections.map((section, index) => {
              const Icon = section.icon
              return <article key={section.title} className="flex flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><Icon size={20} /></div><span className="text-xs font-bold text-slate-400">0{index + 1}</span></div><p className="mt-4 text-xs font-semibold text-blue-700">{section.label}</p><h3 className="mt-1 font-semibold text-slate-950">{section.title}</h3><p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{section.description}</p><button type="button" onClick={() => navigate(section.route)} className="mt-5 inline-flex min-h-11 items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-100">{section.action}<ArrowRight size={16} /></button></article>
            })}
          </div>
        </section>

        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3"><Target size={20} className="mt-0.5 shrink-0 text-amber-700" /><div><p className="text-xs font-semibold text-amber-800">免费体验，不是正式课程目录</p><h2 className="mt-1 font-semibold text-amber-950">还没决定购买？先完成 3 个体验场景</h2><p className="mt-2 text-sm leading-6 text-amber-900">体验课用于判断这种训练方式是否适合你；完整学习从上方 9 天岗位基础课程开始。</p></div></div>
          <button type="button" onClick={() => navigate('/programs/bar-server/trial')} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-amber-700 px-4 text-sm font-semibold text-white hover:bg-amber-800"><Mic size={17} />进入 3 个免费场景</button>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => navigate('/academy/interview-questions?position=bar_server')} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 text-left text-sm font-semibold text-slate-800"><span className="flex items-center gap-2"><FileText size={18} className="text-blue-700" />查看 Bar Server 公开题库</span><ArrowRight size={16} /></button>
          <button type="button" onClick={() => navigate('/tasks/phase2/Task7')} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 text-left text-sm font-semibold text-slate-800"><span className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-700" />进入面试训练枢纽</span><ArrowRight size={16} /></button>
        </section>
      </main>
    </div>
  )
}
