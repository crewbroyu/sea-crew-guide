export const getGuestChallengeAiAttempts = (challenge = {}) => (
  Array.isArray(challenge.aiAttempts) ? challenge.aiAttempts.slice(0, 2) : []
)

// A pending request id belongs to one AI attempt slot (pendingAttemptIndex). Once that slot has a result,
// the id is spent and must never be reused: the server would answer AI_REQUEST_ALREADY_COMPLETED.
// Records saved before the slot existed are treated as belonging to the first attempt.
export const getActivePendingRequestId = (challenge = {}) => {
  if (!challenge.pendingRequestId) return null
  const slot = Number.isInteger(challenge.pendingAttemptIndex) ? challenge.pendingAttemptIndex : 0
  return getGuestChallengeAiAttempts(challenge).length > slot ? null : challenge.pendingRequestId
}

// Recovery mode only applies while its uncertain request is still the active one.
export const isGuestChallengeAiRecoveryRequired = (challenge = {}) => (
  Boolean(challenge.aiRecoveryRequired) && Boolean(getActivePendingRequestId(challenge))
)

export const canCompleteGuestChallengeWithSelfReview = (challenge = {}) => {
  if (challenge.completedAt) return false
  const aiAttempts = getGuestChallengeAiAttempts(challenge)
  const recordingCount = Number(challenge.attemptCount || 0)
  if (recordingCount < 2) return false
  if (aiAttempts.length === 1) {
    return recordingCount > Number(aiAttempts[0]?.recordingAttemptCount || 0)
  }
  return true
}

export const recordGuestChallengeAttempt = (challenge = {}, { transcript = '', recordedAt }) => {
  if (challenge.completedAt) return challenge
  const nextAttempt = {
    transcript: String(transcript || '').trim(),
    recordedAt,
  }
  return {
    ...challenge,
    hasRecording: true,
    attemptCount: Number(challenge.attemptCount || 0) + 1,
    transcript: nextAttempt.transcript,
    lastRecordedAt: recordedAt,
    recordingAttempts: [...(Array.isArray(challenge.recordingAttempts) ? challenge.recordingAttempts : []), nextAttempt].slice(-2),
    completedAt: challenge.completedAt || null,
    aiRecoveryRequired: Boolean(getActivePendingRequestId(challenge)),
  }
}

export const canRequestGuestChallengeAi = (challenge = {}) => (
  !challenge.completedAt
  && !isGuestChallengeAiRecoveryRequired(challenge)
  && Boolean(challenge.hasRecording)
  && Boolean(String(challenge.transcript || '').trim())
  && getGuestChallengeAiAttempts(challenge).length < 2
)

const clearedPendingRequest = {
  pendingRequestId: null,
  pendingTranscript: null,
  pendingAttemptIndex: null,
  aiRecoveryRequired: false,
}

export const completeGuestChallengeWithSelfReview = (challenge = {}, completedAt) => {
  if (!canCompleteGuestChallengeWithSelfReview(challenge)) return challenge
  return {
    ...challenge,
    completedAt: challenge.completedAt || completedAt,
    completionMode: challenge.completionMode || 'self_review',
    selfReviewCompletedAt: challenge.selfReviewCompletedAt || completedAt,
    ...clearedPendingRequest,
  }
}

export const addGuestChallengeAiAttempt = (challenge = {}, attempt, completedAt) => {
  if (challenge.completedAt || getGuestChallengeAiAttempts(challenge).length >= 2) return challenge
  const aiAttempts = [...getGuestChallengeAiAttempts(challenge), attempt].slice(0, 2)
  const completed = aiAttempts.length >= 2
  return {
    ...challenge,
    transcript: attempt.transcript,
    aiAttempts,
    bestScore: Math.max(...aiAttempts.map((item) => Number(item.score || 0))),
    scoreDelta: completed ? aiAttempts[1].score - aiAttempts[0].score : null,
    completedAt: completed ? challenge.completedAt || completedAt : null,
    completionMode: completed ? challenge.completionMode || 'ai_review' : challenge.completionMode || null,
    ...clearedPendingRequest,
  }
}
