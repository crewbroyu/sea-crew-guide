import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, LockKeyhole, Mic, Square, Volume2 } from 'lucide-react'

const MINIMUM_RECORDING_SECONDS = 3

const pickRecordingMimeType = () => [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
].find((type) => MediaRecorder.isTypeSupported?.(type))

const speakEnglish = (text) => {
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  const voices = window.speechSynthesis.getVoices()
  utterance.voice = voices.find((voice) => /^en-(US|GB)/i.test(voice.lang))
    || voices.find((voice) => voice.lang?.toLowerCase().startsWith('en'))
    || null
  utterance.lang = utterance.voice?.lang || 'en-US'
  utterance.rate = 0.88
  window.speechSynthesis.speak(utterance)
}

export default function GuestChallengePractice({
  role,
  prompt,
  challenge = {},
  locked = false,
  onChallengeChange,
}) {
  const [draft, setDraft] = useState(challenge.transcript || '')
  const [recording, setRecording] = useState(false)
  const [recordingUrl, setRecordingUrl] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const recognitionRef = useRef(null)
  const chunksRef = useRef([])
  const startedAtRef = useRef(0)
  const draftRef = useRef(draft)
  const recordingUrlRef = useRef('')
  const discardRecordingRef = useRef(false)

  useEffect(() => {
    draftRef.current = draft
  }, [draft])

  useEffect(() => () => {
    discardRecordingRef.current = true
    window.speechSynthesis?.cancel()
    try {
      recognitionRef.current?.stop?.()
    } catch {
      // Recognition may already be stopped by the browser.
    }
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current)
  }, [])

  const emitChange = (nextValue) => onChallengeChange?.({
    ...challenge,
    ...nextValue,
  })

  const startRecognition = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) return

    const recognition = new Recognition()
    recognition.lang = 'en-US'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (transcript) setDraft(transcript)
    }
    recognition.onerror = () => {
      // Recording still works; the learner can correct or type the answer below.
    }
    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch {
      recognitionRef.current = null
    }
  }

  const startRecording = async () => {
    setErrorMessage('')
    window.speechSynthesis?.cancel()

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setErrorMessage('Recording is not supported here. Please use the latest Chrome or Edge.')
      return
    }

    let stream
    try {
      discardRecordingRef.current = false
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      startedAtRef.current = Date.now()
      const mimeType = pickRecordingMimeType()
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 32000,
      })
      recorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        try {
          recognitionRef.current?.stop?.()
        } catch {
          // Recognition may already be stopped by the browser.
        }
        recognitionRef.current = null
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        if (discardRecordingRef.current) return
        setRecording(false)

        const elapsedSeconds = (Date.now() - startedAtRef.current) / 1000
        if (elapsedSeconds < MINIMUM_RECORDING_SECONDS) {
          setErrorMessage(`Speak for at least ${MINIMUM_RECORDING_SECONDS} seconds so the attempt can be counted.`)
          return
        }

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || mimeType || 'audio/webm',
        })
        const nextUrl = URL.createObjectURL(blob)
        if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current)
        recordingUrlRef.current = nextUrl
        setRecordingUrl(nextUrl)
        emitChange({
          hasRecording: true,
          attemptCount: Number(challenge.attemptCount || 0) + 1,
          transcript: draftRef.current.trim(),
          lastRecordedAt: new Date().toISOString(),
          completedAt: null,
        })
      }
      recorder.start()
      startRecognition()
      setRecording(true)
    } catch (error) {
      console.error('Guest Challenge recording failed:', error)
      stream?.getTracks().forEach((track) => track.stop())
      setRecording(false)
      setErrorMessage('Microphone access failed. Check the browser permission and try again.')
    }
  }

  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }

  const saveDraft = () => {
    if (draft.trim() !== (challenge.transcript || '').trim()) {
      emitChange({ transcript: draft.trim(), completedAt: null })
    }
  }

  const completeChallenge = () => {
    const transcript = draft.trim()
    if (!challenge.hasRecording || !transcript) return
    emitChange({
      transcript,
      completedAt: challenge.completedAt || new Date().toISOString(),
    })
  }

  return (
    <section className="mt-5 bg-slate-950 p-4 text-white sm:rounded-lg">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-blue-300">GUEST CHALLENGE</p>
        <span className="text-xs text-slate-400">Role · {role}</span>
      </div>
      <p className="mt-3 text-base font-medium leading-7">“{prompt}”</p>

      {locked ? (
        <div className="mt-4 flex items-center gap-2 border-t border-slate-700 pt-4 text-xs leading-5 text-slate-300">
          <LockKeyhole size={15} className="shrink-0" />
          Complete all three shadowing rounds above to unlock this challenge.
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-700 pt-4">
            <button type="button" onClick={() => speakEnglish(prompt)} disabled={recording} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-white px-3 text-xs font-semibold text-slate-950 disabled:opacity-50">
              <Volume2 size={15} /> Listen to the guest
            </button>
            {recording ? (
              <button type="button" onClick={stopRecording} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white">
                <Square size={14} /> Stop answer
              </button>
            ) : (
              <button type="button" onClick={startRecording} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white">
                <Mic size={14} /> {challenge.hasRecording ? 'Record again' : 'Record your answer'}
              </button>
            )}
          </div>

          {recordingUrl && <audio src={recordingUrl} controls className="mt-3 h-9 max-w-full" />}
          <label className="mt-4 block text-xs font-semibold text-slate-300" htmlFor={`guest-challenge-${role}`}>What you said</label>
          <textarea
            id={`guest-challenge-${role}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={saveDraft}
            rows={3}
            placeholder="Your English answer will appear here when browser speech recognition is available. You can correct it manually."
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400"
          />
          <p className="mt-2 text-xs leading-5 text-slate-400">The recording stays on this page. This step does not use your AI quota.</p>

          {errorMessage && <p className="mt-3 rounded-lg bg-red-950 px-3 py-2 text-xs leading-5 text-red-200">{errorMessage}</p>}

          <button
            type="button"
            onClick={completeChallenge}
            disabled={!challenge.hasRecording || !draft.trim()}
            className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            <CheckCircle2 size={17} />
            {challenge.completedAt ? 'Guest Challenge completed' : 'Complete Guest Challenge'}
          </button>
        </>
      )}
    </section>
  )
}
