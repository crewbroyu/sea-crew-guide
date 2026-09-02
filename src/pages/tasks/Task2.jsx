import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Target,
} from 'lucide-react'
import TaskLayout from '../../components/TaskLayout'
import { syncLocalPathProfile } from '../../services/userPathService'

const jobLibrary = [
  {
    id: 'housekeeping',
    name: 'Housekeeping',
    level: 1,
    description: '客房服务岗位，适合英语基础较弱但能接受体力工作的申请者。',
    risk: '体力消耗较大，工作节奏稳定但重复度高。',
    englishRequirement: '基础',
    fit: '适合踏实细心、能接受重复流程和体力工作的申请者。',
    preparationFocus: ['客房清洁流程', '卫生标准', '基础客人需求英语'],
  },
  {
    id: 'galley',
    name: 'Galley / Utility',
    level: 1,
    description: '厨房或后勤支持岗位，上船门槛相对低。',
    risk: '环境较辛苦，前期晋升和转岗需要主动规划。',
    englishRequirement: '基础',
    fit: '适合想先低门槛登船、能吃苦、愿意从后场岗位开始的人。',
    preparationFocus: ['安全规范', '后场协作', '体力劳动案例'],
  },
  {
    id: 'restaurant-assistant',
    name: 'Restaurant Assistant',
    level: 2,
    description: '餐厅助理岗位，适合有服务意识、英语可基础沟通的人。',
    risk: '高峰期强度较高，小费和排班存在波动。',
    englishRequirement: '中级',
    fit: '适合有餐饮、咖啡店、酒店或门店服务经验的人。',
    preparationFocus: ['点餐流程', '投诉处理', '高峰期服务案例'],
  },
  {
    id: 'bar-server',
    name: 'Bar Server',
    level: 2,
    description: '酒吧服务岗位，适合外向、能接受销售和晚班节奏的人。',
    risk: '需要记产品和酒水表达，英语与服务反应要求更高。',
    englishRequirement: '中级',
    fit: '适合外向、反应快、能接受晚班和快节奏服务的人。',
    preparationFocus: ['点单英语', '酒水基础', '高峰期压力案例'],
  },
  {
    id: 'guest-service',
    name: 'Guest Service Associate',
    level: 3,
    description: '前台宾客服务岗位，适合英语好、抗压强、能处理投诉的人。',
    risk: '客诉压力高，对英语表达、情绪稳定和系统操作要求高。',
    englishRequirement: '高级',
    fit: '适合英语较好、表达清楚、能处理投诉和跨部门沟通的人。',
    preparationFocus: ['信息确认', '投诉安抚', '跨部门沟通案例'],
  },
  {
    id: 'shop-sales',
    name: 'Retail Sales Associate',
    level: 3,
    description: '免税店销售岗位，适合有销售经验、形象表达好、目标感强的人。',
    risk: '有销售 KPI，收入可能随业绩波动。',
    englishRequirement: '高级',
    fit: '适合有销售、导购、美妆奢侈品或目标业绩经验的人。',
    preparationFocus: ['产品推荐', '销售异议处理', 'KPI 压力案例'],
  },
]

const getJobAdvice = (job, testData) => {
  const gaps = []
  if (job.englishRequirement === '高级' && testData.englishScore < 70) {
    gaps.push('英语还需要练到能连续讲经历和处理客诉。')
  }
  if (job.englishRequirement === '中级' && testData.englishScore < 40) {
    gaps.push('需要先补常见服务英语和岗位基础表达。')
  }
  if (job.level >= 2 && testData.experienceScore === 0) {
    gaps.push('缺少直接服务经验，简历要突出可迁移经历。')
  }
  if (job.level >= 3 && testData.experienceScore < 2) {
    gaps.push('高门槛岗位需要更具体的销售/服务案例支撑。')
  }
  if (testData.stressScore < 2 && ['bar-server', 'guest-service', 'shop-sales'].includes(job.id)) {
    gaps.push('这个岗位客诉、销售或高峰期压力更高，需要提前确认承受度。')
  }

  return {
    why: job.fit,
    gaps: gaps.length > 0 ? gaps : ['基础匹配度较好，重点是把经历整理成英文简历和面试案例。'],
    risks: [job.risk],
    preparationFocus: job.preparationFocus,
  }
}

const cruiseJobs = [
  {
    department: '餐饮与酒吧',
    jobs: ['Restaurant Assistant', 'Waiter / Waitress', 'Buffet Attendant', 'Bar Utility', 'Bar Server', 'Bartender'],
  },
  {
    department: '客房与后勤',
    jobs: ['Housekeeping', 'Cabin Steward / Stewardess', 'Laundry Attendant', 'Cleaner', 'Utility'],
  },
  {
    department: '前台与岸上观光',
    jobs: ['Guest Service Associate', 'Receptionist', 'Concierge', 'Shore Excursion Coordinator'],
  },
  {
    department: '零售与娱乐',
    jobs: ['Retail Sales Associate', 'Jewelry Specialist', 'Art Gallery Staff', 'Activity Staff', 'Youth Staff', 'Spa Therapist'],
  },
]

const readJson = (key, fallback = null) => {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch (error) {
    console.warn(`Unable to read ${key}:`, error)
    return fallback
  }
}

const assessmentJobMap = {
  retail: 'Retail Sales Associate',
  front_office: 'Guest Service Associate',
  bar: 'Bar Server',
  restaurant: 'Restaurant Assistant',
  housekeeping: 'Housekeeping',
}

const isRetailPosition = (position = '') =>
  /retail|shop|sales|jewelry|免税|零售|销售/i.test(position)

const isBarPosition = (position = '') =>
  /bar server|bartender|bar utility|酒吧|调酒/i.test(position)

const getPositionProgramRoute = (position = '') => {
  if (isBarPosition(position)) return '/programs/bar-server'
  if (isRetailPosition(position)) return '/programs/retail'
  return '/academy'
}

const getAssessmentSuggestedJob = () => {
  const assessmentResult = readJson('assessment_result', {})
  const firstRecommendation = assessmentResult?.recommendations?.[0]
  if (!firstRecommendation) return ''

  if (assessmentJobMap[firstRecommendation.id]) {
    return assessmentJobMap[firstRecommendation.id]
  }

  const matchedJob = jobLibrary.find((job) =>
    firstRecommendation.title?.toLowerCase().includes(job.name.toLowerCase().split(' ')[0])
  )

  return matchedJob?.name || ''
}

const steps = [
  { id: 1, title: '英语沟通', description: '判断适合后台、服务岗还是前台销售岗。' },
  { id: 2, title: '服务经验', description: '判断是否有直接进入客-facing岗位的基础。' },
  { id: 3, title: '体力抗压', description: '判断是否能承受船上工作节奏。' },
  { id: 4, title: '岗位偏好', description: '判断你更看重稳定、收入还是成长。' },
  { id: 5, title: '成长意愿', description: '判断是否适合冲刺更高门槛岗位。' },
]

const experienceItems = [
  { key: 'restaurant', label: '餐厅、酒吧、酒店或门店服务经验' },
  { key: 'foreign', label: '接待过外国客人或使用英语服务客人' },
  { key: 'sales', label: '做过销售、导购或有业绩目标的工作' },
  { key: 'peak', label: '经历过高峰期、高强度、长时间站立工作' },
]

const calculateExperienceScore = (options, hasNoExperience) => {
  if (hasNoExperience) return 0

  const selectedCount = Object.values(options).filter(Boolean).length
  if (selectedCount === 0) return 0
  return selectedCount <= 2 ? 1 : 2
}

const StepProgress = ({ currentStep }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="mb-4 flex items-center justify-between text-sm">
      <span className="font-medium text-slate-950">岗位适配测评</span>
      <span className="text-slate-500">{currentStep}/5</span>
    </div>
    <div className="h-2 rounded-full bg-slate-100">
      <div
        className="h-2 rounded-full bg-blue-600 transition-all"
        style={{ width: `${(currentStep / steps.length) * 100}%` }}
      />
    </div>
    <div className="mt-4 grid grid-cols-5 gap-2">
      {steps.map(step => (
        <div
          key={step.id}
          className={`h-1.5 rounded-full ${step.id <= currentStep ? 'bg-blue-600' : 'bg-slate-200'}`}
          title={step.title}
        />
      ))}
    </div>
  </div>
)

const QuestionCard = ({ eyebrow, title, description, children }) => (
  <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-sm font-medium text-blue-700">{eyebrow}</p>
    <h2 className="mt-2 text-xl font-semibold text-slate-950">{title}</h2>
    <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    <div className="mt-5">{children}</div>
  </section>
)

const OptionButton = ({ selected, title, description, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full rounded-xl border p-4 text-left transition ${
      selected
        ? 'border-blue-300 bg-blue-50 shadow-sm'
        : 'border-slate-200 bg-white hover:border-blue-200'
    }`}
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-semibold text-slate-950">{title}</p>
        {description && <p className="mt-1 text-sm leading-5 text-slate-600">{description}</p>}
      </div>
      {selected && <CheckCircle2 size={18} className="shrink-0 text-blue-600" />}
    </div>
  </button>
)

const JobCard = ({ job, selected, onSelect, index }) => (
  <button
    type="button"
    onClick={onSelect}
    className={`w-full rounded-xl border p-4 text-left transition ${
      selected ? 'border-blue-300 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-200'
    }`}
  >
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-700">
        {index + 1}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h4 className="font-semibold text-slate-950">{job.name}</h4>
          {selected && <CheckCircle2 size={18} className="shrink-0 text-blue-600" />}
        </div>
        <p className="mt-1 text-sm leading-5 text-slate-600">{job.description}</p>
      </div>
    </div>
  </button>
)

const Task2 = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [testData, setTestData] = useState({
    englishScore: 0,
    experienceScore: 0,
    stressScore: 0,
    growthScore: 0,
    jobPreference: null,
  })
  const [experienceOptions, setExperienceOptions] = useState({
    restaurant: false,
    foreign: false,
    sales: false,
    peak: false,
  })
  const [noExperience, setNoExperience] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [currentJob, setCurrentJob] = useState([])
  const [potentialJob, setPotentialJob] = useState([])
  const [notRecommendedJobs, setNotRecommendedJobs] = useState([])
  const [gapAnalysis, setGapAnalysis] = useState([])
  const [selectedTargetJob, setSelectedTargetJob] = useState(getAssessmentSuggestedJob)
  const [showJobSelector, setShowJobSelector] = useState(false)

  const scoreSummary = useMemo(() => {
    const english =
      testData.englishScore < 40 ? '基础沟通' : testData.englishScore < 70 ? '服务沟通' : '复杂沟通'
    const experience =
      testData.experienceScore === 0 ? '暂无服务经验' : testData.experienceScore === 1 ? '有基础经验' : '经验较充足'
    const stress =
      testData.stressScore === 3 ? '抗压较强' : testData.stressScore === 2 ? '可接受部分压力' : '抗压需谨慎'

    return { english, experience, stress }
  }, [testData])

  const isStepComplete = () => {
    switch (currentStep) {
      case 1:
        return testData.englishScore > 0
      case 2:
        return true
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

  const calculateResult = () => {
    let matchedJobs = []
    let aimJobs = []

    if (testData.englishScore < 40 || testData.experienceScore === 0) {
      matchedJobs = jobLibrary.filter(job => job.level === 1).slice(0, 2)
      aimJobs = jobLibrary.filter(job => job.level === 2).slice(0, 2)
    } else if (testData.englishScore < 70) {
      matchedJobs = jobLibrary.filter(job => job.level === 2).slice(0, 2)
      aimJobs = jobLibrary.filter(job => job.level === 3).slice(0, 2)
    } else {
      matchedJobs = jobLibrary.filter(job => job.level === 3).slice(0, 2)
      aimJobs = testData.stressScore >= 2 ? [] : jobLibrary.filter(job => job.level === 2).slice(0, 2)
    }

    const gaps = []
    if (testData.englishScore < 70) gaps.push('英语表达还不够稳定，前台、销售、酒吧等岗位需要继续训练。')
    if (testData.experienceScore < 2) gaps.push('服务业经历不足，简历需要突出可迁移经验。')
    if (testData.stressScore < 2) gaps.push('对长时间站立、客诉和连续工作需要提前评估。')
    if (testData.growthScore < 2) gaps.push('如果不愿意额外训练，建议先选择更稳妥的登船岗位。')

    const notRecommended = jobLibrary
      .filter(job => !matchedJobs.some(match => match.id === job.id) && !aimJobs.some(aim => aim.id === job.id))
      .filter(job => {
        if (job.level === 3 && (testData.englishScore < 70 || testData.experienceScore < 2)) return true
        if (job.id === 'bar-server' && testData.stressScore < 2) return true
        return false
      })
      .slice(0, 2)

    setCurrentJob(matchedJobs)
    setPotentialJob(aimJobs)
    setNotRecommendedJobs(notRecommended)
    setGapAnalysis(gaps)
    setSelectedTargetJob(prev => prev || matchedJobs[0]?.name || '')
  }

  const handleNext = () => {
    if (!isStepComplete()) {
      alert('请先完成当前步骤')
      return
    }

    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1)
      return
    }

    calculateResult()
    setShowResult(true)
  }

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1)
  }

  const handleNoExperienceChange = (checked) => {
    setNoExperience(checked)
    if (checked) {
      const emptyOptions = {
        restaurant: false,
        foreign: false,
        sales: false,
        peak: false,
      }
      setExperienceOptions(emptyOptions)
      setTestData(prev => ({
        ...prev,
        experienceScore: calculateExperienceScore(emptyOptions, true),
      }))
      return
    }

    setTestData(prev => ({
      ...prev,
      experienceScore: calculateExperienceScore(experienceOptions, false),
    }))
  }

  const handleExperienceChange = (key, checked) => {
    if (noExperience) return
    setExperienceOptions(prev => {
      const nextOptions = { ...prev, [key]: checked }
      setTestData(current => ({
        ...current,
        experienceScore: calculateExperienceScore(nextOptions, false),
      }))
      return nextOptions
    })
  }

  const saveTaskResult = () => {
    const selectedJob = [...currentJob, ...potentialJob, ...notRecommendedJobs].find(job => job.name === selectedTargetJob)
    const selectedJobAdvice = selectedJob ? getJobAdvice(selectedJob, testData) : null
    const backupPositions = [...currentJob, ...potentialJob]
      .filter(job => job.name !== selectedTargetJob)
      .slice(0, 2)
      .map(job => job.name)
    const positionGaps = selectedJobAdvice?.gaps || gapAnalysis
    const positionRisks = selectedJobAdvice?.risks || []
    const preparationFocus = selectedJobAdvice?.preparationFocus || []

    const taskResult = {
      taskId: 2,
      completedAt: new Date().toISOString(),
      testData,
      currentJob,
      potentialJob,
      notRecommendedJobs,
      gapAnalysis,
      selectedTargetJob,
      target_position: selectedTargetJob,
      backup_positions: backupPositions,
      position_reason: selectedJobAdvice?.why || '',
      position_gaps: positionGaps,
      position_risks: positionRisks,
      preparation_focus: preparationFocus,
    }

    localStorage.setItem('task2_result', JSON.stringify(taskResult))

    const boardingProgress = JSON.parse(localStorage.getItem('boarding_progress') || '{}')
    boardingProgress.task2 = { completed: true, completedAt: new Date().toISOString() }
    localStorage.setItem('boarding_progress', JSON.stringify(boardingProgress))

    syncLocalPathProfile({
      target_position: selectedTargetJob,
      career_stage: 'position_planning',
      application_stage: 'position_selected',
      last_completed_task_id: 2,
    })
  }

  const renderStep = () => {
    if (currentStep === 1) {
      return (
        <QuestionCard
          eyebrow="第一步"
          title="你的英语现在能支撑哪类岗位？"
          description="这里先做自评，不再用录音模拟打分。后续真正接入 AI 面试时，再把口语评估放到付费功能里。"
        >
          <div className="space-y-3">
            <OptionButton
              selected={testData.englishScore === 30}
              title="只能做简单问候和基础回答"
              description="适合先考虑客房、厨房、后勤或低英语门槛岗位。"
              onClick={() => setTestData(prev => ({ ...prev, englishScore: 30 }))}
            />
            <OptionButton
              selected={testData.englishScore === 55}
              title="可以完成常见服务沟通"
              description="能处理点单、指路、简单投诉，适合餐厅、酒吧助理等过渡岗位。"
              onClick={() => setTestData(prev => ({ ...prev, englishScore: 55 }))}
            />
            <OptionButton
              selected={testData.englishScore === 80}
              title="可以连续表达并处理复杂问题"
              description="适合前台、免税店、酒吧服务、岸上观光等更高沟通岗位。"
              onClick={() => setTestData(prev => ({ ...prev, englishScore: 80 }))}
            />
          </div>
        </QuestionCard>
      )
    }

    if (currentStep === 2) {
      return (
        <QuestionCard
          eyebrow="第二步"
          title="你有哪些服务或销售经验？"
          description="不要求必须做过海乘，酒店、餐饮、零售、英语接待都可以作为可迁移经验。"
        >
          <label className="mb-4 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <input
              type="checkbox"
              checked={noExperience}
              onChange={(event) => handleNoExperienceChange(event.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />
            <span className="text-sm font-medium text-slate-800">目前没有相关服务、销售或英语接待经验</span>
          </label>

          <div className="space-y-3">
            {experienceItems.map(item => (
              <label
                key={item.key}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                  noExperience ? 'border-slate-100 bg-slate-50 text-slate-400' : 'border-slate-200 bg-white text-slate-800'
                }`}
              >
                <input
                  type="checkbox"
                  checked={experienceOptions[item.key]}
                  onChange={(event) => handleExperienceChange(item.key, event.target.checked)}
                  disabled={noExperience}
                  className="h-4 w-4 accent-blue-600"
                />
                <span className="text-sm font-medium">{item.label}</span>
              </label>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
            当前判断：{scoreSummary.experience}
          </div>
        </QuestionCard>
      )
    }

    if (currentStep === 3) {
      return (
        <QuestionCard
          eyebrow="第三步"
          title="你能接受船上工作的强度吗？"
          description="海乘岗位不是朝九晚五，体力、情绪稳定和连续工作适应度会明显影响岗位选择。"
        >
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            典型情况包括：每天站立 8-10 小时、连续工作多天、高峰期被催促或处理客诉。
          </div>
          <div className="space-y-3">
            <OptionButton
              selected={testData.stressScore === 3}
              title="可以接受，且过去有类似经历"
              description="更适合餐厅、酒吧、前台、零售等强互动岗位。"
              onClick={() => setTestData(prev => ({ ...prev, stressScore: 3 }))}
            />
            <OptionButton
              selected={testData.stressScore === 2}
              title="可以接受一部分，但需要适应"
              description="建议优先选择门槛适中、训练路径清晰的岗位。"
              onClick={() => setTestData(prev => ({ ...prev, stressScore: 2 }))}
            />
            <OptionButton
              selected={testData.stressScore === 1}
              title="比较担心，不确定自己能不能扛住"
              description="建议谨慎选择高投诉、高销售或高峰期极强的岗位。"
              onClick={() => setTestData(prev => ({ ...prev, stressScore: 1 }))}
            />
          </div>
        </QuestionCard>
      )
    }

    if (currentStep === 4) {
      return (
        <QuestionCard
          eyebrow="第四步"
          title="你更看重哪一种岗位路径？"
          description="不同目标会影响岗位选择：先登船、先收入、还是未来发展。"
        >
          <div className="space-y-3">
            <OptionButton
              selected={testData.jobPreference === 'stable'}
              title="先稳定登船"
              description="优先选择上船概率更高、准备周期更短的岗位。"
              onClick={() => setTestData(prev => ({ ...prev, jobPreference: 'stable' }))}
            />
            <OptionButton
              selected={testData.jobPreference === 'income'}
              title="优先收入"
              description="愿意承受销售、服务强度或更高英语门槛，换取收入上限。"
              onClick={() => setTestData(prev => ({ ...prev, jobPreference: 'income' }))}
            />
            <OptionButton
              selected={testData.jobPreference === 'growth'}
              title="看重长期发展"
              description="希望未来转岗、晋升，或把海乘经历连接到海外职业路径。"
              onClick={() => setTestData(prev => ({ ...prev, jobPreference: 'growth' }))}
            />
          </div>
        </QuestionCard>
      )
    }

    return (
      <QuestionCard
        eyebrow="第五步"
        title="你愿意为目标岗位额外训练吗？"
        description="高质量岗位通常需要英语、岗位知识、英文简历和面试表达一起准备。"
      >
        <div className="space-y-3">
          <OptionButton
            selected={testData.growthScore === 3}
            title="愿意系统训练"
            description="适合冲刺前台、免税店、酒吧、Youth Staff 等高门槛岗位。"
            onClick={() => setTestData(prev => ({ ...prev, growthScore: 3 }))}
          />
          <OptionButton
            selected={testData.growthScore === 2}
            title="愿意尝试，但希望路线明确"
            description="适合先选一个现实目标岗位，再按任务路线推进。"
            onClick={() => setTestData(prev => ({ ...prev, growthScore: 2 }))}
          />
          <OptionButton
            selected={testData.growthScore === 1}
            title="暂时不想投入太多训练"
            description="建议先选择更稳妥的入门岗位，降低时间和金钱成本。"
            onClick={() => setTestData(prev => ({ ...prev, growthScore: 1 }))}
          />
        </div>
      </QuestionCard>
    )
  }

  const renderResult = () => (
    <div className="space-y-5">
      {(() => {
        const selectedJob = [...currentJob, ...potentialJob, ...notRecommendedJobs].find(job => job.name === selectedTargetJob)
        const selectedAdvice = selectedJob ? getJobAdvice(selectedJob, testData) : null
        const backupPositions = [...currentJob, ...potentialJob]
          .filter(job => job.name !== selectedTargetJob)
          .slice(0, 2)
          .map(job => job.name)

        return (
          <>
            <section className="rounded-xl border border-blue-100 bg-blue-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                  <ClipboardCheck size={22} />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">岗位决策结果</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950">先定主攻岗位，再准备备选路线</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    结果基于英语、服务经验、抗压强度、岗位偏好和成长意愿生成，用于帮你决定下一步准备重点。
                  </p>
                </div>
              </div>
            </section>

            {selectedJob && selectedAdvice && (
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-blue-700">主攻岗位</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-950">{selectedTargetJob}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{selectedAdvice.why}</p>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-medium text-slate-500">备选岗位</p>
                    <p className="mt-1 text-sm text-slate-800">{backupPositions.length ? backupPositions.join(' / ') : '当前建议先集中准备主攻岗位'}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3">
                    <p className="text-xs font-medium text-amber-700">当前短板</p>
                    <div className="mt-2 space-y-1">
                      {selectedAdvice.gaps.map(item => (
                        <p key={item} className="text-sm leading-5 text-amber-950">{item}</p>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-3">
                    <p className="text-xs font-medium text-blue-700">准备重点</p>
                    <p className="mt-1 text-sm text-blue-950">{selectedAdvice.preparationFocus.join(' / ')}</p>
                  </div>
                </div>
              </section>
            )}
          </>
        )
      })()}

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">英语</p>
          <p className="mt-1 font-semibold text-slate-950">{scoreSummary.english}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">经验</p>
          <p className="mt-1 font-semibold text-slate-950">{scoreSummary.experience}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">强度</p>
          <p className="mt-1 font-semibold text-slate-950">{scoreSummary.stress}</p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Target size={20} className="text-blue-600" />
          <h3 className="font-semibold text-slate-950">推荐岗位 Top 2</h3>
        </div>
        <div className="space-y-3">
          {currentJob.map((job, index) => (
            <JobCard
              key={job.id}
              job={job}
              index={index}
              selected={selectedTargetJob === job.name}
              onSelect={() => setSelectedTargetJob(job.name)}
            />
          ))}
        </div>

        {potentialJob.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 font-semibold text-slate-950">可冲刺岗位</h3>
            <div className="space-y-3">
              {potentialJob.map((job, index) => (
                <JobCard
                  key={job.id}
                  job={job}
                  index={index}
                  selected={selectedTargetJob === job.name}
                  onSelect={() => setSelectedTargetJob(job.name)}
                />
              ))}
            </div>
          </div>
        )}

        {notRecommendedJobs.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 font-semibold text-slate-950">暂不建议优先选择</h3>
            <div className="space-y-3">
              {notRecommendedJobs.map((job, index) => (
                <div key={job.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-semibold text-slate-500">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-950">{job.name}</h4>
                      <p className="mt-1 text-sm leading-5 text-slate-600">{job.risk}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle size={19} className="text-amber-700" />
          <h3 className="font-semibold text-amber-950">风险与短板</h3>
        </div>
        <div className="space-y-3">
          {gapAnalysis.length > 0 ? (
            gapAnalysis.map(item => (
              <p key={item} className="rounded-lg bg-white px-3 py-2 text-sm leading-5 text-amber-900">
                {item}
              </p>
            ))
          ) : (
            <p className="rounded-lg bg-white px-3 py-2 text-sm leading-5 text-amber-900">
              当前基础较好，可以直接进入目标岗位准备，但仍建议完善英文简历和岗位面试表达。
            </p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <button
          type="button"
          onClick={() => setShowJobSelector(prev => !prev)}
          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:border-blue-200"
        >
          我有自己的目标岗位
          <ChevronRight size={18} className={`transition ${showJobSelector ? 'rotate-90' : ''}`} />
        </button>

        {showJobSelector && (
          <div className="mt-4 max-h-80 space-y-4 overflow-y-auto pr-1">
            {cruiseJobs.map(department => (
              <div key={department.department}>
                <p className="mb-2 text-sm font-semibold text-slate-700">{department.department}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {department.jobs.map(job => (
                    <label
                      key={job}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                    >
                      <input
                        type="radio"
                        name="targetJob"
                        value={job}
                        checked={selectedTargetJob === job}
                        onChange={(event) => setSelectedTargetJob(event.target.value)}
                        className="h-4 w-4 accent-blue-600"
                      />
                      {job}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedTargetJob && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
            已选择目标岗位：{selectedTargetJob}
          </div>
        )}
      </section>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => {
            saveTaskResult()
            navigate(getPositionProgramRoute(selectedTargetJob))
          }}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          {isBarPosition(selectedTargetJob)
            ? '免费体验 Bar Server 前 3 个场景'
            : isRetailPosition(selectedTargetJob)
              ? '查看免税店岗位准备路径'
              : '查看岗位提升内容'}
        </button>
        <button
          type="button"
          onClick={() => {
            saveTaskResult()
            navigate('/tasks')
          }}
          className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200"
        >
          保存结果并返回路线
        </button>
      </div>
    </div>
  )

  return (
    <TaskLayout taskId={2} taskTitle="岗位选择测评系统" canComplete={showResult} onComplete={saveTaskResult}>
      <div className="space-y-5">
        {!showResult ? (
          <>
            <StepProgress currentStep={currentStep} />
            {renderStep()}

            <div className="flex items-center justify-between gap-3 pb-10">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className={`inline-flex items-center gap-1 rounded-lg px-4 py-3 text-sm font-semibold transition ${
                  currentStep === 1
                    ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-blue-200'
                }`}
              >
                <ChevronLeft size={16} />
                上一步
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                {currentStep < steps.length ? '下一步' : '查看结果'}
                {currentStep < steps.length && <ChevronRight size={16} />}
              </button>
            </div>
          </>
        ) : (
          renderResult()
        )}
      </div>
    </TaskLayout>
  )
}

export default Task2
