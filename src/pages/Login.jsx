import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Ship, Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    if (!email || !password) {
      setError('请填写邮箱和密码')
      return
    }

    if (password.length < 6) {
      setError('密码至少6位')
      return
    }

    setLoading(true)

    try {
      if (isRegister) {
        // 注册
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (signUpError) {
          setError(signUpError.message)
          setLoading(false)
          return
        }

        // 创建 profile
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            nickname: email.split('@')[0],
            level: 1,
            xp: 0,
            current_task: 1,
          })

          // 初始化第一个任务
          const { data: firstTask } = await supabase
            .from('tasks')
            .select('id')
            .eq('stage', 1)
            .eq('sort_order', 1)
            .single()

          if (firstTask) {
            await supabase.from('user_tasks').upsert({
              user_id: data.user.id,
              task_id: firstTask.id,
              status: 'active',
            }, { onConflict: 'user_id,task_id' })
          }
        }

        // Supabase 默认可能需要邮箱确认
        if (data.session) {
          // 直接登录成功，不需要确认
          setSuccess('注册成功！')
        } else {
          setSuccess('注册成功！请检查邮箱确认后登录（也可能直接跳转）')
        }
      } else {
        // 登录
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          setError(signInError.message)
          setLoading(false)
          return
        }
      }
    } catch (err) {
      setError('网络错误，请重试')
      console.error(err)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-900 flex flex-col">
      {/* 顶部 Logo */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4">
          <Ship size={40} className="text-white" />
        </div>
        <h1 className="text-white text-2xl font-bold">海乘求职通</h1>
        <p className="text-blue-200 text-sm mt-2">你的海乘求职AI助手</p>
      </div>

      {/* 登录表单 */}
      <div className="bg-white rounded-t-3xl px-8 pt-8 pb-12">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          {isRegister ? '注册账号' : '登录'}
        </h2>

        {/* 邮箱输入 */}
        <div className="relative mb-4">
          <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="请输入邮箱"
            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 密码输入 */}
        <div className="relative mb-4">
          <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type={showPwd ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码（至少6位）"
            className="w-full pl-12 pr-12 py-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowPwd(!showPwd)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
          >
            {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <p className="text-red-500 text-xs mb-3 bg-red-50 p-2 rounded-lg">{error}</p>
        )}

        {/* 成功提示 */}
        {success && (
          <p className="text-green-600 text-xs mb-3 bg-green-50 p-2 rounded-lg">{success}</p>
        )}

        {/* 提交按钮 */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-medium active:scale-[0.98] transition disabled:opacity-50"
        >
          {loading ? '处理中...' : isRegister ? '注册' : '登录'}
        </button>

        {/* 切换登录/注册 */}
        <div className="text-center mt-4">
          <button
            onClick={() => {
              setIsRegister(!isRegister)
              setError('')
              setSuccess('')
            }}
            className="text-blue-600 text-sm"
          >
            {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
          </button>
        </div>
      </div>
    </div>
  )
}