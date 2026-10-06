import assert from 'node:assert/strict'
import {
  USER_SCOPED_PROGRESS_KEYS,
  bindProgressStorageToUser,
} from '../src/data/userScopedStorage.js'
import {
  addGuestChallengeAiAttempt,
  canCompleteGuestChallengeWithSelfReview,
  canRequestGuestChallengeAi,
  completeGuestChallengeWithSelfReview,
  recordGuestChallengeAttempt,
} from '../src/data/guestChallengeState.js'
import { mergeFoundationProgress } from '../src/data/foundationSync.js'

for (const taskNumber of [1, 2, 3, 5, 6, 7]) {
  assert.ok(USER_SCOPED_PROGRESS_KEYS.includes(`task${taskNumber}_result`), `task${taskNumber}_result must be user scoped`)
}

const values = new Map([
  ['current_user_id', 'user-a'],
  ['task5_result', 'private-task-5'],
  ['task6_result', 'private-answer-cards'],
  ['unrelated_public_setting', 'keep-me'],
])
const storage = {
  getItem: (key) => values.get(key) || null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
}
assert.equal(bindProgressStorageToUser(storage, 'user-b'), true)
assert.equal(values.has('task5_result'), false)
assert.equal(values.has('task6_result'), false)
assert.equal(values.get('unrelated_public_setting'), 'keep-me')
assert.equal(values.get('current_user_id'), 'user-b')

let challenge = recordGuestChallengeAttempt({}, {
  transcript: 'First answer',
  recordedAt: '2026-10-06T01:00:00.000Z',
})
assert.equal(canCompleteGuestChallengeWithSelfReview(challenge), false)
challenge = recordGuestChallengeAttempt(challenge, {
  transcript: 'Improved second answer',
  recordedAt: '2026-10-06T01:05:00.000Z',
})
assert.equal(canCompleteGuestChallengeWithSelfReview(challenge), true)
challenge = completeGuestChallengeWithSelfReview(challenge, '2026-10-06T01:06:00.000Z')
assert.equal(challenge.completionMode, 'self_review')
assert.equal(challenge.completedAt, '2026-10-06T01:06:00.000Z')

const completedAt = challenge.completedAt
const practiceAfterCompletion = recordGuestChallengeAttempt(challenge, {
  transcript: 'Optional later practice',
  recordedAt: '2026-10-06T01:10:00.000Z',
})
assert.equal(practiceAfterCompletion, challenge, 'later practice must not mutate completed course evidence')
assert.equal(practiceAfterCompletion.completedAt, completedAt, 'later practice must not reverse completion')
assert.equal(canRequestGuestChallengeAi(practiceAfterCompletion), false, 'completed challenges must not request AI again')

const twoAiAttempts = {
  completedAt: '2026-10-06T02:00:00.000Z',
  completionMode: 'ai_review',
  aiAttempts: [{ score: 60 }, { score: 80 }],
}
assert.deepEqual(
  addGuestChallengeAiAttempt(twoAiAttempts, { score: 100, transcript: 'third' }, '2026-10-06T03:00:00.000Z'),
  twoAiAttempts,
  'a completed challenge must reject a third AI result',
)
assert.equal(canRequestGuestChallengeAi({ hasRecording: true, transcript: 'answer', aiAttempts: [{}, {}] }), false)

const mergedChallenge = mergeFoundationProgress(
  {
    completedAt: '2026-10-06T04:00:00.000Z',
    completionMode: 'self_review',
    selfReviewCompletedAt: '2026-10-06T04:00:00.000Z',
  },
  {
    completedAt: null,
    transcript: 'A later transcript from a stale device',
  },
)
assert.equal(mergedChallenge.completedAt, '2026-10-06T04:00:00.000Z', 'sync must preserve completion evidence')
assert.equal(mergedChallenge.completionMode, 'self_review', 'sync must preserve the completion method')

for (const key of ['task6_data', 'task7_voice_practice', 'task7_custom_questions', 'bar_server_trial_v3']) {
  assert.ok(USER_SCOPED_PROGRESS_KEYS.includes(key), `${key} holds private drafts and must be user scoped`)
}

const staleDeviceMerge = mergeFoundationProgress(
  {
    completedAt: '2026-10-06T05:00:00.000Z',
    completionMode: 'ai_review',
    attemptCount: 3,
    aiAttempts: [{ score: 55 }, { score: 78 }],
    pendingRequestId: null,
  },
  {
    completedAt: null,
    attemptCount: 2,
    aiAttempts: [{ score: 55 }],
    pendingRequestId: 'stale-request',
    aiRecoveryRequired: true,
  },
)
assert.equal(staleDeviceMerge.aiAttempts.length, 2, 'sync must keep the device with both AI attempts')
assert.equal(staleDeviceMerge.attemptCount, 3, 'sync must keep the higher recording count')
assert.equal(staleDeviceMerge.pendingRequestId, null, 'a completed challenge must drop stale pending requests')
assert.equal(staleDeviceMerge.aiRecoveryRequired, false)

let uncertain = recordGuestChallengeAttempt({}, { transcript: 'First', recordedAt: '2026-10-06T06:00:00.000Z' })
uncertain = { ...uncertain, pendingRequestId: 'timed-out-request', pendingTranscript: 'First' }
assert.equal(canRequestGuestChallengeAi(uncertain), true, 'the same pending request may be retried with its original id')
uncertain = recordGuestChallengeAttempt(uncertain, { transcript: 'Second', recordedAt: '2026-10-06T06:02:00.000Z' })
assert.equal(uncertain.aiRecoveryRequired, true, 'a new recording after an uncertain request must not open a second charge')
assert.equal(canRequestGuestChallengeAi(uncertain), false)
assert.equal(canCompleteGuestChallengeWithSelfReview(uncertain), true, 'learners can still finish without AI')
assert.equal(completeGuestChallengeWithSelfReview(uncertain, '2026-10-06T06:03:00.000Z').pendingRequestId, null)

console.log('Release blocker tests passed: account isolation, self-review completion, immutable synced completion, and two-attempt AI cap.')
