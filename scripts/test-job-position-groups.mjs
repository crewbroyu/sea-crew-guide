import assert from 'node:assert/strict'
import { JOB_DEPARTMENTS } from '../src/data/jobDepartments.js'
import {
  DEPARTMENT_TRAINING,
  classifyPosition,
  getPostingDepartments,
  groupPositionsByDepartment,
} from '../src/data/jobPositionGroups.js'

// The first real production posting (Royal Caribbean group, 2026-10-10) listed these 20 titles.
const royalCaribbeanPositions = [
  'Chef De Partie', 'Chef Tournant', 'Sous Chef', 'JR Sous Chef', 'Assistant Maitre D', 'Restaurant Hostess',
  'Entertainment Media & Content Operator', 'Activities Host', 'Cruise Director', 'IT Specialist', 'Laundry Manager',
  'Assistant Laundry Manager', 'Slot Technician', 'Chef De Partie 1', 'Front Desk Manager', 'Guest Services Officer',
  'Housekeeping Manager', 'Public Area Attendant', 'Light Technicians', 'Stage & Production Managers',
]

assert.deepEqual(groupPositionsByDepartment(royalCaribbeanPositions), [
  { department: '餐饮服务', positions: ['Assistant Maitre D', 'Restaurant Hostess'] },
  { department: '客房服务', positions: ['Laundry Manager', 'Assistant Laundry Manager', 'Housekeeping Manager', 'Public Area Attendant'] },
  { department: '前台/宾客服务', positions: ['Front Desk Manager', 'Guest Services Officer'] },
  { department: '娱乐/青少年', positions: ['Entertainment Media & Content Operator', 'Activities Host', 'Cruise Director', 'Light Technicians', 'Stage & Production Managers'] },
  { department: '厨房', positions: ['Chef De Partie', 'Chef Tournant', 'Sous Chef', 'JR Sous Chef', 'Chef De Partie 1'] },
  { department: '技术/甲板', positions: ['IT Specialist', 'Slot Technician'] },
])

// Earlier rules win where titles overlap.
const expectations = {
  'Bar Server': '酒吧服务',
  'Bar Utility': '酒吧服务',
  Bartender: '酒吧服务',
  'Kitchen Steward': '厨房',
  'Cabin Steward / Stewardess': '客房服务',
  'Spa Receptionist': '水疗/美容',
  'Retail Sales Associate': '免税店/零售',
  'Jewelry Specialist': '免税店/零售',
  'Restaurant Server': '餐饮服务',
  'Room Service Waiter': '餐饮服务',
  'Security Officer': '技术/甲板',
  'Hotel Director': '管理岗位',
  酒吧服务员: '酒吧服务',
  客房服务员: '客房服务',
  餐厅服务员: '餐饮服务',
  前台接待: '前台/宾客服务',
  儿童看护: '娱乐/青少年',
  厨房帮厨: '厨房',
  Photographer: '其他',
  '': '其他',
}
for (const [title, department] of Object.entries(expectations)) {
  assert.equal(classifyPosition(title), department, title)
}

// Duplicates collapse; every group is a known department.
const deduped = groupPositionsByDepartment(['Bar Server', 'Bar Server', 'Photographer'])
assert.deepEqual(deduped, [{ department: '酒吧服务', positions: ['Bar Server'] }, { department: '其他', positions: ['Photographer'] }])
for (const { department } of groupPositionsByDepartment(royalCaribbeanPositions)) assert.ok(JOB_DEPARTMENTS.includes(department))

// The card and filter use position-derived departments, falling back to saved tags.
assert.deepEqual(getPostingDepartments({ positions: ['Bar Server'], departments: ['水疗/美容'] }), ['酒吧服务'])
assert.deepEqual(getPostingDepartments({ positions: [], departments: ['水疗/美容'] }), ['水疗/美容'])

// Every training entry points at an existing route and position key.
for (const [department, training] of Object.entries(DEPARTMENT_TRAINING)) {
  assert.ok(JOB_DEPARTMENTS.includes(department), department)
  assert.match(training.to, /^\/(programs\/bar-server\/trial|academy\/interview-questions\?position=[a-z_]+)$/, department)
  if (training.to.includes('position=')) assert.ok(training.to.endsWith(`position=${training.positionKey}`), department)
}

console.log('job position groups: ok')
