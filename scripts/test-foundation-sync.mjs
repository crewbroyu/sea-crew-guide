import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import {mergeFoundationProgress,mergeFoundationSavedLines,nextPreparationTimestamp} from '../src/data/foundationSync.js'
import {emptyRetailPractice} from '../src/data/retailPracticeProgress.js'
const load=async file=>{
 let source=fs.readFileSync(file,'utf8').replace("import { supabase } from '../supabase'",'const supabase=globalThis.__syncClient')
 source=source.replace(/from '(\.\.\/data\/[^']+)'/g,(_,spec)=>'from '+JSON.stringify(pathToFileURL(path.resolve(path.dirname(file),spec+'.js')).href))
 return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'))
}
const storage=new Map()
globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}
const local=await load('src/services/foundationProgressService.js')
const completed={version:1,days:{day1:{completedAt:'2026-10-01',shadowing:{completedAt:'2026-10-01',phraseRepetitions:{hello:3}}}}}
local.writeFoundationProgress('retail',completed)
local.writeFoundationProgress('retail',completed,'a')
assert.deepEqual(local.readFoundationProgress('retail','b').days,{})
assert.deepEqual(local.readFoundationProgress('retail','guest').days,{})
assert.deepEqual(local.readFoundationProgress('retail'),completed,'legacy is preserved but never automatically adopted')
local.writeSavedFoundationLines('retail',[{text:'a'}],'a')
assert.deepEqual(local.readSavedFoundationLines('retail','b'),[])
local.writeSavedFoundationLineChanges('retail',{a:{line:{text:'a'},deleted:false,updatedAt:'2026-10-01'}},'a')
assert.deepEqual(local.readSavedFoundationLineChanges('retail','b'),{})
const lineA={text:'Welcome aboard.',day:1},lineB={text:'May I help you?',day:2}
const legacyLines=mergeFoundationSavedLines({savedLines:[lineA]},{savedLines:[lineB]})
assert.deepEqual(legacyLines.savedLines.map(line=>line.text),[lineA.text,lineB.text])
const deletedLine=mergeFoundationSavedLines(legacyLines,{savedLineChanges:{[lineA.text]:{line:lineA,deleted:true,updatedAt:'2026-10-02'}}})
assert.deepEqual(deletedLine.savedLines,[lineB],'a newer tombstone must suppress a stale saved line')
const restoredLine=mergeFoundationSavedLines(deletedLine,{savedLineChanges:{[lineA.text]:{line:lineA,deleted:false,updatedAt:'2026-10-03'}}})
assert.ok(restoredLine.savedLines.some(line=>line.text===lineA.text),'a later explicit re-save must restore the line')
const combined=mergeFoundationProgress(completed,{days:{day1:{completedAt:null,shadowing:{phraseRepetitions:{hello:1}}},day2:{completedAt:'2026-10-02'}}})
assert.equal(combined.days.day1.completedAt,'2026-10-01')
assert.equal(combined.days.day1.shadowing.phraseRepetitions.hello,3)
assert.ok(combined.days.day2.completedAt)
assert.ok(nextPreparationTimestamp('2099-01-01T00:00:00.000Z')>'2099-01-01T00:00:00.000Z')
let row,identity='a',writes=0,failRead=false,failWrite=false,beforeWrite=null,afterRead=null,alwaysConflict=false
class Query{
 constructor(){this.op='read';this.filters=[]}
 select(){return this} eq(k,v){this.filters.push([k,v]);return this} is(k,v){return this.eq(k,v)}
 insert(v){this.op='insert';this.value=v;return this} update(v){this.op='update';this.value=v;return this}
 single(){return this.execute()} maybeSingle(){return this.execute()}
 then(resolve,reject){return this.execute().then(resolve,reject)}
 async execute(){
  if(this.op==='read'){
   if(failRead)return {error:new Error('offline read')}
   const snapshot=structuredClone(row);if(afterRead){const cb=afterRead;afterRead=null;cb()}
   return {data:snapshot,error:null}
  }
  if(failWrite)return {error:new Error('offline write')}
  if(beforeWrite){const cb=beforeWrite;beforeWrite=null;await cb()}
  if(this.op==='insert'&&row)return {error:{code:'23505'}}
  if(this.op==='update'&&(alwaysConflict || this.filters.some(([k,v])=>row?.[k]!==v)))return {data:null,error:null}
  row={...row,...this.value};writes++;return {data:structuredClone(row),error:null}
 }
}
globalThis.__syncClient={auth:{getUser:async()=>({data:{user:identity?{id:identity,email:'test@example.invalid'}:null},error:null})},from:()=>new Query()}
const prep=await load('src/services/jobPreparationService.js'),retail=await load('src/services/retailPracticeService.js')
const base=()=>({user_id:'a',updated_at:'2026-01-01T00:00:00.000Z',learning_records:{sentinel:{keep:true}}})
const foundation=()=>prep.upsertMyFoundationCourseState({expectedUserId:'a',jobKey:'retail',version:1,progress:completed,savedLines:[]})
const practice={...emptyRetailPractice(),stageId:'first_contract',stageUpdatedAt:'2026-10-05T00:00:00Z'}
row=base();beforeWrite=()=>retail.saveMyRetailPractice('a',practice)
await foundation()
assert.equal(row.learning_records.retailPractice.stageId,'first_contract','foundation conflict retries preserve Retail')
assert.ok(row.learning_records.foundationCourses.retail.progress.days.day1.completedAt)
row=base();beforeWrite=foundation
await retail.saveMyRetailPractice('a',practice)
assert.ok(row.learning_records.foundationCourses.retail.progress.days.day1.completedAt,'reverse interleaving preserves foundation')
assert.equal(row.learning_records.retailPractice.stageId,'first_contract')
await prep.upsertMyJobPreparation({expectedUserId:'a',learningRecords:{courses:{legacy:true}}})
assert.ok(row.learning_records.foundationCourses.retail.progress.days.day1.completedAt)
assert.equal(row.learning_records.retailPractice.stageId,'first_contract')
assert.equal(row.learning_records.sentinel.keep,true)
for(const flag of ['read','write']){
 const count=writes,snapshot=structuredClone(row);failRead=flag==='read';failWrite=flag==='write'
 await assert.rejects(foundation,/offline/);assert.equal(writes,count);assert.deepEqual(row,snapshot)
 failRead=false;failWrite=false
}
let count=writes;identity='b';await assert.rejects(foundation,/Account changed/);assert.equal(writes,count)
identity='a';afterRead=()=>{identity='b'};await assert.rejects(foundation,/Account changed/);assert.equal(writes,count)
identity='a';alwaysConflict=true;await assert.rejects(foundation,/retry sync/);assert.equal(writes,count);alwaysConflict=false
row=null;await foundation();assert.equal(row.user_id,'a')
row=null;beforeWrite=()=>retail.saveMyRetailPractice('a',practice);await foundation()
assert.equal(row.learning_records.retailPractice.stageId,'first_contract','insert collision preserves concurrent branch')
const addLine=(line,updatedAt)=>prep.upsertMyFoundationCourseState({expectedUserId:'a',jobKey:'retail',version:1,progress:completed,savedLines:[line],savedLineChanges:{[line.text]:{line,deleted:false,updatedAt}}})
const deleteLine=(line,updatedAt)=>prep.upsertMyFoundationCourseState({expectedUserId:'a',jobKey:'retail',version:1,progress:completed,savedLines:[],savedLineChanges:{[line.text]:{line,deleted:true,updatedAt}}})
row=base();await addLine(lineA,'2026-10-01')
beforeWrite=()=>addLine(lineB,'2026-10-02')
await deleteLine(lineA,'2026-10-03')
const syncedLines=row.learning_records.foundationCourses.retail
assert.deepEqual(syncedLines.savedLines.map(line=>line.text),[lineB.text],'concurrent add and delete must both survive the retry')
assert.equal(syncedLines.savedLineChanges[lineA.text].deleted,true)
console.log('Foundation sync passed: account partitions, completion and saved-line merges, deletion tombstones, concurrent add/delete, failures, account switch and bounded retry.')
