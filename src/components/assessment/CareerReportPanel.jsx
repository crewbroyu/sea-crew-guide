import { useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, ClipboardList, LoaderCircle, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAccessStore } from '../../store/accessStore'
import useEffectiveAccess from '../../hooks/useEffectiveAccess'
import { CareerReportError, generateCareerReport } from '../../services/careerReportService'

const roleLabels = {
  retail: 'Retail Sales Associate',
  front_office: 'Guest Service Associate',
  bar: 'Bar Server',
  restaurant: 'Restaurant Assistant',
  housekeeping: 'Housekeeping',
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

export default function CareerReportPanel({ assessment, fallbackRecommendations, onReportGenerated }) {
  const navigate = useNavigate()
  const { openRegisterModal } = useAccessStore()
  const { isRegistered } = useEffectiveAccess()
  const [profile, setProfile] = useState(initialProfile)
  const [report, setReport] = useState(() => assessment?.careerReport || null)
  const [state, setState] = useState('idle')
  const [message, setMessage] = useState('')

  const missingFields = useMemo(
    () => ['ageRange', 'education', 'englishLevel', 'experience', 'goal', 'timeline', 'budget', 'salesTolerance', 'workIntensity']
      .filter((field) => !profile[field]),
    [profile],
  )

  const updateProfile = (field, value) => setProfile((current) => ({ ...current, [field]: value }))

  const persistReport = (nextReport) => {
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
            <p className="text-sm font-medium text-blue-700">免费职业决策报告</p>
            <h2 className="mt-1 font-bold text-slate-950">补充信息，生成更具体的岗位与申请建议</h2>
            <p className="mt-1 text-sm leading-relaxed text-blue-900">不包含陪跑服务推销。报告只回答：适合什么、暂时不建议什么、该先补什么、申请方式怎么选。</p>
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
            <button type="button" onClick={handleGenerate} disabled={state === 'loading'} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">
              {state === 'loading' ? <LoaderCircle size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {state === 'loading' ? '正在生成职业评估...' : isRegistered ? '生成我的免费职业评估' : '登录后生成免费职业评估'}
            </button>
          </>
        )}

        {report && (
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-950">你的当前结论</p>
              <p className="mt-1 text-sm leading-relaxed text-emerald-900">{report.summary}</p>
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
              <h3 className="font-semibold text-slate-950">推荐岗位梯度</h3>
              <div className="mt-3 space-y-3">
                {report.recommendedPositions.map((position, index) => (
                  <article key={position.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-blue-700">{index === 0 ? '主申岗位' : index === 1 ? '备选岗位' : '冲刺或观察岗位'}</p><h4 className="mt-1 font-semibold text-slate-950">{position.title}</h4></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-sm font-semibold text-blue-700">{position.matchScore}%</span></div>
                    <p className="mt-3 text-sm leading-relaxed text-slate-700">{position.reasons.join('；')}</p>
                    <p className="mt-2 text-sm leading-relaxed text-amber-800"><span className="font-medium">先确认：</span>{position.risks.join('；')}</p>
                  </article>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-950">建议申请方式</p><p className="mt-1 text-sm font-medium text-blue-700">{report.applicationRoute.title}</p><p className="mt-2 text-sm leading-relaxed text-slate-600">{report.applicationRoute.reason}</p></div>
              <div className="rounded-lg bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-950">暂不建议</p><p className="mt-2 text-sm leading-relaxed text-slate-600">{report.notRecommended.join('；')}</p></div>
            </div>
            <div className="rounded-lg border border-slate-200 p-4"><div className="flex items-center gap-2"><ClipboardList size={18} className="text-blue-700" /><h3 className="font-semibold text-slate-950">接下来 30 天先做什么</h3></div><div className="mt-3 space-y-2">{report.next30Days.map((item) => <p key={item} className="flex gap-2 text-sm leading-relaxed text-slate-700"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />{item}</p>)}</div></div>
            <div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => navigate('/tasks/Task2?from=career-report')} className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700">确认目标岗位<ArrowRight size={18} /></button><button type="button" onClick={() => navigate('/tasks/Task3?from=career-report')} className="rounded-lg border border-slate-300 bg-white py-3 font-medium text-slate-700 transition hover:bg-slate-50">查看申请路线建议</button></div>
          </div>
        )}
      </div>
    </section>
  )
}
