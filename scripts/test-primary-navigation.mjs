import assert from 'node:assert/strict'
import {
  getPreferredTrainingRoute,
  getPrimaryNavigation,
  isPrimaryNavigationActive,
  isPrimaryNavigationVisible,
} from '../src/data/appNavigation.js'

assert.equal(getPreferredTrainingRoute('bar_server'), '/programs/bar-server')
assert.equal(getPreferredTrainingRoute('Bar-Server'), '/programs/bar-server')
assert.equal(getPreferredTrainingRoute('Bar Server'), '/programs/bar-server')
assert.equal(getPreferredTrainingRoute('retail'), '/programs/retail')
assert.equal(getPreferredTrainingRoute('Retail Sales Associate'), '/programs/retail')
assert.equal(getPreferredTrainingRoute('front_office'), '/academy')

const memberTabs = getPrimaryNavigation({ isRegistered: true, primaryRole: 'bar_server' })
assert.deepEqual(memberTabs.map((tab) => tab.label), ['今天', '路线', '训练', '求职', '我的'])
assert.equal(memberTabs.find((tab) => tab.id === 'training').to, '/programs/bar-server')

const publicTabs = getPrimaryNavigation()
assert.equal(publicTabs[0].label, '首页')
assert.equal(publicTabs.at(-1).label, '登录')

for (const route of ['/', '/tasks', '/academy', '/jobs', '/profile', '/programs/bar-server', '/programs/retail']) {
  assert.equal(isPrimaryNavigationVisible(route), true, `${route} should show primary navigation`)
}

for (const route of ['/assessment', '/tasks/Task2', '/academy/wiki', '/jobs/channels', '/programs/bar-server/listening']) {
  assert.equal(isPrimaryNavigationVisible(route), false, `${route} should use focus mode`)
}

assert.equal(isPrimaryNavigationActive('/programs/bar-server', 'training'), true)
assert.equal(isPrimaryNavigationActive('/academy', 'training'), true)
assert.equal(isPrimaryNavigationActive('/programs/bar-server/listening', 'training'), false)

console.log('Primary navigation tests passed.')

