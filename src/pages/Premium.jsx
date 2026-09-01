import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  MessageSquare,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  Wine,
} from 'lucide-react'
import useEffectiveAccess from '../hooks/useEffectiveAccess'

const included = [
  {
    title: '海乘职业路线报告',
    description: '基于测评结果、目标岗位和当前短板，整理适合你的岗位方向和准备顺序。',
    icon: Route,
  },
  {
    title: '英文简历优化路径',
    description: '把服务、销售、酒店或普通工作经历，转换成更像邮轮岗位的英文表达。',
    icon: FileText,
  },
  {
    title: 'AI 面试训练与反馈',
    description: '围绕目标岗位练习回答，后续接入 AI 评分、追问和回答优化。',
    icon: Sparkles,
  },
  {
    title: '申请路线判断',
    description: '判断更适合低成本 DIY、指导型 DIY，还是中介/一代渠道。',
    icon: Target,
  },
]

const freeItems = ['浏览海乘百科和岗位内容', '完成基础职业测评', '查看基础岗位推荐', '试学岗位英语和面试题库']
const premiumItems = ['保存完整申请档案', '生成 90 天准备路线', '解锁 AI 面试核心能力', '获得简历/面试/渠道的下一步建议']

export default function Premium() {
  const navigate = useNavigate()
  const { isRegistered, isUnlocked, openRegisterModal, openUnlockModal } = useEffectiveAccess()

  const handlePrimaryAction = () => {
    if (!isRegistered) {
      openRegisterModal()
      return
    }

    if (!isUnlocked) {
      openUnlockModal()
      return
    }

    navigate('/profile')
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-5 pb-8 pt-12">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
          >
            <ArrowLeft size={16} />
            返回首页
          </button>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <p className="text-sm font-medium text-blue-700">Crew PathGuide Premium</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">
                从“看资料”升级成“有人帮你规划申请”
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
                免费内容帮你了解海乘。激活后，重点解决更具体的问题：我适合哪个岗位、简历怎么写、面试怎么答、接下来 90 天该怎么准备。
              </p>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-sm font-medium text-blue-900">当前阶段</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {isUnlocked ? '已激活完整功能' : isRegistered ? '已登录，等待激活' : '可先免费体验'}
              </p>
              <p className="mt-2 text-sm leading-6 text-blue-800">
                当前为内测阶段，建议通过激活码开放给高意向用户。
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-6">
        <section className="mb-8 border-l-4 border-blue-600 bg-white px-5 py-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Wine size={21} className="mt-0.5 shrink-0 text-blue-700" />
              <div>
                <p className="text-xs font-medium text-blue-700">正在验证的首个岗位产品</p>
                <h2 className="mt-1 font-semibold text-slate-950">Bar Server 场景语音训练</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  先免费完成一次回答、AI 反馈和重练对比，再判断完整岗位训练是否有价值。
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/programs/bar-server')}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              免费体验完整闭环
              <ArrowRight size={16} />
            </button>
          </div>
        </section>

        <section className="mb-8 grid gap-4 md:grid-cols-2">
          {included.map((item) => {
            const Icon = item.icon

            return (
              <article key={item.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Icon size={22} />
                </div>
                <h2 className="font-semibold text-slate-950">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              </article>
            )
          })}
        </section>

        <section className="mb-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-950">免费版</h2>
            <div className="mt-4 space-y-3">
              {freeItems.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-600" />
                  <p className="text-sm leading-5 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-950">激活后</h2>
            <div className="mt-4 space-y-3">
              {premiumItems.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <ShieldCheck size={17} className="mt-0.5 shrink-0 text-blue-600" />
                  <p className="text-sm leading-5 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-semibold text-slate-950">适合现在购买/激活的人</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                已经认真考虑海乘、想确定岗位、正在准备英文简历或面试、担心申请路线走错的人。
              </p>
            </div>
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              {isUnlocked ? '进入申请进度中心' : isRegistered ? '输入激活码' : '登录后获取激活'}
              <ArrowRight size={17} />
            </button>
          </div>

          <div className="mt-5 rounded-lg bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <MessageSquare size={18} className="mt-0.5 shrink-0 text-blue-600" />
              <p className="text-sm leading-6 text-slate-600">
                价格和购买方式建议后续放在这里：例如微信咨询、付款后发激活码、或接入在线支付。现在先把“为什么激活”讲清楚。
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
