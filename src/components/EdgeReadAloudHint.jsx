import { Volume2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function EdgeReadAloudHint() {
  const { t } = useTranslation()
  return (
    <p className="mt-3 flex items-start gap-1.5 text-xs leading-5 text-slate-500">
      <Volume2 size={14} className="mt-0.5 shrink-0 text-slate-400" />
      {t('edgeReadAloud')}
    </p>
  )
}
