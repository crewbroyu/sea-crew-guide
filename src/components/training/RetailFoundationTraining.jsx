import { useMemo, useState } from 'react'
import { ArrowRight, Bookmark, CheckCircle2, ChevronDown, Clock3, ExternalLink, MapPin, ShoppingBag, Volume2 } from 'lucide-react'
import EdgeReadAloudHint from '../EdgeReadAloudHint'
import GuestChallengePractice from './GuestChallengePractice'
import PhraseShadowingPractice from '../interview/PhraseShadowingPractice'
import FoundationLessonNavigation from './FoundationLessonNavigation'
import {
  RETAIL_FOUNDATION_STORAGE_KEY,
  getCompletedRetailDays,
  getRetailFoundationProgress,
  retailFoundationDays,
  retailFoundationSources,
} from '../../data/retailFoundation'

const speakEnglish = (text) => {
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  const voices = window.speechSynthesis.getVoices()
  utterance.voice = voices.find((voice) => /^en-(US|GB)/i.test(voice.lang))
    || voices.find((voice) => voice.lang?.toLowerCase().startsWith('en'))
    || null
  utterance.lang = utterance.voice?.lang || 'en-US'
  utterance.rate = 0.88
  window.speechSynthesis.speak(utterance)
}

export default function RetailFoundationTraining({ onStartSimulation, onStartQuestions, initialProgress, onProgressChange, onlyDayId = '', showCourseHeader = true, savedLines = [], onToggleSavedLine }) {
  const [progress, setProgress] = useState(() => initialProgress || getRetailFoundationProgress())
  const [activeDayId, setActiveDayId] = useState(() => {
    if (onlyDayId) return onlyDayId
    const savedProgress = initialProgress || getRetailFoundationProgress()
    const firstOpen = retailFoundationDays.find((day) => !savedProgress?.days?.[day.id]?.completedAt)
    return firstOpen?.id || retailFoundationDays[0].id
  })
  const completedDays = useMemo(() => getCompletedRetailDays(progress), [progress])
  const visibleDays = useMemo(() => onlyDayId ? retailFoundationDays.filter((day) => day.id === onlyDayId) : retailFoundationDays, [onlyDayId])
  const [lessonStep, setLessonStep] = useState(0)

  const updateDay = (day, patch) => {
    setProgress((current) => {
      const previous = current.days?.[day.id] || {}
      const nextDay = { ...previous, ...patch }
      const shadowingDone = Boolean(nextDay.shadowing?.completedAt)
      const challengeDone = Boolean(nextDay.guestChallenge?.completedAt)
      const quizDone = nextDay.selectedOptionId === day.quiz.correctOptionId
      const requirementsDone = shadowingDone && challengeDone && quizDone
      nextDay.completedAt = previous.completedAt || (requirementsDone ? new Date().toISOString() : null)
      const next = { ...current, days: { ...(current.days || {}), [day.id]: nextDay } }
      localStorage.setItem(RETAIL_FOUNDATION_STORAGE_KEY, JSON.stringify(next))
      onProgressChange?.(next)
      return next
    })
  }

  const showLessonStep = (step) => !onlyDayId || lessonStep === step

  return (
    <div className="space-y-5">
      {showCourseHeader && <section className="rounded-lg border border-blue-100 bg-blue-50 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-blue-700">RETAIL SALES ASSOCIATE · 8-DAY FOUNDATION</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">Learn the shift, then speak on the shift</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">Each day ends with three shadowing rounds and one Guest Challenge. Local recordings do not use AI quota.</p>
          </div>
          <div className="shrink-0 rounded-lg bg-white px-4 py-3 text-center">
            <p className="text-xs text-slate-500">COMPLETED</p>
            <p className="mt-1 text-xl font-bold text-blue-700">{completedDays}/8</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-blue-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${(completedDays / retailFoundationDays.length) * 100}%` }} /></div>
      </section>}

      <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white px-4 shadow-sm sm:px-5">
        {visibleDays.map((day) => {
          const dayIndex = retailFoundationDays.findIndex((item) => item.id === day.id)
          const dayProgress = progress.days?.[day.id] || {}
          const selectedOption = day.quiz.options.find((option) => option.id === dayProgress.selectedOptionId)
          const isCorrect = selectedOption?.id === day.quiz.correctOptionId
          const isActive = activeDayId === day.id
          const isCompleted = Boolean(dayProgress.completedAt)
          return (
            <article key={day.id}>
              {!onlyDayId && <button type="button" onClick={() => setActiveDayId(isActive ? '' : day.id)} className="flex min-h-16 w-full items-center gap-3 py-3 text-left">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${isCompleted ? 'bg-emerald-50 text-emerald-700' : isActive ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{isCompleted ? <CheckCircle2 size={19} /> : day.day}</span>
                <span className="min-w-0 flex-1"><span className="block text-xs font-medium text-slate-500">DAY {day.day} · {day.duration}</span><span className="mt-0.5 block text-sm font-semibold leading-6 text-slate-900">{day.title}</span></span>
                {!onlyDayId && <ChevronDown size={18} className={`shrink-0 text-slate-400 transition ${isActive ? 'rotate-180' : ''}`} />}
              </button>}

              {isActive && (
                <div className="pb-6 sm:pl-12">
                  {onlyDayId && <FoundationLessonNavigation activeStep={lessonStep} onStepChange={setLessonStep} canAdvance={lessonStep === 3 ? Boolean(dayProgress.shadowing?.completedAt) : lessonStep === 4 ? Boolean(dayProgress.guestChallenge?.completedAt) : true} completed={isCompleted} showControls={false} />}

                  {showLessonStep(0) && <div className="rounded-lg bg-blue-50 p-4"><p className="text-xs font-semibold text-blue-700">TODAY&apos;S MISSION</p><p className="mt-1 text-sm font-medium leading-6 text-blue-950">{day.mission}</p></div>}
                  {showLessonStep(0) && <section className="mt-5 border-y border-slate-200 py-4">
                    <div className="flex items-center gap-2 text-blue-700"><MapPin size={16} /><h3 className="text-xs font-bold">SHIFT BRIEFING</h3></div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-700"><span className="rounded-full bg-slate-100 px-2.5 py-1">{day.shift.location}</span><span className="rounded-full bg-slate-100 px-2.5 py-1">{day.shift.time}</span></div>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{day.shift.situation}</p>
                  </section>}

                  {showLessonStep(1) && <section className="mt-5">
                    <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold text-blue-700">PRONUNCIATION DRILL</p><h3 className="mt-1 text-sm font-bold text-slate-950">Words you need on the sales floor</h3></div><span className="text-xs text-slate-400">English IPA</span></div>
                    <div className="mt-3 divide-y divide-slate-100 border-y border-slate-100">
                      {day.vocabulary.map((item) => <div key={item.term} className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><div className="flex flex-wrap items-baseline gap-2"><p className="font-semibold text-slate-950">{item.term}</p><p className="font-mono text-xs text-blue-700">{item.ipa}</p><p className="text-xs text-slate-500">{item.meaning}</p></div><p className="mt-1 text-sm leading-6 text-slate-700">{item.example}</p></div><div className="flex gap-2"><button type="button" onClick={() => speakEnglish(`${item.term}. ${item.example}`)} title={`Listen to ${item.term}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-blue-700 hover:bg-blue-50"><Volume2 size={17} /></button><button type="button" onClick={() => onToggleSavedLine?.({ text: item.example, cue: `Vocabulary · ${item.term}`, day: day.day, dayId: day.id })} title="Save this example" aria-label={`Save example for ${item.term}`} className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${savedLines.some((line) => line.text === item.example) ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500'}`}><Bookmark size={17} fill={savedLines.some((line) => line.text === item.example) ? 'currentColor' : 'none'} /></button></div></div>)}
                    </div>
                  </section>}

                  {showLessonStep(2) && <section className="mt-5 rounded-lg border border-slate-200 p-4"><div className="flex items-center gap-2"><ShoppingBag size={17} className="text-blue-700" /><h3 className="text-sm font-bold text-slate-950">SHIFT KNOWLEDGE</h3></div><ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">{day.knowledge.map((item) => <li key={item}>• {item}</li>)}</ul></section>}

                  {showLessonStep(3) && <div className="mt-5"><PhraseShadowingPractice phrases={day.serviceLines.map((item) => item.line)} phraseCues={day.serviceLines.map((item) => item.cue)} practice={dayProgress.shadowing || {}} onPracticeChange={(shadowing) => updateDay(day, { shadowing })} requiredPhraseRepetitions={3} requireListenBeforeRecord title="LISTEN AND SHADOW" description="Listen to each line and record it three complete times." savedLines={savedLines} onToggleSavedLine={(text, cue) => onToggleSavedLine?.({ text, cue, day: day.day, dayId: day.id })} /></div>}
                  {showLessonStep(4) && <GuestChallengePractice role={day.challenge.role} prompt={day.challenge.prompt} challenge={dayProgress.guestChallenge || {}} locked={!dayProgress.shadowing?.completedAt} onChallengeChange={(guestChallenge) => updateDay(day, { guestChallenge })} />}
                  {showLessonStep(5) && <section className="mt-5 rounded-lg border border-slate-200 p-4"><div className="flex items-center gap-2 text-slate-700"><Clock3 size={16} /><p className="text-xs font-semibold">COMPLETION CHECK</p></div><h3 className="mt-2 text-sm font-semibold leading-6 text-slate-950">{day.quiz.question}</h3><div className="mt-3 space-y-2">{day.quiz.options.map((option) => { const selected = selectedOption?.id === option.id; const selectedCorrect = selected && option.id === day.quiz.correctOptionId; return <button key={option.id} type="button" onClick={() => updateDay(day, { selectedOptionId: option.id, lastAnsweredAt: new Date().toISOString() })} className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm leading-6 ${selected ? selectedCorrect ? 'border-emerald-300 bg-emerald-50 text-emerald-950' : 'border-amber-300 bg-amber-50 text-amber-950' : 'border-slate-200 bg-white text-slate-700'}`}><span className="font-semibold">{option.id.toUpperCase()}.</span><span>{option.text}</span></button> })}</div>{selectedOption && <div className={`mt-3 rounded-lg p-3 text-sm leading-6 ${isCorrect ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'}`}><p className="font-semibold">{isCorrect ? (isCompleted ? 'Correct. This day is complete.' : 'Correct. Complete the speaking steps to finish this day.') : 'Try that decision again.'}</p><p className="mt-1">{day.quiz.explanation}</p></div>}<div className="mt-4"><EdgeReadAloudHint /></div></section>}

                  {onlyDayId && <FoundationLessonNavigation activeStep={lessonStep} onStepChange={setLessonStep} canAdvance={lessonStep === 3 ? Boolean(dayProgress.shadowing?.completedAt) : lessonStep === 4 ? Boolean(dayProgress.guestChallenge?.completedAt) : true} completed={isCompleted} showProgress={false} />}

                  {!onlyDayId && isCompleted && dayIndex < retailFoundationDays.length - 1 && <button type="button" onClick={() => setActiveDayId(retailFoundationDays[dayIndex + 1].id)} className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">Continue to Day {day.day + 1}<ArrowRight size={16} /></button>}
                </div>
              )}
            </article>
          )
        })}
      </div>

      {!onlyDayId && <section className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold text-blue-700">COURSE BASIS</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">The lessons are original CrewPathGuide training content informed by public job standards and retail education. Company policies, product ranges and promotions always vary by ship and employer.</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">{retailFoundationSources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline">{source.label}<ExternalLink size={13} /></a>)}</div>
      </section>}

      {!onlyDayId && <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={onStartQuestions} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700">Open the Retail question bank<ArrowRight size={17} /></button>
        <button type="button" onClick={onStartSimulation} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white">Start the job simulator<ArrowRight size={17} /></button>
      </div>}
    </div>
  )
}
