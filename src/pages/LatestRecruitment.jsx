// src/pages/LatestRecruitment.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, Calendar, ChevronDown, ChevronLeft, ExternalLink, MapPin, Newspaper, ShieldAlert, Ship } from 'lucide-react'
import { JOB_DEPARTMENTS, isJobPostingExpired, listPublishedJobPostings } from '../services/jobPostingService'

function DetailRow({ label, value }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <p className="mt-0.5 whitespace-pre-line text-sm text-gray-700">{value}</p>
    </div>
  )
}

function PostingCard({ posting }) {
  const [open, setOpen] = useState(false)
  const expired = isJobPostingExpired(posting)
  const date = posting.source_published_on || posting.published_at?.slice(0, 10)

  return (
    <article className={`rounded-xl bg-white p-5 shadow-sm ${expired ? 'opacity-60' : ''}`}>
      <button type="button" onClick={() => setOpen(!open)} className="w-full text-left" aria-expanded={open}>
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Newspaper size={14} />{posting.source_name}</span>
          {date && <span className="flex items-center gap-1"><Calendar size={14} />{date}</span>}
          {posting.deadline && (
            <span className={`rounded-full px-2 py-0.5 font-medium ${expired ? 'bg-gray-100 text-gray-500' : 'bg-orange-100 text-orange-700'}`}>
              {expired ? '已截止' : `截止 ${posting.deadline}`}
            </span>
          )}
        </div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold text-gray-800">{posting.title}</h3>
          <ChevronDown size={20} className={`mt-1 flex-shrink-0 text-gray-400 transition ${open ? 'rotate-180' : ''}`} />
        </div>
        <p className="mt-2 text-sm text-gray-600">{posting.summary}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {posting.cruise_lines.map((line) => (
            <span key={line} className="flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-700"><Ship size={12} />{line}</span>
          ))}
          {posting.departments.map((department) => (
            <span key={department} className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700"><Briefcase size={12} />{department}</span>
          ))}
        </div>
      </button>

      {open && (
        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          <DetailRow label="招聘岗位" value={posting.positions.join('、')} />
          <DetailRow label="招聘机构" value={posting.agency} />
          <DetailRow label="面试/报名地点" value={posting.locations} />
          <DetailRow label="岗位要求" value={posting.requirements} />
          <DetailRow label="薪资" value={posting.salary} />
          <a
            href={posting.source_url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white"
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
    () => JOB_DEPARTMENTS.filter((item) => postings.some((posting) => posting.departments.includes(item))),
    [postings],
  )
  const visible = department ? postings.filter((posting) => posting.departments.includes(department)) : postings

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 pt-16 pb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/jobs/channels')} className="text-white hover:text-purple-200" aria-label="返回">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-white">最新招聘动态</h1>
        </div>
        <p className="mt-2 text-sm text-white/80">整理自公开招聘推文，逐条人工核对</p>
      </div>

      <div className="space-y-4 px-6 py-6">
        <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <ShieldAlert size={16} className="mt-0.5 flex-shrink-0" />
          <p>信息以原文为准。正规邮轮招聘不会要求先交培训费、押金或“保录取”费用，遇到此类要求请提高警惕。</p>
        </div>

        {availableDepartments.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {['', ...availableDepartments].map((item) => (
              <button
                key={item || 'all'}
                type="button"
                onClick={() => setDepartment(item)}
                className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${department === item ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 shadow-sm'}`}
              >
                {item || '全部'}
              </button>
            ))}
          </div>
        )}

        {status === 'loading' && <p className="py-10 text-center text-sm text-gray-500">正在加载招聘信息…</p>}
        {status === 'error' && <p className="py-10 text-center text-sm text-gray-500">暂时无法读取招聘信息，请稍后再试。</p>}
        {status === 'ready' && visible.length === 0 && (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <MapPin size={28} className="mx-auto text-gray-300" />
            <p className="mt-3 text-sm text-gray-600">暂时没有新的招聘信息，我们会持续整理更新。</p>
          </div>
        )}
        {visible.map((posting) => <PostingCard key={posting.id} posting={posting} />)}
      </div>
    </div>
  )
}
