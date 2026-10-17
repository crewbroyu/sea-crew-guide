// src/pages/LatestRecruitment.jsx
import { createElement, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Building2, CalendarClock, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, GraduationCap, Inbox, MapPin, Search, ShieldAlert, Ship, SlidersHorizontal, Wallet, X } from 'lucide-react'
import { JOB_DEPARTMENTS, isJobPostingExpired, listPublishedJobPostings } from '../services/jobPostingService'
import { getDepartmentTraining, getPostingDepartments, groupPositionsByDepartment } from '../data/jobPositionGroups'
import { EXPERIENCE_LEVELS, formatInterviewSession } from '../data/jobPostingDetails'
import {
  EMPTY_FILTERS,
  FILTER_CATEGORIES,
  buildFilterOptions,
  countActiveFilters,
  filterJobPostings,
  filterValueLabel,
  getPostingCruiseLines,
  getPostingPositionDetails,
  getUpcomingSession,
  parseFilters,
  serializeFilters,
} from '../data/jobPostingSearch'
import JobFilterSheet from '../components/jobs/JobFilterSheet'
import { trackProductEvent } from '../services/productAnalyticsService'

const EXPERIENCE_STYLES = {
  none: 'bg-emerald-50 text-emerald-700',
  related: 'bg-amber-50 text-amber-700',
  cruise: 'bg-rose-50 text-rose-700',
}

const MAX_COLLAPSED_DEPARTMENTS = 3

function InfoItem({ icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
      {createElement(icon, { size: 16, className: 'mt-0.5 flex-shrink-0 text-purple-500' })}
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value}</p>
      </div>
    </div>
  )
}

function DepartmentChips({ departments, limit }) {
  const shown = limit ? departments.slice(0, limit) : departments
  const hidden = departments.length - shown.length
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((department) => (
        <span key={department} className="rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{department}</span>
      ))}
      {hidden > 0 && <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500">+{hidden}</span>}
    </div>
  )
}

function PositionGroup({ posting, department, positions, experienceByTitle }) {
  const training = getDepartmentTraining(department)
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-800">
          {department}<span className="ml-1.5 text-xs font-normal text-gray-400">{positions.length}</span>
        </p>
        {training && (
          <Link
            to={training.to}
            onClick={() => trackProductEvent('job_posting_training_clicked', {
              productCode: training.productCode || null,
              properties: { postingId: posting.id, department, positionKey: training.positionKey },
            })}
            className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-purple-700 shadow-sm hover:bg-purple-50"
          >
            <GraduationCap size={13} />{training.label}<ChevronRight size={13} />
          </Link>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {positions.map((position) => {
          const experience = experienceByTitle.get(position)
          return (
            <span key={position} className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700">
              {position}
              {EXPERIENCE_STYLES[experience] && <span className={`rounded px-1 text-[10px] font-medium ${EXPERIENCE_STYLES[experience]}`}>{EXPERIENCE_LEVELS[experience]}</span>}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function PostingCard({ posting, matchedPositions, matchedSession }) {
  const [open, setOpen] = useState(false)
  const expired = isJobPostingExpired(posting)
  const date = posting.source_published_on || posting.published_at?.slice(0, 10)
  const positions = [...new Set(posting.positions)]
  const groups = useMemo(() => groupPositionsByDepartment(posting.positions), [posting.positions])
  const experienceByTitle = useMemo(() => new Map(getPostingPositionDetails(posting).map((item) => [item.title, item.experience])), [posting])
  const collapsedDepartments = getPostingDepartments(posting)
  const hasTraining = groups.some((group) => getDepartmentTraining(group.department))
  const cruiseLines = getPostingCruiseLines(posting)
  const sessions = posting.interview_sessions || []
  const nextSession = getUpcomingSession(posting)
  const headlineSession = matchedSession || nextSession || sessions[0]

  const toggle = () => {
    if (!open) {
      trackProductEvent('job_posting_opened', { productCode: null, properties: { postingId: posting.id }, oncePerSession: true, dedupeKey: posting.id })
    }
    setOpen(!open)
  }

  return (
    <article className={`overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm ${expired ? 'opacity-60' : ''}`}>
      <button type="button" onClick={toggle} className="w-full p-4 text-left md:p-5" aria-expanded={open}>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="truncate">{posting.source_name}</span>
          {date && <><span className="text-gray-300">·</span><span className="flex-shrink-0">{date}</span></>}
          {posting.deadline ? (
            <span className={`ml-auto flex-shrink-0 rounded-full px-2 py-0.5 font-medium ${expired ? 'bg-gray-100 text-gray-500' : 'bg-orange-50 text-orange-600'}`}>
              {expired ? '已截止' : `报名截止 ${posting.deadline.slice(5)}`}
            </span>
          ) : (
            <span className="ml-auto flex-shrink-0 text-gray-400">截止时间未说明</span>
          )}
        </div>

        <div className="mt-2 flex items-start gap-3">
          <h3 className="flex-1 text-base font-bold leading-snug text-gray-900 md:text-lg">{posting.title}</h3>
          <ChevronDown size={20} className={`mt-0.5 flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>

        {cruiseLines.length > 0 && (
          <p className="mt-1.5 flex items-start gap-1.5 text-sm text-purple-700">
            <Ship size={14} className="mt-[3px] flex-shrink-0" />
            <span className={open ? '' : 'truncate'}>{cruiseLines.join(' · ')}</span>
          </p>
        )}

        {headlineSession && (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-700">
            <CalendarClock size={14} className="flex-shrink-0 text-purple-500" />
            <span className="truncate">面试 {formatInterviewSession(headlineSession)}</span>
            {sessions.length > 1 && <span className="flex-shrink-0 text-xs text-gray-400">共 {sessions.length} 场</span>}
          </p>
        )}

        {matchedPositions?.length > 0 && (
          <p className="mt-2 rounded-lg bg-purple-50 px-2.5 py-1.5 text-xs leading-5 text-purple-800">
            符合条件的岗位：{matchedPositions.map((item) => item.title).join('、')}
          </p>
        )}

        <p className={`mt-2 text-sm leading-6 text-gray-600 ${open ? '' : 'line-clamp-2'}`}>{posting.summary}</p>

        {!open && (collapsedDepartments.length > 0 || positions.length > 0) && (
          <div className="mt-3 flex items-center justify-between gap-3">
            <DepartmentChips departments={collapsedDepartments} limit={MAX_COLLAPSED_DEPARTMENTS} />
            <span className="flex flex-shrink-0 items-center gap-1.5 text-xs text-gray-400">
              {positions.length > 0 && `${positions.length} 个岗位`}
              {hasTraining && <span className="inline-flex items-center gap-0.5 font-medium text-purple-600"><GraduationCap size={13} />可练面试</span>}
            </span>
          </div>
        )}
      </button>

      {open && (
        <div className="space-y-5 border-t border-gray-100 px-4 pb-5 pt-4 md:px-5">
          {groups.length > 0 && (
            <section>
              <h4 className="mb-2 text-xs font-semibold text-gray-500">招聘岗位（{positions.length}）· 按部门</h4>
              <div className="grid gap-2 md:grid-cols-2">
                {groups.map((group) => <PositionGroup key={group.department} posting={posting} experienceByTitle={experienceByTitle} {...group} />)}
              </div>
            </section>
          )}

          {groups.length === 0 && posting.departments.length > 0 && (
            <section>
              <h4 className="mb-2 text-xs font-semibold text-gray-500">涉及部门</h4>
              <DepartmentChips departments={posting.departments} />
            </section>
          )}

          {sessions.length > 0 && (
            <section>
              <h4 className="mb-2 text-xs font-semibold text-gray-500">面试安排（{sessions.length} 场）</h4>
              <ul className="space-y-1.5">
                {sessions.map((session, index) => (
                  <li key={index} className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-800">
                    {formatInterviewSession(session)}
                    {session.note && session.note !== formatInterviewSession(session) && <span className="mt-0.5 block text-xs text-gray-500">{session.note}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <InfoItem icon={Building2} label="招聘机构" value={posting.agency} />
            {sessions.length === 0 && <InfoItem icon={MapPin} label="面试/报名地点" value={posting.locations} />}
            <InfoItem icon={Wallet} label="薪资" value={posting.salary} />
            <InfoItem icon={CalendarClock} label="报名截止" value={posting.deadline || '原文未说明，请以原文为准'} />
          </div>

          {posting.requirements && (
            <section>
              <h4 className="mb-2 text-xs font-semibold text-gray-500">岗位要求</h4>
              <p className="whitespace-pre-line rounded-lg bg-gray-50 px-3 py-2.5 text-sm leading-6 text-gray-700">{posting.requirements}</p>
            </section>
          )}

          <a
            href={posting.source_url}
            target="_blank"
            rel="noreferrer noopener"
            onClick={() => trackProductEvent('job_posting_source_clicked', { productCode: null, properties: { postingId: posting.id } })}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white hover:bg-purple-700 sm:inline-flex sm:w-auto"
          >
            <ExternalLink size={16} />查看原文与报名方式
          </a>
        </div>
      )}
    </article>
  )
}

export default function LatestRecruitment() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [postings, setPostings] = useState([])
  const [status, setStatus] = useState('loading')
  const [sheetOpen, setSheetOpen] = useState(false)
  const filters = useMemo(() => parseFilters(searchParams), [searchParams])
  const setFilters = useCallback((next) => setSearchParams(serializeFilters(next), { replace: true }), [setSearchParams])

  useEffect(() => {
    let active = true
    listPublishedJobPostings()
      .then((data) => { if (active) { setPostings(data); setStatus('ready') } })
      .catch(() => { if (active) setStatus('error') })
    return () => { active = false }
  }, [])

  const options = useMemo(() => buildFilterOptions(postings), [postings])
  const results = useMemo(() => filterJobPostings(postings, filters), [postings, filters])
  const activeCount = countActiveFilters(filters)
  const sheetCount = activeCount - (filters.q.trim() ? 1 : 0)
  const openCount = postings.filter((posting) => !isJobPostingExpired(posting)).length
  const quickDepartments = JOB_DEPARTMENTS.filter((item) => options.departments.includes(item))

  // One event per distinct filter combination per session, after the user pauses.
  const filterKey = serializeFilters(filters).toString()
  useEffect(() => {
    if (status !== 'ready' || !filterKey) return undefined
    const timer = window.setTimeout(() => {
      trackProductEvent('job_postings_filtered', {
        productCode: null,
        oncePerSession: true,
        dedupeKey: filterKey,
        properties: {
          categories: FILTER_CATEGORIES.filter(({ key }) => filters[key].length).map(({ key }) => key),
          values: Object.fromEntries(FILTER_CATEGORIES.filter(({ key }) => filters[key].length).map(({ key }) => [key, filters[key]])),
          hasQuery: Boolean(filters.q.trim()),
          showExpired: filters.showExpired,
          sort: filters.sort,
          resultCount: results.length,
        },
      })
    }, 1500)
    return () => window.clearTimeout(timer)
  }, [filterKey, filters, results.length, status])

  const removeValue = (key, value) => setFilters({ ...filters, [key]: filters[key].filter((item) => item !== value) })
  const toggleDepartment = (department) => setFilters({
    ...filters,
    departments: filters.departments.includes(department)
      ? filters.departments.filter((item) => item !== department)
      : [...filters.departments, department],
  })
  const activeChips = [
    ...FILTER_CATEGORIES.flatMap(({ key }) => filters[key].map((value) => ({ key, value, label: filterValueLabel(key, value) }))),
    ...(filters.showExpired ? [{ key: 'showExpired', value: '1', label: '含已截止' }] : []),
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-4 pt-16 pb-6 md:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/jobs/channels')} className="text-white hover:text-purple-200" aria-label="返回">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-white">最新招聘动态</h1>
          </div>
          <p className="mt-2 text-sm text-white/80">
            整理自公开招聘推文，逐条人工核对{status === 'ready' && openCount > 0 ? ` · ${openCount} 条未截止` : ''}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-4 px-4 py-5 md:px-6">
        <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900">
          <ShieldAlert size={16} className="mt-0.5 flex-shrink-0" />
          <p>信息以原文为准。正规邮轮招聘不会要求先交培训费、押金或“保录取”费用。</p>
        </div>

        {status === 'ready' && postings.length > 0 && (
          <>
            <div className="flex gap-2">
              <label className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={filters.q}
                  onChange={(event) => setFilters({ ...filters, q: event.target.value })}
                  placeholder="搜索岗位、邮轮公司、机构"
                  className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                />
              </label>
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                className={`inline-flex h-10 flex-shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium ${sheetCount ? 'border-purple-300 bg-purple-50 text-purple-700' : 'border-gray-200 bg-white text-gray-700'}`}
              >
                <SlidersHorizontal size={16} />筛选{sheetCount ? ` ${sheetCount}` : ''}
              </button>
            </div>

            {(quickDepartments.length > 1 || filters.departments.length > 0) && (
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
                {[...new Set([...quickDepartments, ...filters.departments])].map((item) => {
                  const active = filters.departments.includes(item)
                  return (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleDepartment(item)}
                      className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${active ? 'bg-purple-600 text-white' : 'border border-gray-200 bg-white text-gray-600 hover:border-purple-300'}`}
                    >
                      {item}
                    </button>
                  )
                })}
              </div>
            )}

            {activeChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-gray-500">已选：</span>
                {activeChips.map((chip) => (
                  <button
                    key={`${chip.key}:${chip.value}`}
                    type="button"
                    onClick={() => (chip.key === 'showExpired' ? setFilters({ ...filters, showExpired: false }) : removeValue(chip.key, chip.value))}
                    className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 font-medium text-purple-800"
                    aria-label={`取消 ${chip.label}`}
                  >
                    {chip.label}<X size={12} />
                  </button>
                ))}
                <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="font-semibold text-purple-700 underline underline-offset-2">清除全部</button>
              </div>
            )}

            <p className="text-xs text-gray-500">
              {results.length} 条招聘{filters.sort === 'interview' ? ' · 按近期面试排序' : ''}{!filters.showExpired ? ' · 已隐藏已截止' : ''}
            </p>
          </>
        )}

        {status === 'loading' && <p className="py-10 text-center text-sm text-gray-500">正在加载招聘信息…</p>}
        {status === 'error' && <p className="py-10 text-center text-sm text-gray-500">暂时无法读取招聘信息，请稍后再试。</p>}
        {status === 'ready' && postings.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <Inbox size={28} className="mx-auto text-gray-300" />
            <p className="mt-3 text-sm text-gray-600">暂时没有新的招聘信息，我们会持续整理更新。</p>
          </div>
        )}
        {status === 'ready' && postings.length > 0 && results.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <Search size={28} className="mx-auto text-gray-300" />
            <p className="mt-3 text-sm text-gray-600">没有符合条件的招聘。</p>
            <p className="mt-1 text-xs text-gray-400">可以减少筛选条件{!filters.showExpired ? '，或查看已截止的招聘' : ''}。</p>
            <div className="mt-4 flex justify-center gap-2">
              <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white">清除全部条件</button>
              {!filters.showExpired && <button type="button" onClick={() => setFilters({ ...filters, showExpired: true })} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600">包含已截止</button>}
            </div>
          </div>
        )}
        <div className="space-y-3">
          {results.map(({ posting, matchedPositions, matchedSession }) => (
            <PostingCard key={posting.id} posting={posting} matchedPositions={matchedPositions} matchedSession={matchedSession} />
          ))}
        </div>
      </div>

      {sheetOpen && (
        <JobFilterSheet
          options={options}
          filters={filters}
          onChange={setFilters}
          onClose={() => setSheetOpen(false)}
          resultCount={results.length}
        />
      )}
    </div>
  )
}
