import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardList, ListChecks, LoaderCircle, Scale, Sparkles, UserRoundCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAccessStore } from '../../store/accessStore'
import useEffectiveAccess from '../../hooks/useEffectiveAccess'
import { CareerReportError, generateCareerReport, getLatestCareerReport } from '../../services/careerReportService'

const roleLabels = {
  retail: 'Retail Sales Associate',
  front_office: 'Guest Service Associate',
  bar: 'Bar Server',
  restaurant: 'Restaurant Assistant',
  housekeeping: 'Housekeeping',
  youth_staff: 'Youth Staff',
  beauty_spa: 'Beauty / SPA Specialist',
}

const fieldOptions = {
  ageRange: [['18_20', '18-20 岁'], ['21_25', '21-25 岁'], ['26_30', '26-30 岁'], ['31_35', '31-35 岁'], ['36_plus', '36 岁以上']],
  education: [['high_school', '高中/中专'], ['diploma', '大专'], ['bachelor', '本科'], ['master_plus', '硕士及以上']],
  englishLevel: [['basic', '只能简单沟通'], ['service', '可完成基础服务沟通'], ['interview', '可用英文讲经历和回答常见问题']],
  experience: [['none', '暂无相关经验'], ['hospitality', '酒店/服务'], ['restaurant_bar', '餐饮/酒吧'], ['retail_sales', '零售/销售'], ['front_office', '前台/接待'], ['other', '其他可迁移经验']],
  goal: [['stability', '先稳妥上船'], ['income', '更看重收入'], ['career', '更看重长期职业发展']],
  timeline: [['within_3_months', '3 个月内'], ['3_6_months', '3-6 个月'], ['6_12_months', '6-12 个月'], ['exploring', '先了解再决定']],
  budget: [['under_500', '500 元以内'], ['500_2000', '500-2000 元'], ['2000_10000', '2000-10000 元'], ['over_10000', '10000 元以上']],
  salesTolerance: [['avoid', '尽量避免销售'], ['open', '可以接受适度销售'], ['prefer', '喜欢销售和业绩目标']],
  workIntensity: [['low', '希望节奏稳定'], ['medium', '可接受忙碌'], ['high', '能接受高强度和晚班']],
}

const initialProfile = {
  ageRange: '',
  education: '',
  englishLevel: '',
  experience: '',
  goal: '',
  timeline: '',
  budget: '',
  salesTolerance: '',
  workIntensity: '',
  workSummary: '',
}

const optionLabel = (field, value) => fieldOptions[field]?.find(([key]) => key === value)?.[1] || value || '尚未确认'

const buildLegacyDecisionBasis = (profile) => [
  { key: 'english', label: '当前英语水平', value: optionLabel('englishLevel', profile.englishLevel), impact: '影响岗位沟通复杂度和准备周期。' },
  { key: 'experience', label: '相关工作经验', value: optionLabel('experience', profile.experience), impact: '决定哪些服务、销售或沟通能力可以直接迁移。' },
  { key: 'entry_threshold', label: '岗位进入门槛', value: '结合岗位要求进一步比较', impact: '较容易进入不等于收入或长期发展更优。' },
  { key: 'competitiveness', label: '当前竞争力', value: '由英语、经历和准备度综合判断', impact: '匹配度反映当前准备状态，不是录取概率。' },
  { key: 'core_goal', label: '你的核心诉求', value: `${optionLabel('goal', profile.goal)}；${optionLabel('timeline', profile.timeline)}；${optionLabel('workIntensity', profile.workIntensity)}`, impact: '决定应优先比较上船速度、收入、强度还是长期发展。' },
]

const SelectField = ({ label, value, options, onChange }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    >
      <option value="">请选择</option>
      {options.map(([valueOption, labelOption]) => <option key={valueOption} value={valueOption}>{labelOption}</option>)}
    </select>
  </label>
)

const saveReportLocally = ({ nextReport, profile, fallbackRecommendations }) => {
  try {
    const current = JSON.parse(localStorage.getItem('assessment_result') || '{}')
    const recommendations = nextReport.recommendedPositions.map((position) => ({
      id: position.id,
      title: roleLabels[position.id] || position.title,
      matchScore: position.matchScore,
      strengths: position.reasons,
      risks: position.risks,
      nextSteps: position.nextSteps,
    }))

    localStorage.setItem('assessment_result', JSON.stringify({
      ...current,
      careerProfile: profile,
      careerReport: nextReport,
      recommendations: recommendations.length ? recommendations : fallbackRecommendations,
      recommended_application_route: nextReport.applicationRoute?.id || null,
    }))
  } catch (error) {
    console.warn('Unable to save career report locally:', error)
  }
}

export default function CareerReportPanel({ assessment, fallbackRecommendations, onReportGenerated }) {
  const navigate = useNavigate()
  const { openRegisterModal } = useAccessStore()
  const { isRegistered } = useEffectiveAccess()
  const [profile, setProfile] = useState(() => ({ ...initialProfile, ...(assessment?.careerProfile || {}) }))
  const [report, setReport] = useState(() => assessment?.careerReport || null)
  const [state, setState] = useState('idle')
  const [message, setMessage] = useState('')

  const missingFields = useMemo(
    () => ['ageRange', 'education', 'englishLevel', 'experience', 'goal', 'timeline', 'budget', 'salesTolerance', 'workIntensity']
      .filter((field) => !profile[field]),
    [profile],
  )

  const decisionBasis = useMemo(
    () => report?.decisionBasis?.length ? report.decisionBasis : buildLegacyDecisionBasis(profile),
    [profile, report],
  )
  const decisionRisks = report?.decisionRisks?.length
    ? report.decisionRisks
    : ['方向匹配度只反映当前信息；收入、工作强度和长期发展仍需在岗位确认前逐项比较。']

  const updateProfile = (field, value) => setProfile((current) => ({ ...current, [field]: value }))

  const persistReport = (nextReport) => {
    saveReportLocally({ nextReport, profile, fallbackRecommendations })
  }

  useEffect(() => {
    if (!isRegistered || report) return undefined
    let cancelled = false

    const restoreReport = async () => {
      try {
        setState('restoring')
        const saved = await getLatestCareerReport()
        if (cancelled) return
        if (!saved?.report) {
          setState('idle')
          return
        }

        const restoredProfile = { ...initialProfile, ...(saved.profile || {}) }
        setProfile(restoredProfile)
        setReport(saved.report)
        saveReportLocally({ nextReport: saved.report, profile: restoredProfile, fallbackRecommendations })
        onReportGenerated?.(saved.report)
        setState('success')
      } catch (error) {
        if (!cancelled) {
          console.warn('Unable to restore existing career report:', error)
          setState('idle')
        }
      }
    }

    restoreReport()
    return () => { cancelled = true }
  }, [fallbackRecommendations, isRegistered, onReportGenerated, report])

  const handleGenerate = async () => {
    if (!isRegistered) {
      openRegisterModal()
      return
    }

    if (missingFields.length) {
      setState('error')
      setMessage('请先补全 9 项关键信息，报告才不会变成泛泛而谈的建议。')
      return
    }

    try {
      setState('loading')
      setMessage('')
      const nextReport = await generateCareerReport({
        profile,
        assessment: {
          assessmentVersion: assessment.assessmentVersion,
          overallScore: assessment.overallScore,
          level: assessment.level,
          serviceBackground: assessment.serviceBackground,
          dimensionScores: assessment.dimensionScores,
          ruleRecommendations: fallbackRecommendations.map(({ id, title, matchScore }) => ({ id, title, matchScore })),
        },
      })
      setReport(nextReport)
      persistReport(nextReport)
      onReportGenerated?.(nextReport)
      setState('success')
    } catch (error) {
      console.error('Career report generation failed:', error)
      setState('error')
      setMessage(error instanceof CareerReportError ? error.message : '职业评估暂时无法生成，请稍后重试。')
    }
  }

  return (
    <section className="mb-6 overflow-hidden rounded-lg border border-blue-200 bg-white shadow-sm">
      <div className="border-b border-blue-100 bg-blue-50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700"><Sparkles size={21} /></div>
          <div>
            <p className="text-sm font-medium text-blue-700">免费岗位方向分析</p>
            <h2 className="mt-1 font-bold text-slate-950">补充信息，缩小值得比较的岗位范围</h2>
            <p className="mt-1 text-sm leading-relaxed text-blue-900">不包含陪跑服务推销。报告会解释判断依据、需要权衡的风险和下一步验证方式，不替你决定岗位。</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {!report && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField label="年龄范围" value={profile.ageRange} options={fieldOptions.ageRange} onChange={(value) => updateProfile('ageRange', value)} />
              <SelectField label="最高学历" value={profile.education} options={fieldOptions.education} onChange={(value) => updateProfile('education', value)} />
              <SelectField label="英语现状" value={profile.englishLevel} options={fieldOptions.englishLevel} onChange={(value) => updateProfile('englishLevel', value)} />
              <SelectField label="最接近的经历" value={profile.experience} options={fieldOptions.experience} onChange={(value) => updateProfile('experience', value)} />
              <SelectField label="当前优先目标" value={profile.goal} options={fieldOptions.goal} onChange={(value) => updateProfile('goal', value)} />
              <SelectField label="希望多久开始申请" value={profile.timeline} options={fieldOptions.timeline} onChange={(value) => updateProfile('timeline', value)} />
              <SelectField label="前期准备预算" value={profile.budget} options={fieldOptions.budget} onChange={(value) => updateProfile('budget', value)} />
              <SelectField label="对销售的接受度" value={profile.salesTolerance} options={fieldOptions.salesTolerance} onChange={(value) => updateProfile('salesTolerance', value)} />
              <SelectField label="可接受工作强度" value={profile.workIntensity} options={fieldOptions.workIntensity} onChange={(value) => updateProfile('workIntensity', value)} />
            </div>
            <label className="mt-3 block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">用 3-5 句说明你的经历和顾虑</span>
              <textarea value={profile.workSummary} maxLength={1000} onChange={(event) => updateProfile('workSummary', event.target.value)} placeholder="例如：做过两年餐饮服务，英语能点单但不敢长句表达；希望半年内上船，愿意接受晚班。请不要填写姓名、电话或微信。" className="min-h-28 w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </label>
            {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
            <button type="button" onClick={handleGenerate} disabled={state === 'loading' || state === 'restoring'} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">
              {state === 'loading' || state === 'restoring' ? <LoaderCircle size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {state === 'restoring' ? '正在读取已有报告...' : state === 'loading' ? '正在生成职业评估...' : isRegistered ? '生成我的免费职业评估' : '登录后生成免费职业评估'}
            </button>
          </>
        )}

        {report && (
          <div className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <Scale size={19} className="mt-0.5 shrink-0 text-blue-700" />
                <div>
                  <p className="text-sm font-semibold text-blue-950">{report.decisionPrinciple || 'AI 帮你缩小选择范围，但不替你做最终决定。'}</p>
                  <p className="mt-1 text-sm leading-relaxed text-blue-900">以下方向是基于当前信息形成的比较起点，不是录取承诺，也不是最终职业决定。</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-950">当前方向判断</p>
              <p className="mt-1 text-sm leading-relaxed text-emerald-900">{report.summary}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2"><ListChecks size={18} className="text-blue-700" /><h3 className="font-semibold text-slate-950">为什么得到这些方向</h3></div>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">你可以逐项检查判断依据是否符合真实情况；任何一项变化，都可能改变岗位排序。</p>
              <div className="mt-3 divide-y divide-slate-100">
                {decisionBasis.map((item) => (
                  <div key={item.key || item.label} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
                    <p className="text-sm font-medium text-slate-950">{item.label}</p>
                    <div><p className="text-sm text-slate-800">{item.value}</p><p className="mt-1 text-xs leading-5 text-slate-500">{item.impact}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={19} className="mt-0.5 shrink-0 text-amber-700" />
                <div>
                  <p className="text-sm font-semibold text-amber-950">决策风险与诉求冲突</p>
                  <div className="mt-2 space-y-1.5">{decisionRisks.map((item) => <p key={item} className="text-sm leading-relaxed text-amber-900">- {item}</p>)}</div>
                </div>
              </div>
            </div>
            {report.advisorSignals?.missingInformation?.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-950">还需要确认的关键变量</p>
                <p className="mt-1 text-sm leading-relaxed text-amber-900">这些信息可能改变主申岗位或申请路线，建议在后续任务中补全。</p>
                <div className="mt-3 space-y-1.5">
                  {report.advisorSignals.missingInformation.map((item) => <p key={item} className="text-sm text-amber-900">- {item}</p>)}
                </div>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-slate-950">优先比较的岗位方向</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">匹配度表示当前条件下的相对方向匹配，不是录取概率，也不表示排名第一就必须选择。</p>
              <div className="mt-3 space-y-3">
                {report.recommendedPositions.map((position, index) => (
                  <article key={position.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-blue-700">{index === 0 ? '优先比较方向' : index === 1 ? '同时比较方向' : '观察方向'}</p><h4 className="mt-1 font-semibold text-slate-950">{position.title}</h4></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-sm font-semibold text-blue-700">{position.matchScore}%</span></div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-700"><span className="font-medium text-slate-950">为什么进入比较范围：</span>{position.reasons.join('；')}</p>
                    <p className="mt-2 text-sm leading-relaxed text-amber-800"><span className="font-medium">先确认：</span>{position.risks.join('；')}</p>
                  </article>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
              <div className="flex items-start gap-3">
                <UserRoundCheck size={19} className="mt-0.5 shrink-0 text-violet-700" />
                <div>
                  <p className="text-sm font-semibold text-violet-950">重大选择建议人工校准</p>
                  {report.manualCalibration?.topics?.length > 0 && <p className="mt-1 text-sm leading-relaxed text-violet-900">本次尤其需要校准：{report.manualCalibration.topics.join('、')}。</p>}
                  <p className="mt-1 text-sm leading-relaxed text-violet-900">{report.manualCalibration?.message || '这类选择涉及收入、时间成本和长期职业路径，不建议只依据一次 AI 测评决定，可结合人工咨询进一步校准。'}</p>
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-950">建议申请方式</p><p className="mt-1 text-sm font-medium text-blue-700">{report.applicationRoute.title}</p><p className="mt-2 text-sm leading-relaxed text-slate-600">{report.applicationRoute.reason}</p></div>
              <div className="rounded-lg bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-950">暂不建议</p><p className="mt-2 text-sm leading-relaxed text-slate-600">{report.notRecommended.join('；')}</p></div>
            </div>
            <div className="rounded-lg border border-slate-200 p-4"><div className="flex items-center gap-2"><ClipboardList size={18} className="text-blue-700" /><h3 className="font-semibold text-slate-950">接下来 30 天先做什么</h3></div><div className="mt-3 space-y-2">{report.next30Days.map((item) => <p key={item} className="flex gap-2 text-sm leading-relaxed text-slate-700"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />{item}</p>)}</div></div>
            <div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => navigate('/tasks/Task2?from=career-report')} className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700">进入岗位比较<ArrowRight size={18} /></button><button type="button" onClick={() => navigate('/tasks/Task3?from=career-report')} className="rounded-lg border border-slate-300 bg-white py-3 font-medium text-slate-700 transition hover:bg-slate-50">查看申请路线建议</button></div>
          </div>
        )}
      </div>
    </section>
  )
}
