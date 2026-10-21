// Pre-generates narration audio for a slide lecture with Qwen TTS.
//
// Usage:
//   node scripts/lectures/generate-lecture-audio.mjs bar-server-day1 [--only 01,08] [--force] [--voice Jennifer]
//
// Each slide's narration is synthesized sentence by sentence so the player can
// show exact caption timing. Output: public/<audioBase>/<slide>.mp3 plus a
// timing manifest in src/data/lectures/audio/<lecture>.json.
import { Mp3Encoder } from '@breezystack/lamejs'
import { mkdir, readFile, writeFile, access } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { barServerDay1Lecture } from '../../src/data/lectures/barServerDay1Lecture.js'

const LECTURES = { [barServerDay1Lecture.id]: barServerDay1Lecture }
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const ENDPOINT = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'
const MODEL = 'qwen3-tts-flash'
const SENTENCE_GAP_MS = 250
const TAIL_MS = 400
const MP3_KBPS = 48

const args = process.argv.slice(2)
const flag = (name) => {
  const index = args.indexOf(`--${name}`)
  return index === -1 ? null : args[index + 1]
}
const lecture = LECTURES[args[0]]
if (!lecture) {
  console.error(`Unknown lecture "${args[0]}". Available: ${Object.keys(LECTURES).join(', ')}`)
  process.exit(1)
}
const only = flag('only')?.split(',').map((id) => id.trim())
const force = args.includes('--force')
const voice = flag('voice') || 'Jennifer'

const loadEnv = async () => {
  for (const file of ['.env.local', '.env']) {
    const text = await readFile(path.join(ROOT, file), 'utf8').catch(() => '')
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
    }
  }
}

// Chinese lectures split after Chinese terminators, or after an English
// sentence end followed by Chinese, so quoted English lines stay whole.
// English lectures split after every sentence end.
const SENTENCE_BOUNDARY = {
  Chinese: /(?<=[。！？])|(?<=[.?!])\s+(?=[一-鿿])/u,
  English: /(?<=[.?!][”"]?)\s+/u,
}
const splitSentences = (text, language) => text
  .split(SENTENCE_BOUNDARY[language])
  .map((part) => part.trim())
  .filter(Boolean)

const synthesize = async (text, apiKey, language) => {
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        signal: AbortSignal.timeout(60_000),
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, input: { text, voice, language_type: language } }),
      })
      const body = await response.json().catch(() => null)
      const url = body?.output?.audio?.url
      if (response.ok && url) {
        const audio = await fetch(url, { signal: AbortSignal.timeout(120_000) })
        if (audio.ok) return Buffer.from(await audio.arrayBuffer())
        console.warn(`  attempt ${attempt}: audio download ${audio.status}`)
      } else {
        console.warn(`  attempt ${attempt}: ${response.status} ${body?.code || ''} ${body?.message || ''}`)
      }
    } catch (error) {
      console.warn(`  attempt ${attempt}: ${error.cause?.code || error.message}`)
    }
    await new Promise((resolve) => setTimeout(resolve, 1500 * attempt))
  }
  throw new Error(`TTS failed for: ${text.slice(0, 40)}…`)
}

const parseWav = (buffer) => {
  let offset = 12
  let format = null
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4)
    const size = buffer.readUInt32LE(offset + 4)
    if (id === 'fmt ') {
      format = { channels: buffer.readUInt16LE(offset + 10), sampleRate: buffer.readUInt32LE(offset + 12), bits: buffer.readUInt16LE(offset + 22) }
    } else if (id === 'data') {
      if (!format || format.bits !== 16) throw new Error('Expected 16-bit PCM WAV')
      // Some streaming WAVs report a placeholder data size; clamp to the buffer.
      const end = Math.min(buffer.length, offset + 8 + size)
      const frames = new Int16Array(buffer.buffer.slice(buffer.byteOffset + offset + 8, buffer.byteOffset + end - ((end - offset - 8) % 2)))
      if (format.channels === 1) return { sampleRate: format.sampleRate, samples: frames }
      const mono = new Int16Array(Math.floor(frames.length / format.channels))
      for (let i = 0; i < mono.length; i += 1) mono[i] = frames[i * format.channels]
      return { sampleRate: format.sampleRate, samples: mono }
    }
    offset += 8 + size + (size % 2)
  }
  throw new Error('WAV data chunk not found')
}

const encodeMp3 = (samples, sampleRate) => {
  const encoder = new Mp3Encoder(1, sampleRate, MP3_KBPS)
  const parts = []
  for (let i = 0; i < samples.length; i += 1152) parts.push(encoder.encodeBuffer(samples.subarray(i, i + 1152)))
  parts.push(encoder.flush())
  return Buffer.concat(parts.map((part) => Buffer.from(part.buffer, part.byteOffset, part.byteLength)))
}

const exists = (file) => access(file).then(() => true, () => false)

await loadEnv()
const apiKey = process.env.DASHSCOPE_API_KEY
if (!apiKey) {
  console.error('DASHSCOPE_API_KEY is not configured.')
  process.exit(1)
}

const audioDir = path.join(ROOT, 'public', lecture.audioBase)
const manifestPath = path.join(ROOT, 'src/data/lectures/audio', `${lecture.id}.json`)
await mkdir(audioDir, { recursive: true })
await mkdir(path.dirname(manifestPath), { recursive: true })
const manifest = JSON.parse(await readFile(manifestPath, 'utf8').catch(() => '{}'))
manifest.voice = voice
manifest.model = MODEL
manifest.slides ||= {}

let characters = 0
for (const slide of lecture.slides) {
  if (only && !only.includes(slide.id)) continue
  const file = path.join(audioDir, `${slide.id}.mp3`)
  if (!force && manifest.slides[slide.id]?.narration === slide.narration && await exists(file)) {
    console.log(`${slide.id}: unchanged, skipped`)
    continue
  }

  const language = lecture.language || 'Chinese'
  const sentences = splitSentences(slide.narration, language)
  const pieces = []
  let sampleRate = 0
  for (const sentence of sentences) {
    const wav = parseWav(await synthesize(sentence, apiKey, language))
    sampleRate ||= wav.sampleRate
    if (wav.sampleRate !== sampleRate) throw new Error('Sample rate changed between sentences')
    pieces.push({ text: sentence, samples: wav.samples })
    console.log(`  ${slide.id} · ${(wav.samples.length / wav.sampleRate).toFixed(1)}s · ${sentence.slice(0, 24)}`)
    characters += sentence.length
  }

  const gap = Math.round(sampleRate * (slide.sentenceGapMs ?? SENTENCE_GAP_MS) / 1000)
  const total = pieces.reduce((sum, piece) => sum + piece.samples.length, 0) + gap * (pieces.length - 1) + Math.round(sampleRate * TAIL_MS / 1000)
  const output = new Int16Array(total)
  const captions = []
  let cursor = 0
  pieces.forEach((piece, index) => {
    output.set(piece.samples, cursor)
    captions.push({ text: piece.text, startMs: Math.round(cursor / sampleRate * 1000), endMs: Math.round((cursor + piece.samples.length) / sampleRate * 1000) })
    cursor += piece.samples.length + (index < pieces.length - 1 ? gap : 0)
  })

  await writeFile(file, encodeMp3(output, sampleRate))
  manifest.slides[slide.id] = { narration: slide.narration, durationMs: Math.round(total / sampleRate * 1000), captions }
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`${slide.id}: ${sentences.length} sentences, ${(total / sampleRate).toFixed(1)}s`)
}
console.log(`Done. Characters sent: ${characters}`)
