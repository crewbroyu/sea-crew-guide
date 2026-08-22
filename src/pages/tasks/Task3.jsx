import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  ShieldCheck,
  Target,
} from 'lucide-react'
import TaskLayout from '../../components/TaskLayout'

const questions = [
  {
    id: 'q1',
    question: '你愿意自己研究申请流程吗？',
    description: '包括找船公司官网、整理招聘渠道、判断信息真假、跟进申请进度。',
    options: [
      { text: '非常愿意，我想尽量自己搞定', value: 2, type: 'base' },
      { text: '可以做一部分，但希望有清晰路线', value: 1, type: 'base' },
      { text: '不太愿意，希望有人直接告诉我怎么做', value: 0, type: 'base' },
    ],
  },
  {
    id: 'q2',
    question: '你的英语基础更接近哪种情况？',
    description: '这会影响你适合直接申请，还是先做岗位和面试准备。',
    options: [
      { text: '基础较弱，只能简单问候', value: 0, type: 'base' },
      { text: '一般，可以做简单服务沟通', value: 1, type: 'base' },
      { text: '可以交流，能回答常见面试问题', value: 2, type: 'base' },
      { text: '较好，能连续表达工作经历和职业目标', value: 3, type: 'base' },
    ],
  },
  {
    id: 'q3',
    question: '你是否有服务业、酒店、餐饮或销售经验？',
    description: '没有也可以申请，但路线会更偏向基础岗位或能力提升。',
    options: [
      { text: '没有相关经验', value: 0, type: 'base' },
      { text: '有一点兼职或短期经验', value: 1, type: 'base' },
      { text: '有较多服务、销售或酒店经验', value: 2, type: 'base' },
    ],
  },
  {
    id: 'q4',
    question: '你是否希望有人帮你准备简历和面试？',
    description: '这决定你更适合纯 DIY、指导型 DIY，还是直接找服务方。',
    options: [
      { text: '不需要，我可以自己准备', value: 0, type: 'base' },
      { text: '可以考虑，关键节点有人看一下就行', value: 1, type: 'guide' },
      { text: '非常需要，我担心自己准备不准', value: 2, type: 'guide' },
    ],
  },
  {
    id: 'q5',
    question: '你目前最在意什么？',
    description: '不同优先级对应完全不同的申请路线。',
    options: [
      { text: '省钱，尽量降低申请成本', value: 2, type: 'diy' },
      { text: '成功率，希望少走弯路', value: 2, type: 'guide' },
      { text: '速度，希望尽快拿到面试或 offer', value: 2, type: 'agent' },
      { text: '省心，不想自己处理太多流程', value: 2, type: 'agent' },
    ],
  },
  {
    id: 'q6',
    question: '你是否担心被中介坑？',
    description: '包括收费不透明、承诺过度、岗位信息不清楚。',
    options: [
      { text: '非常担心，所以更想自己掌握流程', value: 2, type: 'diy' },
      { text: '有点担心，希望先学会判断', value: 1, type: 'guide' },
      { text: '不太担心，只要能上船就行', value: 1, type: 'agent' },
    ],
  },
  {
    id: 'q7',
    question: '你愿意为更好的岗位做额外准备吗？',
    description: '例如英语、岗位知识、英文简历、AI 面试训练。',
    options: [
      { text: '非常愿意，我想冲更好的岗位', value: 3, type: 'guide' },
      { text: '可以考虑，但希望路线明确', value: 2, type: 'guide' },
      { text: '不太愿意，先能上船就行', value: 0, type: 'base' },
    ],
  },
]

const budgetRanges = [
  { min: 0, max: 500, label: '0-500 元', diy: 3, agent: 0, guide: 0 },
  { min: 500, max: 2000, label: '500-2000 元', diy: 0, agent: 0, guide: 3 },
  { min: 2000, max: 10000, label: '2000-10000 元', diy: 0, agent: 2, guide: 1 },
  { min: 10000, max: 999999, label: '10000 元以上', diy: 0, agent: 3, guide: 0 },
]

const pathInfo = {
  diy: {
    title: '低成本 DIY 路线',
    description: '适合愿意自己研究渠道、预算有限、希望掌握主动权的申请者。',
    summary: '核心是节省成本，但你需要自己判断信息、准备材料和跟进申请。',
    cost: '低',
    speed: '中',
    control: '高',
    icon: DollarSign,
  },
  guide: {
    title: '指导型 DIY 路线',
    description: '适合愿意自己执行，但需要岗位判断、简历和面试方向的人。',
    summary: '这是当前最适合产品转化的路线：用户仍然自己走，但关键节点需要工具和指导。',
    cost: '中',
    speed: '中高',
    control: '高',
    icon: Target,
  },
  agent: {
    title: '中介辅助路线',
    description: '适合预算较高、想省时间、希望更快拿到面试机会的申请者。',
    summary: '核心是省心和速度，但要重点核查费用、合同、岗位信息和退款规则。',
    cost: '高',
    speed: '快',
    control: '中低',
    icon: ShieldCheck,
  },
}

const StepProgress = ({ currentQuestion }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="mb-4 flex items-center justify-between text-sm">
      <span className="font-medium text-slate-950">路线决策测评</span>
      <span className="text-slate-500">{currentQuestion + 1}/{questions.length}</span>
    </div>
    <div className="h-2 rounded-full bg-slate-100">
      <div
        className="h-2 rounded-full bg-blue-600 transition-all"
        style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
      />
    </div>
  </div>
)

const OptionButton = ({ option, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full rounded-xl border p-4 text-left transition ${
      selected ? 'border-blue-300 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-200'
    }`}
  >
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm font-semibold leading-6 text-slate-900">{option.text}</span>
      {selected && <CheckCircle2 size={18} className="shrink-0 text-blue-600" />}
    </div>
  </button>
)

const TagList = ({ title, items, tone = 'slate' }) => {
  const toneClass = {
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
    blue: 'border-blue-100 bg-blue-50 text-blue-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-800',
  }[tone]

  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-slate-800">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {items.map(item => (
          <span key={item} className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${toneClass}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

const Task3 = () => {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState('assessment')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [budget, setBudget] = useState(1000)
  const [result, setResult] = useState(null)
  const [canComplete, setCanComplete] = useState(false)

  const question = questions[currentQuestion]
  const selectedAnswer = answers[question?.id]
  const currentRange = budgetRanges.find(range => budget >= range.min && budget <= range.max)

  const handleAnswerSelect = (questionId, option) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: option,
    }))
  }

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
      return
    }

    setCurrentPage('budget')
  }

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) setCurrentQuestion(prev => prev - 1)
  }

  const calculateResult = () => {
    let diyScore = 0
    let agentScore = 0
    let guideScore = 0
    let baseScore = 0

    Object.values(answers).forEach(option => {
      if (option.type === 'base') baseScore += option.value
      if (option.type === 'diy') diyScore += option.value
      if (option.type === 'agent') agentScore += option.value
      if (option.type === 'guide') guideScore += option.value
    })

    const budgetRange = budgetRanges.find(range => budget >= range.min && budget <= range.max)
    if (budgetRange) {
      diyScore += budgetRange.diy
      agentScore += budgetRange.agent
      guideScore += budgetRange.guide
    }

    const totalScore = Math.max(diyScore + agentScore + guideScore, 1)
    let recommendedPath = 'diy'
    let winningScore = diyScore

    if (guideScore >= agentScore && guideScore >= diyScore) {
      recommendedPath = 'guide'
      winningScore = guideScore
    } else if (agentScore >= guideScore && agentScore >= diyScore) {
      recommendedPath = 'agent'
      winningScore = agentScore
    }

    const reasons = []
    const englishLevel = answers.q2?.value || 0
    const willingToImprove = answers.q7?.value || 0

    if (englishLevel >= 2) reasons.push('你已经具备一定英语沟通基础，可以尝试更主动的申请路径。')
    if (willingToImprove >= 2) reasons.push('你愿意为更好的岗位投入训练，适合把路线和能力提升结合。')
    if (budget < 500) reasons.push('你的预算更适合先走低成本 DIY，避免前期投入过重。')
    if (budget >= 500 && budget <= 2000) reasons.push('你的预算适合投入到简历、面试和路线指导等关键节点。')
    if (budget > 10000) reasons.push('你的预算允许考虑中介，但需要重点审查收费和岗位真实性。')
    if (reasons.length === 0) reasons.push('你的情况更适合先明确岗位目标，再选择具体申请渠道。')

    let currentJobs = ['Cleaner', 'Utility']
    let potentialJobs = ['Bar Utility', 'Restaurant Assistant']
    let gaps = ['基础英语', '服务意识', '面试准备']

    if (baseScore >= 8) {
      currentJobs = ['Bar Server', 'Retail Sales Associate']
      potentialJobs = ['Bartender', 'Guest Service Associate']
      gaps = ['岗位专业英语', '面试表达结构', '服务案例沉淀']
    } else if (baseScore >= 5) {
      currentJobs = ['Bar Utility', 'Restaurant Assistant']
      potentialJobs = ['Bar Server', 'Retail Sales Associate']
      gaps = ['英语表达', '面试能力', '服务话术']
    }

    setResult({
      recommendedPath,
      matchPercentage: Math.round((winningScore / totalScore) * 100),
      reasons,
      currentJobs,
      potentialJobs,
      gaps,
      baseScore,
      scores: { diyScore, agentScore, guideScore },
    })
    setCurrentPage('result')
    setCanComplete(true)
  }

  const renderAssessmentPage = () => (
    <div className="space-y-5">
      <StepProgress currentQuestion={currentQuestion} />

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-blue-700">第 {currentQuestion + 1} 题</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-950">{question.question}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{question.description}</p>

        <div className="mt-5 space-y-3">
          {question.options.map(option => (
            <OptionButton
              key={option.text}
              option={option}
              selected={selectedAnswer === option}
              onClick={() => handleAnswerSelect(question.id, option)}
            />
          ))}
        </div>
      </section>

      <div className="flex items-center justify-between gap-3 pb-10">
        <button
          type="button"
          onClick={handlePrevQuestion}
          disabled={currentQuestion === 0}
          className={`inline-flex items-center gap-1 rounded-lg px-4 py-3 text-sm font-semibold transition ${
            currentQuestion === 0
              ? 'cursor-not-allowed bg-slate-100 text-slate-400'
              : 'border border-slate-200 bg-white text-slate-700 hover:border-blue-200'
          }`}
        >
          <ChevronLeft size={16} />
          上一题
        </button>
        <button
          type="button"
          onClick={handleNextQuestion}
          disabled={!selectedAnswer}
          className={`inline-flex items-center gap-1 rounded-lg px-4 py-3 text-sm font-semibold transition ${
            !selectedAnswer
              ? 'cursor-not-allowed bg-slate-200 text-slate-500'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {currentQuestion === questions.length - 1 ? '进入预算判断' : '下一题'}
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )

  const renderBudgetPage = () => (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-blue-700">预算判断</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-950">你愿意为申请准备投入多少预算？</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          预算不是越高越好，关键是把钱花在能降低试错成本的位置。
        </p>

        <div className="mt-6 space-y-5">
          <input
            type="range"
            min="0"
            max="15000"
            step="100"
            value={budget}
            onChange={(event) => setBudget(Number(event.target.value))}
            className="w-full accent-blue-600"
          />

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 text-center">
            <p className="text-3xl font-semibold text-blue-700">¥{budget.toLocaleString()}</p>
            <p className="mt-1 text-sm font-medium text-blue-900">{currentRange?.label}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">DIY</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">低成本，高时间投入</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">指导型 DIY</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">中等投入，关键节点提效</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">中介</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">高投入，省流程但需审查</p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between gap-3 pb-10">
        <button
          type="button"
          onClick={() => setCurrentPage('assessment')}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200"
        >
          <ChevronLeft size={16} />
          返回测评
        </button>
        <button
          type="button"
          onClick={calculateResult}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          查看结果
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )

  const renderResultPage = () => {
    if (!result) return null

    const recommended = pathInfo[result.recommendedPath]
    const Icon = recommended.icon

    return (
      <div className="space-y-5">
        <section className="rounded-xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <Icon size={22} />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700">推荐路线</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">{recommended.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">{recommended.description}</p>
            </div>
          </div>
          <div className="mt-5 rounded-xl bg-white p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">匹配度</span>
              <span className="font-semibold text-blue-700">{result.matchPercentage}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-blue-600" style={{ width: `${result.matchPercentage}%` }} />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-950">为什么推荐这条路线</h3>
          <div className="space-y-3">
            {result.reasons.map(reason => (
              <div key={reason} className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-600" />
                <p className="text-sm leading-5 text-slate-700">{reason}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          {Object.entries(pathInfo).map(([key, path]) => {
            const active = result.recommendedPath === key

            return (
              <div
                key={key}
                className={`rounded-xl border p-4 ${
                  active ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white'
                }`}
              >
                <p className="text-sm font-semibold text-slate-950">{path.title}</p>
                <div className="mt-3 space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between gap-2">
                    <span>成本</span>
                    <span className="font-medium text-slate-900">{path.cost}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>速度</span>
                    <span className="font-medium text-slate-900">{path.speed}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>掌控感</span>
                    <span className="font-medium text-slate-900">{path.control}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="space-y-5">
            <TagList title="当前可尝试岗位" items={result.currentJobs} />
            <TagList title="可冲刺岗位" items={result.potentialJobs} tone="blue" />
            <TagList title="下一步短板" items={result.gaps} tone="amber" />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-start gap-3">
            <Clock size={20} className="mt-0.5 shrink-0 text-blue-600" />
            <div>
              <h3 className="font-semibold text-slate-950">下一步建议</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{recommended.summary}</p>
            </div>
          </div>
        </section>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => navigate('/tasks?justCompleted=3')}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            保存路线判断并返回进度中心
          </button>
          <button
            type="button"
            onClick={() => navigate('/academy')}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200"
          >
            查看申请资料与岗位内容
          </button>
        </div>
      </div>
    )
  }

  return (
    <TaskLayout taskId={3} taskTitle="申请路线决策系统" canComplete={canComplete}>
      <div className="space-y-5">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-900">本任务目标</p>
          <p className="mt-2 text-sm leading-6 text-blue-800">
            通过预算、英语、经验、风险偏好和准备意愿，判断你更适合低成本 DIY、指导型 DIY，还是中介辅助路线。
          </p>
        </div>

        {currentPage === 'assessment' && renderAssessmentPage()}
        {currentPage === 'budget' && renderBudgetPage()}
        {currentPage === 'result' && renderResultPage()}
      </div>
    </TaskLayout>
  )
}

export default Task3
