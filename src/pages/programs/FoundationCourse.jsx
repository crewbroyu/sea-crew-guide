import { createElement, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Bookmark, CheckCircle2, CircleAlert, ClipboardCheck, Dumbbell, LockKeyhole, Sparkles } from 'lucide-react'
import RequireActivation from '../../components/RequireActivation'
import BarServerFoundationTraining from '../../components/training/BarServerFoundationTraining'
import RetailFoundationTraining from '../../components/training/RetailFoundationTraining'
import { getFoundationCourse } from '../../data/foundationCourseCatalog'
import { getJobSkills, getScenarioById } from '../../data/jobScenarioCatalog'
import { getMyScenarioProfile } from '../../services/scenarioTrainingService'
import { getMyFoundationCourseState, upsertMyFoundationCourseState } from '../../services/jobPreparationService'
import {
  findContinueFoundationDay,
  getFoundationCompletedCount,
  getFoundationDayProgress,
  isFoundationDayFinished,
  readFoundationPlacement,
  readFoundationProgress,
  readSavedFoundationLines,
  writeFoundationPlacement,
  writeFoundationProgress,
  writeSavedFoundationLines,
} from '../../services/foundationProgressService'

const viewOptions = [
  { key: 'course', label: '课程目录', icon: ClipboardCheck },
  { key: 'practice', label: '弱项训练', icon: Dumbbell },
  { key: 'placement', label: '入门检查', icon: Sparkles },
]

const getRecommendedStart = (course, answers) => {
  const quizDays = course.days.filter((day) => day.quiz)
  const correct = quizDays.filter((day) => answers[day.id] === day.quiz.correctOptionId).length
  const firstGap = quizDays.find((day) => answers[day.id] !== day.quiz.correctOptionId)
  const questionCount = quizDays.length
  const ratio = questionCount ? correct / questionCount : 0
  if (ratio >= 0.8) return { score: correct, total: questionCount, dayId: course.days[Math.max(course.days.length - 3, 0)].id, label: '可从后三天开始，并随时回顾前面内容' }
  if (ratio >= 0.55) return { score: correct, total: questionCount, dayId: firstGap?.id || course.days[Math.floor(course.days.length / 2)].id, label: `建议从第一个知识缺口 Day ${firstGap?.day || Math.ceil(course.days.length / 2)} 开始` }
  return { score: correct, total: questionCount, dayId: firstGap?.id || course.days[0].id, label: `建议从 Day ${firstGap?.day || 1} 开始打好基础` }
}

const mergeObjects = (cloudValue, localValue) => {
  if (!cloudValue || typeof cloudValue !== 'object' || Array.isArray(cloudValue)) return localValue ?? cloudValue
  if (!localValue || typeof localValue !== 'object' || Array.isArray(localValue)) return localValue ?? cloudValue
  return Object.fromEntries([...new Set([...Object.keys(cloudValue), ...Object.keys(localValue)])].map((key) => [
    key,
    mergeObjects(cloudValue[key], localValue[key]),
  ]))
}

const mergeSavedLines = (cloudLines = [], localLines = []) => {
  const byText = new Map()
  ;[...cloudLines, ...localLines].forEach((line) => {
    if (line?.text) byText.set(line.text, line)
  })
  return [...byText.values()].slice(0, 100)
}

export default function FoundationCourse() {
  const { jobSlug, dayId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const course = getFoundationCourse(jobSlug)
  const [progress, setProgress] = useState(() => course ? readFoundationProgress(course.jobKey) : {})
  const [savedLines, setSavedLines] = useState(() => course ? readSavedFoundationLines(course.jobKey) : [])
  const [placementAnswers, setPlacementAnswers] = useState({})
  const [placement, setPlacement] = useState(() => course ? readFoundationPlacement(course.jobKey) : null)
  const [scenarioProfile, setScenarioProfile] = useState(null)
  const [cloudReady, setCloudReady] = useState(false)
  const view = searchParams.get('view') || 'course'

  useEffect(() => {
    if (!course) return
    let active = true
    getMyScenarioProfile(course.jobKey)
      .then((profile) => { if (active) setScenarioProfile(profile) })
      .catch(() => {})
    return () => { active = false }
  }, [course])

  useEffect(() => {
    if (!course) return
    let active = true
    getMyFoundationCourseState(course.jobKey)
      .then((cloudState) => {
        if (!active || !cloudState || cloudState.version !== course.version) return
        const mergedProgress = mergeObjects(cloudState.progress || {}, readFoundationProgress(course.jobKey))
        const mergedLines = mergeSavedLines(cloudState.savedLines, readSavedFoundationLines(course.jobKey))
        const localPlacement = readFoundationPlacement(course.jobKey)
        const mergedPlacement = localPlacement || cloudState.placement || null
        setProgress(mergedProgress)
        setSavedLines(mergedLines)
        setPlacement(mergedPlacement)
        writeFoundationProgress(course.jobKey, mergedProgress)
        writeSavedFoundationLines(course.jobKey, mergedLines)
        if (mergedPlacement) writeFoundationPlacement(course.jobKey, mergedPlacement)
      })
      .catch((error) => console.warn('Unable to restore foundation course state:', error))
      .finally(() => { if (active) setCloudReady(true) })
    return () => { active = false }
  }, [course])

  useEffect(() => {
    if (!course || !cloudReady) return undefined
    const timeout = window.setTimeout(() => {
      upsertMyFoundationCourseState({
        jobKey: course.jobKey,
        roleKey: course.roleKey,
        roleTitle: course.title,
        version: course.version,
        progress,
        savedLines,
        placement,
      }).catch((error) => console.warn('Unable to sync foundation course state:', error))
    }, 800)
    return () => window.clearTimeout(timeout)
  }, [cloudReady, course, placement, progress, savedLines])

  const completedCount = course ? getFoundationCompletedCount(course, progress) : 0
  const continueDay = course ? findContinueFoundationDay(course, progress) : null
  const selectedDay = course?.days.find((day) => day.id === dayId) || null
  const dayIndex = selectedDay ? course.days.indexOf(selectedDay) : -1
  const nextDay = dayIndex >= 0 ? course.days[dayIndex + 1] : null
  const weakestSkillLabel = getJobSkills(course?.jobKey).find((skill) => skill.key === scenarioProfile?.weakest_skill)?.label
    || scenarioProfile?.weakest_skill
  const recommendedScenario = getScenarioById(scenarioProfile?.recommended_scenario_id)

  const reviewItems = useMemo(() => {
    if (!course) return []
    return course.days.flatMap((day) => {
      const dayProgress = getFoundationDayProgress(course.jobKey, progress, day.id)
      const items = []
      if (dayProgress.selectedOptionId && day.quiz && dayProgress.selectedOptionId !== day.quiz.correctOptionId) items.push({ day, reason: '完成检查曾答错' })
      if (dayProgress.shadowing && !dayProgress.shadowing.completedAt) items.push({ day, reason: '跟读还未达标' })
      if (dayProgress.guestChallenge && !dayProgress.guestChallenge.completedAt) items.push({ day, reason: 'Guest Challenge 还未完成' })
      if (Number(dayProgress.practice?.bestScore || 100) < 70) items.push({ day, reason: `口头运用 ${dayProgress.practice.bestScore}/100` })
      return items
    })
  }, [course, progress])

  if (!course || (dayId && !selectedDay)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <CircleAlert size={32} className="mx-auto text-amber-600" />
          <h1 className="mt-4 text-xl font-semibold text-slate-950">没有找到这节课程</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">课程地址可能已经更新。请返回海乘学院重新选择岗位课程。</p>
          <button type="button" onClick={() => navigate('/academy/position-english')} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white">返回岗位课程</button>
        </section>
      </div>
    )
  }

  const updateProgress = (next) => {
    setProgress(next)
    writeFoundationProgress(course.jobKey, next)
  }

  const toggleSavedLine = (line) => {
    const exists = savedLines.some((item) => item.text === line.text)
    const next = exists ? savedLines.filter((item) => item.text !== line.text) : [...savedLines, line]
    setSavedLines(next)
    writeSavedFoundationLines(course.jobKey, next)
  }

  const submitPlacement = () => {
    const result = { ...getRecommendedStart(course, placementAnswers), completedAt: new Date().toISOString() }
    setPlacement(result)
    writeFoundationPlacement(course.jobKey, result)
  }

  const lessonPage = selectedDay ? (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-5 py-4">
          <button type="button" onClick={() => navigate(`/programs/${course.slug}/foundation`)} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"><ArrowLeft size={17} />返回课程目录</button>
          <div className="mt-3 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold text-blue-700">DAY {selectedDay.day} OF {course.days.length}</p><h1 className="mt-1 text-xl font-semibold text-slate-950">{selectedDay.title}</h1></div><span className="shrink-0 text-xs text-slate-500">{selectedDay.duration}</span></div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${((dayIndex + 1) / course.days.length) * 100}%` }} /></div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-6">
        {course.jobKey === 'bar_server' ? (
          <BarServerFoundationTraining key={selectedDay.id} progress={progress} onProgressChange={updateProgress} onlyDayId={selectedDay.id} showCourseHeader={false} savedLines={savedLines} onToggleSavedLine={toggleSavedLine} onStartTask6={() => navigate(course.task6Route)} onStartTask7={() => navigate('/tasks/phase2/Task7/voice?mode=knowledge&position=bar_server&source=task5')} onStartScenarioTraining={() => navigate(course.simulatorRoute)} />
        ) : (
          <RetailFoundationTraining key={selectedDay.id} initialProgress={progress} onProgressChange={updateProgress} onlyDayId={selectedDay.id} showCourseHeader={false} savedLines={savedLines} onToggleSavedLine={toggleSavedLine} onStartQuestions={() => navigate('/academy/interview-questions?position=retail')} onStartSimulation={() => navigate(course.simulatorRoute)} />
        )}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => navigate(`/programs/${course.slug}/foundation`)} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700">返回目录</button>
          {nextDay && <button type="button" disabled={!isFoundationDayFinished(course.jobKey, progress, selectedDay.id)} onClick={() => navigate(`/programs/${course.slug}/foundation/${nextDay.id}`)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">继续 Day {nextDay.day}<ArrowRight size={16} /></button>}
        </div>
      </main>
    </div>
  ) : null

  const lesson = selectedDay && dayIndex >= course.freeDayCount
    ? <RequireActivation productCode={course.productCode}>{lessonPage}</RequireActivation>
    : lessonPage

  return lesson || (
        <div className="min-h-screen bg-slate-50 pb-24">
          <header className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-4xl px-5 pb-6 pt-10"><button type="button" onClick={() => navigate(course.packRoute)} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"><ArrowLeft size={17} />返回岗位包</button><p className="mt-5 text-xs font-semibold text-blue-700">{course.label} · FOUNDATION</p><h1 className="mt-2 text-2xl font-semibold text-slate-950">{course.title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{course.description}</p><div className="mt-5 flex items-center justify-between text-xs text-slate-500"><span>课程进度</span><span>{completedCount}/{course.days.length} 天</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${(completedCount / course.days.length) * 100}%` }} /></div></div></header>
          <main className="mx-auto max-w-4xl px-5 py-6">
            <nav className="grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-white p-1">{viewOptions.map(({ key, label, icon }) => <button key={key} type="button" onClick={() => setSearchParams(key === 'course' ? {} : { view: key })} className={`flex min-h-11 items-center justify-center gap-2 rounded-md px-2 text-xs font-semibold sm:text-sm ${view === key ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{createElement(icon, { size: 16 })}{label}</button>)}</nav>

            {view === 'course' && <div className="mt-6 space-y-5"><section className="flex flex-col gap-4 rounded-lg border border-blue-200 bg-blue-50 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold text-blue-700">YOUR NEXT STEP</p><h2 className="mt-1 font-semibold text-blue-950">{completedCount === course.days.length ? '基础课已完成，可复习或进入岗位模拟' : `继续 Day ${continueDay.day} · ${continueDay.title}`}</h2></div><button type="button" onClick={() => navigate(`/programs/${course.slug}/foundation/${continueDay.id}`)} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white">{completedCount ? '继续学习' : '开始课程'}<ArrowRight size={16} /></button></section><section className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">{course.days.map((day, index) => { const done = isFoundationDayFinished(course.jobKey, progress, day.id); const free = index < course.freeDayCount; return <button key={day.id} type="button" onClick={() => navigate(`/programs/${course.slug}/foundation/${day.id}`)} className="flex min-h-20 w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${done ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{done ? <CheckCircle2 size={18} /> : day.day}</span><span className="min-w-0 flex-1"><span className="block text-xs text-slate-500">DAY {day.day} · {day.duration}{free ? ' · 免费体验' : ''}</span><span className="mt-1 block font-semibold text-slate-900">{day.title}</span></span>{free || done ? <ArrowRight size={17} className="shrink-0 text-slate-400" /> : <LockKeyhole size={16} className="shrink-0 text-slate-400" />}</button> })}</section></div>}

            {view === 'practice' && <div className="mt-6 space-y-5"><section className="rounded-lg border border-slate-200 bg-white p-5"><p className="text-xs font-semibold text-blue-700">PERSONAL PRACTICE HUB</p><h2 className="mt-1 text-xl font-semibold text-slate-950">只练现在最需要的内容</h2>{scenarioProfile?.weakest_skill && <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950"><div className="flex items-center justify-between gap-3"><span>岗位模拟当前最弱项：<strong>{weakestSkillLabel}</strong></span><span className="shrink-0 font-semibold">{scenarioProfile.readiness_score || 0}/100</span></div>{recommendedScenario && <p className="mt-2 text-xs leading-5">下一场建议：{recommendedScenario.title}</p>}</div>}<div className="mt-4 space-y-2">{reviewItems.length ? reviewItems.slice(0, 8).map((item, index) => <button key={`${item.day.id}-${item.reason}-${index}`} type="button" onClick={() => navigate(`/programs/${course.slug}/foundation/${item.day.id}`)} className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-3 text-left"><span><span className="block text-xs text-slate-500">Day {item.day.day}</span><span className="mt-1 block text-sm font-medium text-slate-900">{item.reason}</span></span><ArrowRight size={16} className="text-slate-400" /></button>) : <p className="mt-4 text-sm text-slate-500">暂时没有弱项记录。完成跟读、Guest Challenge 或岗位模拟后，系统会自动归纳。</p>}</div></section><section className="rounded-lg border border-slate-200 bg-white p-5"><div className="flex items-center gap-2"><Bookmark size={17} className="text-blue-700" /><h2 className="font-semibold text-slate-950">已收藏表达</h2></div>{savedLines.length ? <div className="mt-3 divide-y divide-slate-100">{savedLines.map((line) => <div key={line.text} className="py-3"><p className="text-sm font-medium leading-6 text-slate-800">{line.text}</p><p className="mt-1 text-xs text-slate-500">Day {line.day || '-'} · {line.cue || '服务表达'}</p></div>)}</div> : <p className="mt-3 text-sm text-slate-500">在单日课程中收藏想反复练习的句子。</p>}</section><button type="button" onClick={() => navigate(course.simulatorRoute)} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white">{recommendedScenario ? '练习岗位模拟推荐场景' : '进入岗位模拟训练'}<Sparkles size={17} /></button></div>}

            {view === 'placement' && <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5"><p className="text-xs font-semibold text-blue-700">EXPERIENCED LEARNER CHECK</p><h2 className="mt-1 text-xl font-semibold text-slate-950">判断从哪一天开始</h2><p className="mt-2 text-sm leading-6 text-slate-600">这只会推荐起点，不会伪造跟读或 Guest Challenge 完成记录。</p><div className="mt-5 space-y-6">{course.days.filter((day) => day.quiz).map((day) => <fieldset key={day.id}><legend className="text-sm font-semibold leading-6 text-slate-950">Day {day.day} · {day.quiz.question}</legend><div className="mt-2 space-y-2">{day.quiz.options.map((option) => <label key={option.id} className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm leading-6 ${placementAnswers[day.id] === option.id ? 'border-blue-300 bg-blue-50' : 'border-slate-200'}`}><input type="radio" name={`placement-${day.id}`} value={option.id} checked={placementAnswers[day.id] === option.id} onChange={() => setPlacementAnswers((current) => ({ ...current, [day.id]: option.id }))} /><span>{option.text}</span></label>)}</div></fieldset>)}<button type="button" disabled={Object.keys(placementAnswers).length < course.days.filter((day) => day.quiz).length} onClick={submitPlacement} className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white disabled:bg-slate-300">生成建议起点</button></div>{placement && <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4"><div className="flex items-center gap-2 text-emerald-800"><CheckCircle2 size={18} /><p className="font-semibold">{placement.label}</p></div><p className="mt-2 text-sm text-emerald-900">得分 {placement.score}/{placement.total}。这是学习起点建议，不代表已完成实操。</p><button type="button" onClick={() => navigate(`/programs/${course.slug}/foundation/${placement.dayId}`)} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800">从建议位置开始<ArrowRight size={16} /></button></div>}</section>}
          </main>
        </div>
      )
}
