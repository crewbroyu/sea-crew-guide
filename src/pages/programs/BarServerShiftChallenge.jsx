import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Cloud,
  CloudOff,
  Headphones,
  RotateCcw,
  ShieldCheck,
  TimerReset,
  Volume2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  BAR_SHIFT_QUESTION_SECONDS,
  getShiftChallengeDrills,
  readBarListeningProgress,
  scoreBarListeningAnswer,
} from '../../data/barServerListening'
import useBarServerPracticeProgress from '../../hooks/useBarServerPracticeProgress'
import { speakEnglish, stopSpeech } from '../../services/ttsService'

const getReadiness = (score) => {
  if (score >= 85) return { label: '班次反应稳定', detail: '关键信息捕捉已经接近实际工作要求。', color: 'text-emerald-700' }
  if (score >= 70) return { label: '基本可以跟上', detail: '大部分场景可处理，但弱项仍会在忙碌时造成错误。', color: 'text-blue-700' }
  return { label: '需要回到训练', detail: '目前在限时和正常语速下仍容易遗漏关键服务信息。', color: 'text-amber-700' }
}

export default function BarServerShiftChallenge() {
  const navigate = useNavigate()
  const {
    listeningProgress,
    shiftHistory,
    syncStatus,
    updateShiftHistory,
  } = useBarServerPracticeProgress()
  const [phase, setPhase] = useState('intro')
  const [challengeDrills, setChallengeDrills] = useState(() => getShiftChallengeDrills(readBarListeningProgress()))
  const [activeIndex, setActiveIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [hasPlayed, setHasPlayed] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(BAR_SHIFT_QUESTION_SECONDS)
  const [locked, setLocked] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [results, setResults] = useState([])
  const [latestAttempt, setLatestAttempt] = useState(null)

  const drill = challengeDrills[activeIndex]
  const isLastQuestion = activeIndex === challengeDrills.length - 1
  const hasAnyAnswer = Object.values(answers).some(Boolean)
  const previousAttempt = useMemo(() => shiftHistory[0] || null, [shiftHistory])

  const averageScore = results.length
    ? Math.round(results.reduce((sum, result) => sum + result.score, 0) / results.length)
    : 0
  const readiness = getReadiness(averageScore)

  const lockAnswer = useCallback((wasTimedOut = false) => {
    if (locked || !drill) return
    const scored = scoreBarListeningAnswer(drill, answers)
    setResults((current) => [
      ...current,
      {
        drillId: drill.id,
        unit: drill.unit,
        level: drill.level,
        score: scored.score,
        timedOut: wasTimedOut,
        responseSeconds: BAR_SHIFT_QUESTION_SECONDS - secondsLeft,
      },
    ])
    setTimedOut(wasTimedOut)
    setLocked(true)
  }, [answers, drill, locked, secondsLeft])

  useEffect(() => () => stopSpeech(), [])

  useEffect(() => {
    if (phase !== 'active' || !hasPlayed || isPlaying || locked) return undefined
    if (secondsLeft <= 0) {
      const timeout = window.setTimeout(() => lockAnswer(true), 0)
      return () => window.clearTimeout(timeout)
    }
    const timer = window.setTimeout(() => setSecondsLeft((current) => current - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [hasPlayed, isPlaying, lockAnswer, locked, phase, secondsLeft])

  const resetQuestionState = () => {
    setAnswers({})
    setHasPlayed(false)
    setIsPlaying(false)
    setSecondsLeft(BAR_SHIFT_QUESTION_SECONDS)
    setLocked(false)
    setTimedOut(false)
  }

  const startChallenge = () => {
    stopSpeech()
    setChallengeDrills(getShiftChallengeDrills(listeningProgress))
    setActiveIndex(0)
    setResults([])
    setLatestAttempt(null)
    resetQuestionState()
    setPhase('active')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const playPrompt = async () => {
    if (hasPlayed || isPlaying) return
    setHasPlayed(true)
    await speakEnglish(drill.prompt, {
      position: 'bar_server',
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
    })
  }

  const continueChallenge = () => {
    stopSpeech()
    if (!isLastQuestion) {
      setActiveIndex((current) => current + 1)
      resetQuestionState()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const score = results.length
      ? Math.round(results.reduce((sum, result) => sum + result.score, 0) / results.length)
      : 0
    const attempt = {
      id: globalThis.crypto?.randomUUID?.() || `shift-${Date.now()}`,
      score,
      completedAt: new Date().toISOString(),
      results,
    }
    updateShiftHistory([attempt, ...shiftHistory])
    setLatestAttempt(attempt)
    setPhase('complete')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-slate-50 pb-24">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-5 pb-8 pt-10">
            <button type="button" onClick={() => navigate('/programs/bar-server/listening')} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700"><ArrowLeft size={17} />返回工作听说训练</button>
            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_360px] md:items-center">
              <div>
                <p className="text-sm font-semibold text-red-700">SHIFT CHALLENGE · 5 个场景</p>
                <h1 className="mt-2 text-3xl font-semibold leading-tight text-slate-950">模拟忙碌班次，检验真实反应</h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">系统会优先抽取你的弱项，并覆盖不同难度。挑战过程不提供慢速、原文或即时答案。</p>
                <p className={`mt-3 flex items-center gap-2 text-xs font-medium ${syncStatus === 'local' ? 'text-amber-700' : 'text-emerald-700'}`}>{syncStatus === 'local' ? <CloudOff size={15} /> : <Cloud size={15} />}{syncStatus === 'synced' ? '账户进度已同步' : syncStatus === 'local' ? '当前保存在本机，联网后会再次同步' : '正在同步账户进度…'}</p>
              </div>
              <img src="/images/bar-server/ep01-busy-night.png" alt="Busy cruise ship bar shift" className="aspect-video w-full rounded-lg object-cover" />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-5 py-7">
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="border-t-2 border-blue-600 bg-white p-5"><Headphones size={20} className="text-blue-700" /><h2 className="mt-3 font-semibold text-slate-950">只播放一次</h2><p className="mt-2 text-sm leading-6 text-slate-600">每题只能听一次正常语速，不能切换慢速。</p></div>
            <div className="border-t-2 border-amber-500 bg-white p-5"><Clock3 size={20} className="text-amber-700" /><h2 className="mt-3 font-semibold text-slate-950">30 秒锁定</h2><p className="mt-2 text-sm leading-6 text-slate-600">播放结束后开始计时，超时将按当前答案提交。</p></div>
            <div className="border-t-2 border-emerald-600 bg-white p-5"><ShieldCheck size={20} className="text-emerald-700" /><h2 className="mt-3 font-semibold text-slate-950">最后统一复盘</h2><p className="mt-2 text-sm leading-6 text-slate-600">中途不公布对错，避免后面的表现被提示影响。</p></div>
          </section>

          {previousAttempt && (
            <section className="mt-6 flex items-center justify-between gap-4 border-y border-slate-200 py-4">
              <div><p className="text-xs font-semibold text-slate-500">上一次班次挑战</p><p className="mt-1 text-sm text-slate-700">{new Date(previousAttempt.completedAt).toLocaleDateString('zh-CN')} · {getReadiness(previousAttempt.score).label}</p></div>
              <p className="text-2xl font-bold text-slate-950">{previousAttempt.score}</p>
            </section>
          )}

          <button type="button" onClick={startChallenge} className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-red-700 px-5 text-sm font-semibold text-white hover:bg-red-800 sm:w-auto"><TimerReset size={18} />开始 5 题班次挑战</button>
        </main>
      </div>
    )
  }

  if (phase === 'complete') {
    const attemptResults = latestAttempt?.results || results
    const weakResults = attemptResults.filter((result) => result.score < 70)
    return (
      <div className="min-h-screen bg-slate-50 pb-24">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-4xl px-5 py-10">
            <p className="text-sm font-semibold text-blue-700">班次挑战完成</p>
            <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div><h1 className={`text-3xl font-semibold ${readiness.color}`}>{readiness.label}</h1><p className="mt-2 text-sm leading-6 text-slate-600">{readiness.detail}</p></div>
              <div className="text-left sm:text-right"><p className="text-xs font-semibold text-slate-500">班次准备度</p><p className="mt-1 text-4xl font-bold text-slate-950">{averageScore}</p></div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-4xl space-y-6 px-5 py-7">
          <section>
            <div className="flex items-center gap-2"><BarChart3 size={19} className="text-blue-700" /><h2 className="font-semibold text-slate-950">五题表现</h2></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-5">
              {attemptResults.map((result, index) => <div key={result.drillId} className={`border-t-2 bg-white p-4 ${result.score >= 70 ? 'border-emerald-500' : 'border-red-500'}`}><p className="text-xs text-slate-500">第 {index + 1} 题</p><p className="mt-1 text-xl font-bold text-slate-950">{result.score}</p><p className="mt-1 text-xs leading-5 text-slate-600">{result.unit}</p></div>)}
            </div>
          </section>

          <section className="border-t border-slate-200 pt-6">
            <h2 className="font-semibold text-slate-950">复盘重点</h2>
            {weakResults.length ? (
              <div className="mt-4 space-y-4">
                {weakResults.map((result) => {
                  const missedDrill = challengeDrills.find((item) => item.id === result.drillId)
                  return <article key={result.drillId} className="rounded-lg border border-red-100 bg-white p-5"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold text-red-700">{result.unit} · 难度 {result.level}</p><span className="text-sm font-bold text-red-700">{result.score}</span></div><p className="mt-3 text-sm leading-6 text-slate-900">{missedDrill?.prompt}</p><p className="mt-2 text-sm leading-6 text-slate-600">{missedDrill?.explanation}</p></article>
                })}
              </div>
            ) : (
              <p className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 size={18} />本次五个场景均达到通过标准。</p>
            )}
          </section>

          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => navigate('/')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800">完成本次训练，返回今天<ArrowRight size={17} /></button>
            <button type="button" onClick={() => navigate('/programs/bar-server/listening')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-5 text-sm font-semibold text-blue-700 hover:bg-blue-50">复盘弱项训练<ArrowRight size={17} /></button>
            <button type="button" onClick={() => navigate('/programs/bar-server/report')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-100"><BarChart3 size={17} />查看完整报告</button>
            <button type="button" onClick={startChallenge} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-100"><RotateCcw size={17} />重新抽题挑战</button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white">
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-5">
          <div><button type="button" onClick={() => navigate('/programs/bar-server/listening')} className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white"><ArrowLeft size={14} />退出挑战</button><p className="text-xs font-semibold text-red-400">SHIFT CHALLENGE</p><p className="mt-1 text-sm text-slate-300">场景 {activeIndex + 1}/{challengeDrills.length} · 难度 {drill.level}</p></div>
          <div className={`flex min-w-20 items-center justify-center gap-2 rounded-md px-3 py-2 text-lg font-bold ${secondsLeft <= 10 ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-100'}`}><Clock3 size={18} />{secondsLeft}s</div>
        </div>
        <div className="h-1 bg-slate-800"><div className={`h-full transition-all ${secondsLeft <= 10 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${(secondsLeft / BAR_SHIFT_QUESTION_SECONDS) * 100}%` }} /></div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-8">
        <p className="text-sm font-medium text-blue-300">{drill.role} · {drill.context}</p>
        <h1 className="mt-2 text-2xl font-semibold leading-tight">{drill.task}</h1>

        <button type="button" onClick={playPrompt} disabled={hasPlayed || isPlaying} className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-lg bg-white px-5 text-sm font-semibold text-slate-950 hover:bg-blue-50 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-400"><Volume2 size={20} />{isPlaying ? '场景播放中…' : hasPlayed ? '本题已播放' : '播放场景并开始计时'}</button>

        <section className="mt-7 border-t border-slate-700 pt-6">
          {!hasPlayed && <p className="text-sm text-slate-400">播放完成后才能作答。</p>}
          {drill.type === 'capture' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {drill.fields.map((field) => (
                <label key={field.key} className="block text-sm font-medium text-slate-300">{field.label}
                  <select value={answers[field.key] || ''} onChange={(event) => setAnswers((current) => ({ ...current, [field.key]: event.target.value }))} disabled={!hasPlayed || isPlaying || locked} className="mt-2 min-h-12 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 text-sm text-white outline-none focus:border-blue-400 disabled:opacity-50"><option value="">请选择</option>{field.options.map((option) => <option key={option} value={option}>{option}</option>)}</select>
                </label>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {drill.options.map((option) => {
                const selected = answers.choice === option.id
                return <button key={option.id} type="button" onClick={() => setAnswers({ choice: option.id })} disabled={!hasPlayed || isPlaying || locked} className={`flex min-h-14 w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm leading-6 ${selected ? 'border-blue-400 bg-blue-950 text-white' : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'} disabled:opacity-50`}><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${selected ? 'border-blue-400 bg-blue-500 text-white' : 'border-slate-500'}`}>{option.id.toUpperCase()}</span><span>{option.text}</span></button>
              })}
            </div>
          )}

          {!locked ? (
            <button type="button" onClick={() => lockAnswer(false)} disabled={!hasPlayed || isPlaying || !hasAnyAnswer} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"><ShieldCheck size={18} />锁定本题</button>
          ) : (
            <div className="mt-6 border-l-4 border-emerald-500 bg-slate-900 px-4 py-4"><p className="text-sm font-semibold text-white">{timedOut ? '时间到，当前答案已自动锁定' : '答案已锁定'}</p><p className="mt-1 text-xs leading-5 text-slate-400">挑战结束前不公布正确答案。</p><button type="button" onClick={continueChallenge} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-950 hover:bg-blue-50">{isLastQuestion ? '查看班次结果' : '进入下一场景'}<ArrowRight size={17} /></button></div>
          )}
        </section>
      </main>
    </div>
  )
}
