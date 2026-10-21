import { supabase } from '../supabase'
import { CHANNEL_TYPES, FEE_DISCLOSURES, normalizeCruiseLines, normalizeInterviewSessions, normalizePositionDetails } from '../data/jobPostingDetails.js'
import { sortJobPostings } from '../data/jobPostingSearch.js'

export { JOB_DEPARTMENTS } from '../data/jobDepartments.js'
export { isJobPostingExpired, sortJobPostings } from '../data/jobPostingSearch.js'

const EDITABLE_FIELDS = [
  'source_type', 'source_name', 'source_url', 'source_published_on', 'title', 'summary',
  'cruise_lines', 'departments', 'positions', 'position_details', 'interview_sessions', 'agency',
  'locations', 'requirements', 'salary', 'deadline', 'risk_flags', 'status',
  'channel_type', 'channel_claim', 'channel_verified_at', 'channel_verification_url', 'fee_disclosure',
]
const PUBLIC_FIELDS = 'id, source_name, source_url, source_published_on, title, summary, cruise_lines, departments, positions, position_details, interview_sessions, agency, locations, requirements, salary, deadline, published_at, channel_type, channel_claim, channel_verified_at, channel_verification_url, fee_disclosure, last_checked_at'
const PAGE_SIZE = 500

export class JobPostingError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'JobPostingError'
    this.code = code
  }
}

// Reads every matching row in pages, so filtering never silently misses older postings.
const readAllPages = async (buildQuery) => {
  const rows = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    rows.push(...(data || []))
    if (!data || data.length < PAGE_SIZE) return rows
  }
}

export const listPublishedJobPostings = async () => {
  try {
    const rows = await readAllPages(() => supabase
      .from('job_postings')
      .select(PUBLIC_FIELDS)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .order('id'))
    return sortJobPostings(rows)
  } catch {
    throw new JobPostingError('LOAD_FAILED', '暂时无法读取招聘信息，请稍后再试。')
  }
}

export const listAllJobPostings = async () => {
  try {
    return await readAllPages(() => supabase
      .from('job_postings')
      .select('*')
      .order('created_at', { ascending: false })
      .order('id'))
  } catch {
    throw new JobPostingError('LOAD_FAILED', '暂时无法读取招聘列表。')
  }
}

const toListValue = (value) => (Array.isArray(value) ? value : String(value || '').split(/[,，、\n]/))
  .map((item) => String(item).trim())
  .filter(Boolean)

export const toJobPostingRow = (draft) => {
  const row = Object.fromEntries(EDITABLE_FIELDS.filter((field) => field in draft).map((field) => [field, draft[field]]))
  for (const field of ['departments', 'risk_flags']) {
    if (field in row) row[field] = toListValue(row[field])
  }
  if ('cruise_lines' in row) row.cruise_lines = normalizeCruiseLines(toListValue(row.cruise_lines))
  // position_details is the source of truth; positions stays in sync for grouping and older readers.
  if ('position_details' in row || 'positions' in row) {
    const source = 'position_details' in row ? row.position_details : toListValue(row.positions)
    row.position_details = normalizePositionDetails(source).details
    row.positions = row.position_details.map((item) => item.title)
  }
  if ('interview_sessions' in row) row.interview_sessions = normalizeInterviewSessions(row.interview_sessions)
  if ('channel_type' in row && !Object.hasOwn(CHANNEL_TYPES, row.channel_type)) row.channel_type = 'unspecified'
  if ('fee_disclosure' in row && !Object.hasOwn(FEE_DISCLOSURES, row.fee_disclosure)) row.fee_disclosure = 'unspecified'
  if ('channel_claim' in row) row.channel_claim = String(row.channel_claim || '').trim().slice(0, 200) || null
  // "Verified" requires an https evidence link; without one the verification is cleared.
  if ('channel_verification_url' in row) row.channel_verification_url = String(row.channel_verification_url || '').trim() || null
  if ('channel_verified_at' in row && !/^https:\/\//.test(row.channel_verification_url || draft.channel_verification_url || '')) row.channel_verified_at = null
  for (const field of ['agency', 'locations', 'requirements', 'salary', 'deadline', 'source_published_on']) {
    if (field in row) row[field] = String(row[field] || '').trim() || null
  }
  for (const field of ['title', 'summary', 'source_name', 'source_url']) {
    if (field in row) row[field] = String(row[field] || '').trim()
  }
  return row
}

export const saveJobPosting = async (draft) => {
  // Every admin save is a review of the posting against its source.
  const row = { ...toJobPostingRow(draft), last_checked_at: new Date().toISOString() }
  if (!row.title || !row.summary || !row.source_name || !row.source_url) {
    throw new JobPostingError('INCOMPLETE', '标题、摘要、来源名称和原文链接都必须填写。')
  }
  const query = draft.id
    ? supabase.from('job_postings').update(row).eq('id', draft.id)
    : supabase.from('job_postings').insert(row)
  const { data, error } = await query.select('*').single()
  if (error) {
    if (error.code === '23505') throw new JobPostingError('DUPLICATE', '这篇原文已经整理过了，请在下方列表中编辑。')
    throw new JobPostingError('SAVE_FAILED', '保存失败，请检查字段长度后重试。')
  }
  return data
}

export const setJobPostingStatus = async (id, status) => {
  const { data, error } = await supabase.from('job_postings').update({ status }).eq('id', id).select('*').single()
  if (error) throw new JobPostingError('SAVE_FAILED', '状态更新失败，请重试。')
  return data
}

export const deleteJobPosting = async (id) => {
  const { error } = await supabase.from('job_postings').delete().eq('id', id)
  if (error) throw new JobPostingError('DELETE_FAILED', '删除失败，请重试。')
}

export const extractJobPosting = async ({ sourceUrl, articleText }) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new JobPostingError('LOGIN_REQUIRED', '请先登录管理员账号。')

  let response
  try {
    response = await fetch('/api/job-postings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceUrl, articleText }),
      signal: AbortSignal.timeout(80_000),
    })
  } catch {
    throw new JobPostingError('NETWORK_ERROR', '网络异常或提取超时，请重试。')
  }
  const body = await response.json().catch(() => null)
  if (!response.ok || !body?.success) {
    throw new JobPostingError(body?.error?.code || 'EXTRACT_FAILED', body?.error?.message || '提取失败，请重试。')
  }
  return body.data
}
