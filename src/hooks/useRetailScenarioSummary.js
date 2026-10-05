import { useEffect, useState } from 'react'
import useEffectiveAccess from './useEffectiveAccess'
import { getMyScenarioProfile } from '../services/scenarioTrainingService'
export default function useRetailScenarioSummary() {
 const access=useEffectiveAccess()
 const userId=access.isRegistered && !access.isPreviewing ? access.userId : null
 const [snapshot,setSnapshot]=useState(null)
 useEffect(()=>{
  if(!userId)return undefined
  let active=true
  getMyScenarioProfile('retail').then(profile=>{
   if(active)setSnapshot({userId,status:'loaded',profile:profile?.user_id && profile.user_id!==userId?null:profile,error:''})
  }).catch(()=>{if(active)setSnapshot({userId,status:'error',profile:null,error:'场景记录暂未载入，恢复后会计入报告。'})})
  return ()=>{active=false}
 },[userId])
 if(!userId)return {status:'idle',profile:null,error:''}
 return snapshot?.userId===userId?snapshot:{status:'loading',profile:null,error:''}
}
