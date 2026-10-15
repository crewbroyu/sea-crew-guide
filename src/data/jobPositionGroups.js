import { JOB_DEPARTMENTS } from './jobDepartments.js'

// Postings store positions as a flat list of titles copied from the article. These rules sort
// them into department groups for display. Order matters: the first matching rule wins, so
// "Bar Server" lands in bar service and "Laundry Manager" in housekeeping, not management.
const DEPARTMENT_RULES = [
  ['酒吧服务', /\bbar\b|bartender|sommelier|\bwine\b|beverage|mixolog|酒吧|调酒|酒水/i],
  ['厨房', /chef|\bcook|galley|kitchen|pastry|baker|butcher|commis|厨|面点|烘焙/i],
  ['免税店/零售', /retail|\bshop|boutique|sales associate|jewel|gallery|art auction|免税|零售|销售/i],
  ['水疗/美容', /\bspa\b|massage|therapist|beauty|\bhair|\bnail|fitness|salon|水疗|美容|美发|美甲|健身|按摩/i],
  ['前台/宾客服务', /front desk|front office|guest service|reception|concierge|purser|shore excursion|前台|接待|礼宾/i],
  ['客房服务', /housekeep|stateroom|cabin|laundry|public area|butler|room attendant|客房|洗衣|管家|公共区域/i],
  ['餐饮服务', /waiter|waitress|maitre|hostess|restaurant|dining|buffet|server|food|餐厅|餐饮|服务员|领位/i],
  ['娱乐/青少年', /entertain|activit|cruise director|youth|\bkids?\b|\bdj\b|stage|production|light|sound|perform|娱乐|活动|青少年|儿童|演出|舞台|灯光|音响/i],
  ['技术/甲板', /\bit\b|technician|engineer|electric|\bdeck\b|sailor|seaman|mechanic|\bslot|security|plumb|fitter|技术|甲板|工程|电工|水手|保安/i],
  ['管理岗位', /manager|director|supervisor|officer|经理|主管|总监/i],
]

export const classifyPosition = (title = '') => DEPARTMENT_RULES.find(([, pattern]) => pattern.test(title))?.[0] || '其他'

// Returns [{ department, positions }] in the canonical department order, positions deduplicated.
export const groupPositionsByDepartment = (positions = []) => {
  const groups = new Map()
  for (const title of new Set(positions)) {
    const department = classifyPosition(title)
    groups.set(department, [...(groups.get(department) || []), title])
  }
  return JOB_DEPARTMENTS.filter((department) => groups.has(department))
    .map((department) => ({ department, positions: groups.get(department) }))
}

// One preparation entry per department that has training on the site. Bar service goes to the
// free scenario trial (the start of the Bar Server pack funnel); the others open the matching
// interview question bank, which links on to the foundation course or pack where one exists.
// Entertainment has no entry: the youth staff bank does not fit cruise directors or stage crew.
export const DEPARTMENT_TRAINING = {
  '酒吧服务': { positionKey: 'bar_server', label: '免费体验岗位场景', to: '/programs/bar-server/trial', productCode: 'bar_server_pack' },
  '免税店/零售': { positionKey: 'retail', label: '练面试题', to: '/academy/interview-questions?position=retail', productCode: 'retail_sales_pack' },
  '餐饮服务': { positionKey: 'restaurant', label: '练面试题', to: '/academy/interview-questions?position=restaurant' },
  '客房服务': { positionKey: 'housekeeping', label: '练面试题', to: '/academy/interview-questions?position=housekeeping' },
  '前台/宾客服务': { positionKey: 'front_office', label: '练面试题', to: '/academy/interview-questions?position=front_office' },
  '厨房': { positionKey: 'kitchen', label: '练面试题', to: '/academy/interview-questions?position=kitchen' },
}

export const getDepartmentTraining = (department) => DEPARTMENT_TRAINING[department] || null

// Departments shown for a posting: derived from its positions when it lists any, otherwise the
// tags saved by the admin. Used by both the card and the department filter so they agree.
export const getPostingDepartments = (posting) => {
  const groups = groupPositionsByDepartment(posting.positions)
  return groups.length > 0 ? groups.map((group) => group.department) : posting.departments
}
