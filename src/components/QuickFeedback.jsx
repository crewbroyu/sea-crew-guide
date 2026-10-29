import { useState } from 'react'
import { MessageSquareText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { trackProductEvent } from '../services/productAnalyticsService'

const choices = ['clear', 'uncertain', 'blocked']

export default function QuickFeedback({ context, productCode = 'bar_server_pack' }) {
  const navigate = useNavigate()
  const { t } = useTranslation('quickFeedback')
  const [selected, setSelected] = useState('')

  const submit = (value) => {
    setSelected(value)
    trackProductEvent('quick_feedback_submitted', {
      productCode,
      properties: { context, response: value },
    })
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-2">
        <MessageSquareText size={18} className="mt-0.5 shrink-0 text-slate-500" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">{t('question')}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {choices.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => submit(value)}
                className={`min-h-10 rounded-lg border px-3 text-sm font-medium transition ${selected === value ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
              >
                {t(value)}
              </button>
            ))}
          </div>
          {selected === 'blocked' && (
            <button
              type="button"
              onClick={() => navigate(`/support?category=bug&context=${encodeURIComponent(context)}`)}
              className="mt-3 text-sm font-semibold text-blue-700 underline underline-offset-2"
            >
              {t('tellUs')}
            </button>
          )}
          {selected && selected !== 'blocked' && <p className="mt-3 text-xs text-slate-500">{t('received')}</p>}
        </div>
      </div>
    </section>
  )
}
