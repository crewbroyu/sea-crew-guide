import { Buffer } from 'node:buffer'
import process from 'node:process'
import { readProviderStream } from '../../server/tts.js'

// Shared by the Node benchmark and the browser harness. Evaluation only: production speech
// still goes through server/tts.js and is not touched by anything in this folder.

// Every voice hears exactly these texts, in the latency runs and in the blind test.
export const SENTENCES = [
  { id: 'bar-greeting', text: 'Good evening. Can I get you something to drink while you look at the menu?' },
  { id: 'bar-allergy', text: 'I have a severe shellfish allergy. Is this soup safe?' },
  { id: 'retail-offer', text: 'This jacket is on sale today, and we also have it in navy if you prefer a darker color.' },
  { id: 'interview-question', text: 'Tell me about a time you handled an unhappy guest. What did you do?' },
  { id: 'service-apology', text: 'I am sorry for the wait. Let me check with the kitchen and come right back to you.' },
]

// Voices checked against the official lists on 2026-10-21 (Azure language-support page dated
// 2026-09-09; Model Studio Qwen-TTS voice list). All Azure ones are standard neural voices.
export const VOICES = [
  { key: 'qwen-cherry', provider: 'qwen', voice: 'Cherry', label: 'Qwen Cherry (current default)' },
  { key: 'qwen-jennifer', provider: 'qwen', voice: 'Jennifer', label: 'Qwen Jennifer (American female)' },
  { key: 'azure-us', provider: 'azure', voice: 'en-US-AvaNeural', label: 'Azure US English' },
  { key: 'azure-gb', provider: 'azure', voice: 'en-GB-SoniaNeural', label: 'Azure British English' },
  { key: 'azure-in', provider: 'azure', voice: 'en-IN-NeerjaNeural', label: 'Azure Indian English' },
  { key: 'azure-ph', provider: 'azure', voice: 'en-PH-RosaNeural', label: 'Azure Philippine English' },
]

// List prices on 2026-10-21. Qwen: qwen3-tts-flash, Beijing, CNY 0.8 per 10k characters (a Chinese
// character counts as 2). Azure: S1 neural TTS, USD 15 per 1M characters (East Asia, East US and
// Southeast Asia all list the same). The exchange rate is an assumption, override it if needed.
export const PRICING = {
  usdToCny: Number(process.env.TTS_BENCH_USD_CNY) || 7.1,
  qwenCnyPerMillion: 80,
  azureUsdPerMillion: 15,
}

export const billableCharacters = (text) => [...text].reduce(
  (sum, char) => sum + (/\p{Script=Han}/u.test(char) ? 2 : 1), 0,
)

export const costCny = (provider, characters) => (provider === 'qwen'
  ? characters / 1e6 * PRICING.qwenCnyPerMillion
  : characters / 1e6 * PRICING.azureUsdPerMillion * PRICING.usdToCny)

export const getProviderConfig = (env = process.env) => ({
  qwen: {
    apiKey: env.DASHSCOPE_API_KEY || '',
    url: env.DASHSCOPE_TTS_URL
      || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
    model: env.DASHSCOPE_TTS_MODEL || 'qwen3-tts-flash',
  },
  // AZURE_SPEECH_ENDPOINT overrides the region URL, e.g. https://chinaeast2.tts.speech.azure.cn/cognitiveservices/v1.
  azure: {
    apiKey: env.AZURE_SPEECH_KEY || '',
    url: env.AZURE_SPEECH_ENDPOINT
      || (env.AZURE_SPEECH_REGION
        ? `https://${env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`
        : ''),
  },
})

export const isConfigured = (config, provider) => Boolean(config[provider].apiKey && config[provider].url)

const escapeXml = (value) => value.replace(/[<>&'"]/g, (char) => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
})[char])

// rate is a relative SSML prosody value such as "-15%"; Qwen has no equivalent parameter.
export const buildSsml = ({ voice, text, rate = '' }) => {
  const lang = voice.split('-').slice(0, 2).join('-')
  const body = rate ? `<prosody rate="${rate}">${escapeXml(text)}</prosody>` : escapeXml(text)
  return `<speak version="1.0" xml:lang="${lang}"><voice name="${voice}">${body}</voice></speak>`
}

// Streams one synthesis as raw WAV bytes. Calls onFirstByte when the provider's response body
// starts (which for Qwen may be an SSE event that carries no audio yet) and onBytes for audio.
// Resolves with the characters the provider reported, when it reports them.
export const streamSpeech = async ({ config, provider, voice, text, rate = '', onFirstByte, onBytes, signal }) => {
  if (provider === 'qwen') {
    if (rate) throw new Error('QWEN_HAS_NO_RATE_PARAMETER')
    const response = await fetch(config.qwen.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.qwen.apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-SSE': 'enable',
      },
      body: JSON.stringify({ model: config.qwen.model, input: { text, voice, language_type: 'English' } }),
      signal,
    })
    if (!response.ok) throw new Error(`HTTP_${response.status} ${(await response.text()).slice(0, 160)}`)
    const body = tapFirstByte(response, onFirstByte)
    const { usage, providerError } = await readProviderStream(body, (data) => onBytes(new Uint8Array(Buffer.from(data, 'base64'))))
    if (providerError) throw new Error(`${providerError.code} ${providerError.message || ''}`.trim())
    return { characters: usage?.characters ?? null }
  }

  const response = await fetch(config.azure.url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': config.azure.apiKey,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm',
      'User-Agent': 'crewpath-tts-benchmark',
    },
    body: buildSsml({ voice, text, rate }),
    signal,
  })
  if (!response.ok) throw new Error(`HTTP_${response.status} ${(await response.text()).slice(0, 160)}`)
  const reader = tapFirstByte(response, onFirstByte).body.getReader()
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    onBytes(value)
  }
  return { characters: null }
}

// Wraps a response so the first body chunk is timestamped before anything parses it.
const tapFirstByte = (response, onFirstByte) => {
  let seen = false
  const reader = response.body.getReader()
  return new Response(new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read()
      if (done) {
        controller.close()
        return
      }
      if (!seen && value.length) {
        seen = true
        onFirstByte?.()
      }
      controller.enqueue(value)
    },
    cancel(reason) { return reader.cancel(reason) },
  }))
}

// Describes the RIFF header at the start of a stream, to compare what each provider really sends.
export const describeWavHeader = (bytes) => {
  if (bytes.length < 12) return { complete: false }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const ascii = (offset) => String.fromCharCode(...bytes.subarray(offset, offset + 4))
  if (ascii(0) !== 'RIFF' || ascii(8) !== 'WAVE') return { riff: false }
  const info = { riff: true, riffSize: view.getUint32(4, true), chunks: [] }
  let offset = 12
  while (offset + 8 <= bytes.length) {
    const id = ascii(offset)
    const size = view.getUint32(offset + 4, true)
    info.chunks.push({ id, size, offset })
    if (id === 'fmt ' && offset + 24 <= bytes.length) {
      info.audioFormat = view.getUint16(offset + 8, true)
      info.channels = view.getUint16(offset + 10, true)
      info.sampleRate = view.getUint32(offset + 12, true)
      info.bitsPerSample = view.getUint16(offset + 22, true)
    }
    if (id === 'data') {
      info.dataOffset = offset + 8
      info.dataSize = size
      break
    }
    offset += 8 + size + (size % 2)
  }
  return info
}
