import { useEffect } from 'react'
import { X } from 'lucide-react'
import { EMPTY_FILTERS, filterValueLabel, getVisibleCategories } from '../../data/jobPostingSearch'

export default function JobFilterSheet({ options, filters, onChange, onClose, resultCount }) {
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [onClose])

  const toggle = (key, value) => {
    const selected = filters[key] || []
    onChange({ ...filters, [key]: selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value] })
  }
  const categories = getVisibleCategories(options, filters)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/40 md:items-center md:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="筛选招聘"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-white shadow-xl md:max-w-lg md:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-bold text-gray-900">筛选招聘</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100" aria-label="关闭"><X size={18} /></button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {categories.length === 0 && <p className="text-sm text-gray-500">目前招聘数量还少，暂时没有可以筛选的选项。可以先用搜索框按岗位名查找。</p>}
          {categories.map((category) => (
            <section key={category.key}>
              <h3 className="mb-2 text-xs font-semibold text-gray-500">
                {category.label}
                {category.key === 'experience' && <span className="ml-1 font-normal text-gray-400">· 按单个岗位匹配</span>}
                {['cities', 'modes'].includes(category.key) && <span className="ml-1 font-normal text-gray-400">· 城市和方式需属于同一场面试</span>}
              </h3>
              <div className="flex flex-wrap gap-2">
                {category.values.map((value) => {
                  const active = (filters[category.key] || []).includes(value)
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggle(category.key, value)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${active ? 'bg-purple-600 text-white' : 'border border-gray-200 bg-white text-gray-600 hover:border-purple-300'}`}
                    >
                      {filterValueLabel(category.key, value)}
                    </button>
                  )
                })}
              </div>
            </section>
          ))}

          <section className="space-y-3 border-t border-gray-100 pt-4">
            <label className="flex items-center justify-between gap-3 text-sm text-gray-700">
              隐藏已截止的招聘
              <input type="checkbox" checked={!filters.showExpired} onChange={(event) => onChange({ ...filters, showExpired: !event.target.checked })} className="h-4 w-4 accent-purple-600" />
            </label>
            <div className="flex items-center justify-between gap-3 text-sm text-gray-700">
              排序
              <div className="flex rounded-lg bg-gray-100 p-0.5 text-xs">
                {[['latest', '最新发布'], ['interview', '近期面试']].map(([value, label]) => (
                  <button key={value} type="button" aria-pressed={filters.sort === value} onClick={() => onChange({ ...filters, sort: value })} className={`rounded-md px-3 py-1.5 font-medium ${filters.sort === value ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500'}`}>{label}</button>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="flex gap-3 border-t border-gray-100 px-5 py-4">
          <button type="button" onClick={() => onChange({ ...EMPTY_FILTERS, q: filters.q })} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600">清除筛选</button>
          <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700">查看 {resultCount} 条结果</button>
        </div>
      </div>
    </div>
  )
}
