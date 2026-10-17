import { EXPERIENCE_LEVELS, INTERVIEW_MODES, normalizeCruiseLine } from './jobPostingDetails.js'
import { classifyPosition, getPostingDepartments } from './jobPositionGroups.js'

// Search and filtering for /jobs/latest. Rules:
// - options within one category are OR, different categories are AND;
// - city and interview mode must match within the same interview session;
// - department and experience must match on the same position, and those positions are returned
//   so the card can show which roles fit.

export const todayInShanghai = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date())

export const isJobPostingExpired = (posting, today = todayInShanghai()) => Boolean(posting?.deadline && posting.deadline < today)

// Open postings first (newest first), then expired ones.
export const sortJobPostings = (postings, today = todayInShanghai()) => [...postings].sort((left, right) => {
  const expiredDiff = Number(isJobPostingExpired(left, today)) - Number(isJobPostingExpired(right, today))
  if (expiredDiff) return expiredDiff
  return String(right.published_at || '').localeCompare(String(left.published_at || ''))
})

export const getPostingPositionDetails = (posting) => (posting.position_details?.length
  ? posting.position_details
  : (posting.positions || []).map((title) => ({ title, experience: 'unspecified' })))

export const getPostingCruiseLines = (posting) => [...new Set((posting.cruise_lines || []).map(normalizeCruiseLine).filter(Boolean))]

// The next session that has not passed; sessions without a date are not "upcoming".
export const getUpcomingSession = (posting, today = todayInShanghai()) => (posting.interview_sessions || [])
  .filter((session) => session.date && session.date >= today)
  .sort((left, right) => left.date.localeCompare(right.date))[0] || null

export const FILTER_CATEGORIES = [
  { key: 'departments', param: 'dept', label: '部门' },
  { key: 'experience', param: 'exp', label: '经验要求' },
  { key: 'cities', param: 'city', label: '面试城市' },
  { key: 'modes', param: 'mode', label: '面试方式' },
  { key: 'cruiseLines', param: 'line', label: '邮轮公司' },
  { key: 'sources', param: 'src', label: '来源' },
]

export const EMPTY_FILTERS = {
  q: '', departments: [], experience: [], cities: [], modes: [], cruiseLines: [], sources: [],
  showExpired: false, sort: 'latest',
}

export const parseFilters = (searchParams) => {
  const params = searchParams instanceof URLSearchParams ? searchParams : new URLSearchParams(searchParams)
  const filters = { ...EMPTY_FILTERS, q: (params.get('q') || '').trim().slice(0, 80) }
  for (const { key, param } of FILTER_CATEGORIES) filters[key] = [...new Set(params.getAll(param).map((value) => value.trim()).filter(Boolean))]
  filters.showExpired = params.get('expired') === '1'
  filters.sort = params.get('sort') === 'interview' ? 'interview' : 'latest'
  return filters
}

export const serializeFilters = (filters) => {
  const params = new URLSearchParams()
  if (filters.q?.trim()) params.set('q', filters.q.trim())
  for (const { key, param } of FILTER_CATEGORIES) for (const value of filters[key] || []) params.append(param, value)
  if (filters.showExpired) params.set('expired', '1')
  if (filters.sort === 'interview') params.set('sort', 'interview')
  return params
}

export const countActiveFilters = (filters) => FILTER_CATEGORIES
  .reduce((total, { key }) => total + (filters[key]?.length || 0), 0) + (filters.q?.trim() ? 1 : 0) + (filters.showExpired ? 1 : 0)

// Only values that occur in the data become options.
export const buildFilterOptions = (postings) => {
  const sets = Object.fromEntries(FILTER_CATEGORIES.map(({ key }) => [key, new Set()]))
  for (const posting of postings) {
    getPostingDepartments(posting).forEach((value) => sets.departments.add(value))
    getPostingPositionDetails(posting).forEach((item) => sets.experience.add(item.experience))
    for (const session of posting.interview_sessions || []) {
      if (session.city) sets.cities.add(session.city)
      sets.modes.add(session.mode)
    }
    getPostingCruiseLines(posting).forEach((value) => sets.cruiseLines.add(value))
    if (posting.source_name) sets.sources.add(posting.source_name)
  }
  const order = { experience: ['none', 'related', 'cruise', 'unspecified'], modes: ['offline', 'online', 'unspecified'] }
  return Object.fromEntries(Object.entries(sets).map(([key, set]) => [key, order[key]
    ? order[key].filter((value) => set.has(value))
    : [...set].sort((left, right) => left.localeCompare(right, 'zh-CN'))]))
}

const matchesText = (posting, query) => {
  if (!query) return true
  const needle = query.toLowerCase()
  return [
    posting.title, posting.summary, posting.agency, posting.source_name, posting.locations,
    ...getPostingCruiseLines(posting), ...getPostingPositionDetails(posting).map((item) => item.title),
  ].some((value) => String(value || '').toLowerCase().includes(needle))
}

const sessionMatches = (session, filters) => (!filters.cities.length || filters.cities.includes(session.city))
  && (!filters.modes.length || filters.modes.includes(session.mode))

// Returns [{ posting, matchedPositions, matchedSession }]; each is null when its kind of filter is inactive.
export const filterJobPostings = (postings, filters, today = todayInShanghai()) => {
  const positionFilterActive = filters.departments.length > 0 || filters.experience.length > 0
  const results = []
  for (const posting of postings) {
    if (!filters.showExpired && isJobPostingExpired(posting, today)) continue
    if (!matchesText(posting, filters.q.trim())) continue
    if (filters.sources.length && !filters.sources.includes(posting.source_name)) continue
    if (filters.cruiseLines.length && !getPostingCruiseLines(posting).some((line) => filters.cruiseLines.includes(line))) continue
    let matchedSession = null
    if (filters.cities.length || filters.modes.length) {
      const sessions = (posting.interview_sessions || []).filter((session) => sessionMatches(session, filters))
      if (!sessions.length) continue
      // Show the session that matched, preferring the soonest one that has not passed.
      matchedSession = getUpcomingSession({ interview_sessions: sessions }, today) || sessions[0]
    }

    let matchedPositions = null
    if (positionFilterActive) {
      const details = getPostingPositionDetails(posting)
      if (details.length) {
        matchedPositions = details.filter((item) => (!filters.departments.length || filters.departments.includes(classifyPosition(item.title)))
          && (!filters.experience.length || filters.experience.includes(item.experience)))
        if (!matchedPositions.length) continue
      } else {
        // No positions listed: only the saved department tags can match, and experience is unknown.
        if (filters.experience.length && !filters.experience.includes('unspecified')) continue
        if (filters.departments.length && !getPostingDepartments(posting).some((value) => filters.departments.includes(value))) continue
        matchedPositions = []
      }
    }
    results.push({ posting, matchedPositions, matchedSession })
  }

  if (filters.sort === 'interview') {
    const nextDate = (posting) => getUpcomingSession(posting, today)?.date || '9999-12-31'
    results.sort((left, right) => nextDate(left.posting).localeCompare(nextDate(right.posting))
      || String(right.posting.published_at || '').localeCompare(String(left.posting.published_at || '')))
  } else {
    const order = new Map(sortJobPostings(results.map((item) => item.posting), today).map((posting, index) => [posting, index]))
    results.sort((left, right) => order.get(left.posting) - order.get(right.posting))
  }
  return results
}

export const filterValueLabel = (key, value) => {
  if (key === 'experience') return EXPERIENCE_LEVELS[value] || value
  if (key === 'modes') return INTERVIEW_MODES[value] || value
  return value
}

// A category is shown when it offers a real choice, or when something in it is already selected
// (for example from a shared link), so every selection can always be cleared here.
export const getVisibleCategories = (options, filters) => FILTER_CATEGORIES
  .map((category) => ({
    ...category,
    values: [...new Set([...(options[category.key] || []), ...(filters[category.key] || [])])],
  }))
  .filter((category) => (options[category.key] || []).length > 1 || (filters[category.key] || []).length > 0)
