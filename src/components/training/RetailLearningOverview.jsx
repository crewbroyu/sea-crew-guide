import { Link } from 'react-router-dom'
import { getRetailLearningOverview } from '../../data/retailLearningOverview'
export default function RetailLearningOverview({ progress = {} }) {
 const groups=getRetailLearningOverview(progress)
 return <section aria-label="知识、品牌与专修学习进度" className="space-y-4">
  <div><h2 className="text-xl font-semibold text-slate-950">知识、品牌与专修学习进度</h2><p className="mt-2 text-sm leading-6 text-slate-600">判断通过和英文表达自检均完成，才计入一个单元。优先继续已开始的练习；三条专修按岗位选学，无需全部修完。这些记录暂不计入五项准备度评分。</p></div>
  <div className="grid gap-4 sm:grid-cols-2">{groups.map(group=><article key={group.id} className="flex flex-col rounded-lg border border-slate-200 bg-white p-5"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-slate-950">{group.title}</h3><span className="shrink-0 text-sm font-semibold text-blue-700">{group.completed}/{group.total}</span></div><progress aria-label={group.title+'学习进度'} max={group.total} value={group.completed} className="mt-3 h-2 w-full accent-blue-700"/><p className="mt-3 text-xs text-slate-500">判断通过 {group.quizPassed} · 表达自检 {group.practiceSaved}</p><p className="mt-3 flex-1 text-sm leading-6 text-slate-700">{group.next?'下一单元：'+group.next.title:'本组训练已完成，可返回复习。'}</p>{group.next && (group.next.quizPassed || group.next.practiceSaved) && <p className="mt-1 text-xs text-amber-800">{group.next.quizPassed?'还需保存英文表达自检':'还需通过判断题'}</p>}<Link to={group.next?.route || group.route} className="mt-4 inline-flex min-h-11 items-center justify-between rounded-lg bg-blue-50 px-4 text-sm font-semibold text-blue-700" aria-label={(group.next?'继续学习：':'复习：')+group.title}>{group.next?'继续学习':'复习本组'}<span aria-hidden="true">→</span></Link></article>)}</div>
 </section>
}
