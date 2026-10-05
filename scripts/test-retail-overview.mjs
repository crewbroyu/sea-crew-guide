import assert from 'node:assert/strict'
import { RETAIL_LEARNING_GROUPS, getRetailLearningOverview } from '../src/data/retailLearningOverview.js'
import { moduleProgressKey } from '../src/data/retailModuleProgress.js'
import { getRetailReadinessReport } from '../src/data/retailReadiness.js'
const empty=getRetailLearningOverview()
assert.equal(empty.length,5)
assert.deepEqual(empty.map(group=>group.total),[10,12,6,6,6])
assert.ok(empty.every(group=>group.completed===0 && group.next===group.items[0]))
const knowledge=RETAIL_LEARNING_GROUPS[0],brands=RETAIL_LEARNING_GROUPS[1]
const key=item=>moduleProgressKey(item.lesson)
const progress={
 [key(knowledge.items[2])]:{quizPassedAt:'2026-10-05T01:00:00Z',updatedAt:'2026-10-05T01:00:00Z'},
 [key(knowledge.items[4])]:{practiceCompletedAt:'2026-10-05T02:00:00Z',updatedAt:'2026-10-05T02:00:00Z'},
 [key(brands.items[1])]:{quizPassedAt:'2026-10-05T01:00:00Z',practiceCompletedAt:'2026-10-05T02:00:00Z'},
 'unknown@1':{quizPassedAt:'x',practiceCompletedAt:'y'},
}
const partial=getRetailLearningOverview(progress)
assert.equal(partial[0].completed,0)
assert.equal(partial[0].quizPassed,1)
assert.equal(partial[0].practiceSaved,1)
assert.equal(partial[0].next.title,knowledge.items[4].title)
assert.ok(partial[0].next.route.includes('module='))
assert.equal(partial[1].completed,1)
assert.ok(partial[1].next.route.includes('?brand='))
assert.equal(partial[2].completed,0)
const all=Object.fromEntries(RETAIL_LEARNING_GROUPS.flatMap(group=>group.items.map(item=>[key(item),{quizPassedAt:'x',practiceCompletedAt:'y'}])))
const full=getRetailLearningOverview(all)
assert.ok(full.every(group=>group.completed===group.total && group.next===null))
assert.equal(full.reduce((sum,group)=>sum+group.completed,0),40)
assert.equal(getRetailReadinessReport({moduleProgress:all}).overallScore,getRetailReadinessReport().overallScore)
assert.equal(getRetailReadinessReport({moduleProgress:all}).readyForShift,false)
console.log('Retail overview passed: 40 modules, partial-evidence counts, recently started priority, direct lesson links, unknown-key exclusion, full completion and unchanged readiness scoring.')
