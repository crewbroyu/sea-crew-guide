import { ArrowRight, Target } from 'lucide-react'
import { BAR_SERVER_SKILLS, getScenarioById } from '../../data/jobScenarioCatalog'

export default function JobReadinessDashboard({ profile, onOpenScenario }) {
  const scores = profile?.skill_scores || profile?.skillScores || {}
  const readiness = Number(profile?.readiness_score ?? profile?.readinessScore ?? 0)
  const weakest = BAR_SERVER_SKILLS.find(({ key }) => key === profile?.weakest_skill || key === profile?.weakestSkill)
  const recommended = getScenarioById(profile?.recommended_scenario_id || profile?.recommendedScenario?.id)

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-blue-700">BAR SERVER READINESS</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">Job Readiness</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Based on completed job simulations. It is not a hiring decision.</p>
        </div>
        <div className="rounded-lg bg-blue-50 px-4 py-3 text-center">
          <p className="text-xs font-medium text-blue-700">CURRENT SCORE</p>
          <p className="mt-1 text-2xl font-bold text-blue-950">{readiness || '--'}</p>
        </div>
      </div>

      {readiness > 0 ? (
        <div className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {BAR_SERVER_SKILLS.map(({ key, label }) => {
            const score = Number(scores[key] || 0)
            return (
              <div key={key}>
                <div className="flex justify-between text-xs text-slate-600"><span>{label}</span><span>{score}</span></div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${score}%` }} /></div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="mt-5 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">Complete your first full simulation to start tracking your job skills here.</p>
      )}

      {weakest && readiness > 0 && (
        <div className="mt-5 rounded-lg border border-amber-100 bg-amber-50 p-4">
          <p className="text-xs font-semibold text-amber-800">CURRENT FOCUS</p>
          <p className="mt-1 text-sm font-semibold text-amber-950">{weakest.label}</p>
          <p className="mt-1 text-sm leading-6 text-amber-900">{recommended ? `Recommended next: ${recommended.title}` : 'Complete different simulations to receive a more stable recommendation.'}</p>
          {recommended && onOpenScenario && <button type="button" onClick={() => onOpenScenario(recommended.id)} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-amber-800 hover:text-amber-950">Train this skill <ArrowRight size={16} /></button>}
        </div>
      )}

      {profile?.completed_scenario_count > 0 && <p className="mt-4 flex items-center gap-2 text-xs text-slate-500"><Target size={14} />{profile.completed_scenario_count} different simulations completed</p>}
    </section>
  )
}
