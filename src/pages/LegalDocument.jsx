import { ArrowLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

const documents = {
  terms: {
    eyebrow: '使用规则',
    title: 'CrewPathGuide 用户协议',
    intro: '使用 CrewPathGuide 前，请了解账户、内容与训练功能的基本边界。',
    sections: [
      ['服务性质', ['CrewPathGuide 提供海乘职业认知、任务推进、岗位课程与 AI 训练工具，不是邮轮公司、招聘代理、签证机构或录用担保方。', '测评、评分和 AI 建议用于辅助学习与决策，不承诺录用、收入、签证获批或登船结果。']],
      ['账户与使用', ['请使用本人可正常收信的邮箱注册并妥善保管密码。激活码和岗位包权益仅供对应账户本人使用。', '不得通过自动化请求、共享账号、篡改客户端或其他方式绕过付费、额度、访问和安全限制。']],
      ['内容与训练', ['岗位要求、招聘渠道、船公司政策和证件信息可能变化，正式申请前应以相关机构最新官方信息为准。', '用户提交的经历和回答应真实，不应包含密码、银行卡号、完整证件号码等敏感信息。']],
      ['暂停与变更', ['为维护安全、修复故障或应对第三方服务变化，平台可能调整功能、模型、额度规则或暂时中断服务，并尽量提前说明重要变化。', '发现滥用、欺诈、攻击或严重违反规则时，平台可限制相关账户或请求。']],
    ],
  },
  privacy: {
    eyebrow: '数据说明',
    title: 'CrewPathGuide 隐私政策',
    intro: '这里说明平台会处理哪些数据、为什么处理，以及你可以如何联系处理。',
    sections: [
      ['收集的数据', ['账户数据包括注册邮箱、昵称、验证与登录状态。学习数据包括目标岗位、任务进度、答案文字、评分、训练历史、申请与面试记录。', 'AI 运维日志只记录动作、耗时、错误码、录音秒数和成本估算，不保存原始录音或完整回答正文。']],
      ['使用目的', ['数据用于恢复跨设备进度、生成个性化训练建议、核对权益、处理支持请求、发现故障与控制 AI 成本。', '生成 AI 反馈时，必要的题目和回答内容会发送给配置的 AI 服务商处理。']],
      ['保存与保护', ['原始语音主要用于当次转写，不作为长期个人档案保存；确认后的文字及训练结果可能保存到账号。', '平台通过账户权限、数据库行级安全和服务端接口限制访问，但任何网络服务都不能承诺绝对零风险。']],
      ['你的权利', ['你可以在相关页面查看、修改或删除部分记录。如需查询、更正或删除账户数据，请通过支持中心或注册邮箱联系人工支持。', '处理请求前可能需要核对账号所有权；依法或为安全审计必须保留的数据可能无法立即删除。']],
    ],
  },
  purchase: {
    eyebrow: '购买说明',
    title: '岗位包交付与退款规则',
    intro: '当前采用人工收款与激活码交付。付款前请逐项确认商品和权益。',
    sections: [
      ['商品与交付', ['Bar Server 单职位全流程包参考价为 ¥199，有效期 180 天；包含 360 次语音转写、120 次 AI 反馈和 10 次完整 AI 模拟面试，以购买页和账户实际权益为准。', '提交购买申请不会自动扣款。人工核对到账后，激活码会通过约定方式发放；输入成功后权益绑定当前账户。']],
      ['购买前确认', ['请先使用公开内容和免费体验确认课程形式、设备麦克风、浏览器与网络是否适合。', '购买的是学习内容与训练工具使用权，不是陪跑服务、岗位推荐、招聘名额或录用保证。真人咨询等服务如有提供，会单独说明和收费。']],
      ['异常与退款', ['如重复付款、错误发码、激活码无法使用或平台原因导致核心付费功能持续不可用，请保留订单编号和付款凭证并尽快联系支持。', '已成功激活且已使用付费课程或 AI 额度的订单，不支持因个人计划变化、未获录用或学习效果未达主观预期而自动退款。具体争议将结合实际交付、使用记录和适用法律处理。']],
      ['联系方式', ['购买、交付或退款问题请通过支持中心提交，并附注册邮箱、订单编号和必要截图。不要发送密码、完整银行卡号或完整证件信息。']],
    ],
  },
}

export default function LegalDocument() {
  const navigate = useNavigate()
  const { document } = useParams()
  const content = documents[document]

  if (!content) return null

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-5 pb-7 pt-12">
          <button type="button" onClick={() => navigate('/')} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700"><ArrowLeft size={16} />返回首页</button>
          <p className="text-sm font-semibold text-blue-700">{content.eyebrow}</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">{content.title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{content.intro}</p>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-4 px-5 py-6">
        {content.sections.map(([title, paragraphs]) => (
          <section key={title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-950">{title}</h2>
            <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
              {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </section>
        ))}
        <p className="px-1 text-xs leading-5 text-slate-500">版本：1.0 · 更新于 2026-09-15。正式商业运营前应由熟悉实际运营地区的专业人士复核。</p>
      </main>
    </div>
  )
}
