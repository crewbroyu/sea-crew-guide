import { createElement, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Circle,
  FileText,
  Mic,
  Sparkles,
  Store,
  Target,
} from 'lucide-react'

const readJson = (key, fallback = {}) => {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch (error) {
    console.warn(`Unable to read ${key}:`, error)
    return fallback
  }
}

const isRetailPosition = (position = '') =>
  /retail|shop|sales|jewelry|免税|零售|销售/i.test(position)

const stages = [
  {
    id: 'assessment',
    order: 1,
    title: '岗位适配评估',
    description: '先确认英语、服务经历、销售意愿和船上适应力。',
    route: '/assessment',
    access: '免费',
    icon: Target,
  },
  {
    id: 'target',
    order: 2,
    title: '确认免税店为目标岗位',
    description: '比较主申、备选和风险，不因为喜欢购物就盲目选择。',
    route: '/tasks/Task2',
    access: '免费',
    icon: Store,
  },
  {
    id: 'resume',
    order: 3,
    title: '整理 Retail 英文简历',
    description: '把销售、客服和门店经历转换成邮轮零售需要的证据。',
    route: '/tasks/phase2/Task4',
    access: '登录保存',
    icon: FileText,
  },
  {
    id: 'knowledge',
    order: 4,
    title: '岗位知识与销售英语',
    description: '理解 KPI、产品推荐、异议处理和免税店日常工作。',
    route: '/tasks/phase2/Task5',
    access: '基础开放',
    icon: BookOpenCheck,
  },
  {
    id: 'answers',
    order: 5,
    title: '准备面试答案证据',
    description: '整理服务、销售、压力和团队案例，形成可复用答案卡。',
    route: '/tasks/phase2/Task6',
    access: '基础开放',
    icon: Sparkles,
  },
  {
    id: 'interview',
    order: 6,
    title: '语音练习与 AI 模拟',
    description: '从单题开口到完整模拟，检查表达是否真正达到面试要求。',
    route: '/tasks/phase2/Task7',
    access: 'AI 核心',
    icon: Mic,
  },
]

const getPackSnapshot = () => {
  const assessment = readJson('assessment_result')
  const task2 = readJson('task2_result')
  const task4 = readJson('task4_result')
  const task5 = readJson('task5_result')
  const task6 = readJson('task6_result')
  const task7 = readJson('task7_result')
  const progress = readJson('boarding_progress')
  const targetPosition = task2.selectedTargetJob || task2.target_position || ''

  return {
    targetPosition,
    completed: {
      assessment: Boolean(assessment.overallScore || assessment.completedAt || assessment.dimensionScores),
      target: isRetailPosition(targetPosition),
      resume: Boolean(progress.task4?.completed || task4.completedAt),
      knowledge: Boolean(progress.task5?.completed || task5.completedAt),
      answers: Boolean(progress.task6?.completed || task6.completedAt || task6.preparedAnswerCount),
      interview: Boolean(progress.task7?.completed || task7.completedAt || task7.evaluation),
    },
  }
}

export default function RetailPreparationPack() {
  const navigate = useNavigate()
  const snapshot = useMemo(() => getPackSnapshot(), [])
  const completedCount = stages.filter((stage) => snapshot.completed[stage.id]).length
  const currentStage = stages.find((stage) => !snapshot.completed[stage.id]) || stages[stages.length - 1]

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-5 pb-8 pt-12">
          <button
            type="button"
            onClick={() => navigate('/jobs')}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-700"
          >
            <ArrowLeft size={17} />
            返回求职中心
          </button>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Store size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700">免税店岗位准备路径预览</p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight text-slate-950">
                邮轮免税店 Retail Sales 岗位准备
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                从判断是否适合，到整理简历、理解岗位、准备答案和完成模拟面试。现有任务不变，这里负责把它们组织成一条清楚的岗位准备路径。
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">当前进度</p>
                  <p className="mt-1 font-semibold text-slate-950">已完成 {completedCount}/{stages.length} 个阶段</p>
                </div>
                <span className="text-sm font-semibold text-blue-700">{Math.round((completedCount / stages.length) * 100)}%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${(completedCount / stages.length) * 100}%` }} />
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(currentStage.route)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              {completedCount ? `继续：${currentStage.title}` : '从适配评估开始'}
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-7">
        <section className="mb-8 grid gap-4 md:grid-cols-2">
          <div className="border-l-4 border-emerald-500 bg-white px-5 py-4">
            <h2 className="font-semibold text-slate-950">更适合这样的人</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              有销售、客服、美妆、奢侈品或门店经验，愿意主动沟通，并能接受销售目标和长时间站立。
            </p>
          </div>
          <div className="border-l-4 border-amber-500 bg-white px-5 py-4">
            <h2 className="font-semibold text-slate-950">选择前先确认</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              如果非常抗拒销售、KPI 和主动推荐产品，应先完成适配评估，再比较餐饮、客房等方向。
            </p>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-blue-700">完整准备路径</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">按顺序完成，不再到处找入口</h2>
            </div>
            {snapshot.targetPosition && (
              <span className="hidden text-xs text-slate-500 sm:block">当前目标：{snapshot.targetPosition}</span>
            )}
          </div>

          <div className="space-y-3">
            {stages.map((stage) => {
              const completed = snapshot.completed[stage.id]
              const isCurrent = currentStage.id === stage.id

              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => navigate(stage.route)}
                  className={`flex w-full items-center gap-4 rounded-lg border bg-white p-4 text-left shadow-sm transition hover:border-blue-300 ${
                    isCurrent ? 'border-blue-300' : 'border-slate-200'
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${completed ? 'bg-emerald-50 text-emerald-700' : isCurrent ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                    {completed ? <CheckCircle2 size={20} /> : createElement(stage.icon, { size: 20 })}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-slate-500">阶段 {stage.order}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{stage.access}</span>
                      {isCurrent && <span className="text-xs font-semibold text-blue-700">当前建议</span>}
                    </div>
                    <h3 className="mt-1 font-semibold text-slate-950">{stage.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{stage.description}</p>
                  </div>
                  <div className="shrink-0 text-slate-400">
                    {completed ? <CheckCircle2 size={19} className="text-emerald-600" /> : <Circle size={19} />}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="mt-8 rounded-lg border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <Sparkles size={20} className="mt-0.5 shrink-0 text-blue-700" />
            <div>
              <h2 className="font-semibold text-blue-950">这一版先把路径组织清楚</h2>
              <p className="mt-1 text-sm leading-6 text-blue-900">
                后续会在这条路径里加入免税店专项诊断、销售场景训练和准备度报告；现在进入的仍是已经稳定运行的原任务页面。
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
