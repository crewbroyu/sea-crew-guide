import { createElement } from 'react'
import {
  Anchor,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Languages,
  Route,
  Target,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DIMENSIONS } from '../../data/assessmentData'

const dimensionIcons = {
  ClipboardCheck,
  Languages,
  Briefcase,
  Target,
  Anchor,
  Route,
}

export default function WelcomePage({ onStart }) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white px-6 pb-8 pt-12">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mb-5 flex items-center gap-1 text-sm text-slate-500"
          >
            <ChevronLeft size={17} />
            返回首页
          </button>

          <p className="mb-2 text-sm font-medium text-blue-700">职业适配测评</p>
          <h1 className="text-3xl font-bold leading-tight text-slate-950">
            判断你适合哪些海乘岗位
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            通过 6 个维度选择题和限时录音实战，评估基础条件、英语、服务经历、岗位偏好、船上适应力和求职准备度。
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onStart}
              className="flex items-center justify-between rounded-lg bg-blue-600 px-5 py-4 text-left text-white shadow-sm transition hover:bg-blue-700"
            >
              <span>
                <span className="block font-semibold">开始职业测评</span>
                <span className="mt-1 block text-sm text-blue-100">约 15 分钟，需要麦克风</span>
              </span>
              <ChevronRight size={22} />
            </button>

            <button
              type="button"
              onClick={() => navigate('/academy/wiki')}
              className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4 text-left transition hover:bg-white"
            >
              <p className="font-semibold text-slate-900">先了解海乘真实情况</p>
              <p className="mt-1 text-sm text-slate-500">工资、合同、岗位和常见误区</p>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pt-6">
        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-bold text-slate-950">评估维度</h2>
          <div className="grid grid-cols-2 gap-3">
            {DIMENSIONS.map((dimension) => {
              const icon = dimensionIcons[dimension.icon] || ClipboardCheck

              return (
                <div key={dimension.id} className="rounded-lg bg-slate-50 p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white text-blue-700">
                    {createElement(icon, { size: 20 })}
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{dimension.name}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{dimension.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 font-bold text-slate-950">填写建议</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            情境题请选你在压力下最可能实际采取的做法，不要选择“听起来最专业”的句子。岗位偏好没有标准答案，系统会根据多次取舍的一致性判断方向是否清晰。
          </p>
        </section>
      </main>
    </div>
  )
}
