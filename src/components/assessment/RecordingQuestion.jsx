// src/components/assessment/RecordingQuestion.jsx
import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function RecordingQuestion({
  question,
  dimension,
  currentQuestion,
  totalQuestions,
  currentDimension,
  totalDimensions,
  answers,
  onSelectAnswer,
  onNext,
  onPrev
}) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [isSupported, setIsSupported] = useState(null)
  const [audioBlob, setAudioBlob] = useState(null)
  const [score, setScore] = useState(null)
  const [showFallback, setShowFallback] = useState(false)
  
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)
  const recognitionRef = useRef(null)
  
  // 检查浏览器支持
  useEffect(() => {
    const hasMediaRecorder = typeof MediaRecorder !== 'undefined'
    const hasSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    setIsSupported(hasMediaRecorder && hasSpeechRecognition)
    
    if (!hasMediaRecorder || !hasSpeechRecognition) {
      setShowFallback(true)
    }
  }, [])
  
  // 清理
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])
  
  // 开始录音
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        setAudioBlob(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      setTranscript('')
      setWordCount(0)
      
      // 开始计时
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 120) {
            stopRecording()
            return 120
          }
          return prev + 1
        })
      }, 1000)
      
      // 开始语音识别
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition
      recognition.lang = 'en-US'
      recognition.continuous = true
      recognition.interimResults = true
      
      recognition.onresult = (event) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' '
          }
        }
        if (finalTranscript) {
          setTranscript(finalTranscript)
          setWordCount(finalTranscript.trim().split(/\s+/).filter(word => word.length > 0).length)
        }
      }
      
      recognition.start()
    } catch (error) {
      console.error('录音失败:', error)
      setShowFallback(true)
    }
  }
  
  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    
    // 计算得分
    const calculatedScore = calculateScore(recordingTime, wordCount)
    setScore(calculatedScore)
    onSelectAnswer(question.id, calculatedScore)
  }
  
  // 计算得分
  const calculateScore = (time, words) => {
    let timeScore = 1
    let wordScore = 1
    
    // 按时间评分
    if (time < 5) timeScore = 1
    else if (time < 15) timeScore = 2
    else if (time < 30) timeScore = 3
    else if (time < 60) timeScore = 4
    else timeScore = 5
    
    // 按单词数评分
    if (words < 5) wordScore = 1
    else if (words < 20) wordScore = 2
    else if (words < 50) wordScore = 3
    else if (words < 100) wordScore = 4
    else wordScore = 5
    
    // 取较高分
    return Math.max(timeScore, wordScore)
  }
  
  // 格式化时间
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  // 降级为选择题
  if (showFallback) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-1 px-6 py-8">
          <div className="max-w-md mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="text-sm text-gray-500">
                第 {currentQuestion + 1} / {totalQuestions} 题
              </div>
              <div className="text-sm text-gray-500">
                维度 {currentDimension} / {totalDimensions}
              </div>
            </div>
            
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <p className="text-gray-700">{question.scenario}</p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-700 text-sm">
                当前浏览器不支持录音，请选择最接近你情况的选项
              </p>
            </div>
            
            <div className="space-y-3 mb-8">
              <div 
                className={`p-4 border rounded-lg cursor-pointer ${answers[question.id] === 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                onClick={() => onSelectAnswer(question.id, 1)}
              >
                <p>完全说不出来</p>
              </div>
              <div 
                className={`p-4 border rounded-lg cursor-pointer ${answers[question.id] === 2 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                onClick={() => onSelectAnswer(question.id, 2)}
              >
                <p>能说几个单词</p>
              </div>
              <div 
                className={`p-4 border rounded-lg cursor-pointer ${answers[question.id] === 3 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                onClick={() => onSelectAnswer(question.id, 3)}
              >
                <p>能说1-2句话</p>
              </div>
              <div 
                className={`p-4 border rounded-lg cursor-pointer ${answers[question.id] === 4 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                onClick={() => onSelectAnswer(question.id, 4)}
              >
                <p>能说30秒以上</p>
              </div>
              <div 
                className={`p-4 border rounded-lg cursor-pointer ${answers[question.id] === 5 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                onClick={() => onSelectAnswer(question.id, 5)}
              >
                <p>能流利说1分钟以上</p>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button 
                onClick={onPrev}
                className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <ChevronLeft className="w-5 h-5" />
                上一题
              </button>
              <button 
                onClick={onNext}
                className={`px-4 py-2 rounded-lg ${answers[question.id] ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                disabled={!answers[question.id]}
              >
                下一题
                <ChevronRight className="w-5 h-5 inline ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 px-6 py-8">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-gray-500">
              第 {currentQuestion + 1} / {totalQuestions} 题
            </div>
            <div className="text-sm text-gray-500">
              维度 {currentDimension} / {totalDimensions}
            </div>
          </div>
          
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-gray-700">{question.scenario}</p>
          </div>
          
          {/* 录音按钮 */}
          <div className="flex flex-col items-center mb-8">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold ${isRecording ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}
            >
              {isRecording ? '⏹ 停止' : '🎙️ 开始'}
            </button>
            {isRecording && (
              <div className="mt-4 text-xl font-mono">
                {formatTime(recordingTime)}
              </div>
            )}
          </div>
          
          {/* 识别结果 */}
          {transcript && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">识别结果：</h3>
              <p className="text-gray-800">{transcript}</p>
              <div className="mt-2 text-sm text-gray-500">
                单词数：{wordCount} | 录音时长：{formatTime(recordingTime)}
              </div>
              {score && (
                <div className="mt-2 text-sm font-medium text-blue-600">
                  得分：{score} 分
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-between">
            <button 
              onClick={onPrev}
              className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100"
            >
              <ChevronLeft className="w-5 h-5" />
              上一题
            </button>
            <button 
              onClick={onNext}
              className={`px-4 py-2 rounded-lg ${score ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              disabled={!score}
            >
              下一题
              <ChevronRight className="w-5 h-5 inline ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}