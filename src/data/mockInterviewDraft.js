// Per-account draft of an in-progress AI mock interview, so a refresh does not lose
// answers, inserted follow-ups, or the request id that protects the final score from double charging.
export const MOCK_DRAFT_VERSION = 1
export const MOCK_DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000
export const MAX_MOCK_FOLLOW_UPS = 2
export const MAX_MOCK_FOLLOW_UP_CHECKS = 3

export const mockDraftKey = (ownerId) => `task8_mock_draft_v${MOCK_DRAFT_VERSION}:${ownerId || 'guest'}`

export const buildMockDraft = ({
  position,
  interviewer,
  questions,
  answers,
  answerDetails,
  followUpChecks = 0,
  followUps = 0,
  finalEvaluationRequestId = null,
  savedAt,
}) => ({
  version: MOCK_DRAFT_VERSION,
  position,
  interviewer: interviewer ? { id: interviewer.id, name: interviewer.name, title: interviewer.title, initial: interviewer.initial, color: interviewer.color } : null,
  questions,
  answers,
  answerDetails,
  followUpChecks,
  followUps,
  finalEvaluationRequestId,
  savedAt,
})

const isValidDraft = (draft, position, now) => (
  draft?.version === MOCK_DRAFT_VERSION
  && draft.position === position
  && Array.isArray(draft.questions) && draft.questions.length > 0
  && Array.isArray(draft.answers) && Array.isArray(draft.answerDetails)
  && draft.answers.length === draft.answerDetails.length
  && draft.answers.length <= draft.questions.length
  && draft.answers.length > 0
  && now - (Date.parse(draft.savedAt) || 0) < MOCK_DRAFT_MAX_AGE_MS
)

export const readMockDraft = (storage, ownerId, position, now = Date.now()) => {
  try {
    const draft = JSON.parse(storage.getItem(mockDraftKey(ownerId)) || 'null')
    if (isValidDraft(draft, position, now)) return draft
  } catch {
    // A corrupt draft is treated as absent.
  }
  return null
}

export const writeMockDraft = (storage, ownerId, draft) => {
  try {
    storage.setItem(mockDraftKey(ownerId), JSON.stringify(draft))
  } catch (error) {
    console.warn('Unable to save mock interview draft:', error)
  }
}

export const clearMockDraft = (storage, ownerId) => storage.removeItem(mockDraftKey(ownerId))

// Next question to ask after restoring; equals questions.length when only scoring remains.
export const getMockDraftResumeIndex = (draft) => draft.answers.length
