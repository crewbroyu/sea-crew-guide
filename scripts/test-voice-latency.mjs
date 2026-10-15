import { readFile } from 'node:fs/promises'
import { Buffer } from 'node:buffer'
import { concatSamples, createPcmStreamDecoder } from '../src/utils/pcmStream.js'
import { createEndOfTurnDetector } from '../src/utils/voiceActivity.js'
import { readProviderStream } from '../server/tts.js'

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')
const [client, page, apiRoute, viteConfig] = await Promise.all([
  read('src/services/ttsService.js'),
  read('src/pages/tasks/phase2/Task8MockInterview.jsx'),
  read('api/tts.js'),
  read('vite.config.js'),
])

// A streaming WAV header as DashScope sends it: placeholder sizes, 24 kHz mono 16-bit.
const wavHeader = () => {
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(0x7fffffff, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(1, 22)
  header.writeUInt32LE(24000, 24)
  header.writeUInt32LE(48000, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(0x7fffffff, 40)
  return header
}

const pcm = Buffer.alloc(8)
;[0, 16384, -16384, 32767].forEach((value, index) => pcm.writeInt16LE(value, index * 2))
const wav = Buffer.concat([wavHeader(), pcm])

// Split mid-header and mid-sample to prove nothing is lost or misaligned.
const decoder = createPcmStreamDecoder()
const decoded = concatSamples([wav.subarray(0, 30), wav.subarray(30, 47), wav.subarray(47)]
  .map((part) => decoder.push(new Uint8Array(part))))

const feedSeconds = (detector, rms, seconds) => {
  let result = null
  for (let elapsed = 0; elapsed < seconds * 1000; elapsed += 100) result = detector.feed(rms, 100)
  return result
}

const quietThenSpeech = createEndOfTurnDetector()
feedSeconds(quietThenSpeech, 0.003, 1)
const silenceBeforeSpeech = feedSeconds(quietThenSpeech, 0.003, 5)
feedSeconds(quietThenSpeech, 0.08, 5)
const shortThinkingPause = feedSeconds(quietThenSpeech, 0.003, 2)
feedSeconds(quietThenSpeech, 0.08, 1)
const longPause = feedSeconds(quietThenSpeech, 0.003, 3.6)

const briefAnswer = createEndOfTurnDetector()
feedSeconds(briefAnswer, 0.003, 1)
feedSeconds(briefAnswer, 0.08, 1)
const briefAnswerPause = feedSeconds(briefAnswer, 0.003, 5)

const noisyCabin = createEndOfTurnDetector()
feedSeconds(noisyCabin, 0.03, 2)
feedSeconds(noisyCabin, 0.2, 4)
const noisyPause = feedSeconds(noisyCabin, 0.03, 3.6)

const sseText = [
  'data:{"output":{"audio":{"data":"AAEC"}}}',
  'data:{"output":{"audio":{"data":"AwQF"}}}',
  'data:{"output":{"audio":{"data":"","url":"http://example.test/a.wav","expires_at":1}},"usage":{"characters":12}}',
  '',
].join('\n')
const encoded = new TextEncoder().encode(sseText)
const providerResponse = new Response(new ReadableStream({
  start(controller) {
    for (let offset = 0; offset < encoded.length; offset += 7) controller.enqueue(encoded.slice(offset, offset + 7))
    controller.close()
  },
}))
const forwarded = []
const streamed = await readProviderStream(providerResponse, (data) => forwarded.push(data))

const checks = [
  ['decoder reads the sample rate from the streamed header', decoder.sampleRate === 24000],
  ['decoder keeps every sample across split slices', decoded.length === 4],
  ['decoder converts 16-bit samples to floats', decoded[0] === 0 && decoded[1] === 0.5 && decoded[2] === -0.5],
  ['detector waits for speech before ending a turn', !silenceBeforeSpeech.ended],
  ['detector tolerates a two-second thinking pause', !shortThinkingPause.ended],
  ['detector ends the turn after a long pause', longPause.ended],
  ['detector ignores pauses after very short answers', !briefAnswerPause.ended],
  ['detector adapts to background noise', noisyPause.ended],
  ['server forwards every audio slice in order', forwarded.join(',') === 'AAEC,AwQF'],
  ['server keeps the final file URL for caching', streamed.audio?.url === 'http://example.test/a.wav' && streamed.usage?.characters === 12],
  ['production route uses the streaming responder', apiRoute.includes('sendTtsResponse')],
  ['dev server uses the streaming responder', viteConfig.includes('sendTtsResponse')],
  ['client asks for streamed speech', client.includes('stream: true')],
  ['client stops queued audio and open streams', client.includes('activeStreamAbort?.abort()') && client.includes('source.stop()')],
  ['client still falls back to browser speech', client.includes('speakWithBrowser(normalizedText, options)')],
  ['interview unlocks audio inside the start click', /const startInterview = async \(startIndex = 0\) => \{\r?\n {4}unlockAudio\(\);/.test(page)],
  ['interview prefetches the next question', page.includes('prefetchSpeech(nextQuestion || CLOSING_LINE)')],
  ['interview acknowledges while checking for follow-ups', page.includes('const acknowledgementPlayback = speakQuestion(acknowledgement)')],
  ['auto-stop never overrides a typed or confirmed answer', page.includes('!answerReadyRef.current') && page.includes('!manualAnswerRef.current.trim()')],
]

const failed = checks.filter(([, passed]) => !passed)
if (failed.length) {
  for (const [label] of failed) console.error(`FAIL: ${label}`)
  process.exit(1)
}

for (const [label] of checks) console.log(`PASS: ${label}`)
