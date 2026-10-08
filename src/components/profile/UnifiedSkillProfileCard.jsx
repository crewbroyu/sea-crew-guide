import { useMemo, useState } from 'react'
import { Activity, ShieldCheck } from 'lucide-react'

const skillLabels = {
  listening: '听力理解',
  speaking_clarity: '英语表达',
  interview_structure: '面试结构',
  job_knowledge: '岗位知识',
  guest_handling: '宾客服务',
  sales: '销售能力',
  problem_solving: '问题处理',
  safety_judgment: '安全判断',
}

const jobLabels = {
  cruise_general: '通用能力',
  bar_server: 'Bar Server',
  retail: 'Retail Sales',
}

const confidenceLabels = { low: '初步', medium: '较稳定', high: '稳定' }

const inferJobKey = (position = '') => {
  if (/retail|sales associate|duty[\s-]*free|免税|零售/i.test(position)) return 'retail'
  if (/bar[\s_-]*server|bartender|酒吧|调酒/i.test(position)) return 'bar_server'
  return 'cruise_general'
}

export default function UnifiedSkillProfileCard({ profiles = [], targetPosition = '' }) {
  const preferredJobKey = inferJobKey(targetPosition)
  const initialJobKey = profiles.some((item) => item.job_key === preferredJobKey)
    ? preferredJobKey
    : profiles[0]?.job_key
  const [selectedJobKey, setSelectedJobKey] = useState(initialJobKey)
  const profile = profiles.find((item) => item.job_key === selectedJobKey)
    || profiles.find((item) => item.job_key === preferredJobKey)
    || profiles[0]
  const skills = useMemo(
    () => Object.entries(profile?.skills || {}).sort((left, right) => right[1] - left[1]),
    [profile],
  )
  const missingSkills = Object.keys(skillLabels).filter((key) => profile && profile.skills?.[key] === undefined)

  if (!profile) return null

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity size={19} className="text-blue-700" />
            <h2 className="font-bold text-gray-900">统一能力档案</h2>
          </div>
          <p className="mt-1 text-xs leading-5 text-gray-500">测评、岗位场景和模拟面试会共同更新这份档案。</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-800">{profile.readiness_score}</p>
          <p className="text-xs text-gray-500">已测能力均分</p>
        </div>
      </div>

      {profiles.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {profiles.map((item) => (
            <button
              key={item.job_key}
              type="button"
              onClick={() => setSelectedJobKey(item.job_key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                item.job_key === profile.job_key ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {jobLabels[item.job_key] || item.job_key}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
        <div><span className="font-semibold text-gray-900">{profile.evidence_count}</span> 条能力证据</div>
        <div><span className="font-semibold text-gray-900">{profile.coverage_percent}%</span> 能力覆盖</div>
      </div>

      <div className="mt-4 space-y-3">
        {skills.map(([key, score]) => {
          const confidence = profile.confidence?.[key]?.level || 'low'
          return (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span className="font-medium text-gray-700">{skillLabels[key] || key}</span>
                <span className="text-gray-500">{score} · {confidenceLabels[confidence]}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      {Array.isArray(profile.weakest) && profile.weakest.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <ShieldCheck size={17} />
            当前低分能力
          </div>
          <p className="mt-1 text-xs leading-5 text-amber-800">
            {profile.weakest.map((item) => skillLabels[item.skillKey] || item.skillKey).join('、')}
          </p>
        </div>
      )}

      {missingSkills.length > 0 && (
        <p className="mt-3 text-xs leading-5 text-gray-500">
          尚待采集证据：{missingSkills.map((key) => skillLabels[key]).join('、')}
        </p>
      )}
    </section>
  )
}

