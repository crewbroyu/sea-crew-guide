// Preserve completion evidence when two devices update different parts of a lesson.
export function mergeFoundationProgress(cloud, local) {
 if(local == null)return cloud ?? local
 if(cloud == null)return local
 if(typeof cloud!=='object' || typeof local!=='object' || Array.isArray(cloud) || Array.isArray(local))return local
 const result={...cloud}
 for(const [key,value] of Object.entries(local)) {
  if(key==='completedAt')result[key]=[cloud[key],value].filter(Boolean).sort()[0] || null
  else if(['bestScore','fullAnswerRepetitions','attempts'].includes(key))result[key]=Math.max(Number(cloud[key]) || 0,Number(value) || 0)
  else if(key==='phraseRepetitions')result[key]=Object.fromEntries([...new Set([...Object.keys(cloud[key] || {}),...Object.keys(value || {})])].map(phrase=>[phrase,Math.max(Number(cloud[key]?.[phrase]) || 0,Number(value?.[phrase]) || 0)]))
  else if(key==='listenedPhrases')result[key]=[...new Set([...(cloud[key] || []),...(value || [])])]
  else result[key]=mergeFoundationProgress(cloud[key],value)
 }
 return result
}
export const nextPreparationTimestamp=previous=>new Date(Math.max(Date.now(),(Date.parse(previous) || 0)+1)).toISOString()

export const getFoundationLineId = (line) => String(line?.text || '').trim()

const newerLineChange = (current, candidate) => {
 if(!current)return candidate
 const currentTime=Date.parse(current.updatedAt) || 0
 const candidateTime=Date.parse(candidate.updatedAt) || 0
 if(candidateTime!==currentTime)return candidateTime>currentTime?candidate:current
 if(candidate.deleted!==current.deleted)return candidate.deleted?candidate:current
 return candidate
}

// Saved lines use per-line changes so a deletion on one device is not resurrected by a stale device.
export function mergeFoundationSavedLines(cloud = {}, local = {}) {
 const merged=Object.create(null)
 const addState=(state)=>{
  for(const line of state.savedLines || []){
   const id=getFoundationLineId(line)
   if(id)merged[id]=newerLineChange(merged[id],{line,deleted:false,updatedAt:null})
  }
  for(const [storedId,change] of Object.entries(state.savedLineChanges || {})){
   const id=storedId || getFoundationLineId(change?.line)
   if(!id || !change || typeof change!=='object')continue
   merged[id]=newerLineChange(merged[id],{
    line:change.line || merged[id]?.line || {text:id},
    deleted:Boolean(change.deleted),
    updatedAt:change.updatedAt || null,
   })
  }
 }
 addState(cloud)
 addState(local)
 return {
  savedLines:Object.values(merged).filter(change=>!change.deleted && change.line?.text).map(change=>change.line).slice(0,100),
  savedLineChanges:merged,
 }
}
