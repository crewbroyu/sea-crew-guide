import { Check, ChevronLeft, ChevronRight } from 'lucide-react'

export default function QuestionPage({
  question,
  currentQuestion,
  totalQuestions,
  currentDimension,
  totalDimensions,
  answers,
  onSelectAnswer,
  onNext,
  onPrev,
}) {
  const selectedAnswers = question.type === 'multiple' ? (answers[question.id] || []) : answers[question.id]
  const isMultiple = question.type === 'multiple'
  const hasSelection = isMultiple ? selectedAnswers.length > 0 : !!selectedAnswers

  const handleOptionClick = (optionId) => {
    if (isMultiple) {
      const newSelected = selectedAnswers.includes(optionId)
        ? selectedAnswers.filter((id) => id !== optionId)
        : [...selectedAnswers, optionId]
      onSelectAnswer(question.id, newSelected)
      return
    }

    onSelectAnswer(question.id, optionId)
  }

  const isSelected = (optionId) => (isMultiple ? selectedAnswers.includes(optionId) : selectedAnswers === optionId)

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <main className="mx-auto max-w-3xl px-6 py-6">
        <div className="mb-5 flex items-center justify-between text-sm text-slate-500">
          <span>
            维度 {currentDimension}/{totalDimensions}
          </span>
          <span>
            问题 {currentQuestion + 1}/{totalQuestions}
          </span>
        </div>

        <section className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-2 text-sm font-medium text-blue-700">请按真实情况选择</p>
          <h1 className="text-lg font-bold leading-relaxed text-slate-950">{question.scenario}</h1>
          {isMultiple && (
            <p className="mt-3 text-sm text-slate-500">这道题可以多选。</p>
          )}
        </section>

        <section className="mb-8 space-y-3">
          {question.options.map((option) => {
            const selected = isSelected(option.id)

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleOptionClick(option.id)}
                className={`flex w-full items-start gap-3 rounded-lg border bg-white p-4 text-left shadow-sm transition ${
                  selected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${
                    selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
                  }`}
                >
                  {selected && <Check size={13} />}
                </span>
                <span className="text-sm leading-relaxed text-slate-800">{option.text}</span>
              </button>
            )
          })}
        </section>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onPrev}
            disabled={currentQuestion === 0}
            className="flex items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white py-3 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
          >
            <ChevronLeft size={17} />
            上一题
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!hasSelection}
            className="flex items-center justify-center gap-1 rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {currentQuestion === totalQuestions - 1 ? '完成本维度' : '下一题'}
            <ChevronRight size={17} />
          </button>
        </div>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </main>
    </div>
  )
}
