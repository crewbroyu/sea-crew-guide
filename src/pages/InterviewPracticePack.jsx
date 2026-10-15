import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Mic, RefreshCcw, ShieldCheck, Sparkles, XCircle } from 'lucide-react'
import useEffectiveAccess from '../hooks/useEffectiveAccess'
import { hasProductEntitlement } from '../services/activationService'
import { trackProductEvent } from '../services/productAnalyticsService'
import { createManualPurchaseRequest, getMyManualPurchaseRequest } from '../services/manualPurchaseService'
import { getPurchaseStatusConfig, rememberActivationReturnRoute } from '../data/purchaseFlow'
import { INTERVIEW_PRACTICE_PACK, INTERVIEW_PRACTICE_PRODUCT_CODE, PRACTICE_PACK_POSITIONS } from '../data/interviewPracticePack'
import { positionConfig } from '../data/interviewQuestions'

const PRODUCT = INTERVIEW_PRACTICE_PRODUCT_CODE
const { priceCny, accessDays, aiFeedbackQuota } = INTERVIEW_PRACTICE_PACK
const included = [
  ['每个岗位 40 余道常见面试题', '按邮轮面试常见题型整理，含答题提示和关键词。'],
  ['参考回答与要点', '每题一段可以照着练的英文参考回答，附中文要点，经人工审核后上线。'],
  ['语音作答与自动转写', '像真实面试一样开口回答，转写后可以修改再提交。'],
  [`${aiFeedbackQuota} 次 AI 逐题反馈`, '指出回答具体好在哪里、缺了什么，并给出可直接重练的改进回答。'],
]
const excluded = ['岗位场景训练与基础课', 'AI 完整模拟面试', '岗位准备度报告']
const purchaseSteps = ['提交申请', '人工核款', '发送激活码']

const formatExpiry = (value) => {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime())
    ? new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(date)
    : '以账户权益为准'
}

export default function InterviewPracticePack() {
  const navigate = useNavigate()
  const location = useLocation()
  const access = useEffectiveAccess()
  const { isRegistered, openRegisterModal, openUnlockModal } = access
  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  const requestedPosition = PRACTICE_PACK_POSITIONS.includes(params.get('position')) ? params.get('position') : ''
  const practiceRoute = `/tasks/phase2/Task7/voice${requestedPosition ? `?position=${requestedPosition}` : ''}`
  const hasPack = hasProductEntitlement(access, PRODUCT)
  const entitlement = access.productEntitlements?.find((item) => item.product_code === PRODUCT)
  const [purchaseRequest, setPurchaseRequest] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  const [purchaseError, setPurchaseError] = useState('')
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    const source = params.get('source') || 'direct'
    trackProductEvent('product_page_viewed', {
      productCode: PRODUCT,
      oncePerSession: true,
      dedupeKey: `${PRODUCT}:${source}`,
      properties: { hasAccess: hasPack, source, position: requestedPosition || null },
    })
  }, [hasPack, params, requestedPosition])

  const loadPurchaseRequest = useCallback(async ({ quiet = false } = {}) => {
    if (!isRegistered || hasPack) {
      setPurchaseRequest(null)
      return
    }
    if (!quiet) setIsLoading(true)
    try {
      const request = await getMyManualPurchaseRequest(PRODUCT)
      setPurchaseRequest(request)
      setPurchaseError('')
    } catch (lookupError) {
      console.warn('Manual purchase request lookup failed:', lookupError.message)
      if (!quiet) setPurchaseError('暂时无法读取开通进度，请稍后刷新或联系支持。')
    } finally {
      if (!quiet) setIsLoading(false)
    }
  }, [hasPack, isRegistered, setPurchaseError])

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => loadPurchaseRequest(), 0)
    const refreshOnFocus = () => loadPurchaseRequest({ quiet: true })
    window.addEventListener('focus', refreshOnFocus)
    return () => {
      window.clearTimeout(initialRefresh)
      window.removeEventListener('focus', refreshOnFocus)
    }
  }, [loadPurchaseRequest])

  const openActivation = () => {
    trackProductEvent('activation_cta_clicked', { productCode: PRODUCT, properties: { isRegistered } })
    if (!isRegistered) return openRegisterModal()
    rememberActivationReturnRoute(practiceRoute)
    openUnlockModal()
  }

  const requestPurchase = async () => {
    trackProductEvent('purchase_cta_clicked', { productCode: PRODUCT, properties: { isRegistered } })
    if (!isRegistered) return openRegisterModal()
    if (!accepted) {
      setPurchaseError('提交前请确认价格、有效期、AI 额度以及交付与退款规则。')
      return
    }
    setIsRequesting(true)
    setPurchaseError('')
    try {
      const request = await createManualPurchaseRequest(PRODUCT)
      setPurchaseRequest(request)
      trackProductEvent('manual_purchase_requested', {
        productCode: PRODUCT,
        properties: { referenceCode: request.reference_code, existing: Boolean(request.existing) },
      })
    } catch (requestError) {
      console.error('Manual purchase request failed:', requestError)
      setPurchaseError(requestError.message?.includes('Product already active')
        ? '面试练习包已经开通，请刷新页面后开始练习。'
        : '申请暂时未提交成功，请稍后重试或通过支持中心联系人工开通。')
    } finally {
      setIsRequesting(false)
    }
  }

  const visibleRequest = isRegistered && !hasPack ? purchaseRequest : null
  const status = getPurchaseStatusConfig(visibleRequest?.status)
  const hasOpenRequest = Boolean(visibleRequest && visibleRequest.status !== 'cancelled')
  const activationReady = visibleRequest?.status === 'activation_sent'
  const positions = PRACTICE_PACK_POSITIONS.map((key) => positionConfig.find((item) => item.key === key)).filter(Boolean)

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-5 pb-8 pt-12">
          <button type="button" onClick={() => navigate(-1)} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700">
            <ArrowLeft size={16} />返回
          </button>
          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-end">
            <div>
              <p className="text-sm font-medium text-blue-700">CrewPathGuide · 多岗位通用</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-950">面试练习包</h1>
              <p className="mt-4 text-sm leading-6 text-slate-600">常见面试题、参考回答、语音作答和 AI 逐题反馈。适合已经确定方向、想把面试回答练熟的同学。</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {positions.map((position) => (
                  <span key={position.key} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{position.icon} {position.nameZh}</span>
                ))}
              </div>
            </div>
            {hasPack ? (
              <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-emerald-900"><ShieldCheck size={20} />已开通</p>
                <p className="mt-1 text-sm text-emerald-800">有效期至：{formatExpiry(entitlement?.expires_at)}</p>
                <button type="button" onClick={() => navigate(practiceRoute)} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800">开始语音练习 <ArrowRight size={17} /></button>
              </section>
            ) : (
              <section className="rounded-lg border border-blue-200 bg-blue-50 p-5">
                <p className="text-3xl font-semibold text-slate-950">¥{priceCny} <span className="text-sm font-medium text-slate-500">/ {accessDays} 天</span></p>
                <p className="mt-2 text-sm leading-6 text-blue-900">人工确认付款，不会在页面自动扣款。</p>
              </section>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-5 py-7">
        <section className="grid gap-3 md:grid-cols-2">
          {included.map(([title, description]) => (
            <article key={title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 font-semibold text-slate-950"><CheckCircle2 size={18} className="text-emerald-600" />{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </article>
          ))}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-950">不包含（岗位包内容）</h2>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {excluded.map((item) => <p key={item} className="flex items-center gap-1.5 text-sm text-slate-500"><XCircle size={15} />{item}</p>)}
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">已购练习包后升级 Bar Server 岗位包，只需补差价，联系支持即可办理。</p>
        </section>

        {!hasPack && (
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="grid gap-6 md:grid-cols-[1fr_17rem] md:items-start">
              <div>
                <p className="text-xs font-semibold text-blue-700">人工开通 · 页面不自动扣款</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">申请开通面试练习包</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">提交后会生成订单编号。确认付款与到账后，激活码会发送到你的注册邮箱或约定的联系方式。</p>
                <div className="mt-4 grid gap-3 border-y border-slate-200 py-4 text-sm sm:grid-cols-2">
                  <p className="flex items-center gap-2 text-slate-700"><Mic size={16} className="text-blue-700" />激活成功起 {accessDays} 天</p>
                  <p className="flex items-center gap-2 text-slate-700"><Sparkles size={16} className="text-blue-700" />{aiFeedbackQuota} 次 AI 反馈</p>
                </div>
              </div>
              <div className="space-y-3">
                {!hasOpenRequest && (
                  <label className="flex items-start gap-2 text-xs leading-5 text-slate-600">
                    <input type="checkbox" checked={accepted} onChange={(event) => { setAccepted(event.target.checked); setPurchaseError('') }} className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600" />
                    <span>我已确认 ¥{priceCny} / {accessDays} 天、{aiFeedbackQuota} 次 AI 反馈，并阅读<a href="/legal/purchase" target="_blank" rel="noreferrer" className="ml-1 font-semibold text-blue-700 underline">交付与退款规则</a></span>
                  </label>
                )}
                {activationReady ? (
                  <button type="button" onClick={openActivation} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"><KeyRound size={17} />输入收到的激活码</button>
                ) : (
                  <button type="button" onClick={requestPurchase} disabled={isRequesting || hasOpenRequest || isLoading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                    {isRequesting ? '正在提交...' : hasOpenRequest ? '申请处理中' : isRegistered ? '申请开通' : '登录后申请开通'} <ArrowRight size={17} />
                  </button>
                )}
                {!activationReady && <button type="button" onClick={openActivation} className="inline-flex min-h-11 w-full items-center justify-center gap-2 text-sm font-semibold text-blue-700"><KeyRound size={16} />我已经有激活码</button>}
              </div>
            </div>

            {visibleRequest && status && (
              <div className={`mt-6 border-l-4 px-4 py-4 ${visibleRequest.status === 'cancelled' ? 'border-slate-300 bg-slate-50' : 'border-emerald-500 bg-emerald-50'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-600">订单编号 <span className="font-mono text-slate-900">{visibleRequest.reference_code}</span></p>
                    <h3 className="mt-1 font-semibold text-slate-950">{status.label}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{status.description}</p>
                  </div>
                  <button type="button" onClick={() => loadPurchaseRequest()} disabled={isLoading} className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-blue-700 disabled:opacity-50"><RefreshCcw size={14} className={isLoading ? 'animate-spin' : ''} />刷新</button>
                </div>
                {visibleRequest.status !== 'cancelled' && (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {purchaseSteps.map((step, index) => (
                      <div key={step} className={`border-t-2 pt-2 text-xs font-medium ${index + 1 <= status.step ? 'border-emerald-600 text-emerald-800' : 'border-slate-200 text-slate-400'}`}>{index + 1}. {step}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {purchaseError && (
              <div className="mt-4 border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
                <p>{purchaseError}</p>
                <button type="button" onClick={() => navigate(`/support?category=payment&product=${PRODUCT}`)} className="mt-1 font-semibold underline underline-offset-2">前往支持中心</button>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
