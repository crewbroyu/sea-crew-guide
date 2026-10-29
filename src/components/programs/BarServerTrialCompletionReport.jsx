import { ArrowRight, CheckCircle2, CircleAlert, Route, ShieldCheck, Target, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const scoreTone = (score, line) => score >= line
  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
  : 'border-amber-200 bg-amber-50 text-amber-950'

export default function BarServerTrialCompletionReport({ report, hasAccess, onContinue }) {
  const { t } = useTranslation('trialReport')
  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-lg border border-blue-200 bg-white shadow-sm">
        <div className="border-b border-blue-100 bg-blue-50 p-5">
          <p className="text-xs font-semibold text-blue-700">{t('eyebrow')}</p>
          <h2 className="mt-1 text-xl font-semibold text-blue-950">{t('title')}</h2>
          <p className="mt-2 text-sm leading-6 text-blue-900">{t('disclaimer')}</p>
        </div>

        <div className="grid gap-0 sm:grid-cols-[1fr_1.4fr]">
          <div className="border-b border-slate-200 p-5 sm:border-b-0 sm:border-r">
            <p className="text-xs font-medium text-slate-500">{t('readiness')}</p>
            <p className="mt-2 text-4xl font-semibold text-slate-950">{report.readiness}<span className="ml-1 text-base font-medium text-slate-400">/100</span></p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200"><div className={`h-full rounded-full ${report.meetsValidationLine ? 'bg-emerald-600' : 'bg-blue-600'}`} style={{ width: `${Math.min(100, report.readiness)}%` }} /></div>
            <div className="mt-3 flex items-center justify-between gap-3 text-xs"><span className="text-slate-500">{t('validationLine')}</span><span className="font-semibold text-slate-800">{report.validationLine}/100</span></div>
          </div>
          <div className="p-5">
            <div className="flex items-start gap-3">
              {report.meetsValidationLine ? <ShieldCheck size={21} className="mt-0.5 shrink-0 text-emerald-700" /> : <CircleAlert size={21} className="mt-0.5 shrink-0 text-amber-700" />}
              <div><p className="font-semibold text-slate-950">{t('passed', { passed: report.passedCount })}</p><p className="mt-2 text-sm leading-6 text-slate-600">{report.status}</p></div>
            </div>
            <div className="mt-4 border-l-4 border-amber-400 bg-amber-50 px-4 py-3">
              <p className="text-xs font-semibold text-amber-800">{t('primaryGap', { title: report.primaryGap.scenarioTitle, score: report.primaryGap.score })}</p>
              <p className="mt-1 text-sm leading-6 text-amber-950">{report.primaryGap.description}</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2"><TrendingUp size={19} className="text-blue-700" /><h3 className="font-semibold text-slate-950">{t('byScenario')}</h3></div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {report.scenarios.map((scenario) => (
            <article key={scenario.id} className={`rounded-lg border p-4 ${scoreTone(scenario.score, report.validationLine)}`}>
              <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">{scenario.title}</p><span className="text-lg font-semibold">{scenario.score}</span></div>
              <p className="mt-1 text-xs opacity-75">{t('scenarioScores', { first: scenario.firstScore, delta: `${scenario.delta >= 0 ? '+' : ''}${scenario.delta}` })}</p>
              <p className="mt-3 text-xs leading-5 opacity-90">{scenario.strength}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 border-y border-slate-200 py-5 md:grid-cols-2">
        <div>
          <div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-700" /><h3 className="font-semibold text-slate-950">{t('proven')}</h3></div>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">{report.provenAbilities.map((item) => <li key={item}>• {item}</li>)}</ul>
        </div>
        <div>
          <div className="flex items-center gap-2"><CircleAlert size={18} className="text-amber-700" /><h3 className="font-semibold text-slate-950">{t('risks')}</h3></div>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">{report.workRisks.map((risk) => <li key={risk.title}><span className="font-medium text-slate-800">{t('riskTitle', { title: risk.title })}</span>{risk.description}</li>)}</ul>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2"><Target size={19} className="text-blue-700" /><h3 className="font-semibold text-slate-950">{t('priority')}</h3></div>
        <div className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
          {report.priorityTraining.map((item, index) => <div key={item.title} className="grid grid-cols-[2rem_1fr] gap-3 py-4"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">{index + 1}</span><div><p className="font-medium text-slate-900">{item.title}</p><p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p></div></div>)}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2"><Route size={19} className="text-blue-700" /><h3 className="font-semibold text-slate-950">{t('roadmap')}</h3></div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {report.roadmap.phases.map((phase) => <article key={phase.days} className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs font-semibold text-blue-700">{phase.days}</p><ul className="mt-2 space-y-1.5 text-sm leading-5 text-slate-600">{phase.titles.map((title) => <li key={title}>• {title}</li>)}</ul></article>)}
        </div>
      </section>

      <button type="button" onClick={onContinue} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
        {hasAccess ? t('continueWithAccess') : t('continueToUnlock')} <ArrowRight size={18} />
      </button>
    </div>
  )
}
