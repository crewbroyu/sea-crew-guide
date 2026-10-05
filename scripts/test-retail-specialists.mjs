import assert from 'node:assert/strict'
import fs from 'node:fs'
import { RETAIL_SPECIALIST_COURSES, RETAIL_SPECIALIST_SOURCES, getRetailSpecialistCourse, getSpecialistProgress } from '../src/data/retailSpecialistCourses.js'
import { RETAIL_KNOWLEDGE_CURRICULUM } from '../src/data/retailKnowledgeCurriculum.js'
import { moduleComplete, moduleProgressKey } from '../src/data/retailModuleProgress.js'
import { mergeRetailPractice, emptyRetailPractice } from '../src/data/retailPracticeProgress.js'
assert.equal(RETAIL_SPECIALIST_COURSES.length,3)
const ids=new Set()
for(const course of RETAIL_SPECIALIST_COURSES){
 assert.equal(course.modules.length,6)
 assert.ok(RETAIL_KNOWLEDGE_CURRICULUM[course.prerequisite])
 for(const sourceId of course.sourceIds)assert.match(RETAIL_SPECIALIST_SOURCES[sourceId].url,/^https:\/\//)
 for(const module of course.modules){
  const key=moduleProgressKey(module.lesson)
  assert.ok(!ids.has(key));ids.add(key)
  assert.equal(module.points.length,3)
  assert.equal(module.lesson.options.length,3)
  assert.ok(module.lesson.options[module.lesson.correct])
  assert.equal(module.lesson.reviewChecks.length,3)
  assert.ok(module.lesson.prompt && module.phrase && module.objective)
 }
 const progress=getSpecialistProgress(course)
 assert.equal(progress.completedCount,0);assert.equal(progress.next.id,course.modules[0].id)
}
assert.equal(ids.size,18)
assert.equal(getRetailSpecialistCourse('invalid'),undefined)
const [beauty,chanel,watch]=RETAIL_SPECIALIST_COURSES
const key=moduleProgressKey(beauty.modules[0].lesson)
const quiz={...emptyRetailPractice(),moduleProgress:{[key]:{quizPassedAt:'2026-10-05T01:00:00Z'}}}
assert.equal(getSpecialistProgress(beauty,quiz.moduleProgress).completedCount,0)
const response={...emptyRetailPractice(),moduleProgress:{[key]:{practiceCompletedAt:'2026-10-05T02:00:00Z',response:'Test practice',updatedAt:'2026-10-05T02:00:00Z'}}}
const merged=mergeRetailPractice(quiz,response)
assert.ok(moduleComplete(merged.moduleProgress[key]))
assert.equal(getSpecialistProgress(beauty,merged.moduleProgress).completedCount,1)
assert.equal(getSpecialistProgress(beauty,merged.moduleProgress).next.id,beauty.modules[1].id)
assert.equal(getSpecialistProgress(chanel,merged.moduleProgress).completedCount,0)
assert.equal(getSpecialistProgress(watch,merged.moduleProgress).completedCount,0)
const all=Object.fromEntries(beauty.modules.map(module=>[moduleProgressKey(module.lesson),{quizPassedAt:'x',practiceCompletedAt:'y'}]))
assert.equal(getSpecialistProgress(beauty,all).percent,100)
assert.equal(getSpecialistProgress(beauty,all).next,null)
const app=fs.readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8')
for(const route of ['/programs/retail/specialists','/programs/retail/specialists/:specialistId'])assert.ok(app.includes('path="'+route+'" element={<RequireActivation productCode="retail_sales_pack">'))
console.log('Retail specialists passed: 18 independent modules, prerequisites, sources, split-evidence completion, persistence merge, course isolation and entitlement guards.')
