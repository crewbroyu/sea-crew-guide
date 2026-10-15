// src/pages/LatestRecruitment.jsx
import { createElement, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, CalendarClock, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, GraduationCap, Inbox, MapPin, ShieldAlert, Ship, Wallet } from 'lucide-react'
import { JOB_DEPARTMENTS, isJobPostingExpired, listPublishedJobPostings } from '../services/jobPostingService'
import { getDepartmentTraining, getPostingDepartments, groupPositionsByDepartment } from '../data/jobPositionGroups'
import { trackProductEvent } from '../services/productAnalyticsService'

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

function PositionGroup({ posting, department, positions }) {
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
        {positions.map((position) => (
          <span key={position} className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700">{position}</span>
        ))}
      </div>
    </div>
  )
}

function PostingCard({ posting }) {
  const [open, setOpen] = useState(false)
  const expired = isJobPostingExpired(posting)
  const date = posting.source_published_on || posting.published_at?.slice(0, 10)
  const positions = [...new Set(posting.positions)]
  const groups = useMemo(() => groupPositionsByDepartment(posting.positions), [posting.positions])
  const collapsedDepartments = getPostingDepartments(posting)
  const hasTraining = groups.some((group) => getDepartmentTraining(group.department))

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
          {posting.deadline && (
            <span className={`ml-auto flex-shrink-0 rounded-full px-2 py-0.5 font-medium ${expired ? 'bg-gray-100 text-gray-500' : 'bg-orange-50 text-orange-600'}`}>
              {expired ? '已截止' : `截止 ${posting.deadline.slice(5)}`}
            </span>
          )}
        </div>

        <div className="mt-2 flex items-start gap-3">
          <h3 className="flex-1 text-base font-bold leading-snug text-gray-900 md:text-lg">{posting.title}</h3>
          <ChevronDown size={20} className={`mt-0.5 flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>

        {posting.cruise_lines.length > 0 && (
          <p className="mt-1.5 flex items-start gap-1.5 text-sm text-purple-700">
            <Ship size={14} className="mt-[3px] flex-shrink-0" />
            <span className={open ? '' : 'truncate'}>{posting.cruise_lines.join(' · ')}</span>
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
                {groups.map((group) => <PositionGroup key={group.department} posting={posting} {...group} />)}
              </div>
            </section>
          )}

          {groups.length === 0 && posting.departments.length > 0 && (
            <section>
              <h4 className="mb-2 text-xs font-semibold text-gray-500">涉及部门</h4>
              <DepartmentChips departments={posting.departments} />
            </section>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <InfoItem icon={Building2} label="招聘机构" value={posting.agency} />
            <InfoItem icon={MapPin} label="面试/报名地点" value={posting.locations} />
            <InfoItem icon={Wallet} label="薪资" value={posting.salary} />
            <InfoItem icon={CalendarClock} label="截止日期" value={posting.deadline} />
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
  const [postings, setPostings] = useState([])
  const [status, setStatus] = useState('loading')
  const [department, setDepartment] = useState('')

  useEffect(() => {
    let active = true
    listPublishedJobPostings()
      .then((data) => { if (active) { setPostings(data); setStatus('ready') } })
      .catch(() => { if (active) setStatus('error') })
    return () => { active = false }
  }, [])

  const availableDepartments = useMemo(
    () => JOB_DEPARTMENTS.filter((item) => postings.some((posting) => getPostingDepartments(posting).includes(item))),
    [postings],
  )
  const visible = department ? postings.filter((posting) => getPostingDepartments(posting).includes(department)) : postings
  const openCount = postings.filter((posting) => !isJobPostingExpired(posting)).length

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
            整理自公开招聘推文，逐条人工核对{status === 'ready' && openCount > 0 ? ` · ${openCount} 条进行中` : ''}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-4 px-4 py-5 md:px-6">
        <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900">
          <ShieldAlert size={16} className="mt-0.5 flex-shrink-0" />
          <p>信息以原文为准。正规邮轮招聘不会要求先交培训费、押金或“保录取”费用。</p>
        </div>

        {availableDepartments.length > 1 && (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
            {['', ...availableDepartments].map((item) => (
              <button
                key={item || 'all'}
                type="button"
                onClick={() => setDepartment(item)}
                className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${department === item ? 'bg-purple-600 text-white' : 'border border-gray-200 bg-white text-gray-600 hover:border-purple-300'}`}
              >
                {item || '全部'}
              </button>
            ))}
          </div>
        )}

        {status === 'loading' && <p className="py-10 text-center text-sm text-gray-500">正在加载招聘信息…</p>}
        {status === 'error' && <p className="py-10 text-center text-sm text-gray-500">暂时无法读取招聘信息，请稍后再试。</p>}
        {status === 'ready' && visible.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <Inbox size={28} className="mx-auto text-gray-300" />
            <p className="mt-3 text-sm text-gray-600">暂时没有新的招聘信息，我们会持续整理更新。</p>
          </div>
        )}
        <div className="space-y-3">
          {visible.map((posting) => <PostingCard key={posting.id} posting={posting} />)}
        </div>
      </div>
    </div>
  )
}
