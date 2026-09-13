import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, ChevronLeft, RotateCcw } from 'lucide-react'
import PhraseShadowingPractice from '../../components/interview/PhraseShadowingPractice'
import GuestChallengePractice from '../../components/training/GuestChallengePractice'
import { getListeningSpeakingCourse } from '../../data/listeningSpeakingCourses'

const TASK7_CUSTOM_QUESTIONS_KEY = 'task7_custom_questions'

const readProgress = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}')
  } catch (error) {
    console.warn('Unable to restore listening practice:', error)
    return {}
  }
}

export default function ListeningSpeakingCourse() {
  const navigate = useNavigate()
  const { category: categoryId, course: courseId } = useParams()
  const lesson = getListeningSpeakingCourse(categoryId, courseId)
  const storageKey = `listening-speaking:${categoryId}:${courseId}`
  const [progress, setProgress] = useState(() => readProgress(storageKey))

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(progress))
  }, [progress, storageKey])

  if (!lesson) return <Navigate to="/academy/listening-speaking" replace />

  const { category, course } = lesson
  const shadowingComplete = Boolean(progress.shadowing?.completedAt)
  const challengeComplete = Boolean(progress.guestChallenge?.completedAt)

  const updateProgress = (partial) => {
    setProgress((current) => ({
      ...current,
      ...partial,
      completedAt: partial.guestChallenge?.completedAt || current.completedAt || null,
      updatedAt: new Date().toISOString(),
    }))
  }

  const continueToTask7 = () => {
    localStorage.setItem(TASK7_CUSTOM_QUESTIONS_KEY, JSON.stringify({
      sessionId: `academy-${course.id}-${Date.now()}`,
      courseId: course.id,
      position: course.position || 'bar_server',
      questions: [{
        id: `academy-${course.id}`,
        question: course.transferQuestion,
        focus: `Use the service language from ${course.title}, then add a clear action and result.`,
      }],
      createdAt: new Date().toISOString(),
    }))
    navigate(`/tasks/phase2/Task7/voice?mode=standard&position=${course.position || 'bar_server'}&source=academy-listening`)
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white px-6 pb-6 pt-12">
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={() => navigate(`/academy/listening-speaking/${category.id}`)}
            className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-blue-700"
          >
            <ChevronLeft size={18} /> 返回课程列表
          </button>
          <p className="text-sm font-medium text-blue-700">海乘学院 · {category.name}</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">{course.title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            听一句，完整跟读三次，再独立处理一个 Guest Challenge。录音留在当前页面，不消耗 AI 额度。
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-5 py-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-blue-700">必要表达</p>
          <p className="mt-3 text-lg leading-8 text-slate-950">{course.transcript}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">{course.translation}</p>
        </section>

        <PhraseShadowingPractice
          phrases={[course.transcript]}
          phraseCues={[course.cue]}
          practice={progress.shadowing || {}}
          onPracticeChange={(shadowing) => updateProgress({ shadowing })}
          requiredPhraseRepetitions={3}
          requireListenBeforeRecord
          title="听一句，跟读三次"
          description="先听示范，再完整录三次。每次太短都不会计入进度。"
        />

        <GuestChallengePractice
          role={course.challenge.role}
          prompt={course.challenge.prompt}
          challenge={progress.guestChallenge || {}}
          locked={!shadowingComplete}
          onChallengeChange={(guestChallenge) => updateProgress({ guestChallenge })}
        />

        {challengeComplete && (
          <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-700" />
              <div>
                <h2 className="font-semibold text-emerald-950">本课已完成</h2>
                <p className="mt-1 text-sm leading-6 text-emerald-900">
                  下一步不是继续听更多内容，而是把同一项服务能力带进任务7，练成面试时能说清楚的回答。
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={continueToTask7}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              带着结果进入任务7
              <ArrowRight size={17} />
            </button>
          </section>
        )}

        <button
          type="button"
          onClick={() => navigate(`/academy/listening-speaking/${category.id}`)}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          <RotateCcw size={16} /> 返回课程列表
        </button>
      </main>
    </div>
  )
}
