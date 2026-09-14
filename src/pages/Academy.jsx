import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  FileText,
  MapPin,
  MessageSquare,
  Mic2,
  Ship,
  Target,
} from 'lucide-react'
import { getInterviewPositionMeta } from '../utils/interviewPosition'
import { getJobPreferences } from '../utils/jobPreferences'

const primaryModules = [
  {
    title: '行业基础资料',
    description: '从入门认知、岗位区别、工资合同和登船流程开始，先判断这条路值不值得走。',
    route: '/academy/wiki',
    icon: BookOpen,
    label: '百科',
  },
  {
    title: '岗位课程目录',
    description: '先选岗位，再按基础课程、工作场景和面试表达的顺序学习。',
    route: '/academy/position-english',
    icon: BriefcaseBusiness,
    label: '岗位课程',
  },
  {
    title: '公开面试题库',
    description: '课程学完后，用岗位高频问题检查能否向招聘官讲清楚。',
    route: '/academy/interview-questions',
    icon: MessageSquare,
    label: '岗位问答',
  },
]

const learningSections = [
  {
    title: '已上线的完整岗位课程',
    description: '每个岗位包都有独立总目录，基础课程与工作场景分开进入',
    items: [
      {
        title: 'Bar Server 岗位课程',
        description: '9 天基础课程、4 级工作场景，以及独立的面试表达训练',
        route: '/programs/bar-server',
        state: { from: 'academy' },
        icon: Mic2,
      },
      {
        title: 'Retail Sales Associate 岗位课程',
        description: '8 天基础课程、5 级工作场景，以及独立的销售面试表达训练',
        route: '/programs/retail',
        state: { from: 'academy' },
        icon: BriefcaseBusiness,
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
  const preferences = useMemo(() => getJobPreferences(), [])
  const primaryPosition = getInterviewPositionMeta(preferences.primaryKey)

  const openModule = (item) => {
    navigate(item.route, item.state ? { state: item.state } : undefined)
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-5 pb-6 pt-12">
          <p className="text-sm font-medium text-blue-700">海乘学院</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">
            课程、实训和面试准备，各自解决一件事
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            基础课程学习岗位知识，工作场景训练实际服务能力，面试题库负责把能力说出来。完整 AI 模拟面试与申请跟进统一放在求职中心。
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-6">
        {preferences.primaryKey && (
          <section className="mb-6 border-l-4 border-blue-600 bg-white px-5 py-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Target size={20} className="mt-0.5 shrink-0 text-blue-700" />
                <div>
                  <p className="text-xs font-semibold text-blue-700">当前主申岗位</p>
                  <h2 className="mt-1 font-semibold text-slate-950">{primaryPosition ? `${primaryPosition.nameZh} · ${primaryPosition.nameEn}` : preferences.primaryKey}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    学院会优先显示你的主申与备选岗位，其他岗位仍然可以自由查看。
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/academy/position-english?position=${preferences.primaryKey}`)}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
              >
                继续岗位准备<ArrowRight size={17} />
              </button>
            </div>
          </section>
        )}

        <section className="mb-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">推荐学习顺序</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">先了解行业，再进入岗位课程，最后练面试表达</h2>
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
