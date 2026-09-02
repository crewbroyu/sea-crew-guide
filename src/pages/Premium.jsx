import { useEffect } from 'react'
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
import { hasProductEntitlement } from '../services/activationService'
import { trackProductEvent } from '../services/productAnalyticsService'

const included = [
  {
    title: '7 天岗位基础训练',
    description: '酒水分类、经典饮品、服务流程、安全边界与高频工作判断。',
    icon: Route,
  },
  {
    title: '40 道岗位面试题库',
    description: '围绕真实 Bar Server 招聘重点准备答案卡，并用语音反复演练。',
    icon: FileText,
  },
  {
    title: 'AI 面试训练与反馈',
    description: '逐题转写、岗位知识评分、英文表达建议、参考答案与完整模拟。',
    icon: Sparkles,
  },
  {
    title: '训练记录与准备度',
    description: '沉淀每次回答、分数变化和当前短板，知道自己是否接近可面试状态。',
    icon: Target,
  },
]

const freeItems = ['浏览海乘百科和岗位内容', '完成基础职业测评', '查看基础岗位推荐', '试学岗位英语和面试题库']
const premiumItems = ['完整 Bar Server 岗位基础训练', '全部岗位题库与语音演练', 'AI逐题反馈与完整模拟面试', '训练记录、短板和准备度报告']

export default function Premium() {
  const navigate = useNavigate()
  const access = useEffectiveAccess()
  const { isRegistered, openRegisterModal, openUnlockModal } = access
  const hasBarServerPack = hasProductEntitlement(access, 'bar_server_pack')

  useEffect(() => {
    trackProductEvent('product_page_viewed', { properties: { hasAccess: hasBarServerPack } })
  }, [hasBarServerPack])

  const handlePrimaryAction = () => {
    trackProductEvent(hasBarServerPack ? 'product_training_entered' : 'activation_cta_clicked', {
      properties: { isRegistered },
    })
    if (!isRegistered) {
      openRegisterModal()
      return
    }

    if (!hasBarServerPack) {
      openUnlockModal()
      return
    }

    navigate('/tasks/phase2/Task5')
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
              <p className="text-sm font-medium text-blue-700">CrewPathGuide · 首个岗位产品</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">
                Bar Server 单职位全流程包
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
                从岗位知识、场景英语和题库练习，一路练到 AI 模拟面试与准备度判断。产品目标不是让你看完资料，而是把回答真正练出来。
              </p>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-sm font-medium text-blue-900">当前阶段</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {hasBarServerPack ? '已拥有 Bar Server 完整权益' : isRegistered ? '已登录，可输入激活码' : '可先免费体验'}
              </p>
              <p className="mt-2 text-sm leading-6 text-blue-800">
                正式参考价 ¥199 / 180 天。当前测试阶段仍通过激活码开通，不在页面内直接收款。
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
                  先免费完成 3 个真实场景，每题都有完整 AI 反馈和重练对比，再判断是否继续。
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/programs/bar-server')}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              免费体验前 3 个场景
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
            <h2 className="font-semibold text-slate-950">Bar Server 完整包</h2>
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
              <p className="text-xs font-semibold text-blue-700">正式参考价</p>
              <p className="mt-1 text-3xl font-bold text-slate-950">¥199 <span className="text-sm font-medium text-slate-500">/ 180 天</span></p>
              <h2 className="mt-3 font-semibold text-slate-950">适合现在购买/激活的人</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                已经认真考虑海乘、想确定岗位、正在准备英文简历或面试、担心申请路线走错的人。
              </p>
            </div>
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              {hasBarServerPack ? '进入完整岗位训练' : isRegistered ? '输入激活码' : '登录后获取激活'}
              <ArrowRight size={17} />
            </button>
          </div>

          <div className="mt-5 rounded-lg bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <MessageSquare size={18} className="mt-0.5 shrink-0 text-blue-600" />
              <p className="text-sm leading-6 text-slate-600">
                当前为首轮正式测试，付款仍由人工确认并发放激活码；页面不会自动扣款。后续验证真实需求后再接在线订单与支付。
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
