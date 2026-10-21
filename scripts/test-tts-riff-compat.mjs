import { readFile } from 'node:fs/promises'
import { Buffer } from 'node:buffer'
import process from 'node:process'
import { concatSamples, createPcmStreamDecoder } from '../src/utils/pcmStream.js'
import { describeWavHeader } from './tts-bench/providers.mjs'

// Offline check that the client's streaming WAV decoder handles the header and chunk shapes an
// Azure riff-*-16bit-mono-pcm stream can take. No network calls. When the benchmark has captured
// a real response start (tmp/tts-bench/azure-stream-head.bin), that is checked too.

const buildWav = ({ sampleRate = 24000, bitsPerSample = 16, audioFormat = 1, riffSize, dataSize, extraChunks = [], samples }) => {
  const pcm = Buffer.alloc(samples.length * 2)
  samples.forEach((value, index) => pcm.writeInt16LE(value, index * 2))
  const fmt = Buffer.alloc(24)
  fmt.write('fmt ', 0)
  fmt.writeUInt32LE(16, 4)
  fmt.writeUInt16LE(audioFormat, 8)
  fmt.writeUInt16LE(1, 10)
  fmt.writeUInt32LE(sampleRate, 12)
  fmt.writeUInt32LE(sampleRate * bitsPerSample / 8, 16)
  fmt.writeUInt16LE(bitsPerSample / 8, 20)
  fmt.writeUInt16LE(bitsPerSample, 22)
  const extras = extraChunks.map(({ id, body }) => {
    const header = Buffer.alloc(8)
    header.write(id, 0)
    header.writeUInt32LE(body.length, 4)
    return Buffer.concat([header, body, Buffer.alloc(body.length % 2)])
  })
  const dataHeader = Buffer.alloc(8)
  dataHeader.write('data', 0)
  dataHeader.writeUInt32LE(dataSize ?? pcm.length, 4)
  const riff = Buffer.alloc(12)
  riff.write('RIFF', 0)
  riff.writeUInt32LE(riffSize ?? 4 + fmt.length + extras.reduce((sum, chunk) => sum + chunk.length, 0) + 8 + pcm.length, 4)
  riff.write('WAVE', 8)
  return Buffer.concat([riff, fmt, ...extras, dataHeader, pcm])
}

const decodeInSlices = (bytes, sliceSizes) => {
  const decoder = createPcmStreamDecoder()
  const parts = []
  let offset = 0
  let index = 0
  while (offset < bytes.length) {
    const size = sliceSizes[index % sliceSizes.length]
    parts.push(decoder.push(new Uint8Array(bytes.subarray(offset, offset + size))))
    offset += size
    index += 1
  }
  return { samples: concatSamples(parts), sampleRate: decoder.sampleRate }
}

const samples = Array.from({ length: 2400 }, (_, index) => Math.round(Math.sin(index / 7) * 12000))
const expected = Float32Array.from(samples, (value) => value / 32768)
const same = (actual) => actual.length === expected.length && actual.every((value, index) => value === expected[index])

const placeholder = buildWav({ samples, riffSize: 0xffffffff, dataSize: 0xffffffff })
const zeroSizes = buildWav({ samples, riffSize: 0, dataSize: 0 })
const exactSizes = buildWav({ samples })
const withList = buildWav({ samples, extraChunks: [{ id: 'LIST', body: Buffer.from('INFOISFT\x05\x00\x00\x00Azure\x00') }] })
const at48k = buildWav({ samples, sampleRate: 48000 })
const rawPcm = exactSizes.subarray(44)

// Every possible split point inside the header, plus slices that cut samples in half.
const everyHeaderSplit = Array.from({ length: 60 }, (_, cut) => {
  const decoder = createPcmStreamDecoder()
  return concatSamples([decoder.push(new Uint8Array(placeholder.subarray(0, cut + 1))), decoder.push(new Uint8Array(placeholder.subarray(cut + 1)))])
}).every(same)

// A stream that stops mid-sample must not invent a sample from the dangling byte.
const truncated = decodeInSlices(exactSizes.subarray(0, exactSizes.length - 1), [4096]).samples

const checks = [
  ['placeholder sizes (0xFFFFFFFF) decode completely', same(decodeInSlices(placeholder, [4096]).samples)],
  ['zero sizes decode completely', same(decodeInSlices(zeroSizes, [4096]).samples)],
  ['exact sizes decode completely', same(decodeInSlices(exactSizes, [4096]).samples)],
  ['a LIST chunk before data is skipped', same(decodeInSlices(withList, [4096]).samples)],
  ['1-byte slices decode completely', same(decodeInSlices(placeholder, [1]).samples)],
  ['odd slice sizes that split samples decode completely', same(decodeInSlices(placeholder, [3, 7, 1, 1023]).samples)],
  ['every header split point decodes completely', everyHeaderSplit],
  ['48 kHz streams report their sample rate', decodeInSlices(at48k, [5000]).sampleRate === 48000],
  ['headerless raw PCM decodes completely', same(decodeInSlices(rawPcm, [777]).samples)],
  ['a dangling final byte is dropped, not decoded', truncated.length === expected.length - 1],
]

// Known gap, reported rather than failed: the decoder trusts the stream to be 16-bit PCM.
// Always request a *-16bit-mono-pcm Azure output format.
const warnings = ['decoder does not check bitsPerSample; an 8-bit or non-PCM format would play as noise']

const capturedPath = new URL('../tmp/tts-bench/azure-stream-head.bin', import.meta.url)
const captured = await readFile(capturedPath).catch(() => null)
if (captured) {
  const header = describeWavHeader(new Uint8Array(captured))
  console.log('Captured Azure header:', JSON.stringify(header))
  checks.push(
    ['captured Azure stream is 16-bit mono PCM', header.riff && header.audioFormat === 1 && header.bitsPerSample === 16 && header.channels === 1],
    ['captured Azure stream decodes', decodeInSlices(captured, [1, 13, 4096]).samples.length > 0],
  )
} else {
  console.log('No captured Azure stream yet (run npm run bench:tts -- --yes with Azure configured to capture one).')
}

const failed = checks.filter(([, passed]) => !passed)
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'}: ${label}`)
for (const warning of warnings) console.log(`WARN: ${warning}`)
if (failed.length) process.exit(1)
