import { ArrowLeft, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-slate-50 px-5 py-16">
      <section className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-blue-700">404 · 页面不存在</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">这个链接暂时无法访问</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          页面可能已调整、链接不完整，或相关课程仍在制作中。你可以返回首页或进入登船路径继续当前任务。
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Home size={17} />返回首页
          </button>
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft size={17} />查看登船路径
          </button>
        </div>
      </section>
    </main>
  )
}
