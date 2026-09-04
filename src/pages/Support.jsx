import { useState } from 'react'
import { ArrowLeft, CheckCircle2, CircleHelp, Mail, MessageSquareWarning, ShieldCheck } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useEffectiveAccess from '../hooks/useEffectiveAccess'
import { createSupportRequest } from '../services/supportService'

const categories = [
  ['account_access', '登录或权益'],
  ['ai_training', 'AI 训练'],
  ['payment', '付款或激活'],
  ['bug', '页面问题'],
  ['suggestion', '产品建议'],
  ['other', '其他'],
]

export default function Support() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isRegistered, openRegisterModal } = useEffectiveAccess()
  const requestedProduct = searchParams.get('product')
  const isBarServerPurchase = requestedProduct === 'bar_server_pack'
  const [category, setCategory] = useState(() => (
    searchParams.get('category') === 'payment' ? 'payment' : 'ai_training'
  ))
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    if (!isRegistered) { openRegisterModal(); return }
    if (message.trim().length < 10) { setError('请至少描述 10 个字，方便我们定位问题。'); return }

    setStatus('submitting')
    setError('')
    try {
      const productPrefix = isBarServerPurchase ? '【申请产品：Bar Server 单职位全流程包】\n' : ''
      await createSupportRequest({ category, message: `${productPrefix}${message}` })
      setMessage('')
      setStatus('success')
    } catch (submissionError) {
      setError(submissionError.message || '提交失败，请稍后重试或发送邮件联系我们。')
      setStatus('idle')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-2xl px-5 pb-7 pt-12"><button type="button" onClick={() => navigate(-1)} className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"><ArrowLeft size={16} />返回</button><p className="text-sm font-medium text-blue-700">CrewPathGuide 支持中心</p><h1 className="mt-2 text-2xl font-semibold text-slate-950">遇到问题，直接告诉我们</h1><p className="mt-2 text-sm leading-6 text-slate-600">权益、AI 训练、功能问题和产品建议都会进入同一处理队列。</p></div></header>
      <main className="mx-auto max-w-2xl space-y-5 px-5 py-6">
        <section className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-950"><div className="flex gap-2"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-blue-700" /><p>AI 训练会在成功生成结果后才记录使用次数。若出现失败提示，可直接重试；若权益或付款状态异常，请选择“登录或权益”。</p></div></section>
        {isBarServerPurchase && <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><p className="font-semibold">Bar Server 人工开通</p><p className="mt-1">提交申请后，请使用注册邮箱联系支持获取付款方式。确认到账后，会向该邮箱发放一条 180 天单岗位激活码。付款前请先确认收款信息，不要在留言中发送身份证、银行卡号或密码。</p></section>}
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><CircleHelp size={19} className="text-blue-700" /><h2 className="font-semibold text-slate-950">提交问题</h2></div>{status === 'success' ? <div className="mt-5 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900"><div className="flex items-center gap-2 font-semibold"><CheckCircle2 size={18} />已收到你的反馈</div><p className="mt-2 leading-6">我们会结合你的账号和训练记录排查。你可以继续使用其他功能。</p><button type="button" onClick={() => setStatus('idle')} className="mt-3 font-semibold text-emerald-800 underline">再提交一条</button></div> : <form onSubmit={submit} className="mt-5 space-y-4"><label className="block"><span className="text-sm font-medium text-slate-800">问题类型</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="block"><span className="text-sm font-medium text-slate-800">具体情况</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={6} maxLength={2000} placeholder="例如：完成 Task7 后，AI 报告没有生成。我使用的是……" className="mt-2 w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>{error && <p className="text-sm text-red-700">{error}</p>}<button type="submit" disabled={status === 'submitting'} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white disabled:opacity-60"><MessageSquareWarning size={17} />{status === 'submitting' ? '正在提交...' : isRegistered ? '提交给 CrewPathGuide' : '登录后提交问题'}</button></form>}</section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Mail size={18} className="text-slate-600" /><h2 className="font-semibold text-slate-950">无法登录或需要人工沟通</h2></div><p className="mt-2 text-sm leading-6 text-slate-600">可发送邮件至 <a className="font-medium text-blue-700 underline" href="mailto:crewbroyu@gmail.com?subject=CrewPathGuide%20support">crewbroyu@gmail.com</a>。请附上注册邮箱、页面链接和问题截图，避免在邮件中发送密码或完整证件信息。</p></section>
      </main>
    </div>
  )
}
