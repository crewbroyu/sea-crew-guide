export const USER_SCOPED_PROGRESS_KEYS = [
  'boarding_progress',
  'assessment_result',
  'score_data',
  'checkin_data',
  'checkin_records',
  'messages',
  'job_applications',
  'port_daily_posts',
  ...Array.from({ length: 12 }, (_, index) => `task${index + 1}_result`),
  'task1_data',
  'task2_data',
  'task4_data',
  'task5_data',
  'task6_data',
  'task7_data',
  'task7_voice_practice',
  'task7_custom_questions',
  'task8_data',
  'task9_data',
  'task10_data',
  'task10_docs',
  'task10_guide_viewed',
  'task11_data',
  'task12_data',
  'interviewSelectedPosition',
  'seafarer-resume',
  'bar_server_listening_progress_v1',
  'bar_server_learning_stage',
  'bar_server_shift_challenge_history_v1',
  // Legacy unpartitioned trial only; per-account `bar_server_trial_v3:{id}` records are kept.
  'bar_server_trial_v3',
  'foundation_saved_lines_v1:bar_server',
  'foundation_saved_lines_v1:retail',
  'foundation_placement_v1:bar_server',
  'foundation_placement_v1:retail',
  'retail_foundation_v1',
]

// Account-keyed drafts that hold private interview answers; not needed once the user signs out.
export const SIGN_OUT_PRIVATE_KEY_PREFIXES = ['task8_mock_draft_v1:']

const listStorageKeys = (storage) => Array.from({ length: storage.length || 0 }, (_, index) => storage.key(index))
  .filter(Boolean)

// Drafts that exist only on this device: Task 6 answer-card edits and an unfinished mock interview.
export const hasUnsavedPrivateDrafts = (storage) => {
  try {
    const task6Draft = JSON.parse(storage.getItem('task6_data') || '{}')
    const hasAnswerDraft = Object.values(task6Draft.answerCardData || {})
      .some((card) => Object.values(card || {}).some((value) => typeof value === 'string' && value.trim()))
    if (hasAnswerDraft) return true
  } catch {
    // A corrupt draft is not worth blocking sign-out for.
  }
  return listStorageKeys(storage).some((key) => SIGN_OUT_PRIVATE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix)))
}

// Confirmation text for sign-out, or '' when nothing irreplaceable would be removed.
export const buildSignOutWarning = ({ hasPrivateDrafts = false, hasUnimportedLegacyProgress = false } = {}) => {
  const losses = [
    hasPrivateDrafts && '未提交的 Task 6 答案草稿和未完成的模拟面试',
    hasUnimportedLegacyProgress && '尚未导入账户的旧版基础课进度（可先取消，在本页点击“导入”后再退出）',
  ].filter(Boolean)
  if (!losses.length) return ''
  return `退出后，本设备上的以下内容会被清除且无法恢复，以免下一位使用者看到：\n- ${losses.join('\n- ')}\n\n确定退出吗？`
}

// Explicit sign-out on a possibly shared device: drop unpartitioned progress and private drafts so the next
// visitor cannot read them. Account-partitioned course progress stays, because it is invisible to other
// accounts and may still be waiting to sync.
export const releaseProgressStorageOnSignOut = (storage) => {
  USER_SCOPED_PROGRESS_KEYS.forEach((key) => storage.removeItem(key))
  listStorageKeys(storage)
    .filter((key) => SIGN_OUT_PRIVATE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix)))
    .forEach((key) => storage.removeItem(key))
  storage.removeItem('current_user_id')
}

export const bindProgressStorageToUser = (storage, nextUserId) => {
  const previousUserId = storage.getItem('current_user_id')
  const changedAccount = Boolean(previousUserId && previousUserId !== nextUserId)
  if (changedAccount) USER_SCOPED_PROGRESS_KEYS.forEach((key) => storage.removeItem(key))
  storage.setItem('current_user_id', nextUserId)
  return changedAccount
}
