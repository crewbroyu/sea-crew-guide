import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TaskLayout from '../../components/TaskLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, ChevronLeft, ChevronRight, ArrowRight, Target, DollarSign, BarChart2, Award, Zap, Shield, Clock } from 'lucide-react'

const Task3 = () => {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState('assessment') // assessment, budget, result
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [budget, setBudget] = useState(1000)
  const [result, setResult] = useState(null)
  const [canComplete, setCanComplete] = useState(false)

  // 测评题目
  const questions = [
    {
      id: 'q1',
      question: '你是否愿意自己花时间研究申请流程',
      options: [
        { text: '非常愿意', value: 2, type: 'base' },
        { text: '一般', value: 1, type: 'base' },
        { text: '不愿意', value: 0, type: 'base' }
      ]
    },
    {
      id: 'q2',
      question: '你的英语水平',
      options: [
        { text: '较弱', value: 0, type: 'base' },
        { text: '一般', value: 1, type: 'base' },
        { text: '可以交流', value: 2, type: 'base' },
        { text: '较好', value: 3, type: 'base' }
      ]
    },
    {
      id: 'q3',
      question: '你是否有服务行业经验',
      options: [
        { text: '没有', value: 0, type: 'base' },
        { text: '有一点', value: 1, type: 'base' },
        { text: '有较多经验', value: 2, type: 'base' }
      ]
    },
    {
      id: 'q4',
      question: '你是否希望有人帮你准备面试',
      options: [
        { text: '不需要', value: 0, type: 'base' },
        { text: '可以考虑', value: 1, type: 'base' },
        { text: '非常需要', value: 2, type: 'base' }
      ]
    },
    {
      id: 'q5',
      question: '你最在意的是',
      options: [
        { text: '省钱', value: 2, type: 'diy' },
        { text: '成功率', value: 2, type: 'guide' },
        { text: '速度', value: 2, type: 'agent' },
        { text: '省心', value: 2, type: 'agent' }
      ]
    },
    {
      id: 'q6',
      question: '你是否担心被中介坑',
      options: [
        { text: '非常担心', value: 2, type: 'diy' },
        { text: '一般', value: 1, type: 'guide' },
        { text: '不担心', value: 1, type: 'agent' }
      ]
    },
    {
      id: 'q7',
      question: '你是否愿意提升自己去争取更好的岗位',
      options: [
        { text: '非常愿意', value: 3, type: 'guide' },
        { text: '可以考虑', value: 2, type: 'guide' },
        { text: '不太愿意', value: 0, type: 'base' }
      ]
    }
  ]

  // 预算区间
  const budgetRanges = [
    { min: 0, max: 500, label: '0-500元', diy: 3, agent: 0, guide: 0 },
    { min: 500, max: 2000, label: '500-2000元', diy: 0, agent: 0, guide: 3 },
    { min: 2000, max: 10000, label: '2000-10000元', diy: 0, agent: 2, guide: 1 },
    { min: 10000, max: 999999, label: '10000元以上', diy: 0, agent: 3, guide: 0 }
  ]

  // 处理答案选择
  const handleAnswerSelect = (questionId, option) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: option
    }))
  }

  // 处理下一题
  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      setCurrentPage('budget')
    }
  }

  // 处理上一题
  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  // 处理预算变化
  const handleBudgetChange = (value) => {
    setBudget(value)
  }

  // 计算结果
  const calculateResult = () => {
    let diyScore = 0
    let agentScore = 0
    let guideScore = 0
    let baseScore = 0

    // 计算基础分和倾向分
    Object.values(answers).forEach(option => {
      if (option.type === 'base') {
        baseScore += option.value
      } else if (option.type === 'diy') {
        diyScore += option.value
      } else if (option.type === 'agent') {
        agentScore += option.value
      } else if (option.type === 'guide') {
        guideScore += option.value
      }
    })

    // 预算加权
    const budgetRange = budgetRanges.find(range => budget >= range.min && budget <= range.max)
    if (budgetRange) {
      diyScore += budgetRange.diy
      agentScore += budgetRange.agent
      guideScore += budgetRange.guide
    }

    // 计算总分
    const totalScore = diyScore + agentScore + guideScore
    let recommendedPath = 'diy'
    let matchPercentage = 0

    if (guideScore >= agentScore && guideScore >= diyScore) {
      recommendedPath = 'guide'
      matchPercentage = Math.round((guideScore / totalScore) * 100)
    } else if (agentScore >= guideScore && agentScore >= diyScore) {
      recommendedPath = 'agent'
      matchPercentage = Math.round((agentScore / totalScore) * 100)
    } else {
      recommendedPath = 'diy'
      matchPercentage = Math.round((diyScore / totalScore) * 100)
    }

    // 生成推荐原因
    const reasons = []
    const englishLevel = answers['q2']?.value || 0
    const willingToImprove = answers['q7']?.value || 0

    if (englishLevel >= 2) {
      reasons.push('你具备基础沟通能力')
    }
    if (willingToImprove >= 2) {
      reasons.push('你适合冲更高岗位')
    }
    if (budget >= 500 && budget <= 2000) {
      reasons.push('你的预算适合高性价比路径')
    } else if (budget < 500) {
      reasons.push('你的预算适合DIY路径')
    } else if (budget > 10000) {
      reasons.push('你的预算适合中介路径')
    }

    // 生成岗位信息
    let currentJobs = ['Bar Utility', 'Assistant']
    let potentialJobs = ['Bar Server', 'Sales Associate']
    let gaps = ['英语表达', '面试能力', '服务话术']

    if (baseScore >= 8) {
      currentJobs = ['Bar Server', 'Sales Associate']
      potentialJobs = ['Bartender', 'Guest Service']
      gaps = ['专业英语', '面试技巧', '服务意识']
    } else if (baseScore >= 5) {
      currentJobs = ['Bar Utility', 'Assistant']
      potentialJobs = ['Bar Server', 'Sales Associate']
      gaps = ['英语表达', '面试能力', '服务话术']
    } else {
      currentJobs = ['Cleaner', 'Utility']
      potentialJobs = ['Bar Utility', 'Assistant']
      gaps = ['基础英语', '服务意识', '面试准备']
    }

    setResult({
      recommendedPath,
      matchPercentage,
      reasons,
      currentJobs,
      potentialJobs,
      gaps,
      baseScore
    })

    setCurrentPage('result')
    setCanComplete(true)
  }

  // 渲染测评页
  const renderAssessmentPage = () => {
    const question = questions[currentQuestion]
    const selectedAnswer = answers[question.id]

    return (
      <div className="space-y-6">
        {/* 进度条 */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
        <div className="text-right text-sm text-gray-500">
          {currentQuestion + 1} / {questions.length}
        </div>

        {/* 题目 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h3 className="text-xl font-bold text-gray-800 mb-6">
            {question.question}
          </h3>
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <motion.button
                key={index}
                onClick={() => handleAnswerSelect(question.id, option)}
                className={`w-full p-4 rounded-lg text-left transition-all ${selectedAnswer === option
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className={`block ${selectedAnswer === option ? 'font-medium text-blue-600' : 'text-gray-700'}`}>
                  {option.text}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* 导航按钮 */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevQuestion}
            disabled={currentQuestion === 0}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${currentQuestion === 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ChevronLeft size={18} className="inline mr-2" />
            上一题
          </button>
          <button
            onClick={handleNextQuestion}
            disabled={!selectedAnswer}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${!selectedAnswer
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {currentQuestion === questions.length - 1 ? '下一步' : '下一步'}
            <ChevronRight size={18} className="inline ml-2" />
          </button>
        </div>
      </div>
    )
  }

  // 渲染预算页
  const renderBudgetPage = () => {
    const currentRange = budgetRanges.find(range => budget >= range.min && budget <= range.max)

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">设置你的预算</h3>

          {/* 预算滑块 */}
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">0元</span>
                <span className="text-sm text-gray-500">500元</span>
                <span className="text-sm text-gray-500">2000元</span>
                <span className="text-sm text-gray-500">10000元+</span>
              </div>
              <div className="relative">
                <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-200 rounded-full transform -translate-y-1/2 pointer-events-none"></div>
                <div
                  className="absolute top-1/2 left-0 h-2 bg-blue-500 rounded-full transform -translate-y-1/2 pointer-events-none"
                  style={{ width: `${(budget / 15000) * 100}%` }}
                ></div>
                <input
                  type="range"
                  min="0"
                  max="15000"
                  step="100"
                  value={budget}
                  onChange={(e) => handleBudgetChange(parseInt(e.target.value))}
                  className="relative w-full h-2 bg-transparent appearance-none cursor-pointer z-10"
                  style={{
                    background: 'transparent',
                  }}
                />
              </div>
            </div>

            {/* 预算显示 */}
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                ¥{budget.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {currentRange?.label}
              </div>
            </div>

            {/* 预算说明 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-700 text-sm">
                💡 预算将影响我们为你推荐的申请路径
              </p>
            </div>
          </div>
        </div>

        {/* 导航按钮 */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentPage('assessment')}
            className="px-6 py-3 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            <ChevronLeft size={18} className="inline mr-2" />
            返回测评
          </button>
          <button
            onClick={calculateResult}
            className="px-6 py-3 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
          >
            查看结果
            <ArrowRight size={18} className="inline ml-2" />
          </button>
        </div>
      </div>
    )
  }

  // 渲染结果页
  const renderResultPage = () => {
    if (!result) return null

    const pathInfo = {
      diy: {
        title: '纯DIY',
        description: '自己研究申请流程，节省成本',
        match: result.matchPercentage,
        cost: '低',
        speed: '中',
        job: '不稳定',
        color: 'bg-green-500'
      },
      agent: {
        title: '中介路径',
        description: '通过中介申请，快速上船',
        match: result.matchPercentage,
        cost: '高',
        speed: '快',
        job: '偏保守',
        color: 'bg-purple-500'
      },
      guide: {
        title: '能力提升型DIY',
        description: '通过指导提升能力，冲击好岗位',
        match: result.matchPercentage,
        cost: '中',
        speed: '高',
        job: '可提升',
        color: 'bg-blue-500'
      }
    }

    const recommended = pathInfo[result.recommendedPath]

    return (
      <div className="space-y-8">
        {/* 推荐结果 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800">推荐路径</h3>
              <h2 className="text-2xl font-bold text-blue-600 mt-1">{recommended.title}</h2>
            </div>
            <div className="relative w-20 h-20">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e6e6e6"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(result.matchPercentage / 100) * 283}, 283`}
                  transform="rotate(-90 50 50)"
                  style={{ transition: 'stroke-dasharray 1s ease-in-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-blue-600">{result.matchPercentage}%</span>
              </div>
            </div>
          </div>
          <p className="text-gray-600 mb-6">
            {recommended.description}
          </p>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p className="text-blue-700 font-medium">
              {result.recommendedPath === 'guide' && '不是没有好岗位，而是还不会判断哪个岗位值得尝试'}
              {result.recommendedPath === 'agent' && '通过专业中介，快速开启邮轮生涯'}
              {result.recommendedPath === 'diy' && '自己动手，丰衣足食，节省成本'}
            </p>
          </div>
        </motion.div>

        {/* 推荐原因 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4">推荐原因</h3>
          <ul className="space-y-2">
            {result.reasons.map((reason, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{reason}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* 三路线对比 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4">路径对比</h3>
          <div className="grid grid-cols-3 gap-4">
            {/* DIY */}
            <div className={`rounded-lg p-4 ${result.recommendedPath === 'diy' ? 'border-2 border-green-500 bg-green-50' : 'border border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={20} className="text-green-500" />
                <h4 className="font-bold text-gray-800">DIY</h4>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-gray-600">成本</span>
                  <span className="font-medium">低</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">上船</span>
                  <span className="font-medium">中</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">岗位</span>
                  <span className="font-medium">不稳定</span>
                </li>
              </ul>
            </div>

            {/* 中介 */}
            <div className={`rounded-lg p-4 ${result.recommendedPath === 'agent' ? 'border-2 border-purple-500 bg-purple-50' : 'border border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Shield size={20} className="text-purple-500" />
                <h4 className="font-bold text-gray-800">中介</h4>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-gray-600">成本</span>
                  <span className="font-medium">高</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">上船</span>
                  <span className="font-medium">快</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">岗位</span>
                  <span className="font-medium">偏保守</span>
                </li>
              </ul>
            </div>

            {/* 指导 */}
            <div className={`rounded-lg p-4 ${result.recommendedPath === 'guide' ? 'border-2 border-blue-500 bg-blue-50' : 'border border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Target size={20} className="text-blue-500" />
                <h4 className="font-bold text-gray-800">指导</h4>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-gray-600">成本</span>
                  <span className="font-medium">中</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">上船</span>
                  <span className="font-medium">高</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">岗位</span>
                  <span className="font-medium">可提升</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* 岗位提升提示 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4">岗位提升机会</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">当前可拿岗位</h4>
              <div className="flex flex-wrap gap-2">
                {result.currentJobs.map((job, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                    {job}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">可冲岗位</h4>
              <div className="flex flex-wrap gap-2">
                {result.potentialJobs.map((job, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 rounded-full text-sm text-blue-700">
                    {job}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">差距</h4>
              <div className="flex flex-wrap gap-2">
                {result.gaps.map((gap, index) => (
                  <span key={index} className="px-3 py-1 bg-amber-100 rounded-full text-sm text-amber-700">
                    {gap}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="space-y-3"
        >
          <button
            onClick={() => navigate('/tasks?justCompleted=3')}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            按推荐路径继续
          </button>
          <button
            className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            进入岗位提升训练
          </button>
          <button
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            查看中介方案
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <TaskLayout taskId={3} taskTitle="申请路线决策系统" canComplete={canComplete}>
      <div className="space-y-6">
        {/* 任务描述 */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-blue-700 text-sm">
            通过评估你的能力、预算和目标，为你分析哪个申请路径值得尝试
          </p>
        </div>

        {/* 页面内容 */}
        <AnimatePresence mode="wait">
          {currentPage === 'assessment' && (
            <motion.div
              key="assessment"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderAssessmentPage()}
            </motion.div>
          )}

          {currentPage === 'budget' && (
            <motion.div
              key="budget"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderBudgetPage()}
            </motion.div>
          )}

          {currentPage === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderResultPage()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 底部空间，防止内容被固定按钮遮挡 */}
        <div className="h-24"></div>
      </div>
    </TaskLayout>
  )
}

export default Task3