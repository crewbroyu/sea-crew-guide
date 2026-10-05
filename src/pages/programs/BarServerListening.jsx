import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Check,
  CheckCircle2,
  Cloud,
  CloudOff,
  Gauge,
  Headphones,
  Mic2,
  RotateCcw,
  TimerReset,
  Volume2,
  X,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PhraseShadowingPractice from '../../components/interview/PhraseShadowingPractice'
import {
  BAR_SERVER_LISTENING_DRILLS,
  getListeningDrillStatus,
  getListeningUnitStats,
  getRecommendedListeningDrill,
  isBarListeningAnswerComplete,
  readBarListeningProgress,
  scoreBarListeningAnswer,
} from '../../data/barServerListening'
import useBarServerPracticeProgress from '../../hooks/useBarServerPracticeProgress'
import { speakEnglish, speakText, stopSpeech } from '../../services/ttsService'

const PASSING_SCORE = 70

const defaultConfig = { drills:BAR_SERVER_LISTENING_DRILLS, getListeningDrillStatus, getListeningUnitStats, getRecommendedListeningDrill, isBarListeningAnswerComplete, scoreBarListeningAnswer, readProgress:readBarListeningProgress, usePracticeProgress:useBarServerPracticeProgress, position:'bar_server', packRoute:'/programs/bar-server', label:'Bar Server' }

export default function BarServerListening({ config = defaultConfig }) {
  const {drills,getListeningDrillStatus,getListeningUnitStats,getRecommendedListeningDrill,isBarListeningAnswerComplete,scoreBarListeningAnswer,usePracticeProgress} = config
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { listeningProgress: progress, syncStatus, updateListeningProgress: updateProgress } = usePracticeProgress()
  const [activeIndex, setActiveIndex] = useState(() => {
    const requested = drills.findIndex(item => item.id === searchParams.get('drill'))
    if (requested >= 0) return requested
    const savedProgress = progress
    const firstIncomplete = drills.findIndex((drill) => !savedProgress[drill.id]?.completedAt)
    return firstIncomplete === -1 ? 0 : firstIncomplete
  })
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [playingMode, setPlayingMode] = useState(null)
  const [playbackError, setPlaybackError] = useState('')
  const playbackAttempt = useRef(0)

  const drill = drills[activeIndex]
  const drillProgress = progress[drill.id] || {}
  const completedCount = drills.filter((item) => progress[item.id]?.completedAt).length
  const speakingCompletedCount = drills.filter(
    (item) => progress[item.id]?.speakingPractice?.completedAt,
  ).length
  const bestScores = drills
    .map((item) => progress[item.id]?.bestScore)
    .filter((score) => Number.isFinite(score))
  const averageScore = bestScores.length
    ? Math.round(bestScores.reduce((sum, score) => sum + score, 0) / bestScores.length)
    : 0
  const normalPlayCount = drills.reduce(
    (sum, item) => sum + (progress[item.id]?.normalPlays || 0),
    0,
  )
  const recommendation = getRecommendedListeningDrill(progress)
  const unitStats = getListeningUnitStats(progress)

  const canSubmit = isBarListeningAnswerComplete(drill, answers)
  const hasListenedAtNormalSpeed = (drillProgress.normalPlays || 0) > 0
  const canUseSlowPlayback = hasListenedAtNormalSpeed
  const isLastDrill = activeIndex === drills.length - 1

  const drillNumberById = useMemo(() => Object.fromEntries(
    drills.map((item, index) => [item.id, index + 1]),
  ), [drills])

  useEffect(() => () => { playbackAttempt.current += 1; stopSpeech() }, [])

  const updateSpeakingPractice = (speakingPractice) => {
    updateProgress({
      ...progress,
      [drill.id]: {
        ...(progress[drill.id] || {}),
        speakingPractice,
      },
    })
  }

  const selectDrill = (index) => {
    playbackAttempt.current += 1
    setPlaybackError('')
    stopSpeech()
    setPlayingMode(null)
    setActiveIndex(index)
    setAnswers({})
    setResult(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const playPrompt = async (mode) => {
    if (playingMode) return
    const attempt = ++playbackAttempt.current
    setPlayingMode(mode)
    setPlaybackError('')
    try {
      const options = { lang: 'en-US', position: config.position }
      const played = mode === 'normal'
        ? await speakEnglish(drill.prompt, options)
        : await speakText(drill.prompt, { ...options, rate: 0.72 })
      if (attempt !== playbackAttempt.current) return
      if (!played || ['none', 'cancelled'].includes(played.provider)) {
        setPlaybackError('音频未能播放，请检查浏览器声音支持后重试。')
        return
      }
      const countKey = mode === 'normal' ? 'normalPlays' : 'slowPlays'
      updateProgress({ ...progress, [drill.id]: { ...drillProgress, [countKey]: (drillProgress[countKey] || 0) + 1 } })
    } catch {
      if (attempt === playbackAttempt.current) setPlaybackError('音频播放失败，请重试。')
    } finally {
      if (attempt === playbackAttempt.current) setPlayingMode(null)
    }
  }

  const submitAnswer = () => {
    if (!canSubmit || result || !hasListenedAtNormalSpeed || playingMode) return
    const scored = scoreBarListeningAnswer(drill, answers)
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
    if (isLastDrill && completedCount === drills.length && drillProgress.speakingPractice?.completedAt) {
      navigate('/')
      return
    }
    const nextIndex = isLastDrill
      ? drills.findIndex((item) => !progress[item.id]?.completedAt)
      : activeIndex + 1
    selectDrill(nextIndex === -1 ? 0 : nextIndex)
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 pb-7 pt-10">
          <button type="button" onClick={() => navigate(config.packRoute)} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700">
            <ArrowLeft size={17} />返回 {config.label} 学习包
          </button>
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold text-blue-700">工作听说 · 12 个短场景</p>
              <h1 className="mt-2 text-3xl font-semibold leading-tight text-slate-950">先听懂关键信息，再学会正确处理</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">原文会在提交后出现。正常速度至少听一次，没听清再使用慢速；训练目标不是听懂每个单词，而是抓住会影响服务的关键信息。</p>
              <p className={`mt-3 flex items-center gap-2 text-xs font-medium ${syncStatus === 'local' ? 'text-amber-700' : 'text-emerald-700'}`}>{syncStatus === 'local' ? <CloudOff size={15} /> : <Cloud size={15} />}{syncStatus === 'synced' ? '账户进度已同步' : syncStatus === 'local' ? '当前保存在本机，联网后会再次同步' : '正在同步账户进度…'}</p>
              <button type="button" onClick={() => navigate(config.packRoute + '/listening/shift')} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800"><TimerReset size={17} />进入 5 题班次挑战</button>
            </div>
            <div className="grid min-w-full grid-cols-2 gap-3 sm:grid-cols-4 md:min-w-[480px]">
              <div className="border-l-2 border-blue-600 pl-3"><p className="text-xs text-slate-500">听力通过</p><p className="mt-1 text-xl font-bold text-slate-950">{completedCount}/12</p></div>
              <div className="border-l-2 border-emerald-600 pl-3"><p className="text-xs text-slate-500">开口完成</p><p className="mt-1 text-xl font-bold text-slate-950">{speakingCompletedCount}/12</p></div>
              <div className="border-l-2 border-violet-500 pl-3"><p className="text-xs text-slate-500">最佳均分</p><p className="mt-1 text-xl font-bold text-slate-950">{averageScore}</p></div>
              <div className="border-l-2 border-amber-500 pl-3"><p className="text-xs text-slate-500">正常速播放</p><p className="mt-1 text-xl font-bold text-slate-950">{normalPlayCount}</p></div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-5 py-7 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="self-start lg:sticky lg:top-5">
          <p className="text-xs font-semibold text-slate-500">训练进度</p>
          <div className="mt-3 grid grid-cols-6 gap-2 sm:grid-cols-12 lg:grid-cols-4">
            {drills.map((item, index) => {
              const isActive = item.id === drill.id
              const isComplete = Boolean(progress[item.id]?.completedAt)
              const status = getListeningDrillStatus(item, progress)
              const isMastered = status === 'mastered'
              const needsReview = ['needs_listening', 'needs_normal_speed'].includes(status)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectDrill(index)}
                  aria-label={`第 ${drillNumberById[item.id]} 题${isMastered ? '，听说已完成' : isComplete ? '，待开口' : needsReview ? '，待复习' : ''}`}
                  className={`flex aspect-square items-center justify-center rounded-md border text-sm font-semibold transition ${isActive ? 'border-blue-600 bg-blue-600 text-white' : isMastered ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : needsReview ? 'border-red-200 bg-red-50 text-red-700' : isComplete ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'}`}
                >
                  {isMastered ? <Check size={17} /> : isComplete ? <Mic2 size={15} /> : index + 1}
                </button>
              )
            })}
          </div>
          <div className="mt-5 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">
            <p><span className="font-semibold text-slate-700">通过标准：</span>70 分</p>
            <p className="mt-1">绿色为听说完成，黄色为待开口，红色为待复习。</p>
          </div>

          <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-2 text-blue-800"><BrainCircuit size={17} /><p className="text-xs font-semibold">智能下一步</p></div>
            <p className="mt-2 text-sm font-semibold leading-5 text-blue-950">第 {recommendation.index + 1} 题 · {recommendation.drill.unit}</p>
            <p className="mt-1 text-xs leading-5 text-blue-800">{recommendation.reason}</p>
            <button
              type="button"
              onClick={() => selectDrill(recommendation.index)}
              disabled={recommendation.index === activeIndex}
              className="mt-3 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-md bg-blue-700 px-3 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-default disabled:bg-blue-200 disabled:text-blue-700"
            >
              {recommendation.index === activeIndex ? '正在训练这一题' : `继续第 ${recommendation.index + 1} 题`}
              {recommendation.index !== activeIndex && <ArrowRight size={14} />}
            </button>
          </div>

          <details className="mt-5 border-t border-slate-200 pt-4">
            <summary className="cursor-pointer text-xs font-semibold text-slate-700">查看能力分布</summary>
            <div className="mt-3 space-y-3">
              {unitStats.map((unit) => (
                <div key={unit.unit}>
                  <div className="flex items-center justify-between gap-2 text-xs"><span className="font-medium text-slate-700">{unit.unit}</span><span className="text-slate-500">听 {unit.listeningCompleted}/{unit.total} · 说 {unit.speakingCompleted}/{unit.total}</span></div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-emerald-500" style={{ width: `${unit.total ? (unit.speakingCompleted / unit.total) * 100 : 0}%` }} /></div>
                </div>
              ))}
            </div>
          </details>
        </aside>

        <div className="space-y-5">
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
            {playbackError && <p role="alert" className="mb-3 text-sm text-amber-800">{playbackError}</p>}
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
                  disabled={!canSubmit || !hasListenedAtNormalSpeed || Boolean(playingMode)}
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

                <div className="mt-6">
                  <button type="button" onClick={retry} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    <RotateCcw size={17} />重新听这题
                  </button>
                  <p className="mt-3 text-xs leading-5 text-slate-500">听力核对完成。接下来把专业回应听一遍、开口两次，再进入下一题。</p>
                </div>
              </div>
            )}
          </div>
          </section>

          {result && (
            <>
              <PhraseShadowingPractice
                key={drill.id}
                position={config.position}
                phrases={[drill.response]}
                phraseCues={[drill.responseCue]}
                practice={drillProgress.speakingPractice || {}}
                onPracticeChange={updateSpeakingPractice}
                requiredPhraseRepetitions={2}
                requireListenBeforeRecord
                title="听懂以后，怎么回应"
                description="先听专业回应，再完整录音两次。重点练服务顺序和确认方式，不要求逐字死背。"
                completeMessage="已完成两次开口训练，可以进入下一题。"
                incompleteMessage="先听示范，再完成两次完整录音。"
              />
              <button
                type="button"
                onClick={nextDrill}
                className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition ${drillProgress.speakingPractice?.completedAt ? 'bg-blue-700 text-white hover:bg-blue-800' : 'border border-slate-300 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700'}`}
              >
                {drillProgress.speakingPractice?.completedAt
                  ? (isLastDrill && completedCount === drills.length ? '听说训练完成，返回今天' : '开口训练完成，进入下一题')
                  : '暂时跳过开口训练，进入下一题'}
                <ArrowRight size={17} />
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
