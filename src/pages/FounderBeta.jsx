import { useState } from 'react'
import { ArrowLeft, CheckCircle2, ClipboardCheck, LoaderCircle, MessageSquareText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { createSupportRequest } from '../services/supportService'
import { trackProductEvent } from '../services/productAnalyticsService'

const testSteps = [
  ['职业判断', '完成测评报告，确认推荐岗位、暂不建议岗位与申请路线是否说得清楚。'],
  ['Bar Server 体验', '完成 3 个免费场景中的至少 1 个：录音、AI反馈、表达跟读、重练。'],
  ['岗位准备', '查看 7 天基础课，判断知识内容是否真的能帮助你回答面试问题。'],
  ['面试训练', '从题库进入单题练习；已开通权益的用户可再体验 AI 模拟面试。'],
]

const stageOptions = ['测评或岗位推荐', 'Bar Server 场景训练', '岗位基础课', '单题语音练习', 'AI 模拟面试', '登录、权益或付款', '其他']

export default function FounderBeta() {
  const navigate = useNavigate()
  const [stage, setStage] = useState(stageOptions[0])
  const [clarity, setClarity] = useState('')
  const [purchaseIntent, setPurchaseIntent] = useState('')
  const [feedback, setFeedback] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const submitFeedback = async (event) => {
    event.preventDefault()
    if (feedback.trim().length < 15) {
      setError('请至少写 15 个字，最好说明具体页面、操作和你的真实感受。')
      return
    }

    setStatus('submitting')
    setError('')
    try {
      await createSupportRequest({
        category: 'suggestion',
        message: [
          '【创始用户封闭测试】',
          `主要体验环节：${stage}`,
          `路径是否清楚：${clarity || '未选择'}`,
          `对 ¥199 / 180 天岗位包的意愿：${purchaseIntent || '未选择'}`,
          `反馈：${feedback.trim()}`,
        ].join('\n'),
      })
      trackProductEvent('founder_beta_feedback_submitted', {
        properties: { stage, clarity, purchaseIntent },
      })
      setStatus('success')
    } catch (submissionError) {
      console.error('Founder beta feedback failed:', submissionError)
      setError(submissionError.message || '提交失败，请稍后重试。')
      setStatus('idle')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-5 pb-7 pt-12">
          <button type="button" onClick={() => navigate('/tasks')} className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"><ArrowLeft size={16} />返回登船路径</button>
          <p className="text-sm font-medium text-blue-700">CrewPathGuide · 封闭测试</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">创始用户体验反馈</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">这不是让你帮忙找小问题，而是验证：这套系统能不能让人从不知道怎么准备，走到敢去申请和面试。</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-5 py-6">
        <section className="rounded-lg border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-start gap-3"><ClipboardCheck size={21} className="mt-0.5 shrink-0 text-blue-700" /><div><h2 className="font-semibold text-blue-950">建议体验顺序</h2><p className="mt-1 text-sm leading-6 text-blue-800">不用一天做完。每走完一段，记录你是被帮助了、困惑了，还是根本不想继续。</p></div></div>
          <div className="mt-5 space-y-3">
            {testSteps.map(([title, description], index) => <div key={title} className="flex gap-3 rounded-lg bg-white/80 p-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-700 text-xs font-semibold text-white">{index + 1}</span><p className="text-sm leading-6 text-slate-700"><span className="font-semibold text-slate-950">{title}：</span>{description}</p></div>)}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2"><MessageSquareText size={19} className="text-blue-700" /><h2 className="font-semibold text-slate-950">提交真实反馈</h2></div>
          {status === 'success' ? (
            <div className="mt-5 rounded-lg bg-emerald-50 p-4 text-sm leading-6 text-emerald-900"><div className="flex items-center gap-2 font-semibold"><CheckCircle2 size={18} />反馈已收到</div><p className="mt-1">感谢你没有只说“挺好”。这类具体反馈会直接决定下一轮改什么。</p></div>
          ) : (
            <form onSubmit={submitFeedback} className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-slate-800">你主要体验到哪一段？<select value={stage} onChange={(event) => setStage(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">{stageOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
              <label className="block text-sm font-medium text-slate-800">你能否理解下一步该做什么？<select value={clarity} onChange={(event) => setClarity(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="">请选择</option><option>很清楚</option><option>大致清楚，但有犹豫</option><option>不清楚，找不到下一步</option></select></label>
              <label className="block text-sm font-medium text-slate-800">体验后，你对 ¥199 / 180 天岗位包的感觉？<select value={purchaseIntent} onChange={(event) => setPurchaseIntent(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="">请选择</option><option>愿意购买</option><option>有价值，但价格或内容还需确认</option><option>暂时不会购买</option></select></label>
              <label className="block text-sm font-medium text-slate-800">请直接说真话<textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} rows={7} maxLength={2000} placeholder="例如：我在第几个页面犹豫了什么；哪段反馈让我觉得有价值；什么地方让我想退出；我愿意为何付费或不愿意为何付费。" className="mt-2 w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
              {error && <p className="text-sm text-red-700">{error}</p>}
              <button type="submit" disabled={status === 'submitting'} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white disabled:opacity-60">{status === 'submitting' && <LoaderCircle size={17} className="animate-spin" />}{status === 'submitting' ? '正在提交' : '提交封闭测试反馈'}</button>
            </form>
          )}
        </section>
      </main>
    </div>
  )
}
