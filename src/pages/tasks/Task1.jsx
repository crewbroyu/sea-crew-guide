import { useState, useEffect } from 'react'
import TaskLayout from '../../components/TaskLayout'
import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

const Task1 = () => {
  // 步骤完成状态
  const [step1Completed, setStep1Completed] = useState(false)
  const [step2Completed, setStep2Completed] = useState(false)
  const [step3Completed, setStep3Completed] = useState(false)

  // 步骤2的选择
  const [selectedMotivations, setSelectedMotivations] = useState([])
  
  // 步骤3的宣言
  const [declaration, setDeclaration] = useState('')

  // 动机选项
  const motivationOptions = [
    { id: 1, emoji: '💰', text: '更好的薪资待遇' },
    { id: 2, emoji: '🚀', text: '技术能力成长' },
    { id: 3, emoji: '🌍', text: '体验不同文化' },
    { id: 4, emoji: '👨‍👩‍👧‍👦', text: '为家人创造更好条件' },
    { id: 5, emoji: '🎯', text: '职业发展突破' },
    { id: 6, emoji: '✨', text: '挑战自我，走出舒适区' }
  ]

  // 步骤1：3秒后自动完成
  useEffect(() => {
    const timer = setTimeout(() => {
      setStep1Completed(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  // 步骤2：处理动机选择
  const handleMotivationToggle = (id) => {
    setSelectedMotivations(prev => {
      if (prev.includes(id)) {
        const newSelected = prev.filter(item => item !== id)
        setStep2Completed(newSelected.length > 0)
        return newSelected
      } else {
        const newSelected = [...prev, id]
        setStep2Completed(newSelected.length > 0)
        return newSelected
      }
    })
  }

  // 步骤3：处理宣言输入
  const handleDeclarationChange = (e) => {
    const value = e.target.value
    setDeclaration(value)
    setStep3Completed(value.length >= 10)
  }

  // 检查是否所有步骤都完成
  const allStepsCompleted = step1Completed && step2Completed && step3Completed

  return (
    <TaskLayout taskId={1} taskTitle="明确出海动机" canComplete={allStepsCompleted}>
      <div className="space-y-6">
        {/* 任务描述 */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-blue-700 text-sm">
            思考你为什么想要出海工作，找到你的核心驱动力
          </p>
        </div>

        {/* 步骤1：阅读引导 */}
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
            <h3 className="font-medium text-gray-800">为什么要出海？</h3>
          </div>
          <div className="p-4">
            <p className="text-gray-600 leading-relaxed mb-4">
              出海工作是许多人的职业选择，它不仅意味着薪资的提升，更是一次全面的人生体验。海外的工作环境通常能提供更具竞争力的薪酬待遇，让你更快实现经济目标。同时，在国际化的团队中工作，你将接触到前沿的技术和工作方式，加速个人技术能力的成长。
            </p>
            <p className="text-gray-600 leading-relaxed">
              此外，出海还能让你体验不同的文化和生活方式，开阔视野，丰富人生阅历。许多人选择出海是为了给家人创造更好的生活条件，或者寻求职业发展的新突破。无论你的动机是什么，找到那个最能驱动你的核心原因，将成为你坚持下去的动力。
            </p>
            {step1Completed && (
              <div className="mt-4 flex items-center text-green-500 text-sm">
                <CheckCircle size={14} className="mr-1" />
                已完成阅读
              </div>
            )}
          </div>
        </motion.div>

        {/* 步骤2：选择动机 */}
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
            <h3 className="font-medium text-gray-800">选择最打动你的理由（可多选）</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {motivationOptions.map(option => (
                <motion.button
                  key={option.id}
                  className={`p-3 rounded-lg border ${selectedMotivations.includes(option.id) ? 'border-purple-400 bg-purple-50' : 'border-gray-200'} flex items-center gap-2 transition-all duration-200`}
                  onClick={() => handleMotivationToggle(option.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-xl">{option.emoji}</span>
                  <span className="text-gray-700">{option.text}</span>
                </motion.button>
              ))}
            </div>
            {step2Completed && (
              <div className="mt-4 flex items-center text-green-500 text-sm">
                <CheckCircle size={14} className="mr-1" />
                已选择 {selectedMotivations.length} 个理由
              </div>
            )}
          </div>
        </motion.div>

        {/* 步骤3：写下宣言 */}
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
            <h3 className="font-medium text-gray-800">用一句话描述你出海的决心</h3>
          </div>
          <div className="p-4">
            <textarea
              value={declaration}
              onChange={handleDeclarationChange}
              placeholder="例如：我要在2025年拿到海外offer，开启新的人生篇章！"
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={4}
            />
            <div className="mt-2 text-right text-gray-500 text-sm">
              {declaration.length}/10
            </div>
            {step3Completed && (
              <div className="mt-4 flex items-center text-green-500 text-sm">
                <CheckCircle size={14} className="mr-1" />
                宣言已完成
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </TaskLayout>
  )
}

export default Task1
