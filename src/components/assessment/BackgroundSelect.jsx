import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SERVICE_BACKGROUNDS } from '../../data/assessmentData'

export default function BackgroundSelect({ onSelect }) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white px-6 pb-6 pt-12">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={() => navigate('/assessment')}
            className="mb-5 flex items-center gap-1 text-sm text-slate-500"
          >
            <ChevronLeft size={17} />
            返回测评介绍
          </button>
          <p className="mb-2 text-sm font-medium text-blue-700">第 1 步</p>
          <h1 className="text-2xl font-bold text-slate-950">选择经历背景</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            系统会根据你的经历背景调整服务场景题，让测评结果更接近真实岗位匹配。
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pt-6">
        <div className="space-y-3">
          {SERVICE_BACKGROUNDS.map((background) => (
            <button
              key={background.id}
              type="button"
              onClick={() => onSelect(background.id)}
              className="flex w-full items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
            >
              <span className="flex-1 text-sm font-semibold leading-relaxed text-slate-900">
                {background.label}
              </span>
              <ChevronRight size={18} className="text-slate-400" />
            </button>
          ))}
        </div>

        <p className="mt-6 rounded-lg bg-slate-100 p-4 text-sm leading-relaxed text-slate-600">
          没有相关经历也可以继续，结果会更偏向“从零准备路线”。
        </p>
      </main>
    </div>
  )
}
