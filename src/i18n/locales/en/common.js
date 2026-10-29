export default {
  language: {
    label: 'Interface language',
  },
  edgeReadAloud: 'In Microsoft Edge, press and hold (or right-click) any English text and choose “Read aloud” to hear natural pronunciation.',
  // The server answers in Chinese; English pages show these instead, keyed by the error code.
  apiErrors: {
    LOGIN_REQUIRED: 'Please sign in to use AI interview training.',
    AI_TIMEOUT: 'The AI took too long to respond. Please try again.',
    NETWORK_ERROR: 'Cannot reach the AI service. Please check your connection and try again.',
    AI_PROVIDER_ERROR: 'The AI service is temporarily unavailable. Please try again later.',
    AI_NOT_CONFIGURED: 'The AI service is temporarily unavailable. Please try again later.',
    INVALID_AI_RESPONSE: 'The AI feedback was incomplete. Please submit this answer again.',
    INVALID_AUDIO: 'No usable recording was found.',
    UNSUPPORTED_AUDIO: 'This recording format is not supported.',
    AUDIO_TOO_LARGE: 'The recording is too large. Please keep each answer under 2 minutes.',
    AUDIO_DURATION_INVALID: 'Each recording must be under 2 minutes.',
    AUDIO_DURATION_MISMATCH: 'The recording does not match its reported length. Please record again.',
    NO_SPEECH: 'No clear speech was detected. Please record again or type your answer.',
    RATE_LIMITED: 'Too many AI requests. Please wait a moment and try again.',
    // The server uses this code for both transcription and feedback quotas, so the copy covers both.
    AI_QUOTA_EXHAUSTED: 'You have used all free AI attempts here. You can still type your answer, or unlock the Bar Server pack to keep practising.',
    AI_FAILURE_LIMIT_REACHED: 'You have reached today’s limit for free AI retries. Please try again tomorrow.',
    AI_REQUEST_IN_PROGRESS: 'Your previous AI request is still running. Please wait a moment.',
    AI_REQUEST_ALREADY_COMPLETED: 'This attempt is already complete. Go back to see the result before starting another one.',
    AI_REQUEST_PREVIOUSLY_FAILED: 'The previous request did not finish. Please submit this attempt again.',
    QUOTA_CHECK_FAILED: 'We cannot check your AI usage right now. Please try again later.',
    ACCESS_CHECK_FAILED: 'We cannot check your access right now. Please try again later.',
    USAGE_RECORD_FAILED: 'The AI result was created but your usage was not saved. Please submit again later.',
    FREE_TRIAL_BAR_SERVER_ONLY: 'The free voice trial is only available for the three Bar Server scenarios.',
    REQUEST_ID_REQUIRED: 'This training request is invalid. Please submit again.',
  },
}
