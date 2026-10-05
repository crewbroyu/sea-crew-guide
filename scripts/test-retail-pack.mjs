import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import { RETAIL_LISTENING_DRILLS as drills, retailListeningEngine as engine } from '../src/data/retailListening.js'
import { retailFoundationDays } from '../src/data/retailFoundation.js'
import { RETAIL_STAGE_PLANS, getRetailPlanProgress } from '../src/data/retailLearningPlan.js'
import { getRetailReadinessReport } from '../src/data/retailReadiness.js'
import { emptyRetailPractice, mergeRetailPractice, readRetailPractice, writeRetailPractice } from '../src/data/retailPracticeProgress.js'

assert.equal(drills.length,12)
assert.equal(new Set(drills.map(d=>d.id)).size,12)
const done='2026-10-05T01:00:00Z', later='2026-10-05T02:00:00Z'
for(const drill of drills) {
 const correct=drill.type==='capture'?Object.fromEntries(drill.fields.map(f=>[f.key,f.correct])):{choice:drill.correctOptionId}
 assert.equal(engine.scoreBarListeningAnswer(drill,correct).score,100,drill.id)
 assert.equal(engine.scoreBarListeningAnswer(drill,{}).score,0,drill.id)
 assert.equal(engine.isBarListeningAnswerComplete(drill,correct),true)
 assert.equal(engine.isBarListeningAnswerComplete(drill,{}),false)
 if(drill.type==='capture') for(const field of drill.fields) assert.ok(field.options.includes(field.correct))
 assert.ok(drill.prompt && drill.response && drill.explanation)
}
const challenge=engine.getShiftChallengeDrills({},5)
assert.equal(challenge.length,5)
assert.equal(new Set(challenge.map(d=>d.id)).size,5)
assert.deepEqual([...new Set(challenge.map(d=>d.level))].sort(),[1,2,3])
const weak=drills.at(-1)
assert.ok(engine.getShiftChallengeDrills({[weak.id]:{attempts:1,bestScore:0}}).some(d=>d.id===weak.id))
const foundationProgress={version:1,days:Object.fromEntries(retailFoundationDays.map(d=>[d.id,{completedAt:done}]))}
const listeningProgress=Object.fromEntries(drills.map(d=>[d.id,{completedAt:done,bestScore:100,normalPlays:1,speakingPractice:{completedAt:done}}]))
const shiftHistory=[{id:'shift-1',score:100,completedAt:done}]
const context={foundationProgress,listeningProgress,shiftHistory,scenarioCompletedCount:5,interviewCompletedAt:done}
for(const stage of Object.keys(RETAIL_STAGE_PLANS)) {
 const empty=getRetailPlanProgress(stage)
 assert.equal(empty.items.length,14,stage)
 assert.equal(new Set(empty.items.map(i=>i.id)).size,14,stage)
 assert.equal(empty.completedCount,0)
 assert.equal(getRetailPlanProgress(stage,context).completedCount,14,stage)
 assert.equal(getRetailPlanProgress(stage,{foundationProgress}).completedCount,8,'legacy core credit')
}
assert.equal(getRetailPlanProgress('unknown').items.length,14)
assert.equal(getRetailPlanProgress('experienced',{...context,shiftHistory:[{score:20},...shiftHistory]}).isComplete,false,'latest shift, not best')
const emptyReport=getRetailReadinessReport()
assert.equal(emptyReport.overallScore,0)
assert.equal(emptyReport.level.id,'insufficient')
const full=getRetailReadinessReport({...context,scenarioProfile:{completed_scenario_count:5,readiness_score:100,skill_scores:{productKnowledge:100}}})
assert.equal(full.overallScore,100)
assert.equal(full.readyForShift,true)
assert.ok(full.dimensions.every(d=>d.route.startsWith('/programs/retail/')))
assert.equal(getRetailReadinessReport({...context,shiftHistory:[{score:20},...shiftHistory],scenarioProfile:{completed_scenario_count:5,readiness_score:100}}).readyForShift,false)
const a={...emptyRetailPractice(),stageId:'first_contract',stageUpdatedAt:later,listeningProgress:{[drills[0].id]:{bestScore:100,completedAt:done,lastScore:100,lastAttemptAt:done}}}
const b={...emptyRetailPractice(),stageId:'job_search',stageUpdatedAt:done,listeningProgress:{[drills[0].id]:{bestScore:50,lastScore:50,lastAttemptAt:later}}}
const merged=mergeRetailPractice(a,b)
assert.equal(merged.stageId,'first_contract')
assert.equal(merged.listeningProgress[drills[0].id].bestScore,100)
assert.equal(merged.listeningProgress[drills[0].id].lastScore,50)
assert.equal(merged.listeningProgress[drills[0].id].completedAt,done)
assert.deepEqual(mergeRetailPractice(merged,merged),merged,'idempotent merge')
const storage=new Map()
globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)}
writeRetailPractice('user-a',a)
assert.equal(readRetailPractice('user-a').stageId,'first_contract')
assert.deepEqual(readRetailPractice('user-b'),emptyRetailPractice())
assert.deepEqual(readRetailPractice(null),emptyRetailPractice())

// Exercise actual service logic with a query-shaped in-memory transport.
let row={learning_records:{foundationCourses:{retail:{progress:foundationProgress}},barServerPractice:{sentinel:true}},updated_at:done}
let userId='user-a', failRead=false, conflict=false, writes=0
class Query {
 constructor(){this.operation='read';this.filters=[]}
 select(){return this}
 eq(key,value){this.filters.push([key,value]);return this}
 is(key,value){return this.eq(key,value)}
 update(value){this.operation='update';this.value=value;return this}
 insert(value){this.operation='insert';this.value=value;return this}
 async maybeSingle(){return this.execute()}
 then(resolve,reject){return Promise.resolve().then(()=>this.execute()).then(resolve,reject)}
 execute(){
  if(this.operation==='read') return failRead?{error:new Error('offline')}:{data:structuredClone(row),error:null}
  if(this.operation==='insert') {if(row)return {error:{code:'23505'}};row=this.value;writes++;return {data:null,error:null}}
  if(conflict) {conflict=false;row={...row,learning_records:{...row.learning_records,concurrent:{preserved:true}},updated_at:later};return {data:null,error:null}}
  if(this.filters.some(([key,value])=>key==='updated_at'&&row.updated_at!==value)) return {data:null,error:null}
  row={...row,...this.value};writes++;return {data:{user_id:userId},error:null}
 }
}
globalThis.__retailTestClient={auth:{getUser:async()=>({data:{user:{id:userId,email:'test@example.invalid'}},error:null})},from:()=>new Query()}
const serviceSource=(await readFile(new URL('../src/services/retailPracticeService.js',import.meta.url),'utf8'))
 .replace("import { supabase } from '../supabase'",'const supabase=globalThis.__retailTestClient')
 .replace("'../data/foundationSync'",JSON.stringify(pathToFileURL(path.resolve('src/data/foundationSync.js')).href))
 .replace("'../data/retailPracticeProgress'",JSON.stringify(pathToFileURL(path.resolve('src/data/retailPracticeProgress.js')).href))
const service=await import('data:text/javascript;base64,'+Buffer.from(serviceSource).toString('base64'))
conflict=true
await service.saveMyRetailPractice('user-a',a)
assert.equal(row.learning_records.concurrent.preserved,true)
assert.equal(row.learning_records.barServerPractice.sentinel,true)
assert.deepEqual(row.learning_records.foundationCourses.retail.progress,foundationProgress)
assert.equal((await service.getMyRetailPractice('user-a')).stageId,'first_contract')
failRead=true
const before=writes
await assert.rejects(()=>service.saveMyRetailPractice('user-a',b),/offline/)
assert.equal(writes,before)
failRead=false;userId='user-b'
await assert.rejects(()=>service.saveMyRetailPractice('user-a',b),/Account changed/)
assert.equal(writes,before)
row=null
await service.saveMyRetailPractice('user-b',b)
assert.equal(row.user_id,'user-b')
assert.equal(row.learning_records.retailPractice.stageId,'job_search')
console.log('Retail pack passed: 12 drills, 3 x 14-day plans, legacy credit, readiness, account isolation, concurrent save, failure preservation.')
