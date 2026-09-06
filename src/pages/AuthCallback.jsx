import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, CircleAlert, LoaderCircle } from 'lucide-react'
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
        setState({ status: 'error', message: decodeURIComponent(urlError.replace(/\+/g, ' ')) })
        return
      }

      try {
        // The browser client handles implicit-token links automatically. PKCE links
        // still carry a one-time code which needs an explicit exchange here.
        let { data: { session } } = await supabase.auth.getSession()
        const code = new URLSearchParams(window.location.search).get('code')

        if (!session && code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
          session = data.session
        }

        if (!session?.user) {
          throw new Error('验证链接未能创建登录会话。请返回登录窗口，用已验证的邮箱和密码登录。')
        }

        register(session.user, session.user.user_metadata?.name || session.user.email?.split('@')[0])
        window.history.replaceState({}, document.title, '/auth/callback')
        setState({ status: 'success', message: '邮箱已验证，正在进入 CrewPathGuide...' })
        window.setTimeout(() => navigate('/', { replace: true }), 900)
      } catch (error) {
        console.error('Email confirmation callback failed:', error)
        setState({ status: 'error', message: error.message || '验证链接已失效或无法完成登录。请返回登录窗口重新发送验证邮件。' })
      }
    }

    finish()
  }, [navigate, register])

  const success = state.status === 'success'
  const failed = state.status === 'error'
  const Icon = failed ? CircleAlert : success ? CheckCircle2 : LoaderCircle

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <Icon size={34} className={`mx-auto ${failed ? 'text-rose-600' : success ? 'text-emerald-600' : 'animate-spin text-blue-600'}`} />
        <h1 className="mt-4 text-xl font-semibold text-slate-950">{failed ? '邮箱验证未完成' : success ? '验证成功' : '正在处理验证'}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{state.message}</p>
        {failed && <button type="button" onClick={() => navigate('/', { replace: true })} className="mt-5 w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700">返回网站重新登录</button>}
      </section>
    </main>
  )
}
