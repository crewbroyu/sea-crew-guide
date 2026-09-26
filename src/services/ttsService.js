import { supabase } from '../supabase'

const audioUrlCache = new Map()
const deniedNaturalVoiceProducts = new Set()
let activeAudio = null
let playbackGeneration = 0

const getVoice = (language = 'en-US') => {
  const voices = window.speechSynthesis?.getVoices?.() || []
  const languagePrefix = language.split('-')[0].toLowerCase()
  return voices.find((voice) => voice.lang?.toLowerCase() === language.toLowerCase())
    || voices.find((voice) => voice.lang?.toLowerCase().startsWith(languagePrefix))
    || null
}

const speakWithBrowser = (text, { rate = 0.88, lang = 'en-US' } = {}) => new Promise((resolve) => {
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
    resolve({ provider: 'none' })
    return
  }

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.voice = getVoice(lang)
  utterance.lang = utterance.voice?.lang || lang
  utterance.rate = rate
  utterance.pitch = 1
  utterance.onend = () => resolve({ provider: 'browser' })
  utterance.onerror = () => resolve({ provider: 'browser' })
  window.speechSynthesis.speak(utterance)
})

const normalizePosition = (value) => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (['bar_server', 'bar-server', 'bar server'].includes(normalized)) return 'bar_server'
  if (['retail', 'retail_sales', 'retail sales', 'retail sales associate'].includes(normalized)) return 'retail'
  return ''
}

const createRequestId = () => globalThis.crypto?.randomUUID?.()
  || `tts-${Date.now()}-${Math.random().toString(36).slice(2)}`

const fetchNaturalVoiceUrl = async (text, position) => {
  const normalizedPosition = normalizePosition(position)
  if (!normalizedPosition || deniedNaturalVoiceProducts.has(normalizedPosition)) throw new Error('BROWSER_TTS_ONLY')

  const cacheKey = `${normalizedPosition}:${text}`
  const cached = audioUrlCache.get(cacheKey)
  if (cached?.expiresAt > Date.now() + 60_000) return cached.audioUrl

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('LOGIN_REQUIRED')

  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      position: normalizedPosition,
      clientRequestId: createRequestId(),
    }),
  })
  const body = await response.json().catch(() => null)
  if (!response.ok || !body?.data?.audioUrl) {
    const errorCode = body?.error?.code || 'TTS_FAILED'
    if (['NATURAL_TTS_REQUIRES_PACK', 'NATURAL_TTS_NOT_AVAILABLE'].includes(errorCode)) {
      deniedNaturalVoiceProducts.add(normalizedPosition)
    }
    throw new Error(errorCode)
  }

  const expiresAt = body.data.expiresAt
    ? Number(body.data.expiresAt) * 1000
    : Date.now() + 23 * 60 * 60 * 1000
  audioUrlCache.set(cacheKey, { audioUrl: body.data.audioUrl, expiresAt })
  return body.data.audioUrl
}

export const stopSpeech = () => {
  playbackGeneration += 1
  if (activeAudio) {
    activeAudio.pause()
    activeAudio.currentTime = 0
    activeAudio = null
  }
  window.speechSynthesis?.cancel()
}

export const speakEnglish = async (text, options = {}) => {
  const normalizedText = typeof text === 'string' ? text.trim() : ''
  if (!normalizedText || typeof window === 'undefined') return { provider: 'none' }

  stopSpeech()
  const generation = playbackGeneration
  options.onStart?.()

  try {
    const audioUrl = await fetchNaturalVoiceUrl(normalizedText, options.position)
    if (generation !== playbackGeneration) return { provider: 'cancelled' }

    const audio = new Audio(audioUrl)
    activeAudio = audio
    await new Promise((resolve, reject) => {
      audio.onended = resolve
      audio.onerror = reject
      audio.play().catch(reject)
    })
    if (activeAudio === audio) activeAudio = null
    options.onEnd?.()
    return { provider: 'dashscope' }
  } catch {
    if (generation !== playbackGeneration) return { provider: 'cancelled' }
    activeAudio = null
    const result = await speakWithBrowser(normalizedText, options)
    options.onEnd?.()
    return result
  }
}

export const speakText = async (text, options = {}) => {
  const normalizedText = typeof text === 'string' ? text.trim() : ''
  if (!normalizedText || typeof window === 'undefined') return { provider: 'none' }

  stopSpeech()
  const generation = playbackGeneration
  options.onStart?.()
  const result = await speakWithBrowser(normalizedText, options)
  if (generation !== playbackGeneration) return { provider: 'cancelled' }
  options.onEnd?.()
  return result
}
