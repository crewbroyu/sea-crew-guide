import assert from 'node:assert/strict'
import {
  isIsoDate,
  normalizeCruiseLine,
  normalizeInterviewSessions,
  normalizePositionDetails,
  formatInterviewSession,
} from '../src/data/jobPostingDetails.js'
import {
  EMPTY_FILTERS,
  buildFilterOptions,
  countActiveFilters,
  filterJobPostings,
  getUpcomingSession,
  parseFilters,
  serializeFilters,
} from '../src/data/jobPostingSearch.js'

const TODAY = '2026-10-17'
const filters = (overrides) => ({ ...EMPTY_FILTERS, ...overrides })
const ids = (results) => results.map((item) => item.posting.id)

// 1. Normalizers.
assert.equal(normalizeCruiseLine('Royal Caribbean'), 'Royal Caribbean International')
assert.equal(normalizeCruiseLine('皇家加勒比'), 'Royal Caribbean International')
assert.equal(normalizeCruiseLine('NCL'), 'Norwegian Cruise Line')
assert.equal(normalizeCruiseLine('Some New Line'), 'Some New Line')
const sixtyOne = Array.from({ length: 61 }, (_, index) => ({ title: `Role ${index}`, experience: 'none' }))
assert.equal(normalizePositionDetails(sixtyOne).details.length, 60)
assert.equal(normalizePositionDetails(sixtyOne).truncated, true)
assert.deepEqual(normalizePositionDetails(['Waiter', 'waiter', { title: 'Chef', experience: 'senior' }]).details, [
  { title: 'Waiter', experience: 'unspecified' }, { title: 'Chef', experience: 'unspecified' },
])
assert.deepEqual(normalizeInterviewSessions([{ city: ' 上海 ', mode: 'offline', date: '2026-10-28' }, { mode: 'zoom', date: '28 Oct' }, {}]), [
  { city: '上海', mode: 'offline', date: '2026-10-28', note: null },
])
assert.equal(formatInterviewSession({ city: '上海', mode: 'offline', date: '2026-10-28', note: null }), '10-28 · 上海 · 线下')
assert.equal(formatInterviewSession({ city: null, mode: 'unspecified', date: null, note: null }), '面试安排未说明')

// 2. Fixtures: a group post mixing roles, a single-city post, an expired post, and a legacy row.
const group = {
  id: 'group', source_name: '皇家加勒比游轮', title: '皇家加勒比集团多岗位招聘', summary: '', published_at: '2026-10-10T00:00:00Z',
  cruise_lines: ['Royal Caribbean', 'Celebrity Cruises'], deadline: null,
  positions: ['Assistant Waiter', 'Front Desk Manager', 'Sous Chef'],
  position_details: [
    { title: 'Assistant Waiter', experience: 'none' },
    { title: 'Front Desk Manager', experience: 'cruise' },
    { title: 'Sous Chef', experience: 'related' },
  ],
  interview_sessions: [
    { city: '上海', mode: 'offline', date: '2026-10-28', note: null },
    { city: '北京', mode: 'online', date: '2026-10-20', note: null },
  ],
}
const msc = {
  id: 'msc', source_name: '海乘招聘号', title: 'MSC 酒吧岗位', summary: '', published_at: '2026-10-12T00:00:00Z',
  cruise_lines: ['MSC Cruises'], deadline: '2026-11-30',
  positions: ['Bar Server'], position_details: [{ title: 'Bar Server', experience: 'unspecified' }],
  interview_sessions: [{ city: '北京', mode: 'offline', date: null, note: null }],
}
const expired = { ...msc, id: 'expired', deadline: '2026-10-01', published_at: '2026-09-01T00:00:00Z' }
const legacy = {
  id: 'legacy', source_name: '邮轮求职圈', title: '客房岗位', summary: '', published_at: '2026-10-05T00:00:00Z',
  cruise_lines: [], departments: ['客房服务'], deadline: null, positions: [], interview_sessions: [],
}
const postings = [legacy, expired, msc, group]

// 3. Expired postings are hidden by default; no deadline is not "expired".
assert.deepEqual(ids(filterJobPostings(postings, filters({}), TODAY)), ['msc', 'group', 'legacy'])
assert.ok(ids(filterJobPostings(postings, filters({ showExpired: true }), TODAY)).includes('expired'))

// 4. City and mode must match in the same session: Shanghai offline yes, Beijing offline only MSC.
assert.deepEqual(ids(filterJobPostings(postings, filters({ cities: ['上海'], modes: ['offline'] }), TODAY)), ['group'])
assert.deepEqual(ids(filterJobPostings(postings, filters({ cities: ['北京'], modes: ['offline'] }), TODAY)), ['msc'])
assert.deepEqual(ids(filterJobPostings(postings, filters({ cities: ['北京'], modes: ['online'] }), TODAY)), ['group'])
// The card shows the session that matched, not just the soonest one.
assert.equal(filterJobPostings(postings, filters({ cities: ['上海'] }), TODAY)[0].matchedSession.city, '上海')
assert.equal(filterJobPostings(postings, filters({}), TODAY)[0].matchedSession, null)
// Within a category options are OR.
assert.deepEqual(ids(filterJobPostings(postings, filters({ cities: ['上海', '北京'] }), TODAY)).sort(), ['group', 'msc'])

// 5. Experience is per position and returns the matching roles.
const noExperience = filterJobPostings(postings, filters({ experience: ['none'] }), TODAY)
assert.deepEqual(ids(noExperience), ['group'])
assert.deepEqual(noExperience[0].matchedPositions.map((item) => item.title), ['Assistant Waiter'])
// Department and experience must hold for the same position: no kitchen role needs no experience.
assert.deepEqual(ids(filterJobPostings(postings, filters({ departments: ['厨房'], experience: ['none'] }), TODAY)), [])
assert.deepEqual(filterJobPostings(postings, filters({ departments: ['厨房'] }), TODAY)[0].matchedPositions.map((item) => item.title), ['Sous Chef'])
// A legacy row without positions matches by its saved department, and only as "unspecified".
assert.deepEqual(ids(filterJobPostings(postings, filters({ departments: ['客房服务'] }), TODAY)), ['legacy'])
assert.deepEqual(ids(filterJobPostings(postings, filters({ experience: ['unspecified'] }), TODAY)).sort(), ['legacy', 'msc'])

// 6. Cruise line aliases collapse into one option and still match.
assert.deepEqual(ids(filterJobPostings(postings, filters({ cruiseLines: ['Royal Caribbean International'] }), TODAY)), ['group'])
const options = buildFilterOptions(postings.filter((posting) => posting.id !== 'expired'))
assert.deepEqual(options.cruiseLines, ['Celebrity Cruises', 'MSC Cruises', 'Royal Caribbean International'])
assert.deepEqual(options.experience, ['none', 'related', 'cruise', 'unspecified'])
assert.deepEqual(options.modes, ['offline', 'online'])
assert.deepEqual(options.cities.sort(), ['上海', '北京'].sort())

// 7. Text search covers positions and sources.
assert.deepEqual(ids(filterJobPostings(postings, filters({ q: 'sous chef' }), TODAY)), ['group'])
assert.deepEqual(ids(filterJobPostings(postings, filters({ q: '海乘招聘号' }), TODAY)), ['msc'])

// 8. "Upcoming interview" sorts by the next session that has not passed; undated last.
assert.equal(getUpcomingSession(group, TODAY).date, '2026-10-20')
assert.equal(getUpcomingSession(group, '2026-10-21').date, '2026-10-28')
assert.deepEqual(ids(filterJobPostings(postings, filters({ sort: 'interview' }), TODAY)), ['group', 'msc', 'legacy'])

// 9. URL round trip, including repeated parameters for multiple options.
const shared = filters({ q: 'chef', cities: ['上海', '北京'], modes: ['offline'], experience: ['none'], showExpired: true, sort: 'interview' })
const query = serializeFilters(shared).toString()
assert.deepEqual(parseFilters(query), shared)
assert.equal(countActiveFilters(shared), 6)
assert.deepEqual(parseFilters(''), EMPTY_FILTERS)
assert.equal(serializeFilters(EMPTY_FILTERS).toString(), '')

// 10. Cross-check fixes (GPT review of 78bacaf).
// a. Typing a space keeps it: the raw query survives the URL round trip, matching trims it.
assert.equal(parseFilters(serializeFilters(filters({ q: 'Sous ' }))).q, 'Sous ')
assert.equal(parseFilters(serializeFilters(filters({ q: 'Sous Chef' }))).q, 'Sous Chef')
assert.deepEqual(ids(filterJobPostings(postings, filters({ q: '  sous chef  ' }), TODAY)), ['group'])
assert.equal(serializeFilters(filters({ q: '   ' })).toString(), '', 'A blank query is not shared.')

// b. "Upcoming interview" with a city filter sorts by that city's sessions only.
const a = { ...msc, id: 'a', deadline: null, published_at: '2026-10-01T00:00:00Z', interview_sessions: [
  { city: '北京', mode: 'offline', date: '2026-10-19', note: null }, { city: '上海', mode: 'offline', date: '2026-11-20', note: null },
] }
const b = { ...msc, id: 'b', deadline: null, published_at: '2026-10-02T00:00:00Z', interview_sessions: [{ city: '上海', mode: 'offline', date: '2026-10-25', note: null }] }
assert.deepEqual(ids(filterJobPostings([a, b], filters({ cities: ['上海'], sort: 'interview' }), TODAY)), ['b', 'a'])
assert.deepEqual(ids(filterJobPostings([a, b], filters({ sort: 'interview' }), TODAY)), ['a', 'b'], 'Without a city filter, the soonest session overall counts.')

// c. Impossible dates are rejected, month ends and leap days accepted.
for (const value of ['2026-02-31', '2026-02-29', '2100-02-29', '2026-04-31', '2026-13-01', '2026-00-01']) assert.equal(isIsoDate(value), false, value)
for (const value of ['2026-12-31', '2028-02-29', '2000-02-29', '2026-04-30']) assert.equal(isIsoDate(value), true, value)
assert.deepEqual(normalizeInterviewSessions([{ city: '上海', mode: 'offline', date: '2026-02-31' }])[0].date, null)

// d. Searching for a position and filtering by experience must hold for the same position.
assert.deepEqual(ids(filterJobPostings(postings, filters({ q: 'Sous Chef', experience: ['none'] }), TODAY)), [])
assert.deepEqual(filterJobPostings(postings, filters({ q: 'Sous Chef', experience: ['related'] }), TODAY)[0].matchedPositions.map((item) => item.title), ['Sous Chef'])
// A search that matches other fields (not a position) leaves position filters unrestricted.
assert.deepEqual(filterJobPostings(postings, filters({ q: '皇家加勒比', experience: ['none'] }), TODAY)[0].matchedPositions.map((item) => item.title), ['Assistant Waiter'])
// A position search alone lists the matching positions on the card.
assert.deepEqual(filterJobPostings(postings, filters({ q: 'waiter' }), TODAY)[0].matchedPositions.map((item) => item.title), ['Assistant Waiter'])

console.log('job posting search: ok')
