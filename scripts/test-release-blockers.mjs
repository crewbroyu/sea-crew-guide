import assert from 'node:assert/strict'
import {
  USER_SCOPED_PROGRESS_KEYS,
  bindProgressStorageToUser,
  buildSignOutWarning,
  hasUnsavedPrivateDrafts,
  releaseProgressStorageOnSignOut,
} from '../src/data/userScopedStorage.js'
import {
  BAR_SERVER_TRIAL_STORAGE_KEY,
  BAR_SERVER_TRIAL_VERSION,
  getBarServerTrialStorageKey,
  readBarServerTrial,
  writeBarServerTrial,
} from '../src/data/barServerTrial.js'
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

// Explicit sign-out on a shared device removes private drafts before the next visitor arrives.
const signOutValues = new Map([
  ['current_user_id', 'user-a'],
  ['task6_data', JSON.stringify({ answerCardData: { service_case: { context: 'My private hotel story' } } })],
  ['task6_result', 'private-answer-cards'],
  ['task7_voice_practice', 'private-practice'],
  ['task8_mock_draft_v1:user-a', 'private-mock-answers'],
  ['foundation_account_v1:user-a:bar_server:progress', 'account-partitioned-progress'],
  ['unrelated_public_setting', 'keep-me'],
])
const signOutStorage = {
  getItem: (key) => signOutValues.get(key) ?? null,
  setItem: (key, value) => signOutValues.set(key, value),
  removeItem: (key) => signOutValues.delete(key),
  key: (index) => [...signOutValues.keys()][index] ?? null,
  get length() { return signOutValues.size },
}
assert.equal(hasUnsavedPrivateDrafts(signOutStorage), true, 'Task 6 drafts must trigger the sign-out warning')
releaseProgressStorageOnSignOut(signOutStorage)
for (const key of ['task6_data', 'task6_result', 'task7_voice_practice', 'task8_mock_draft_v1:user-a', 'current_user_id']) {
  assert.equal(signOutValues.has(key), false, `${key} must be removed on sign-out`)
}
assert.equal(signOutValues.get('foundation_account_v1:user-a:bar_server:progress'), 'account-partitioned-progress', 'account-partitioned progress may still be waiting to sync')
assert.equal(signOutValues.get('unrelated_public_setting'), 'keep-me')
assert.equal(hasUnsavedPrivateDrafts(signOutStorage), false)
signOutValues.set('task6_data', JSON.stringify({ answerCardData: { service_case: { context: '   ' } } }))
assert.equal(hasUnsavedPrivateDrafts(signOutStorage), false, 'blank drafts must not warn')
signOutValues.set('task6_data', '{corrupt')
assert.equal(hasUnsavedPrivateDrafts(signOutStorage), false, 'a corrupt draft must not block sign-out')

// Sign-out warns about every irreplaceable local item, including legacy course progress not yet imported.
assert.equal(buildSignOutWarning({}), '', 'nothing to lose means no confirmation')
assert.match(buildSignOutWarning({ hasPrivateDrafts: true }), /Task 6/)
assert.doesNotMatch(buildSignOutWarning({ hasPrivateDrafts: true }), /旧版基础课/)
const legacyWarning = buildSignOutWarning({ hasUnimportedLegacyProgress: true })
assert.match(legacyWarning, /旧版基础课进度/)
assert.match(legacyWarning, /导入/)
assert.match(buildSignOutWarning({ hasPrivateDrafts: true, hasUnimportedLegacyProgress: true }), /Task 6[\s\S]*旧版基础课/)

// Free-trial results are per account: they survive sign-out and are never adopted by another account.
const makeStorage = (entries) => {
  const map = new Map(entries)
  return {
    map,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
    removeItem: (key) => map.delete(key),
    key: (index) => [...map.keys()][index] ?? null,
    get length() { return map.size },
  }
}
const trialRecord = (marker) => JSON.stringify({ version: BAR_SERVER_TRIAL_VERSION, marker, attemptsByScenario: { s1: [{}, {}] } })

let trialStorage = makeStorage([['current_user_id', 'user-a'], [BAR_SERVER_TRIAL_STORAGE_KEY, trialRecord('legacy-a')]])
assert.equal(readBarServerTrial(trialStorage, 'user-a').marker, 'legacy-a', 'the bound account adopts its legacy trial')
assert.equal(trialStorage.map.has(BAR_SERVER_TRIAL_STORAGE_KEY), false, 'the legacy record moves, not copies')
assert.equal(JSON.parse(trialStorage.map.get(getBarServerTrialStorageKey('user-a'))).marker, 'legacy-a')

trialStorage = makeStorage([['current_user_id', 'user-a'], [BAR_SERVER_TRIAL_STORAGE_KEY, trialRecord('legacy-a')]])
assert.equal(readBarServerTrial(trialStorage, 'user-b'), null, 'another account must not adopt the legacy trial')
assert.equal(trialStorage.map.has(BAR_SERVER_TRIAL_STORAGE_KEY), true)

trialStorage = makeStorage([[BAR_SERVER_TRIAL_STORAGE_KEY, trialRecord('legacy-unbound')]])
assert.equal(readBarServerTrial(trialStorage, 'guest'), null, 'guests never adopt account trial attempts')
assert.equal(readBarServerTrial(trialStorage, 'preview'), null, 'admin preview never adopts real attempts')
assert.equal(readBarServerTrial(trialStorage, 'user-c').marker, 'legacy-unbound', 'an unbound device migrates into the signing-in account')

trialStorage = makeStorage([['current_user_id', 'user-a']])
writeBarServerTrial(trialStorage, 'user-a', JSON.parse(trialRecord('scoped-a')))
trialStorage.map.set(BAR_SERVER_TRIAL_STORAGE_KEY, trialRecord('stale-legacy'))
releaseProgressStorageOnSignOut(trialStorage)
assert.equal(readBarServerTrial(trialStorage, 'user-a').marker, 'scoped-a', 'sign-out keeps the account trial so re-login sees it')
assert.equal(trialStorage.map.has(BAR_SERVER_TRIAL_STORAGE_KEY), false, 'sign-out still clears the unpartitioned legacy key')
assert.equal(readBarServerTrial(trialStorage, 'user-b'), null, 'the next account starts with its own trial')

// Signing in mid-trial keeps the guest's lesson progress, chosen scenario and stage.
const guestTrial = JSON.stringify({
  version: BAR_SERVER_TRIAL_VERSION,
  scenarioIndex: 1,
  stage: 'briefing',
  attemptsByScenario: {},
  lessonProgressByScenario: { s2: { completedAt: '2026-10-06T09:00:00.000Z' } },
})
trialStorage = makeStorage([[getBarServerTrialStorageKey('guest'), guestTrial]])
const adoptedGuest = readBarServerTrial(trialStorage, 'user-d')
assert.equal(adoptedGuest.scenarioIndex, 1, 'sign-in must return to the scenario the guest was on')
assert.equal(adoptedGuest.stage, 'briefing')
assert.ok(adoptedGuest.lessonProgressByScenario.s2.completedAt, 'guest lesson progress must carry over')
assert.equal(trialStorage.map.has(getBarServerTrialStorageKey('guest')), false, 'the guest record moves into the account')
assert.equal(readBarServerTrial(trialStorage, 'user-d').scenarioIndex, 1, 'later reads use the account record')

trialStorage = makeStorage([[getBarServerTrialStorageKey('guest'), trialRecord('guest-with-attempts')]])
assert.equal(readBarServerTrial(trialStorage, 'user-d'), null, 'a guest record with AI attempts is never adopted')
assert.equal(trialStorage.map.has(getBarServerTrialStorageKey('guest')), true)

trialStorage = makeStorage([
  ['current_user_id', 'user-a'],
  [BAR_SERVER_TRIAL_STORAGE_KEY, trialRecord('legacy-a')],
  [getBarServerTrialStorageKey('guest'), guestTrial],
])
assert.equal(readBarServerTrial(trialStorage, 'user-a').marker, 'legacy-a', 'the account’s own legacy attempts win over guest lessons')

trialStorage = makeStorage([
  ['current_user_id', 'user-a'],
  [BAR_SERVER_TRIAL_STORAGE_KEY, trialRecord('legacy-a')],
  [getBarServerTrialStorageKey('guest'), guestTrial],
])
const otherAccount = readBarServerTrial(trialStorage, 'user-b')
assert.equal(otherAccount.marker, undefined, 'another account never receives the legacy attempts')
assert.equal(otherAccount.scenarioIndex, 1, 'but may continue the attempt-free guest session it signed in from')
assert.equal(trialStorage.map.has(BAR_SERVER_TRIAL_STORAGE_KEY), true)

trialStorage = makeStorage([[getBarServerTrialStorageKey('user-a'), JSON.stringify({ version: 2 })]])
assert.equal(readBarServerTrial(trialStorage, 'user-a'), null, 'old trial versions are ignored')
trialStorage = makeStorage([[getBarServerTrialStorageKey('user-a'), '{corrupt']])
assert.equal(readBarServerTrial(trialStorage, 'user-a'), null, 'corrupt trial data is ignored')

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
