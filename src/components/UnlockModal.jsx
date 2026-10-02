import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, KeyRound, LoaderCircle, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAccessStore } from '../store/accessStore'
import { activationService, hasProductEntitlement } from '../services/activationService'
import { consumeActivationReturnRoute } from '../data/purchaseFlow'

export default function UnlockModal() {
  const navigate = useNavigate()
  const {
    showUnlockModal,
    closeUnlockModal,
    setAccessStatus,
    openRegisterModal,
  } = useAccessStore()
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const successTimerRef = useRef(null)

  useEffect(() => () => {
    if (successTimerRef.current) window.clearTimeout(successTimerRef.current)
  }, [])

  const resetModal = () => {
    setCode('')
    setError('')
    setShowSuccess(false)
    setIsLoading(false)
  }

  const handleClose = () => {
    if (showSuccess) return
    consumeActivationReturnRoute()
    resetModal()
    closeUnlockModal()
  }

  const handleActivate = async () => {
    if (!code.trim()) {
      setError('请输入激活码。')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const user = await activationService.getCurrentUser()
      const result = await activationService.activateCode(code)
      const access = await activationService.getUserAccessStatus(user)

      if (!access.isUnlocked && !hasProductEntitlement(access, result.productCode)) {
        throw new Error('Activation saved but access verification failed')
      }

      setShowSuccess(true)
      successTimerRef.current = window.setTimeout(() => {
        const returnRoute = consumeActivationReturnRoute()
        setAccessStatus({ ...access, unlockedAt: access.unlockedAt || result.unlockedAt, checked: true })
        closeUnlockModal()
        resetModal()
        if (returnRoute) navigate(returnRoute, { replace: true })
      }, 900)
    } catch (activationError) {
      const errorMessage = activationError.message || ''
      console.error('激活失败:', errorMessage)

      if (errorMessage.includes('Invalid code')) {
        setError('激活码无效，请检查字母、数字和连接符。')
      } else if (errorMessage.includes('Code already used')) {
        setError('该激活码已经使用，不能绑定第二个账户。')
      } else if (errorMessage.includes('Login required')) {
        closeUnlockModal()
        resetModal()
        openRegisterModal()
      } else if (errorMessage.includes('access verification failed')) {
        setError('激活记录已保存，但权益核验失败，请联系支持处理。')
      } else {
        setError('激活暂时失败，请稍后重试。若款项已确认，请联系支持并提供订单编号。')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!showUnlockModal) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <button type="button" aria-label="关闭激活窗口" className="absolute inset-0 bg-black/50" onClick={handleClose} />

      <section role="dialog" aria-modal="true" aria-labelledby="activation-title" className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-2xl sm:p-8">
        {showSuccess ? (
          <div className="py-7 text-center">
            <CheckCircle2 size={48} className="mx-auto text-emerald-600" />
            <h2 id="activation-title" className="mt-4 text-xl font-semibold text-slate-950">激活成功</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">岗位包已绑定当前账户，正在进入你的训练。</p>
          </div>
        ) : (
          <>
            <button type="button" onClick={handleClose} aria-label="关闭" className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center text-slate-400 transition hover:text-slate-700"><X size={21} /></button>

            <div className="pr-8">
              <KeyRound size={26} className="text-blue-700" />
              <p className="mt-4 text-xs font-semibold text-blue-700">已有激活码</p>
              <h2 id="activation-title" className="mt-1 text-xl font-semibold text-slate-950">激活完整训练权益</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">这里只用于输入已经收到的激活码。每个码只能绑定一个已登录账户。</p>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="activation-code" className="text-sm font-medium text-slate-800">激活码</label>
                <input id="activation-code" type="text" value={code} autoCapitalize="characters" autoComplete="off" onChange={(event) => { setCode(event.target.value.toUpperCase()); setError('') }} placeholder="例如 CREW-ABC123" className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 font-mono text-sm uppercase outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" onKeyDown={(event) => event.key === 'Enter' && !isLoading && handleActivate()} />
              </div>

              {error && <div className="border-l-4 border-red-400 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">{error}</div>}

              <button type="button" onClick={handleActivate} disabled={isLoading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                {isLoading ? <><LoaderCircle size={17} className="animate-spin" />正在核验...</> : <>确认激活 <KeyRound size={17} /></>}
              </button>

              <p className="text-center text-xs leading-5 text-slate-500">还没有激活码？请先关闭窗口，在岗位包页面提交开通申请。页面不会自动扣款。</p>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
