import { useAccessStore } from '../store/accessStore'

export default function useEffectiveAccess() {
  const access = useAccessStore()
  const { isAdmin, previewMode } = access

  if (!isAdmin || previewMode === 'actual') {
    return {
      ...access,
      effectiveRole: access.role,
      effectivePlan: access.plan,
      isPreviewing: false,
    }
  }

  const preview = {
    anonymous: {
      isRegistered: false,
      isUnlocked: false,
      role: 'anonymous',
      plan: 'free',
      crewVerificationStatus: 'unverified',
      mentorStatus: 'inactive',
    },
    free: {
      isRegistered: true,
      isUnlocked: false,
      role: 'member',
      plan: 'free',
      crewVerificationStatus: 'unverified',
      mentorStatus: 'inactive',
    },
    premium: {
      isRegistered: true,
      isUnlocked: true,
      role: 'member',
      plan: 'premium',
      crewVerificationStatus: 'unverified',
      mentorStatus: 'inactive',
    },
    mentor: {
      isRegistered: true,
      isUnlocked: true,
      role: 'mentor',
      plan: 'premium',
      crewVerificationStatus: 'verified',
      mentorStatus: 'active',
    },
  }[previewMode]

  return {
    ...access,
    isRegistered: preview.isRegistered,
    isUnlocked: preview.isUnlocked,
    role: preview.role,
    plan: preview.plan,
    isAdmin: false,
    crewVerificationStatus: preview.crewVerificationStatus,
    mentorStatus: preview.mentorStatus,
    effectiveRole: preview.role,
    effectivePlan: preview.plan,
    isPreviewing: true,
  }
}
