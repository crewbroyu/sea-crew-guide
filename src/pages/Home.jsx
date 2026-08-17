import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Award,
  BookOpen,
  Building2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  GraduationCap,
  MessageSquare,
  Mic,
  Route,
  Sparkles,
  Target,
  UserCheck,
  X,
} from 'lucide-react'
import ImageCarousel from '../components/ImageCarousel'
import MiniCheckin from '../components/MiniCheckin'
import RequireLogin from '../components/RequireLogin'
import { getScoreData } from '../store/scoreStore'
import { useAccessStore } from '../store/accessStore'
import pathData from '../data/pathData'

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
  11: '/tasks/Task11',
  12: '/tasks/Task12',
}

const heroActions = [
  { label: '我适合做海乘吗', route: '/assessment', icon: UserCheck },
  { label: '查看岗位介绍', route: '/jobs', icon: ClipboardCheck },
  { label: '学习登船路径', route: '/tasks', icon: Route },
  { label: 'AI 面试练习', route: '/tasks/phase2/Task8', icon: Mic },
]

const publicLinks = [
  { label: '海乘 Wiki', description: '先了解行业和船上生活', route: '/academy/wiki', icon: BookOpen },
  { label: '岗位介绍', description: '餐饮、客房、前台等方向', route: '/jobs', icon: ClipboardCheck },
  { label: '邮轮公司', description: '了解公司和招聘渠道', route: '/jobs/company-jobs', icon: Building2 },
  { label: '英语样课', description: '试听海乘服务英语', route: '/academy/listening-speaking', icon: GraduationCap },
]

const serviceLinks = [
  {
    label: 'AI 职业顾问',
    description: '判断你更适合哪个岗位',
    icon: Sparkles,
    action: 'wechat',
  },
  {
    label: 'AI 简历优化',
    description: '把经历改成邮轮英文简历',
    icon: FileText,
    route: '/tasks/phase2/Task4',
  },
  {
    label: '1 对 1 咨询',
    description: '快速了解申请路径和准备重点',
    icon: MessageSquare,
    action: 'wechat',
  },
]

const preparationSteps = ['了解海乘', '选择岗位', '简历英语', '面试登船']

export default function Home() {
  const navigate = useNavigate()
  const { isRegistered } = useAccessStore()
  const [currentTask, setCurrentTask] = useState(null)
  const [currentTaskRoute, setCurrentTaskRoute] = useState('/tasks/Task2')
  const [currentStage, setCurrentStage] = useState(null)
  const [nextTask, setNextTask] = useState(null)
  const [scoreData, setScoreData] = useState(null)
  const [targetJob, setTargetJob] = useState(null)
  const [showWechatModal, setShowWechatModal] = useState(false)

  useEffect(() => {
    const progress = JSON.parse(localStorage.getItem('boarding_progress') || '{}')
    const allTasks = pathData.flatMap((stage) => stage.tasks)
    const foundCurrentTask = allTasks.find((task) => !progress[`task${task.id}`]?.completed)

    if (foundCurrentTask) {
      const currentTaskIndex = allTasks.findIndex((task) => task.id === foundCurrentTask.id)

      setCurrentTask(foundCurrentTask)
      setCurrentTaskRoute(taskRoutes[foundCurrentTask.id] || '/tasks')
      setCurrentStage(pathData.find((stage) => stage.tasks.some((task) => task.id === foundCurrentTask.id)) || null)
      setNextTask(currentTaskIndex < allTasks.length - 1 ? allTasks[currentTaskIndex + 1] : null)
    }

    const task2Result = JSON.parse(localStorage.getItem('task2_result') || '{}')
    if (task2Result.selectedTargetJob) {
      setTargetJob(task2Result.selectedTargetJob)
    } else if (task2Result.currentJob?.length > 0) {
      setTargetJob(task2Result.currentJob[0].name)
    }

    setScoreData(getScoreData())
  }, [])

  const handleServiceClick = (item) => {
    if (item.action === 'wechat') {
      setShowWechatModal(true)
      return
    }

    navigate(item.route)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 pt-12 pb-10">
        <div className="mb-6">
          <p className="text-blue-100 text-sm mb-2">Sea Crew Career Guide</p>
          <h1 className="text-white text-2xl font-bold leading-tight">海乘职业入门助手</h1>
          <p className="text-white/90 text-sm mt-2">了解岗位、规划路径、练英语、准备面试</p>
          {targetJob && (
            <p className="text-blue-100 text-xs mt-3">当前目标岗位：{targetJob}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {heroActions.map(({ label, route, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => navigate(route)}
              className="bg-white/12 border border-white/20 rounded-xl p-3 text-left active:scale-[0.98] transition"
            >
              <Icon size={20} className="text-white mb-2" />
              <span className="text-white text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </section>

      <main className="px-6 -mt-4 pb-24">
        <section className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-900">从 0 到登船，分 4 步准备</h2>
              <p className="text-sm text-gray-500 mt-1">
                {isRegistered ? '继续你的个人准备进度' : '先看清路径，再决定是否深入准备'}
              </p>
            </div>
            <Award size={20} className="text-yellow-500" />
          </div>

          {isRegistered ? (
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xl font-bold text-blue-600">{scoreData?.totalScore || 0}</p>
                <p className="text-xs text-gray-500 mt-0.5">总积分</p>
              </div>
              <div>
                <p className="text-xl font-bold text-green-600">{scoreData?.taskCompleted || 0}</p>
                <p className="text-xs text-gray-500 mt-0.5">完成任务</p>
              </div>
              <div>
                <p className="text-xl font-bold text-orange-500">{scoreData?.continuousDays || 0}</p>
                <p className="text-xs text-gray-500 mt-0.5">连续打卡</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {preparationSteps.map((step, index) => (
                <div key={step} className="text-center">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-sm font-bold">
                    {index + 1}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">{step}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-bold text-gray-900">你的登船准备路线</h2>
              <p className="text-sm text-gray-500 mt-1">12 个任务覆盖测评、岗位、简历、面试和登船材料</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/tasks')}
              className="text-sm text-blue-600 flex items-center gap-1"
            >
              全部
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg mb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Target size={16} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">当前阶段</p>
                  <p className="font-medium text-gray-800 text-sm">
                    {currentStage ? `${currentStage.id} / 4 ${currentStage.name}` : '1 / 4 决定出发'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">当前任务</p>
                <p className="font-medium text-gray-800 text-sm">
                  {currentTask ? currentTask.title : '选择目标岗位'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(isRegistered ? currentTaskRoute : '/tasks')}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {isRegistered ? '继续当前任务' : '查看完整路线'}
            </button>
          </div>

          {!isRegistered && (
            <div className="grid grid-cols-3 gap-2">
              {pathData[0].tasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => navigate(taskRoutes[task.id] || '/tasks')}
                  className="bg-blue-50 rounded-lg p-2 text-left"
                >
                  <p className="text-xs font-medium text-blue-700 line-clamp-2">{task.title}</p>
                </button>
              ))}
            </div>
          )}

          {isRegistered && nextTask && (
            <div className="flex items-center justify-between text-sm">
              <p className="text-gray-500">下一任务</p>
              <p className="text-gray-700">{nextTask.title}</p>
            </div>
          )}
        </section>

        <section className="mb-6">
          <h2 className="font-bold text-gray-900 mb-3">先免费了解海乘</h2>
          <div className="grid grid-cols-2 gap-3">
            {publicLinks.map(({ label, description, route, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => navigate(route)}
                className="bg-white rounded-xl p-4 shadow-sm text-left active:scale-[0.98] transition"
              >
                <Icon size={20} className="text-blue-600 mb-3" />
                <p className="font-medium text-gray-900 text-sm">{label}</p>
                <p className="text-xs text-gray-500 mt-1">{description}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="font-bold text-gray-900 mb-3">每日海乘英语练习</h2>
          <RequireLogin variant="inline">
            <MiniCheckin />
          </RequireLogin>
        </section>

        <section className="mb-6">
          <h2 className="font-bold text-gray-900 mb-3">真实海上工作场景</h2>
          <ImageCarousel />
        </section>

        <section className="mb-6">
          <h2 className="font-bold text-gray-900 mb-3">需要更具体的建议？</h2>
          <div className="space-y-3">
            {serviceLinks.map((item) => {
              const Icon = item.icon

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleServiceClick(item)}
                  className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 text-left active:scale-[0.98] transition"
                >
                  <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </button>
              )
            })}
          </div>
        </section>
      </main>

      {showWechatModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">添加微信咨询</h3>
              <button
                type="button"
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
              <h4 className="text-xl font-medium text-gray-800 mb-1">海乘顾问</h4>
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
              <p className="text-sm text-gray-500">扫码添加，获取 1 对 1 建议</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">可咨询：</p>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>· 海乘岗位选择</li>
                <li>· 英文简历和面试准备</li>
                <li>· 申请路径和时间规划</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
