import { useState, useEffect } from 'react'
import TaskLayout from '../../components/TaskLayout'
import { motion } from 'framer-motion'
import { CheckCircle, Star } from 'lucide-react'

const Task2 = () => {
  // 步骤完成状态
  const [step1Completed, setStep1Completed] = useState(false)
  const [step2Completed, setStep2Completed] = useState(false)
  const [step3Completed, setStep3Completed] = useState(false)

  // 步骤1的评分
  const [ratings, setRatings] = useState({
    english: 0,
    skills: 0,
    experience: 0,
    communication: 0,
    pressure: 0
  })

  // 步骤3的选择
  const [selectedImprovements, setSelectedImprovements] = useState([])

  // 能力维度
  const dimensions = [
    { id: 'english', name: '英语能力', emoji: '🗣️' },
    { id: 'skills', name: '专业技能', emoji: '💻' },
    { id: 'experience', name: '项目经验', emoji: '📁' },
    { id: 'communication', name: '沟通协作', emoji: '🤝' },
    { id: 'pressure', name: '抗压能力', emoji: '💪' }
  ]

  // 步骤1：处理评分
  const handleRatingChange = (dimension, value) => {
    setRatings(prev => {
      const newRatings = { ...prev, [dimension]: value }
      // 检查是否所有维度都已评分
      const allRated = Object.values(newRatings).every(rating => rating > 0)
      setStep1Completed(allRated)
      return newRatings
    })
  }

  // 步骤2：生成建议
  const getSuggestions = () => {
    const suggestions = []
    
    if (ratings.english <= 2) {
      suggestions.push('英语是出海的基础，建议优先提升英语水平')
    }
    
    if (ratings.skills >= 4) {
      suggestions.push('你的专业技能很强，这是出海的最大优势')
    }
    
    if (ratings.experience <= 2) {
      suggestions.push('建议积累更多项目经验，提升实战能力')
    }
    
    if (ratings.communication <= 2) {
      suggestions.push('良好的沟通能力对出海工作至关重要，建议加强')
    }
    
    if (ratings.pressure <= 2) {
      suggestions.push('出海工作可能面临较大压力，建议培养抗压能力')
    }
    
    return suggestions
  }

  // 步骤1完成后，步骤2自动完成
  useEffect(() => {
    if (step1Completed) {
      setStep2Completed(true)
    }
  }, [step1Completed])

  // 步骤3：生成提升选项
  const getImprovementOptions = () => {
    // 找出评分最低的维度
    const sortedDimensions = [...dimensions].sort((a, b) => ratings[a.id] - ratings[b.id])
    return sortedDimensions.slice(0, 3).map(dim => ({
      id: dim.id,
      name: dim.name,
      emoji: dim.emoji
    }))
  }

  // 步骤3：处理提升选项选择
  const handleImprovementToggle = (id) => {
    setSelectedImprovements(prev => {
      if (prev.includes(id)) {
        const newSelected = prev.filter(item => item !== id)
        setStep3Completed(newSelected.length > 0 && newSelected.length <= 2)
        return newSelected
      } else {
        if (prev.length >= 2) return prev // 最多选择2个
        const newSelected = [...prev, id]
        setStep3Completed(newSelected.length > 0 && newSelected.length <= 2)
        return newSelected
      }
    })
  }

  // 检查是否所有步骤都完成
  const allStepsCompleted = step1Completed && step2Completed && step3Completed

  return (
    <TaskLayout taskId={2} taskTitle="评估自身条件" canComplete={allStepsCompleted}>
      <div className="space-y-6">
        {/* 任务描述 */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-blue-700 text-sm">
            客观评估你目前的能力和条件，找到优势和需要提升的地方
          </p>
        </div>

        {/* 步骤1：自评打分 */}
        <motion.div 
          className={`rounded-xl border ${step1Completed ? 'border-green-200' : 'border-gray-200'} bg-white shadow-sm overflow-hidden`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className={`flex items-center p-4 ${step1Completed ? 'bg-green-50' : 'bg-gray-50'}`}>
            <div className={`relative w-8 h-8 rounded-full flex items-center justify-center mr-3 ${step1Completed ? 'bg-green-100' : 'bg-gray-100'}`}>
              {step1Completed ? (
                <CheckCircle size={16} className="text-green-500" />
              ) : (
                <span className="text-gray-500 font-medium">1</span>
              )}
            </div>
            <h3 className="font-medium text-gray-800">给自己打个分</h3>
          </div>
          <div className="p-4">
            {dimensions.map(dimension => (
              <div key={dimension.id} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{dimension.emoji}</span>
                  <span className="text-gray-700">{dimension.name}</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => handleRatingChange(dimension.id, star)}
                      className={`p-1 ${ratings[dimension.id] >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      <Star size={24} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {step1Completed && (
              <div className="mt-4 flex items-center text-green-500 text-sm">
                <CheckCircle size={14} className="mr-1" />
                已完成自评
              </div>
            )}
          </div>
        </motion.div>

        {/* 步骤2：阅读建议 */}
        <motion.div 
          className={`rounded-xl border ${step2Completed ? 'border-green-200' : 'border-gray-200'} bg-white shadow-sm overflow-hidden`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className={`flex items-center p-4 ${step2Completed ? 'bg-green-50' : 'bg-gray-50'}`}>
            <div className={`relative w-8 h-8 rounded-full flex items-center justify-center mr-3 ${step2Completed ? 'bg-green-100' : 'bg-gray-100'}`}>
              {step2Completed ? (
                <CheckCircle size={16} className="text-green-500" />
              ) : (
                <span className="text-gray-500 font-medium">2</span>
              )}
            </div>
            <h3 className="font-medium text-gray-800">根据你的自评，这里有一些建议</h3>
          </div>
          <div className="p-4">
            {step1Completed ? (
              <ul className="space-y-2">
                {getSuggestions().map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span className="text-gray-600">{suggestion}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">完成自评后，这里将显示针对你的建议</p>
            )}
            {step2Completed && (
              <div className="mt-4 flex items-center text-green-500 text-sm">
                <CheckCircle size={14} className="mr-1" />
                已阅读建议
              </div>
            )}
          </div>
        </motion.div>

        {/* 步骤3：确认行动计划 */}
        <motion.div 
          className={`rounded-xl border ${step3Completed ? 'border-green-200' : 'border-gray-200'} bg-white shadow-sm overflow-hidden`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className={`flex items-center p-4 ${step3Completed ? 'bg-green-50' : 'bg-gray-50'}`}>
            <div className={`relative w-8 h-8 rounded-full flex items-center justify-center mr-3 ${step3Completed ? 'bg-green-100' : 'bg-gray-100'}`}>
              {step3Completed ? (
                <CheckCircle size={16} className="text-green-500" />
              ) : (
                <span className="text-gray-500 font-medium">3</span>
              )}
            </div>
            <h3 className="font-medium text-gray-800">选择你最想先提升的方面（选1-2个）</h3>
          </div>
          <div className="p-4">
            {step1Completed ? (
              <div className="space-y-3">
                {getImprovementOptions().map(option => (
                  <motion.button
                    key={option.id}
                    className={`w-full p-3 rounded-lg border ${selectedImprovements.includes(option.id) ? 'border-purple-400 bg-purple-50' : 'border-gray-200'} flex items-center gap-3 transition-all duration-200`}
                    onClick={() => handleImprovementToggle(option.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-xl">{option.emoji}</span>
                    <span className="text-gray-700">{option.name}</span>
                  </motion.button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">完成自评后，这里将显示你可以提升的方面</p>
            )}
            {step3Completed && (
              <div className="mt-4 flex items-center text-green-500 text-sm">
                <CheckCircle size={14} className="mr-1" />
                已选择 {selectedImprovements.length} 个提升方面
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </TaskLayout>
  )
}

export default Task2
