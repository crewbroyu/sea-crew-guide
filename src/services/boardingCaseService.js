import { supabase } from '../supabase'

const getLocalKey = (userId) => `boarding_case_${userId}`

export const DOCUMENT_STATUS_OPTIONS = [
  { value: 'not_started', label: '未开始' },
  { value: 'in_progress', label: '办理中' },
  { value: 'ready', label: '已备妥' },
  { value: 'not_required', label: '公司确认无需' },
  { value: 'expired', label: '已过期' },
]

export const VISA_STATUS_OPTIONS = [
  { value: 'not_started', label: '尚未开始' },
  { value: 'loe_waiting', label: '等待 LOE' },
  { value: 'ds160_submitted', label: 'DS-160 已提交' },
  { value: 'fee_paid', label: '签证费已支付' },
  { value: 'appointment_booked', label: '面谈已预约' },
  { value: 'interview_completed', label: '面谈已完成' },
  { value: 'administrative_processing', label: '行政审查中' },
  { value: 'issued', label: '已签发' },
  { value: 'refused', label: '未获签发' },
]

export const createDefaultDocumentItems = () => [
  { id: 'passport', name: '护照', description: '确认有效期覆盖合同和返程安排', status: 'not_started', expiry_date: '', notes: '' },
  { id: 'seafarer_book', name: '海员证 / 船员服务簿', description: '以船公司和派遣机构要求为准', status: 'not_started', expiry_date: '', notes: '' },
  { id: 'medical', name: '船员体检或公司指定体检', description: '确认体检机构、项目和有效期', status: 'not_started', expiry_date: '', notes: '' },
  { id: 'safety_training', name: '基础安全培训及证书', description: '确认岗位、旗国和船公司的具体要求', status: 'not_started', expiry_date: '', notes: '' },
  { id: 'police_clearance', name: '无犯罪记录证明', description: '仅在公司或办理流程要求时准备', status: 'not_started', expiry_date: '', notes: '' },
  { id: 'company_forms', name: '公司入职文件', description: '合同、LOE、上船通知及公司表格', status: 'not_started', expiry_date: '', notes: '' },
]

export const createDefaultTravelItems = () => [
  { id: 'carry_on_documents', category: '随身文件', name: '关键证件原件与离线备份已放入随身行李', critical: true, completed: false },
  { id: 'ticket', category: '行程', name: '机票或交通行程已确认', critical: true, completed: false },
  { id: 'hotel', category: '行程', name: '必要的酒店或中转安排已确认', critical: false, completed: false },
  { id: 'port_route', category: '行程', name: '抵达港口、集合点和报到时间已确认', critical: true, completed: false },
  { id: 'emergency_contacts', category: '联络', name: '公司、代理和紧急联系人已离线保存', critical: true, completed: false },
  { id: 'banking', category: '资金与通讯', name: '银行卡、少量备用资金和支付方式已确认', critical: true, completed: false },
  { id: 'connectivity', category: '资金与通讯', name: '漫游、eSIM 或抵达后的通讯方案已准备', critical: false, completed: false },
  { id: 'role_luggage', category: '行李', name: '工服、鞋履和岗位所需物品已核对', critical: true, completed: false },
  { id: 'medicine', category: '行李', name: '个人常用药及处方说明已准备', critical: false, completed: false },
]

export const createDefaultBoardingCase = () => ({
  cruise_company: '',
  final_position: '',
  offer_status: 'received',
  salary_amount: '',
  salary_currency: 'USD',
  salary_notes: '',
  contract_start: '',
  contract_end: '',
  embarkation_date: '',
  embarkation_port: '',
  departure_city: '',
  application_channel: '',
  agency_fee: '',
  offer_confirmed: false,
  offer_checks: {
    salary: false,
    contract: false,
    fees: false,
    joining: false,
  },
  document_items: createDefaultDocumentItems(),
  us_visa_requirement: 'unknown',
  visa_status: 'not_started',
  visa_reason: '',
  visa_appointment_at: '',
  visa_consulate: '',
  visa_expiry_date: '',
  visa_notes: '',
  travel_items: createDefaultTravelItems(),
  overall_readiness: 'not_ready',
  boarded_at: null,
})

const allowedFields = Object.keys(createDefaultBoardingCase())

const readLocalCase = (userId) => {
  try {
    const raw = localStorage.getItem(getLocalKey(userId))
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    console.warn('Unable to read local boarding case:', error)
    return null
  }
}

const normalizeCase = (value = {}) => {
  const defaults = createDefaultBoardingCase()
  const normalized = {
    ...defaults,
    ...value,
    offer_checks: { ...defaults.offer_checks, ...(value.offer_checks || {}) },
    document_items: Array.isArray(value.document_items) && value.document_items.length
      ? value.document_items
      : defaults.document_items,
    travel_items: Array.isArray(value.travel_items) && value.travel_items.length
      ? value.travel_items
      : defaults.travel_items,
  }

  Object.entries(defaults).forEach(([key, defaultValue]) => {
    if (defaultValue === '' && normalized[key] == null) normalized[key] = ''
  })

  if (normalized.visa_appointment_at?.includes('Z') || normalized.visa_appointment_at?.includes('+')) {
    const appointment = new Date(normalized.visa_appointment_at)
    if (!Number.isNaN(appointment.getTime())) {
      const offset = appointment.getTimezoneOffset() * 60000
      normalized.visa_appointment_at = new Date(appointment.getTime() - offset).toISOString().slice(0, 16)
    }
  }

  return normalized
}

const writeLocalCase = (value, userId) => {
  const normalized = normalizeCase(value)
  const localValue = Object.fromEntries(
    Object.entries(normalized).filter(([key]) => allowedFields.includes(key)),
  )
  localStorage.setItem(getLocalKey(userId), JSON.stringify(localValue))
  return localValue
}

const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user?.id) {
    const authError = new Error('请先登录后管理登船准备。')
    authError.code = 'LOGIN_REQUIRED'
    throw authError
  }
  return user
}

const canUseLocalFallback = (error) => (
  ['42P01', '42501', 'PGRST205'].includes(error?.code)
  || /boarding_cases|permission denied|schema cache/i.test(error?.message || '')
)

export const loadBoardingCase = async () => {
  const user = await getCurrentUser()
  const localCase = normalizeCase(readLocalCase(user.id) || {})
  const { data, error } = await supabase
    .from('boarding_cases')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    if (!canUseLocalFallback(error)) throw error
    console.warn('Boarding case table is not ready; using local data.', error)
    return { ...localCase, _syncState: 'local' }
  }

  if (!data) return { ...localCase, _syncState: 'empty' }

  const normalized = normalizeCase(data)
  writeLocalCase(normalized, user.id)
  return { ...normalized, _syncState: 'synced' }
}

export const saveBoardingCase = async (value) => {
  const user = await getCurrentUser()
  const localValue = writeLocalCase(value, user.id)
  const payload = Object.fromEntries(
    Object.entries(localValue).filter(([key]) => allowedFields.includes(key)),
  )

  const nullableFields = [
    'salary_amount', 'agency_fee', 'contract_start', 'contract_end', 'embarkation_date',
    'visa_appointment_at', 'visa_expiry_date',
  ]
  nullableFields.forEach((key) => {
    if (payload[key] === '') payload[key] = null
  })

  const { data, error } = await supabase
    .from('boarding_cases')
    .upsert({
      ...payload,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) {
    if (!canUseLocalFallback(error)) throw error
    console.warn('Boarding case table is not ready; changes are saved locally.', error)
    return { ...normalizeCase(localValue), _syncState: 'local' }
  }

  const normalized = normalizeCase(data)
  writeLocalCase(normalized, user.id)
  return { ...normalized, _syncState: 'synced' }
}
