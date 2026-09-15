import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'

const FOUNDATION_LESSON_STEPS = [
  'Shift briefing',
  'Key vocabulary',
  'Job knowledge',
  'Listen and shadow',
  'Guest Challenge',
  'Completion check',
]

export default function FoundationLessonNavigation({ activeStep, onStepChange, canAdvance = true, completed = false, showProgress = true, showControls = true }) {
  const lastStep = activeStep === FOUNDATION_LESSON_STEPS.length - 1
  const goTo = (nextStep) => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    onStepChange(nextStep)
  }

  return (
    <>
      {showProgress && <div className="mb-5 border-b border-slate-200 pb-4">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold">
          <span className="text-blue-700">STEP {activeStep + 1} OF {FOUNDATION_LESSON_STEPS.length}</span>
          <span className="text-slate-500">{FOUNDATION_LESSON_STEPS[activeStep]}</span>
        </div>
        <div className="mt-2 grid grid-cols-6 gap-1" aria-label="Lesson progress">
          {FOUNDATION_LESSON_STEPS.map((label, index) => (
            <button
              key={label}
              type="button"
              title={label}
              aria-label={`Go to ${label}`}
              onClick={() => goTo(index)}
              className={`h-1.5 rounded-full ${index <= activeStep ? 'bg-blue-600' : 'bg-slate-200'}`}
            />
          ))}
        </div>
      </div>}

      {showControls && <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={activeStep === 0}
          onClick={() => goTo(activeStep - 1)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowLeft size={16} /> Previous
        </button>
        {lastStep ? (
          <div className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold ${completed ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
            {completed && <CheckCircle2 size={16} />}
            {completed ? 'Day completed' : 'Finish the check above'}
          </div>
        ) : (
          <button
            type="button"
            disabled={!canAdvance}
            onClick={() => goTo(activeStep + 1)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Next <ArrowRight size={16} />
          </button>
        )}
      </div>}
    </>
  )
}
