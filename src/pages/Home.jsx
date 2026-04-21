import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import useAuthStore from '../store/useAuthStore'
import { getScoreData, recordCheckin } from '../store/scoreStore'
import {
  Ship, ClipboardCheck, Map,
  Bell, ChevronRight, Anchor, Target, Award, X
} from 'lucide-react'
import ImageCarousel from '../components/ImageCarousel'
import MiniCheckin from '../components/MiniCheckin'
import pathData from '../data/pathData'

// 动态提示语函数
const getTip = (task) => {
  const tips = {
    "选择目标岗位": "选择适合自己能力的岗位，是成功登船的第一步。",
    "制作英文简历": "简历是第一印象，突出你的服务经验和英语能力。",
    "学习岗位知识": "熟悉岗位术语，能让你在面试中看起来像个老船员。",
    "AI模拟面试": "自信比语法更重要，对着镜子多开口练习。",
    "考取证件": "确保证件有效期，这决定了你能不能顺利下签。",
    "准备面试材料": "提前准备好所有材料，面试时才能从容应对。",
    "投递简历": "针对不同公司调整简历，提高通过率。",
    "等待面试通知": "保持手机畅通，及时回复招聘方的消息。",
    "准备登船材料": "仔细检查所有材料，确保没有遗漏。",
    "办理登船手续": "提前了解流程，避免临时手忙脚乱。",
    "行李准备": "根据航线和季节准备行李，不要超重。",
    "登船准备": "调整作息时间，为海上生活做好准备。"
  }
  return tips[task] || "大海在召唤，每一步任务都是你登船的阶梯。";
};

export default function Home() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const [currentTask, setCurrentTask] = useState(null)
  const [currentTaskRoute, setCurrentTaskRoute] = useState('/tasks/Task2')
  const [currentStage, setCurrentStage] = useState(null)
  const [nextTask, setNextTask] = useState(null)
  const [scoreData, setScoreData] = useState(null)
  const [targetJob, setTargetJob] = useState(null)
  const [showWechatModal, setShowWechatModal] = useState(false)

  // 获取当前任务和积分数据
  useEffect(() => {
    const progressKey = 'boarding_progress'
    const progress = JSON.parse(localStorage.getItem(progressKey) || '{}')
    
    // 扁平化所有任务
    const allTasks = pathData.flatMap(stage => stage.tasks)
    
    // 找到第一个未完成的任务
    let foundCurrentTask = null
    for (const task of allTasks) {
      if (!progress[`task${task.id}`] || !progress[`task${task.id}`].completed) {
        foundCurrentTask = task
        break
      }
    }
    
    if (foundCurrentTask) {
      setCurrentTask(foundCurrentTask)
      
      // 根据任务ID设置路由
      const taskRoutes = {
        1: '/assessment',
        2: '/tasks/Task2',
        3: '/tasks/Task3',
        4: '/tasks/phase2/Task4',
        5: '/tasks/phase2/Task5',
        6: '/tasks/phase2/Task6',
        7: '/tasks/phase2/Task7',
        8: '/tasks/phase2/Task8',
        9: '/my-offer',
        10: '/tasks/Task10',
        11: '/luggage-list',
        12: '/tasks/Task12'
      }
      
      setCurrentTaskRoute(taskRoutes[foundCurrentTask.id] || '/tasks')
      
      // 找到当前任务所在的阶段
      for (const stage of pathData) {
        if (stage.tasks.some(task => task.id === foundCurrentTask.id)) {
          setCurrentStage(stage)
          break
        }
      }
      
      // 找到下一任务
      const currentTaskIndex = allTasks.findIndex(task => task.id === foundCurrentTask.id)
      if (currentTaskIndex < allTasks.length - 1) {
        setNextTask(allTasks[currentTaskIndex + 1])
      }
    }
    
    // 获取目标岗位（从任务2结果中获取）
    const task2Result = JSON.parse(localStorage.getItem('task2_result') || '{}')
    if (task2Result.selectedTargetJob) {
      setTargetJob(task2Result.selectedTargetJob)
    } else if (task2Result.currentJob && task2Result.currentJob.length > 0) {
      setTargetJob(task2Result.currentJob[0].name)
    }
    
    // 获取积分数据
    const score = getScoreData()
    setScoreData(score)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部蓝色区域 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 pt-12 pb-20 relative">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-blue-200 text-sm">欢迎回来</p>
            <h1 className="text-white text-xl font-bold mt-1">
              {profile?.nickname || '新船员'}
            </h1>
            {/* 目标岗位 */}
            {targetJob && (
              <p className="text-white/90 text-sm mt-1">
                目标岗位：{targetJob}
              </p>
            )}
            {/* 动态提示语 */}
            <p className="text-white/90 text-sm mt-2">
              {getTip(currentTask?.title)}
            </p>
          </div>
          <button
            disabled
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center opacity-50 cursor-not-allowed"
          >
            <Bell size={20} className="text-white" />
          </button>
        </div>
      </div>

      {/* 积分系统卡片 */}
      <div className="px-6 -mt-12 relative z-10">
        <div className="bg-white rounded-2xl p-3 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-800 text-sm">积分中心</h2>
            <Award size={16} className="text-yellow-500" />
          </div>
          <div className="flex justify-between text-center">
            <div>
              <p className="text-xl font-bold text-blue-600">
                {scoreData?.totalScore || 0}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">总积分</p>
            </div>
            <div className="w-px bg-gray-200" />
            <div>
              <p className="text-xl font-bold text-green-600">
                {scoreData?.taskCompleted || 0}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">已完成任务</p>
            </div>
            <div className="w-px bg-gray-200" />
            <div>
              <p className="text-xl font-bold text-orange-500">
                {scoreData?.continuousDays || 0}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">连续打卡</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 mt-6 pb-24">
        
        {/* 每日英语打卡 */}
        <div className="mb-6">
          <MiniCheckin />
        </div>

        {/* 登船路径当前任务快捷跳转 */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800">登船路径</h3>
            <button
              onClick={() => navigate('/tasks')}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              查看全部
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            {/* 当前阶段和当前任务 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Target size={16} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">当前阶段</p>
                  <p className="font-medium text-gray-800 text-sm">{currentStage ? `${currentStage.id} / 4 ${currentStage.name}` : '1 / 4 决定出发'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">当前任务</p>
                <p className="font-medium text-gray-800 text-sm">{currentTask ? currentTask.title : '选择目标岗位'}</p>
              </div>
            </div>
            
            {/* 继续任务按钮 */}
            <button
              onClick={() => navigate(currentTaskRoute)}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors mb-3"
            >
              继续任务
            </button>
            
            {/* 下一任务 */}
            {nextTask && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">下一任务</p>
                <p className="text-sm text-gray-600">{nextTask.title}</p>
              </div>
            )}
          </div>
        </div>

        {/* 轮播模块 */}
        <div className="mb-6">
          <h3 className="font-bold text-gray-800 mb-3">船员风采</h3>
          <ImageCarousel />
        </div>

        {/* 付费咨询 */}
        <div className="mb-6">
          <h3 className="font-bold text-gray-800 mb-3">付费咨询</h3>
          <div className="grid grid-cols-3 gap-3">
            {/* 路径规划 */}
            <button
              onClick={() => setShowWechatModal(true)}
              className="bg-white rounded-xl p-3 shadow-sm text-center active:scale-[0.98] transition"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Map size={20} className="text-blue-600" />
              </div>
              <p className="font-medium text-gray-800 text-sm mb-1">路径规划</p>
              <p className="text-xs text-blue-600">点击了解</p>
            </button>
            
            {/* 面试辅导 */}
            <button
              onClick={() => setShowWechatModal(true)}
              className="bg-white rounded-xl p-3 shadow-sm text-center active:scale-[0.98] transition"
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <ClipboardCheck size={20} className="text-green-600" />
              </div>
              <p className="font-medium text-gray-800 text-sm mb-1">面试辅导</p>
              <p className="text-xs text-blue-600">点击了解</p>
            </button>
            
            {/* 全流程陪跑 */}
            <button
              onClick={() => setShowWechatModal(true)}
              className="bg-white rounded-xl p-3 shadow-sm text-center active:scale-[0.98] transition"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Ship size={20} className="text-purple-600" />
              </div>
              <p className="font-medium text-gray-800 text-sm mb-1">全流程陪跑</p>
              <p className="text-xs text-blue-600">点击了解</p>
            </button>
          </div>
        </div>
      </div>

      {/* 微信二维码弹窗 */}
      {showWechatModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">添加微信咨询</h3>
              <button
                onClick={() => setShowWechatModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="text-center mb-4">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200">
                  <img 
                    src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20profile%20photo%20of%20a%20Chinese%20man%20in%20his%2030s%2C%20business%20casual%2C%20friendly%20smile%2C%20high%20quality%20photo&image_size=square_hd" 
                    alt="微信头像" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <h4 className="text-xl font-medium text-gray-800 mb-1">薛怀南</h4>
              <p className="text-sm text-gray-500 mb-4">Perth, Australia</p>
              <div className="flex justify-center mb-4">
                <div className="w-48 h-48">
                  <img 
                    src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=WeChat%20QR%20code%20black%20and%20white%2C%20clean%20design%2C%20high%20resolution&image_size=square_hd" 
                    alt="微信二维码" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500">Scan QR code to add me</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">📞 咨询服务：</p>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• 路径规划</li>
                <li>• 面试辅导</li>
                <li>• 全流程陪跑</li>
              </ul>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}