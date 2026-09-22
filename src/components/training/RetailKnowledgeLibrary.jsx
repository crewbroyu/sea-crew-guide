import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, BookOpen, Boxes, CheckCircle2, ChevronDown, ExternalLink, Search, ShieldCheck, Volume2 } from 'lucide-react'
import EdgeReadAloudHint from '../EdgeReadAloudHint'
import { retailKnowledgeCategories, retailKnowledgeModules, retailKnowledgeSources, retailKnowledgeVisuals } from '../../data/retailKnowledgeLibrary'
import { speakEnglish } from '../../services/ttsService'

const searchableText = (module) => [
  module.title,
  module.subtitle,
  module.category,
  ...module.terms.flat(),
  ...module.essentials,
].join(' ').toLowerCase()

function RetailKnowledgeVisual({ visual }) {
  if (!visual) return null
  const itemGridClass = visual.items?.length === 9
    ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-9'
    : visual.items?.length === 8
      ? 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-8'
      : visual.items?.length === 7
        ? 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-7'
        : visual.items?.length > 3
          ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
          : 'grid-cols-2 sm:grid-cols-3'
  return (
    <figure className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <h3 className="text-sm font-bold text-slate-950">{visual.title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">{visual.description}</p>
      </div>
      <img src={visual.image} alt={visual.alt} loading="lazy" decoding="async" className="h-auto w-full object-cover" />
      {visual.items?.length > 0 && (
        <figcaption className={`grid gap-px border-t border-slate-200 bg-slate-200 ${itemGridClass}`}>
          {visual.items.map((item, index) => <div key={item} className="bg-white px-2 py-2 text-center"><p className="text-[10px] font-medium text-slate-400">{String(index + 1).padStart(2, '0')}</p><p className="mt-0.5 text-xs font-semibold text-slate-800">{item}</p></div>)}
        </figcaption>
      )}
    </figure>
  )
}

export default function RetailKnowledgeLibrary() {
  const [category, setCategory] = useState('All')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState(retailKnowledgeModules[0].id)

  const filteredModules = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return retailKnowledgeModules.filter((module) => (
      (category === 'All' || module.category === category)
      && (!normalizedQuery || searchableText(module).includes(normalizedQuery))
    ))
  }, [category, query])

  return (
    <div className="mt-6 space-y-5">
      <section className="border-l-4 border-blue-600 bg-white px-5 py-4">
        <div className="flex items-start gap-3">
          <BookOpen size={22} className="mt-0.5 shrink-0 text-blue-700" />
          <div>
            <p className="text-xs font-semibold text-blue-700">RETAIL KNOWLEDGE LIBRARY</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-950">产品与运营上岗手册</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">主课程教你完成一次销售，这里补齐跨柜台产品词汇、仓储工作和安全边界。先学自己负责的柜台，再逐步横向扩展。</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-center">
          <div><p className="text-xl font-bold text-slate-950">{retailKnowledgeModules.length}</p><p className="text-xs text-slate-500">知识模块</p></div>
          <div><p className="text-xl font-bold text-slate-950">{retailKnowledgeModules.reduce((sum, module) => sum + module.terms.length, 0)}+</p><p className="text-xs text-slate-500">岗位词汇</p></div>
          <div><p className="text-xl font-bold text-slate-950">2</p><p className="text-xs text-slate-500">运营模块</p></div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <label className="relative block">
          <Search size={17} className="pointer-events-none absolute left-3 top-3 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索 tote bag、Eco-Drive、stocktake、Tylenol…" className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </label>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {retailKnowledgeCategories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${category === item ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{item === 'All' ? '全部' : item === 'Operations' ? '运营' : '产品'}</button>)}
        </div>
      </section>

      <section className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {filteredModules.map((module, index) => {
          const isOpen = openId === module.id
          const visual = retailKnowledgeVisuals[module.id]
          return (
            <article key={module.id}>
              <button type="button" onClick={() => setOpenId(isOpen ? '' : module.id)} className="flex min-h-20 w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${module.category === 'Operations' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>{module.category === 'Operations' ? <Boxes size={19} /> : index + 1}</span>
                <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-slate-500">{module.category.toUpperCase()} · {module.terms.length} TERMS</span><span className="mt-1 block font-semibold leading-6 text-slate-950">{module.title}</span><span className="mt-0.5 block text-xs leading-5 text-slate-500">{module.subtitle}</span></span>
                <ChevronDown size={18} className={`shrink-0 text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && <div className="space-y-6 border-t border-slate-100 px-4 pb-6 pt-5 sm:px-6">
                <div className="rounded-lg bg-blue-50 p-4"><p className="text-xs font-semibold text-blue-700">YOU SHOULD BE ABLE TO</p><p className="mt-1 text-sm font-medium leading-6 text-blue-950">{module.objective}</p></div>
                <RetailKnowledgeVisual visual={visual} />

                <section>
                  <h3 className="text-sm font-bold text-slate-950">Essential vocabulary</h3>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {module.terms.map(([term, meaning]) => <div key={term} className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"><div><p className="text-sm font-semibold text-slate-900">{term}</p><p className="mt-0.5 text-xs text-slate-500">{meaning}</p></div><button type="button" onClick={() => speakEnglish(term, { position: 'retail' })} title={`Listen to ${term}`} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-blue-700 hover:bg-blue-50"><Volume2 size={17} /></button></div>)}
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-bold text-slate-950">What you need on the job</h3>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">{module.essentials.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 size={16} className="mt-1 shrink-0 text-emerald-600" /><span>{item}</span></li>)}</ul>
                </section>

                <section>
                  <h3 className="text-sm font-bold text-slate-950">Working sequence</h3>
                  <ol className="mt-3 grid gap-2 sm:grid-cols-2">{module.workflow.map((step, stepIndex) => <li key={step} className="flex gap-3 rounded-lg bg-slate-50 p-3 text-sm leading-5 text-slate-700"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{stepIndex + 1}</span><span>{step}</span></li>)}</ol>
                </section>

                <section>
                  <h3 className="text-sm font-bold text-slate-950">Say it on the sales floor</h3>
                  <div className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">{module.floorLines.map((line) => <div key={line} className="flex items-start justify-between gap-3 p-3"><p className="text-sm font-medium leading-6 text-slate-800">{line}</p><button type="button" onClick={() => speakEnglish(line, { position: 'retail' })} title="Listen" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-blue-700 hover:bg-blue-50"><Volume2 size={17} /></button></div>)}</div>
                </section>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4"><div className="flex gap-2"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-amber-700" /><div><p className="text-xs font-bold text-amber-900">SAFETY / AUTHORITY BOUNDARY</p><p className="mt-1 text-sm leading-6 text-amber-950">{module.boundary}</p></div></div></div>

                <div className="rounded-lg border border-slate-200 p-4"><p className="text-xs font-semibold text-slate-500">QUICK CHECK</p><p className="mt-2 text-sm font-semibold leading-6 text-slate-950">{module.check.question}</p><details className="mt-3"><summary className="cursor-pointer text-sm font-semibold text-blue-700">查看标准判断</summary><p className="mt-2 border-l-2 border-emerald-500 pl-3 text-sm leading-6 text-slate-700">{module.check.answer}</p></details></div>
                <EdgeReadAloudHint />
              </div>}
            </article>
          )
        })}
        {!filteredModules.length && <div className="px-5 py-10 text-center"><AlertTriangle size={24} className="mx-auto text-amber-500" /><p className="mt-3 text-sm font-semibold text-slate-800">没有找到对应内容</p><button type="button" onClick={() => { setQuery(''); setCategory('All') }} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">清除筛选<ArrowRight size={15} /></button></div>}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold text-blue-700">CONTENT BASIS</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">这是 CrewPathGuide 根据公开岗位标准、监管资料和品牌官方基础资料整理的原创上岗框架。实际品牌、库存、促销、药品和操作权限以雇主、船舶、航线及当期培训为准。</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">{retailKnowledgeSources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline">{source.label}<ExternalLink size={13} /></a>)}</div>
      </section>
    </div>
  )
}
