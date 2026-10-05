import { Link, useParams, useSearchParams } from 'react-router-dom'
import { RETAIL_SPECIALIST_COURSES, RETAIL_SPECIALIST_SOURCES, getRetailSpecialistCourse, getSpecialistProgress } from '../../data/retailSpecialistCourses'
import { RETAIL_KNOWLEDGE_CURRICULUM } from '../../data/retailKnowledgeCurriculum'
import { moduleComplete, moduleProgressKey } from '../../data/retailModuleProgress'
import useRetailPracticeProgress from '../../hooks/useRetailPracticeProgress'
import useEffectiveAccess from '../../hooks/useEffectiveAccess'
import { useTrainingInspection } from '../../hooks/useTrainingInspection'
import RetailModulePractice from '../../components/training/RetailModulePractice'

export default function RetailSpecialistCourses() {
 const {specialistId}=useParams(), [params,setParams]=useSearchParams()
 const access=useEffectiveAccess(), inspection=useTrainingInspection()
 const readOnly=inspection || access.isPreviewing
 const practice=useRetailPracticeProgress({readOnly})
 const course=getRetailSpecialistCourse(specialistId)
 const route=id=>'/programs/retail/specialists/'+id
 const select=id=>setParams({lesson:id})
 if(specialistId && !course) return <main className="mx-auto max-w-3xl p-8"><h1 className="text-2xl font-semibold">未找到这条专修课程</h1><Link className="mt-4 block text-blue-700" to="/programs/retail/specialists">返回专修课程目录</Link></main>
 const summary=course?getSpecialistProgress(course,practice.moduleProgress):null
 const requested=params.get('lesson')
 const selected=course?(course.modules.find(module=>module.id===requested) || course.modules[0]):null
 const index=course?course.modules.indexOf(selected):0
 return <div className="min-h-screen bg-slate-50 px-5 py-9 pb-24"><main className="mx-auto max-w-6xl space-y-6">
  <nav className="flex flex-wrap gap-5 text-sm font-semibold text-blue-700"><Link to="/programs/retail">← Retail 职位包</Link><Link to="/programs/retail/specialists">专修课程目录</Link><Link to="/programs/retail/brands">品牌与船店样本</Link></nav>
  <header><p className="text-sm font-semibold text-blue-700">RETAIL · SPECIALIST PATHWAYS</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">{course?course.name:'选择你的专修方向'}</h1><p className="mt-3 leading-7 text-slate-600">{course?course.description:'共同基础之上，按实际柜台职责选择三条独立课程。每条 6 个单元，分别记录学习进度。'}</p></header>
  <aside className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">本站原创岗位准备课程，公开资料用于知识核验；训练完成不代表品牌认证或雇主任职授权。实际产品、服务流程与操作权限以雇主培训为准。Chanel Ambassador 方向聚焦香水与美妆柜台。</aside>
  <p role="status" className="text-xs text-slate-500">{readOnly?'只读预览：练习不会保存':practice.syncStatus==='synced'?'专修训练记录已同步':practice.syncStatus==='local'?'当前使用本机记录，账户同步暂不可用':'正在同步训练记录…'}{!readOnly && practice.syncStatus==='local' && <button type="button" onClick={practice.retrySync} className="ml-3 text-blue-700 underline">重试同步</button>}</p>
  {!course?<section className="grid gap-5 lg:grid-cols-3">{RETAIL_SPECIALIST_COURSES.map(item=>{const status=getSpecialistProgress(item,practice.moduleProgress);return <article key={item.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-6"><p className="text-sm text-blue-700">{item.subtitle}</p><h2 className="mt-3 text-xl font-semibold">{item.name}</h2><p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{item.description}</p><ol className="my-5 space-y-2 text-sm text-slate-700">{item.modules.map((module,i)=><li key={module.id}>{i+1}. {module.title}</li>)}</ol><p className="text-sm font-semibold">完成 {status.completedCount}/{status.total}</p><Link to={route(item.id)+'?lesson='+(status.next?.id || item.modules[0].id)} className="mt-4 rounded-lg bg-blue-700 px-4 py-3 text-center text-sm font-semibold text-white">{status.next?'进入课程':'复习课程'}</Link></article>})}</section>:<>
   <section className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex justify-between gap-3"><h2 className="font-semibold">{course.subtitle}</h2><span>{summary.completedCount}/{summary.total}</span></div><progress aria-label="专修课程进度" value={summary.completedCount} max={summary.total} className="mt-4 h-3 w-full accent-blue-700"/><p className="mt-3 text-sm text-slate-600">{summary.next?'每个单元需通过判断题，并保存英文表达自检。':'本课程六个单元均已完成，可复习或继续岗位模拟。'}此进度独立记录，暂不计入 Retail 准备度评分。</p><Link className="mt-3 block text-sm font-semibold text-blue-700" to={'/programs/retail/foundation?view=knowledge&module='+course.prerequisite}>{moduleComplete(practice.moduleProgress[moduleProgressKey(RETAIL_KNOWLEDGE_CURRICULUM[course.prerequisite])])?'已完成建议先修 · 返回复习':'建议先修 · '+(course.prerequisite==='watch-basics'?'腕表基础':'香水、美妆基础')+'（可直接学习专修）'}</Link></section>
   <div className="grid items-start gap-6 lg:grid-cols-[260px_1fr]"><nav aria-label="专修单元" className="space-y-2">{course.modules.map((module,i)=><button key={module.id} type="button" aria-current={selected.id===module.id?'step':undefined} onClick={()=>select(module.id)} className={'block w-full rounded-lg border p-4 text-left text-sm '+(selected.id===module.id?'border-blue-600 bg-blue-50 text-blue-900':'border-slate-200 bg-white text-slate-700')}><span className="font-semibold">{i+1}. {module.title}</span><span className="mt-1 block text-xs">{moduleComplete(practice.moduleProgress[moduleProgressKey(module.lesson)])?'已完成':'待练习'}</span></button>)}</nav>
    <article className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
     {requested && !course.modules.some(module=>module.id===requested) && <p role="status" className="text-sm text-amber-800">未找到指定单元，已显示本课程第一单元。</p>}
     <header><p className="text-xs font-semibold text-blue-700">UNIT {index+1} / {summary.total}</p><h2 className="mt-2 text-2xl font-semibold">{selected.title}</h2><p className="mt-3 text-sm leading-6 text-slate-600">学习目标：{selected.objective}</p></header>
     <ol className="space-y-4">{selected.points.map((point,i)=><li key={point} className="flex gap-3 text-sm leading-7 text-slate-700"><span className="font-bold text-blue-700">0{i+1}</span><span>{point}</span></li>)}</ol>
     <section className="rounded-lg bg-slate-100 p-4"><h3 className="text-xs font-semibold text-slate-500">SALES FLOOR ENGLISH · 表达示例</h3><p className="mt-2 leading-7 text-slate-900">{selected.phrase}</p><p className="mt-2 text-xs text-slate-500">先出声练习，再改写成自己的回应。下方保存的是文字自检。</p></section>
     <RetailModulePractice key={access.userId+':'+moduleProgressKey(selected.lesson)} lesson={selected.lesson} question={selected.lesson.question} progress={practice.moduleProgress} onSave={practice.updateModuleProgress} readOnly={readOnly}/>
     <nav className="flex flex-wrap justify-between gap-3"><button type="button" disabled={index===0} onClick={()=>select(course.modules[index-1].id)} className="rounded border border-slate-300 px-4 py-2 text-sm disabled:opacity-40">上一单元</button>{index<course.modules.length-1?<button type="button" onClick={()=>select(course.modules[index+1].id)} className="rounded bg-blue-700 px-4 py-2 text-sm text-white">下一单元</button>:<Link to="/programs/retail/training" className="rounded bg-blue-700 px-4 py-2 text-sm text-white">继续 Retail 岗位模拟</Link>}</nav>
    </article>
   </div>
   <footer className="rounded-lg border border-slate-200 bg-white p-5 text-sm"><h2 className="font-semibold">知识来源与适用范围</h2><p className="mt-2 leading-6 text-slate-600">资料核验：2026-10-05。以下来源支持产品与安全常识；本页销售情境和练习由本站编写，不代表品牌或船店内部 SOP。</p><div className="mt-3 flex flex-wrap gap-4">{course.sourceIds.map(id=><a key={id} href={RETAIL_SPECIALIST_SOURCES[id].url} target="_blank" rel="noreferrer" className="text-blue-700 underline">{RETAIL_SPECIALIST_SOURCES[id].label}</a>)}</div></footer>
  </>}
 </main></div>
}
