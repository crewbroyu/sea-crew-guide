import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const metadata = [
  [/^\/$/, 'CrewPathGuide · 海乘求职路径与岗位训练', '从职业评估到岗位训练、面试和登船准备的海乘求职任务系统。'],
  [/^\/assessment/, '海乘职业适配评估 · CrewPathGuide', '根据英语、经历、岗位偏好和船上适应力生成职业方向建议。'],
  [/^\/tasks/, '登船路径 · CrewPathGuide', '按 12 个任务推进海乘求职、面试、Offer 与登船准备。'],
  [/^\/academy/, '海乘学院 · CrewPathGuide', '浏览邮轮岗位基础课、岗位英语、真实面试题库和场景训练。'],
  [/^\/programs\/bar-server\/foundation/, 'Bar Server 基础课 · CrewPathGuide', '9 天完成 Bar Server 酒水知识、服务英语与岗位基础训练。'],
  [/^\/programs\/retail\/foundation/, 'Retail Sales Associate 基础课 · CrewPathGuide', '学习邮轮零售接待、产品表达、销售、POS、库存与防损。'],
  [/^\/programs\/bar-server/, 'Bar Server 单职位全流程包 · CrewPathGuide', '从岗位知识到场景训练和 AI 模拟面试的 Bar Server 准备包。'],
  [/^\/programs\/retail/, 'Retail Sales Associate 岗位包 · CrewPathGuide', '邮轮免税店销售岗位基础课、场景训练和面试准备。'],
  [/^\/jobs/, '求职中心 · CrewPathGuide', '管理简历、面试准备、申请渠道、申请记录与 Offer。'],
  [/^\/premium/, 'Bar Server 岗位包权益 · CrewPathGuide', '查看 Bar Server 岗位包内容、有效期、AI 额度与人工开通方式。'],
  [/^\/legal\/terms/, '用户协议 · CrewPathGuide', 'CrewPathGuide 的账户、训练内容与服务使用规则。'],
  [/^\/legal\/privacy/, '隐私政策 · CrewPathGuide', '了解 CrewPathGuide 如何处理账户、学习与 AI 训练数据。'],
  [/^\/legal\/purchase/, '岗位包交付与退款规则 · CrewPathGuide', '了解岗位包价格、有效期、AI 额度、人工交付与异常处理规则。'],
]

export default function RouteMetadata() {
  const { pathname } = useLocation()

  useEffect(() => {
    const match = metadata.find(([pattern]) => pattern.test(pathname))
    const title = match?.[1] || 'CrewPathGuide'
    const description = match?.[2] || '海乘求职路径、岗位课程与面试训练工具。'
    document.title = title

    let descriptionTag = document.querySelector('meta[name="description"]')
    if (!descriptionTag) {
      descriptionTag = document.createElement('meta')
      descriptionTag.setAttribute('name', 'description')
      document.head.appendChild(descriptionTag)
    }
    descriptionTag.setAttribute('content', description)
  }, [pathname])

  return null
}
