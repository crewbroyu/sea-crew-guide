import { ArrowLeft, Bot, CreditCard, Database, ShieldCheck } from 'lucide-react'
import { createElement } from 'react'
import { useNavigate } from 'react-router-dom'

const sections = [
  {
    title: '产品边界',
    icon: ShieldCheck,
    items: [
      'CrewPathGuide 提供海乘职业认知、岗位准备和训练工具，不是邮轮公司、招聘代理或签证机构。',
      '测评、AI 反馈和准备度分数用于辅助判断，不承诺录用、签证获批、收入或登船结果。',
      '岗位要求、招聘流程、菜单、证件和签证信息可能变化；正式申请请以船公司、使领馆和服务机构的最新官方要求为准。',
    ],
  },
  {
    title: 'AI 训练与数据',
    icon: Bot,
    items: [
      '语音回答仅用于转写和生成训练反馈；页面不会把原始录音作为长期个人档案保存。',
      '确认后的文字回答、练习记录、评分、目标岗位和路径进度会保存到你的账户，用于跨设备恢复和后续训练建议。',
      '生成 AI 反馈时，相关训练内容会发送给配置的 AI 服务商处理。请不要在回答、支持留言或训练记录中填写密码、银行卡号、身份证号等敏感信息。',
    ],
  },
  {
    title: '权益与人工开通',
    icon: CreditCard,
    items: [
      'Bar Server 单职位全流程包的正式参考价为 ¥199 / 180 天；测试期通过人工确认和激活码开通，页面不会自动扣款。',
      '标准岗位包包含 360 次语音转写、120 次 AI 反馈和 10 次完整模拟面试；以账户权益页面显示的实际额度为准。',
      '付款前请先确认产品、有效期、AI 额度和收款信息；激活码仅限对应账户使用。',
      '遇到登录、权益、付款或训练问题，可在支持中心提交记录，或使用注册邮箱联系人工支持。',
    ],
  },
  {
    title: '你的控制权',
    icon: Database,
    items: [
      '你可以在真实面试记录中自行编辑或删除个人记录。',
      '如需查询、更正或删除账户相关数据，请用注册邮箱联系 support，并说明需要处理的页面或记录类型。',
      '反馈会用于改善产品，但不会公开你的姓名、联系方式、具体申请信息或原始训练内容。',
    ],
  },
]

export default function ServiceInfo() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-5 pb-7 pt-12">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            <ArrowLeft size={16} />返回
          </button>
          <p className="text-sm font-medium text-blue-700">CrewPathGuide</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">服务与数据说明</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">在注册、训练或开通权益前，先把产品能做什么、会保存什么说清楚。</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-5 py-6">
        {sections.map(({ title, icon, items }) => (
          <section key={title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">{createElement(icon, { size: 18 })}</div>
              <h2 className="font-semibold text-slate-950">{title}</h2>
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              {items.map((item) => <li key={item} className="flex gap-2"><span className="text-blue-600">•</span><span>{item}</span></li>)}
            </ul>
          </section>
        ))}

        <p className="px-1 text-xs leading-5 text-slate-500">版本：测试期 1.0 · 更新于 2026-09-13</p>
      </main>
    </div>
  )
}
