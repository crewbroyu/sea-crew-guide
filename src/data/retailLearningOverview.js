import { retailKnowledgeModules } from './retailKnowledgeLibrary.js'
import { RETAIL_KNOWLEDGE_CURRICULUM } from './retailKnowledgeCurriculum.js'
import { RETAIL_BRANDS } from './retailBrandCatalog.js'
import { RETAIL_SPECIALIST_COURSES } from './retailSpecialistCourses.js'
import { moduleComplete, moduleProgressKey } from './retailModuleProgress.js'

export const RETAIL_LEARNING_GROUPS = [
 {id:'knowledge',title:'产品与运营',route:'/programs/retail/foundation?view=knowledge',items:retailKnowledgeModules.map(module=>({title:module.title,lesson:RETAIL_KNOWLEDGE_CURRICULUM[module.id],route:'/programs/retail/foundation?view=knowledge&module='+module.id}))},
 {id:'brands',title:'品牌基础',route:'/programs/retail/brands',items:RETAIL_BRANDS.map(brand=>({title:brand.name,lesson:brand.lesson,route:'/programs/retail/brands?brand='+brand.id}))},
 ...RETAIL_SPECIALIST_COURSES.map(course=>({id:course.id,title:course.name,route:'/programs/retail/specialists/'+course.id,items:course.modules.map(module=>({title:module.title,lesson:module.lesson,route:'/programs/retail/specialists/'+course.id+'?lesson='+module.id}))})),
]
const stamp=record=>Math.max(...['updatedAt','quizPassedAt','practiceCompletedAt'].map(key=>Date.parse(record?.[key] || '') || 0))
export function getRetailLearningOverview(progress = {}) {
 return RETAIL_LEARNING_GROUPS.map(group=>{
  const items=group.items.map(item=>{const record=progress[moduleProgressKey(item.lesson)] || {};return {...item,complete:moduleComplete(record),quizPassed:Boolean(record.quizPassedAt),practiceSaved:Boolean(record.practiceCompletedAt),lastActivity:stamp(record)}})
  const incomplete=items.filter(item=>!item.complete)
  const inProgress=incomplete.filter(item=>item.quizPassed || item.practiceSaved).sort((a,b)=>b.lastActivity-a.lastActivity)
  const next=inProgress[0] || incomplete[0] || null
  return {...group,items,total:items.length,completed:items.filter(item=>item.complete).length,quizPassed:items.filter(item=>item.quizPassed).length,practiceSaved:items.filter(item=>item.practiceSaved).length,next}
 })
}
