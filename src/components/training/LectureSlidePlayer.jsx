import { useEffect, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Mic, Pause, Play, RotateCcw, Subtitles, XCircle } from 'lucide-react'

const RATES = [0.85, 1, 1.15]

function SlideBody({ slide, quizAnswer, onAnswer, onStartChallenge, onStartShadowing }) {
  switch (slide.layout) {
    case 'cover':
      return (
        <div className="flex h-full flex-col justify-center">
          <p className="text-xs font-semibold tracking-widest text-blue-300">{slide.eyebrow?.toUpperCase()}</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{slide.title}</h2>
          <p className="mt-3 text-sm text-blue-100">{slide.subtitle}</p>
          {slide.bullets.map((item) => <p key={item} className="mt-6 max-w-xl rounded-lg bg-white/10 p-4 text-sm leading-6">{item}</p>)}
        </div>
      )
    case 'columns':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {slide.columns.map((column) => (
            <div key={column.heading} className="rounded-lg bg-white/10 p-4">
              <p className="font-semibold text-blue-200">{column.heading}</p>
              <ul className="mt-3 space-y-2 text-sm leading-6">{column.items.map((item) => <li key={item}>· {item}</li>)}</ul>
            </div>
          ))}
        </div>
      )
    case 'statement':
      return (
        <div className="flex h-full flex-col justify-center">
          <div className="flex flex-wrap gap-2">{slide.tags.map((tag) => <span key={tag} className="rounded-full bg-white/10 px-3 py-1.5 text-sm">{tag}</span>)}</div>
          <p className="mt-8 text-3xl font-bold text-amber-300">→ {slide.statement}</p>
        </div>
      )
    case 'steps':
      return (
        <ol className="space-y-3">
          {slide.steps.map((step, index) => (
            <li key={step} className="flex items-center gap-4 rounded-lg bg-white/10 p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500 font-bold">{slide.startAt + index}</span>
              <span className="text-base font-medium">{step}</span>
            </li>
          ))}
        </ol>
      )
    case 'bullets':
      return <ul className="space-y-3">{slide.bullets.map((item) => <li key={item} className="rounded-lg bg-white/10 p-4 text-sm leading-6">{item}</li>)}</ul>
    case 'vocabulary':
      return (
        <div className="grid gap-2">
          {slide.vocabulary.map((word) => (
            <div key={word.term} className="rounded-lg bg-white/10 px-4 py-2.5">
              <p><span className="font-semibold">{word.term}</span> <span className="text-xs text-blue-200">{word.ipa}</span> <span className="ml-1 text-sm text-amber-200">{word.meaning}</span></p>
              <p className="mt-0.5 text-xs text-blue-100">{word.example}</p>
            </div>
          ))}
        </div>
      )
    case 'lines':
      return (
        <div className="space-y-3">
          {slide.lines.map((item) => (
            <div key={item.line} className="rounded-lg bg-white/10 p-4">
              <p className="text-xs font-semibold text-blue-200">{item.cue}</p>
              <p className="mt-1 text-base font-medium leading-7">{item.line}</p>
            </div>
          ))}
          {onStartShadowing && <button type="button" onClick={onStartShadowing} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-900"><Mic size={16} />去跟读练习</button>}
        </div>
      )
    case 'quiz':
    case 'quizReveal': {
      const reveal = slide.layout === 'quizReveal'
      const { quiz } = slide
      return (
        <div>
          <p className="text-base font-medium leading-7">{quiz.question}</p>
          <div className="mt-4 space-y-2">
            {quiz.options.map((option) => {
              const chosen = quizAnswer === option.id
              const correct = option.id === quiz.correctOptionId
              const tone = reveal && correct ? 'border-emerald-300 bg-emerald-500/20' : reveal && chosen ? 'border-rose-300 bg-rose-500/20' : chosen ? 'border-blue-300 bg-blue-500/30' : 'border-white/20 bg-white/5 hover:bg-white/10'
              return (
                <button key={option.id} type="button" disabled={reveal} onClick={() => onAnswer(option.id)} className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm leading-6 ${tone}`}>
                  <span className="font-bold uppercase">{option.id}.</span>
                  <span className="flex-1">{option.text}</span>
                  {reveal && correct && <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-300" />}
                  {reveal && chosen && !correct && <XCircle size={18} className="mt-0.5 shrink-0 text-rose-300" />}
                </button>
              )
            })}
          </div>
          {reveal && <p className="mt-4 text-sm leading-6 text-emerald-100">{quiz.explanation}</p>}
        </div>
      )
    }
    case 'challenge':
      return (
        <div className="flex h-full flex-col justify-center">
          <p className="text-xs font-semibold text-blue-200">{slide.challenge.role.toUpperCase()}</p>
          <p className="mt-2 text-xl font-medium leading-8">“{slide.challenge.prompt}”</p>
          <p className="mt-5 text-sm text-amber-200">{slide.hint}</p>
          {onStartChallenge && <button type="button" onClick={onStartChallenge} className="mt-6 inline-flex min-h-11 w-fit items-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-slate-900">开始挑战<ArrowRight size={16} /></button>}
        </div>
      )
    default:
      return null
  }
}

export default function LectureSlidePlayer({ lecture, audio, onStartChallenge, onStartShadowing }) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [currentMs, setCurrentMs] = useState(0)
  const [rate, setRate] = useState(1)
  const [showCaptions, setShowCaptions] = useState(true)
  const [quizAnswer, setQuizAnswer] = useState(null)
  const audioRef = useRef(null)
  // Set when the learner (or an auto-advance) wants the next slide to start playing on load.
  const autoplayRef = useRef(false)

  const slide = lecture.slides[index]
  const track = audio?.slides?.[slide.id]
  const audioSrc = track ? `${lecture.audioBase}${slide.id}.mp3` : null
  const isLast = index === lecture.slides.length - 1
  const waitingForAnswer = slide.layout === 'quiz' && !quizAnswer
  const caption = track?.captions.find((item) => currentMs >= item.startMs && currentMs < item.endMs + 250)
    || (currentMs === 0 ? null : track?.captions.findLast((item) => currentMs >= item.startMs))

  useEffect(() => {
    const element = audioRef.current
    if (!element || !audioSrc) return
    element.playbackRate = rate
    if (autoplayRef.current) element.play().catch(() => setPlaying(false))
    // rate is applied separately below; only a slide change should restart playback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioSrc])

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate
  }, [rate])

  useEffect(() => () => audioRef.current?.pause(), [])

  const goTo = (nextIndex, { autoplay = playing } = {}) => {
    if (nextIndex < 0 || nextIndex >= lecture.slides.length) return
    autoplayRef.current = autoplay
    audioRef.current?.pause()
    setPlaying(false)
    setCurrentMs(0)
    setIndex(nextIndex)
  }

  const togglePlay = () => {
    const element = audioRef.current
    if (!element || !audioSrc) return
    if (element.paused) {
      autoplayRef.current = true
      element.play().catch(() => setPlaying(false))
    } else {
      autoplayRef.current = false
      element.pause()
    }
  }

  const handleEnded = () => {
    setPlaying(false)
    // The quiz slide waits for an answer; every other slide flows into the next one like a lecture.
    if (waitingForAnswer || isLast) return
    goTo(index + 1, { autoplay: true })
  }

  const answerQuiz = (optionId) => {
    setQuizAnswer(optionId)
    goTo(index + 1, { autoplay: true })
  }

  const restart = () => {
    setQuizAnswer(null)
    goTo(0, { autoplay: true })
  }

  return (
    <section className="mb-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <p className="text-xs font-semibold text-blue-700">课堂讲解</p>
          <p className="text-sm font-semibold text-slate-900">{slide.title}</p>
        </div>
        <span className="shrink-0 text-xs text-slate-500">{index + 1} / {lecture.slides.length}</span>
      </div>

      <div className="relative bg-gradient-to-br from-slate-900 to-blue-950 px-5 py-6 text-white sm:px-8 sm:py-8">
        <div className="min-h-[20rem] sm:min-h-[22rem]">
          {slide.layout !== 'cover' && slide.layout !== 'challenge' && <h3 className="mb-5 text-xl font-bold">{slide.title}</h3>}
          <SlideBody slide={slide} quizAnswer={quizAnswer} onAnswer={answerQuiz} onStartChallenge={onStartChallenge} onStartShadowing={onStartShadowing} />
        </div>
        {showCaptions && (
          <p aria-live="polite" className="mt-5 min-h-[3rem] rounded-md bg-black/40 px-3 py-2 text-center text-sm leading-6 text-slate-100">
            {caption?.text || (audioSrc ? (playing ? '' : '点击播放，开始这一页的讲解') : '本页讲解音频尚未生成，可以直接翻到下一页')}
          </p>
        )}
      </div>

      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          preload="auto"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={handleEnded}
          onTimeUpdate={(event) => setCurrentMs(event.currentTarget.currentTime * 1000)}
        />
      )}

      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <button type="button" aria-label="上一页" disabled={index === 0} onClick={() => goTo(index - 1)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700 disabled:opacity-40"><ChevronLeft size={18} /></button>
        <button type="button" aria-label={playing ? '暂停' : '播放'} disabled={!audioSrc} onClick={togglePlay} className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white disabled:bg-slate-300">{playing ? <Pause size={18} /> : <Play size={18} />}</button>
        <button type="button" aria-label="下一页" disabled={isLast || waitingForAnswer} onClick={() => goTo(index + 1)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700 disabled:opacity-40"><ChevronRight size={18} /></button>
        <div className="ml-1 flex flex-1 gap-1" aria-label="讲解进度">
          {lecture.slides.map((item, slideIndex) => (
            <button key={item.id} type="button" aria-label={`第 ${slideIndex + 1} 页`} disabled={slideIndex > index && waitingForAnswer} onClick={() => goTo(slideIndex)} className={`h-1.5 flex-1 rounded-full ${slideIndex <= index ? 'bg-blue-600' : 'bg-slate-200'}`} />
          ))}
        </div>
        <button type="button" onClick={() => setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length])} className="h-10 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700">{rate}×</button>
        <button type="button" aria-label="字幕" aria-pressed={showCaptions} onClick={() => setShowCaptions((value) => !value)} className={`flex h-10 w-10 items-center justify-center rounded-lg border ${showCaptions ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-300 text-slate-500'}`}><Subtitles size={18} /></button>
        {isLast && <button type="button" aria-label="从头再听" onClick={restart} className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700"><RotateCcw size={17} /></button>}
      </div>
      {waitingForAnswer && <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">先选一个答案，讲解会自动继续。</p>}
    </section>
  )
}
