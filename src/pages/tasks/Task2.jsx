import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TaskLayout from '../../components/TaskLayout'
import { motion } from 'framer-motion'
import { CheckCircle, ChevronLeft, ChevronRight, AlertTriangle, Mic, Volume2, Play, Pause } from 'lucide-react'

const Task2 = () => {
  const navigate = useNavigate()
  // 步骤状态
  const [currentStep, setCurrentStep] = useState(1)
  const [testData, setTestData] = useState({
    englishScore: 0,
    experienceScore: 0,
    stressScore: 0,
    growthScore: 0,
    jobPreference: null
  })
  const [showResult, setShowResult] = useState(false)
  const [currentJob, setCurrentJob] = useState([])
  const [potentialJob, setPotentialJob] = useState([])
  const [gapAnalysis, setGapAnalysis] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [mediaRecorder, setMediaRecorder] = useState(null)

  // 英语测试场景
  const englishTestScenarios = [
    "Welcome aboard! May I see your SeaPass card and passport, please?",
    "Excuse me, could you tell me where the main dining room is located?",
    "I need to book a shore excursion for tomorrow. What options are available?",
    "Could you please help me with my cabin key? It's not working properly.",
    "I'd like to make a reservation for the specialty restaurant tonight."
  ]
  const [currentScenario, setCurrentScenario] = useState(0)
  const [recognizedText, setRecognizedText] = useState('')

  // 岗位库
  const jobLibrary = [
    {
      id: 'restaurant-assistant',
      name: 'Restaurant Assistant',
      level: 2,
      description: '餐厅助理，协助服务员工作',
      risk: '工作强度大，小费较少',
      englishRequirement: '基础'
    },
    {
      id: 'waiter',
      name: 'Waiter',
      level: 2,
      description: '餐厅服务员，直接服务客人',
      risk: '工作时间长，体力要求高',
      englishRequirement: '中级'
    },
    {
      id: 'bar-utility',
      name: 'Bar Utility',
      level: 1,
      description: '酒吧杂工，协助酒吧运营',
      risk: '上船容易，晋升慢',
      englishRequirement: '基础'
    },
    {
      id: 'bar-server',
      name: 'Bar Server',
      level: 3,
      description: '酒吧服务员，直接服务客人',
      risk: '英语要求高，需要记酒水配方',
      englishRequirement: '高级'
    },
    {
      id: 'housekeeping',
      name: 'Housekeeping',
      level: 1,
      description: '客房服务员，负责房间清洁',
      risk: '工作独立，体力要求高',
      englishRequirement: '基础'
    },
    {
      id: 'guest-service',
      name: 'Guest Service Associate',
      level: 3,
      description: '前台接待，处理客人咨询和投诉',
      risk: '英语要求高，压力大',
      englishRequirement: '高级'
    },
    {
      id: 'shop-sales',
      name: 'Shop Sales Associate',
      level: 3,
      description: '免税店销售，负责商品销售',
      risk: '有业绩压力，收入波动',
      englishRequirement: '高级'
    },
    {
      id: 'galley',
      name: 'Galley',
      level: 1,
      description: '厨房工作人员，负责餐饮制作',
      risk: '工作环境热，强度大',
      englishRequirement: '基础'
    }
  ]

  // 检查当前步骤是否完成
  const isStepComplete = () => {
    switch (currentStep) {
      case 1:
        return testData.englishScore > 0
      case 2:
        return true // 服务经验可以跳过
      case 3:
        return testData.stressScore > 0
      case 4:
        return testData.jobPreference !== null
      case 5:
        return testData.growthScore > 0
      default:
        return false
    }
  }

  // 下一步
  const handleNext = () => {
    if (!isStepComplete()) {
      alert('请先完成当前步骤')
      return
    }
    
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    } else {
      // 计算结果
      calculateResult()
      setShowResult(true)
    }
  }

  // 上一步
  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // 计算结果
  const calculateResult = () => {
    // 基础岗位：英语<40或无经验
    if (testData.englishScore < 40 || testData.experienceScore === 0) {
      const basicJobs = jobLibrary.filter(job => job.level === 1)
      setCurrentJob(basicJobs.slice(0, 2))
      setPotentialJob(jobLibrary.filter(job => job.level === 2).slice(0, 2))
    }
    // 过渡岗位：英语40-70，有一定经验
    else if (testData.englishScore >= 40 && testData.englishScore < 70) {
      const transitionJobs = jobLibrary.filter(job => job.level === 2)
      setCurrentJob(transitionJobs.slice(0, 2))
      setPotentialJob(jobLibrary.filter(job => job.level === 3).slice(0, 2))
    }
    // 高阶岗位：英语≥70，有经验，能抗压
    else if (testData.englishScore >= 70 && testData.experienceScore >= 1 && testData.stressScore >= 2) {
      const advancedJobs = jobLibrary.filter(job => job.level === 3)
      setCurrentJob(advancedJobs.slice(0, 2))
      setPotentialJob([])
    }
    
    // 差距分析
    const gaps = []
    if (testData.englishScore < 70) {
      gaps.push('英语表达不够流畅')
    }
    if (testData.experienceScore < 2) {
      gaps.push('缺少真实服务经验')
    }
    if (testData.stressScore < 2) {
      gaps.push('抗压能力需要提升')
    }
    if (testData.growthScore < 2) {
      gaps.push('成长意愿有待加强')
    }
    setGapAnalysis(gaps)
  }

  // 播放场景（TTS）
  const playScenario = () => {
    const utterance = new SpeechSynthesisUtterance(englishTestScenarios[currentScenario])
    utterance.lang = 'en-US'
    utterance.rate = 0.9
    speechSynthesis.speak(utterance)
  }

  // 英语测试：开始录音
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks = []
      
      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' })
        setAudioBlob(blob)
        
        // 模拟语音识别（实际项目中需要调用语音识别API）
        simulateSpeechRecognition()
      }
      
      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch (error) {
      console.error('录音失败:', error)
    }
  }

  // 模拟语音识别
  const simulateSpeechRecognition = () => {
    // 模拟识别结果
    const scenario = englishTestScenarios[currentScenario]
    const words = scenario.split(' ')
    const recognizedWords = words.slice(0, Math.floor(words.length * 0.8)) // 模拟80%的识别率
    const recognized = recognizedWords.join(' ')
    setRecognizedText(recognized)
    
    // 评分逻辑
    const score = calculateEnglishScore(recognized, scenario)
    setTestData(prev => ({ ...prev, englishScore: score }))
  }

  // 计算英语评分
  const calculateEnglishScore = (recognized, original) => {
    const originalWords = original.toLowerCase().split(' ')
    const recognizedWords = recognized.toLowerCase().split(' ')
    
    // 计算正确识别的单词数
    let correctCount = 0
    for (let i = 0; i < Math.min(originalWords.length, recognizedWords.length); i++) {
      if (originalWords[i] === recognizedWords[i]) {
        correctCount++
      }
    }
    
    // 计算得分（0-100）
    const score = Math.round((correctCount / originalWords.length) * 100)
    return score
  }

  // 英语测试：停止录音
  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop()
      setIsRecording(false)
    }
  }

  // 播放录音
  const playRecording = () => {
    if (audioBlob) {
      const audio = new Audio(URL.createObjectURL(audioBlob))
      audio.play()
      setIsPlaying(true)
      audio.onended = () => setIsPlaying(false)
    }
  }

  // 下一个场景
  const nextScenario = () => {
    if (currentScenario < englishTestScenarios.length - 1) {
      setCurrentScenario(currentScenario + 1)
      setRecognizedText('')
      setAudioBlob(null)
    }
  }

  // 上一个场景
  const prevScenario = () => {
    if (currentScenario > 0) {
      setCurrentScenario(currentScenario - 1)
      setRecognizedText('')
      setAudioBlob(null)
    }
  }

  // 步骤1：英语能力测试
  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-xl font-bold text-gray-900 mb-6">英语能力测试</h2>
      <p className="text-gray-600 mb-8">请听下面的英语句子，然后跟读录音</p>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="font-medium text-gray-800 mb-3">测试场景 {currentScenario + 1}/{englishTestScenarios.length}</h3>
          <p className="text-lg text-white mb-4">{englishTestScenarios[currentScenario]}</p> {/* 文字设置为白色，隐藏 */}
          <button
            onClick={playScenario}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <Volume2 size={18} />
            播放场景
          </button>
        </div>
        
        <div className="mb-6">
          <h3 className="font-medium text-gray-800 mb-3">跟读录音</h3>
          <div className="flex gap-3">
            {!isRecording && !audioBlob ? (
              <button
                onClick={startRecording}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Mic size={18} />
                开始录音
              </button>
            ) : isRecording ? (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <Mic size={18} />
                停止录音
              </button>
            ) : (
              <button
                onClick={playRecording}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                播放录音
              </button>
            )}
          </div>
        </div>
        
        {recognizedText && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">识别结果</h4>
            <p className="text-blue-700">{recognizedText}</p>
          </div>
        )}
        
        {testData.englishScore > 0 && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-800 mb-2">评分结果</h3>
            <p className="text-green-700">英语水平评分：{testData.englishScore}/100</p>
            <p className="text-green-700 mt-1">
              {testData.englishScore < 40 && '英语基础弱，适合后厨/utility岗位'}
              {testData.englishScore >= 40 && testData.englishScore < 70 && '可基本沟通，适合assistant/过渡岗位'}
              {testData.englishScore >= 70 && '可流畅沟通，适合前台/销售/server岗位'}
            </p>
          </div>
        )}
        
        <div className="mt-6 flex justify-between">
          <button
            onClick={prevScenario}
            disabled={currentScenario === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentScenario === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            上一个场景
          </button>
          <button
            onClick={nextScenario}
            disabled={currentScenario === englishTestScenarios.length - 1}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentScenario === englishTestScenarios.length - 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            下一个场景
          </button>
        </div>
      </div>
    </motion.div>
  )

  // 步骤2：服务环境经验
  const [experienceOptions, setExperienceOptions] = useState({
    restaurant: false,
    foreign: false,
    sales: false,
    peak: false
  })
  const [noExperience, setNoExperience] = useState(false)
  
  useEffect(() => {
    if (noExperience) {
      setTestData(prev => ({ ...prev, experienceScore: 0 }))
    } else {
      const selectedCount = Object.values(experienceOptions).filter(Boolean).length
      let score = 0
      if (selectedCount === 0) score = 0
      else if (selectedCount <= 2) score = 1
      else score = 2
      setTestData(prev => ({ ...prev, experienceScore: score }))
    }
  }, [experienceOptions, noExperience])
  
  const handleNoExperienceChange = (checked) => {
    setNoExperience(checked)
    if (checked) {
      setExperienceOptions({
        restaurant: false,
        foreign: false,
        sales: false,
        peak: false
      })
    }
  }
  
  const handleExperienceChange = (key, checked) => {
    if (noExperience) return
    setExperienceOptions(prev => ({ ...prev, [key]: checked }))
  }
  
  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-xl font-bold text-gray-900 mb-6">服务环境经验</h2>
      <p className="text-gray-600 mb-8">你是否有以下经验</p>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* 无相关经验选项 */}
        <div className={`flex items-center gap-3 mb-4 p-3 rounded-lg ${noExperience ? 'bg-red-50 border-2 border-red-300' : 'bg-gray-50 border border-gray-200'}`}>
          <input
            type="checkbox"
            id="no-experience"
            checked={noExperience}
            onChange={(e) => handleNoExperienceChange(e.target.checked)}
            className="w-4 h-4 text-purple-600"
          />
          <label htmlFor="no-experience" className={`font-medium ${noExperience ? 'text-red-700' : 'text-gray-700'}`}>
            无相关经验
          </label>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <p className="text-gray-500 text-sm mb-4">有以下经验（可多选）</p>
          <div className="space-y-4">
            <div className={`flex items-center gap-3 ${noExperience ? 'opacity-50' : ''}`}>
              <input
                type="checkbox"
                id="experience-restaurant"
                checked={experienceOptions.restaurant}
                onChange={(e) => handleExperienceChange('restaurant', e.target.checked)}
                disabled={noExperience}
                className="w-4 h-4 text-purple-600"
              />
              <label htmlFor="experience-restaurant" className="text-gray-700">在餐厅/酒吧直接服务客人</label>
            </div>
            <div className={`flex items-center gap-3 ${noExperience ? 'opacity-50' : ''}`}>
              <input
                type="checkbox"
                id="experience-foreign"
                checked={experienceOptions.foreign}
                onChange={(e) => handleExperienceChange('foreign', e.target.checked)}
                disabled={noExperience}
                className="w-4 h-4 text-purple-600"
              />
              <label htmlFor="experience-foreign" className="text-gray-700">接待过外国顾客</label>
            </div>
            <div className={`flex items-center gap-3 ${noExperience ? 'opacity-50' : ''}`}>
              <input
                type="checkbox"
                id="experience-sales"
                checked={experienceOptions.sales}
                onChange={(e) => handleExperienceChange('sales', e.target.checked)}
                disabled={noExperience}
                className="w-4 h-4 text-purple-600"
              />
              <label htmlFor="experience-sales" className="text-gray-700">做过销售（有业绩要求）</label>
            </div>
            <div className={`flex items-center gap-3 ${noExperience ? 'opacity-50' : ''}`}>
              <input
                type="checkbox"
                id="experience-peak"
                checked={experienceOptions.peak}
                onChange={(e) => handleExperienceChange('peak', e.target.checked)}
                disabled={noExperience}
                className="w-4 h-4 text-purple-600"
              />
              <label htmlFor="experience-peak" className="text-gray-700">经历过高峰期高强度工作（如翻台）</label>
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-800 mb-2">经验评分</h3>
          <p className="text-blue-700">
            {testData.experienceScore === 0 && '无相关经验'}
            {testData.experienceScore === 1 && '有一定服务经验'}
            {testData.experienceScore === 2 && '有丰富服务经验'}
          </p>
        </div>
      </div>
    </motion.div>
  )

  // 步骤3：抗压 & 体力测试
  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-xl font-bold text-gray-900 mb-6">抗压 & 体力测试</h2>
      <p className="text-gray-600 mb-8">你是否能接受以下情况</p>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-4 mb-6">
          <p className="text-gray-700">• 每天站立 8–10 小时</p>
          <p className="text-gray-700">• 连续工作 7 天无休</p>
          <p className="text-gray-700">• 高峰期被客人催促或投诉</p>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={() => setTestData(prev => ({ ...prev, stressScore: 3 }))}
            className={`w-full p-4 rounded-lg text-left transition-colors ${testData.stressScore === 3 ? 'bg-blue-50 border-2 border-blue-500' : 'bg-white border border-gray-200 hover:border-blue-300'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${testData.stressScore === 3 ? 'bg-blue-500 text-white' : 'border border-gray-300'}`}>
                {testData.stressScore === 3 && <CheckCircle size={12} />}
              </div>
              <span>全部可以接受</span>
            </div>
          </button>
          <button
            onClick={() => setTestData(prev => ({ ...prev, stressScore: 2 }))}
            className={`w-full p-4 rounded-lg text-left transition-colors ${testData.stressScore === 2 ? 'bg-blue-50 border-2 border-blue-500' : 'bg-white border border-gray-200 hover:border-blue-300'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${testData.stressScore === 2 ? 'bg-blue-500 text-white' : 'border border-gray-300'}`}>
                {testData.stressScore === 2 && <CheckCircle size={12} />}
              </div>
              <span>可以接受一部分</span>
            </div>
          </button>
          <button
            onClick={() => setTestData(prev => ({ ...prev, stressScore: 0 }))}
            className={`w-full p-4 rounded-lg text-left transition-colors ${testData.stressScore === 0 ? 'bg-blue-50 border-2 border-blue-500' : 'bg-white border border-gray-200 hover:border-blue-300'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${testData.stressScore === 0 ? 'bg-blue-500 text-white' : 'border border-gray-300'}`}>
                {testData.stressScore === 0 && <CheckCircle size={12} />}
              </div>
              <span>很难接受</span>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  )

  // 步骤4：岗位倾向
  const renderStep4 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-xl font-bold text-gray-900 mb-6">岗位倾向</h2>
      <p className="text-gray-600 mb-8">如果可以选择，你更倾向</p>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-3">
          <button
            onClick={() => setTestData(prev => ({ ...prev, jobPreference: 'stable' }))}
            className={`w-full p-4 rounded-lg text-left transition-colors ${testData.jobPreference === 'stable' ? 'bg-blue-50 border-2 border-blue-500' : 'bg-white border border-gray-200 hover:border-blue-300'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${testData.jobPreference === 'stable' ? 'bg-blue-500 text-white' : 'border border-gray-300'}`}>
                {testData.jobPreference === 'stable' && <CheckCircle size={12} />}
              </div>
              <span>先上船再说（稳定优先）</span>
            </div>
          </button>
          <button
            onClick={() => setTestData(prev => ({ ...prev, jobPreference: 'income' }))}
            className={`w-full p-4 rounded-lg text-left transition-colors ${testData.jobPreference === 'income' ? 'bg-blue-50 border-2 border-blue-500' : 'bg-white border border-gray-200 hover:border-blue-300'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${testData.jobPreference === 'income' ? 'bg-blue-500 text-white' : 'border border-gray-300'}`}>
                {testData.jobPreference === 'income' && <CheckCircle size={12} />}
              </div>
              <span>可以辛苦，但想赚更多</span>
            </div>
          </button>
          <button
            onClick={() => setTestData(prev => ({ ...prev, jobPreference: 'growth' }))}
            className={`w-full p-4 rounded-lg text-left transition-colors ${testData.jobPreference === 'growth' ? 'bg-blue-50 border-2 border-blue-500' : 'bg-white border border-gray-200 hover:border-blue-300'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${testData.jobPreference === 'growth' ? 'bg-blue-500 text-white' : 'border border-gray-300'}`}>
                {testData.jobPreference === 'growth' && <CheckCircle size={12} />}
              </div>
              <span>看重未来发展空间</span>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  )

  // 步骤5：成长意愿
  const renderStep5 = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-xl font-bold text-gray-900 mb-6">成长意愿</h2>
      <p className="text-gray-600 mb-8">你是否愿意为了更好的岗位进行额外训练</p>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-3">
          <button
            onClick={() => setTestData(prev => ({ ...prev, growthScore: 3 }))}
            className={`w-full p-4 rounded-lg text-left transition-colors ${testData.growthScore === 3 ? 'bg-blue-50 border-2 border-blue-500' : 'bg-white border border-gray-200 hover:border-blue-300'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${testData.growthScore === 3 ? 'bg-blue-500 text-white' : 'border border-gray-300'}`}>
                {testData.growthScore === 3 && <CheckCircle size={12} />}
              </div>
              <span>非常愿意</span>
            </div>
          </button>
          <button
            onClick={() => setTestData(prev => ({ ...prev, growthScore: 2 }))}
            className={`w-full p-4 rounded-lg text-left transition-colors ${testData.growthScore === 2 ? 'bg-blue-50 border-2 border-blue-500' : 'bg-white border border-gray-200 hover:border-blue-300'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${testData.growthScore === 2 ? 'bg-blue-500 text-white' : 'border border-gray-300'}`}>
                {testData.growthScore === 2 && <CheckCircle size={12} />}
              </div>
              <span>可以尝试</span>
            </div>
          </button>
          <button
            onClick={() => setTestData(prev => ({ ...prev, growthScore: 0 }))}
            className={`w-full p-4 rounded-lg text-left transition-colors ${testData.growthScore === 0 ? 'bg-blue-50 border-2 border-blue-500' : 'bg-white border border-gray-200 hover:border-blue-300'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${testData.growthScore === 0 ? 'bg-blue-500 text-white' : 'border border-gray-300'}`}>
                {testData.growthScore === 0 && <CheckCircle size={12} />}
              </div>
              <span>不太愿意</span>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  )

  // 目标岗位选择状态
  const [showJobSelector, setShowJobSelector] = useState(false)
  const [selectedTargetJob, setSelectedTargetJob] = useState('')
  
  // 邮轮基础职位（按部门分组）
  const cruiseJobs = [
    {
      department: '餐饮部门',
      jobs: [
        'Restaurant Assistant',
        'Waiter/Waitress',
        'Buffet Attendant',
        'Bar Utility',
        'Bar Server',
        'Bartender'
      ]
    },
    {
      department: '客房部门',
      jobs: [
        'Housekeeping',
        'Cabin Steward/Stewardess',
        'Suite Steward/Stewardess',
        'Laundry Attendant'
      ]
    },
    {
      department: '前台部门',
      jobs: [
        'Guest Service Associate',
        'Receptionist',
        'Concierge',
        'Shore Excursion Coordinator'
      ]
    },
    {
      department: '零售部门',
      jobs: [
        'Shop Sales Associate',
        'Retail Manager',
        'Art Auctioneer',
        'Jewelry Specialist'
      ]
    },
    {
      department: '娱乐部门',
      jobs: [
        'Activity Staff',
        'Youth Staff',
        'Cruise Director',
        'Entertainer',
        'Fitness Instructor',
        'Spa Therapist'
      ]
    },
    {
      department: '厨房部门',
      jobs: [
        'Galley',
        'Cook',
        'Chef De Partie',
        'Pastry Chef',
        'Kitchen Steward'
      ]
    },
    {
      department: '技术/后勤部门',
      jobs: [
        'Cleaner',
        'Utility',
        'Security Officer',
        'IT Technician',
        'Engine Room Staff'
      ]
    }
  ]

  // 结果页
  const renderResult = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-xl font-bold text-gray-900 mb-6">测评结果</h2>
      
      {/* 顶部结果 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="mb-6">
          <h3 className="font-bold text-gray-800 mb-3">🎯 当前最匹配岗位</h3>
          <div className="space-y-3">
            {currentJob.map((job, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">{job.name}</h4>
                  <p className="text-sm text-gray-600">{job.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {potentialJob.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-800 mb-3">🚀 可冲岗位</h3>
            <div className="space-y-3">
              {potentialJob.map((job, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{job.name}</h4>
                    <p className="text-sm text-gray-600">{job.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* 一句话总结 */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-amber-800 mb-2">一句话总结</h3>
        <p className="text-amber-700">
          {testData.englishScore < 40 && '你目前英语基础较弱，建议从基础岗位开始，通过学习提升后再考虑更高岗位。'}
          {testData.englishScore >= 40 && testData.englishScore < 70 && '你目前具备基础能力，但通过提升可以进入更高岗位。'}
          {testData.englishScore >= 70 && '你具备良好的英语能力，可以挑战更高阶的岗位。'}
        </p>
      </div>
      
      {/* 差距分析 */}
      {gapAnalysis.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="font-bold text-gray-800 mb-3">差距分析</h3>
          <div className="space-y-2">
            {gapAnalysis.map((gap, index) => (
              <div key={index} className="flex items-center gap-2 text-gray-700">
                <AlertTriangle size={16} className="text-yellow-500 flex-shrink-0" />
                <span>{gap}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 岗位风险提示 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="font-bold text-gray-800 mb-3">岗位风险提示</h3>
        <div className="space-y-4">
          {currentJob.map((job, index) => (
            <div key={index} className="p-3 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">{job.name}</h4>
              <p className="text-sm text-gray-600">• {job.risk}</p>
              <p className="text-sm text-gray-600">• 英语要求：{job.englishRequirement}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* 目标岗位选择 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <button
          onClick={() => setShowJobSelector(!showJobSelector)}
          className="w-full flex items-center justify-between py-3 px-4 bg-gray-50 border border-gray-200 rounded-lg font-medium hover:bg-gray-100 transition-colors"
        >
          <span>我有自己的目标岗位</span>
          <ChevronRight size={18} className={`transition-transform ${showJobSelector ? 'rotate-90' : ''}`} />
        </button>
        
        {showJobSelector && (
          <div className="mt-4 max-h-80 overflow-y-auto">
            <div className="space-y-4">
              {cruiseJobs.map((department, deptIndex) => (
                <div key={deptIndex}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-px h-5 bg-gray-300 flex-shrink-0"></div>
                    <h4 className="font-medium text-gray-700">{department.department}</h4>
                    <div className="flex-grow h-px bg-gray-300"></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4">
                    {department.jobs.map((job, jobIndex) => (
                      <div key={jobIndex} className="flex items-center gap-3">
                        <input
                          type="radio"
                          id={`target-job-${deptIndex}-${jobIndex}`}
                          name="targetJob"
                          value={job}
                          checked={selectedTargetJob === job}
                          onChange={(e) => setSelectedTargetJob(e.target.value)}
                          className="w-4 h-4 text-purple-600"
                        />
                        <label htmlFor={`target-job-${deptIndex}-${jobIndex}`} className="text-gray-700 text-sm">
                          {job}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {selectedTargetJob && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">
              已选择目标岗位：<span className="font-medium">{selectedTargetJob}</span>
            </p>
          </div>
        )}
      </div>
      
      {/* CTA按钮 */}
      <div className="space-y-4">
        <button 
          onClick={() => {
            // 保存任务结果到localStorage
            const taskResult = {
              taskId: 2,
              completedAt: new Date().toISOString(),
              testData: testData,
              currentJob: currentJob,
              potentialJob: potentialJob,
              gapAnalysis: gapAnalysis,
              selectedTargetJob: selectedTargetJob
            }
            localStorage.setItem('task2_result', JSON.stringify(taskResult))
            
            // 更新登船路径进度
            const boardingProgress = JSON.parse(localStorage.getItem('boarding_progress') || '{}')
            boardingProgress.task2 = { completed: true, completedAt: new Date().toISOString() }
            localStorage.setItem('boarding_progress', JSON.stringify(boardingProgress))
            
            // 导航到海乘学院
            navigate('/academy')
          }}
          className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
        >
          查看如何提升到更高岗位
        </button>
        <button 
          onClick={() => {
            // 保存任务结果到localStorage
            const taskResult = {
              taskId: 2,
              completedAt: new Date().toISOString(),
              testData: testData,
              currentJob: currentJob,
              potentialJob: potentialJob,
              gapAnalysis: gapAnalysis,
              selectedTargetJob: selectedTargetJob
            }
            localStorage.setItem('task2_result', JSON.stringify(taskResult))
            
            // 更新登船路径进度
            const boardingProgress = JSON.parse(localStorage.getItem('boarding_progress') || '{}')
            boardingProgress.task2 = { completed: true, completedAt: new Date().toISOString() }
            localStorage.setItem('boarding_progress', JSON.stringify(boardingProgress))
            
            // 导航到任务列表
            navigate('/tasks')
          }}
          className="w-full py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          按当前岗位继续申请路径
        </button>
      </div>
    </motion.div>
  )

  return (
    <TaskLayout taskId={2} taskTitle="岗位选择测评系统" canComplete={showResult}>
      <div className="space-y-6">
        {/* 任务描述 */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-blue-700 text-sm">
            这个模块的目标不是兴趣测试，而是：判断用户当前能力可以拿什么岗位，告诉用户"可以够一够"的更高岗位。
          </p>
        </div>

        {/* 步骤内容 */}
        {!showResult ? (
          <>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}

            {/* 步骤导航 */}
            <div className="flex justify-between mt-8 mb-16">
              <button
                onClick={handlePrev}
                disabled={currentStep === 1}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${currentStep === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-1">
                  <ChevronLeft size={16} />
                  上一步
                </div>
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <div className="flex items-center gap-1">
                  {currentStep < 5 ? '下一步' : '查看结果'}
                  {currentStep < 5 && <ChevronRight size={16} />}
                </div>
              </button>
            </div>
          </>
        ) : (
          renderResult()
        )}

        {/* 底部空间，防止内容被固定按钮遮挡 */}
        <div className="h-32"></div>
      </div>
    </TaskLayout>
  )
}

export default Task2
