import assert from 'node:assert/strict'
import { isActiveAdministrator, isCurrentEntitlement, hasProductEntitlement, hasLegacyAccess, requiresAdministrator, getAccountCapabilities } from '../src/utils/accessPolicy.js'
const now = Date.parse('2026-10-04T00:00:00Z')
const item = { product_code: 'bar_server_pack', status: 'active', starts_at: '2026-01-01', expires_at: '2027-01-01' }
const member = { role: 'member', accessStatus: 'active', productEntitlements: [item] }
const admin = { role: 'admin', accessStatus: 'active' }
assert.equal(isActiveAdministrator(admin), true)
for (const access of [null, {}, { isAdmin: true }, { ...admin, accessStatus: 'suspended' }, { ...member, isAdmin: true }]) assert.equal(isActiveAdministrator(access), false)
assert.equal(hasProductEntitlement(member, 'bar_server_pack', now), true)
assert.equal(hasProductEntitlement(member, 'retail_sales_pack', now), false)
assert.equal(hasProductEntitlement(admin, 'retail_sales_pack', now), true)
assert.equal(hasProductEntitlement({ ...admin, accessStatus: 'suspended', isAdmin: true, productEntitlements: [item] }, 'bar_server_pack', now), false)
assert.equal(hasProductEntitlement({ ...member, role: 'mentor', productEntitlements: [] }, 'bar_server_pack', now), false)
for (const patch of [{ status: 'revoked' }, { starts_at: '2027-01-01' }, { expires_at: '2026-10-04' }, { starts_at: 'invalid' }, { expires_at: 'invalid' }]) assert.equal(isCurrentEntitlement({ ...item, ...patch }, now), false)
assert.equal(isCurrentEntitlement({ ...item, starts_at: null, expires_at: null }, now), true)
assert.equal(hasLegacyAccess({ ...member, isUnlocked: true, premiumUntil: null }, now), true)
assert.equal(hasLegacyAccess({ ...member, isUnlocked: true, premiumUntil: '2026-10-03' }, now), false)
assert.equal(hasLegacyAccess({ ...member, isUnlocked: true, accessStatus: 'suspended' }, now), false)
assert.equal(hasLegacyAccess({ ...admin, premiumUntil: '2020-01-01' }, now), true)
for (const path of ['/admin', '/admin/inspection', '/admin/beta?tab=users', '/generate-codes', '/generate-codes?x=1']) assert.equal(requiresAdministrator(path), true)
for (const path of ['/administrator', '/generate-codes-example', '/premium']) assert.equal(requiresAdministrator(path), false)
assert.deepEqual(getAccountCapabilities({ ...member, role: 'mentor', mentorStatus: 'active', crewVerificationStatus: 'verified' }), { inspectCourses: false, managePlatform: false, hasMentorIdentity: true })
assert.equal(getAccountCapabilities({ ...admin, accessStatus: 'suspended' }).inspectCourses, false)
console.log('Access policy tests passed: active status, expiry/start boundaries, product isolation, legacy access and role separation.')
