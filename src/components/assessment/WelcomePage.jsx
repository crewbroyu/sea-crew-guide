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
            通过 6 个维度评估基础条件、英语、服务经历、岗位偏好、船上适应力和求职准备度，生成岗位建议和下一步准备重点。
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onStart}
              className="flex items-center justify-between rounded-lg bg-blue-600 px-5 py-4 text-left text-white shadow-sm transition hover:bg-blue-700"
            >
              <span>
                <span className="block font-semibold">开始职业测评</span>
                <span className="mt-1 block text-sm text-blue-100">约 5-8 分钟，完成后生成报告</span>
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
            这不是性格小游戏，也没有唯一正确答案。请按你目前的真实经验、英语状态、求职准备和工作偏好选择，结果才更适合后续职业路线和找搭子匹配。
          </p>
        </section>
      </main>
    </div>
  )
}
