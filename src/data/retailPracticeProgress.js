import { RETAIL_LISTENING_DRILLS } from './retailListening.js'
import { mergeListeningProgress, mergeBarShiftHistory } from './barServerProgressSync.js'
import { mergeModuleProgress } from './retailModuleProgress.js'
export const RETAIL_PRACTICE_VERSION = 1
export const emptyRetailPractice = () => ({version:1, moduleProgress:{}, listeningProgress:{}, shiftHistory:[], stageId:'job_search', stageUpdatedAt:null, interviewCompletedAt:null})
export const retailPracticeKey = (userId) => 'retail_practice_v1:' + (userId || 'guest')
export const mergeRetailPractice = (cloud, local) => {
 const a = cloud?.version === 1 ? cloud : emptyRetailPractice()
 const b = local?.version === 1 ? local : emptyRetailPractice()
 const stage = Date.parse(a.stageUpdatedAt || '') > Date.parse(b.stageUpdatedAt || '') || (!b.stageUpdatedAt && a.stageUpdatedAt) ? a : b
 return {version:1, moduleProgress:mergeModuleProgress(a.moduleProgress,b.moduleProgress), interviewCompletedAt:a.interviewCompletedAt || b.interviewCompletedAt || null, listeningProgress:mergeListeningProgress(RETAIL_LISTENING_DRILLS,a.listeningProgress,b.listeningProgress), shiftHistory:mergeBarShiftHistory(a.shiftHistory || [],b.shiftHistory || []), stageId:['job_search','first_contract','experienced'].includes(stage.stageId) ? stage.stageId : 'job_search', stageUpdatedAt:stage.stageUpdatedAt || null}
}
export const readRetailPractice = (userId) => {
 try { return mergeRetailPractice(null, JSON.parse(localStorage.getItem(retailPracticeKey(userId)) || 'null')) } catch { return emptyRetailPractice() }
}
export const writeRetailPractice = (userId, state) => localStorage.setItem(retailPracticeKey(userId), JSON.stringify(state))
