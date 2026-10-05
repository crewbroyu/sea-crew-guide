import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const loadDataService = async (file) => {
  let source = fs.readFileSync(file, 'utf8')
  source = source.replace(/from '(\.\.\/data\/[^']+)'/g, (_, specifier) => `from ${JSON.stringify(pathToFileURL(path.resolve(path.dirname(file), `${specifier}.js`)).href)}`)
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
}

const values = new Map()
globalThis.localStorage = {
  getItem: (key) => values.get(key) || null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
}
const storage = await loadDataService('src/services/foundationProgressService.js')
globalThis.__legacyStorageApi = storage
let cloudFail = false
const cloudCalls = []
globalThis.__legacyUpsert = async (payload) => {
  cloudCalls.push(structuredClone(payload))
  if (cloudFail) throw new Error('offline')
  return { learning_records: { foundationCourses: { [payload.jobKey]: payload } } }
}

let source = fs.readFileSync('src/services/foundationLegacyImportService.js', 'utf8')
source = source
  .replace("import { FOUNDATION_COURSES } from '../data/foundationCourseCatalog'", `const FOUNDATION_COURSES={retail:{
    slug:'retail',jobKey:'retail',roleKey:'retail',title:'Retail Sales Associate 岗位基础课',version:1,
    days:[{id:'retail-role-rhythm'},{id:'retail-guest-approach'}],
  }}`)
  .replace("'../data/foundationSync'", JSON.stringify(pathToFileURL(path.resolve('src/data/foundationSync.js')).href))
  .replace(/import \{\n  getFoundationCompletedCount,[\s\S]*?\} from '\.\/foundationProgressService'\n/, `const {
  getFoundationCompletedCount,readFoundationPlacement,readFoundationProgress,
  readSavedFoundationLineChanges,readSavedFoundationLines,writeFoundationPlacement,
  writeFoundationProgress,writeSavedFoundationLineChanges,writeSavedFoundationLines,
}=globalThis.__legacyStorageApi
`)
  .replace("import { upsertMyFoundationCourseState } from './jobPreparationService'", 'const upsertMyFoundationCourseState=globalThis.__legacyUpsert')
const importer = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)

const legacyRetail = { version: 1, days: { 'retail-role-rhythm': { completedAt: '2026-09-01' } } }
const accountRetail = { version: 1, days: { 'retail-guest-approach': { completedAt: '2026-09-02' } } }
const legacyLine = { text: 'Welcome aboard.', day: 1 }
const accountLine = { text: 'How may I help?', day: 2 }
storage.writeFoundationProgress('retail', legacyRetail)
storage.writeSavedFoundationLines('retail', [legacyLine])
storage.writeFoundationPlacement('retail', { score: 3, total: 5 })
storage.writeFoundationProgress('retail', accountRetail, 'account-a')
storage.writeSavedFoundationLines('retail', [accountLine], 'account-a')

const plan = importer.getLegacyFoundationImport('account-a')
assert.equal(plan.summary.length, 1)
assert.equal(plan.summary[0].completedDays, 1)
assert.equal(plan.summary[0].savedLineCount, 1)
assert.equal(plan.summary[0].hasPlacement, true)

const imported = await importer.importLegacyFoundationProgress('account-a')
assert.equal(imported.status, 'done')
assert.equal(cloudCalls.length, 1)
assert.equal(cloudCalls[0].expectedUserId, 'account-a')
assert.ok(storage.readFoundationProgress('retail', 'account-a').days['retail-role-rhythm'].completedAt)
assert.ok(storage.readFoundationProgress('retail', 'account-a').days['retail-guest-approach'].completedAt)
assert.deepEqual(storage.readSavedFoundationLines('retail', 'account-a').map((line) => line.text), [accountLine.text, legacyLine.text])
assert.deepEqual(storage.readSavedFoundationLines('retail').map((line) => line.text), [legacyLine.text], 'legacy source must remain intact')
assert.equal(importer.getLegacyFoundationImport('account-a'), null, 'the same source must not prompt twice after success')
assert.ok(importer.getLegacyFoundationImport('account-b'), 'import marker must be account-specific')

const secondLegacyLine = { text: 'Would you like to compare these?', day: 3 }
storage.writeSavedFoundationLines('retail', [legacyLine, secondLegacyLine])
assert.ok(importer.getLegacyFoundationImport('account-a'), 'new legacy evidence must be offered after an earlier import')
cloudFail = true
const pending = await importer.importLegacyFoundationProgress('account-a')
assert.equal(pending.status, 'pending')
assert.ok(storage.readSavedFoundationLines('retail', 'account-a').some((line) => line.text === secondLegacyLine.text))
assert.equal(localStorage.getItem('foundation_pending_v1:account-a:retail'), '1')
assert.equal(importer.getLegacyFoundationImport('account-a').status, 'pending')

console.log('Foundation legacy import passed: detection, explicit account binding, merge, source preservation, per-account marker, new evidence and offline pending state.')
