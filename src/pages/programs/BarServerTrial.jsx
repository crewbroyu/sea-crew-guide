import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock3,
  Lightbulb,
  LoaderCircle,
  MessageSquareText,
  Mic,
  RefreshCcw,
  Sparkles,
  Square,
  Target,
  Wine,
} from 'lucide-react'
import useEffectiveAccess from '../../hooks/useEffectiveAccess'
import { hasProductEntitlement } from '../../services/activationService'
import PhraseShadowingPractice from '../../components/interview/PhraseShadowingPractice'
import EdgeReadAloudHint from '../../components/EdgeReadAloudHint'
import QuickFeedback from '../../components/QuickFeedback'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import BarServerTrialCompletionReport from '../../components/programs/BarServerTrialCompletionReport'
import ScenarioLesson from '../../components/interview/ScenarioLesson'
import { evaluateInterviewWithAi, transcribeInterviewAudio } from '../../services/interviewAiService'
import { saveInterviewPracticeRecord } from '../../services/interviewPracticeService'
import { trackProductEvent } from '../../services/productAnalyticsService'
import {
  BAR_SERVER_TRIAL_VERSION,
  getBarServerTrialScenarios,
  getBarTrialScenarioEntryStage,
  getNextIncompleteBarTrialScenario,
  getReadinessLabel,
  getScoreDeltaMessage,
  readBarServerTrial,
  writeBarServerTrial,
} from '../../data/barServerTrial'
import { readAssessmentTrialContext } from '../../data/assessmentExperienceBridge'
import { buildBarServerTrialReport } from '../../data/barServerTrialReport'

const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
const getAttemptFeedback = (attempt) => attempt?.evaluation?.questionScores?.[0] || null
const getAttemptScore = (attempt) => Number(attempt?.evaluation?.overallScore || 0)

const buildSavedAttempt = ({ transcript, durationSeconds, evaluation, attemptNumber }) => ({
  attemptNumber,
  transcript,
  durationSeconds,
  evaluation,
  completedAt: new Date().toISOString(),
})

// Each account (and guest/preview) gets its own trial state; remounting on owner change re-reads the right record.
export default function BarServerTrial() {
  const access = useEffectiveAccess()
  const { t } = useTranslation('barTrial')
  const ownerId = access.isPreviewing ? 'preview' : access.userId || 'guest'
  if (access.isRegistered && !access.isPreviewing && !access.userId) return <p className="p-6">{t('confirmingAccount')}</p>
  return <BarServerTrialContent key={ownerId} ownerId={ownerId} />
}

function BarServerTrialContent({ ownerId }) {
  const navigate = useNavigate()
  const location = useLocation()
  const access = useEffectiveAccess()
  const { t, i18n } = useTranslation('barTrial')
  const language = i18n.language === 'en' ? 'en' : 'zh'
  const barServerTrialScenarios = useMemo(() => getBarServerTrialScenarios(language), [language])
  const { isRegistered, openRegisterModal } = access
  const hasBarServerPack = hasProductEntitlement(access, 'bar_server_pack')
  const assessmentContext = useMemo(() => readAssessmentTrialContext(location.search, language), [language, location.search])
  const returnDestination = assessmentContext
    ? { route: '/assessment', label: t('back.assessment') }
    : location.state?.from === 'task5'
    ? { route: '/programs/bar-server/foundation', label: t('back.foundation') }
    : { route: '/academy/interview-questions?position=bar_server', label: t('back.questionBank') }
  // Chinese pages keep the server's own message; English pages map the error code to English copy.
  const describeError = (error, fallbackKey) => (language === 'en'
    ? t(`common:apiErrors.${error?.code}`, { defaultValue: t(fallbackKey) })
    : error?.message || t(fallbackKey))
  const savedTrial = useMemo(() => readBarServerTrial(localStorage, ownerId), [ownerId])
  const savedScenarioIndex = Number.isInteger(savedTrial?.scenarioIndex)
    && savedTrial.scenarioIndex >= 0
    && savedTrial.scenarioIndex < barServerTrialScenarios.length
    ? savedTrial.scenarioIndex
    : 0
  const initialScenarioIndex = assessmentContext?.scenarioIndex ?? savedScenarioIndex
  const initialScenario = barServerTrialScenarios[initialScenarioIndex]
  const [scenarioIndex, setScenarioIndex] = useState(initialScenarioIndex)
  const [stage, setStage] = useState(() => getBarTrialScenarioEntryStage(savedTrial, initialScenarioIndex))
  const [attemptsByScenario, setAttemptsByScenario] = useState(savedTrial?.attemptsByScenario || {})
  const [lessonProgressByScenario, setLessonProgressByScenario] = useState(savedTrial?.lessonProgressByScenario || {})
  const [transcript, setTranscript] = useState('')
  const [durationSeconds, setDurationSeconds] = useState(0)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [audioUrl, setAudioUrl] = useState('')
  const [recordingStatus, setRecordingStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [isEvaluating, setIsEvaluating] = useState(false)
  const mediaRecorderRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const audioChunksRef = useRef([])
  const audioBlobRef = useRef(null)
  const audioUrlRef = useRef('')
  const timerRef = useRef(null)
  const recordingSecondsRef = useRef(0)
  // The view event records the language the page opened in; a later switch is tracked as language_switched.
  const viewLanguageRef = useRef(language)

  const scenario = barServerTrialScenarios[scenarioIndex]
  const attempts = attemptsByScenario[scenario.id] || []
  const lessonProgress = lessonProgressByScenario[scenario.id] || {}
  const isLessonComplete = !scenario.lesson || Boolean(lessonProgress.completedAt)
  const firstAttempt = attempts[0]
  const retryAttempt = attempts[1]
  const firstScore = getAttemptScore(firstAttempt)
  const retryScore = getAttemptScore(retryAttempt)
  const scoreDelta = retryAttempt ? retryScore - firstScore : 0
  const currentAttemptNumber = Math.min(attempts.length + 1, 2)
  const completedCount = barServerTrialScenarios.filter((item) => (attemptsByScenario[item.id] || []).length >= 2).length
  const allScenariosCompleted = completedCount === barServerTrialScenarios.length
  const nextIncompleteScenarioIndex = getNextIncompleteBarTrialScenario(attemptsByScenario, scenarioIndex)
  const completedScores = barServerTrialScenarios
    .map((item) => getAttemptScore((attemptsByScenario[item.id] || [])[1]))
    .filter((score) => score > 0)
  const overallReadiness = completedScores.length
    ? Math.round(completedScores.reduce((sum, score) => sum + score, 0) / completedScores.length)
    : 0
  const trialReport = useMemo(() => allScenariosCompleted
    ? buildBarServerTrialReport({
        attemptsByScenario,
        currentStage: assessmentContext?.currentStage || '',
        language,
      })
    : null, [allScenariosCompleted, assessmentContext?.currentStage, attemptsByScenario, language])
  const trialReportDedupeKey = trialReport
    ? barServerTrialScenarios
        .map((item) => (attemptsByScenario[item.id] || [])[1]?.completedAt || item.id)
        .join(':')
    : ''

  useEffect(() => {
    trackProductEvent('free_trial_viewed', {
      oncePerSession: true,
      dedupeKey: assessmentContext ? `assessment:${initialScenarioIndex + 1}` : 'direct',
      properties: {
        scenarioIndex: initialScenarioIndex + 1,
        source: assessmentContext ? 'assessment' : 'direct',
        gap: assessmentContext?.gap || null,
        primaryConcern: assessmentContext?.concern || null,
        currentStage: assessmentContext?.currentStage || null,
        language: viewLanguageRef.current,
      },
    })
  }, [assessmentContext, initialScenarioIndex])

  useEffect(() => {
    if (stage !== 'comparison' || !retryAttempt) return
    trackProductEvent('free_trial_scenario_completed', {
      oncePerSession: true,
      dedupeKey: `${scenario.id}:${retryAttempt.completedAt}`,
      properties: {
        scenarioNumber: scenarioIndex + 1,
        scenarioId: scenario.id,
        completionOrder: completedCount,
        firstScore,
        retryScore,
        scoreDelta,
        language,
      },
    })
  }, [completedCount, firstScore, language, retryAttempt, retryScore, scenario.id, scenarioIndex, scoreDelta, stage])

  useEffect(() => {
    if (stage !== 'comparison' || !allScenariosCompleted || !retryAttempt) return
    trackProductEvent('free_trial_completed', {
      oncePerSession: true,
      dedupeKey: retryAttempt.completedAt,
      properties: { readiness: overallReadiness, hasAccess: hasBarServerPack },
    })
    if (!hasBarServerPack) {
      trackProductEvent('paywall_reached', {
        oncePerSession: true,
        dedupeKey: retryAttempt.completedAt,
        properties: { readiness: overallReadiness },
      })
    }
  }, [allScenariosCompleted, hasBarServerPack, overallReadiness, retryAttempt, stage])

  useEffect(() => {
    if (stage !== 'comparison' || !trialReport) return
    trackProductEvent('free_trial_report_viewed', {
      oncePerSession: true,
      dedupeKey: trialReportDedupeKey,
      properties: {
        readiness: trialReport.readiness,
        passedCount: trialReport.passedCount,
        primaryGapScenario: trialReport.primaryGap.scenarioId,
        source: assessmentContext ? 'assessment' : 'direct',
      },
    })
  }, [assessmentContext, stage, trialReport, trialReportDedupeKey])

  useEffect(() => {
    writeBarServerTrial(localStorage, ownerId, {
      version: BAR_SERVER_TRIAL_VERSION,
      scenarioIndex,
      stage,
      attemptsByScenario,
      lessonProgressByScenario,
      updatedAt: new Date().toISOString(),
    })
  }, [attemptsByScenario, lessonProgressByScenario, ownerId, scenarioIndex, stage])

  useEffect(() => () => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
  }, [])

  const replaceAudioUrl = (nextUrl = '') => {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
    audioUrlRef.current = nextUrl
    setAudioUrl(nextUrl)
  }

  const clearCurrentRecording = () => {
    replaceAudioUrl('')
    audioBlobRef.current = null
    setTranscript('')
    setDurationSeconds(0)
    setRecordingSeconds(0)
    recordingSecondsRef.current = 0
    setRecordingStatus('idle')
    setErrorMessage('')
  }

  const setCurrentAttempts = (nextValue) => {
    setAttemptsByScenario((previous) => ({
      ...previous,
      [scenario.id]: typeof nextValue === 'function' ? nextValue(previous[scenario.id] || []) : nextValue,
    }))
  }

  const setCurrentLessonProgress = (nextValue) => {
    setLessonProgressByScenario((previous) => ({
      ...previous,
      [scenario.id]: typeof nextValue === 'function'
        ? nextValue(previous[scenario.id] || {})
        : nextValue,
    }))
  }

  const completeLesson = () => {
    setCurrentLessonProgress((current) => ({
      ...current,
      completedAt: current.completedAt || new Date().toISOString(),
    }))
    setStage('briefing')
  }

  const beginAttempt = (isRetry = false) => {
    if (!isRegistered) {
      openRegisterModal()
      return
    }
    clearCurrentRecording()
    setStage(isRetry ? 'retry' : 'practice')
  }

  const backToBriefing = () => {
    clearCurrentRecording()
    setStage('briefing')
  }

  const startRecording = async () => {
    setErrorMessage('')
    if (!isRegistered) {
      setErrorMessage(t('errors.loginForRecording'))
      openRegisterModal()
      return
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setErrorMessage(t('errors.recordingUnsupported'))
      return
    }

    try {
      replaceAudioUrl('')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      audioChunksRef.current = []
      recordingSecondsRef.current = 0
      setRecordingSeconds(0)
      setTranscript('')

      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
        .find((type) => MediaRecorder.isTypeSupported?.(type))
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 32000,
      })
      mediaRecorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) audioChunksRef.current.push(event.data)
      }
      recorder.onstop = async () => {
        if (timerRef.current) window.clearInterval(timerRef.current)
        timerRef.current = null
        stream.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || mimeType || 'audio/webm' })
        const nextAudioUrl = URL.createObjectURL(blob)
        audioBlobRef.current = blob
        replaceAudioUrl(nextAudioUrl)
        setDurationSeconds(Math.max(1, recordingSecondsRef.current))
        setRecordingStatus('transcribing')

        try {
          const result = await transcribeInterviewAudio(blob, {
            mode: 'scenario_trial',
            position: 'Bar Server',
            question: scenario.interviewerQuestion,
            scenarioId: scenario.id,
            durationSeconds: Math.max(1, recordingSecondsRef.current),
          })
          setTranscript(result.transcript)
          setRecordingStatus('ready')
        } catch (error) {
          console.error('Bar Server trial transcription failed:', error)
          setRecordingStatus('ready')
          setErrorMessage(describeError(error, 'errors.transcriptionFailed'))
          if (error.code === 'LOGIN_REQUIRED') openRegisterModal()
        }
      }

      recorder.start()
      setRecordingStatus('recording')
      timerRef.current = window.setInterval(() => {
        recordingSecondsRef.current += 1
        setRecordingSeconds(recordingSecondsRef.current)
        if (recordingSecondsRef.current >= 120 && recorder.state === 'recording') recorder.stop()
      }, 1000)
    } catch (error) {
      console.error('Bar Server trial recording failed:', error)
      setErrorMessage(t('errors.microphoneUnavailable'))
      setRecordingStatus('idle')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
  }

  const submitAttempt = async () => {
    const normalizedTranscript = transcript.trim()
    if (!normalizedTranscript) {
      setErrorMessage(t('errors.answerRequired'))
      return
    }
    if (!isRegistered) {
      setErrorMessage(t('errors.loginForFeedback'))
      openRegisterModal()
      return
    }

    setIsEvaluating(true)
    setErrorMessage('')
    const attemptNumber = currentAttemptNumber
    const questionPayload = {
      id: scenario.id,
      question: scenario.interviewerQuestion,
      focus: scenario.focus,
      keywords: scenario.keywords,
    }

    try {
      const evaluation = await evaluateInterviewWithAi({
        mode: 'scenario_trial',
        position: 'Bar Server',
        questions: [questionPayload],
        answers: [{ questionId: scenario.id, textAnswer: normalizedTranscript, durationSeconds }],
        scenarioId: scenario.id,
        language,
      })
      const savedAttempt = buildSavedAttempt({ transcript: normalizedTranscript, durationSeconds, evaluation, attemptNumber })
      setCurrentAttempts(attemptNumber === 1 ? [savedAttempt] : [attempts[0], savedAttempt])
      setStage(attemptNumber === 1 ? 'feedback' : 'comparison')

      try {
        await saveInterviewPracticeRecord({
          targetPosition: 'bar_server',
          interviewerName: `Bar Server Free Scenario ${scenarioIndex + 1}`,
          questions: [questionPayload],
          answers: [{
            questionId: scenario.id,
            textAnswer: normalizedTranscript,
            durationSeconds,
            hasRecording: Boolean(audioBlobRef.current),
            answeredAt: savedAttempt.completedAt,
          }],
          evaluation,
          source: `bar_trial_${scenarioIndex + 1}_${attemptNumber === 1 ? 'initial' : 'retry'}`,
        })
      } catch (saveError) {
        console.error('Unable to save Bar Server trial record:', saveError)
      }
    } catch (error) {
      console.error('Bar Server trial evaluation failed:', error)
      setErrorMessage(describeError(error, 'errors.feedbackFailed'))
      if (error.code === 'LOGIN_REQUIRED') openRegisterModal()
    } finally {
      setIsEvaluating(false)
    }
  }

  const goToNextScenario = () => {
    if (nextIncompleteScenarioIndex < 0) return
    clearCurrentRecording()
    const nextIndex = nextIncompleteScenarioIndex
    setScenarioIndex(nextIndex)
    setStage(getBarTrialScenarioEntryStage({ attemptsByScenario, lessonProgressByScenario }, nextIndex))
  }

  const resetCurrentScenario = () => {
    clearCurrentRecording()
    setCurrentAttempts([])
    setCurrentLessonProgress({})
    setStage(scenario.lesson ? 'lesson' : 'briefing')
  }

  const updatePhrasePractice = (attemptNumber, phrasePractice) => {
    setCurrentAttempts((currentAttempts) => currentAttempts.map((attempt) => (
      attempt.attemptNumber === attemptNumber
        ? {
            ...attempt,
            phrasePractice,
          }
        : attempt
    )))
  }

  const renderBriefing = () => (
    <div className="space-y-5">
      {scenario.lesson && (
        <div className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 ${isLessonComplete ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
          <div className={`flex items-center gap-2 text-sm font-semibold ${isLessonComplete ? 'text-emerald-800' : 'text-amber-900'}`}>
            {isLessonComplete ? <CheckCircle2 size={17} /> : <BookOpen size={17} />}
            {isLessonComplete ? t('briefing.lessonDone') : t('briefing.lessonTodo')}
          </div>
          <button type="button" onClick={() => setStage('lesson')} className={`shrink-0 text-xs font-semibold transition ${isLessonComplete ? 'text-emerald-700 hover:text-emerald-900' : 'text-amber-800 hover:text-amber-950'}`}>
            {isLessonComplete ? t('briefing.review') : t('briefing.startLesson')}
          </button>
        </div>
      )}
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-blue-700">{t('briefing.scenarioLabel', { index: scenarioIndex + 1, total: barServerTrialScenarios.length, category: scenario.category })}</p>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{t('briefing.fullFeedback')}</span>
        </div>
        <h2 className="mt-3 text-xl font-semibold text-slate-950">{scenario.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{scenario.setting}</p>
        <div className="mt-5 border-l-4 border-blue-500 bg-blue-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase text-blue-700">{t('briefing.guest')}</p>
          <p className="mt-1 text-base font-medium leading-7 text-blue-950">“{scenario.guestLine}”</p>
        </div>
        <EdgeReadAloudHint />
        <p className="mt-4 text-sm leading-6 text-slate-700">{scenario.task}</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2"><Target size={18} className="text-blue-600" /><h3 className="font-semibold text-slate-950">{t('briefing.checkpoints')}</h3></div>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">{scenario.checkpoints.map((item) => <li key={item}>• {item}</li>)}</ul>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2"><Clock3 size={18} className="text-amber-600" /><h3 className="font-semibold text-slate-950">{t('briefing.watchOuts')}</h3></div>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">{scenario.watchOuts.map((item) => <li key={item}>• {item}</li>)}</ul>
        </div>
      </section>

      {!isRegistered && isLessonComplete && (
        <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">{t('briefing.progressSaved')}</p>
      )}
      <button type="button" onClick={() => (isLessonComplete ? beginAttempt(false) : setStage('lesson'))} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
        {isLessonComplete ? (isRegistered ? t('briefing.start', { index: scenarioIndex + 1 }) : t('briefing.loginToStart')) : t('briefing.finishLessonFirst')} <ArrowRight size={18} />
      </button>
    </div>
  )

  const renderPractice = () => {
    const isRetry = stage === 'retry'
    const firstFeedback = getAttemptFeedback(firstAttempt)
    const retryItems = firstFeedback?.retryChecklist?.length ? firstFeedback.retryChecklist : firstFeedback?.improvements

    return (
      <div className="space-y-5">
        {!isRetry && <button type="button" onClick={backToBriefing} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-700"><ArrowLeft size={16} />{t('practice.backToBriefing')}</button>}
        {isRetry && retryItems?.length > 0 && (
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-950">{t('practice.retryFocus')}</p>
            <ul className="mt-2 space-y-1.5 text-sm leading-6 text-amber-900">{retryItems.slice(0, 4).map((item) => <li key={item}>• {item}</li>)}</ul>
          </section>
        )}

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-sm font-medium text-blue-700">{t(isRetry ? 'practice.secondAttemptLabel' : 'practice.firstAttemptLabel', { index: scenarioIndex + 1 })}</p><h2 className="mt-1 text-xl font-semibold text-slate-950">{t('practice.title')}</h2></div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{t('practice.suggestedLength')}</span>
          </div>
          <div className="mt-4 rounded-lg bg-slate-50 p-4"><p className="text-sm font-medium leading-6 text-slate-950">“{scenario.guestLine}”</p></div>
          <EdgeReadAloudHint />
          {errorMessage && <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm leading-6 text-red-700"><p>{errorMessage}</p><button type="button" onClick={() => navigate('/support?category=ai_training&context=bar_server_trial&error=ai_training_error')} className="mt-2 font-semibold underline underline-offset-2">{t('practice.stillStuck')}</button></div>}

          <div className="mt-5 rounded-lg border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="font-semibold text-slate-950">{t('practice.voiceAnswer')}</p><p className="mt-1 text-xs text-slate-500">{t('practice.recordingPrivacy')}</p></div>
              {recordingStatus === 'recording' ? (
                <button type="button" onClick={stopRecording} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white"><Square size={16} />{t('practice.stop', { time: formatTime(recordingSeconds) })}</button>
              ) : (
                <button type="button" onClick={startRecording} disabled={recordingStatus === 'transcribing'} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-slate-300">
                  {recordingStatus === 'transcribing' ? <LoaderCircle size={16} className="animate-spin" /> : <Mic size={16} />}{recordingStatus === 'transcribing' ? t('practice.transcribing') : audioUrl ? t('practice.rerecord') : t('practice.record')}
                </button>
              )}
            </div>
            {audioUrl && recordingStatus !== 'recording' && <div className="mt-4"><audio src={audioUrl} controls className="w-full" /><p className="mt-1 text-xs text-slate-500">{t('practice.duration', { seconds: durationSeconds })}</p></div>}
          </div>

          <label className="mt-5 block">
            <span className="text-sm font-semibold text-slate-900">{t('practice.transcriptLabel')}</span><span className="ml-2 text-xs text-slate-500">{t('practice.transcriptHint')}</span>
            <textarea value={transcript} onChange={(event) => setTranscript(event.target.value)} rows={6} placeholder={t('practice.transcriptPlaceholder')} className="mt-3 w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </label>
        </section>

        <button type="button" onClick={submitAttempt} disabled={!transcript.trim() || recordingStatus === 'recording' || recordingStatus === 'transcribing' || isEvaluating} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">
          {isEvaluating ? <LoaderCircle size={18} className="animate-spin" /> : <Sparkles size={18} />}{isEvaluating ? t('practice.evaluating') : isRetry ? t('practice.submitRetry') : t('practice.submitFirst')}
        </button>
      </div>
    )
  }

  const renderExpertFeedback = (feedback, attempt) => (
    <div className="space-y-4">
      {(feedback.strengths?.length > 0 || feedback.improvements?.length > 0) && (
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4"><h3 className="font-semibold text-emerald-950">{t('feedback.strengths')}</h3><ul className="mt-2 space-y-1.5 text-sm leading-6 text-emerald-900">{feedback.strengths?.map((item) => <li key={item}>• {item}</li>)}</ul></div>
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-4"><h3 className="font-semibold text-amber-950">{t('feedback.improvements')}</h3><ul className="mt-2 space-y-1.5 text-sm leading-6 text-amber-900">{feedback.improvements?.map((item) => <li key={item}>• {item}</li>)}</ul></div>
        </section>
      )}

      {feedback.knowledgeNotes?.length > 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2"><Lightbulb size={18} className="text-blue-600" /><h3 className="font-semibold text-slate-950">{t('feedback.knowledge')}</h3></div>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">{feedback.knowledgeNotes.map((item) => <li key={item}>• {item}</li>)}</ul>
        </section>
      )}

      {feedback.improvedAnswer && (
        <section className="rounded-lg border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-center gap-2"><MessageSquareText size={18} className="text-blue-700" /><h3 className="font-semibold text-blue-950">{t('feedback.referenceAnswer')}</h3></div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-blue-950">{feedback.improvedAnswer}</p>
          <p className="mt-3 text-xs leading-5 text-blue-700">{t('feedback.referenceNote')}</p>
        </section>
      )}

      {feedback.usefulPhrases?.length > 0 && (
        <PhraseShadowingPractice
          position="bar_server"
          phrases={feedback.usefulPhrases}
          referenceAnswer={feedback.improvedAnswer}
          practice={attempt?.phrasePractice || {}}
          onPracticeChange={(phrasePractice) => updatePhrasePractice(attempt.attemptNumber, phrasePractice)}
        />
      )}
    </div>
  )

  const renderFeedback = () => {
    const feedback = getAttemptFeedback(firstAttempt)
    if (!feedback) return null
    const phraseRepetitions = firstAttempt?.phrasePractice?.phraseRepetitions || {}
    const hasCompletedPhrasePractice = feedback.usefulPhrases.every(
      (phrase) => Number(phraseRepetitions[phrase] || 0) >= 3,
    ) && Number(firstAttempt?.phrasePractice?.fullAnswerRepetitions || 0) >= 3
    return (
      <div className="space-y-5">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-sm font-medium text-blue-700"><Sparkles size={16} />{t('feedback.firstLabel', { index: scenarioIndex + 1 })}</p><h2 className="mt-2 text-xl font-semibold text-slate-950">{getReadinessLabel(firstScore, language)}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{feedback.comment}</p></div><div className="shrink-0 rounded-lg bg-blue-50 px-4 py-3 text-center"><p className="text-xs font-medium text-blue-700">{t('feedback.readiness')}</p><p className="mt-1 text-2xl font-bold text-blue-950">{firstScore}</p></div></div>
        </section>
        {renderExpertFeedback(feedback, firstAttempt)}
        <details className="rounded-lg border border-slate-200 bg-white p-4"><summary className="cursor-pointer text-sm font-semibold text-slate-900">{t('feedback.viewFirstTranscript')}</summary><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{firstAttempt.transcript}</p></details>
        <button type="button" onClick={() => beginAttempt(true)} disabled={!hasCompletedPhrasePractice} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">{hasCompletedPhrasePractice ? t('feedback.retry') : t('feedback.retryAfterPractice')} <RefreshCcw size={17} /></button>
        {!hasCompletedPhrasePractice && (
          <button type="button" onClick={() => beginAttempt(true)} className="inline-flex w-full items-center justify-center text-xs font-semibold text-slate-500 transition hover:text-blue-700">{t('feedback.skipShadowing')}</button>
        )}
        <button type="button" onClick={resetCurrentScenario} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><RefreshCcw size={17} />{t('feedback.restartScenario')}</button>
      </div>
    )
  }

  const renderComparison = () => {
    const feedback = getAttemptFeedback(retryAttempt)
    if (!feedback) return null
    return (
      <div className="space-y-5">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-medium text-blue-700"><BarChart3 size={16} />{t('comparison.label', { index: scenarioIndex + 1 })}</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">{getReadinessLabel(retryScore, language)}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{getScoreDeltaMessage(scoreDelta, language)}</p>
          <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3"><div className="rounded-lg bg-slate-100 p-4 text-center"><p className="text-xs text-slate-500">{t('comparison.first')}</p><p className="mt-1 text-2xl font-bold text-slate-800">{firstScore}</p></div><ArrowRight size={20} className="text-slate-400" /><div className="rounded-lg bg-blue-50 p-4 text-center"><p className="text-xs text-blue-700">{t('comparison.retry')}</p><p className="mt-1 text-2xl font-bold text-blue-950">{retryScore}</p><p className={`mt-1 text-xs font-semibold ${scoreDelta >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{scoreDelta >= 0 ? '+' : ''}{scoreDelta}</p></div></div>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5"><h3 className="font-semibold text-slate-950">{t('comparison.aiJudgment')}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{feedback.comment}</p></section>
        {feedback.improvedAnswer && (
          <PhraseShadowingPractice
            position="bar_server"
            phrases={[]}
            referenceAnswer={feedback.improvedAnswer}
            practice={retryAttempt?.phrasePractice || {}}
            onPracticeChange={(phrasePractice) => updatePhrasePractice(retryAttempt.attemptNumber, phrasePractice)}
          />
        )}

        {!allScenariosCompleted ? (
          <button type="button" onClick={goToNextScenario} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">{t('comparison.nextScenario', { index: nextIncompleteScenarioIndex + 1, total: barServerTrialScenarios.length })} <ArrowRight size={18} /></button>
        ) : trialReport && (
          <BarServerTrialCompletionReport
            report={trialReport}
            hasAccess={hasBarServerPack}
            onContinue={() => {
              trackProductEvent('free_trial_report_cta_clicked', {
                properties: {
                  readiness: trialReport.readiness,
                  passedCount: trialReport.passedCount,
                  primaryGapScenario: trialReport.primaryGap.scenarioId,
                  hasAccess: hasBarServerPack,
                },
              })
              navigate(hasBarServerPack
                ? '/programs/bar-server/foundation'
                : `/premium?source=bar-server-trial-report&gap=${encodeURIComponent(trialReport.primaryGap.scenarioId)}`)
            }}
          />
        )}

        {allScenariosCompleted && (
          <QuickFeedback context="Bar Server 免费 3 场景体验完成页" />
        )}

        <button type="button" onClick={resetCurrentScenario} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><RefreshCcw size={17} />{t('comparison.replayScenario')}</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-5 pb-7 pt-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => navigate(returnDestination.route)} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-700"><ArrowLeft size={17} />{returnDestination.label}</button>
            <LanguageSwitcher context="bar_server_trial" />
          </div>
          <div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><Wine size={24} /></div><div><p className="text-sm font-medium text-blue-700">{t('header.eyebrow')}</p><h1 className="mt-2 text-3xl font-semibold leading-tight text-slate-950">{t('header.title')}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{t('header.description')}</p></div></div>

          {assessmentContext && (
            <section className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-left">
              <div className="flex items-start gap-3">
                <Target size={19} className="mt-0.5 shrink-0 text-blue-700" />
                <div>
                  <p className="text-xs font-semibold text-blue-700">{t('assessment.eyebrow')}</p>
                  <p className="mt-1 text-sm font-semibold text-blue-950">{t('assessment.match', { gap: assessmentContext.gapLabel, scenario: initialScenario.shortTitle })}</p>
                  {(assessmentContext.concernLabel || assessmentContext.stageLabel) && <p className="mt-2 text-xs leading-5 text-blue-800">{assessmentContext.concernLabel ? t('assessment.concern', { value: assessmentContext.concernLabel }) : ''}{assessmentContext.concernLabel && assessmentContext.stageLabel ? ' · ' : ''}{assessmentContext.stageLabel ? t('assessment.stage', { value: assessmentContext.stageLabel }) : ''}</p>}
                </div>
              </div>
            </section>
          )}

          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs font-medium">
            {barServerTrialScenarios.map((item, index) => {
              const done = (attemptsByScenario[item.id] || []).length >= 2
              const active = index === scenarioIndex
              return <div key={item.id} className={`rounded-lg border px-2 py-2.5 ${done ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : active ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>{done && <CheckCircle2 size={14} className="mr-1 inline" />}{index + 1}. {item.shortTitle}</div>
            })}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            {scenario.lesson ? (
              <button type="button" onClick={() => setStage('lesson')} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 transition hover:text-blue-900">
                <BookOpen size={14} />{t('header.viewLesson')}
              </button>
            ) : <span />}
            <p className="text-right text-xs text-slate-500">{t('header.completed', { done: completedCount, total: barServerTrialScenarios.length })}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-7">
        {stage === 'lesson' && scenario.lesson && (
          <ScenarioLesson
            scenario={scenario}
            progress={lessonProgress}
            onProgressChange={setCurrentLessonProgress}
            onComplete={completeLesson}
            requiredPhraseRepetitions={1}
          />
        )}
        {stage === 'briefing' && renderBriefing()}
        {(stage === 'practice' || stage === 'retry') && renderPractice()}
        {stage === 'feedback' && renderFeedback()}
        {stage === 'comparison' && renderComparison()}
      </main>
    </div>
  )
}
