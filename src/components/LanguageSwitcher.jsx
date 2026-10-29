import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, writePreferredLanguage } from '../i18n/language'
import { trackProductEvent } from '../services/productAnalyticsService'

const LANGUAGE_LABELS = { zh: '中文', en: 'English' }

export default function LanguageSwitcher({ context }) {
  const { i18n, t } = useTranslation()

  const switchTo = (language) => {
    const previous = i18n.language
    if (language === previous) return
    writePreferredLanguage(localStorage, language)
    i18n.changeLanguage(language)
    trackProductEvent('language_switched', {
      properties: { from: previous, to: language, context },
    })
  }

  return (
    <div role="group" aria-label={t('language.label')} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 text-xs font-semibold">
      <Languages size={14} className="mx-1 text-slate-400" aria-hidden="true" />
      {SUPPORTED_LANGUAGES.map((language) => (
        <button
          key={language}
          type="button"
          lang={language === 'en' ? 'en' : 'zh-CN'}
          aria-pressed={i18n.language === language}
          onClick={() => switchTo(language)}
          className={`rounded-md px-2.5 py-1 transition ${i18n.language === language ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          {LANGUAGE_LABELS[language]}
        </button>
      ))}
    </div>
  )
}
