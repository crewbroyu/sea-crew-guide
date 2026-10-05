import { supabase } from '../supabase'
import { mergeFoundationProgress, mergeFoundationSavedLines, nextPreparationTimestamp } from '../data/foundationSync'
import { mergeRetailPractice } from '../data/retailPracticeProgress'
import { mergeBarServerPractice } from '../data/barServerProgressSync'

const currentUser=async(expectedUserId)=>{
 const {data:{user},error}=await supabase.auth.getUser()
 if(error)throw error
 if(expectedUserId && user?.id!==expectedUserId)throw new Error('Account changed; progress was not synced')
 return user
}
// Every writer of this shared JSON document must compare the version it read.
const updateProfile=async(expectedUserId,build)=>{
 const user=await currentUser(expectedUserId)
 if(!user)throw new Error('Sign in before syncing progress')
 for(let attempt=0;attempt<3;attempt++){
  await currentUser(user.id)
  const {data:existing,error:readError}=await supabase.from('job_preparation_profiles').select('*').eq('user_id',user.id).maybeSingle()
  if(readError)throw readError
  const patch={...build(existing || {}),updated_at:nextPreparationTimestamp(existing?.updated_at)}
  await currentUser(user.id)
  if(!existing){
   const {data,error}=await supabase.from('job_preparation_profiles').insert({user_id:user.id,email:user.email || null,...patch}).select('*').single()
   if(!error)return data
   if(error.code==='23505')continue
   throw error
  }
  let query=supabase.from('job_preparation_profiles').update(patch).eq('user_id',user.id)
  query=existing.updated_at?query.eq('updated_at',existing.updated_at):query.is('updated_at',null)
  const {data,error}=await query.select('*').maybeSingle()
  if(error)throw error
  if(data)return data
 }
 throw new Error('Progress changed on another page; retry sync')
}
const mergeRecords=(cloud={},local={})=>{
 const records={...cloud,...local}
 if(local.retailPractice)records.retailPractice=mergeRetailPractice(cloud.retailPractice,local.retailPractice)
 if(cloud.foundationCourses || local.foundationCourses)records.foundationCourses=mergeFoundationProgress(cloud.foundationCourses,local.foundationCourses)
 // Task5 snapshots do not own the dedicated listening or foundation namespaces.
 if(cloud.barServerPractice)records.barServerPractice=cloud.barServerPractice
 return records
}
export const upsertMyJobPreparation=async({selectedRole=null,roleTitle='',preparationChecklist=[],completedResources=[],learningRecords={},completedCourseDetails={},sourceTaskId=5,expectedUserId}={})=>updateProfile(expectedUserId,existing=>{
 const count=preparationChecklist.filter(item=>item.completed).length,total=preparationChecklist.length
 return {selected_role:selectedRole,role_title:roleTitle || null,preparation_checklist:preparationChecklist,completed_resources:completedResources,learning_records:mergeRecords(existing.learning_records,learningRecords),completed_course_details:{...existing.completed_course_details,...completedCourseDetails},completed_checklist_count:count,checklist_total:total,source_task_id:sourceTaskId,preparation_status:total>0 && count>=total?'completed':'in_progress'}
})
export const getMyJobPreparation=async(expectedUserId)=>{
 const user=await currentUser(expectedUserId)
 if(!user)return null
 const {data,error}=await supabase.from('job_preparation_profiles').select('*').eq('user_id',user.id).maybeSingle()
 if(error)throw error
 return data
}
export const getMyFoundationCourseState=async(jobKey,expectedUserId)=>{
 const profile=await getMyJobPreparation(expectedUserId)
 return profile?.learning_records?.foundationCourses?.[jobKey] || null
}
export const getMyBarServerPracticeState=async(expectedUserId)=>{
 const profile=await getMyJobPreparation(expectedUserId)
 return profile?.learning_records?.barServerPractice || null
}
export const upsertMyBarServerPracticeState=async({version,listeningProgress,shiftHistory,learningStage,stageUpdatedAt,expectedUserId})=>{
 const data=await updateProfile(expectedUserId,existing=>{
  const records=existing.learning_records || {},old=records.barServerPractice || {}
  return {learning_records:{...records,barServerPractice:{...mergeBarServerPractice(old,{version,listeningProgress,shiftHistory,learningStage,stageUpdatedAt}),updatedAt:new Date().toISOString()}}}
 })
 return data?.learning_records?.barServerPractice || null
}
export const upsertMyFoundationCourseState=async({jobKey,roleKey,roleTitle,version,progress,savedLines,savedLineChanges,placement,expectedUserId})=>{
 if(!jobKey)throw new Error('Missing course')
 return updateProfile(expectedUserId,existing=>{
  const records=existing.learning_records || {},courses=records.foundationCourses || {},old=courses[jobKey]
  const mergedLines=mergeFoundationSavedLines(old,{savedLines,savedLineChanges})
  return {selected_role:existing.selected_role || roleKey || null,role_title:existing.role_title || roleTitle || null,learning_records:{...records,foundationCourses:{...courses,[jobKey]:{version,progress:mergeFoundationProgress(old?.version===version?old.progress:null,progress || {}),...mergedLines,placement:placement || old?.placement || null,updatedAt:new Date().toISOString()}}}}
 })
}
