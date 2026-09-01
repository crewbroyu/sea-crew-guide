import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Headphones,
  LoaderCircle,
  LockKeyhole,
  Mic,
  RefreshCcw,
  Sparkles,
  Square,
  Target,
  Wine,
} from 'lucide-react'
import useEffectiveAccess from '../../hooks/useEffectiveAccess'
import {
  evaluateInterviewWithAi,
  transcribeInterviewAudio,
} from '../../services/interviewAiService'
import { saveInterviewPracticeRecord } from '../../services/interviewPracticeService'
import {
  BAR_SERVER_TRIAL_STORAGE_KEY,
  BAR_SERVER_TRIAL_VERSION,
  barServerTrialScenario,
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

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

const getAttemptFeedback = (attempt) => attempt?.evaluation?.questionScores?.[0] || null

const buildSavedAttempt = ({ transcript, durationSeconds, evaluation, attemptNumber }) => ({
  attemptNumber,
  transcript,
  durationSeconds,
  evaluation,
  completedAt: new Date().toISOString(),
})

export default function BarServerTrial() {
  const navigate = useNavigate()
  const { isRegistered, openRegisterModal } = useEffectiveAccess()
  const savedTrial = useMemo(() => readTrial(), [])
  const [stage, setStage] = useState(savedTrial?.stage || 'briefing')
  const [attempts, setAttempts] = useState(savedTrial?.attempts || [])
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
  const timerRef = useRef(null)
  const recordingSecondsRef = useRef(0)

  const currentAttemptNumber = Math.min(attempts.length + 1, 2)
  const firstAttempt = attempts[0]
  const retryAttempt = attempts[1]
  const latestAttempt = retryAttempt || firstAttempt
  const firstScore = firstAttempt?.evaluation?.overallScore || 0
  const retryScore = retryAttempt?.evaluation?.overallScore || 0
  const scoreDelta = retryAttempt ? retryScore - firstScore : 0

  useEffect(() => {
    localStorage.setItem(BAR_SERVER_TRIAL_STORAGE_KEY, JSON.stringify({
      version: BAR_SERVER_TRIAL_VERSION,
      stage,
      attempts,
      updatedAt: new Date().toISOString(),
    }))
  }, [attempts, stage])

  useEffect(() => () => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    if (audioUrl) URL.revokeObjectURL(audioUrl)
  }, [audioUrl])

  const clearCurrentRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl('')
    audioBlobRef.current = null
    setTranscript('')
    setDurationSeconds(0)
    setRecordingSeconds(0)
    recordingSecondsRef.current = 0
    setRecordingStatus('idle')
    setErrorMessage('')
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
      setErrorMessage('登录后可免费完成本场景的语音转写和 AI 反馈，当前页面不会丢失。')
      openRegisterModal()
      return
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setErrorMessage('当前浏览器不支持录音，可以在下方直接输入英文回答。')
      return
    }

    try {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      audioChunksRef.current = []
      recordingSecondsRef.current = 0
      setRecordingSeconds(0)
      setTranscript('')

      const mimeType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
      ].find((type) => MediaRecorder.isTypeSupported?.(type))
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

        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || mimeType || 'audio/webm',
        })
        const nextAudioUrl = URL.createObjectURL(blob)
        audioBlobRef.current = blob
        setAudioUrl(nextAudioUrl)
        setDurationSeconds(Math.max(1, recordingSecondsRef.current))
        setRecordingStatus('transcribing')

        try {
          const result = await transcribeInterviewAudio(blob, {
            mode: 'practice',
            position: 'Bar Server',
            question: barServerTrialScenario.interviewerQuestion,
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
      setErrorMessage('登录后可免费生成本场景的 AI 反馈。')
      openRegisterModal()
      return
    }

    setIsEvaluating(true)
    setErrorMessage('')
    const attemptNumber = currentAttemptNumber

    try {
      const evaluation = await evaluateInterviewWithAi({
        mode: 'practice',
        position: 'Bar Server',
        questions: [{
          id: barServerTrialScenario.id,
          question: barServerTrialScenario.interviewerQuestion,
          focus: barServerTrialScenario.focus,
          keywords: barServerTrialScenario.keywords,
        }],
        answers: [{
          questionId: barServerTrialScenario.id,
          textAnswer: normalizedTranscript,
          durationSeconds,
        }],
      })
      const savedAttempt = buildSavedAttempt({
        transcript: normalizedTranscript,
        durationSeconds,
        evaluation,
        attemptNumber,
      })
      const nextAttempts = attemptNumber === 1
        ? [savedAttempt]
        : [attempts[0], savedAttempt]

      setAttempts(nextAttempts)
      setStage(attemptNumber === 1 ? 'feedback' : 'comparison')

      try {
        await saveInterviewPracticeRecord({
          targetPosition: 'bar_server',
          interviewerName: 'Bar Server Free Scenario',
          questions: [{
            id: barServerTrialScenario.id,
            question: barServerTrialScenario.interviewerQuestion,
            focus: barServerTrialScenario.focus,
            keywords: barServerTrialScenario.keywords,
          }],
          answers: [{
            questionId: barServerTrialScenario.id,
            textAnswer: normalizedTranscript,
            durationSeconds,
            hasRecording: Boolean(audioBlobRef.current),
            answeredAt: savedAttempt.completedAt,
          }],
          evaluation,
          source: attemptNumber === 1 ? 'bar_server_trial_initial' : 'bar_server_trial_retry',
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

  const resetTrial = () => {
    clearCurrentRecording()
    setAttempts([])
    setStage('briefing')
  }

  const renderBriefing = () => (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-blue-700">免费完整试练 · 场景 1</p>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">无需激活</span>
        </div>
        <h2 className="mt-3 text-xl font-semibold text-slate-950">{barServerTrialScenario.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{barServerTrialScenario.setting}</p>

        <div className="mt-5 border-l-4 border-blue-500 bg-blue-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase text-blue-700">Guest</p>
          <p className="mt-1 text-base font-medium leading-7 text-blue-950">“{barServerTrialScenario.guestLine}”</p>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-700">{barServerTrialScenario.task}</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-950">
            <Target size={18} className="text-blue-600" />
            <h3 className="font-semibold">这次重点检查</h3>
          </div>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            {barServerTrialScenario.checkpoints.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-950">
            <Clock3 size={18} className="text-amber-600" />
            <h3 className="font-semibold">训练规则</h3>
          </div>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            <li>• 第一次先按真实水平回答</li>
            <li>• AI 给出证据化反馈和改进动作</li>
            <li>• 第二次只针对反馈重练</li>
            <li>• 最后比较两次准备度变化</li>
          </ul>
        </div>
      </section>

      <button
        type="button"
        onClick={() => beginAttempt(false)}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        开始第一次回答
        <ArrowRight size={18} />
      </button>
    </div>
  )

  const renderPractice = () => {
    const isRetry = stage === 'retry'
    const firstFeedback = getAttemptFeedback(firstAttempt)

    return (
      <div className="space-y-5">
        {!isRetry && (
          <button
            type="button"
            onClick={backToBriefing}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-700"
          >
            <ArrowLeft size={16} />
            返回场景说明
          </button>
        )}

        {isRetry && firstFeedback && (
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-950">这次只改三个重点</p>
            <ul className="mt-2 space-y-1.5 text-sm leading-6 text-amber-900">
              {firstFeedback.improvements?.slice(0, 3).map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </section>
        )}

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-blue-700">{isRetry ? '第 2 次回答 · 针对反馈重练' : '第 1 次回答 · 建立基线'}</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">现在直接回应客人</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">建议 30-60 秒</span>
          </div>

          <div className="mt-4 rounded-lg bg-slate-50 p-4">
            <p className="text-sm font-medium leading-6 text-slate-950">“{barServerTrialScenario.guestLine}”</p>
          </div>

          {errorMessage && (
            <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm leading-6 text-red-700">{errorMessage}</div>
          )}

          <div className="mt-5 rounded-lg border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-950">语音回答</p>
                <p className="mt-1 text-xs text-slate-500">录音只用于本次转写，不会作为音频长期保存。</p>
              </div>
              {recordingStatus === 'recording' ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <Square size={16} />
                  停止 {formatTime(recordingSeconds)}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={recordingStatus === 'transcribing'}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-slate-300"
                >
                  {recordingStatus === 'transcribing' ? <LoaderCircle size={16} className="animate-spin" /> : <Mic size={16} />}
                  {recordingStatus === 'transcribing' ? 'AI 正在转写' : audioUrl ? '重新录音' : '开始录音'}
                </button>
              )}
            </div>

            {audioUrl && recordingStatus !== 'recording' && (
              <div className="mt-4">
                <audio src={audioUrl} controls className="w-full" />
                <p className="mt-1 text-xs text-slate-500">录音时长 {durationSeconds} 秒</p>
              </div>
            )}
          </div>

          <label className="mt-5 block">
            <span className="text-sm font-semibold text-slate-900">AI 转写文本</span>
            <span className="ml-2 text-xs text-slate-500">提交前可以修正识别错误</span>
            <textarea
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              rows={6}
              placeholder="录音后会自动显示英文转写；也可以直接输入你的英文回答。"
              className="mt-3 w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </section>

        <button
          type="button"
          onClick={submitAttempt}
          disabled={!transcript.trim() || recordingStatus === 'recording' || recordingStatus === 'transcribing' || isEvaluating}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isEvaluating ? <LoaderCircle size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {isEvaluating ? 'AI 正在分析回答...' : isRetry ? '提交重练并比较' : '获取第一次 AI 反馈'}
        </button>
      </div>
    )
  }

  const renderFeedback = () => {
    const feedback = getAttemptFeedback(firstAttempt)
    if (!feedback) return null

    return (
      <div className="space-y-5">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-blue-700"><Sparkles size={16} />第一次 AI 反馈</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">{getReadinessLabel(firstScore)}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{feedback.comment}</p>
            </div>
            <div className="shrink-0 rounded-lg bg-blue-50 px-4 py-3 text-center">
              <p className="text-xs font-medium text-blue-700">准备度</p>
              <p className="mt-1 text-2xl font-bold text-blue-950">{firstScore}</p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold text-amber-950">第二次回答只改这些</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-900">
            {feedback.improvements?.length
              ? feedback.improvements.slice(0, 3).map((item) => <li key={item}>• {item}</li>)
              : <li>• 增加具体饮品推荐、口味理由和确认客人选择的收尾。</li>}
          </ul>
        </section>

        <details className="rounded-lg border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-900">查看第一次回答文本</summary>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{firstAttempt.transcript}</p>
        </details>

        <button
          type="button"
          onClick={() => beginAttempt(true)}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          根据反馈再答一次
          <RefreshCcw size={17} />
        </button>
      </div>
    )
  }

  const renderComparison = () => {
    const feedback = getAttemptFeedback(retryAttempt)
    if (!feedback) return null

    return (
      <div className="space-y-5">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-medium text-blue-700"><BarChart3 size={16} />重练结果</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">{getReadinessLabel(retryScore)}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{getScoreDeltaMessage(scoreDelta)}</p>

          <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="rounded-lg bg-slate-100 p-4 text-center">
              <p className="text-xs text-slate-500">第一次</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">{firstScore}</p>
            </div>
            <ArrowRight size={20} className="text-slate-400" />
            <div className="rounded-lg bg-blue-50 p-4 text-center">
              <p className="text-xs text-blue-700">重练后</p>
              <p className="mt-1 text-2xl font-bold text-blue-950">{retryScore}</p>
              <p className={`mt-1 text-xs font-semibold ${scoreDelta >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {scoreDelta >= 0 ? '+' : ''}{scoreDelta}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-950">AI 对第二次回答的判断</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{feedback.comment}</p>
          {feedback.improvements?.length > 0 && (
            <div className="mt-4 border-l-4 border-amber-400 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-950">下一轮优先强化</p>
              <ul className="mt-1 space-y-1 text-sm leading-6 text-amber-900">
                {feedback.improvements.slice(0, 2).map((item) => <li key={item}>• {item}</li>)}
              </ul>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <LockKeyhole size={20} className="mt-0.5 shrink-0 text-blue-700" />
            <div>
              <p className="text-xs font-semibold text-blue-700">完整岗位训练</p>
              <h2 className="mt-1 font-semibold text-blue-950">继续练到具备 Bar Server 面试准备状态</h2>
              <p className="mt-2 text-sm leading-6 text-blue-900">
                完整训练将覆盖真实工作场景、岗位知识、场景英语、高频面试题、AI 语音反馈、完整模拟面试和最终准备度报告。
              </p>
              <button
                type="button"
                onClick={() => navigate('/premium?source=bar-server-trial')}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-800"
              >
                查看完整训练权益
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>

        <button
          type="button"
          onClick={resetTrial}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCcw size={17} />
          重新体验本场景
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-5 pb-7 pt-10">
          <button
            type="button"
            onClick={() => navigate('/jobs')}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-700"
          >
            <ArrowLeft size={17} />
            返回求职中心
          </button>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Wine size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700">Bar Server 面试准备训练</p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight text-slate-950">先完成一次真实回答，再看自己缺什么</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                这不是题库浏览页。你会完成一次语音回答、获得 AI 反馈、根据建议重练，并看到两次表现是否真正发生变化。
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs font-medium">
            {[
              { label: '回答', done: attempts.length >= 1, active: stage === 'practice' },
              { label: 'AI 反馈', done: attempts.length >= 1, active: stage === 'feedback' },
              { label: '重练对比', done: attempts.length >= 2, active: stage === 'retry' || stage === 'comparison' },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-lg border px-2 py-2.5 ${
                  item.done
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : item.active
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-slate-50 text-slate-500'
                }`}
              >
                {item.done && <CheckCircle2 size={14} className="mr-1 inline" />}
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-7">
        {stage === 'briefing' && renderBriefing()}
        {(stage === 'practice' || stage === 'retry') && renderPractice()}
        {stage === 'feedback' && renderFeedback()}
        {stage === 'comparison' && renderComparison()}

        {latestAttempt && stage !== 'comparison' && stage !== 'feedback' && (
          <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
            <Headphones size={14} />
            上次准备度 {latestAttempt.evaluation?.overallScore || 0}，当前训练状态已自动保存在本机。
          </div>
        )}
      </main>
    </div>
  )
}
