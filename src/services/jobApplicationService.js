import { supabase } from '../supabase'

const LOCAL_KEY = 'job_applications'
const VALID_STATUSES = new Set(['未完成', '已申请', '等待回复', '面试中', 'Offer', '拒信'])

const normalizeStatus = (value) => (VALID_STATUSES.has(value) ? value : '未完成')

const readLocalApplications = () => {
  try {
    const records = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')
    return Array.isArray(records) ? records : []
  } catch {
    return []
  }
}

const writeLocalApplications = (records) => {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(records))
}

const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

const toClientRecord = (record) => ({
  id: record.id,
  companyName: record.company_name,
  jobTitle: record.job_title,
  companyUrl: record.company_url,
  notes: record.notes || '',
  status: normalizeStatus(record.status),
  sourceType: record.source_type,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
})

const toDatabaseRecord = (record, userId, { legacyLocalId = null } = {}) => ({
  user_id: userId,
  company_name: record.companyName?.trim() || '未填写公司',
  job_title: record.jobTitle?.trim() || '未填写岗位',
  company_url: record.companyUrl || null,
  notes: record.notes || null,
  status: normalizeStatus(record.status),
  source_type: record.sourceType || 'manual',
  legacy_local_id: legacyLocalId,
  created_at: record.createdAt || record.timestamp || new Date().toISOString(),
  updated_at: record.updatedAt || record.timestamp || new Date().toISOString(),
})

export async function migrateLocalJobApplications() {
  const user = await getCurrentUser()
  const localRecords = readLocalApplications()

  if (!user || localRecords.length === 0) return { migrated: 0 }

  const rows = localRecords.map((record, index) => toDatabaseRecord(record, user.id, {
    legacyLocalId: String(record.id || `legacy-${index}-${record.createdAt || record.timestamp || 'unknown'}`),
  }))

  const { error } = await supabase
    .from('job_application_records')
    .upsert(rows, { onConflict: 'user_id,legacy_local_id', ignoreDuplicates: true })

  if (error) throw error

  localStorage.removeItem(LOCAL_KEY)
  return { migrated: rows.length }
}

export async function listJobApplications({ migrateLocal = true } = {}) {
  const user = await getCurrentUser()
  if (!user) return readLocalApplications().map((record) => ({ ...record, status: normalizeStatus(record.status) }))

  if (migrateLocal) await migrateLocalJobApplications()

  const { data, error } = await supabase
    .from('job_application_records')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data || []).map(toClientRecord)
}

export async function createJobApplication(application) {
  const localRecord = {
    id: crypto.randomUUID(),
    companyName: application.companyName,
    jobTitle: application.jobTitle,
    companyUrl: application.companyUrl || '',
    notes: application.notes || '',
    status: normalizeStatus(application.status),
    sourceType: application.sourceType || 'manual',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const user = await getCurrentUser()
  if (!user) {
    writeLocalApplications([...readLocalApplications(), localRecord])
    return { record: localRecord, persisted: false }
  }

  const { data, error } = await supabase
    .from('job_application_records')
    .insert(toDatabaseRecord(localRecord, user.id))
    .select()
    .single()

  if (error) throw error
  return { record: toClientRecord(data), persisted: true }
}

export async function updateJobApplication(id, changes) {
  const user = await getCurrentUser()
  if (!user) throw new Error('请先登录后再更新申请记录。')

  const payload = { updated_at: new Date().toISOString() }
  if (changes.status !== undefined) payload.status = normalizeStatus(changes.status)
  if (changes.notes !== undefined) payload.notes = changes.notes || null

  const { data, error } = await supabase
    .from('job_application_records')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return toClientRecord(data)
}

export async function deleteJobApplication(id) {
  const user = await getCurrentUser()
  if (!user) throw new Error('请先登录后再删除申请记录。')

  const { error } = await supabase
    .from('job_application_records')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getJobApplicationCount() {
  const user = await getCurrentUser()
  if (!user) return readLocalApplications().length

  const { count, error } = await supabase
    .from('job_application_records')
    .select('*', { count: 'exact', head: true })

  if (error) throw error
  return count || 0
}
