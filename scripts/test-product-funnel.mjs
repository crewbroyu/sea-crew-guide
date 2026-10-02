import assert from 'node:assert/strict'
import { buildConversionFunnel, buildTargetRoleBreakdown } from '../src/data/productFunnel.js'

let id = 0
const event = (eventName, values = {}) => ({
  id: String(++id),
  event_name: eventName,
  user_id: null,
  anonymous_id: 'browser-a',
  properties: {},
  ...values,
})

const events = [
  event('assessment_viewed'),
  event('assessment_viewed'),
  event('auth_completed', { user_id: 'user-a', properties: { intentRoute: '/assessment' } }),
  event('auth_completed', { user_id: 'user-a', properties: { intentRoute: '/premium' } }),
  event('assessment_started', { user_id: 'user-a' }),
  event('assessment_completed', { user_id: 'user-a' }),
  event('career_report_generated', { user_id: 'user-a', properties: { targetRole: 'bar' } }),
  event('career_report_generated', { user_id: 'user-a', properties: { targetRole: 'bar', regenerate: true } }),
  event('free_trial_viewed', { user_id: 'user-a' }),
  event('free_trial_scenario_completed', { user_id: 'user-a', properties: { scenarioNumber: 1 } }),
  event('free_trial_scenario_completed', { user_id: 'user-a', properties: { scenarioNumber: 2 } }),
  event('free_trial_completed', { user_id: 'user-a' }),
  event('product_page_viewed', { user_id: 'user-a' }),
  event('product_page_viewed', { user_id: 'user-b', anonymous_id: 'browser-b' }),
  event('purchase_request_submitted', { user_id: 'user-a' }),
  event('activation_succeeded', { user_id: 'user-a' }),
]

const funnel = Object.fromEntries(buildConversionFunnel(events).map((stage) => [stage.id, stage]))

assert.equal(funnel.assessment_viewed.actorCount, 1, 'duplicate anonymous views should count as one actor')
assert.equal(funnel.assessment_viewed.eventCount, 2, 'raw event count should remain available')
assert.equal(funnel.assessment_auth_completed.actorCount, 1, 'only assessment-intent auth should match')
assert.equal(funnel.assessment_auth_completed.conversionFromPrevious, null, 'conditional login must not distort the sequential funnel')
assert.equal(funnel.assessment_started.actorCount, 1, 'anonymous and signed-in identities should merge')
assert.equal(funnel.assessment_started.conversionFromPrevious, 100)
assert.equal(funnel.free_trial_first_scene.actorCount, 1, 'only scenario one should match the first-scene stage')
assert.equal(funnel.product_page_viewed.actorCount, 2, 'direct downstream users remain visible')
assert.equal(funnel.product_page_viewed.continuedActorCount, 1, 'continuation only includes actors from the previous stage')
assert.equal(funnel.product_page_viewed.conversionFromPrevious, 100, 'direct entries must not push conversion above 100%')

const roles = buildTargetRoleBreakdown(events)
assert.deepEqual(roles, [{ role: 'bar', label: 'Bar Server', count: 1 }], 'report revisions should not duplicate users')

console.log('Product funnel tests passed')
