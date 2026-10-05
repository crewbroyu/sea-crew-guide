import { useEffect, useRef, useState } from 'react'
import useEffectiveAccess from './useEffectiveAccess'
import { mergeRetailPractice, readRetailPractice, writeRetailPractice } from '../data/retailPracticeProgress'
import { getMyRetailPractice, saveMyRetailPractice } from '../services/retailPracticeService'

export default function useRetailPracticeProgress({ readOnly = false } = {}) {
 const access = useEffectiveAccess()
 const userId = access.isRegistered && !access.isPreviewing ? access.userId : null
 const [snapshot,setSnapshot] = useState(() => ({userId,state:readRetailPractice(userId)}))
 const [syncStatus,setSyncStatus] = useState('loading')
 const [retry,setRetry] = useState(0)
 const revision = useRef(0)
 const latest = useRef(snapshot)
 const owner = useRef(userId)
 useEffect(() => {owner.current = userId},[userId])
 const state = snapshot.userId === userId ? snapshot.state : readRetailPractice(userId)
 const commit = (next) => {
  const value = {userId,state:next}
  latest.current = value
  setSnapshot(value)
  try {writeRetailPractice(userId,next)} catch { /* Cloud save can still succeed. */ }
 }
 useEffect(() => {
  let active=true
  const restore = async () => {
   let local = readRetailPractice(userId)
   if(latest.current.userId === userId) local = mergeRetailPractice(local,latest.current.state)
   if(readOnly || !userId) { if(active) {latest.current={userId,state:local};setSnapshot(latest.current);setSyncStatus('local')} return }
   try {
    const cloud = await getMyRetailPractice(userId)
    if(!active) return
    const current = latest.current.userId === userId ? latest.current.state : local
    const merged=mergeRetailPractice(cloud,mergeRetailPractice(local,current))
    latest.current={userId,state:merged};setSnapshot(latest.current)
    try {writeRetailPractice(userId,merged)} catch { /* Keep restored state in memory. */ }
    setSyncStatus('pending')
   } catch {if(active) {
    const current=latest.current.userId===userId?latest.current.state:local
    const restored=mergeRetailPractice(local,current)
    latest.current={userId,state:restored};setSnapshot(latest.current);setSyncStatus('local')
   }}
  }
  void restore()
  return () => {active=false}
 },[userId,retry,readOnly])
 useEffect(() => {
  const reconnect=() => setRetry(value=>value+1)
  window.addEventListener('online',reconnect)
  return () => window.removeEventListener('online',reconnect)
 },[])
 useEffect(() => {
  if(readOnly || !userId || snapshot.userId !== userId || syncStatus !== 'pending') return undefined
  let active=true
  const editRevision=revision.current
  const timer=window.setTimeout(() => {
   saveMyRetailPractice(userId,snapshot.state).then(merged => {
    if(!active || owner.current !== userId || editRevision !== revision.current) return
    latest.current={userId,state:merged};setSnapshot(latest.current)
    try {writeRetailPractice(userId,merged)} catch { /* The cloud holds this state. */ }
    setSyncStatus('synced')
   }).catch(() => {if(active) setSyncStatus('local')})
  },800)
  return () => {active=false;window.clearTimeout(timer)}
 },[snapshot,userId,syncStatus,readOnly])
 const update = (patch) => {
  if(readOnly || access.isPreviewing) return
  revision.current += 1
  const current = latest.current.userId === userId ? latest.current.state : readRetailPractice(userId)
  commit(mergeRetailPractice(current,{...current,...(typeof patch === 'function' ? patch(current) : patch)}))
  setSyncStatus(userId ? 'pending' : 'local')
 }
 return {...state,syncStatus:snapshot.userId===userId?syncStatus:(userId?'loading':'local'),updateModuleProgress:(key,patch)=>update(current=>({moduleProgress:{...current.moduleProgress,[key]:{...current.moduleProgress?.[key],...patch,updatedAt:new Date().toISOString()}}})),markInterviewReady:()=>update({interviewCompletedAt:new Date().toISOString()}),retrySync:() => setRetry(value=>value+1),updateListeningProgress:listeningProgress=>update({listeningProgress}),updateShiftHistory:shiftHistory=>update({shiftHistory}),selectLearningStage:stageId=>update({stageId,stageUpdatedAt:new Date().toISOString()})}
}
