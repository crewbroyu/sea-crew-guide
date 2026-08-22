import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Mic,
  Pause,
  RefreshCw,
  Volume2,
  X,
} from 'lucide-react'
import interviewQuestions from '../../data/interviewQuestions'

const STORAGE_KEY = 'interview_practice_data'

const positions = [
  { key: 'retail', name: '免税店 / Retail Sales', description: '销售表达、产品推荐、KPI 和英文服务案例。' },
  { key: 'front_office', name: '前台 / Guest Service', description: '客诉处理、系统操作、政策解释和复杂沟通。' },
  { key: 'restaurant', name: '餐厅 / Restaurant', description: '点单、推荐、过敏提醒、团队协作和高峰期服务。' },
  { key: 'bar_server', name: '酒吧 / Bar Server', description: '酒水推荐、负责任售酒、small talk 和高峰期压力。' },
  { key: 'housekeeping', name: '客房 / Housekeeping', description: '清洁流程、隐私、安全、客人请求和细节服务。' },
  { key: 'youth_staff', name: 'Youth Staff', description: '活动组织、儿童安全、家长沟通和控场能力。' },
  { key: 'kitchen', name: '厨房 / Kitchen Steward', description: '卫生安全、团队配合、设备使用和后台工作节奏。' },
  { key: 'utility', name: '后勤 / Utility', description: '清洁标准、安全规则、主管汇报和基础英语。' },
]

const RECORDING_STATUS = {
  IDLE: 'idle',
  RECORDING: 'recording',
  COMPLETED: 'completed',
}

const loadJson = (key, fallback) => {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch (error) {
    console.error(`Error loading ${key}:`, error)
    return fallback
  }
}

const saveJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error saving ${key}:`, error)
  }
}

const normalizePosition = (value) => {
  if (!value) return null
  if (interviewQuestions[value]) return value

  const lowerValue = String(value).toLowerCase()
  if (lowerValue.includes('retail') || lowerValue.includes('shop')) return 'retail'
  if (lowerValue.includes('guest') || lowerValue.includes('front') || lowerValue.includes('reception')) return 'front_office'
  if (lowerValue.includes('restaurant') || lowerValue.includes('waiter')) return 'restaurant'
  if (lowerValue.includes('bar')) return 'bar_server'
  if (lowerValue.includes('housekeeping') || lowerValue.includes('cabin')) return 'housekeeping'
  if (lowerValue.includes('youth')) return 'youth_staff'
  if (lowerValue.includes('kitchen') || lowerValue.includes('galley')) return 'kitchen'
  if (lowerValue.includes('utility') || lowerValue.includes('cleaner')) return 'utility'
  return null
}

const getTask2Position = () => {
  const task2Result = loadJson('task2_result', null)
  return normalizePosition(task2Result?.selectedTargetJob)
}

const createInitialProgress = () => {
  const savedProgress = loadJson(STORAGE_KEY, null)
  const savedPosition = normalizePosition(savedProgress?.position)
  const task2Position = getTask2Position()
  const position = savedPosition || task2Position

  return {
    position,
    completedQuestions: savedProgress?.completedQuestions || [],
    completedKnowledge: savedProgress?.completedKnowledge || [],
  }
}

const getPositionMeta = (key) => positions.find(position => position.key === key) || positions[0]

const getDifficultyClass = (difficulty) => {
  if (difficulty === 'easy') return 'border-emerald-100 bg-emerald-50 text-emerald-700'
  if (difficulty === 'medium') return 'border-amber-100 bg-amber-50 text-amber-700'
  return 'border-rose-100 bg-rose-50 text-rose-700'
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export default function InterviewQuestions() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(createInitialProgress)
  const [activeTab, setActiveTab] = useState('questions')
  const [showPositionModal, setShowPositionModal] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [selectedKnowledge, setSelectedKnowledge] = useState(null)
  const [speaking, setSpeaking] = useState(false)
  const [recordingStatus, setRecordingStatus] = useState(RECORDING_STATUS.IDLE)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingUrl, setRecordingUrl] = useState(null)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [stream, setStream] = useState(null)

  const timerRef = useRef(null)
  const utteranceRef = useRef(null)

  const task2Position = getTask2Position()
  const currentData = progress.position ? interviewQuestions[progress.position] : null
  const currentPosition = progress.position ? getPositionMeta(progress.position) : null
  const completedQuestions = progress.completedQuestions.length
  const completedKnowledge = progress.completedKnowledge.length
  const totalQuestions = currentData?.questions?.length || 0
  const totalKnowledge = currentData?.knowledge?.length || 0

  useEffect(() => {
    saveJson(STORAGE_KEY, progress)
  }, [progress])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (stream) stream.getTracks().forEach(track => track.stop())
      if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop()
      if (recordingUrl) URL.revokeObjectURL(recordingUrl)
      window.speechSynthesis.cancel()
    }
  }, [mediaRecorder, recordingUrl, stream])

  const stopSpeaking = () => {
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }

  const speakText = (text) => {
    if (speaking) {
      stopSpeaking()
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.9
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  const resetRecording = () => {
    if (recordingUrl) URL.revokeObjectURL(recordingUrl)
    setRecordingStatus(RECORDING_STATUS.IDLE)
    setRecordingTime(0)
    setRecordingUrl(null)
  }

  const openQuestion = (question) => {
    stopSpeaking()
    resetRecording()
    setSelectedQuestion(question)
    setSelectedKnowledge(null)
  }

  const openKnowledge = (knowledge) => {
    stopSpeaking()
    resetRecording()
    setSelectedKnowledge(knowledge)
    setSelectedQuestion(null)
  }

  const selectPosition = (positionKey) => {
    setProgress({
      position: positionKey,
      completedQuestions: [],
      completedKnowledge: [],
    })
    setActiveTab('questions')
    setShowPositionModal(false)
  }

  const startRecording = async () => {
    try {
      stopSpeaking()
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(audioStream)
      const chunks = []

      recorder.ondataavailable = event => chunks.push(event.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setRecordingUrl(URL.createObjectURL(blob))
        setRecordingStatus(RECORDING_STATUS.COMPLETED)
        if (timerRef.current) clearInterval(timerRef.current)
      }

      setStream(audioStream)
      setMediaRecorder(recorder)
      recorder.start()
      setRecordingStatus(RECORDING_STATUS.RECORDING)
      setRecordingTime(0)
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('无法访问麦克风，请确认浏览器已允许录音权限。')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop()
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const confirmPractice = () => {
    if (selectedQuestion) {
      setProgress(prev => ({
        ...prev,
        completedQuestions: prev.completedQuestions.includes(selectedQuestion.id)
          ? prev.completedQuestions
          : [...prev.completedQuestions, selectedQuestion.id],
      }))
      setSelectedQuestion(null)
    }

    if (selectedKnowledge) {
      setProgress(prev => ({
        ...prev,
        completedKnowledge: prev.completedKnowledge.includes(selectedKnowledge.id)
          ? prev.completedKnowledge
          : [...prev.completedKnowledge, selectedKnowledge.id],
      }))
      setSelectedKnowledge(null)
    }

    stopSpeaking()
    resetRecording()
  }

  if (!progress.position || !currentData) {
    return (
      <div className="min-h-screen bg-slate-50 pb-24">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-5 pb-6 pt-12">
            <button
              type="button"
              onClick={() => navigate('/academy')}
              className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
            >
              <ArrowLeft size={16} />
              返回学院
            </button>
            <p className="text-sm font-medium text-blue-700">面试题库</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">
              选择目标岗位开始练习
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              先选择岗位，再进入对应的面试问题、岗位知识和录音打卡。
            </p>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-5 py-6">
          {task2Position && (
            <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-950">
                岗位测评里推荐了：{getPositionMeta(task2Position).name}
              </p>
              <button
                type="button"
                onClick={() => selectPosition(task2Position)}
                className="mt-3 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
              >
                使用测评推荐岗位
              </button>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            {positions.map(position => (
              <button
                key={position.key}
                type="button"
                onClick={() => selectPosition(position.key)}
                className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md"
              >
                <h3 className="font-semibold text-slate-950">{position.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{position.description}</p>
              </button>
            ))}
          </div>
        </main>
      </div>
    )
  }

  const activeItems = activeTab === 'questions' ? currentData.questions : currentData.knowledge
  const selectedItem = selectedQuestion || selectedKnowledge
  const modalTitle = selectedQuestion ? `Q${selectedQuestion.order}` : '岗位知识点'
  const modalText = selectedQuestion?.question || selectedKnowledge?.content
  const modalTip = selectedQuestion?.tip || '先听标准朗读，再录下自己的跟读，重点练习发音、停顿和语气。'

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-5 pb-6 pt-12">
          <button
            type="button"
            onClick={() => navigate('/academy')}
            className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
          >
            <ArrowLeft size={16} />
            返回学院
          </button>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-blue-700">面试训练</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">
                {currentPosition.name}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                按岗位练习高频问题和基础知识点。当前进度会保存在本地浏览器。
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPositionModal(true)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200"
            >
              切换岗位
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">面试问题</span>
                <span className="text-slate-500">{completedQuestions}/{totalQuestions}</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white">
                <div
                  className="h-2 rounded-full bg-blue-600"
                  style={{ width: `${totalQuestions ? (completedQuestions / totalQuestions) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">岗位知识</span>
                <span className="text-slate-500">{completedKnowledge}/{totalKnowledge}</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white">
                <div
                  className="h-2 rounded-full bg-emerald-600"
                  style={{ width: `${totalKnowledge ? (completedKnowledge / totalKnowledge) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-6">
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('questions')}
              className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                activeTab === 'questions' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              面试问题
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('knowledge')}
              className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${
                activeTab === 'knowledge' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              岗位知识
            </button>
          </div>
        </div>

        <section className="grid gap-3">
          {activeItems.map((item, index) => {
            const completed = activeTab === 'questions'
              ? progress.completedQuestions.includes(item.id)
              : progress.completedKnowledge.includes(item.id)
            const difficulty = item.difficulty

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => (activeTab === 'questions' ? openQuestion(item) : openKnowledge(item))}
                className={`rounded-xl border p-4 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md ${
                  completed ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${
                      completed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {completed ? <CheckCircle2 size={17} /> : activeTab === 'questions' ? index + 1 : <BookOpen size={17} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-6 text-slate-950">
                      {activeTab === 'questions' ? item.question : item.content}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {difficulty && (
                        <span className={`rounded-md border px-2 py-1 text-xs font-medium ${getDifficultyClass(difficulty)}`}>
                          {difficulty}
                        </span>
                      )}
                      <span className={`rounded-md px-2 py-1 text-xs font-medium ${
                        completed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                      >
                        {completed ? '已练习' : '待练习'}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </section>
      </main>

      {showPositionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-5 backdrop-blur-sm">
          <div className="max-h-[82vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">切换目标岗位</h3>
                <p className="mt-1 text-sm text-slate-500">切换后会重新开始当前岗位的练习进度。</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPositionModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {positions.map(position => (
                <button
                  key={position.key}
                  type="button"
                  onClick={() => selectPosition(position.key)}
                  className={`rounded-xl border p-4 text-left transition ${
                    progress.position === position.key
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-blue-200'
                  }`}
                >
                  <p className="font-semibold text-slate-950">{position.name}</p>
                  <p className="mt-1 text-sm leading-5 text-slate-600">{position.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-5 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-blue-700">{modalTitle}</p>
                {selectedQuestion?.difficulty && (
                  <span className={`mt-2 inline-flex rounded-md border px-2 py-1 text-xs font-medium ${getDifficultyClass(selectedQuestion.difficulty)}`}>
                    {selectedQuestion.difficulty}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedQuestion(null)
                  setSelectedKnowledge(null)
                  stopSpeaking()
                  resetRecording()
                }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-base font-medium leading-7 text-slate-950">{modalText}</p>
            </div>

            <button
              type="button"
              onClick={() => speakText(modalText)}
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                speaking ? 'bg-rose-100 text-rose-700' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              {speaking ? <Pause size={18} /> : <Volume2 size={18} />}
              {speaking ? '停止朗读' : '朗读内容'}
            </button>

            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-900">练习提示</p>
              <p className="mt-1 text-sm leading-6 text-blue-800">{modalTip}</p>
            </div>

            <div className="mt-4 space-y-3">
              {recordingStatus === RECORDING_STATUS.IDLE && (
                <button
                  type="button"
                  onClick={startRecording}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Mic size={18} />
                  开始录音
                </button>
              )}

              {recordingStatus === RECORDING_STATUS.RECORDING && (
                <>
                  <div className="flex items-center justify-center gap-3 rounded-xl bg-rose-50 px-4 py-4">
                    <span className="h-3 w-3 rounded-full bg-rose-500" />
                    <span className="text-sm font-semibold text-rose-700">录制中 {formatTime(recordingTime)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
                  >
                    <X size={18} />
                    停止录音
                  </button>
                </>
              )}

              {recordingStatus === RECORDING_STATUS.COMPLETED && (
                <>
                  <audio src={recordingUrl} controls className="w-full" />
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={resetRecording}
                      className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200"
                    >
                      <RefreshCw size={17} />
                      重录
                    </button>
                    <button
                      type="button"
                      onClick={confirmPractice}
                      className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      <Check size={17} />
                      完成练习
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
