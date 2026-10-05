import { retailFoundationDays } from './retailFoundation.js'
import { RETAIL_LISTENING_DRILLS } from './retailListening.js'
const base='/programs/retail'
const core=retailFoundationDays.map(day=>({id:day.id,title:day.title,description:'完成知识学习、跟读、Guest Challenge 和检查。',route:base+'/foundation/'+day.id,requirement:{type:'foundation',id:day.id}}))
const listening=[0,1,2].map(index=>({id:'listening-'+index,title:['预算、尺码与服务确认','促销、比较与缺货处理','客诉、高峰与班次交接'][index],description:'完成四个场景的听力检查和两次开口回应。',route:base+'/listening',requirement:{type:'listening',ids:RETAIL_LISTENING_DRILLS.slice(index*4,index*4+4).map(drill=>drill.id)}}))
const interview={id:'interview',title:'整理真实销售经历与面试表达',description:'整理一个需求发现、一个异议处理和一个团队协作案例；回到岗位包确认完成。',route:'/tasks/phase2/Task6?source=task5',requirement:{type:'interview'}}
const scenario={id:'scenario',title:'完成岗位场景模拟',description:'连续回应客人和追问，再根据六项能力结果复盘。',route:base+'/training',requirement:{type:'scenario',count:1}}
const shift={id:'shift',title:'完成限时班次验证',description:'五个场景、正常语速、每题 30 秒，最近一次达到 70 分。',route:base+'/listening/shift',requirement:{type:'shift',score:70}}
const baseline={id:'baseline',title:'先做班次基线诊断',description:'先完成一次限时挑战，找出需要回炉的工作信息。',route:base+'/listening/shift',requirement:{type:'attempt'}}
export const RETAIL_STAGE_PLANS={
 job_search:[...core.slice(0,5),interview,...core.slice(5),...listening,scenario,shift],
 first_contract:[core[0],core[6],core[7],...core.slice(1,6),...listening,{...scenario,requirement:{type:'scenario',count:2}},interview,shift],
 experienced:[baseline,listening[2],core[6],core[7],listening[1],{...scenario,requirement:{type:'scenario',count:3}},...core.slice(0,6),listening[0],{...shift,title:'班次验证达到 85 分',description:'最近一次挑战达到 85 分，检查当前反应稳定性。',requirement:{type:'shift',score:85}}],
}
export const isRetailPlanItemComplete=(item,context={})=>{
 const r=item.requirement,p=context.listeningProgress || {}
 if(r.type==='foundation') return Boolean(context.foundationProgress?.days?.[r.id]?.completedAt)
 if(r.type==='listening') return r.ids.every(id=>p[id]?.completedAt && p[id]?.speakingPractice?.completedAt)
 if(r.type==='interview') return Boolean(context.interviewCompletedAt)
 if(r.type==='scenario') return Number(context.scenarioCompletedCount || 0)>=r.count
 if(r.type==='shift') return Number(context.shiftHistory?.[0]?.score ?? -1)>=r.score
 if(r.type==='attempt') return Boolean(context.shiftHistory?.length)
 return false
}
export const getRetailPlanProgress=(stageId,context={})=>{
 const items=(RETAIL_STAGE_PLANS[stageId] || RETAIL_STAGE_PLANS.job_search).map((item,index)=>{
  const missing=item.requirement.type==='listening' ? item.requirement.ids.find(id=>!context.listeningProgress?.[id]?.completedAt || !context.listeningProgress?.[id]?.speakingPractice?.completedAt) : null
  return {...item,day:index+1,completed:isRetailPlanItemComplete(item,context),route:missing ? base+'/listening?drill='+missing : item.route}
 })
 const completedCount=items.filter(item=>item.completed).length
 return {items,completedCount,percent:Math.round(completedCount/items.length*100),currentItem:items.find(item=>!item.completed) || items.at(-1),isComplete:completedCount===items.length}
}
