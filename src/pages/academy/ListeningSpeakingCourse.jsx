// src/pages/academy/ListeningSpeakingCourse.jsx
import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ChevronLeft, Play, Pause, Mic, Check, AlertCircle } from 'lucide-react'
import { callCloudFunction } from '../../services/cloudService'

export default function ListeningSpeakingCourse() {
  const navigate = useNavigate()
  const { category, course } = useParams()
  const [courseData, setCourseData] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [audioChunks, setAudioChunks] = useState([])
  const [checkinSuccess, setCheckinSuccess] = useState(false)
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(null)

  // 模拟课程数据
  useEffect(() => {
    const mockCourseData = {
      id: course,
      title: course === 'eslpod-1' ? 'Daily English' : 'Business English',
      mediaUrl: 'https://example.com/audio/eslpod1.mp3',
      transcript: 'Welcome to ESLPod! Today we\'re going to learn about daily English conversations.',
      translation: '欢迎来到ESLPod！今天我们将学习日常英语对话。'
    }
    setCourseData(mockCourseData)
  }, [course])

  // 播放原音
  const handlePlay = () => {
    // 实际项目中，这里会播放真实的音频文件
    setIsPlaying(true)
    setTimeout(() => {
      setIsPlaying(false)
    }, 3000) // 模拟播放3秒
  }

  // 开始录音
  const startRecording = async () => {
    try {
      setError('')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // 获取浏览器支持的音频格式
      let mimeType = 'audio/webm'
      let fileExtension = 'webm'
      
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4'
        fileExtension = 'mp4'
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg'
        fileExtension = 'ogg'
      }
      
      const recorder = new MediaRecorder(stream, { mimeType })
      setMediaRecorder(recorder)
      
      const chunks = []
      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: mimeType })
        const reader = new FileReader()
        reader.onloadend = async () => {
          const base64Audio = reader.result.split(',')[1]
          await uploadAudio(base64Audio, fileExtension)
        }
        reader.readAsDataURL(blob)
      }
      
      recorder.start()
      setIsRecording(true)
      setAudioChunks(chunks)
      
      // 开始计时
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      setTimer(interval)
    } catch (err) {
      setError('无法访问麦克风，请检查权限设置')
      console.error('录音失败:', err)
    }
  }

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop()
      setIsRecording(false)
      if (timer) {
        clearInterval(timer)
      }
      setRecordingTime(0)
    }
  }

  // 上传音频
  const uploadAudio = async (base64Audio, fileExtension) => {
    try {
      const result = await callCloudFunction('uploadAudio', {
        audioData: base64Audio,
        userId: 'user123', // 实际项目中从用户登录信息获取
        userName: '测试用户', // 实际项目中从用户登录信息获取
        courseId: course,
        fileExtension: fileExtension
      })
      
      if (result.code === 0) {
        setCheckinSuccess(true)
        setTimeout(() => {
          setCheckinSuccess(false)
        }, 3000)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('上传失败，请重试')
      console.error('上传失败:', err)
    }
  }

  if (!courseData) {
    return <div className="loading">加载中...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部头部 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 pt-16 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/academy/listening-speaking/${category}`)}
            className="text-white hover:text-blue-200"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-white text-2xl font-bold">{courseData.title}</h1>
        </div>
        <p className="text-white/80 text-sm mt-2">
          {category === 'eslpod' ? 'ESLPod' : 'EnglishPod'}
        </p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* 原音播放 */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4">原音播放</h3>
          <div className="flex items-center gap-4">
            <button
              onClick={handlePlay}
              disabled={isPlaying}
              className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <div>
              <p className="text-gray-600">点击播放原音</p>
              {isPlaying && <p className="text-sm text-blue-600">正在播放...</p>}
            </div>
          </div>
        </div>

        {/* 文本内容 */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-3">文本内容</h3>
          <div className="space-y-3">
            <div>
              <p className="text-gray-500 text-sm mb-1">英文</p>
              <p className="text-gray-800">{courseData.transcript}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-1">中文</p>
              <p className="text-gray-800">{courseData.translation}</p>
            </div>
          </div>
        </div>

        {/* 跟读打卡 */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="font-bold text-gray-800 mb-4">跟读打卡</h3>
          <div className="space-y-4">
            {isRecording ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={stopRecording}
                  className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition"
                >
                  <Pause size={24} />
                </button>
                <div>
                  <p className="text-gray-600">正在录音</p>
                  <p className="text-sm text-red-600">已录制 {recordingTime} 秒</p>
                </div>
              </div>
            ) : (
              <button
                onClick={startRecording}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <Mic size={20} />
                <span>开始跟读</span>
              </button>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {checkinSuccess && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <Check size={16} />
                <span>打卡成功！</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}