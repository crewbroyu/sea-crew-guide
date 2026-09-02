import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Lightbulb,
  LoaderCircle,
  LockKeyhole,
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
import ScenarioLesson from '../../components/interview/ScenarioLesson'
import { evaluateInterviewWithAi, transcribeInterviewAudio } from '../../services/interviewAiService'
import { saveInterviewPracticeRecord } from '../../services/interviewPracticeService'
import { trackProductEvent } from '../../services/productAnalyticsService'
import {
  BAR_SERVER_TRIAL_STORAGE_KEY,
  BAR_SERVER_TRIAL_VERSION,
  barServerTrialScenarios,
  getReadinessLabel,
  getScoreDeltaMessage,
} from '../../data/barServerTrial'

const readTrial = () => {
  try {
    const value = localStorage.getItem(BAR_SERVER_TRIAL_STORAGE_KEY)
    const parsed = value ? JSON.parse(value) : null
    return parsed?.version === BAR_SERVER_TRIAL_VERSION ? parsed : null
  } catch (error) {
    console.warn('Unable to read Bar Server trial:', error)
    return null
  }
}

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

export default function BarServerTrial() {
  const navigate = useNavigate()
  const access = useEffectiveAccess()
  const { isRegistered, openRegisterModal } = access
  const hasBarServerPack = hasProductEntitlement(access, 'bar_server_pack')
  const savedTrial = useMemo(() => readTrial(), [])
  const initialScenarioIndex = savedTrial?.scenarioIndex || 0
  const initialScenario = barServerTrialScenarios[initialScenarioIndex]
  const [scenarioIndex, setScenarioIndex] = useState(initialScenarioIndex)
  const [stage, setStage] = useState(savedTrial?.stage || (initialScenario?.lesson ? 'lesson' : 'briefing'))
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
  const isLastScenario = scenarioIndex === barServerTrialScenarios.length - 1
  const completedScores = barServerTrialScenarios
    .map((item) => getAttemptScore((attemptsByScenario[item.id] || [])[1]))
    .filter((score) => score > 0)
  const overallReadiness = completedScores.length
    ? Math.round(completedScores.reduce((sum, score) => sum + score, 0) / completedScores.length)
    : 0

  useEffect(() => {
    trackProductEvent('free_trial_viewed', { properties: { scenarioIndex: initialScenarioIndex + 1 } })
  }, [initialScenarioIndex])

  useEffect(() => {
    if (stage !== 'comparison' || !isLastScenario || !retryAttempt) return
    const eventKey = `bar_server_trial_completed_${retryAttempt.completedAt}`
    if (sessionStorage.getItem(eventKey)) return
    sessionStorage.setItem(eventKey, 'true')
    trackProductEvent('free_trial_completed', {
      properties: { readiness: overallReadiness, hasAccess: hasBarServerPack },
    })
    if (!hasBarServerPack) {
      trackProductEvent('paywall_reached', { properties: { readiness: overallReadiness } })
    }
  }, [hasBarServerPack, isLastScenario, overallReadiness, retryAttempt, stage])

  useEffect(() => {
    localStorage.setItem(BAR_SERVER_TRIAL_STORAGE_KEY, JSON.stringify({
      version: BAR_SERVER_TRIAL_VERSION,
      scenarioIndex,
      stage,
      attemptsByScenario,
      lessonProgressByScenario,
      updatedAt: new Date().toISOString(),
    }))
  }, [attemptsByScenario, lessonProgressByScenario, scenarioIndex, stage])

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
      setErrorMessage('登录后可免费完成 3 个场景的语音转写、AI 反馈和重练。')
      openRegisterModal()
      return
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setErrorMessage('当前浏览器不支持录音，可以在下方直接输入英文回答。')
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
          })
          setTranscript(result.transcript)
          setRecordingStatus('ready')
        } catch (error) {
          console.error('Bar Server trial transcription failed:', error)
          setRecordingStatus('ready')
          setErrorMessage(error.message || '语音转写失败，请重录或手动输入。')
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
      setErrorMessage('无法打开麦克风，请检查浏览器权限，或先使用文字回答。')
      setRecordingStatus('idle')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
  }

  const submitAttempt = async () => {
    const normalizedTranscript = transcript.trim()
    if (!normalizedTranscript) {
      setErrorMessage('请先录音，或在文本框中输入你的英文回答。')
      return
    }
    if (!isRegistered) {
      setErrorMessage('登录后可免费生成完整的专业 AI 反馈。')
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
      setErrorMessage(error.message || 'AI 反馈生成失败，请稍后重试。')
      if (error.code === 'LOGIN_REQUIRED') openRegisterModal()
    } finally {
      setIsEvaluating(false)
    }
  }

  const goToNextScenario = () => {
    if (isLastScenario) return
    clearCurrentRecording()
    const nextIndex = scenarioIndex + 1
    setScenarioIndex(nextIndex)
    setStage(barServerTrialScenarios[nextIndex]?.lesson ? 'lesson' : 'briefing')
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
            {isLessonComplete ? '基础学习已完成' : '先完成基础学习，再进入独立回答'}
          </div>
          <button type="button" onClick={() => setStage('lesson')} className={`shrink-0 text-xs font-semibold transition ${isLessonComplete ? 'text-emerald-700 hover:text-emerald-900' : 'text-amber-800 hover:text-amber-950'}`}>
            {isLessonComplete ? '重新查看' : '开始学习'}
          </button>
        </div>
      )}
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-blue-700">免费场景 {scenarioIndex + 1}/{barServerTrialScenarios.length} · {scenario.category}</p>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">完整反馈</span>
        </div>
        <h2 className="mt-3 text-xl font-semibold text-slate-950">{scenario.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{scenario.setting}</p>
        <div className="mt-5 border-l-4 border-blue-500 bg-blue-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase text-blue-700">Guest</p>
          <p className="mt-1 text-base font-medium leading-7 text-blue-950">“{scenario.guestLine}”</p>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-700">{scenario.task}</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2"><Target size={18} className="text-blue-600" /><h3 className="font-semibold text-slate-950">岗位动作</h3></div>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">{scenario.checkpoints.map((item) => <li key={item}>• {item}</li>)}</ul>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2"><Clock3 size={18} className="text-amber-600" /><h3 className="font-semibold text-slate-950">避免踩坑</h3></div>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">{scenario.watchOuts.map((item) => <li key={item}>• {item}</li>)}</ul>
        </div>
      </section>

      <button type="button" onClick={() => (isLessonComplete ? beginAttempt(false) : setStage('lesson'))} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
        {isLessonComplete ? `开始第 ${scenarioIndex + 1} 个场景回答` : '先完成基础学习'} <ArrowRight size={18} />
      </button>
    </div>
  )

  const renderPractice = () => {
    const isRetry = stage === 'retry'
    const firstFeedback = getAttemptFeedback(firstAttempt)
    const retryItems = firstFeedback?.retryChecklist?.length ? firstFeedback.retryChecklist : firstFeedback?.improvements

    return (
      <div className="space-y-5">
        {!isRetry && <button type="button" onClick={backToBriefing} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-700"><ArrowLeft size={16} />返回场景说明</button>}
        {isRetry && retryItems?.length > 0 && (
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-950">第二次回答只改这些动作</p>
            <ul className="mt-2 space-y-1.5 text-sm leading-6 text-amber-900">{retryItems.slice(0, 4).map((item) => <li key={item}>• {item}</li>)}</ul>
          </section>
        )}

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-sm font-medium text-blue-700">场景 {scenarioIndex + 1} · {isRetry ? '第 2 次回答' : '第 1 次回答'}</p><h2 className="mt-1 text-xl font-semibold text-slate-950">现在直接回应客人</h2></div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">建议 30-60 秒</span>
          </div>
          <div className="mt-4 rounded-lg bg-slate-50 p-4"><p className="text-sm font-medium leading-6 text-slate-950">“{scenario.guestLine}”</p></div>
          {errorMessage && <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm leading-6 text-red-700">{errorMessage}</div>}

          <div className="mt-5 rounded-lg border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="font-semibold text-slate-950">语音回答</p><p className="mt-1 text-xs text-slate-500">录音只用于本次转写，不会作为音频长期保存。</p></div>
              {recordingStatus === 'recording' ? (
                <button type="button" onClick={stopRecording} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white"><Square size={16} />停止 {formatTime(recordingSeconds)}</button>
              ) : (
                <button type="button" onClick={startRecording} disabled={recordingStatus === 'transcribing'} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-slate-300">
                  {recordingStatus === 'transcribing' ? <LoaderCircle size={16} className="animate-spin" /> : <Mic size={16} />}{recordingStatus === 'transcribing' ? 'AI 正在转写' : audioUrl ? '重新录音' : '开始录音'}
                </button>
              )}
            </div>
            {audioUrl && recordingStatus !== 'recording' && <div className="mt-4"><audio src={audioUrl} controls className="w-full" /><p className="mt-1 text-xs text-slate-500">录音时长 {durationSeconds} 秒</p></div>}
          </div>

          <label className="mt-5 block">
            <span className="text-sm font-semibold text-slate-900">AI 转写文本</span><span className="ml-2 text-xs text-slate-500">提交前可以修正识别错误</span>
            <textarea value={transcript} onChange={(event) => setTranscript(event.target.value)} rows={6} placeholder="录音后会自动显示英文转写；也可以直接输入你的英文回答。" className="mt-3 w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </label>
        </section>

        <button type="button" onClick={submitAttempt} disabled={!transcript.trim() || recordingStatus === 'recording' || recordingStatus === 'transcribing' || isEvaluating} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">
          {isEvaluating ? <LoaderCircle size={18} className="animate-spin" /> : <Sparkles size={18} />}{isEvaluating ? 'AI 正在结合岗位知识分析...' : isRetry ? '提交重练并比较' : '获取完整 AI 反馈'}
        </button>
      </div>
    )
  }

  const renderExpertFeedback = (feedback, attempt) => (
    <div className="space-y-4">
      {(feedback.strengths?.length > 0 || feedback.improvements?.length > 0) && (
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4"><h3 className="font-semibold text-emerald-950">具体做对了什么</h3><ul className="mt-2 space-y-1.5 text-sm leading-6 text-emerald-900">{feedback.strengths?.map((item) => <li key={item}>• {item}</li>)}</ul></div>
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-4"><h3 className="font-semibold text-amber-950">回答缺少什么</h3><ul className="mt-2 space-y-1.5 text-sm leading-6 text-amber-900">{feedback.improvements?.map((item) => <li key={item}>• {item}</li>)}</ul></div>
        </section>
      )}

      {feedback.knowledgeNotes?.length > 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2"><Lightbulb size={18} className="text-blue-600" /><h3 className="font-semibold text-slate-950">这个场景需要知道的岗位知识</h3></div>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">{feedback.knowledgeNotes.map((item) => <li key={item}>• {item}</li>)}</ul>
        </section>
      )}

      {feedback.improvedAnswer && (
        <section className="rounded-lg border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-center gap-2"><MessageSquareText size={18} className="text-blue-700" /><h3 className="font-semibold text-blue-950">专业参考回答</h3></div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-blue-950">{feedback.improvedAnswer}</p>
          <p className="mt-3 text-xs leading-5 text-blue-700">参考回答用于理解服务顺序，不建议逐字背诵。</p>
        </section>
      )}

      {feedback.usefulPhrases?.length > 0 && (
        <PhraseShadowingPractice
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
          <div className="flex items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-sm font-medium text-blue-700"><Sparkles size={16} />场景 {scenarioIndex + 1} · 第一次专业反馈</p><h2 className="mt-2 text-xl font-semibold text-slate-950">{getReadinessLabel(firstScore)}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{feedback.comment}</p></div><div className="shrink-0 rounded-lg bg-blue-50 px-4 py-3 text-center"><p className="text-xs font-medium text-blue-700">准备度</p><p className="mt-1 text-2xl font-bold text-blue-950">{firstScore}</p></div></div>
        </section>
        {renderExpertFeedback(feedback, firstAttempt)}
        <details className="rounded-lg border border-slate-200 bg-white p-4"><summary className="cursor-pointer text-sm font-semibold text-slate-900">查看第一次回答文本</summary><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{firstAttempt.transcript}</p></details>
        <button type="button" onClick={() => beginAttempt(true)} disabled={!hasCompletedPhrasePractice} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">{hasCompletedPhrasePractice ? '根据反馈再答一次' : '完成表达训练后再答一次'} <RefreshCcw size={17} /></button>
        {!hasCompletedPhrasePractice && (
          <button type="button" onClick={() => beginAttempt(true)} className="inline-flex w-full items-center justify-center text-xs font-semibold text-slate-500 transition hover:text-blue-700">暂时跳过跟读，直接重答</button>
        )}
        <button type="button" onClick={resetCurrentScenario} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><RefreshCcw size={17} />重新开始本场景</button>
      </div>
    )
  }

  const renderComparison = () => {
    const feedback = getAttemptFeedback(retryAttempt)
    if (!feedback) return null
    return (
      <div className="space-y-5">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-medium text-blue-700"><BarChart3 size={16} />场景 {scenarioIndex + 1} · 重练结果</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">{getReadinessLabel(retryScore)}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{getScoreDeltaMessage(scoreDelta)}</p>
          <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3"><div className="rounded-lg bg-slate-100 p-4 text-center"><p className="text-xs text-slate-500">第一次</p><p className="mt-1 text-2xl font-bold text-slate-800">{firstScore}</p></div><ArrowRight size={20} className="text-slate-400" /><div className="rounded-lg bg-blue-50 p-4 text-center"><p className="text-xs text-blue-700">重练后</p><p className="mt-1 text-2xl font-bold text-blue-950">{retryScore}</p><p className={`mt-1 text-xs font-semibold ${scoreDelta >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{scoreDelta >= 0 ? '+' : ''}{scoreDelta}</p></div></div>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5"><h3 className="font-semibold text-slate-950">AI 对第二次回答的判断</h3><p className="mt-2 text-sm leading-6 text-slate-600">{feedback.comment}</p></section>
        {feedback.improvedAnswer && (
          <PhraseShadowingPractice
            phrases={[]}
            referenceAnswer={feedback.improvedAnswer}
            practice={retryAttempt?.phrasePractice || {}}
            onPracticeChange={(phrasePractice) => updatePhrasePractice(retryAttempt.attemptNumber, phrasePractice)}
          />
        )}

        {!isLastScenario ? (
          <button type="button" onClick={goToNextScenario} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">进入免费场景 {scenarioIndex + 2}/{barServerTrialScenarios.length} <ArrowRight size={18} /></button>
        ) : hasBarServerPack ? (
          <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-start gap-3"><CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-700" /><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-emerald-700">Bar Server 单职位全流程包已解锁</p><h2 className="mt-1 font-semibold text-emerald-950">免费体验完成，继续进入完整准备路径</h2><p className="mt-2 text-sm leading-6 text-emerald-900">按“基础知识 → 答案结构 → 岗位题库 → AI模拟”的顺序继续，训练记录会进入你的申请档案。</p><div className="mt-4 grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => navigate('/tasks/phase2/Task5')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800">继续岗位基础课 <ChevronRight size={16} /></button><button type="button" onClick={() => navigate('/tasks/phase2/Task7/voice?position=bar_server')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100">进入岗位题库 <ChevronRight size={16} /></button></div></div></div>
          </section>
        ) : (
          <section className="rounded-lg border border-blue-200 bg-blue-50 p-5">
            <div className="flex items-start gap-3"><LockKeyhole size={20} className="mt-0.5 shrink-0 text-blue-700" /><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-blue-700">3 个免费场景已完整完成</p><h2 className="mt-1 font-semibold text-blue-950">当前 Bar Server 场景准备度：{overallReadiness}/100</h2><p className="mt-2 text-sm leading-6 text-blue-900">你已经体验了销售推荐、客诉补救和安全拒酒。后续完整训练将覆盖更多工作场景、岗位知识、高频面试题、完整模拟面试和最终准备度报告。</p><button type="button" onClick={() => navigate('/premium?source=bar-server-trial')} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-800">解锁完整 Bar Server 训练 <ChevronRight size={16} /></button></div></div>
          </section>
        )}

        <button type="button" onClick={resetCurrentScenario} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><RefreshCcw size={17} />重新体验本场景</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-5 pb-7 pt-10">
          <button type="button" onClick={() => navigate('/jobs')} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-700"><ArrowLeft size={17} />返回求职中心</button>
          <div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><Wine size={24} /></div><div><p className="text-sm font-medium text-blue-700">Bar Server 面试准备训练</p><h1 className="mt-2 text-3xl font-semibold leading-tight text-slate-950">免费完成 3 个真实场景，再决定是否继续</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">每个免费场景都包含语音回答、岗位知识反馈、专业参考答案、针对性重练和前后对比，不用残缺体验催你付费。</p></div></div>

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
                <BookOpen size={14} />查看场景课程
              </button>
            ) : <span />}
            <p className="text-right text-xs text-slate-500">已完成 {completedCount}/{barServerTrialScenarios.length} 个完整场景</p>
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
