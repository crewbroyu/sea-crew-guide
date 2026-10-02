import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  KeyRound,
  MailCheck,
  MessageSquare,
  RefreshCcw,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  Wine,
} from 'lucide-react'
import useEffectiveAccess from '../hooks/useEffectiveAccess'
import { hasProductEntitlement } from '../services/activationService'
import { trackProductEvent } from '../services/productAnalyticsService'
import { createManualPurchaseRequest, getMyManualPurchaseRequest } from '../services/manualPurchaseService'
import {
  BAR_SERVER_PRODUCT_CODE,
  getPurchaseStatusConfig,
  rememberActivationReturnRoute,
  resolvePurchaseReturnRoute,
} from '../data/purchaseFlow'

const included = [
  {
    title: '14 天岗位训练路径',
    description: '岗位知识、工作英语、真实场景和班次验证按能力顺序衔接。',
    icon: Route,
  },
  {
    title: '40 道岗位面试题库',
    description: '围绕真实 Bar Server 招聘重点准备答案卡，并用语音反复演练。',
    icon: FileText,
  },
  {
    title: 'AI 面试训练与反馈',
    description: '逐题转写、岗位知识评分、英文表达建议、参考答案与完整模拟。',
    icon: Sparkles,
  },
  {
    title: '训练记录与准备度',
    description: '沉淀回答、分数变化和当前短板，知道自己是否接近可面试和可工作的状态。',
    icon: Target,
  },
]

const freeItems = ['浏览海乘百科和岗位内容', '完成基础职业测评', '查看基础岗位推荐', '完成 3 个 Bar Server 场景体验']
const premiumItems = ['完整 14 天 Bar Server 训练路线', '360 次语音转写与 120 次 AI 反馈', '10 次完整 AI 模拟面试', '训练记录、短板与准备度报告']
const purchaseSteps = ['提交申请', '人工核款', '发送激活码']

const formatExpiry = (value) => {
  if (!value) return '以账户权益为准'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '以账户权益为准'
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(date)
}

export default function Premium() {
  const navigate = useNavigate()
  const location = useLocation()
  const access = useEffectiveAccess()
  const { isRegistered, openRegisterModal, openUnlockModal } = access
  const hasBarServerPack = hasProductEntitlement(access, BAR_SERVER_PRODUCT_CODE)
  const returnRoute = useMemo(() => resolvePurchaseReturnRoute({
    search: location.search,
    state: location.state,
  }), [location.search, location.state])
  const entitlement = access.productEntitlements?.find((item) => item.product_code === BAR_SERVER_PRODUCT_CODE)
  const expiryLabel = formatExpiry(entitlement?.expires_at || access.premiumUntil)
  const [purchaseRequest, setPurchaseRequest] = useState(null)
  const [isLoadingPurchase, setIsLoadingPurchase] = useState(false)
  const [isRequestingPurchase, setIsRequestingPurchase] = useState(false)
  const [purchaseRequestError, setPurchaseRequestError] = useState('')
  const [acceptedPurchaseRules, setAcceptedPurchaseRules] = useState(false)

  useEffect(() => {
    const source = new URLSearchParams(location.search).get('source') || 'direct'
    trackProductEvent('product_page_viewed', {
      oncePerSession: true,
      dedupeKey: source,
      properties: { hasAccess: hasBarServerPack, source },
    })
  }, [hasBarServerPack, location.search])

  const loadPurchaseRequest = useCallback(async ({ quiet = false } = {}) => {
    if (!isRegistered || hasBarServerPack) {
      setPurchaseRequest(null)
      return
    }

    if (!quiet) setIsLoadingPurchase(true)
    try {
      const request = await getMyManualPurchaseRequest(BAR_SERVER_PRODUCT_CODE)
      setPurchaseRequest(request)
      setPurchaseRequestError('')
    } catch (error) {
      console.warn('Manual purchase request lookup failed:', error.message)
      if (!quiet) setPurchaseRequestError('暂时无法读取开通进度，请稍后刷新或联系支持。')
    } finally {
      if (!quiet) setIsLoadingPurchase(false)
    }
  }, [hasBarServerPack, isRegistered])

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
    trackProductEvent('activation_cta_clicked', {
      properties: { productCode: BAR_SERVER_PRODUCT_CODE, isRegistered, returnRoute },
    })
    if (!isRegistered) {
      openRegisterModal()
      return
    }

    rememberActivationReturnRoute(returnRoute)
    openUnlockModal()
  }

  const continueTraining = () => {
    trackProductEvent('product_training_entered', { properties: { returnRoute } })
    navigate(returnRoute)
  }

  const handleManualPurchase = async () => {
    trackProductEvent('purchase_cta_clicked', {
      properties: { productCode: BAR_SERVER_PRODUCT_CODE, isRegistered },
    })

    if (!isRegistered) {
      openRegisterModal()
      return
    }
    if (!acceptedPurchaseRules) {
      setPurchaseRequestError('提交前请确认价格、有效期、AI 额度以及交付与退款规则。')
      return
    }

    setIsRequestingPurchase(true)
    setPurchaseRequestError('')
    try {
      const request = await createManualPurchaseRequest(BAR_SERVER_PRODUCT_CODE)
      setPurchaseRequest(request)
      trackProductEvent('manual_purchase_requested', {
        properties: {
          productCode: BAR_SERVER_PRODUCT_CODE,
          referenceCode: request.reference_code,
          existing: Boolean(request.existing),
        },
      })
    } catch (error) {
      console.error('Manual purchase request failed:', error)
      const alreadyActive = error.message?.includes('Product already active')
      setPurchaseRequestError(alreadyActive
        ? '该岗位包已经开通，请刷新页面后继续训练。'
        : '申请暂时未提交成功，请稍后重试或通过支持中心联系人工开通。')
    } finally {
      setIsRequestingPurchase(false)
    }
  }

  const visiblePurchaseRequest = isRegistered && !hasBarServerPack ? purchaseRequest : null
  const purchaseStatus = getPurchaseStatusConfig(visiblePurchaseRequest?.status)
  const hasOpenPurchaseRequest = Boolean(visiblePurchaseRequest && visiblePurchaseRequest.status !== 'cancelled')
  const activationReady = visiblePurchaseRequest?.status === 'activation_sent'

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-5 pb-8 pt-12">
          <button type="button" onClick={() => navigate(-1)} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-700">
            <ArrowLeft size={16} />返回
          </button>

          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="text-sm font-medium text-blue-700">CrewPathGuide · Bar Server</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">Bar Server 单职位全流程包</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">从岗位知识、场景英语和题库练习，一路练到 AI 模拟面试与准备度判断。目标不是看完资料，而是把真实工作和面试中的回答练出来。</p>
            </div>

            {hasBarServerPack ? (
              <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start gap-3"><ShieldCheck size={22} className="mt-0.5 shrink-0 text-emerald-700" /><div><p className="text-sm font-semibold text-emerald-900">完整权益已开通</p><p className="mt-1 text-sm text-emerald-800">有效期至：{expiryLabel}</p></div></div>
                <button type="button" onClick={continueTraining} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800">继续我的训练 <ArrowRight size={17} /></button>
              </section>
            ) : (
              <section className="rounded-lg border border-blue-200 bg-blue-50 p-5">
                <p className="text-xs font-semibold text-blue-700">完整岗位包</p>
                <p className="mt-1 text-3xl font-semibold text-slate-950">¥199 <span className="text-sm font-medium text-slate-500">/ 180 天</span></p>
                <p className="mt-2 text-sm leading-6 text-blue-900">人工确认付款，不会在页面自动扣款。</p>
              </section>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-7">
        {!hasBarServerPack && (
          <section className="mb-8 border-l-4 border-blue-600 bg-white px-5 py-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3"><Wine size={21} className="mt-0.5 shrink-0 text-blue-700" /><div><p className="text-xs font-medium text-blue-700">购买前先验证是否适合</p><h2 className="mt-1 font-semibold text-slate-950">免费完成 3 个真实场景</h2><p className="mt-1 text-sm leading-6 text-slate-600">每场都有完整 AI 反馈和重练对比，体验完成后再决定是否开通。</p></div></div>
              <button type="button" onClick={() => navigate('/programs/bar-server/trial')} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100">开始免费体验 <ArrowRight size={16} /></button>
            </div>
          </section>
        )}

        <section className="mb-8 grid gap-4 md:grid-cols-2">
          {included.map((item) => {
            const Icon = item.icon
            return <article key={item.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Icon size={22} /></div><h2 className="font-semibold text-slate-950">{item.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p></article>
          })}
        </section>

        <section className="mb-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-950">免费版</h2><div className="mt-4 space-y-3">{freeItems.map((item) => <div key={item} className="flex items-start gap-2"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-600" /><p className="text-sm leading-5 text-slate-700">{item}</p></div>)}</div></div>
          <div className="rounded-lg border border-blue-200 bg-white p-5"><h2 className="font-semibold text-slate-950">Bar Server 完整包</h2><div className="mt-4 space-y-3">{premiumItems.map((item) => <div key={item} className="flex items-start gap-2"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-blue-600" /><p className="text-sm leading-5 text-slate-700">{item}</p></div>)}</div></div>
        </section>

        {hasBarServerPack ? (
          <section className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3"><ShieldCheck size={22} className="mt-0.5 shrink-0 text-emerald-700" /><div><p className="text-xs font-semibold text-emerald-700">账户权益</p><h2 className="mt-1 text-xl font-semibold text-slate-950">你的完整训练已经可以使用</h2><p className="mt-2 text-sm leading-6 text-slate-600">继续进入训练路线，系统会读取已有进度，不需要再次购买或输入激活码。</p></div></div>
            <button type="button" onClick={continueTraining} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800">继续我的训练 <ArrowRight size={18} /></button>
          </section>
        ) : (
          <section id="purchase" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="grid gap-6 md:grid-cols-[1fr_18rem] md:items-start">
              <div>
                <p className="text-xs font-semibold text-blue-700">人工开通 · 页面不自动扣款</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">申请开通完整训练</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">提交后会生成订单编号。确认付款方式与到账后，专属激活码会发送到你的注册邮箱或约定的联系方式。</p>
                <div className="mt-5 grid gap-4 border-y border-slate-200 py-4 text-sm sm:grid-cols-3">
                  <div><Clock3 size={18} className="text-blue-700" /><p className="mt-2 font-semibold text-slate-900">有效期</p><p className="mt-1 leading-5 text-slate-600">激活成功起 180 天</p></div>
                  <div><Sparkles size={18} className="text-blue-700" /><p className="mt-2 font-semibold text-slate-900">AI 额度</p><p className="mt-1 leading-5 text-slate-600">120 次反馈、10 次模拟</p></div>
                  <div><MailCheck size={18} className="text-blue-700" /><p className="mt-2 font-semibold text-slate-900">交付方式</p><p className="mt-1 leading-5 text-slate-600">人工核款后发送激活码</p></div>
                </div>
                <p className="mt-4 text-xs leading-5 text-slate-500">平台持续故障、重复付款、错误发码或激活异常可联系支持核查；已激活并使用付费内容后，不因个人计划变化或未获录用自动退款。完整规则以交付与退款页面为准。</p>
              </div>

              <div className="space-y-3">
                {!hasOpenPurchaseRequest && (
                  <label className="flex items-start gap-2 text-xs leading-5 text-slate-600"><input type="checkbox" checked={acceptedPurchaseRules} onChange={(event) => { setAcceptedPurchaseRules(event.target.checked); setPurchaseRequestError('') }} className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600" /><span>我已确认 ¥199 / 180 天、AI 额度，并阅读<a href="/legal/purchase" target="_blank" rel="noreferrer" className="ml-1 font-semibold text-blue-700 underline">交付与退款规则</a></span></label>
                )}

                {activationReady ? (
                  <button type="button" onClick={openActivation} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"><KeyRound size={17} />输入收到的激活码</button>
                ) : (
                  <button type="button" onClick={handleManualPurchase} disabled={isRequestingPurchase || hasOpenPurchaseRequest || isLoadingPurchase} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">{isRequestingPurchase ? '正在提交...' : hasOpenPurchaseRequest ? '申请处理中' : isRegistered ? '申请开通完整训练' : '登录后申请开通'} <ArrowRight size={17} /></button>
                )}

                {!activationReady && <button type="button" onClick={openActivation} className="inline-flex min-h-11 w-full items-center justify-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-900"><KeyRound size={16} />我已经有激活码</button>}
              </div>
            </div>

            {visiblePurchaseRequest && purchaseStatus && (
              <div className={`mt-6 border-l-4 px-4 py-4 ${visiblePurchaseRequest.status === 'cancelled' ? 'border-slate-300 bg-slate-50' : 'border-emerald-500 bg-emerald-50'}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div><p className="text-xs font-semibold text-slate-600">订单编号 <span className="font-mono text-slate-900">{visiblePurchaseRequest.reference_code}</span></p><h3 className="mt-1 font-semibold text-slate-950">{purchaseStatus.label}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{purchaseStatus.description}</p></div>
                  <button type="button" onClick={() => loadPurchaseRequest()} disabled={isLoadingPurchase} className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-blue-700 disabled:opacity-50"><RefreshCcw size={14} className={isLoadingPurchase ? 'animate-spin' : ''} />刷新状态</button>
                </div>
                {visiblePurchaseRequest.status !== 'cancelled' && <div className="mt-4 grid grid-cols-3 gap-2">{purchaseSteps.map((step, index) => { const reached = index + 1 <= purchaseStatus.step; return <div key={step} className={`border-t-2 pt-2 text-xs font-medium ${reached ? 'border-emerald-600 text-emerald-800' : 'border-slate-200 text-slate-400'}`}>{index + 1}. {step}</div> })}</div>}
              </div>
            )}

            {purchaseRequestError && <div className="mt-4 border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950"><p>{purchaseRequestError}</p><button type="button" onClick={() => navigate('/support?category=payment&product=bar_server_pack')} className="mt-1 font-semibold underline underline-offset-2">前往支持中心</button></div>}

            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-200 pt-4 text-sm font-semibold text-blue-700">
              <button type="button" onClick={() => navigate('/support')} className="underline underline-offset-2"><MessageSquare size={15} className="mr-1 inline" />联系支持</button>
              <button type="button" onClick={() => navigate('/service-info')} className="underline underline-offset-2">服务与数据说明</button>
              <button type="button" onClick={() => navigate('/legal/terms')} className="underline underline-offset-2">用户协议</button>
              <button type="button" onClick={() => navigate('/legal/privacy')} className="underline underline-offset-2">隐私政策</button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
