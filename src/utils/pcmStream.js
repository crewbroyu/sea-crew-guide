// Incremental decoder for a streamed 16-bit PCM WAV. The first bytes carry the RIFF header
// (whose data size is a placeholder while streaming); later slices are raw little-endian samples
// that may split a sample across two slices.
export const createPcmStreamDecoder = () => {
  let headerParsed = false
  let pending = new Uint8Array(0)
  let sampleRate = 24000
  let channels = 1

  const append = (bytes) => {
    const merged = new Uint8Array(pending.length + bytes.length)
    merged.set(pending)
    merged.set(bytes, pending.length)
    pending = merged
  }

  const readAscii = (view, offset) => String.fromCharCode(
    view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3),
  )

  // Returns false until the whole header up to the data chunk has arrived.
  const parseHeader = () => {
    if (pending.length < 12) return false
    const view = new DataView(pending.buffer, pending.byteOffset, pending.byteLength)
    if (readAscii(view, 0) !== 'RIFF' || readAscii(view, 8) !== 'WAVE') {
      headerParsed = true
      return true
    }
    let offset = 12
    while (offset + 8 <= pending.length) {
      const id = readAscii(view, offset)
      const size = view.getUint32(offset + 4, true)
      if (id === 'fmt ') {
        if (offset + 24 > pending.length) return false
        channels = view.getUint16(offset + 10, true) || 1
        sampleRate = view.getUint32(offset + 12, true) || sampleRate
      }
      if (id === 'data') {
        pending = pending.slice(offset + 8)
        headerParsed = true
        return true
      }
      offset += 8 + size + (size % 2)
    }
    return false
  }

  return {
    get sampleRate() { return sampleRate },
    // Returns mono Float32 samples decoded so far (channels beyond the first are dropped).
    push(bytes) {
      append(bytes)
      if (!headerParsed && !parseHeader()) return new Float32Array(0)
      const frameBytes = 2 * channels
      const usable = pending.length - (pending.length % frameBytes)
      const view = new DataView(pending.buffer, pending.byteOffset, usable)
      const samples = new Float32Array(usable / frameBytes)
      for (let index = 0; index < samples.length; index += 1) {
        samples[index] = view.getInt16(index * frameBytes, true) / 32768
      }
      pending = pending.slice(usable)
      return samples
    },
  }
}

export const concatSamples = (parts) => {
  const total = parts.reduce((sum, part) => sum + part.length, 0)
  const merged = new Float32Array(total)
  let offset = 0
  for (const part of parts) {
    merged.set(part, offset)
    offset += part.length
  }
  return merged
}
