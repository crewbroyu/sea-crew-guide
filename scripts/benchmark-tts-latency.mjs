import { mkdir, writeFile } from 'node:fs/promises'
import process from 'node:process'
import { createPcmStreamDecoder } from '../src/utils/pcmStream.js'
import {
  SENTENCES, VOICES, billableCharacters, costCny, describeWavHeader, getProviderConfig, isConfigured, streamSpeech,
} from './tts-bench/providers.mjs'

// Server-side latency comparison between Qwen and Azure, both streamed and decoded with the
// client's own decoder. Prints the request plan and estimated cost, and only calls the APIs
// with --yes. Browser playback start is measured separately by scripts/tts-bench/server.mjs.
//
//   npm run bench:tts                       plan only, no API calls
//   npm run bench:tts -- --yes              2 runs of every sentence per voice
//   npm run bench:tts -- --yes --runs=1 --voices=qwen-cherry,azure-us
//
// Metrics per request, all measured from the moment fetch is called:
//   api first byte    first byte of the provider's response body (Qwen: first SSE event, may hold no audio)
//   first decodable   first PCM samples the client decoder can hand to the audio queue
//   total             provider stream ended

const arg = (name) => process.argv.find((item) => item.startsWith(`--${name}=`))?.split('=')[1]
const confirmed = process.argv.includes('--yes')
const runs = Math.min(5, Math.max(1, Number(arg('runs')) || 2))
const maxRequests = Number(process.env.TTS_BENCH_MAX_REQUESTS) || 60
const timeoutMs = 20_000
const config = getProviderConfig()

const requestedVoices = arg('voices')?.split(',') || VOICES.filter((voice) => voice.key !== 'azure-ph').map((voice) => voice.key)
const unknown = requestedVoices.filter((key) => !VOICES.some((voice) => voice.key === key))
if (unknown.length) {
  console.error(`Unknown voices: ${unknown.join(', ')}. Known: ${VOICES.map((voice) => voice.key).join(', ')}`)
  process.exit(1)
}
const targets = VOICES.filter((voice) => requestedVoices.includes(voice.key))
  .filter((voice) => {
    if (isConfigured(config, voice.provider)) return true
    console.warn(`SKIP ${voice.key}: ${voice.provider === 'qwen' ? 'DASHSCOPE_API_KEY' : 'AZURE_SPEECH_KEY and AZURE_SPEECH_REGION'} not configured.`)
    return false
  })

// One short warm-up per voice (connection setup is reported apart), then the timed runs.
const warmupText = 'Hello.'
const sentenceCharacters = SENTENCES.reduce((sum, sentence) => sum + billableCharacters(sentence.text), 0)
const plan = targets.map((target) => {
  const requests = 1 + SENTENCES.length * runs
  const characters = billableCharacters(warmupText) + sentenceCharacters * runs
  return { ...target, requests, characters, cost: costCny(target.provider, characters) }
})
const totalRequests = plan.reduce((sum, item) => sum + item.requests, 0)

console.log(`Plan: ${SENTENCES.length} sentences x ${runs} runs + 1 warm-up, ${targets.length} voices`)
for (const item of plan) {
  console.log(`  ${item.key.padEnd(14)} ${String(item.requests).padStart(3)} requests  ${String(item.characters).padStart(5)} chars  ~CNY ${item.cost.toFixed(4)}`)
}
console.log(`  total          ${String(totalRequests).padStart(3)} requests  ~CNY ${plan.reduce((sum, item) => sum + item.cost, 0).toFixed(4)} (list price; Azure F0 and Qwen free quota may cover it)`)

if (!targets.length) process.exit(1)
if (totalRequests > maxRequests) {
  console.error(`\nRefusing: ${totalRequests} requests exceeds TTS_BENCH_MAX_REQUESTS=${maxRequests}.`)
  process.exit(1)
}
if (!confirmed) {
  console.log('\nNo API calls made. Re-run with --yes to execute this plan.')
  process.exit(0)
}
// Azure F0 allows 20 requests per 60 seconds; space requests out when Azure is in the plan.
const azureGapMs = Number(process.env.TTS_BENCH_AZURE_GAP_MS) || (targets.some((t) => t.provider === 'azure') ? 3200 : 0)

const capturedHeads = new Map()
const measure = async (target, text) => {
  const decoder = createPcmStreamDecoder()
  const startedAt = performance.now()
  const result = { apiFirstByteMs: null, firstDecodableMs: null, totalMs: null, audioSeconds: 0, chunks: 0, smallestChunk: Infinity }
  let head = new Uint8Array(0)
  const { characters } = await streamSpeech({
    config,
    provider: target.provider,
    voice: target.voice,
    text,
    signal: AbortSignal.timeout(timeoutMs),
    onFirstByte: () => { result.apiFirstByteMs = performance.now() - startedAt },
    onBytes: (bytes) => {
      result.chunks += 1
      result.smallestChunk = Math.min(result.smallestChunk, bytes.length)
      if (head.length < 256) head = new Uint8Array([...head, ...bytes.subarray(0, 256 - head.length)])
      const decoded = decoder.push(bytes)
      if (decoded.length && result.firstDecodableMs === null) result.firstDecodableMs = performance.now() - startedAt
      result.audioSeconds += decoded.length / decoder.sampleRate
    },
  })
  result.totalMs = performance.now() - startedAt
  result.reportedCharacters = characters
  if (result.firstDecodableMs === null) throw new Error('NO_AUDIO')
  if (!capturedHeads.has(target.provider)) capturedHeads.set(target.provider, head)
  return result
}

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const runOne = async (target, text, bucket) => {
  try {
    bucket.push(await measure(target, text))
  } catch (error) {
    target.errors.push(error.message)
  }
  if (target.provider === 'azure' && azureGapMs) await pause(azureGapMs)
}

for (const target of targets) {
  target.errors = []
  target.warmup = []
  target.results = []
  await runOne(target, warmupText, target.warmup)
}
// Interleave voices per sentence so a network blip does not land on one provider only.
for (let round = 0; round < runs; round += 1) {
  for (const sentence of SENTENCES) {
    for (const target of targets) await runOne(target, sentence.text, target.results)
  }
}

const percentile = (values, ratio) => {
  if (!values.length) return NaN
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.ceil(ratio * sorted.length) - 1)]
}
const cell = (values) => `${Math.round(percentile(values, 0.5))}/${Math.round(percentile(values, 0.9))}`.padStart(11)

console.log('\nvoice           ok  warm-up | api 1st byte  1st decodable      total  (p50/p90 ms) | audio s  RTF  chunks')
for (const target of targets) {
  const pick = (key) => target.results.map((result) => result[key])
  const audio = pick('audioSeconds').reduce((sum, value) => sum + value, 0)
  const elapsed = pick('totalMs').reduce((sum, value) => sum + value, 0)
  console.log([
    target.key.padEnd(14),
    String(target.results.length).padStart(3),
    String(Math.round(target.warmup[0]?.firstDecodableMs ?? NaN)).padStart(8),
    ' |',
    cell(pick('apiFirstByteMs')),
    ' ',
    cell(pick('firstDecodableMs')),
    cell(pick('totalMs')),
    '              |',
    (audio / Math.max(1, target.results.length)).toFixed(1).padStart(7),
    (audio ? elapsed / 1000 / audio : NaN).toFixed(2).padStart(5),
    String(Math.round(percentile(pick('chunks'), 0.5))).padStart(6),
  ].join(' '))
}

// Record what each provider's stream really starts with, for the offline compatibility test.
await mkdir(new URL('../tmp/tts-bench/', import.meta.url), { recursive: true })
for (const [provider, head] of capturedHeads) {
  await writeFile(new URL(`../tmp/tts-bench/${provider}-stream-head.bin`, import.meta.url), head)
  console.log(`\n${provider} stream header: ${JSON.stringify(describeWavHeader(head))}`)
}

const reported = targets.filter((target) => target.provider === 'qwen')
  .flatMap((target) => [...target.warmup, ...target.results]).map((result) => result.reportedCharacters)
if (reported.length) console.log(`Qwen reported ${reported.reduce((sum, value) => sum + (value || 0), 0)} billed characters in total.`)

const failures = targets.flatMap((target) => target.errors.map((error) => `${target.key}: ${error}`))
if (failures.length) {
  console.log(`\n${failures.length} failed requests:`)
  failures.slice(0, 10).forEach((line) => console.log(`  ${line}`))
}
console.log('\nRTF = generation time / audio length (below 1 means faster than playback).')
