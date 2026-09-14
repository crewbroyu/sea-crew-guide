import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Target,
} from 'lucide-react'
import { getJobPreferenceLabel, getJobPreferences, sortByJobPreference } from '../../utils/jobPreferences'

const positions = [
  {
    key: 'retail',
    name: '免税店 / Retail Sales',
    level: '英语要求高',
    fit: '适合有销售经验、形象表达好、目标感强的人。',
    risk: '有销售 KPI，收入和排班可能随业绩波动。',
    focus: ['产品介绍', '推荐与加购', '处理价格异议', '会员与促销表达'],
    plan: ['先学零售服务流程', '补销售英语和产品描述', '练习 upselling 回答', '准备个人销售案例'],
    resources: [
      {
        title: 'Retail Associate 基础',
        platform: 'Alison',
        url: 'https://alison.com/course/an-introduction-to-retail-associate',
      },
      {
        title: 'Retail Sales & Customer Communication',
        platform: 'Alison',
        url: 'https://alison.com/course/retail-management-merchandising-sales-and-customer-communications',
      },
    ],
    foundationAvailable: true,
    preparationRoute: '/programs/retail',
  },
  {
    key: 'front_office',
    name: '前台 / Guest Service',
    level: '英语要求很高',
    fit: '适合英语较好、情绪稳定、能处理客诉和复杂沟通的人。',
    risk: '投诉压力高，需要快速判断问题并协调其他部门。',
    focus: ['Check-in / Check-out', '客诉处理', '船上指路', '解释政策与费用'],
    plan: ['先练客人问询句型', '补投诉处理表达', '练习电话与系统说明', '准备服务补救案例'],
    resources: [
      {
        title: 'Customer Service Skills',
        platform: 'Alison',
        url: 'https://alison.com/course/customer-service-skills',
      },
      {
        title: 'English for Tourism',
        platform: 'Alison',
        url: 'https://alison.com/course/english-for-tourism',
      },
    ],
    foundationAvailable: true,
  },
  {
    key: 'restaurant',
    name: '餐厅 / Restaurant',
    level: '英语要求中等',
    fit: '适合有餐饮、酒店或服务经验，能接受高峰期强度的人。',
    risk: '体力强度高，需要记菜单、服务流程和客人特殊要求。',
    focus: ['点单', '推荐菜品', '过敏提醒', '处理冷菜/错单/等待'],
    plan: ['先学餐厅服务流程', '练菜单和点单英语', '补过敏与投诉表达', '准备团队协作案例'],
    resources: [
      {
        title: 'Basic Waiter Training',
        platform: 'Alison',
        url: 'https://alison.com/course/food-and-beverage-restaurant-service-basic-waiter-s-training',
      },
      {
        title: 'Advanced Waiter Training',
        platform: 'Alison',
        url: 'https://alison.com/course/food-and-beverage-restaurant-service-advanced-waiter-s-training',
      },
    ],
    foundationAvailable: true,
  },
  {
    key: 'bar_server',
    name: '酒吧 / Bar Server',
    level: '英语要求中高',
    fit: '适合外向、反应快、能接受晚班和酒水销售的人。',
    risk: '需要记酒水、处理醉酒客人，并在忙时保持服务节奏。',
    focus: ['酒水推荐', '基础鸡尾酒', '负责任售酒', 'small talk 与小费表达'],
    plan: ['先理解酒吧运作', '补酒水分类和服务流程', '练推荐和拒酒表达', '准备高峰期案例'],
    resources: [
      {
        title: 'The Working Bartender',
        platform: 'Udemy',
        url: 'https://www.udemy.com/course/the-working-bartender-best-beginner-bartending-course-online/',
      },
      {
        title: 'Food and Beverage Service',
        platform: 'Alison',
        url: 'https://alison.com/course/food-and-beverage-service',
      },
    ],
    foundationAvailable: true,
    fullPackAvailable: true,
  },
  {
    key: 'housekeeping',
    name: '客房 / Housekeeping',
    level: '英语要求基础',
    fit: '适合英语基础较弱但认真、体力好、细节意识强的人。',
    risk: '重复度和体力强度高，晋升或转岗需要额外规划。',
    focus: ['敲门进入', '客人需求', '遗失物品', '维修与清洁反馈'],
    plan: ['先学客房标准流程', '练常见客人请求', '补安全和隐私表达', '准备细节服务案例'],
    resources: [
      {
        title: 'Basics of Housekeeping',
        platform: 'Alison',
        url: 'https://alison.com/course/basics-of-housekeeping',
      },
      {
        title: 'Housekeeping Tasks and Procedures',
        platform: 'Alison',
        url: 'https://alison.com/course/housekeeping-tasks-and-procedures',
      },
    ],
    foundationAvailable: true,
  },
  {
    key: 'youth_staff',
    name: 'Youth Staff',
    level: '英语要求高',
    fit: '适合喜欢带活动、能和儿童及家长沟通、有耐心的人。',
    risk: '不仅是看孩子，更要控场、设计活动并处理安全问题。',
    focus: ['活动指令', '安全提醒', '安抚儿童', '与家长反馈沟通'],
    plan: ['先学儿童照护基础', '练活动组织英语', '补安全规则表达', '准备带活动案例'],
    resources: [
      {
        title: 'Childcare and Young People Development',
        platform: 'Alison',
        url: 'https://alison.com/course/childcare-and-young-people-development',
      },
      {
        title: 'Basics of Youth Work and Leadership',
        platform: 'Alison',
        url: 'https://alison.com/course/basics-of-youth-work-and-leadership',
      },
    ],
    foundationAvailable: true,
  },
  {
    key: 'kitchen',
    name: '厨房帮厨 / Kitchen Steward',
    level: '英语要求基础',
    fit: '适合能接受后场高强度、重视食品安全和团队协作的人。',
    risk: '工作节奏快、环境辛苦，必须严格遵守食品卫生与设备安全流程。',
    focus: ['食品安全', '厨房指令', 'PPE 与设备安全', '团队交接'],
    plan: ['先学食品卫生', '补厨房操作英语', '练主管汇报', '准备高强度协作案例'],
    resources: [
      {
        title: 'Food Safety and Hygiene',
        provider: 'Alison',
        type: '免费课程',
        description: '学习食品污染、个人卫生与厨房安全的基础规则。',
        url: 'https://alison.com/course/food-safety-and-hygiene',
      },
    ],
    foundationAvailable: true,
  },
  {
    key: 'spa',
    name: 'SPA / Fitness',
    level: '英语要求中高',
    fit: '适合有美容、理疗、健身或健康服务经验的人。',
    risk: '专业资质、销售转化和英语咨询能力都会影响机会。',
    focus: ['服务介绍', '禁忌询问', '疗程推荐', '销售套餐'],
    plan: ['整理专业经历', '补咨询类英语', '练推荐与禁忌说明', '准备证书和案例'],
    resources: [],
    foundationAvailable: false,
  },
  {
    key: 'utility',
    name: '后勤 / Utility',
    level: '英语要求基础',
    fit: '适合希望低门槛上船、能接受后台和体力工作的人。',
    risk: '成长空间需要主动争取，不能只停留在“能上船”。',
    focus: ['安全规则', '清洁流程', '团队协作', '简单汇报'],
    plan: ['先掌握安全和清洁词汇', '练主管沟通', '补基础服务表达', '规划后续转岗方向'],
    resources: [],
    foundationAvailable: true,
  },
]

const CourseCard = ({ resource }) => (
  <a
    href={resource.url}
    target="_blank"
    rel="noopener noreferrer"
    className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-medium text-slate-500">{resource.platform}</p>
        <h4 className="mt-1 font-semibold text-slate-950">{resource.title}</h4>
      </div>
      <ExternalLink size={17} className="shrink-0 text-slate-400 transition group-hover:text-blue-600" />
    </div>
  </a>
)

const barServerTrainingPath = [
  {
    task: '任务5',
    area: '海乘学院',
    title: '岗位基础课',
    description: '学习酒水、杯具、卫生、服务流程与负责任售酒。',
    route: '/tasks/phase2/Task5?position=bar_server&source=academy',
  },
  {
    task: '任务6',
    area: '求职中心',
    title: '把经历变成英文回答',
    description: '整理服务案例、岗位动机和高压工作经历。',
    route: '/tasks/phase2/Task6?source=task5',
  },
  {
    task: '岗位模拟',
    area: '海乘学院',
    title: '真实工作场景训练',
    description: '扮演 Bar Server 与客人连续对话，获得反馈后重练。',
    route: '/programs/bar-server',
  },
  {
    task: '任务7',
    area: '海乘学院',
    title: '岗位题库与单题口语',
    description: '用真实岗位题检查知识、服务判断和英文表达。',
    route: '/academy/interview-questions?position=bar_server',
  },
  {
    task: '面试前',
    area: '求职中心',
    title: 'AI 模拟面试',
    description: '把岗位能力转换成招聘官听得懂的完整回答。',
    route: '/tasks/phase2/Task7/mock',
  },
]

export default function PositionEnglish() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preferences = useMemo(() => getJobPreferences(), [])
  const orderedPositions = useMemo(() => sortByJobPreference(positions, preferences), [preferences])
  const requestedKey = searchParams.get('position')
  const initialKey = positions.some((position) => position.key === requestedKey)
    ? requestedKey
    : positions.some((position) => position.key === preferences.primaryKey)
      ? preferences.primaryKey
      : 'retail'
  const [activeKey, setActiveKey] = useState(initialKey)
  const activePosition = positions.find(position => position.key === activeKey) || positions[0]
  const activePreference = getJobPreferenceLabel(activeKey, preferences)

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-5 pb-6 pt-12">
          <button
            type="button"
            onClick={() => navigate('/academy')}
            className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
          >
            <ArrowLeft size={16} />
            返回学院
          </button>
          <p className="text-sm font-medium text-blue-700">岗位英语</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">
            按目标岗位准备英语和面试表达
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            不同岗位需要的英语完全不同。先选目标岗位，再看你该补哪些表达、服务场景和面试案例。
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-6">
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <BriefcaseBusiness size={18} className="text-blue-600" />
            <h2 className="font-semibold text-slate-950">选择目标岗位</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {orderedPositions.map(position => {
              const preferenceLabel = getJobPreferenceLabel(position.key, preferences)
              return (
              <button
                key={position.key}
                type="button"
                onClick={() => setActiveKey(position.key)}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  activeKey === position.key
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-blue-200'
                }`}
              >
                <span>{position.name}</span>
                {preferenceLabel && (
                  <span className={`ml-2 rounded px-1.5 py-0.5 text-[11px] ${
                    activeKey === position.key ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'
                  }`}>{preferenceLabel}</span>
                )}
              </button>
              )
            })}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <section className="rounded-xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-sm font-medium text-blue-700">{activePreference ? `当前岗位 · ${activePreference}` : '浏览其他岗位'}</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">{activePosition.name}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-700">{activePosition.fit}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-white p-4">
                  <p className="text-xs font-medium text-slate-500">英语门槛</p>
                  <p className="mt-1 font-semibold text-slate-950">{activePosition.level}</p>
                </div>
                <div className="rounded-xl bg-white p-4">
                  <p className="text-xs font-medium text-slate-500">主要风险</p>
                  <p className="mt-1 text-sm font-medium leading-5 text-slate-950">{activePosition.risk}</p>
                </div>
              </div>
            </section>

            {activeKey === 'bar_server' && (
              <section className="overflow-hidden rounded-xl border border-blue-200 bg-white shadow-sm">
                <div className="border-b border-blue-100 bg-blue-50 px-5 py-4">
                  <p className="text-xs font-semibold text-blue-700">首个完整岗位包</p>
                  <h3 className="mt-1 font-semibold text-slate-950">Bar Server 不是一组面试题，而是一条完整训练路径</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">先学会怎么做这份工作，再练怎么回答，最后进入模拟面试。</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {barServerTrainingPath.map((step, index) => (
                    <button
                      key={step.title}
                      type="button"
                      onClick={() => navigate(step.route)}
                      className="flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-slate-50"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-semibold text-blue-700">{index + 1}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-blue-700">{step.task} · {step.area}</p>
                        <p className="mt-0.5 font-semibold text-slate-950">{step.title}</p>
                        <p className="mt-1 text-sm leading-5 text-slate-600">{step.description}</p>
                      </div>
                      <ArrowRight size={17} className="mt-2 shrink-0 text-slate-400" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {activeKey !== 'bar_server' && (
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold text-blue-700">任务5 · 岗位基础准备</p>
                <h3 className="mt-1 font-semibold text-slate-950">
                  {activePosition.foundationAvailable ? '基础培训任务已开放' : '基础培训课程制作中'}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {activePosition.foundationAvailable
                    ? '可以浏览岗位提纲、准备清单和学习资源；切换浏览不会锁住你的主申岗位。'
                    : '当前仍可查看岗位要求、英语重点和公开信息，完整基础课程上线后会接入同一任务路径。'}
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  {activePosition.foundationAvailable && (
                    <button
                      type="button"
                      onClick={() => navigate(`/tasks/phase2/Task5?position=${activeKey}&source=academy`)}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      进入基础培训任务<ArrowRight size={16} />
                    </button>
                  )}
                  {activePosition.preparationRoute && (
                    <button
                      type="button"
                      onClick={() => navigate(activePosition.preparationRoute)}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      查看岗位准备页<ArrowRight size={16} />
                    </button>
                  )}
                </div>
                <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                  完整岗位包：<span className="font-semibold text-slate-800">课程制作中</span>。基础内容和公开题库仍可正常浏览。
                </div>
              </section>
            )}

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Target size={19} className="text-blue-600" />
                <h3 className="font-semibold text-slate-950">优先补哪些英语</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {activePosition.focus.map(item => (
                  <div key={item} className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                    <span className="text-sm leading-5 text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <BookOpen size={19} className="text-blue-600" />
                <h3 className="font-semibold text-slate-950">建议学习顺序</h3>
              </div>
              <div className="space-y-3">
                {activePosition.plan.map((item, index) => (
                  <div key={item} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-semibold text-blue-700">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-slate-950">外部课程资源</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                这些是辅助学习资源，需要到外部平台自行注册。你的核心任务仍然是把表达练成面试可用。
              </p>
              <div className="mt-4 space-y-3">
                {activePosition.resources.length > 0 ? (
                  activePosition.resources.map(resource => (
                    <CourseCard key={resource.title} resource={resource} />
                  ))
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-medium text-amber-900">课程资源整理中</p>
                    <p className="mt-1 text-sm leading-6 text-amber-800">
                      这个岗位可以先用右侧的英语重点和学习顺序准备，后续再补充课程链接。
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-slate-950">下一步</h3>
              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={() => navigate(`/academy/interview-questions?position=${activePosition.key}`)}
                  disabled={activeKey === 'spa'}
                  className="flex w-full items-center justify-between rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {activeKey === 'bar_server' ? '进入 Bar Server 公开题库' : activeKey === 'spa' ? '岗位题库制作中' : '练习岗位面试问题'}
                  <ArrowRight size={17} />
                </button>
                {activeKey === 'bar_server' && (
                  <button
                    type="button"
                    onClick={() => navigate('/programs/bar-server')}
                    className="flex w-full items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    查看完整岗位包
                    <ArrowRight size={17} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate('/tasks/Task2')}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200"
                >
                  重新做岗位测评
                  <ArrowRight size={17} />
                </button>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start gap-3">
                <MessageSquare size={19} className="mt-0.5 shrink-0 text-blue-600" />
                <p className="text-sm leading-6 text-slate-600">
                  建议不要只收藏课程。每学一个表达，就立刻写成自己的面试回答或工作场景话术。
                </p>
              </div>
            </section>
          </aside>
        </section>
      </main>
    </div>
  )
}
