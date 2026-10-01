import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Gauge,
  Headphones,
  RotateCcw,
  Volume2,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  BAR_LISTENING_PROGRESS_KEY,
  BAR_SERVER_LISTENING_DRILLS,
  readBarListeningProgress,
} from '../../data/barServerListening'
import { speakEnglish, speakText, stopSpeech } from '../../services/ttsService'

const PASSING_SCORE = 70

const saveProgress = (progress) => {
  localStorage.setItem(BAR_LISTENING_PROGRESS_KEY, JSON.stringify(progress))
}

const scoreAnswer = (drill, answers) => {
  if (drill.type === 'choice') {
    return {
      score: answers.choice === drill.correctOptionId ? 100 : 0,
      fields: [],
    }
  }

  const fields = drill.fields.map((field) => ({
    key: field.key,
    label: field.label,
    answer: answers[field.key] || '',
    correct: field.correct,
    isCorrect: answers[field.key] === field.correct,
  }))
  const correctCount = fields.filter((field) => field.isCorrect).length
  return {
    score: Math.round((correctCount / fields.length) * 100),
    fields,
  }
}

const hasCompleteAnswer = (drill, answers) => (
  drill.type === 'choice'
    ? Boolean(answers.choice)
    : drill.fields.every((field) => answers[field.key])
)

export default function BarServerListening() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(() => readBarListeningProgress())
  const [activeIndex, setActiveIndex] = useState(() => {
    const savedProgress = readBarListeningProgress()
    const firstIncomplete = BAR_SERVER_LISTENING_DRILLS.findIndex((drill) => !savedProgress[drill.id]?.completedAt)
    return firstIncomplete === -1 ? 0 : firstIncomplete
  })
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [playingMode, setPlayingMode] = useState(null)

  const drill = BAR_SERVER_LISTENING_DRILLS[activeIndex]
  const drillProgress = progress[drill.id] || {}
  const completedCount = BAR_SERVER_LISTENING_DRILLS.filter((item) => progress[item.id]?.completedAt).length
  const bestScores = BAR_SERVER_LISTENING_DRILLS
    .map((item) => progress[item.id]?.bestScore)
    .filter((score) => Number.isFinite(score))
  const averageScore = bestScores.length
    ? Math.round(bestScores.reduce((sum, score) => sum + score, 0) / bestScores.length)
    : 0
  const normalPlayCount = BAR_SERVER_LISTENING_DRILLS.reduce(
    (sum, item) => sum + (progress[item.id]?.normalPlays || 0),
    0,
  )

  const canSubmit = hasCompleteAnswer(drill, answers)
  const hasListenedAtNormalSpeed = (drillProgress.normalPlays || 0) > 0
  const canUseSlowPlayback = hasListenedAtNormalSpeed
  const isLastDrill = activeIndex === BAR_SERVER_LISTENING_DRILLS.length - 1

  const drillNumberById = useMemo(() => Object.fromEntries(
    BAR_SERVER_LISTENING_DRILLS.map((item, index) => [item.id, index + 1]),
  ), [])

  useEffect(() => () => stopSpeech(), [])

  const updateProgress = (nextProgress) => {
    setProgress(nextProgress)
    saveProgress(nextProgress)
  }

  const selectDrill = (index) => {
    stopSpeech()
    setPlayingMode(null)
    setActiveIndex(index)
    setAnswers({})
    setResult(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const playPrompt = async (mode) => {
    if (playingMode) return
    const countKey = mode === 'normal' ? 'normalPlays' : 'slowPlays'
    const nextProgress = {
      ...progress,
      [drill.id]: {
        ...drillProgress,
        [countKey]: (drillProgress[countKey] || 0) + 1,
      },
    }
    updateProgress(nextProgress)

    const options = {
      lang: 'en-US',
      onStart: () => setPlayingMode(mode),
      onEnd: () => setPlayingMode(null),
    }
    if (mode === 'normal') {
      await speakEnglish(drill.prompt, { ...options, position: 'bar_server' })
    } else {
      await speakText(drill.prompt, { ...options, rate: 0.72 })
    }
  }

  const submitAnswer = () => {
    if (!canSubmit || result) return
    const scored = scoreAnswer(drill, answers)
    const previous = progress[drill.id] || {}
    const now = new Date().toISOString()
    const nextProgress = {
      ...progress,
      [drill.id]: {
        ...previous,
        attempts: (previous.attempts || 0) + 1,
        lastScore: scored.score,
        bestScore: Math.max(previous.bestScore || 0, scored.score),
        lastAttemptAt: now,
        completedAt: scored.score >= PASSING_SCORE ? (previous.completedAt || now) : previous.completedAt,
      },
    }
    updateProgress(nextProgress)
    setResult(scored)
  }

  const retry = () => {
    setAnswers({})
    setResult(null)
  }

  const nextDrill = () => {
    const nextIndex = isLastDrill
      ? BAR_SERVER_LISTENING_DRILLS.findIndex((item) => !progress[item.id]?.completedAt)
      : activeIndex + 1
    selectDrill(nextIndex === -1 ? 0 : nextIndex)
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 pb-7 pt-10">
          <button type="button" onClick={() => navigate('/programs/bar-server')} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700">
            <ArrowLeft size={17} />返回 Bar Server 学习包
          </button>
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold text-blue-700">工作听力 · 12 个短场景</p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight text-slate-950">先听懂关键信息，再学会正确处理</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">原文会在提交后出现。正常速度至少听一次，没听清再使用慢速；训练目标不是听懂每个单词，而是抓住会影响服务的关键信息。</p>
            </div>
            <div className="grid min-w-full grid-cols-3 gap-2 md:min-w-[360px]">
              <div className="border-l-2 border-blue-600 pl-3"><p className="text-xs text-slate-500">已通过</p><p className="mt-1 text-xl font-bold text-slate-950">{completedCount}/12</p></div>
              <div className="border-l-2 border-emerald-600 pl-3"><p className="text-xs text-slate-500">最佳均分</p><p className="mt-1 text-xl font-bold text-slate-950">{averageScore}</p></div>
              <div className="border-l-2 border-amber-500 pl-3"><p className="text-xs text-slate-500">正常速播放</p><p className="mt-1 text-xl font-bold text-slate-950">{normalPlayCount}</p></div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-5 py-7 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="self-start lg:sticky lg:top-5">
          <p className="text-xs font-semibold text-slate-500">训练进度</p>
          <div className="mt-3 grid grid-cols-6 gap-2 sm:grid-cols-12 lg:grid-cols-4">
            {BAR_SERVER_LISTENING_DRILLS.map((item, index) => {
              const isActive = item.id === drill.id
              const isComplete = Boolean(progress[item.id]?.completedAt)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectDrill(index)}
                  aria-label={`第 ${drillNumberById[item.id]} 题${isComplete ? '，已通过' : ''}`}
                  className={`flex aspect-square items-center justify-center rounded-md border text-sm font-semibold transition ${isActive ? 'border-blue-600 bg-blue-600 text-white' : isComplete ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'}`}
                >
                  {isComplete ? <Check size={17} /> : index + 1}
                </button>
              )
            })}
          </div>
          <div className="mt-5 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">
            <p><span className="font-semibold text-slate-700">通过标准：</span>70 分</p>
            <p className="mt-1">可以重复练习，系统保留每题最佳成绩。</p>
          </div>
        </aside>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-950 px-5 py-5 text-white sm:px-7">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded-md bg-white/10 px-2.5 py-1">第 {activeIndex + 1} 题</span>
              <span className="rounded-md bg-white/10 px-2.5 py-1">难度 {drill.level}</span>
              <span className="rounded-md bg-white/10 px-2.5 py-1">{drill.unit}</span>
            </div>
            <p className="mt-4 text-sm font-medium text-blue-200">{drill.role} · {drill.context}</p>
            <h2 className="mt-2 text-xl font-semibold">{drill.task}</h2>
          </div>

          <div className="p-5 sm:p-7">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => playPrompt('normal')}
                disabled={Boolean(playingMode)}
                className="inline-flex min-h-14 items-center justify-center gap-3 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60"
              >
                <Volume2 size={20} />{playingMode === 'normal' ? '正常速度播放中…' : '播放正常速度'}
              </button>
              <button
                type="button"
                onClick={() => playPrompt('slow')}
                disabled={!canUseSlowPlayback || Boolean(playingMode)}
                className="inline-flex min-h-14 items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                <Gauge size={20} />{playingMode === 'slow' ? '慢速播放中…' : canUseSlowPlayback ? '慢速再听一次' : '先听一次正常速度'}
              </button>
            </div>

            <div className="mt-7 border-t border-slate-200 pt-6">
              <div className="flex items-center gap-2">
                <Headphones size={18} className="text-blue-700" />
                <h3 className="font-semibold text-slate-950">提交你听到的关键信息</h3>
              </div>

              {!hasListenedAtNormalSpeed && (
                <p className="mt-3 text-sm text-amber-700">先播放一次正常速度，答题区随后开放。</p>
              )}

              {drill.type === 'capture' ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {drill.fields.map((field) => {
                    const fieldResult = result?.fields.find((item) => item.key === field.key)
                    return (
                      <label key={field.key} className="block text-sm font-medium text-slate-700">
                        {field.label}
                        <select
                          value={answers[field.key] || ''}
                          onChange={(event) => setAnswers((current) => ({ ...current, [field.key]: event.target.value }))}
                          disabled={Boolean(result) || !hasListenedAtNormalSpeed}
                          className={`mt-2 min-h-12 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-200 ${fieldResult ? fieldResult.isCorrect ? 'border-emerald-500' : 'border-red-400' : 'border-slate-300'}`}
                        >
                          <option value="">请选择</option>
                          {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                        {fieldResult && (
                          <span className={`mt-1.5 flex items-center gap-1 text-xs ${fieldResult.isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                            {fieldResult.isCorrect ? <Check size={14} /> : <X size={14} />}
                            {fieldResult.isCorrect ? '捕捉正确' : `正确答案：${fieldResult.correct}`}
                          </span>
                        )}
                      </label>
                    )
                  })}
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {drill.options.map((option) => {
                    const selected = answers.choice === option.id
                    const isCorrect = result && option.id === drill.correctOptionId
                    const isIncorrectSelection = result && selected && !isCorrect
                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={Boolean(result) || !hasListenedAtNormalSpeed}
                        onClick={() => setAnswers({ choice: option.id })}
                        className={`flex min-h-14 w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm leading-6 transition ${isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : isIncorrectSelection ? 'border-red-400 bg-red-50 text-red-900' : selected ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'}`}
                      >
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'}`}>{option.id.toUpperCase()}</span>
                        <span>{option.text}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {!result && (
                <button
                  type="button"
                  onClick={submitAnswer}
                  disabled={!canSubmit || !hasListenedAtNormalSpeed}
                  className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
                >
                  <CheckCircle2 size={18} />提交答案
                </button>
              )}
            </div>

            {result && (
              <div className="mt-7 border-t border-slate-200 pt-6">
                <div className={`border-l-4 px-4 py-3 ${result.score >= PASSING_SCORE ? 'border-emerald-600 bg-emerald-50' : 'border-amber-500 bg-amber-50'}`}>
                  <p className="text-sm font-semibold text-slate-950">本次得分 {result.score} · {result.score >= PASSING_SCORE ? '已通过' : '还差一点，再听一次'}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{drill.explanation}</p>
                </div>

                <div className="mt-5">
                  <p className="text-xs font-semibold text-slate-500">听力原文</p>
                  <p className="mt-2 border-l-2 border-blue-500 pl-4 text-base leading-7 text-slate-900">{drill.prompt}</p>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button type="button" onClick={retry} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    <RotateCcw size={17} />重新听这题
                  </button>
                  <button type="button" onClick={nextDrill} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800">
                    {isLastDrill && completedCount === BAR_SERVER_LISTENING_DRILLS.length ? '回到第一题复习' : '进入下一题'}<ArrowRight size={17} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
