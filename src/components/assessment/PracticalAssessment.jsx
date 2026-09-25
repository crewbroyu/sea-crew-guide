import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  LockKeyhole,
  Mic,
  Square,
  Volume2,
} from 'lucide-react'
import { useAccessStore } from '../../store/accessStore'
import {
  evaluatePracticalAssessment,
  generateAssessmentFollowUp,
  transcribeInterviewAudio,
} from '../../services/interviewAiService'
import {
  ENGLISH_PRACTICAL_TASKS,
  getStarPracticalTask,
  STAR_FALLBACK_FOLLOW_UPS,
} from '../../data/practicalAssessmentData'

const supportedMimeType = () => [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
].find((type) => MediaRecorder.isTypeSupported?.(type))

const stopStream = (stream) => stream?.getTracks?.().forEach((track) => track.stop())

const formatSeconds = (seconds) => `0:${String(Math.max(0, seconds)).padStart(2, '0')}`

export default function PracticalAssessment({ serviceBackground, onComplete }) {
  const { authChecked, isCheckingAuth, isRegistered, openLoginModal } = useAccessStore()
  const initialTasks = [
    ...ENGLISH_PRACTICAL_TASKS,
    getStarPracticalTask(serviceBackground),
    ...STAR_FALLBACK_FOLLOW_UPS,
  ]
  const [tasks, setTasks] = useState(initialTasks)
  const [taskIndex, setTaskIndex] = useState(0)
  const [phase, setPhase] = useState('intro')
  const [preparationLeft, setPreparationLeft] = useState(0)
  const [recordingElapsed, setRecordingElapsed] = useState(0)
  const [testAudioUrl, setTestAudioUrl] = useState('')
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [message, setMessage] = useState('')
  const [technicalRetries, setTechnicalRetries] = useState({})

  const tasksRef = useRef(initialTasks)
  const answersRef = useRef([])
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const recordingStartedAtRef = useRef(0)
  const intervalRef = useRef(null)
  const timeoutRef = useRef(null)
  const testAudioUrlRef = useRef('')
  const technicalRetriesRef = useRef({})

  const currentTask = tasks[taskIndex]
  const isEvaluationPhase = ['evaluating', 'evaluation_error'].includes(phase)

  const clearTimers = () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current)
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    intervalRef.current = null
    timeoutRef.current = null
  }

  useEffect(() => () => {
    clearTimers()
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.ondataavailable = null
      recorderRef.current.onstop = null
      recorderRef.current.stop()
    }
    stopStream(streamRef.current)
    if (testAudioUrlRef.current) URL.revokeObjectURL(testAudioUrlRef.current)
  }, [])

  const updateTasks = (nextTasks) => {
    tasksRef.current = nextTasks
    setTasks(nextTasks)
  }

  const startRecorder = async ({ test = false, task = null } = {}) => {
    setMessage('')
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setMessage('当前浏览器不支持录音，请使用最新版 Edge、Chrome 或 Safari。')
      setPhase(test ? 'intro' : 'technical_error')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = supportedMimeType()
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 32000,
      })
      const startedAt = Date.now()
      const maxSeconds = test ? 4 : task.recordingSeconds

      streamRef.current = stream
      recorderRef.current = recorder
      chunksRef.current = []
      recordingStartedAtRef.current = startedAt
      setRecordingElapsed(0)
      setPhase(test ? 'mic_recording' : 'recording')

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) chunksRef.current.push(event.data)
      }

      recorder.onstop = async () => {
        clearTimers()
        const durationSeconds = Math.max(1, Math.min(
          maxSeconds,
          Math.round((Date.now() - recordingStartedAtRef.current) / 1000),
        ))
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || mimeType || 'audio/webm',
        })
        stopStream(stream)
        streamRef.current = null
        recorderRef.current = null

        if (test) {
          if (testAudioUrlRef.current) URL.revokeObjectURL(testAudioUrlRef.current)
          const nextUrl = URL.createObjectURL(blob)
          testAudioUrlRef.current = nextUrl
          setTestAudioUrl(nextUrl)
          setPhase('mic_ready')
          return
        }

        setPhase('transcribing')
        try {
          const transcription = await transcribeInterviewAudio(blob, {
            mode: 'assessment',
            position: 'Cruise career assessment',
            question: task.prompt,
            scenarioId: task.id,
            durationSeconds,
          })
          const answer = {
            id: task.id,
            category: task.category,
            question: task.prompt,
            answer: transcription.transcript,
            durationSeconds,
            technicalRetries: technicalRetriesRef.current[task.id] || 0,
            startedAt: new Date(startedAt).toISOString(),
            completedAt: new Date().toISOString(),
          }
          answersRef.current = [...answersRef.current, answer]
          setCurrentTranscript(transcription.transcript)
          setPhase('review')
        } catch (error) {
          console.error('Practical assessment transcription failed:', error)
          if (error.code === 'LOGIN_REQUIRED') openLoginModal()
          setMessage(error.message || '录音转写失败，请进行一次技术重试。')
          setPhase('technical_error')
        }
      }

      recorder.start()
      intervalRef.current = window.setInterval(() => {
        const elapsed = Math.min(maxSeconds, Math.floor((Date.now() - startedAt) / 1000))
        setRecordingElapsed(elapsed)
      }, 250)
      timeoutRef.current = window.setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop()
      }, maxSeconds * 1000)
    } catch (error) {
      console.error('Practical assessment microphone failed:', error)
      stopStream(streamRef.current)
      streamRef.current = null
      setMessage('无法打开麦克风。请检查浏览器权限和系统输入设备后重试。')
      setPhase(test ? 'intro' : 'technical_error')
    }
  }

  const beginPreparation = (index) => {
    clearTimers()
    const task = tasksRef.current[index]
    const startedAt = Date.now()
    setTaskIndex(index)
    setCurrentTranscript('')
    setMessage('')
    setPreparationLeft(task.preparationSeconds)
    setPhase('preparing')

    intervalRef.current = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000)
      setPreparationLeft(Math.max(0, task.preparationSeconds - elapsed))
    }, 250)
    timeoutRef.current = window.setTimeout(() => {
      clearTimers()
      startRecorder({ task })
    }, task.preparationSeconds * 1000)
  }

  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording' && recordingElapsed >= 5) {
      recorderRef.current.stop()
    }
  }

  const handleTechnicalRetry = () => {
    const retryCount = technicalRetries[currentTask.id] || 0
    if (retryCount >= 1) {
      setMessage('本题技术重试次数已用完。请检查设备后重新开始整份实战验证。')
      return
    }
    const nextRetries = { ...technicalRetriesRef.current, [currentTask.id]: retryCount + 1 }
    technicalRetriesRef.current = nextRetries
    setTechnicalRetries(nextRetries)
    beginPreparation(taskIndex)
  }

  const replaceFollowUp = async (nextIndex, followUpIndex) => {
    const fallback = STAR_FALLBACK_FOLLOW_UPS[followUpIndex - 1]
    try {
      const history = answersRef.current
        .filter((answer) => answer.category === 'star')
        .map((answer) => ({
          question: answer.question,
          answer: answer.answer,
          durationSeconds: answer.durationSeconds,
        }))
      const generated = await generateAssessmentFollowUp({
        serviceBackground,
        history,
        followUpIndex,
      })
      const nextTasks = [...tasksRef.current]
      nextTasks[nextIndex] = { ...fallback, prompt: generated.question, focus: generated.focus }
      updateTasks(nextTasks)
    } catch (error) {
      console.error('STAR follow-up generation failed:', error)
      setMessage('动态追问暂时不可用，本题已切换为同维度标准追问。')
    }
  }

  const finishAssessment = async () => {
    setPhase('evaluating')
    setMessage('')
    try {
      const evaluation = await evaluatePracticalAssessment({
        serviceBackground,
        answers: answersRef.current,
      })
      onComplete({
        ...evaluation,
        answers: answersRef.current,
        completedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Practical assessment evaluation failed:', error)
      if (error.code === 'LOGIN_REQUIRED') openLoginModal()
      setMessage(error.message || '实战评分暂时无法生成，请重试。')
      setPhase('evaluation_error')
    }
  }

  const handleContinue = async () => {
    if (currentTask.id === 'practical-star-main') {
      setPhase('generating_followup')
      await replaceFollowUp(taskIndex + 1, 1)
    } else if (currentTask.id === 'practical-star-followup-1') {
      setPhase('generating_followup')
      await replaceFollowUp(taskIndex + 1, 2)
    }

    if (taskIndex >= tasksRef.current.length - 1) {
      await finishAssessment()
      return
    }
    beginPreparation(taskIndex + 1)
  }

  if (!authChecked || isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="text-center">
          <LoaderCircle size={28} className="mx-auto animate-spin text-blue-700" />
          <p className="mt-3 text-sm text-slate-600">正在确认登录状态...</p>
        </div>
      </div>
    )
  }

  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <LockKeyhole size={22} />
          </div>
          <h1 className="text-xl font-bold text-slate-950">登录后完成实战验证</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            选择题已完成。实战录音需要登录，用于限制重复生成和保存同一用户的完整评估结果，不需要激活码。
          </p>
          <button type="button" onClick={openLoginModal} className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700">
            登录并继续
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'intro' || phase === 'mic_recording' || phase === 'mic_ready') {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-10">
        <main className="mx-auto max-w-2xl">
          <p className="text-sm font-medium text-blue-700">实战验证</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">先测试麦克风</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            接下来有 2 道限时英语题和 1 组 STAR 经历追问。正式录音会自动计时、不可暂停，转写结果不能编辑；音频只用于即时转写，不会保存。
          </p>

          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Mic size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-950">试录 4 秒，不计分</h2>
                <p className="mt-1 text-sm text-slate-600">请说：“麦克风测试，I am ready.”</p>
              </div>
            </div>

            {phase === 'mic_recording' ? (
              <div className="mt-5 flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 text-red-700">
                <span className="flex items-center gap-2 text-sm font-semibold"><span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />正在试录</span>
                <span className="font-mono text-sm">{formatSeconds(recordingElapsed)}</span>
              </div>
            ) : (
              <button type="button" onClick={() => startRecorder({ test: true })} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800">
                <Mic size={18} />{testAudioUrl ? '重新测试' : '测试麦克风'}
              </button>
            )}

            {testAudioUrl && phase === 'mic_ready' && (
              <div className="mt-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 size={17} />试录完成，请播放确认声音</div>
                <audio src={testAudioUrl} controls className="h-10 w-full" />
                <button type="button" onClick={() => beginPreparation(0)} className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700">
                  听得到，开始实战验证
                </button>
              </div>
            )}
          </section>
          {message && <p className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{message}</p>}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <main className="mx-auto max-w-2xl">
        <div className="mb-5 flex items-center justify-between text-sm text-slate-500">
          <span>实战验证</span>
          <span>{taskIndex + 1}/{tasks.length}</span>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-blue-700">{isEvaluationPhase ? '实战综合评分' : currentTask.title}</p>
            {!isEvaluationPhase && <span className="flex items-center gap-1 text-xs text-slate-500"><Clock3 size={14} />上限 {currentTask.recordingSeconds} 秒</span>}
          </div>
          <h1 className="mt-3 text-lg font-bold leading-8 text-slate-950">
            {isEvaluationPhase ? '五段回答均已锁定，正在生成最终评分' : currentTask.prompt}
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            {isEvaluationPhase ? '即使评分需要重试，也不会要求你重新录音。' : currentTask.language}
          </p>
        </section>

        {phase === 'preparing' && (
          <section className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-5 text-center">
            <p className="text-sm font-medium text-amber-900">准备时间</p>
            <p className="mt-2 text-4xl font-bold tabular-nums text-amber-950">{preparationLeft}</p>
            <p className="mt-2 text-xs text-amber-800">倒计时结束后自动开始录音</p>
          </section>
        )}

        {phase === 'recording' && (
          <section className="mt-4 rounded-lg border border-red-200 bg-red-50 p-5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-semibold text-red-800"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600" />正在录音</span>
              <span className="font-mono text-lg font-bold tabular-nums text-red-900">{formatSeconds(currentTask.recordingSeconds - recordingElapsed)}</span>
            </div>
            <button type="button" onClick={stopRecording} disabled={recordingElapsed < 5} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-red-200">
              <Square size={17} />完成回答
            </button>
            <p className="mt-2 text-center text-xs text-red-700">前 5 秒不能提前结束，到时自动停止</p>
          </section>
        )}

        {['transcribing', 'generating_followup', 'evaluating'].includes(phase) && (
          <section className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-5 text-center">
            <LoaderCircle size={24} className="mx-auto animate-spin text-blue-700" />
            <p className="mt-3 text-sm font-medium text-blue-900">
              {phase === 'transcribing' ? '正在转写回答...' : phase === 'generating_followup' ? '正在根据回答生成追问...' : '正在生成实战评分...'}
            </p>
          </section>
        )}

        {phase === 'review' && (
          <section className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-center gap-2 font-semibold text-emerald-900"><CheckCircle2 size={18} />回答已锁定</div>
            <p className="mt-3 text-sm leading-6 text-emerald-950">{currentTranscript}</p>
            <p className="mt-3 text-xs text-emerald-800">转写仅供确认系统收到内容，不能编辑或重新润色。</p>
            <button type="button" onClick={handleContinue} className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700">
              {taskIndex === tasks.length - 1 ? '生成实战评分' : '锁定并继续'}
            </button>
          </section>
        )}

        {phase === 'technical_error' && (
          <section className="mt-4 rounded-lg border border-red-200 bg-red-50 p-5">
            <div className="flex items-center gap-2 font-semibold text-red-900"><AlertCircle size={18} />本题未成功提交</div>
            <p className="mt-2 text-sm leading-6 text-red-800">{message}</p>
            <button type="button" onClick={handleTechnicalRetry} disabled={(technicalRetries[currentTask.id] || 0) >= 1} className="mt-4 w-full rounded-lg bg-red-600 px-4 py-3 font-semibold text-white disabled:bg-red-200">
              进行一次技术重试
            </button>
          </section>
        )}

        {phase === 'evaluation_error' && (
          <section className="mt-4 rounded-lg border border-red-200 bg-red-50 p-5">
            <div className="flex items-center gap-2 font-semibold text-red-900"><AlertCircle size={18} />评分生成失败</div>
            <p className="mt-2 text-sm text-red-800">{message}</p>
            <button type="button" onClick={finishAssessment} className="mt-4 w-full rounded-lg bg-red-600 px-4 py-3 font-semibold text-white">重新生成评分</button>
          </section>
        )}

        <div className="mt-5 flex items-center gap-2 text-xs leading-5 text-slate-500">
          <Volume2 size={15} className="shrink-0" />音频不保存；报告仅保存转写、用时、追问和评分结果。
        </div>
      </main>
    </div>
  )
}
