import { useEffect, useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import TaskLayout from '../../components/TaskLayout'

const motivationOptions = [
  { id: 1, title: '提高收入', description: '希望通过海乘工作获得更高储蓄和现金流。' },
  { id: 2, title: '国际经历', description: '想获得海外工作、跨文化团队和国际履历。' },
  { id: 3, title: '职业转型', description: '希望从现有行业切换到酒店、邮轮或服务业方向。' },
  { id: 4, title: '语言提升', description: '希望在真实工作场景中提升英语沟通能力。' },
  { id: 5, title: '长期发展', description: '希望未来转岗、晋升或连接海外职业机会。' },
  { id: 6, title: '生活体验', description: '想看世界，但也愿意接受船上工作的纪律和强度。' },
]

const StepCard = ({ step, title, completed, children }) => (
  <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
          completed ? 'bg-emerald-50 text-emerald-600' : 'bg-white text-slate-400'
        }`}
      >
        {completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">步骤 {step}</p>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      </div>
    </div>
    <div className="p-4">{children}</div>
  </section>
)

const Task1 = () => {
  const [step1Completed, setStep1Completed] = useState(false)
  const [step2Completed, setStep2Completed] = useState(false)
  const [step3Completed, setStep3Completed] = useState(false)
  const [selectedMotivations, setSelectedMotivations] = useState([])
  const [declaration, setDeclaration] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setStep1Completed(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const handleMotivationToggle = (id) => {
    setSelectedMotivations(prev => {
      const nextSelected = prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]

      setStep2Completed(nextSelected.length > 0)
      return nextSelected
    })
  }

  const handleDeclarationChange = (event) => {
    const value = event.target.value
    setDeclaration(value)
    setStep3Completed(value.trim().length >= 10)
  }

  const allStepsCompleted = step1Completed && step2Completed && step3Completed

  return (
    <TaskLayout taskId={1} taskTitle="明确出海动机" canComplete={allStepsCompleted}>
      <div className="space-y-5">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-900">本任务目标</p>
          <p className="mt-2 text-sm leading-6 text-blue-800">
            先判断自己为什么想做海乘，再决定是否继续投入时间准备。动机越清楚，后面的岗位选择、简历和面试准备越不容易跑偏。
          </p>
        </div>

        <StepCard step="1" title="确认这不是一次冲动选择" completed={step1Completed}>
          <div className="space-y-3 text-sm leading-6 text-slate-600">
            <p>
              海乘不是单纯的旅行工作。它同时包含服务业强度、封闭空间生活、英语沟通、合同周期和跨文化协作。
            </p>
            <p>
              如果你的核心目标只是“想出去看看”，后面需要特别关注岗位强度、休假安排和真实收入。如果你的目标是收入、转型或国际履历，则更需要把岗位选择和申请路线做对。
            </p>
          </div>
          {step1Completed && (
            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-700">
              <CheckCircle2 size={16} />
              已完成阅读
            </div>
          )}
        </StepCard>

        <StepCard step="2" title="选择你的主要出海动机" completed={step2Completed}>
          <div className="grid gap-3 sm:grid-cols-2">
            {motivationOptions.map(option => {
              const selected = selectedMotivations.includes(option.id)

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleMotivationToggle(option.id)}
                  className={`rounded-xl border p-4 text-left transition ${
                    selected
                      ? 'border-blue-300 bg-blue-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{option.title}</p>
                      <p className="mt-1 text-sm leading-5 text-slate-600">{option.description}</p>
                    </div>
                    {selected && <CheckCircle2 size={18} className="shrink-0 text-blue-600" />}
                  </div>
                </button>
              )
            })}
          </div>
          {step2Completed && (
            <p className="mt-4 text-sm font-medium text-emerald-700">
              已选择 {selectedMotivations.length} 个主要动机
            </p>
          )}
        </StepCard>

        <StepCard step="3" title="写下你的出海判断" completed={step3Completed}>
          <textarea
            value={declaration}
            onChange={handleDeclarationChange}
            placeholder="例如：我希望用一年时间准备海乘申请，优先考虑收入稳定、英语要求可提升、适合长期发展的岗位。"
            className="min-h-32 w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>至少写 10 个字，用于帮助你后续判断岗位和路线。</span>
            <span>{declaration.trim().length}/10</span>
          </div>
          {step3Completed && (
            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-700">
              <CheckCircle2 size={16} />
              出海判断已记录
            </div>
          )}
        </StepCard>
      </div>
    </TaskLayout>
  )
}

export default Task1
