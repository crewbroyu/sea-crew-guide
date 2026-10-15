// Decides when a spoken answer has ended: enough speech has been heard, followed by a long pause.
// The pause limit is generous because candidates often stop to think in a second language;
// the noise floor adapts so a fan or a quiet cabin does not count as speech.
export const END_OF_TURN_SILENCE_MS = 3500
export const MIN_SPEECH_MS = 3000

export const createEndOfTurnDetector = ({
  silenceLimitMs = END_OF_TURN_SILENCE_MS,
  minSpeechMs = MIN_SPEECH_MS,
  minThreshold = 0.012,
} = {}) => {
  let noiseFloor = null
  let speechMs = 0
  let silenceMs = 0

  return {
    // rms: root-mean-square level of the latest frame (0..1); elapsedMs: time since the previous frame.
    feed(rms, elapsedMs) {
      if (noiseFloor === null) noiseFloor = rms
      else if (rms < noiseFloor) noiseFloor = rms
      else noiseFloor += (rms - noiseFloor) * 0.002

      const threshold = Math.max(minThreshold, noiseFloor * 2.5)
      if (rms > threshold) {
        speechMs += elapsedMs
        silenceMs = 0
      } else {
        silenceMs += elapsedMs
      }
      return { speaking: silenceMs === 0, ended: speechMs >= minSpeechMs && silenceMs >= silenceLimitMs }
    },
  }
}

export const getRms = (samples) => {
  if (!samples.length) return 0
  let sum = 0
  for (let index = 0; index < samples.length; index += 1) sum += samples[index] * samples[index]
  return Math.sqrt(sum / samples.length)
}
