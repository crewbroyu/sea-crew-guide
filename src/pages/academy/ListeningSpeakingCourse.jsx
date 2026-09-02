import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, ChevronLeft, Mic, Pause, RotateCcw, Volume2 } from 'lucide-react'
import { getListeningSpeakingCourse } from '../../data/listeningSpeakingCourses'

const formatSeconds = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

export default function ListeningSpeakingCourse() {
  const navigate = useNavigate()
  const { category: categoryId, course: courseId } = useParams()
  const lesson = getListeningSpeakingCourse(categoryId, courseId)
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const audioUrlRef = useRef('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [audioUrl, setAudioUrl] = useState('')
  const [recordingCount, setRecordingCount] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => () => {
    window.speechSynthesis?.cancel()
    clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
  }, [])

  if (!lesson) return <Navigate to="/academy/listening-speaking" replace />

  const { category, course } = lesson
  const stopSpeech = () => { window.speechSynthesis?.cancel(); setIsSpeaking(false) }

  const playExample = () => {
    if (!('speechSynthesis' in window)) {
      setError('当前浏览器不支持朗读示范，请直接阅读文本后练习。')
      return
    }
    if (isSpeaking) { stopSpeech(); return }
    const utterance = new SpeechSynthesisUtterance(course.transcript)
    utterance.lang = 'en-US'
    utterance.rate = 0.85
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    setIsSpeaking(true)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  const finishRecording = () => {
    clearInterval(timerRef.current)
    setIsRecording(false)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError('当前浏览器不支持录音，请使用 Chrome、Edge 或 Safari 最新版本。')
      return
    }
    try {
      setError('')
      stopSpeech()
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current)
        const nextAudioUrl = URL.createObjectURL(blob)
        audioUrlRef.current = nextAudioUrl
        setAudioUrl(nextAudioUrl)
        setRecordingCount((count) => {
          const nextCount = count + 1
          localStorage.setItem(`listening-speaking:${category.id}:${course.id}`, JSON.stringify({ completedAt: new Date().toISOString(), recordingCount: nextCount }))
          return nextCount
        })
        finishRecording()
      }
      setRecordingSeconds(0)
      recorder.start()
      setIsRecording(true)
      timerRef.current = setInterval(() => setRecordingSeconds((seconds) => seconds + 1), 1000)
    } catch (recordingError) {
      setError(recordingError.name === 'NotAllowedError' ? '需要允许麦克风权限后才能录音。' : '无法启动录音，请稍后再试。')
      finishRecording()
    }
  }

  const stopRecording = () => { if (recorderRef.current?.state === 'recording') recorderRef.current.stop() }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 pb-6 pt-16">
        <div className="flex items-center gap-3"><button onClick={() => navigate(`/academy/listening-speaking/${category.id}`)} className="text-white hover:text-blue-200" aria-label="返回课程列表"><ChevronLeft size={24} /></button><div><h1 className="text-2xl font-bold text-white">{course.title}</h1><p className="mt-1 text-sm text-white/80">{category.name} · 短句跟读</p></div></div>
      </div>
      <div className="space-y-5 px-6 py-6">
        <section className="rounded-xl bg-white p-5 shadow-sm"><p className="text-sm font-medium text-blue-700">先听示范</p><p className="mt-3 text-lg leading-8 text-gray-900">{course.transcript}</p><p className="mt-3 text-sm leading-6 text-gray-600">{course.translation}</p><button onClick={playExample} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700">{isSpeaking ? <Pause size={18} /> : <Volume2 size={18} />}{isSpeaking ? '停止朗读' : '朗读示范'}</button></section>
        <section className="rounded-xl bg-white p-5 shadow-sm"><p className="text-sm font-medium text-emerald-700">再录一遍自己的版本</p><p className="mt-2 text-sm text-gray-600">录音不会上传到服务器，仅用于你在当前浏览器回放。</p>{isRecording ? <div className="mt-5 flex items-center gap-4"><button onClick={stopRecording} className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700" aria-label="停止录音"><Pause size={20} /></button><div><p className="font-medium text-gray-800">正在录音</p><p className="text-sm text-red-600">{formatSeconds(recordingSeconds)}</p></div></div> : <button onClick={startRecording} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 font-medium text-white hover:bg-emerald-700"><Mic size={20} />{audioUrl ? '重新录音' : '开始跟读'}</button>}{audioUrl && !isRecording && <div className="mt-4 rounded-lg bg-gray-50 p-3"><audio controls src={audioUrl} className="w-full" /><div className="mt-3 flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 size={17} /><span>本次跟读已完成{recordingCount > 1 ? `（第 ${recordingCount} 次）` : ''}</span></div></div>}{error && <p className="mt-3 text-sm text-red-600">{error}</p>}</section>
        <button onClick={() => navigate(`/academy/listening-speaking/${category.id}`)} className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"><RotateCcw size={16} /> 返回课程列表</button>
      </div>
    </div>
  )
}
