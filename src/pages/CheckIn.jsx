import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Volume2, Mic, Square, Play, Trash2, CheckCircle, ArrowLeft } from 'lucide-react'

const dailySentences = [
  "Welcome aboard! My name is... How may I help you?",
  "Good morning, sir. Breakfast is served from 7 to 10.",
  "May I take your order, please?",
  "The lifeboat drill will begin in 30 minutes.",
  "Please fasten your life jacket like this.",
  "The swimming pool is on Deck 9, open from 8am to 10pm.",
  "Would you like still water or sparkling water?",
  "I'll have your cabin cleaned right away.",
  "We will arrive at the next port tomorrow morning.",
  "Is there anything else I can do for you?",
  "The theater show starts at 8 o'clock tonight.",
  "Please let me know if you have any allergies.",
  "The captain's welcome dinner is on the second night.",
  "You can exchange currency at the guest services desk.",
  "Excuse me, your table is ready. Please follow me.",
  "The spa is offering a special promotion today.",
  "We hope you enjoyed your cruise. See you next time!",
  "The weather forecast shows clear skies for today.",
  "Room service is available 24 hours a day.",
  "Could you please tell me your cabin number?",
  "The fitness center is located on Deck 12.",
  "Tonight's dress code is formal attire.",
  "I apologize for the inconvenience. Let me fix that for you.",
  "Would you prefer a window seat or an aisle seat?",
  "The shore excursion departs at 9 AM from Deck 3.",
  "Please make sure to bring your cruise card with you.",
  "The buffet restaurant offers a variety of international cuisines.",
  "How was your day on shore? Did you enjoy it?",
  "I'll arrange a wake-up call for you at 6 AM.",
  "Thank you for your patience. Your order will be ready shortly.",
]

function getTodaySentence() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now - start
  const oneDay = 1000 * 60 * 60 * 24
  const dayOfYear = Math.floor(diff / oneDay)
  return dailySentences[dayOfYear % dailySentences.length]
}

export default function CheckIn() {
  const navigate = useNavigate()
  const [sentence] = useState(getTodaySentence())
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioURL, setAudioURL] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const audioRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioURL) URL.revokeObjectURL(audioURL)
    }
  }, [audioURL])

  const speakSentence = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(sentence)
      utterance.lang = 'en-US'
      utterance.rate = 0.85
      utterance.onstart = () => setIsPlaying(true)
      utterance.onend = () => setIsPlaying(false)
      utterance.onerror = () => setIsPlaying(false)
      window.speechSynthesis.speak(utterance)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        if (audioURL) URL.revokeObjectURL(audioURL)
        setAudioURL(url)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1)
      }, 1000)
    } catch (err) {
      console.error('无法访问麦克风:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const deleteRecording = () => {
    if (audioURL) URL.revokeObjectURL(audioURL)
    setAudioURL(null)
    setRecordingTime(0)
  }

  const playRecording = () => {
    if (audioRef.current) {
      audioRef.current.play()
    }
  }

  const handleSubmit = () => {
    setSubmitted(true)
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 pt-12 pb-6 flex items-center gap-3">
          <button onClick={() => navigate('/academy')} className="text-white">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-white text-lg font-bold">打卡成功</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">今日打卡完成！</h2>
          <p className="text-gray-500 text-sm text-center mb-8">坚持每天练习，你的英语会越来越好 🎉</p>
          <button
            onClick={() => navigate('/academy')}
            className="bg-purple-600 text-white px-8 py-3 rounded-xl font-medium"
          >
            返回学院
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 pt-12 pb-6 flex items-center gap-3">
        <button onClick={() => navigate('/academy')} className="text-white">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-white text-lg font-bold">每日英语打卡</h1>
          <p className="text-purple-200 text-xs mt-0.5">跟读练习，提升口语</p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-purple-600 font-medium bg-purple-50 px-3 py-1 rounded-full">今日句子</span>
            <span className="text-xs text-gray-400">{new Date().toLocaleDateString('zh-CN')}</span>
          </div>
          <p className="text-lg font-semibold text-gray-800 leading-relaxed">{sentence}</p>
          <button
            onClick={speakSentence}
            disabled={isPlaying}
            className={`mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              isPlaying
                ? 'bg-purple-100 text-purple-400'
                : 'bg-purple-600 text-white active:scale-95'
            }`}
          >
            <Volume2 size={18} />
            {isPlaying ? '正在朗读...' : '听发音'}
          </button>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-800 mb-4">跟读录音</p>

          {!audioURL && !isRecording && (
            <div className="flex flex-col items-center py-6">
              <button
                onClick={startRecording}
                className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition"
              >
                <Mic size={32} className="text-white" />
              </button>
              <p className="text-xs text-gray-400 mt-3">点击开始录音</p>
            </div>
          )}

          {isRecording && (
            <div className="flex flex-col items-center py-6">
              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                <Mic size={32} className="text-white" />
              </div>
              <p className="text-red-500 font-mono text-lg mt-3">{formatTime(recordingTime)}</p>
              <button
                onClick={stopRecording}
                className="mt-3 flex items-center gap-2 bg-gray-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium active:scale-95 transition"
              >
                <Square size={16} />
                停止录音
              </button>
            </div>
          )}

          {audioURL && !isRecording && (
            <div className="space-y-3">
              <audio ref={audioRef} src={audioURL} />
              <div className="flex items-center gap-3">
                <button
                  onClick={playRecording}
                  className="flex-1 flex items-center justify-center gap-2 bg-purple-50 text-purple-600 py-3 rounded-xl text-sm font-medium active:scale-95 transition"
                >
                  <Play size={18} />
                  播放录音
                </button>
                <button
                  onClick={deleteRecording}
                  className="flex items-center justify-center gap-2 bg-red-50 text-red-500 py-3 px-4 rounded-xl text-sm font-medium active:scale-95 transition"
                >
                  <Trash2 size={18} />
                  删除
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!audioURL}
          className={`w-full py-3.5 rounded-xl text-base font-medium transition ${
            audioURL
              ? 'bg-purple-600 text-white active:scale-95'
              : 'bg-gray-200 text-gray-400'
          }`}
        >
          提交打卡
        </button>
      </div>
    </div>
  )
}