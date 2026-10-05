import { readFoundationProgress } from '../services/foundationProgressService'
import { mergeFoundationProgress } from '../data/foundationSync'
import { useEffect, useState } from 'react'
import useEffectiveAccess from './useEffectiveAccess'
import { RETAIL_FOUNDATION_VERSION } from '../data/retailFoundation'
import { getMyFoundationCourseState } from '../services/jobPreparationService'
const empty=()=>({version:RETAIL_FOUNDATION_VERSION,days:{}})
const cacheKey=userId=>'retail_foundation_summary_v1:'+userId
const readCache=userId=>{try{const value=JSON.parse(localStorage.getItem(cacheKey(userId)) || 'null');return value?.version===RETAIL_FOUNDATION_VERSION?value:empty()}catch{return empty()}}
export default function useRetailFoundationSummary() {
 const access=useEffectiveAccess()
 const userId=access.isRegistered && !access.isPreviewing?access.userId:null
 const [snapshot,setSnapshot]=useState(null)
 useEffect(()=>{
  if(!userId)return undefined
  let active=true
  getMyFoundationCourseState('retail',userId).then(cloud=>{
   if(!active)return
   const cloudProgress=cloud?.version===RETAIL_FOUNDATION_VERSION?{version:RETAIL_FOUNDATION_VERSION,days:cloud.progress?.days || {}}:empty()
   const progress=mergeFoundationProgress(cloudProgress,readFoundationProgress('retail',userId))
   try{localStorage.setItem(cacheKey(userId),JSON.stringify(progress))}catch{ /* Keep the response in memory. */ }
   setSnapshot({userId,progress,error:''})
  }).catch(()=>{if(active)setSnapshot({userId,progress:mergeFoundationProgress(readCache(userId),readFoundationProgress('retail',userId)),error:'基础课账户记录暂未载入，当前仅显示此账户的已缓存记录。'})})
  return ()=>{active=false}
 },[userId])
 if(access.isPreviewing)return {progress:empty(),error:''}
 if(!userId)return {progress:readFoundationProgress('retail','guest'),error:''}
 return snapshot?.userId===userId?snapshot:{progress:mergeFoundationProgress(readCache(userId),readFoundationProgress('retail',userId)),error:''}
}
