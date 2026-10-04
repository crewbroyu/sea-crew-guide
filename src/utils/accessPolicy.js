// UI policy only. APIs and database RLS remain the authority for protected data.
export const isActiveAdministrator = (access) => (
  access?.role === 'admin' && access?.accessStatus === 'active'
)

export const isCurrentEntitlement = (item, now = Date.now()) => (
  item?.status === 'active'
  && (item.starts_at == null || Date.parse(item.starts_at) <= now)
  && (item.expires_at == null || Date.parse(item.expires_at) > now)
)

export const hasProductEntitlement = (access, productCode, now = Date.now()) => {
  if (!productCode || access?.accessStatus !== 'active') return false
  if (isActiveAdministrator(access)) return true
  return (access.productEntitlements || []).some(item =>
    item.product_code === productCode && isCurrentEntitlement(item, now))
}

export const hasLegacyAccess = (access, now = Date.now()) => (
  access?.accessStatus === 'active' && (isActiveAdministrator(access) || (
    access.isUnlocked === true
    && (access.premiumUntil == null || Date.parse(access.premiumUntil) > now)
  ))
)

export const requiresAdministrator = (path = '') => {
  const pathname = path.split(/[?#]/)[0]
  return ['/admin', '/generate-codes'].some(prefix => pathname === prefix || pathname.startsWith(prefix + '/'))
}

// These capabilities deliberately do not grant access to another user's data.
// Mentor and organization access will require server-verified assignments.
export const getAccountCapabilities = (access) => ({
  inspectCourses: isActiveAdministrator(access),
  managePlatform: isActiveAdministrator(access),
  hasMentorIdentity: access?.accessStatus === 'active'
    && access?.mentorStatus === 'active'
    && access?.crewVerificationStatus === 'verified',
})
