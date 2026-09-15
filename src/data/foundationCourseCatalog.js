import { barServerFoundationDays } from './barServerFoundation'
import { retailFoundationDays } from './retailFoundation'

export const FOUNDATION_COURSES = {
  'bar-server': {
    slug: 'bar-server',
    jobKey: 'bar_server',
    roleKey: 'barServer',
    productCode: 'bar_server_pack',
    label: 'BAR SERVER',
    title: 'Bar Server 岗位基础课',
    description: '从酒水、杯具和卫生开始，练到能在真实邮轮酒吧班次中开口服务。',
    freeDayCount: 1,
    days: barServerFoundationDays,
    packRoute: '/programs/bar-server',
    simulatorRoute: '/programs/bar-server/training',
    task6Route: '/tasks/phase2/Task6?source=task5',
  },
  retail: {
    slug: 'retail',
    jobKey: 'retail',
    roleKey: 'retail',
    productCode: 'retail_sales_pack',
    label: 'RETAIL SALES ASSOCIATE',
    title: 'Retail Sales Associate 岗位基础课',
    description: '从接近客人、需求发现和产品讲解，练到 KPI、异议、POS、防损与服务补救。',
    freeDayCount: 1,
    days: retailFoundationDays,
    packRoute: '/programs/retail',
    simulatorRoute: '/programs/retail/training',
    task6Route: '/tasks/phase2/Task6?source=task5',
  },
}

export const getFoundationCourse = (slug) => FOUNDATION_COURSES[slug] || null
