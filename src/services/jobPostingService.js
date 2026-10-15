import { supabase } from '../supabase'

export { JOB_DEPARTMENTS } from '../data/jobDepartments.js'

const EDITABLE_FIELDS = [
  'source_type', 'source_name', 'source_url', 'source_published_on', 'title', 'summary',
  'cruise_lines', 'departments', 'positions', 'agency', 'locations', 'requirements',
  'salary', 'deadline', 'risk_flags', 'status',
]
const PUBLIC_FIELDS = 'id, source_name, source_url, source_published_on, title, summary, cruise_lines, departments, positions, agency, locations, requirements, salary, deadline, published_at'

export class JobPostingError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'JobPostingError'
    this.code = code
  }
}

const todayInShanghai = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date())

export const isJobPostingExpired = (posting, today = todayInShanghai()) => Boolean(posting?.deadline && posting.deadline < today)

// Open postings first (newest first), then expired ones.
export const sortJobPostings = (postings, today = todayInShanghai()) => [...postings].sort((left, right) => {
  const expiredDiff = Number(isJobPostingExpired(left, today)) - Number(isJobPostingExpired(right, today))
  if (expiredDiff) return expiredDiff
  return String(right.published_at || '').localeCompare(String(left.published_at || ''))
})

export const listPublishedJobPostings = async () => {
  const { data, error } = await supabase
    .from('job_postings')
    .select(PUBLIC_FIELDS)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(100)
  if (error) throw new JobPostingError('LOAD_FAILED', '暂时无法读取招聘信息，请稍后再试。')
  return sortJobPostings(data || [])
}

export const listAllJobPostings = async () => {
  const { data, error } = await supabase
    .from('job_postings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw new JobPostingError('LOAD_FAILED', '暂时无法读取招聘列表。')
  return data || []
}

const toListValue = (value) => (Array.isArray(value) ? value : String(value || '').split(/[,，、\n]/))
  .map((item) => String(item).trim())
  .filter(Boolean)

export const toJobPostingRow = (draft) => {
  const row = Object.fromEntries(EDITABLE_FIELDS.filter((field) => field in draft).map((field) => [field, draft[field]]))
  for (const field of ['cruise_lines', 'departments', 'positions', 'risk_flags']) {
    if (field in row) row[field] = toListValue(row[field])
  }
  for (const field of ['agency', 'locations', 'requirements', 'salary', 'deadline', 'source_published_on']) {
    if (field in row) row[field] = String(row[field] || '').trim() || null
  }
  for (const field of ['title', 'summary', 'source_name', 'source_url']) {
    if (field in row) row[field] = String(row[field] || '').trim()
  }
  return row
}

export const saveJobPosting = async (draft) => {
  const row = toJobPostingRow(draft)
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
