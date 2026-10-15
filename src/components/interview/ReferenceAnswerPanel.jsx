import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Volume2 } from 'lucide-react'
import useEffectiveAccess from '../../hooks/useEffectiveAccess'
import { getPracticeUpgradeRoute, hasPracticeAccess, isPracticePackPosition } from '../../data/interviewPracticePack'
import { getReferenceAnswers } from '../../services/interviewReferenceAnswerService'
import { trackProductEvent } from '../../services/productAnalyticsService'

export default function ReferenceAnswerPanel({ positionKey, questionId, onSpeak }) {
  const navigate = useNavigate()
  const access = useEffectiveAccess()
  const covered = isPracticePackPosition(positionKey)
  const hasAccess = covered && hasPracticeAccess(access, positionKey)
  const [result, setResult] = useState({ key: '', status: 'loading', answer: null })
  const requestKey = `${positionKey}:${questionId}`

  useEffect(() => {
    if (!hasAccess) return undefined
    let active = true
    getReferenceAnswers(positionKey)
      .then((answers) => { if (active) setResult({ key: requestKey, status: 'ready', answer: answers[questionId] || null }) })
      .catch(() => { if (active) setResult({ key: requestKey, status: 'error', answer: null }) })
    return () => { active = false }
  }, [hasAccess, positionKey, questionId, requestKey])

  if (!covered) return null

  if (!hasAccess) {
    return (
      <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-700"><Lock size={13} />参考回答与要点</p>
        <p className="mt-1 text-sm leading-6 text-blue-950">开通面试练习包后可查看每道题的英文参考回答，并用语音作答获得 AI 逐题反馈。</p>
        <button
          type="button"
          onClick={() => {
            trackProductEvent('reference_answer_paywall_clicked', { productCode: null, properties: { positionKey, questionId } })
            navigate(getPracticeUpgradeRoute(positionKey, 'question-bank'))
          }}
          className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          查看面试练习包
        </button>
      </div>
    )
  }

  const current = result.key === requestKey ? result : { status: 'loading', answer: null }
  return (
    <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-emerald-700">参考回答</p>
        {current.answer && onSpeak && (
          <button type="button" onClick={() => onSpeak(current.answer.answer_en)} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><Volume2 size={14} />听回答</button>
        )}
      </div>
      {current.status === 'loading' && <p className="mt-1 text-sm text-emerald-900">正在加载…</p>}
      {current.status === 'error' && <p className="mt-1 text-sm text-emerald-900">暂时无法读取参考回答，请稍后再试。</p>}
      {current.status === 'ready' && !current.answer && <p className="mt-1 text-sm text-emerald-900">这道题的参考回答正在人工审核，审核后会出现在这里。</p>}
      {current.answer && (
        <>
          <p className="mt-1 whitespace-pre-line text-sm leading-6 text-emerald-950">{current.answer.answer_en}</p>
          {current.answer.key_points_zh && (
            <p className="mt-3 whitespace-pre-line border-t border-emerald-100 pt-3 text-sm leading-6 text-emerald-900">{current.answer.key_points_zh}</p>
          )}
        </>
      )}
    </div>
  )
}
