import assert from 'node:assert/strict'
import {
  ACTIVATION_RETURN_ROUTE_KEY,
  consumeActivationReturnRoute,
  getPurchaseStatusConfig,
  isSafeInternalRoute,
  rememberActivationReturnRoute,
  resolvePurchaseReturnRoute,
} from '../src/data/purchaseFlow.js'

assert.equal(resolvePurchaseReturnRoute({ search: '?source=bar-server-trial-report' }), '/programs/bar-server/foundation')
assert.equal(resolvePurchaseReturnRoute({ search: '?source=task8-ai-quota' }), '/tasks/phase2/Task7/mock')
assert.equal(resolvePurchaseReturnRoute({ search: '?returnTo=%2Fprograms%2Fbar-server%2Freport' }), '/programs/bar-server/report')
assert.equal(resolvePurchaseReturnRoute({ search: '?returnTo=https%3A%2F%2Fevil.example' }), '/programs/bar-server/foundation')
assert.equal(resolvePurchaseReturnRoute({ state: { returnTo: '//evil.example' } }), '/programs/bar-server/foundation')
assert.equal(isSafeInternalRoute('/premium?source=loop'), false)
assert.equal(isSafeInternalRoute('/programs/bar-server/training'), true)

const values = new Map()
const storage = {
  getItem: (key) => values.get(key) || null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
}

assert.equal(rememberActivationReturnRoute('/programs/bar-server/training', storage), true)
assert.equal(values.get(ACTIVATION_RETURN_ROUTE_KEY), '/programs/bar-server/training')
assert.equal(consumeActivationReturnRoute(storage), '/programs/bar-server/training')
assert.equal(consumeActivationReturnRoute(storage), null)
assert.equal(rememberActivationReturnRoute('//evil.example', storage), false)
assert.equal(getPurchaseStatusConfig('activation_sent').step, 3)

const blockedStorage = {
  getItem: () => { throw new Error('blocked') },
  setItem: () => { throw new Error('blocked') },
  removeItem: () => { throw new Error('blocked') },
}
assert.equal(rememberActivationReturnRoute('/programs/bar-server/training', blockedStorage), false)
assert.equal(consumeActivationReturnRoute(blockedStorage), null)

console.log('Purchase flow tests passed')

