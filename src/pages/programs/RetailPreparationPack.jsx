import RetailLearningOverview from '../../components/training/RetailLearningOverview'
import useRetailScenarioSummary from '../../hooks/useRetailScenarioSummary'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpenCheck, CalendarDays, Check, FileText, Headphones, Sparkles, TimerReset, BarChart3 } from 'lucide-react'



import useEffectiveAccess from '../../hooks/useEffectiveAccess'
import useRetailPracticeProgress from '../../hooks/useRetailPracticeProgress'
import useRetailFoundationSummary from '../../hooks/useRetailFoundationSummary'
import { hasProductEntitlement } from '../../services/activationService'
import { getCompletedRetailDays } from '../../data/retailFoundation'
import { RETAIL_LEARNING_STAGES, RETAIL_LISTENING_DRILLS } from '../../data/retailListening'
import { getRetailPlanProgress } from '../../data/retailLearningPlan'


const sections=[
 {id:'specialists',title:'三条独立专修课程',description:'Beauty Specialist、Chanel Ambassador 与 Watch Specialist；每条 6 单元，独立练习与进度。',route:'/programs/retail/specialists',icon:BookOpenCheck},
 {id:'brands',title:'品牌基础与船店样本',description:'首批 12 个品牌；按运营公司、船舶及商品类型学习，分清历史来源与当前库存。',route:'/programs/retail/brands',icon:BookOpenCheck},
 {id:'foundation',title:'8 天岗位基础课',description:'从接待和需求发现，到产品表达、KPI、POS、库存和服务补救。',route:'/programs/retail/foundation',icon:BookOpenCheck},
 {id:'knowledge',title:'产品与运营知识库',description:'十个品类与运营模块，完成判断题、英文表达自检，再连接听说和实训。',route:'/programs/retail/foundation?view=knowledge',icon:BookOpenCheck},
 {id:'listening',title:'工作听说 · 12 个场景',description:'先听预算、尺码、促销和指令，再核对信息并完成开口回应。',route:'/programs/retail/listening',icon:Headphones},
 {id:'simulation',title:'岗位模拟 · 5 个等级',description:'从自然接待到 Sea Day 高峰，与客人连续对话并复盘六项能力。',route:'/programs/retail/training',icon:Sparkles},
 {id:'shift',title:'限时班次 · 5 题挑战',description:'正常语速只听一次，30 秒内作答；结束后集中复盘。',route:'/programs/retail/listening/shift',icon:TimerReset},
 {id:'interview',title:'面试与真实经历',description:'整理销售经历、异议处理和团队合作，形成自己的英文案例。',route:'/tasks/phase2/Task6?source=task5',icon:FileText},
]
const orders={job_search:['foundation','knowledge','brands','specialists','interview','listening','simulation','shift'],first_contract:['foundation','knowledge','brands','specialists','listening','simulation','shift','interview'],experienced:['shift','listening','simulation','knowledge','brands','specialists','foundation','interview']}

export default function RetailPreparationPack() {
 const navigate=useNavigate(),access=useEffectiveAccess()
 const practice=useRetailPracticeProgress()
 const {progress:foundationProgress,error:foundationError}=useRetailFoundationSummary()
 const scenario=useRetailScenarioSummary()
 const hasPack=hasProductEntitlement(access,'retail_sales_pack')
 const plan=getRetailPlanProgress(practice.stageId,{...practice,foundationProgress,scenarioCompletedCount:scenario.profile?.completed_scenario_count})
 const stage=RETAIL_LEARNING_STAGES.find(item=>item.id===practice.stageId) || RETAIL_LEARNING_STAGES[0]
 const completedDays=getCompletedRetailDays(foundationProgress)
 const listeningCount=RETAIL_LISTENING_DRILLS.filter(drill=>practice.listeningProgress[drill.id]?.completedAt).length
 const speakingCount=RETAIL_LISTENING_DRILLS.filter(drill=>practice.listeningProgress[drill.id]?.speakingPractice?.completedAt).length
 const ordered=orders[stage.id].map(id=>sections.find(section=>section.id===id))
 return <div className="min-h-screen bg-slate-50 pb-24">
  <header className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-5xl px-5 pb-7 pt-10">
   <button type="button" onClick={()=>navigate('/academy/position-english?position=retail')} className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600"><ArrowLeft size={17}/>返回免税店岗位课程</button>
   <div className="grid gap-6 md:grid-cols-[1fr_280px] md:items-center"><div><p className="text-sm font-semibold text-blue-700">完整岗位课程 · Retail Sales Associate</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">从接待客人，到完成销售，再到应对真实班次</h1><p className="mt-3 text-sm leading-6 text-slate-600">基础课、产品知识、工作听说、场景实训和面试表达，按你的阶段安排下一步。</p><p className="mt-3 text-xs text-blue-700">{hasPack?'Retail 岗位权益已开通':'Day 1 免费体验 · 完整训练需 Retail 岗位权益'}</p></div><img src="/images/retail/scenarios/sea-day-event.webp" alt="邮轮零售团队在繁忙活动中服务客人" className="aspect-video w-full rounded-lg object-cover"/></div>
  </div></header>
  <main className="mx-auto max-w-5xl space-y-7 px-5 py-7">
   <section><h2 className="text-xl font-semibold text-slate-950">你目前在哪个阶段？</h2><p className="mt-2 text-sm text-slate-600">切换阶段只调整学习顺序，已完成的训练继续计入。</p><div className="mt-4 grid gap-3 md:grid-cols-3">{RETAIL_LEARNING_STAGES.map(item=><button type="button" key={item.id} onClick={()=>practice.selectLearningStage(item.id)} aria-pressed={stage.id===item.id} className={'rounded-lg border p-4 text-left '+(stage.id===item.id?'border-blue-600 bg-blue-50':'border-slate-200 bg-white')}><span className="block font-semibold text-slate-900">{item.label}</span><span className="mt-2 block text-xs leading-5 text-slate-600">{item.description}</span></button>)}</div></section>
   <section className="rounded-lg border border-slate-200 bg-white p-5"><p className="flex items-center gap-2 text-xs font-semibold text-blue-700"><CalendarDays size={16}/>阶段化 14 训练日计划</p><div className="mt-3 flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold text-slate-950">{plan.isComplete?'当前阶段计划已完成':'下一步：第 '+plan.currentItem.day+' 天 · '+plan.currentItem.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">按训练日推进，不要求连续打卡。基础课与场景旧记录自动计入，新增听说和班次单独记录。</p></div><span className="shrink-0 text-2xl font-bold text-slate-950">{plan.completedCount}/14</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-blue-600" style={{width:plan.percent+'%'}}/></div>
    <button type="button" onClick={()=>navigate(plan.isComplete?'/programs/retail/report':plan.currentItem.route)} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white">{plan.isComplete?'查看准备度报告':'继续今天的训练'}<ArrowRight size={16}/></button>
    <details className="mt-5"><summary className="cursor-pointer text-sm font-semibold text-slate-700">查看完整 14 训练日安排</summary><div className="mt-3 divide-y divide-slate-200">{plan.items.map(item=><div key={item.id} className="flex items-start gap-3 py-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm text-blue-700">{item.completed?<Check size={15}/>:item.day}</span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-900">{item.title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{item.description}</p></div><button type="button" onClick={()=>navigate(item.route)} className="min-h-9 shrink-0 px-2 text-sm font-semibold text-blue-700">{item.completed?'复习':'打开'}</button></div>)}</div></details>
    <p className="mt-4 text-xs text-slate-500">{practice.syncStatus==='synced'?'训练记录和阶段选择已同步到账户':practice.syncStatus==='local'?(access.isRegistered?'当前使用本机记录，可重试账户同步':'当前保存在本机，登录后可使用账户同步'):'正在同步训练记录…'}</p>{practice.syncStatus==='local' && access.isRegistered && <button type="button" onClick={practice.retrySync} className="mt-2 text-xs font-semibold text-blue-700">重试同步</button>}
    {(foundationError || scenario.error) && <p className="mt-3 text-sm text-amber-800">{foundationError} {scenario.error}</p>}
   </section>
   <section className="grid grid-cols-2 gap-3 md:grid-cols-4">{[['基础课',completedDays+'/8 天'],['听力通过',listeningCount+'/12'],['开口完成',speakingCount+'/12'],['最近班次',practice.shiftHistory.length?practice.shiftHistory[0].score+' 分':'尚未挑战']].map(([label,value])=><div key={label} className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-xl font-bold text-slate-950">{value}</p></div>)}</section>
   <RetailLearningOverview progress={practice.moduleProgress}/>
   <section className="flex flex-col justify-between gap-4 rounded-lg bg-slate-950 p-5 text-white sm:flex-row sm:items-center"><div><h2 className="flex items-center gap-2 font-semibold"><BarChart3 size={20}/>我的 Retail 岗位准备度</h2><p className="mt-2 text-sm leading-6 text-slate-300">汇总五项训练证据，查看目前缺少什么、下一步练什么。</p></div><button type="button" onClick={()=>navigate('/programs/retail/report')} className="min-h-11 shrink-0 rounded-lg bg-white px-4 text-sm font-semibold text-slate-950">查看报告</button></section>
   <section><h2 className="text-xl font-semibold text-slate-950">为“{stage.label}”推荐的课程顺序</h2><div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{ordered.map((section,index)=>{const Icon=section.icon;return <article key={section.id} className="flex flex-col rounded-lg border border-slate-200 bg-white p-5"><div className="flex items-center justify-between text-blue-700"><Icon size={21}/><span className="text-xs text-slate-400">0{index+1}</span></div><h3 className="mt-4 font-semibold text-slate-950">{section.title}</h3><p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{section.description}</p><button type="button" onClick={()=>navigate(section.route)} className="mt-4 inline-flex min-h-11 items-center justify-between rounded-lg bg-blue-50 px-4 text-sm font-semibold text-blue-700">进入训练<ArrowRight size={16}/></button></article>})}</div></section>
   <section className="rounded-lg border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-950">我的面试经历素材</h2><p className="mt-2 text-sm leading-6 text-slate-600">完成 Task6 后，确认已整理需求发现、异议处理和团队协作三个真实案例。这是素材完成标记，不是口语评分。</p><button type="button" disabled={Boolean(practice.interviewCompletedAt)} onClick={practice.markInterviewReady} className="mt-3 min-h-11 rounded-lg border border-blue-200 px-4 text-sm font-semibold text-blue-700 disabled:text-emerald-700">{practice.interviewCompletedAt?'已确认素材整理完成':'我已整理三个真实案例'}</button></section>
   <section className="rounded-lg border border-amber-200 bg-amber-50 p-5"><h2 className="font-semibold text-amber-950">先体验，再决定是否继续</h2><p className="mt-2 text-sm leading-6 text-amber-900">Day 1 保持免费。Day 2 起、产品知识库及完整实训沿用 Retail 岗位包权益。</p><button type="button" onClick={()=>navigate('/programs/retail/foundation/retail-role-rhythm')} className="mt-3 min-h-11 rounded-lg bg-amber-700 px-4 text-sm font-semibold text-white">体验 Day 1</button></section>
   <nav className="flex flex-wrap gap-3">{[['Retail 公开题库','/academy/interview-questions?position=retail'],['AI 模拟面试','/tasks/phase2/Task7/mock?position=retail'],['岗位适配评估','/assessment'],['整理简历','/tasks/phase2/Task4']].map(([title,route])=><button key={title} type="button" onClick={()=>navigate(route)} className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-700">{title}</button>)}</nav>
  </main>
 </div>
}
