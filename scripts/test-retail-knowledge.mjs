import assert from 'node:assert/strict'
import { RETAIL_KNOWLEDGE_CURRICULUM } from '../src/data/retailKnowledgeCurriculum.js'
import { retailKnowledgeModules } from '../src/data/retailKnowledgeLibrary.js'
import { RETAIL_BRANDS, RETAIL_CONCESSIONS, RETAIL_BRAND_SOURCES, filterRetailBrands, matchingConcessions } from '../src/data/retailBrandCatalog.js'
import { moduleComplete, moduleProgressKey, mergeModuleProgress, validModuleResponse } from '../src/data/retailModuleProgress.js'
import { emptyRetailPractice, mergeRetailPractice } from '../src/data/retailPracticeProgress.js'
import { RETAIL_LISTENING_DRILLS } from '../src/data/retailListening.js'
for(const module of retailKnowledgeModules){const lesson=RETAIL_KNOWLEDGE_CURRICULUM[module.id];assert.ok(lesson);assert.ok(lesson.options[lesson.correct]);assert.ok(RETAIL_LISTENING_DRILLS.some(d=>d.id===lesson.drillId))}
assert.equal(Object.keys(RETAIL_KNOWLEDGE_CURRICULUM).length,10)
assert.equal(RETAIL_BRANDS.length,12)
for(const record of RETAIL_CONCESSIONS){assert.ok(RETAIL_BRAND_SOURCES[record.sourceId]);assert.equal(record.availability,'historical_unconfirmed');for(const id of record.brands)assert.ok(RETAIL_BRANDS.some(b=>b.id===id))}
assert.equal(matchingConcessions('chanel',{operator:'Starboard',category:'二手奢侈品'}).length,0)
assert.equal(filterRetailBrands({operator:'Starboard',category:'二手奢侈品'}).length,0)
assert.equal(filterRetailBrands({operator:'Harding+',ship:'Spectrum of the Seas'}).length,0)
assert.deepEqual(filterRetailBrands({evidence:'unassigned'}).map(b=>b.id),['citizen'])
assert.equal(filterRetailBrands({operator:'Heinemann Americas',query:'CHANEL'}).length,1)
const lesson=RETAIL_KNOWLEDGE_CURRICULUM['watch-basics'], key=moduleProgressKey(lesson)
const a={[key]:{quizPassedAt:'2026-10-05T01:00:00Z',updatedAt:'2026-10-05T01:00:00Z'}}
const b={[key]:{practiceCompletedAt:'2026-10-05T02:00:00Z',response:'saved response',updatedAt:'2026-10-05T02:00:00Z'}}
assert.equal(moduleComplete(a[key]),false)
assert.equal(moduleComplete(b[key]),false)
const merged=mergeModuleProgress(a,b)
assert.equal(moduleComplete(merged[key]),true)
assert.deepEqual(mergeModuleProgress(b,a),merged)
assert.deepEqual(mergeModuleProgress(merged,merged),merged)
assert.equal(moduleComplete(merged[moduleProgressKey({...lesson,revision:2})]),false)
const legacy={...emptyRetailPractice(),interviewCompletedAt:'legacy',stageId:'experienced',stageUpdatedAt:'2026-10-01'}
delete legacy.moduleProgress
const upgraded=mergeRetailPractice(legacy,{...legacy,moduleProgress:merged})
assert.equal(upgraded.interviewCompletedAt,'legacy');assert.equal(upgraded.stageId,'experienced');assert.equal(moduleComplete(upgraded.moduleProgress[key]),true)
assert.equal(validModuleResponse('yes'),false)
assert.equal(validModuleResponse('I will check the model reference and explain the features before making any promise.'),true)
console.log('Retail knowledge: curriculum links, evidence boundaries, migration, revision isolation and merge checks passed.')
