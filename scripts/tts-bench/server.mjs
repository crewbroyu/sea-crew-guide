import { createServer } from 'node:http'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { Buffer } from 'node:buffer'
import { networkInterfaces } from 'node:os'
import process from 'node:process'
import { createPcmStreamDecoder } from '../../src/utils/pcmStream.js'
import {
  PRICING, SENTENCES, VOICES, billableCharacters, costCny, getProviderConfig, isConfigured, streamSpeech,
} from './providers.mjs'

// Local-only harness for browser playback timing and the blind listening test.
//   npm run bench:tts-browser            then open http://127.0.0.1:5199
// Only the fixed SENTENCES can be synthesized, and every provider call counts against
// TTS_BENCH_MAX_REQUESTS (default 60) for the life of the process. Blind-test clips are kept
// in tmp/tts-bench/clips so replays and later sessions cost nothing.

const port = Number(process.env.TTS_BENCH_PORT) || 5199
const host = process.argv.includes('--lan') ? '0.0.0.0' : '127.0.0.1'
const maxRequests = Number(process.env.TTS_BENCH_MAX_REQUESTS) || 60
const config = getProviderConfig()
const clipDir = new URL('../../tmp/tts-bench/clips/', import.meta.url)
const resultDir = new URL('../../tmp/tts-bench/results/', import.meta.url)
const RATES = { normal: '', slow: '-20%' }
const usage = { requests: 0, characters: { qwen: 0, azure: 0 }, cacheHits: 0 }

const resolveRequest = ({ voiceKey, sentenceId, rate = 'normal' }) => {
  const voice = VOICES.find((item) => item.key === voiceKey)
  const sentence = SENTENCES.find((item) => item.id === sentenceId)
  if (!voice || !sentence || !(rate in RATES)) throw Object.assign(new Error('UNKNOWN_VOICE_SENTENCE_OR_RATE'), { status: 400 })
  if (!isConfigured(config, voice.provider)) throw Object.assign(new Error(`${voice.provider.toUpperCase()}_NOT_CONFIGURED`), { status: 503 })
  if (voice.provider === 'qwen' && rate !== 'normal') throw Object.assign(new Error('QWEN_HAS_NO_RATE_PARAMETER'), { status: 400 })
  return { voice, sentence, rate }
}

const spend = (provider, text) => {
  if (usage.requests >= maxRequests) throw Object.assign(new Error('BENCH_BUDGET_EXHAUSTED'), { status: 429 })
  usage.requests += 1
  usage.characters[provider] += billableCharacters(text)
}

const wavFromPcm = (pcm, sampleRate) => {
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + pcm.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(1, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(sampleRate * 2, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(pcm.length, 40)
  return Buffer.concat([header, pcm])
}

// Live, uncached synthesis streamed in the same NDJSON shape production uses
// ({type:'audio', data} lines, then one 'done' line), with server-side timings in 'done'.
const handleStream = async (body, response) => {
  const { voice, sentence, rate } = resolveRequest(body)
  spend(voice.provider, sentence.text)
  const decoder = createPcmStreamDecoder()
  const startedAt = performance.now()
  const timing = { providerFirstByteMs: null, providerFirstAudioMs: null, providerTotalMs: null }
  response.writeHead(200, { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-cache, no-transform' })
  try {
    await streamSpeech({
      config,
      provider: voice.provider,
      voice: voice.voice,
      text: sentence.text,
      rate: RATES[rate],
      signal: AbortSignal.timeout(20_000),
      onFirstByte: () => { timing.providerFirstByteMs = performance.now() - startedAt },
      onBytes: (bytes) => {
        if (timing.providerFirstAudioMs === null && decoder.push(bytes).length) timing.providerFirstAudioMs = performance.now() - startedAt
        response.write(`${JSON.stringify({ type: 'audio', data: Buffer.from(bytes).toString('base64') })}\n`)
      },
    })
    timing.providerTotalMs = performance.now() - startedAt
    response.end(`${JSON.stringify({ type: 'done', timing })}\n`)
  } catch (error) {
    response.end(`${JSON.stringify({ type: 'error', error: error.message })}\n`)
  }
}

// Whole WAV for the blind test, synthesized once per voice/sentence/rate and then served from disk.
const handleClip = async (params, response) => {
  const { voice, sentence, rate } = resolveRequest(params)
  const name = createHash('sha256').update(`${voice.provider}|${voice.voice}|${rate}|${sentence.text}`).digest('hex').slice(0, 24)
  const file = new URL(`${name}.wav`, clipDir)
  let wav = await readFile(file).catch(() => null)
  if (wav) {
    usage.cacheHits += 1
  } else {
    spend(voice.provider, sentence.text)
    const decoder = createPcmStreamDecoder()
    const parts = []
    await streamSpeech({
      config,
      provider: voice.provider,
      voice: voice.voice,
      text: sentence.text,
      rate: RATES[rate],
      signal: AbortSignal.timeout(30_000),
      onBytes: (bytes) => {
        const samples = decoder.push(bytes)
        const pcm = Buffer.alloc(samples.length * 2)
        samples.forEach((value, index) => pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(value * 32768))), index * 2))
        parts.push(pcm)
      },
    })
    wav = wavFromPcm(Buffer.concat(parts), decoder.sampleRate)
    await mkdir(clipDir, { recursive: true })
    await writeFile(file, wav)
  }
  response.writeHead(200, { 'Content-Type': 'audio/wav', 'Cache-Control': 'no-store' })
  response.end(wav)
}

const readJson = async (request) => {
  const chunks = []
  for await (const chunk of request) chunks.push(chunk)
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
}

const sendJson = (response, status, payload) => {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  response.end(JSON.stringify(payload))
}

createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`)
  try {
    if (request.method === 'GET' && url.pathname === '/') {
      response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      response.end(await readFile(new URL('./index.html', import.meta.url)))
    } else if (request.method === 'GET' && url.pathname === '/pcmStream.js') {
      // The real client decoder, so the browser test exercises production code.
      response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' })
      response.end(await readFile(new URL('../../src/utils/pcmStream.js', import.meta.url)))
    } else if (request.method === 'GET' && url.pathname === '/config') {
      sendJson(response, 200, {
        sentences: SENTENCES,
        voices: VOICES.map((voice) => ({ ...voice, configured: isConfigured(config, voice.provider) })),
        rates: Object.keys(RATES),
        maxRequests,
      })
    } else if (request.method === 'GET' && url.pathname === '/usage') {
      sendJson(response, 200, {
        ...usage,
        maxRequests,
        estimatedCny: costCny('qwen', usage.characters.qwen) + costCny('azure', usage.characters.azure),
        usdToCny: PRICING.usdToCny,
      })
    } else if (request.method === 'POST' && url.pathname === '/tts') {
      await handleStream(await readJson(request), response)
    } else if (request.method === 'POST' && url.pathname === '/results') {
      const body = await readJson(request)
      const name = `${body.kind === 'blind' ? 'blind' : 'latency'}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
      await mkdir(resultDir, { recursive: true })
      await writeFile(new URL(name, resultDir), JSON.stringify(body, null, 2))
      sendJson(response, 200, { file: `tmp/tts-bench/results/${name}` })
    } else if (request.method === 'GET' && url.pathname === '/clip') {
      await handleClip(Object.fromEntries(url.searchParams), response)
    } else {
      sendJson(response, 404, { error: 'NOT_FOUND' })
    }
  } catch (error) {
    if (response.headersSent) response.end()
    else sendJson(response, error.status || 500, { error: error.message })
  }
}).listen(port, host, () => {
  const lanAddresses = Object.values(networkInterfaces()).flat()
    .filter((item) => item?.family === 'IPv4' && !item.internal).map((item) => item.address)
  const addresses = host === '0.0.0.0' ? lanAddresses : [host]
  addresses.forEach((address) => console.log(`TTS bench harness on http://${address}:${port}`))
  console.log(`Configured: qwen=${isConfigured(config, 'qwen')} azure=${isConfigured(config, 'azure')}; budget ${maxRequests} provider requests.`)
})
