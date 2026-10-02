import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, ArrowRight, CheckCircle2, ClipboardList, ListChecks,
  LoaderCircle, PencilLine, Scale, Sparkles, UserRoundCheck,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAccessStore } from '../../store/accessStore'
import useEffectiveAccess from '../../hooks/useEffectiveAccess'
import { CareerReportError, generateCareerReport, getLatestCareerReport } from '../../services/careerReportService'
import { trackProductEvent } from '../../services/productAnalyticsService'

const roleOptions = [
  ['undecided', '还不确定，希望获得推荐'],
  ['retail', '免税店 / Retail Sales'],
  ['front_office', '前台 / Guest Services'],
  ['bar', '酒吧服务 / Bar Server'],
  ['restaurant', '餐厅服务 / Restaurant'],
  ['housekeeping', '客房服务 / Housekeeping'],
  ['youth_staff', '儿童青少年活动 / Youth Staff'],
  ['beauty_spa', '美容 SPA / 技能服务'],
]

const fieldOptions = {
  timeline: [
    ['within_3_months', '3 个月内'], ['3_6_months', '3-6 个月'],
    ['6_12_months', '6-12 个月'], ['exploring', '暂未确定，先了解'],
  ],
  currentStage: [
    ['exploring', '刚开始了解海乘'], ['position_selected', '已经确定目标岗位'],
    ['interview_preparation', '正在准备或参加面试'], ['waiting_contract', '已通过面试，等待合同'],
    ['waiting_onboard', '已拿到合同，等待登船'], ['experienced', '有过上船经历'],
  ],
  primaryConcern: [
    ['english', '英语听说跟不上'], ['interview', '面试表现不稳定'],
    ['experience', '相关经验不足'], ['role_knowledge', '不了解岗位实际工作'],
    ['medical_visa', '体检、签证或证件'], ['route_reliability', '申请渠道是否可靠'],
    ['cost', '前期费用和投入'], ['onboard_adaptation', '上船后的适应问题'], ['other', '其他问题'],
  ],
}

const hardLimitOptions = [
  ['sales_targets', '强销售指标'], ['night_shifts', '长期晚班'],
  ['high_intensity', '高体力强度'], ['low_base_salary', '较低底薪'],
  ['long_contract', '较长合同'], ['high_upfront_cost', '较高前期费用'],
  ['none', '目前没有明确限制'],
]

const initialProfile = {
  targetRole: '', backupRole: '', timeline: '', currentStage: '',
  primaryConcern: '', hardLimits: [], additionalContext: '',
}

const normalizeProfile = (profile = {}) => ({
  ...initialProfile,
  targetRole: profile.targetRole || '',
  backupRole: profile.backupRole || '',
  timeline: profile.timeline || '',
  currentStage: profile.currentStage || '',
  primaryConcern: profile.primaryConcern || '',
  hardLimits: Array.isArray(profile.hardLimits) ? profile.hardLimits : [],
  additionalContext: profile.additionalContext || profile.workSummary || '',
})

const redactSensitiveText = (value = '') => value
  .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[已隐藏邮箱]')
  .replace(/(?<!\d)1[3-9]\d{9}(?!\d)/g, '[已隐藏手机号]')
  .replace(/(?:微信|wechat|vx|v信)\s*[:：]\s*[\w-]+/gi, '[已隐藏联系方式]')

const sanitizeProfileForStorage = (profile) => ({
  ...profile,
  additionalContext: redactSensitiveText(profile.additionalContext),
})

const optionLabel = (options, value) => options.find(([key]) => key === value)?.[1] || '尚未确认'

const buildLegacyDecisionBasis = (profile, assessment) => [
  {
    key: 'english', label: '当前英语水平',
    value: assessment?.practicalAssessment?.englishScore != null
      ? `英语实战 ${assessment.practicalAssessment.englishScore}/100`
      : `英语维度 ${assessment?.dimensionScores?.english || 0}/100`,
    impact: '影响岗位沟通复杂度和准备周期。',
  },
  {
    key: 'experience', label: '相关工作经验',
    value: assessment?.practicalAssessment?.serviceExperienceScore != null
      ? `经历核验 ${assessment.practicalAssessment.serviceExperienceScore}/100`
      : '结合测评中的经历背景判断',
    impact: '决定哪些服务、销售或沟通能力可以直接迁移。',
  },
  { key: 'entry_threshold', label: '岗位进入门槛', value: '结合前三个方向进一步比较', impact: '较容易进入不等于收入或长期发展更优。' },
  { key: 'competitiveness', label: '当前竞争力', value: '由测评证据和求职阶段综合判断', impact: '匹配度反映当前准备状态，不是录取概率。' },
  {
    key: 'core_goal', label: '你的核心诉求',
    value: `${optionLabel(roleOptions, profile.targetRole)}；${optionLabel(fieldOptions.timeline, profile.timeline)}`,
    impact: '决定应优先比较目标岗位、上船速度还是现实限制。',
  },
]

const SelectField = ({ label, value, options, onChange, optional = false, disabled = false }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm font-medium text-slate-700">
      {label}{optional && <span className="ml-1 font-normal text-slate-400">选填</span>}
    </span>
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
    >
      <option value="">请选择</option>
      {options.map(([optionValue, optionText]) => <option key={optionValue} value={optionValue}>{optionText}</option>)}
    </select>
  </label>
)

const saveReportLocally = ({ nextReport, profile, fallbackRecommendations }) => {
  try {
    const current = JSON.parse(localStorage.getItem('assessment_result') || '{}')
    const safeProfile = sanitizeProfileForStorage(profile)
    const recommendations = nextReport.recommendedPositions.map((position) => ({
      id: position.id,
      title: position.title,
      matchScore: position.matchScore,
      strengths: position.reasons,
      risks: position.risks,
      nextSteps: position.nextSteps,
    }))
    localStorage.setItem('assessment_result', JSON.stringify({
      ...current,
      careerProfile: safeProfile,
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
  const [profile, setProfile] = useState(() => normalizeProfile(assessment?.careerProfile))
  const [savedProfile, setSavedProfile] = useState(() => normalizeProfile(assessment?.careerProfile))
  const [report, setReport] = useState(() => assessment?.careerReport || null)
  const [isEditing, setIsEditing] = useState(() => !assessment?.careerReport)
  const [state, setState] = useState('idle')
  const [message, setMessage] = useState('')

  const missingFields = useMemo(() => [
    ['targetRole', profile.targetRole],
    ['timeline', profile.timeline],
    ['currentStage', profile.currentStage],
    ['primaryConcern', profile.primaryConcern],
    ['hardLimits', profile.hardLimits.length],
  ].filter(([, value]) => !value).map(([field]) => field), [profile])

  const decisionBasis = useMemo(
    () => report?.decisionBasis?.length ? report.decisionBasis : buildLegacyDecisionBasis(profile, assessment),
    [assessment, profile, report],
  )
  const decisionRisks = report?.decisionRisks?.length
    ? report.decisionRisks
    : ['方向匹配度只反映当前信息；收入、工作强度和长期发展仍需在岗位确认前逐项比较。']

  const updateProfile = (field, value) => setProfile((current) => ({ ...current, [field]: value }))

  const updateTargetRole = (value) => {
    setProfile((current) => ({
      ...current,
      targetRole: value,
      backupRole: value === 'undecided' || current.backupRole === value ? '' : current.backupRole,
    }))
  }

  const toggleHardLimit = (value) => {
    setProfile((current) => {
      if (value === 'none') return { ...current, hardLimits: current.hardLimits.includes('none') ? [] : ['none'] }
      const withoutNone = current.hardLimits.filter((item) => item !== 'none')
      return {
        ...current,
        hardLimits: withoutNone.includes(value)
          ? withoutNone.filter((item) => item !== value)
          : [...withoutNone, value],
      }
    })
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
        const restoredProfile = normalizeProfile(saved.profile)
        setProfile(restoredProfile)
        setSavedProfile(restoredProfile)
        setReport(saved.report)
        setIsEditing(false)
        saveReportLocally({ nextReport: saved.report, profile: restoredProfile, fallbackRecommendations })
        onReportGenerated?.(saved.report, restoredProfile)
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
      setMessage('请完成 5 项快速选择；自由补充内容可以不填。')
      return
    }

    try {
      setState('loading')
      setMessage('')
      const nextReport = await generateCareerReport({
        profile,
        regenerate: Boolean(report),
        assessment: {
          assessmentVersion: assessment.assessmentVersion,
          overallScore: assessment.overallScore,
          level: assessment.level,
          serviceBackground: assessment.serviceBackground,
          dimensionScores: assessment.dimensionScores,
          practicalAssessment: assessment.practicalAssessment,
          ruleRecommendations: fallbackRecommendations.map(({ id, title, matchScore }) => ({ id, title, matchScore })),
        },
      })
      trackProductEvent('career_report_generated', {
        productCode: null,
        properties: {
          targetRole: profile.targetRole,
          backupRole: profile.backupRole || null,
          timeline: profile.timeline,
          currentStage: profile.currentStage,
          primaryConcern: profile.primaryConcern,
          regenerate: Boolean(report),
        },
      })
      setReport(nextReport)
      const safeProfile = sanitizeProfileForStorage(profile)
      setProfile(safeProfile)
      setSavedProfile(safeProfile)
      setIsEditing(false)
      saveReportLocally({ nextReport, profile: safeProfile, fallbackRecommendations })
      onReportGenerated?.(nextReport, safeProfile)
      setState('success')
    } catch (error) {
      console.error('Career report generation failed:', error)
      setState('error')
      setMessage(error instanceof CareerReportError ? error.message : '职业评估暂时无法生成，请稍后重试。')
    }
  }

  const cancelEditing = () => {
    setProfile(savedProfile)
    setIsEditing(false)
    setMessage('')
    setState('success')
  }

  const showForm = !report || isEditing
  const hardLimitSummary = savedProfile.hardLimits.map((value) => optionLabel(hardLimitOptions, value)).join('、')

  return (
    <section className="mb-6 overflow-hidden rounded-lg border border-blue-200 bg-white shadow-sm">
      <div className="border-b border-blue-100 bg-blue-50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700"><Sparkles size={21} /></div>
          <div>
            <p className="text-sm font-medium text-blue-700">免费岗位方向分析</p>
            <h2 className="mt-1 font-bold text-slate-950">补充你的求职目标和限制</h2>
            <p className="mt-1 text-sm leading-relaxed text-blue-900">这些信息不会改变客观测评分数，只用于岗位排序、风险提醒和准备建议。</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {showForm && (
          <div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField label="首选目标岗位" value={profile.targetRole} options={roleOptions} onChange={updateTargetRole} />
              <SelectField
                label="备选岗位"
                optional
                disabled={profile.targetRole === 'undecided'}
                value={profile.backupRole}
                options={roleOptions.filter(([value]) => value !== 'undecided' && value !== profile.targetRole)}
                onChange={(value) => updateProfile('backupRole', value)}
              />
              <SelectField label="希望多久上船" value={profile.timeline} options={fieldOptions.timeline} onChange={(value) => updateProfile('timeline', value)} />
              <SelectField label="目前所处阶段" value={profile.currentStage} options={fieldOptions.currentStage} onChange={(value) => updateProfile('currentStage', value)} />
              <div className="sm:col-span-2">
                <SelectField label="目前最担心的问题" value={profile.primaryConcern} options={fieldOptions.primaryConcern} onChange={(value) => updateProfile('primaryConcern', value)} />
              </div>
            </div>

            <fieldset className="mt-4">
              <legend className="text-sm font-medium text-slate-700">不能接受的工作条件 <span className="font-normal text-slate-400">可多选</span></legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {hardLimitOptions.map(([value, label]) => (
                  <label key={value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:border-blue-300 hover:bg-blue-50">
                    <input type="checkbox" checked={profile.hardLimits.includes(value)} onChange={() => toggleHardLimit(value)} className="h-4 w-4 accent-blue-600" />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">还有什么情况会影响你的岗位选择？ <span className="font-normal text-slate-400">选填</span></span>
              <textarea
                value={profile.additionalContext}
                maxLength={500}
                onChange={(event) => updateProfile('additionalContext', event.target.value)}
                placeholder="例如：已经拿到酒吧岗位合同，但英语听说较弱；有两年餐饮经验，希望半年内上船；不想做强销售岗位。"
                className="min-h-28 w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <span className="mt-1 flex justify-between gap-3 text-xs text-slate-400">
                <span>请勿填写姓名、电话、微信、身份证号等隐私信息。</span>
                <span className="shrink-0">{profile.additionalContext.length}/500</span>
              </span>
            </label>

            {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
            <div className={`mt-4 grid gap-3 ${report ? 'sm:grid-cols-[1fr_auto]' : ''}`}>
              <button type="button" onClick={handleGenerate} disabled={state === 'loading' || state === 'restoring'} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                {state === 'loading' || state === 'restoring' ? <LoaderCircle size={18} className="animate-spin" /> : <Sparkles size={18} />}
                {state === 'restoring' ? '正在读取已有报告...' : state === 'loading' ? '正在生成职业评估...' : report ? '根据新要求更新报告' : isRegistered ? '生成我的免费职业评估' : '登录后生成免费职业评估'}
              </button>
              {report && <button type="button" onClick={cancelEditing} disabled={state === 'loading'} className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400">取消修改</button>}
            </div>
          </div>
        )}

        {report && !isEditing && (
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-950">本次分析采用的个人要求</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    {optionLabel(roleOptions, savedProfile.targetRole)} · {optionLabel(fieldOptions.timeline, savedProfile.timeline)} · {optionLabel(fieldOptions.currentStage, savedProfile.currentStage)}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">主要担忧：{optionLabel(fieldOptions.primaryConcern, savedProfile.primaryConcern)}；限制：{hardLimitSummary || '尚未确认'}</p>
                  {savedProfile.additionalContext && <p className="mt-2 text-sm leading-relaxed text-slate-600">补充：{savedProfile.additionalContext}</p>}
                </div>
                <button type="button" onClick={() => { setIsEditing(true); setMessage('') }} className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"><PencilLine size={16} />修改</button>
              </div>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3"><Scale size={19} className="mt-0.5 shrink-0 text-blue-700" /><div><p className="text-sm font-semibold text-blue-950">{report.decisionPrinciple || 'AI 帮你缩小选择范围，但不替你做最终决定。'}</p><p className="mt-1 text-sm leading-relaxed text-blue-900">以下方向是基于当前信息形成的比较起点，不是录取承诺，也不是最终职业决定。</p></div></div>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4"><p className="text-sm font-semibold text-emerald-950">当前方向判断</p><p className="mt-1 text-sm leading-relaxed text-emerald-900">{report.summary}</p></div>
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2"><ListChecks size={18} className="text-blue-700" /><h3 className="font-semibold text-slate-950">为什么得到这些方向</h3></div>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">你可以逐项检查判断依据是否符合真实情况；任何一项变化，都可能改变岗位排序。</p>
              <div className="mt-3 divide-y divide-slate-100">
                {decisionBasis.map((item) => <div key={item.key || item.label} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4"><p className="text-sm font-medium text-slate-950">{item.label}</p><div><p className="text-sm text-slate-800">{item.value}</p><p className="mt-1 text-xs leading-5 text-slate-500">{item.impact}</p></div></div>)}
              </div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3"><AlertTriangle size={19} className="mt-0.5 shrink-0 text-amber-700" /><div><p className="text-sm font-semibold text-amber-950">决策风险与诉求冲突</p><div className="mt-2 space-y-1.5">{decisionRisks.map((item) => <p key={item} className="text-sm leading-relaxed text-amber-900">- {item}</p>)}</div></div></div>
            </div>
            {report.advisorSignals?.missingInformation?.length > 0 && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-950">还需要确认的关键变量</p><p className="mt-1 text-sm leading-relaxed text-amber-900">这些信息可能改变主申岗位或申请路线，建议在后续任务中补全。</p><div className="mt-3 space-y-1.5">{report.advisorSignals.missingInformation.map((item) => <p key={item} className="text-sm text-amber-900">- {item}</p>)}</div></div>}
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
            <div className="rounded-lg border border-violet-200 bg-violet-50 p-4"><div className="flex items-start gap-3"><UserRoundCheck size={19} className="mt-0.5 shrink-0 text-violet-700" /><div><p className="text-sm font-semibold text-violet-950">重大选择建议人工校准</p>{report.manualCalibration?.topics?.length > 0 && <p className="mt-1 text-sm leading-relaxed text-violet-900">本次尤其需要校准：{report.manualCalibration.topics.join('、')}。</p>}<p className="mt-1 text-sm leading-relaxed text-violet-900">{report.manualCalibration?.message || '这类选择涉及收入、时间成本和长期职业路径，不建议只依据一次 AI 测评决定，可结合人工咨询进一步校准。'}</p></div></div></div>
            <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-lg bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-950">建议申请方式</p><p className="mt-1 text-sm font-medium text-blue-700">{report.applicationRoute.title}</p><p className="mt-2 text-sm leading-relaxed text-slate-600">{report.applicationRoute.reason}</p></div><div className="rounded-lg bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-950">暂不建议</p><p className="mt-2 text-sm leading-relaxed text-slate-600">{report.notRecommended.join('；')}</p></div></div>
            <div className="rounded-lg border border-slate-200 p-4"><div className="flex items-center gap-2"><ClipboardList size={18} className="text-blue-700" /><h3 className="font-semibold text-slate-950">接下来 30 天先做什么</h3></div><div className="mt-3 space-y-2">{report.next30Days.map((item) => <p key={item} className="flex gap-2 text-sm leading-relaxed text-slate-700"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />{item}</p>)}</div></div>
            <div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => navigate('/tasks/Task2?from=career-report')} className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700">进入岗位比较<ArrowRight size={18} /></button><button type="button" onClick={() => navigate('/tasks/Task3?from=career-report')} className="rounded-lg border border-slate-300 bg-white py-3 font-medium text-slate-700 transition hover:bg-slate-50">查看申请路线建议</button></div>
          </div>
        )}
      </div>
    </section>
  )
}
