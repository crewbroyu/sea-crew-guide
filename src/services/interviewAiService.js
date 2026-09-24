import { supabase } from '../supabase'

const MAX_AUDIO_BYTES = 2_500_000
const MAX_AUDIO_DURATION_SECONDS = 120

export class InterviewAiError extends Error {
  constructor(code, message, status = 0) {
    super(message)
    this.name = 'InterviewAiError'
    this.code = code
    this.status = status
  }
}

const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = () => reject(new InterviewAiError('AUDIO_READ_FAILED', '无法读取录音，请重新录制。'))
  reader.readAsDataURL(blob)
})

const getAccessToken = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session?.access_token) {
    throw new InterviewAiError('LOGIN_REQUIRED', '请先登录后再使用 AI 面试训练。', 401)
  }

  return session.access_token
}

const createRequestId = () => (
  globalThis.crypto?.randomUUID?.()
  || `ai-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
)

const requestInterviewAi = async (payload, requestId = createRequestId()) => {
  const accessToken = await getAccessToken()
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 90_000)

  try {
    const response = await fetch('/api/interview', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...payload, clientRequestId: requestId }),
      signal: controller.signal,
    })
    const body = await response.json().catch(() => null)

    if (!response.ok || !body?.success) {
      throw new InterviewAiError(
        body?.error?.code || `HTTP_${response.status}`,
        body?.error?.message || 'AI 服务暂时不可用，请稍后重试。',
        response.status,
      )
    }

    return body.data
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new InterviewAiError('AI_TIMEOUT', 'AI 响应超时，请重试。', 504)
    }
    if (error instanceof InterviewAiError) throw error
    throw new InterviewAiError('NETWORK_ERROR', '无法连接 AI 服务，请检查网络后重试。')
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export const transcribeInterviewAudio = async (audioBlob, {
  mode = 'practice',
  position = '',
  question = '',
  scenarioId = '',
  durationSeconds = 0,
} = {}) => {
  if (!(audioBlob instanceof Blob) || audioBlob.size === 0) {
    throw new InterviewAiError('INVALID_AUDIO', '没有读取到有效录音。')
  }

  if (audioBlob.size > MAX_AUDIO_BYTES) {
    throw new InterviewAiError('AUDIO_TOO_LARGE', '录音文件过大，请将单题回答控制在 2 分钟内。', 413)
  }

  const normalizedDuration = Math.ceil(Number(durationSeconds) || 0)
  if (normalizedDuration < 1 || normalizedDuration > MAX_AUDIO_DURATION_SECONDS) {
    throw new InterviewAiError('AUDIO_DURATION_INVALID', '单题录音必须控制在 2 分钟内。', 413)
  }

  const audioData = await blobToDataUrl(audioBlob)
  return requestInterviewAi({
    action: 'transcribe',
    mode,
    position,
    question,
    scenarioId,
    mimeType: audioBlob.type || 'audio/webm',
    durationSeconds: normalizedDuration,
    audioData,
  })
}

export const evaluateInterviewWithAi = ({
  mode = 'practice',
  position,
  questions,
  answers,
  scenarioId = '',
}) => requestInterviewAi({
  action: 'evaluate',
  mode,
  position,
  questions,
  answers,
  scenarioId,
})

export const generateAssessmentFollowUp = ({
  serviceBackground,
  history,
  followUpIndex,
}) => requestInterviewAi({
  action: 'assessment_followup',
  mode: 'assessment',
  serviceBackground,
  history,
  followUpIndex,
})

export const evaluatePracticalAssessment = ({ serviceBackground, answers }) => requestInterviewAi({
  action: 'assessment_evaluate',
  mode: 'assessment',
  serviceBackground,
  answers,
})

export const coachInterviewAnswer = ({ position, card, answers, generated }) => requestInterviewAi({
  action: 'answer_coach',
  mode: 'premium_practice',
  position,
  card,
  answers,
  generated,
})

export const continueScenarioRoleplay = ({ scenarioId, firstAnswer, position = 'Bar Server', requestId }) => requestInterviewAi({
  action: 'scenario_turn',
  mode: 'premium_scenario',
  position,
  scenarioId,
  firstAnswer,
}, requestId)

export const evaluateScenarioSimulation = ({ scenarioId, turns, position = 'Bar Server', requestId }) => requestInterviewAi({
  action: 'scenario_evaluate',
  mode: 'premium_scenario',
  position,
  scenarioId,
  turns,
}, requestId)
