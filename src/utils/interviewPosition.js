import { positionConfig } from '../data/interviewQuestions'

const positionAliases = {
  'Retail Sales': 'retail',
  'Retail Sales Associate': 'retail',
  'Jewelry Specialist': 'retail',
  'Art Gallery Staff': 'retail',
  'Spa Therapist': 'retail',
  retail_sales: 'retail',
  retail: 'retail',
  '免税店销售': 'retail',
  'Restaurant Server': 'restaurant',
  'Restaurant Assistant': 'restaurant',
  'Waiter / Waitress': 'restaurant',
  restaurant_server: 'restaurant',
  restaurant: 'restaurant',
  '餐厅服务员': 'restaurant',
  'Bar Server': 'bar_server',
  Bartender: 'bar_server',
  bar: 'bar_server',
  'bar-server': 'bar_server',
  bar_server: 'bar_server',
  '酒吧服务员': 'bar_server',
  'Front Office': 'front_office',
  'Guest Service Associate': 'front_office',
  Receptionist: 'front_office',
  Concierge: 'front_office',
  'Shore Excursion Coordinator': 'front_office',
  front_office: 'front_office',
  '前台接待': 'front_office',
  Housekeeping: 'housekeeping',
  'Cabin Steward / Stewardess': 'housekeeping',
  housekeeping: 'housekeeping',
  '客房服务员': 'housekeeping',
  'Youth Staff': 'youth_staff',
  'Activity Staff': 'youth_staff',
  youth_staff: 'youth_staff',
  '儿童看护': 'youth_staff',
  'Kitchen Steward': 'kitchen',
  kitchen: 'kitchen',
  galley: 'kitchen',
  '厨房帮厨': 'kitchen',
  Utility: 'utility',
  Cleaner: 'utility',
  'Galley / Utility': 'utility',
  'Bar Utility': 'utility',
  utility: 'utility',
  cleaner: 'utility',
  '后勤清洁': 'utility',
}

export const normalizeInterviewPosition = (value, fallback = '') =>
  positionAliases[value] || value || fallback

export const getInterviewPositionMeta = (value) => {
  const key = normalizeInterviewPosition(value)
  return positionConfig.find((item) => item.key === key) || null
}
