import { useState, useEffect } from 'react'
import TaskLayout from '../../components/TaskLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'

const Task3 = () => {
  // 步骤完成状态
  const [step1Completed, setStep1Completed] = useState(false)
  const [step2Completed, setStep2Completed] = useState(false)
  const [step3Completed, setStep3Completed] = useState(false)

  // 步骤1：市场轮播
  const [currentMarketIndex, setCurrentMarketIndex] = useState(0)
  
  // 步骤2：选择的市场
  const [selectedMarkets, setSelectedMarkets] = useState([])

  // 市场数据
  const markets = [
    {
      id: 'north-america',
      name: '北美',
      emoji: '🇺🇸',
      description: '北美地区，特别是美国和加拿大，是全球科技和金融的中心。这里拥有众多世界顶级的科技公司和金融机构，提供极具竞争力的薪资待遇。技术氛围浓厚，创新能力强，但同时竞争也非常激烈。',
      salary: '15-30K USD/月',
      visaDifficulty: 4, // 1-5星
      livingCost: 4, // 1-5星
      friendliness: 3 // 1-5星
    },
    {
      id: 'europe',
      name: '欧洲',
      emoji: '🇪🇺',
      description: '欧洲地区包括英国、德国、法国等发达国家。这里的工作生活平衡非常好，福利待遇完善，文化多元，历史悠久。薪资水平虽然略低于北美，但生活质量高，社会福利好。',
      salary: '8-15K EUR/月',
      visaDifficulty: 3,
      livingCost: 3,
      friendliness: 4
    },
    {
      id: 'japan',
      name: '日本',
      emoji: '🇯🇵',
      description: '日本距离中国近，文化有相似之处，生活便利。日本的科技产业发达，特别是在制造业和IT领域。但日本对语言要求较高，需要一定的日语能力。工作环境注重细节和团队合作。',
      salary: '80-150K JPY/月',
      visaDifficulty: 3,
      livingCost: 4,
      friendliness: 4
    },
    {
      id: 'southeast-asia',
      name: '东南亚',
      emoji: '🇸🇬',
      description: '东南亚地区包括新加坡、马来西亚、泰国等国家。这里机会多，文化相近，生活成本相对较低，性价比高。特别是新加坡，作为亚洲金融中心，吸引了众多国际企业，薪资水平也相对较高。',
      salary: '5-15K SGD/月',
      visaDifficulty: 2,
      livingCost: 2,
      friendliness: 5
    }
  ]

  // 步骤1：处理轮播
  const handlePrevMarket = () => {
    setCurrentMarketIndex(prev => (prev === 0 ? markets.length - 1 : prev - 1))
  }

  const handleNextMarket = () => {
    setCurrentMarketIndex(prev => (prev === markets.length - 1 ? 0 : prev + 1))
  }

  // 步骤1：检查是否浏览完所有市场
  useEffect(() => {
    // 简单模拟：当用户浏览到最后一个市场时，标记步骤1为完成
    if (currentMarketIndex === markets.length - 1) {
      setStep1Completed(true)
    }
  }, [currentMarketIndex])

  // 步骤2：处理市场选择
  const handleMarketToggle = (id) => {
    setSelectedMarkets(prev => {
      if (prev.includes(id)) {
        const newSelected = prev.filter(item => item !== id)
        setStep2Completed(newSelected.length > 0 && newSelected.length <= 2)
        return newSelected
      } else {
        if (prev.length >= 2) return prev // 最多选择2个
        const newSelected = [...prev, id]
        setStep2Completed(newSelected.length > 0 && newSelected.length <= 2)
        return newSelected
      }
    })
  }

  // 步骤3：生成总结
  const generateSummary = () => {
    if (selectedMarkets.length === 0) {
      return '请选择你最想去的地区'
    }

    const selectedMarketNames = selectedMarkets.map(id => {
      const market = markets.find(m => m.id === id)
      return market ? market.name : ''
    }).join('和')

    return `你的目标是前往${selectedMarketNames}，这是一个很棒的选择！在这里，你将有机会体验不同的文化，提升自己的专业能力，开启新的职业篇章。`
  }

  // 步骤2完成后，步骤3自动完成
  useEffect(() => {
    if (step2Completed) {
      setStep3Completed(true)
    }
  }, [step2Completed])

  // 检查是否所有步骤都完成
  const allStepsCompleted = step1Completed && step2Completed && step3Completed

  // 渲染星级评分
  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, index) => (
      <span key={index} className={index < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ))
  }

  return (
    <TaskLayout taskId={3} taskTitle="选择目标市场" canComplete={allStepsCompleted}>
      <div className="space-y-6">
        {/* 任务描述 */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-blue-700 text-sm">
            了解不同海外市场的特点，选择最适合你的目标
          </p>
        </div>

        {/* 步骤1：市场介绍 */}
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
            <h3 className="font-medium text-gray-800">热门出海目的地</h3>
          </div>
          <div className="p-4">
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <button 
                  onClick={handlePrevMarket}
                  className="p-2 rounded-full bg-gray-100 text-gray-600"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={handleNextMarket}
                  className="p-2 rounded-full bg-gray-100 text-gray-600"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentMarketIndex}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{markets[currentMarketIndex].emoji}</span>
                    <h4 className="text-xl font-bold text-gray-800">{markets[currentMarketIndex].name}</h4>
                  </div>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {markets[currentMarketIndex].description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">平均薪资范围</span>
                      <span className="text-gray-700 font-medium">{markets[currentMarketIndex].salary}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">签证难度</span>
                      <div className="flex gap-1">
                        {renderStars(markets[currentMarketIndex].visaDifficulty)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">生活成本</span>
                      <div className="flex gap-1">
                        {renderStars(markets[currentMarketIndex].livingCost)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-sm">中国人友好度</span>
                      <div className="flex gap-1">
                        {renderStars(markets[currentMarketIndex].friendliness)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
              <div className="flex justify-center mt-4 gap-2">
                {markets.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentMarketIndex(index)}
                    className={`w-2 h-2 rounded-full ${index === currentMarketIndex ? 'bg-purple-500' : 'bg-gray-300'}`}
                  />
                ))}
              </div>
            </div>
            {step1Completed && (
              <div className="mt-4 flex items-center text-green-500 text-sm">
                <CheckCircle size={14} className="mr-1" />
                已浏览完所有市场
              </div>
            )}
          </div>
        </motion.div>

        {/* 步骤2：选择目标 */}
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
            <h3 className="font-medium text-gray-800">选择你最想去的地区（选1-2个）</h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {markets.map(market => (
                <motion.button
                  key={market.id}
                  className={`w-full p-4 rounded-lg border ${selectedMarkets.includes(market.id) ? 'border-purple-400 bg-purple-50' : 'border-gray-200'} flex items-center gap-3 transition-all duration-200`}
                  onClick={() => handleMarketToggle(market.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-2xl">{market.emoji}</span>
                  <div>
                    <h4 className="font-medium text-gray-800">{market.name}</h4>
                    <p className="text-gray-500 text-sm">{market.salary}</p>
                  </div>
                </motion.button>
              ))}
            </div>
            {step2Completed && (
              <div className="mt-4 flex items-center text-green-500 text-sm">
                <CheckCircle size={14} className="mr-1" />
                已选择 {selectedMarkets.length} 个地区
              </div>
            )}
          </div>
        </motion.div>

        {/* 步骤3：阶段总结 */}
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
            <h3 className="font-medium text-gray-800">你的出海画像</h3>
          </div>
          <div className="p-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-blue-700 leading-relaxed">
                {generateSummary()}
              </p>
            </div>
            {step3Completed && (
              <div className="mt-4 flex items-center text-green-500 text-sm">
                <CheckCircle size={14} className="mr-1" />
                阶段总结已完成
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </TaskLayout>
  )
}

export default Task3
