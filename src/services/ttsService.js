import { supabase } from '../supabase'
import { concatSamples, createPcmStreamDecoder } from '../utils/pcmStream'

const audioUrlCache = new Map()
const deniedNaturalVoiceProducts = new Set()
const pcmCache = new Map()
const pendingPrefetches = new Map()
const activeSources = new Set()
const MAX_PCM_CACHE_ENTRIES = 20
let audioContext = null
let activeStreamAbort = null
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

const fetchAssessmentVoiceUrl = async (text, { voice, languageType, scenarioId }) => {
  const cacheKey = `assessment:${voice}:${languageType}:${text}`
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
      mode: 'assessment',
      voice,
      languageType,
      scenarioId,
      clientRequestId: createRequestId(),
    }),
  })
  const body = await response.json().catch(() => null)
  if (!response.ok || !body?.data?.audioUrl) throw new Error(body?.error?.code || 'ASSESSMENT_TTS_FAILED')

  const expiresAt = body.data.expiresAt
    ? Number(body.data.expiresAt) * 1000
    : Date.now() + 23 * 60 * 60 * 1000
  audioUrlCache.set(cacheKey, { audioUrl: body.data.audioUrl, expiresAt })
  return body.data.audioUrl
}

const playAudioUrl = async (audioUrl, generation) => {
  if (generation !== playbackGeneration) return { provider: 'cancelled' }
  const audio = new Audio(audioUrl)
  activeAudio = audio
  await new Promise((resolve, reject) => {
    audio.onended = resolve
    audio.onerror = reject
    audio.play().catch(reject)
  })
  if (activeAudio === audio) activeAudio = null
  return { provider: 'dashscope' }
}

// Must run inside a click/tap handler at least once so Safari and WeChat allow later playback.
export const unlockAudio = () => {
  if (typeof window === 'undefined') return null
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return null
  audioContext ||= new AudioContextClass()
  if (audioContext.state === 'suspended') audioContext.resume().catch(() => {})
  return audioContext
}

const ensureRunningContext = async (context) => {
  if (context.state === 'running') return true
  await Promise.race([
    context.resume().catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 400)),
  ])
  return context.state === 'running'
}

const base64ToBytes = (value) => {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

const rememberPcm = (key, entry) => {
  pcmCache.delete(key)
  pcmCache.set(key, entry)
  if (pcmCache.size > MAX_PCM_CACHE_ENTRIES) pcmCache.delete(pcmCache.keys().next().value)
}

// Requests streamed speech. Calls onSamples as audio arrives and resolves with the full clip,
// or with { audioUrl } when the server answered from its URL cache instead of streaming.
const streamNaturalVoice = async (text, normalizedPosition, { signal, onSamples } = {}) => {
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
      stream: true,
    }),
    signal,
  })

  const cacheKey = `${normalizedPosition}:${text}`
  const rememberUrl = (data) => {
    const expiresAt = data.expiresAt ? Number(data.expiresAt) * 1000 : Date.now() + 23 * 60 * 60 * 1000
    audioUrlCache.set(cacheKey, { audioUrl: data.audioUrl, expiresAt })
  }

  if (!(response.headers.get('content-type') || '').includes('ndjson')) {
    const body = await response.json().catch(() => null)
    if (!response.ok || !body?.data?.audioUrl) {
      const errorCode = body?.error?.code || 'TTS_FAILED'
      if (['NATURAL_TTS_REQUIRES_PACK', 'NATURAL_TTS_NOT_AVAILABLE'].includes(errorCode)) {
        deniedNaturalVoiceProducts.add(normalizedPosition)
      }
      throw new Error(errorCode)
    }
    rememberUrl(body.data)
    return { audioUrl: body.data.audioUrl }
  }

  const decoder = createPcmStreamDecoder()
  const textDecoder = new TextDecoder()
  const reader = response.body.getReader()
  const parts = []
  let buffered = ''
  let finished = false

  const handleLine = (line) => {
    if (!line.trim()) return
    const message = JSON.parse(line)
    if (message.type === 'audio') {
      const samples = decoder.push(base64ToBytes(message.data))
      if (!samples.length) return
      parts.push(samples)
      onSamples?.(samples, decoder.sampleRate)
    } else if (message.type === 'done') {
      finished = true
      if (message.data?.audioUrl) rememberUrl(message.data)
    } else if (message.type === 'error') {
      throw new Error(message.error?.code || 'TTS_FAILED')
    }
  }

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffered += textDecoder.decode(value, { stream: true })
    const lines = buffered.split('\n')
    buffered = lines.pop()
    lines.forEach(handleLine)
  }
  if (buffered) handleLine(buffered)
  if (!finished) throw new Error('TTS_STREAM_INTERRUPTED')

  const entry = { samples: concatSamples(parts), sampleRate: decoder.sampleRate }
  rememberPcm(cacheKey, entry)
  return entry
}

// Queues decoded slices back to back on the shared AudioContext.
const createPlaybackQueue = (context) => {
  let nextStartTime = 0
  let lastSource = null

  return {
    get scheduled() { return Boolean(lastSource) },
    push(samples, sampleRate) {
      const buffer = context.createBuffer(1, samples.length, sampleRate)
      buffer.copyToChannel(samples, 0)
      const source = context.createBufferSource()
      source.buffer = buffer
      source.connect(context.destination)
      const startTime = Math.max(nextStartTime, context.currentTime + 0.12)
      source.start(startTime)
      nextStartTime = startTime + buffer.duration
      activeSources.add(source)
      source.onended = () => activeSources.delete(source)
      lastSource = source
    },
    // Resolves when the last queued slice ends or is stopped; the timeout guards a stalled context.
    finished() {
      if (!lastSource) return Promise.resolve()
      const source = lastSource
      const remainingMs = Math.max(0, nextStartTime - context.currentTime) * 1000
      return new Promise((resolve) => {
        const timer = setTimeout(resolve, remainingMs + 1500)
        source.addEventListener('ended', () => {
          clearTimeout(timer)
          resolve()
        })
      })
    },
  }
}

const playNaturalVoice = async (text, position, generation) => {
  const normalizedPosition = normalizePosition(position)
  if (!normalizedPosition || deniedNaturalVoiceProducts.has(normalizedPosition)) throw new Error('BROWSER_TTS_ONLY')
  const cacheKey = `${normalizedPosition}:${text}`
  // Created before any await so a direct click still counts as the user gesture.
  const context = unlockAudio()

  if (!context) {
    const audioUrl = await fetchNaturalVoiceUrl(text, position)
    return playAudioUrl(audioUrl, generation)
  }
  if (!(await ensureRunningContext(context))) throw new Error('AUDIO_BLOCKED')
  if (generation !== playbackGeneration) return { provider: 'cancelled' }

  const queue = createPlaybackQueue(context)
  const finishQueue = async () => {
    await queue.finished()
    return { provider: generation === playbackGeneration ? 'dashscope' : 'cancelled' }
  }

  const prefetched = pcmCache.get(cacheKey) || await pendingPrefetches.get(cacheKey)
  if (generation !== playbackGeneration) return { provider: 'cancelled' }
  if (prefetched?.samples) {
    queue.push(prefetched.samples, prefetched.sampleRate)
    return finishQueue()
  }

  const cachedUrl = audioUrlCache.get(cacheKey)
  if (cachedUrl?.expiresAt > Date.now() + 60_000) return playAudioUrl(cachedUrl.audioUrl, generation)

  const abortController = new AbortController()
  activeStreamAbort = abortController
  try {
    const result = await streamNaturalVoice(text, normalizedPosition, {
      signal: abortController.signal,
      onSamples: (samples, sampleRate) => {
        if (generation === playbackGeneration) queue.push(samples, sampleRate)
      },
    })
    if (result.audioUrl) return playAudioUrl(result.audioUrl, generation)
  } catch (error) {
    if (generation !== playbackGeneration) return { provider: 'cancelled' }
    // Once audio has started, finish what arrived instead of restarting in the browser voice.
    if (!queue.scheduled) throw error
  } finally {
    if (activeStreamAbort === abortController) activeStreamAbort = null
  }
  return finishQueue()
}

// Fetches speech ahead of time (e.g. the next interview question) so it can start instantly.
export const prefetchEnglish = (text, options = {}) => {
  const normalizedText = typeof text === 'string' ? text.trim() : ''
  const normalizedPosition = normalizePosition(options.position)
  if (!normalizedText || !normalizedPosition || typeof window === 'undefined') return
  if (deniedNaturalVoiceProducts.has(normalizedPosition)) return
  const cacheKey = `${normalizedPosition}:${normalizedText}`
  if (pcmCache.has(cacheKey) || pendingPrefetches.has(cacheKey)) return

  const pending = streamNaturalVoice(normalizedText, normalizedPosition)
    .catch(() => null)
    .finally(() => pendingPrefetches.delete(cacheKey))
  pendingPrefetches.set(cacheKey, pending)
}

export const stopSpeech = () => {
  playbackGeneration += 1
  activeStreamAbort?.abort()
  activeStreamAbort = null
  activeSources.forEach((source) => {
    try { source.stop() } catch { /* already stopped */ }
  })
  activeSources.clear()
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
    const result = await playNaturalVoice(normalizedText, options.position, generation)
    if (result.provider !== 'cancelled') options.onEnd?.()
    return result
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

export const speakAssessment = async (text, options = {}) => {
  const normalizedText = typeof text === 'string' ? text.trim() : ''
  if (!normalizedText || typeof window === 'undefined') return { provider: 'none' }

  stopSpeech()
  const generation = playbackGeneration
  options.onStart?.()

  try {
    const audioUrl = await fetchAssessmentVoiceUrl(normalizedText, options)
    const result = await playAudioUrl(audioUrl, generation)
    if (result.provider !== 'cancelled') options.onEnd?.()
    return result
  } catch {
    if (generation !== playbackGeneration) return { provider: 'cancelled' }
    activeAudio = null
    const result = await speakWithBrowser(normalizedText, options)
    options.onEnd?.()
    return result
  }
}
