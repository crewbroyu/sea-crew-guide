// Structured recruitment details shared by AI extraction, the admin form, the public filters, and
// tests. Mirrors the checks in 20261018090000_job_search_details.sql.

export const MAX_POSITIONS = 60
export const MAX_INTERVIEW_SESSIONS = 20

// Experience is recorded per position: one article often has entry roles that need no experience
// next to management roles that need cruise experience. "none" only when the source says so.
export const EXPERIENCE_LEVELS = {
  none: '无需经验',
  related: '需相关工作经验',
  cruise: '需邮轮经验',
  unspecified: '未说明',
}

export const INTERVIEW_MODES = {
  offline: '线下',
  online: '线上',
  unspecified: '方式未说明',
}

const trimText = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '')
const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))

// One canonical name per cruise line, so the same company never appears as two filter options.
const CRUISE_LINE_ALIASES = [
  ['Royal Caribbean International', /royal\s*caribbean|^rcl$|^rci$|皇家加勒比/i],
  ['Celebrity Cruises', /celebrity|精致/i],
  ['Silversea Cruises', /silversea|银海/i],
  ['TUI Cruises', /\btui\b|途易/i],
  ['MSC Cruises', /\bmsc\b|地中海/i],
  ['Norwegian Cruise Line', /norwegian|\bncl\b|诺唯真/i],
  ['Oceania Cruises', /oceania|大洋/i],
  ['Regent Seven Seas Cruises', /regent|丽晶/i],
  ['Princess Cruises', /princess|公主/i],
  ['Carnival Cruise Line', /carnival|嘉年华/i],
  ['Costa Cruises', /costa|歌诗达/i],
  ['Holland America Line', /holland\s*america|荷美/i],
  ['Cunard', /cunard|冠达/i],
  ['P&O Cruises', /p\s*&\s*o|铁行/i],
  ['AIDA Cruises', /\baida\b|阿依达/i],
  ['Disney Cruise Line', /disney|迪士尼/i],
  ['Virgin Voyages', /virgin|维珍/i],
  ['Viking', /viking|维京/i],
  ['Azamara', /azamara/i],
  ['Explora Journeys', /explora/i],
]

export const normalizeCruiseLine = (name) => {
  const text = trimText(name, 80)
  if (!text) return ''
  return CRUISE_LINE_ALIASES.find(([, pattern]) => pattern.test(text))?.[0] || text
}

export const normalizeCruiseLines = (names) => [...new Set((Array.isArray(names) ? names : []).map(normalizeCruiseLine).filter(Boolean))].slice(0, 10)

// [{ title, experience }], deduplicated by title. Reports truncation so the admin can check the article.
export const normalizePositionDetails = (value) => {
  const seen = new Set()
  const all = []
  for (const item of Array.isArray(value) ? value : []) {
    const title = trimText(typeof item === 'string' ? item : item?.title, 80)
    if (!title || seen.has(title.toLowerCase())) continue
    seen.add(title.toLowerCase())
    const experience = Object.hasOwn(EXPERIENCE_LEVELS, item?.experience) ? item.experience : 'unspecified'
    all.push({ title, experience })
  }
  return { details: all.slice(0, MAX_POSITIONS), truncated: all.length > MAX_POSITIONS }
}

// [{ city, mode, date, note }]. City is null for online sessions without a place; date is null
// unless the source gives a full date.
export const normalizeInterviewSessions = (value) => (Array.isArray(value) ? value : [])
  .map((item) => {
    const date = trimText(item?.date, 10)
    return {
      city: trimText(item?.city, 30) || null,
      mode: Object.hasOwn(INTERVIEW_MODES, item?.mode) ? item.mode : 'unspecified',
      date: isIsoDate(date) ? date : null,
      note: trimText(item?.note, 120) || null,
    }
  })
  .filter((session) => session.city || session.date || session.note || session.mode !== 'unspecified')
  .slice(0, MAX_INTERVIEW_SESSIONS)

export const formatInterviewSession = (session) => [
  session.date ? session.date.slice(5) : '',
  session.city || '',
  session.mode !== 'unspecified' ? INTERVIEW_MODES[session.mode] : '',
].filter(Boolean).join(' · ') || session.note || '面试安排未说明'
