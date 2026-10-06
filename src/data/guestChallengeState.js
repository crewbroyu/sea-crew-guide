export const getGuestChallengeAiAttempts = (challenge = {}) => (
  Array.isArray(challenge.aiAttempts) ? challenge.aiAttempts.slice(0, 2) : []
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
    aiRecoveryRequired: Boolean(challenge.pendingRequestId),
  }
}

export const canRequestGuestChallengeAi = (challenge = {}) => (
  !challenge.completedAt
  && !challenge.aiRecoveryRequired
  && Boolean(challenge.hasRecording)
  && Boolean(String(challenge.transcript || '').trim())
  && getGuestChallengeAiAttempts(challenge).length < 2
)

export const completeGuestChallengeWithSelfReview = (challenge = {}, completedAt) => {
  if (!canCompleteGuestChallengeWithSelfReview(challenge)) return challenge
  return {
    ...challenge,
    completedAt: challenge.completedAt || completedAt,
    completionMode: challenge.completionMode || 'self_review',
    selfReviewCompletedAt: challenge.selfReviewCompletedAt || completedAt,
    pendingRequestId: null,
    pendingTranscript: null,
    aiRecoveryRequired: false,
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
    pendingRequestId: null,
    pendingTranscript: null,
    aiRecoveryRequired: false,
  }
}
