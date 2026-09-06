import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, Filter, Search, Target, Volume2, X } from 'lucide-react'
import interviewQuestions, { positionConfig } from '../../data/interviewQuestions'
import { normalizeInterviewPosition } from '../../utils/interviewPosition'

const categoryLabels = {
  all: '全部',
  foundation: '基础问题',
  behavioral: '经历案例',
  communication: '沟通表达',
  demonstration: '现场演示',
  emergency: '突发情况',
  health: '公共卫生',
  inclusion: '多元服务',
  integrity: '职业操守',
  knowledge: '岗位知识',
  operations: '工作流程',
  privacy: '隐私保护',
  safeguarding: '安全照护',
  safety: '安全规范',
  sales: '销售能力',
  scenario: '岗位场景',
  security: '安保意识',
  service_judgment: '服务判断',
  ship_life: '船上适应',
  teamwork: '团队协作',
}

const difficultyLabels = { easy: '基础', medium: '进阶', hard: '挑战' }
const emptyQuestions = []

const readJson = (key, fallback = {}) => {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

const getInitialPosition = (requestedPosition) => {
  const normalizedRequested = normalizeInterviewPosition(requestedPosition, '')
  if (interviewQuestions[normalizedRequested]) return normalizedRequested

  const task2Result = readJson('task2_result')
  const normalizedTask2 = normalizeInterviewPosition(
    task2Result.selectedTargetJob || task2Result.target_position,
    ''
  )
  return interviewQuestions[normalizedTask2] ? normalizedTask2 : ''
}

const getDifficultyClass = (difficulty) => {
  if (difficulty === 'easy') return 'bg-emerald-50 text-emerald-700'
  if (difficulty === 'medium') return 'bg-amber-50 text-amber-700'
  return 'bg-rose-50 text-rose-700'
}

export default function InterviewQuestions() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [positionKey, setPositionKey] = useState(() => getInitialPosition(searchParams.get('position')))
  const [category, setCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [showPositionModal, setShowPositionModal] = useState(false)
  const [speaking, setSpeaking] = useState(false)

  const currentData = positionKey ? interviewQuestions[positionKey] : null
  const currentPosition = positionConfig.find((item) => item.key === positionKey)
  const questions = currentData?.questions || emptyQuestions
  const availableCategories = useMemo(
    () => ['all', ...new Set(questions.map((question) => question.category || 'foundation'))],
    [questions]
  )
  const filteredQuestions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return questions.filter((question) => {
      const questionCategory = question.category || 'foundation'
      const matchesCategory = category === 'all' || questionCategory === category
      const matchesSearch = !normalizedSearch
        || question.question.toLowerCase().includes(normalizedSearch)
        || question.tip?.toLowerCase().includes(normalizedSearch)
      return matchesCategory && matchesSearch
    })
  }, [category, questions, searchTerm])

  useEffect(() => () => window.speechSynthesis.cancel(), [])

  const selectPosition = (nextPosition) => {
    setPositionKey(nextPosition)
    setCategory('all')
    setSearchTerm('')
    setSelectedQuestion(null)
    setShowPositionModal(false)
  }

  const speakQuestion = (text) => {
    window.speechSynthesis.cancel()
    if (speaking) {
      setSpeaking(false)
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.9
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const startTraining = (questionId = '') => {
    const params = new URLSearchParams({ position: positionKey, source: 'academy' })
    if (questionId) params.set('question', questionId)
    navigate(`/tasks/phase2/Task7/voice?${params.toString()}`)
  }

  if (!positionKey || !currentData) {
    return (
      <div className="min-h-screen bg-slate-50 pb-24">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-5 pb-6 pt-12">
            <button type="button" onClick={() => navigate('/academy')} className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
              <ArrowLeft size={16} />返回学院
            </button>
            <p className="text-sm font-medium text-blue-700">公开岗位题库</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">选择准备岗位</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">查看该岗位的高频问题、考察重点和难度分布。</p>
          </div>
        </header>

        <main className="mx-auto grid max-w-5xl gap-3 px-5 py-6 md:grid-cols-2">
          {positionConfig.map((position) => (
            <button key={position.key} type="button" onClick={() => selectPosition(position.key)} className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300">
              <h2 className="font-semibold text-slate-950">{position.nameZh}</h2>
              <p className="mt-1 text-sm text-slate-500">{position.nameEn}</p>
              <p className="mt-3 text-sm text-slate-600">{interviewQuestions[position.key]?.questions.length || 0} 道岗位题</p>
            </button>
          ))}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-5 pb-6 pt-12">
          <button type="button" onClick={() => navigate('/academy')} className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
            <ArrowLeft size={16} />返回学院
          </button>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-blue-700">公开岗位题库</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950">{currentPosition?.nameZh} · {currentPosition?.nameEn}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">{questions.length} 道岗位训练题，正式回答与训练记录统一进入任务7。</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">题目结合公开岗位指南与从业者经验编辑，不把个别公司的面试流程当作行业通用规则。</p>
            </div>
            <button type="button" onClick={() => setShowPositionModal(true)} className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">切换岗位</button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="relative block">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="搜索问题或考察重点" className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </label>
            <button type="button" onClick={() => startTraining()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700">
              开始8题训练<ArrowRight size={17} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-6">
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {availableCategories.map((item) => (
            <button key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition ${category === item ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>
              {categoryLabels[item] || item}
            </button>
          ))}
        </div>

        <div className="mb-4 flex items-center justify-between gap-3 text-sm text-slate-500">
          <span className="inline-flex items-center gap-2"><Filter size={15} />{filteredQuestions.length} 道问题</span>
          <button type="button" onClick={() => navigate('/tasks/phase2/Task5')} className="font-semibold text-blue-700">岗位知识在任务5</button>
        </div>

        <section className="grid gap-3">
          {filteredQuestions.map((question) => (
            <button key={question.id} type="button" onClick={() => setSelectedQuestion(question)} className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">{question.order}</div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-6 text-slate-950">{question.question}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`rounded-md px-2 py-1 text-xs font-medium ${getDifficultyClass(question.difficulty)}`}>{difficultyLabels[question.difficulty] || question.difficulty}</span>
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{categoryLabels[question.category || 'foundation']}</span>
                  </div>
                  {question.source && <a href={question.source.url} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="mt-2 inline-flex items-center gap-1 text-xs leading-5 text-slate-500 hover:text-blue-700"><ExternalLink size={12} />来源参考：{question.source.label}</a>}
                </div>
                <ArrowRight size={17} className="mt-1 shrink-0 text-slate-400" />
              </div>
            </button>
          ))}
        </section>

        {filteredQuestions.length === 0 && <div className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-500">没有找到匹配的问题。</div>}
      </main>

      {showPositionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-5 backdrop-blur-sm">
          <div className="max-h-[82vh] w-full max-w-lg overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div><h2 className="text-lg font-semibold text-slate-950">切换题库岗位</h2><p className="mt-1 text-sm text-slate-500">不会改动任务2已经确定的目标岗位。</p></div>
              <button type="button" onClick={() => setShowPositionModal(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {positionConfig.map((position) => (
                <button key={position.key} type="button" onClick={() => selectPosition(position.key)} className={`rounded-lg border p-4 text-left ${positionKey === position.key ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white'}`}>
                  <p className="font-semibold text-slate-950">{position.nameZh}</p><p className="mt-1 text-sm text-slate-500">{position.nameEn}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-5 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-sm font-medium text-blue-700">Q{selectedQuestion.order} · {categoryLabels[selectedQuestion.category || 'foundation']}</p><h2 className="mt-2 text-lg font-semibold leading-7 text-slate-950">{selectedQuestion.question}</h2></div>
              <button type="button" onClick={() => { window.speechSynthesis.cancel(); setSpeaking(false); setSelectedQuestion(null) }} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
            </div>

            <div className="mt-5 rounded-lg border border-amber-100 bg-amber-50 p-4"><p className="text-xs font-semibold text-amber-700">回答重点</p><p className="mt-1 text-sm leading-6 text-amber-950">{selectedQuestion.tip}</p></div>

            {selectedQuestion.source && <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-700">来源参考</p><a href={selectedQuestion.source.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-medium leading-6 text-blue-700 hover:text-blue-800">{selectedQuestion.source.label}<ExternalLink size={14} /></a><p className="mt-1 text-xs leading-5 text-slate-500">{selectedQuestion.sourceNote}</p></div>}

            {selectedQuestion.keywords?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{selectedQuestion.keywords.map((keyword) => <span key={keyword} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{keyword}</span>)}</div>}

            <button type="button" onClick={() => speakQuestion(selectedQuestion.question)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"><Volume2 size={17} />{speaking ? '停止朗读' : '听问题'}</button>
            <button type="button" onClick={() => startTraining(selectedQuestion.id)} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"><Target size={17} />用这题开始任务7训练</button>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-sm leading-6 text-emerald-900"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-700" />语音转写、AI反馈、重练结果和后台记录统一在任务7完成。</div>
          </div>
        </div>
      )}
    </div>
  )
}
