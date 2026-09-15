import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, CircleAlert, LoaderCircle, LogIn } from 'lucide-react'
import { supabase } from '../supabase'
import { useAccessStore } from '../store/accessStore'

const getUrlError = () => {
  const search = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  return hash.get('error_description') || search.get('error_description') || ''
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const register = useAccessStore((state) => state.register)
  const ran = useRef(false)
  const [state, setState] = useState({ status: 'loading', message: '正在完成邮箱验证并登录...' })

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const finish = async () => {
      const urlError = getUrlError()
      if (urlError) {
        setState({ status: 'login', message: '这个链接已过期或已被使用。如果邮箱已验证，请直接用注册时的邮箱和密码登录。' })
        return
      }

      try {
        const search = new URLSearchParams(window.location.search)
        let { data: { session } } = await supabase.auth.getSession()
        const tokenHash = search.get('token_hash')
        const type = search.get('type') || 'email'
        const code = search.get('code')
        const flowId = search.get('sb_flow_id')

        // Token-hash links work even when an email app opens a different browser.
        if (!session && tokenHash) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          })
          if (error) throw error
          session = data.session
        }

        if (!session && code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(
            code,
            flowId ? { flowId } : undefined,
          )
          if (error) throw error
          session = data.session
        }

        if (!session?.user) {
          setState({ status: 'login', message: '邮箱已完成确认，但当前邮箱内置浏览器无法自动建立登录会话。请直接用注册时的邮箱和密码登录。' })
          return
        }

        register(session.user, session.user.user_metadata?.name || session.user.email?.split('@')[0])
        setState({ status: 'success', message: '邮箱已验证，正在进入 CrewPathGuide...' })
        window.setTimeout(() => navigate('/', { replace: true }), 900)
      } catch (error) {
        console.error('Email confirmation callback failed:', error)
        const message = error.message || ''
        const crossBrowserFailure = /code verifier|pkce|exchange|flow state/i.test(message)
        setState({
          status: crossBrowserFailure ? 'login' : 'error',
          message: crossBrowserFailure
            ? '邮箱可能已验证，但邮件在另一个浏览器中打开，无法继承注册会话。请直接登录，不要重复注册。'
            : '验证链接已失效或无法完成登录。可先尝试直接登录；如果提示邮箱未验证，再重新发送验证邮件。',
        })
      } finally {
        window.history.replaceState({}, document.title, '/auth/callback')
      }
    }

    finish()
  }, [navigate, register])

  const success = state.status === 'success'
  const failed = state.status === 'error'
  const needsLogin = state.status === 'login'
  const Icon = failed ? CircleAlert : success ? CheckCircle2 : needsLogin ? LogIn : LoaderCircle

  const continueToLogin = () => {
    navigate('/?auth=login', { replace: true })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <Icon size={34} className={`mx-auto ${failed ? 'text-rose-600' : success ? 'text-emerald-600' : needsLogin ? 'text-blue-600' : 'animate-spin text-blue-600'}`} />
        <h1 className="mt-4 text-xl font-semibold text-slate-950">{failed ? '验证链接无法使用' : success ? '验证成功' : needsLogin ? '请直接登录已有账号' : '正在处理验证'}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{state.message}</p>
        {(failed || needsLogin) && <button type="button" onClick={continueToLogin} className="mt-5 w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700">登录已验证账号</button>}
      </section>
    </main>
  )
}
