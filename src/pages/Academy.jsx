import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  ClipboardList,
  FileText,
  MapPin,
  MessageSquare,
  Mic2,
  Ship,
  Sparkles,
} from 'lucide-react'

const primaryModules = [
  {
    title: '先看懂海乘行业',
    description: '从入门认知、岗位区别、工资合同和登船流程开始，先判断这条路值不值得走。',
    route: '/academy/wiki',
    icon: BookOpen,
    label: '百科',
  },
  {
    title: '确定目标岗位',
    description: '按岗位学习英语、职责、风险和准备路线，把“想上船”变成具体岗位目标。',
    route: '/academy/position-english',
    icon: BriefcaseBusiness,
    label: '岗位英语',
  },
  {
    title: '进入面试准备',
    description: '围绕常见问题、岗位场景和 AI 模拟面试，训练可直接用于面试的表达。',
    route: '/academy/interview-questions',
    icon: MessageSquare,
    label: '面试',
  },
]

const learningSections = [
  {
    title: '英语训练',
    description: '听说练习、岗位表达、船上服务场景',
    items: [
      {
        title: '岗位英语课程',
        description: '按目标岗位学习常用表达和服务话术',
        route: '/academy/position-english',
        icon: BookOpen,
      },
      {
        title: '听说训练',
        description: '按场景练习听力、跟读和口语表达',
        route: '/academy/listening-speaking',
        icon: Mic2,
      },
    ],
  },
  {
    title: '面试准备',
    description: '问题库、场景训练、模拟面试',
    items: [
      {
        title: '常见面试问题',
        description: '按岗位查看高频问题和回答思路',
        route: '/academy/interview-questions',
        icon: MessageSquare,
      },
      {
        title: '岗位场景训练',
        description: '练习客诉、点单、前台、销售等工作场景',
        route: '/academy/scenarios',
        icon: ClipboardList,
      },
      {
        title: 'AI 模拟面试',
        description: '从学院进入完整模拟面试任务',
        route: '/tasks/phase2/Task8',
        state: { from: 'academy' },
        icon: Sparkles,
      },
    ],
  },
  {
    title: '登船准备',
    description: '证件、签证、材料和上船前检查',
    items: [
      {
        title: '海乘职业资质',
        description: '海员证、体检、无犯罪记录等材料',
        route: '/academy/boarding/detail',
        state: {
          module: {
            id: 'seaman-qualification',
            title: '海乘职业资质',
            description: '包含海员证、海员体检、国际旅行体检、无犯罪记录证明',
          },
        },
        icon: FileText,
      },
      {
        title: '申请 C1/D 签证',
        description: '预约面谈、材料准备、面签攻略和出签等待',
        route: '/academy/boarding/detail',
        state: {
          module: {
            id: 'c1d-visa',
            title: '申请C1D签证',
            description: '包含预约面谈、材料准备、面签攻略、出签等待',
          },
        },
        icon: Ship,
      },
    ],
  },
  {
    title: '船上与港口生活',
    description: '真实船上生活、港口日常和经验记录',
    items: [
      {
        title: '海乘到港日常',
        description: '记录到港经历、照片和船上生活片段',
        route: '/academy/port-daily',
        icon: MapPin,
      },
    ],
  },
]

const ModuleButton = ({ item, onOpen, compact = false }) => {
  const Icon = item.icon

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={`group w-full rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-blue-200 hover:shadow-md ${
        compact ? 'p-4' : 'p-5'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              {'label' in item && (
                <span className="mb-2 inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                  {item.label}
                </span>
              )}
              <h3 className="font-semibold text-slate-950">{item.title}</h3>
            </div>
            <ArrowRight size={18} className="mt-1 shrink-0 text-slate-400 transition group-hover:text-blue-600" />
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
        </div>
      </div>
    </button>
  )
}

export default function Academy() {
  const navigate = useNavigate()

  const openModule = (item) => {
    navigate(item.route, item.state ? { state: item.state } : undefined)
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-5 pb-6 pt-12">
          <p className="text-sm font-medium text-blue-700">海乘学院</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">
            把资料学习变成岗位准备
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            这里不是单纯堆课程，而是围绕岗位认知、英语表达、面试准备和登船材料，帮你一步步减少申请试错。
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-6">
        <section className="mb-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">推荐学习顺序</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">先判断，再准备，再训练</h2>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {primaryModules.map(item => (
              <ModuleButton key={item.title} item={item} onOpen={openModule} />
            ))}
          </div>
        </section>

        <section className="space-y-6">
          {learningSections.map(section => (
            <div key={section.title}>
              <div className="mb-3">
                <h2 className="text-lg font-semibold text-slate-950">{section.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{section.description}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {section.items.map(item => (
                  <ModuleButton key={item.title} item={item} onOpen={openModule} compact />
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
