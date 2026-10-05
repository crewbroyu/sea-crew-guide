import { useState } from 'react'
import { Link } from 'react-router-dom'
import { moduleComplete, moduleProgressKey, validModuleResponse } from '../../data/retailModuleProgress'
export default function RetailModulePractice({ lesson, question, progress, onSave, readOnly = false }) {
 const key = moduleProgressKey(lesson), saved = progress[key] || {}
 const [answer,setAnswer] = useState(null), [submitted,setSubmitted] = useState(false)
 const [draft,setDraft] = useState(null)
 const response = draft ?? saved.response ?? ''
 const setResponse = setDraft
 const reviewChecks = lesson.reviewChecks || ['我回应了问题，并说明下一步','我核对了标签、条件或具体型号','我没有超出权限作承诺']
 const [checks,setChecks] = useState([false,false,false])
 const pass = answer === lesson.correct
 return <section className="space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
  <h3 className="font-semibold text-slate-950">学完练一练 · {moduleComplete(saved)?'已完成':'待完成'}</h3>
  <p className="text-xs text-slate-600">判断通过 + 英文表达自检分别保存。表达由你自行核对，不代表口语或 AI 评分。</p>
  <fieldset disabled={readOnly}><legend className="text-sm font-semibold">{question}</legend>{lesson.options.map((option,i)=><label key={option} className="mt-2 flex gap-2 rounded border border-slate-200 bg-white p-3 text-sm"><input type="radio" name={key} checked={answer===i} onChange={()=>{setAnswer(i);setSubmitted(false)}}/>{option}</label>)}</fieldset>
  <button type="button" disabled={answer===null || readOnly} onClick={()=>{setSubmitted(true);if(pass)onSave(key,{quizPassedAt:new Date().toISOString()})}} className="rounded bg-blue-700 px-4 py-2 text-sm text-white disabled:opacity-40">提交判断</button>
  <p role="status" className="text-sm">{submitted?(pass?'判断正确，已记录。':'再想一想：请回看知识点和工作边界。'):saved.quizPassedAt?'判断题已通过，可再次复习。':''}</p>
  <label className="block text-sm font-semibold">英文销售表达（至少 12 个词）<span className="my-2 block font-normal">{lesson.prompt}</span><textarea disabled={readOnly} value={response} onChange={e=>{setResponse(e.target.value);setChecks([false,false,false])}} rows={4} className="w-full rounded border border-slate-300 bg-white p-3"/></label>
  {reviewChecks.map((label,i)=><label key={label} className="flex gap-2 text-sm"><input type="checkbox" disabled={readOnly} checked={checks[i]} onChange={e=>setChecks(checks.map((value,index)=>index===i?e.target.checked:value))}/>{label}</label>)}
  <button type="button" disabled={readOnly || !validModuleResponse(response) || !checks.every(Boolean)} onClick={()=>onSave(key,{response:response.trim(),practiceCompletedAt:new Date().toISOString()})} className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-40">保存表达自检</button>
  {saved.practiceCompletedAt && <p role="status" className="text-sm text-emerald-800">表达自检已保存。{!saved.quizPassedAt?'还需通过判断题。':''}</p>}
  {lesson.dayId && <nav className="flex flex-wrap gap-4 text-sm font-semibold text-blue-700"><Link to={'/programs/retail/foundation/'+lesson.dayId}>关联基础课</Link><Link to={'/programs/retail/listening?drill='+lesson.drillId}>练习关联听说场景</Link><Link to="/programs/retail/training">继续岗位模拟</Link></nav>}
 </section>
}
