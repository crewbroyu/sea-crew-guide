import { useTrainingInspection } from '../../hooks/useTrainingInspection'
import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, LoaderCircle, LockKeyhole, Mic, RotateCcw, Square, Volume2 } from 'lucide-react'
import { speakEnglish as liveSpeakEnglish, stopSpeech } from '../../services/ttsService'
import { createInterviewRequestId, evaluateFoundationChallenge } from '../../services/interviewAiService'
import {
  addGuestChallengeAiAttempt,
  canCompleteGuestChallengeWithSelfReview,
  canRequestGuestChallengeAi,
  completeGuestChallengeWithSelfReview,
  getActivePendingRequestId,
  getGuestChallengeAiAttempts,
  isGuestChallengeAiRecoveryRequired,
  recordGuestChallengeAttempt,
} from '../../data/guestChallengeState'

const MINIMUM_RECORDING_SECONDS = 3
const AMBIGUOUS_REQUEST_ERRORS = new Set(['AI_TIMEOUT', 'NETWORK_ERROR', 'AI_REQUEST_IN_PROGRESS', 'AI_REQUEST_ALREADY_COMPLETED'])

const pickRecordingMimeType = () => [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
].find((type) => MediaRecorder.isTypeSupported?.(type))

export default function GuestChallengePractice({
  position = '',
  role,
  prompt,
  reference = {},
  challenge = {},
  locked = false,
  onChallengeChange,
}) {
  const inspection = useTrainingInspection()
  const speakEnglish = inspection ? async () => {} : liveSpeakEnglish
  const [draft, setDraft] = useState(challenge.transcript || '')
  const [recording, setRecording] = useState(false)
  const [recordingUrl, setRecordingUrl] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [evaluating, setEvaluating] = useState(false)
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const recognitionRef = useRef(null)
  const chunksRef = useRef([])
  const startedAtRef = useRef(0)
  const draftRef = useRef(draft)
  const recordingUrlRef = useRef('')
  const discardRecordingRef = useRef(false)
  // Recorder and AI callbacks resolve after re-renders; always build on the latest saved state.
  const challengeRef = useRef(challenge)

  useEffect(() => {
    draftRef.current = draft
  }, [draft])

  useEffect(() => {
    challengeRef.current = challenge
  }, [challenge])

  useEffect(() => () => {
    discardRecordingRef.current = true
    stopSpeech()
    try {
      recognitionRef.current?.stop?.()
    } catch {
      // Recognition may already be stopped by the browser.
    }
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    if (recordingUrlRef.current) URL.revokeObjectURL(recordingUrlRef.current)
  }, [])

  const commitChallenge = (nextChallenge) => {
    challengeRef.current = nextChallenge
    onChallengeChange?.(nextChallenge)
  }

  const emitChange = (nextValue) => commitChallenge({
    ...challengeRef.current,
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
    if (inspection) return
    setErrorMessage('')
    stopSpeech()

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
        if (!challengeRef.current.completedAt) {
          commitChallenge(recordGuestChallengeAttempt(challengeRef.current, {
            transcript: draftRef.current,
            recordedAt: new Date().toISOString(),
          }))
        }
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
    if (challengeRef.current.completedAt) return
    if (draft.trim() !== (challengeRef.current.transcript || '').trim()) {
      emitChange({ transcript: draft.trim() })
    }
  }

  const completeChallenge = async () => {
    if (evaluating) return
    const challenge = challengeRef.current
    const transcript = draft.trim()
    const previousAttempts = getGuestChallengeAiAttempts(challenge)
    if (!canRequestGuestChallengeAi({ ...challenge, transcript })) return
    if (isGuestChallengeAiRecoveryRequired(challenge)) {
      setErrorMessage('The earlier AI request could not be recovered safely. Record twice and use self-review to avoid another charge.')
      return
    }
    const previousAttempt = previousAttempts.at(-1)
    if (previousAttempts.length === 1 && Number(challenge.attemptCount || 0) <= Number(previousAttempt?.recordingAttemptCount || 0)) {
      setErrorMessage('Record your improved answer before asking AI to compare it.')
      return
    }
    setEvaluating(true)
    setErrorMessage('')
    // Reuse an id only while its attempt slot is still open; a spent id would be rejected as already completed.
    const attemptSlot = previousAttempts.length
    const activePendingRequestId = getActivePendingRequestId(challenge)
    const requestId = activePendingRequestId || createInterviewRequestId()
    if (!activePendingRequestId) {
      emitChange({ pendingRequestId: requestId, pendingTranscript: transcript, pendingAttemptIndex: attemptSlot, aiRecoveryRequired: false })
    }
    try {
      const evaluation = await evaluateFoundationChallenge({
        position: position === 'retail' ? 'Retail Sales Associate' : 'Bar Server',
        dayId: reference.dayId || role,
        answer: transcript,
        requestId,
      })
      const feedback = evaluation.questionScores?.[0] || {}
      const attempt = {
        score: Number(evaluation.overallScore || 0),
        transcript,
        comment: feedback.comment || '',
        strengths: feedback.strengths || [],
        improvements: feedback.improvements || [],
        improvedAnswer: feedback.improvedAnswer || '',
        retryChecklist: feedback.retryChecklist || feedback.improvements || [],
        recordingAttemptCount: Number(challenge.attemptCount || 0),
        evaluatedAt: new Date().toISOString(),
      }
      commitChallenge(addGuestChallengeAiAttempt(challengeRef.current, attempt, new Date().toISOString()))
    } catch (error) {
      const ambiguous = AMBIGUOUS_REQUEST_ERRORS.has(error.code)
      emitChange({
        pendingRequestId: ambiguous ? requestId : null,
        pendingTranscript: ambiguous ? transcript : null,
        pendingAttemptIndex: ambiguous ? attemptSlot : null,
        aiRecoveryRequired: error.code === 'AI_REQUEST_ALREADY_COMPLETED',
      })
      setErrorMessage(ambiguous
        ? 'The AI request status is uncertain, so this page will not create a new charge. Record a second answer and complete with self-review.'
        : `${error.message || 'AI feedback is temporarily unavailable.'} You can still record twice and complete this step with self-review.`)
    } finally {
      setEvaluating(false)
    }
  }

  const completeWithSelfReview = () => {
    if (evaluating || !canCompleteGuestChallengeWithSelfReview(challengeRef.current)) return
    commitChallenge(completeGuestChallengeWithSelfReview(challengeRef.current, new Date().toISOString()))
    setErrorMessage('')
  }

  const aiAttempts = getGuestChallengeAiAttempts(challenge)
  const firstFeedback = aiAttempts[0]
  const latestFeedback = aiAttempts.at(-1)
  const needsNewRecording = aiAttempts.length === 1 && Number(challenge.attemptCount || 0) <= Number(firstFeedback?.recordingAttemptCount || 0)
  const canSelfReview = canCompleteGuestChallengeWithSelfReview(challenge)

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
            <button type="button" onClick={() => speakEnglish(prompt, { position })} disabled={inspection || recording} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-white px-3 text-xs font-semibold text-slate-950 disabled:opacity-50">
              <Volume2 size={15} /> Listen to the guest
            </button>
            {recording ? (
              <button type="button" onClick={stopRecording} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white">
                <Square size={14} /> Stop answer
              </button>
            ) : (
              <button type="button" onClick={startRecording} disabled={inspection || evaluating} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white disabled:opacity-50">
                <Mic size={14} /> {challenge.completedAt ? 'Practice again' : challenge.hasRecording ? 'Record again' : 'Record your answer'}
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
          <p className="mt-2 text-xs leading-5 text-slate-400">Your audio stays on this page. AI coaching is optional. Two complete recordings can finish this step with self-review.</p>

          {firstFeedback && <div className="mt-4 rounded-lg border border-amber-700 bg-amber-950 p-4"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold text-amber-200">AI COACH · FIRST ATTEMPT</p><span className="text-lg font-bold text-white">{firstFeedback.score}/100</span></div><p className="mt-2 text-sm leading-6 text-amber-50">{firstFeedback.comment}</p><ul className="mt-2 space-y-1 text-xs leading-5 text-amber-100">{(firstFeedback.retryChecklist || firstFeedback.improvements || []).slice(0, 3).map((item) => <li key={item}>• {item}</li>)}</ul>{firstFeedback.improvedAnswer && <div className="mt-3 border-l-2 border-blue-400 pl-3 text-sm leading-6 text-blue-100">{firstFeedback.improvedAnswer}</div>}{aiAttempts.length === 1 && <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-white"><RotateCcw size={14} />Record a new answer in your own words, then compare.</p>}</div>}

          {aiAttempts.length >= 2 && <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg border border-emerald-700 bg-emerald-950 p-4 text-center"><div><p className="text-xs text-emerald-200">First</p><p className="text-2xl font-bold">{aiAttempts[0].score}</p></div><span className="text-emerald-300">→</span><div><p className="text-xs text-emerald-200">Retry</p><p className="text-2xl font-bold">{aiAttempts[1].score}</p><p className="text-xs font-semibold text-emerald-200">{challenge.scoreDelta >= 0 ? '+' : ''}{challenge.scoreDelta}</p></div></div>}

          {errorMessage && <p className="mt-3 rounded-lg bg-red-950 px-3 py-2 text-xs leading-5 text-red-200">{errorMessage}</p>}

          {!challenge.completedAt && <button
            type="button"
            onClick={completeWithSelfReview}
            disabled={!canSelfReview || evaluating}
            className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-900 px-4 text-sm font-semibold text-white transition hover:border-slate-400 disabled:cursor-not-allowed disabled:text-slate-500"
          >
            <CheckCircle2 size={17} />
            {canSelfReview ? 'Complete with self-review' : `Self-review unlocks after 2 recordings · ${Math.min(Number(challenge.attemptCount || 0), 2)}/2`}
          </button>}

          <button
            type="button"
            onClick={completeChallenge}
            disabled={evaluating || !challenge.hasRecording || !draft.trim() || needsNewRecording || challenge.completedAt || isGuestChallengeAiRecoveryRequired(challenge)}
            className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            {evaluating ? <LoaderCircle size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
            {evaluating ? 'AI is reviewing...' : challenge.completedAt ? (challenge.completionMode === 'self_review' ? 'Completed · Self-review' : latestFeedback ? `Completed · ${latestFeedback.score}/100` : 'Completed') : isGuestChallengeAiRecoveryRequired(challenge) ? 'AI retry paused · use self-review' : aiAttempts.length ? 'Compare my retry' : 'Get optional AI feedback'}
          </button>
        </>
      )}
    </section>
  )
}
