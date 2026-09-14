import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpenCheck, CheckCircle2, FileText, Mic, ShoppingBag, Sparkles, Target } from 'lucide-react'
import RequireActivation from '../../components/RequireActivation'
import RetailFoundationTraining from '../../components/training/RetailFoundationTraining'
import useEffectiveAccess from '../../hooks/useEffectiveAccess'
import { hasProductEntitlement } from '../../services/activationService'
import { getCompletedRetailDays, getRetailFoundationProgress, retailFoundationDays } from '../../data/retailFoundation'

const PRODUCT_CODE = 'retail_sales_pack'

const stages = [
  { title: '岗位基础课', description: '8 天完成岗位、销售流程、产品、KPI、异议、POS、库存与服务补救。', icon: BookOpenCheck },
  { title: '每日开口训练', description: '每个知识点立即听一句、跟读三次，再完成 Guest Challenge。', icon: Mic },
  { title: '邮轮零售模拟器', description: '与 Guest 连续对话，从自然接待一路练到 Sea Day 高压销售。', icon: Sparkles },
  { title: '题库与面试转换', description: '把岗位能力转成真实可讲的面试证据，再进入 AI 模拟面试。', icon: FileText },
]

export default function RetailPreparationPack() {
  const navigate = useNavigate()
  const access = useEffectiveAccess()
  const hasPack = hasProductEntitlement(access, PRODUCT_CODE)
  const [activeView, setActiveView] = useState('overview')
  const [foundationProgress, setFoundationProgress] = useState(() => getRetailFoundationProgress())
  const completedDays = useMemo(() => getCompletedRetailDays(foundationProgress), [foundationProgress])

  const startTraining = () => {
    if (!hasPack) {
      access.isRegistered ? access.openUnlockModal() : access.openRegisterModal()
      return
    }
    setActiveView('course')
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-5 pb-7 pt-11">
          <button type="button" onClick={() => navigate('/academy/position-english?position=retail')} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700"><ArrowLeft size={17} />返回免税店岗位课程</button>
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-medium text-blue-700">第二个完整岗位模板 · 内测中</p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight text-slate-950">Retail Sales Associate 邮轮免税店岗位包</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">不是泛泛学销售，也不是背面试答案。先掌握真实船上零售流程，立即开口服务客人，再用连续场景检查你是否真的能做这份工作。</p>
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-5 py-4">
              <p className="text-xs font-medium text-blue-700">FOUNDATION PROGRESS</p>
              <p className="mt-1 text-2xl font-bold text-blue-950">{completedDays}/{retailFoundationDays.length} days</p>
              <p className="mt-1 text-xs text-blue-800">{hasPack ? 'Retail 岗位权益已开通' : '完整训练需 Retail 岗位权益'}</p>
            </div>
          </div>

          <div className="mt-6 flex gap-2 overflow-x-auto border-b border-slate-200">
            {[['overview', '岗位包首页'], ['course', '8 天基础课'], ['simulator', '岗位模拟器']].map(([key, label]) => <button key={key} type="button" onClick={() => key === 'course' && !hasPack ? startTraining() : setActiveView(key)} className={`shrink-0 border-b-2 px-3 py-3 text-sm font-semibold ${activeView === key ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500'}`}>{label}</button>)}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-7">
        {activeView === 'overview' && (
          <div className="space-y-7">
            <section className="grid gap-4 md:grid-cols-2">
              <div className="border-l-4 border-emerald-500 bg-white px-5 py-4"><h2 className="font-semibold text-slate-950">适合这样的人</h2><p className="mt-2 text-sm leading-6 text-slate-600">有销售、客服、美妆、珠宝、腕表、奢侈品、酒店或其他面对客人经验，愿意主动交流并接受销售目标。</p></div>
              <div className="border-l-4 border-amber-500 bg-white px-5 py-4"><h2 className="font-semibold text-slate-950">先接受现实</h2><p className="mt-2 text-sm leading-6 text-slate-600">这不是轻松逛店。你需要长时间站立、主动接近客人、学习多个品类，在 Sea Day 和活动时段承受客流与 KPI 压力。</p></div>
            </section>

            <section>
              <p className="text-sm font-medium text-blue-700">完整训练闭环</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">从会介绍，到能成交，再到能通过面试</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">{stages.map((stage) => { const Icon = stage.icon; return <article key={stage.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><Icon size={20} /></div><h3 className="mt-4 font-semibold text-slate-950">{stage.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{stage.description}</p></article> })}</div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center"><div><p className="text-xs font-semibold text-blue-700">YOUR NEXT STEP</p><h2 className="mt-1 font-semibold text-slate-950">先完成 Day 1，再决定这个岗位是否适合你</h2><p className="mt-2 text-sm leading-6 text-slate-600">第二岗位包目前用于内部验收，尚未在公开价格页销售。管理员可直接体验；正式销售前会单独确认定价与权益。</p></div><button type="button" onClick={startTraining} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white">{hasPack ? '开始 8 天基础课' : '登录并验证岗位权益'}<ArrowRight size={17} /></button></div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <button type="button" onClick={() => navigate('/assessment')} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 text-left text-sm font-semibold text-slate-800"><span className="flex items-center gap-2"><Target size={18} className="text-blue-700" />岗位适配评估</span><ArrowRight size={16} /></button>
              <button type="button" onClick={() => navigate('/tasks/phase2/Task6?source=task5')} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 text-left text-sm font-semibold text-slate-800"><span className="flex items-center gap-2"><Mic size={18} className="text-blue-700" />整理英文答案</span><ArrowRight size={16} /></button>
              <button type="button" onClick={() => navigate('/academy/interview-questions?position=retail')} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 text-left text-sm font-semibold text-slate-800"><span className="flex items-center gap-2"><FileText size={18} className="text-blue-700" />Retail 公开题库</span><ArrowRight size={16} /></button>
              <button type="button" onClick={() => navigate('/tasks/phase2/Task4')} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 text-left text-sm font-semibold text-slate-800"><span className="flex items-center gap-2"><ShoppingBag size={18} className="text-blue-700" />整理 Retail 简历</span><ArrowRight size={16} /></button>
            </section>
          </div>
        )}

        {activeView === 'course' && <RequireActivation variant="inline" productCode={PRODUCT_CODE}><RetailFoundationTraining initialProgress={foundationProgress} onProgressChange={setFoundationProgress} onStartQuestions={() => navigate('/academy/interview-questions?position=retail')} onStartSimulation={() => navigate('/programs/retail/training')} /></RequireActivation>}

        {activeView === 'simulator' && (
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3"><Sparkles size={22} className="mt-0.5 shrink-0 text-blue-700" /><div><p className="text-xs font-semibold text-blue-700">CRUISE JOB SIMULATOR</p><h2 className="mt-1 text-xl font-semibold text-slate-950">5 levels of onboard retail practice</h2><p className="mt-2 text-sm leading-6 text-slate-600">Approach, discovery, recommendation, objections, service recovery and a high-pressure Sea Day interaction. Each simulation includes an AI follow-up, six skill scores, history and weakest-skill recommendation.</p></div></div>
            <button type="button" onClick={() => navigate('/programs/retail/training')} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white">Enter the Retail Job Simulator<ArrowRight size={17} /></button>
            <p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><CheckCircle2 size={14} className="text-emerald-600" />Training history is stored separately from Bar Server progress.</p>
          </section>
        )}
      </main>
    </div>
  )
}
