import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { RETAIL_BRANDS, RETAIL_CONCESSIONS, RETAIL_BRAND_SOURCES, filterRetailBrands, matchingConcessions } from '../../data/retailBrandCatalog'
import { moduleComplete, moduleProgressKey } from '../../data/retailModuleProgress'
import useRetailPracticeProgress from '../../hooks/useRetailPracticeProgress'
import { useTrainingInspection } from '../../hooks/useTrainingInspection'
import RetailModulePractice from '../../components/training/RetailModulePractice'
export default function RetailBrandLibrary() {
 const inspection=useTrainingInspection(), practice=useRetailPracticeProgress({readOnly:inspection})
 const [params]=useSearchParams()
 const focusedBrand=RETAIL_BRANDS.find(brand=>brand.id===params.get('brand'))
 const [filters,setFilters]=useState({query:focusedBrand?.name || '',operator:'',ship:'',category:'',evidence:''})
 const filtered=filterRetailBrands(filters)
 const change=(key,value)=>setFilters({...filters,[key]:value,...(key==='operator'?{ship:''}:{})})
 const options=key=>[...new Set(RETAIL_CONCESSIONS.filter(record=>key!=='ship' || !filters.operator || record.operator===filters.operator).map(record=>record[key]))]
 const complete=RETAIL_BRANDS.filter(brand=>moduleComplete(practice.moduleProgress[moduleProgressKey(brand.lesson)])).length
 return <div className="min-h-screen bg-slate-50 px-5 py-9"><main className="mx-auto max-w-5xl space-y-6">
  <nav className="flex flex-wrap gap-5 text-sm font-semibold text-blue-700"><Link to="/programs/retail">← Retail 职位包</Link><Link to="/programs/retail/foundation?view=knowledge">产品与运营课程</Link><Link to="/programs/retail/specialists">三条专修课程 →</Link></nav>
  <header><p className="text-sm font-semibold text-blue-700">RETAIL · BRAND FOUNDATIONS</p><h1 className="mt-2 text-3xl font-semibold">品牌基础与船店样本</h1><p className="mt-3 leading-7 text-slate-600">先学品类，再认识品牌，最后核对自己船上的门店。首批 {RETAIL_BRANDS.length} 个品牌 · 已完成 {complete} 个基础自检。</p></header>
  <aside className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6">这里收录的是有来源的历史经营样本，并非所有公司、所有船舶的实时在售清单。资料核验于 2026-10-05；当前库存、价格、授权及售后需向门店核实。Beauty Specialist、Chanel Ambassador 与 Watch Specialist 已有独立专修课程，此页提供品牌入门。</aside>
  <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
   <label className="text-sm sm:col-span-2 lg:col-span-4">搜索品牌<input value={filters.query} onChange={e=>change('query',e.target.value)} className="mt-2 block w-full rounded border border-slate-300 p-2" placeholder="CHANEL、腕表、皮具…"/></label>
   {[['operator','零售运营公司'],['ship','船舶'],['category','门店商品类型']].map(([key,label])=><label key={key} className="text-sm">{label}<select value={filters[key]} onChange={e=>change(key,e.target.value)} className="mt-2 block w-full rounded border border-slate-300 p-2"><option value="">全部</option>{options(key).map(value=><option key={value}>{value}</option>)}</select></label>)}
   <label className="text-sm">售卖证据<select value={filters.evidence} onChange={e=>change('evidence',e.target.value)} className="mt-2 block w-full rounded border border-slate-300 p-2"><option value="">全部</option><option value="documented">有历史船店样本</option><option value="unassigned">尚无船店关联</option></select></label>
  </section>
  <p role="status" className="text-sm text-slate-600">找到 {filtered.length} 个品牌</p>
  {!filtered.length && <button className="text-blue-700" onClick={()=>setFilters({query:'',operator:'',ship:'',category:'',evidence:''})}>没有匹配记录，清除筛选</button>}
  <section className="space-y-4">{filtered.map(brand=><details key={brand.id} open={focusedBrand?.id===brand.id || undefined} className="rounded-lg border border-slate-200 bg-white p-5"><summary className="cursor-pointer text-lg font-semibold">{brand.name}<span className="ml-3 text-xs font-normal text-slate-500">{moduleComplete(practice.moduleProgress[moduleProgressKey(brand.lesson)])?'基础自检完成':'品牌入门'}</span></summary><div className="mt-5 space-y-5">
   <p className="leading-7 text-slate-700">{brand.intro}</p><a href={brand.url} target="_blank" rel="noreferrer" className="text-sm text-blue-700 underline">品牌官方资料 · 核验 {brand.verifiedAt}</a>
   <Link to={'/programs/retail/foundation?view=knowledge&module='+brand.moduleId} className="block text-sm font-semibold text-blue-700">先学对应品类 →</Link>
   <section><h2 className="font-semibold">匹配的船店经营样本</h2>{matchingConcessions(brand.id,filters).map(record=>{const source=RETAIL_BRAND_SOURCES[record.sourceId];return <article key={record.id} className="mt-3 rounded bg-slate-50 p-4 text-sm leading-6"><p className="font-semibold">{record.operator} · {record.ship}</p><p>邮轮公司：{record.cruiseLine}</p><p>店铺：{record.store || '公告未注明具体店铺'} · {record.category}</p><p className="text-amber-800">历史公告已核验，当前在售待确认</p><a href={source.url} target="_blank" rel="noreferrer" className="text-blue-700 underline">{source.label}</a><p className="text-xs text-slate-500">公告日期：{source.published || '页面未提供精确日期'} · 来源核验：{record.verifiedAt}</p>{record.category==='二手奢侈品' && <p>运营商对二手商品的描述不等同于品牌官方认证或新品授权；证书、表况及售后逐件核对。</p>}</article>})}{!matchingConcessions(brand.id).length && <p className="mt-3 text-sm text-slate-500">仅有品牌基础资料，本批未建立可核验的船店售卖关联。</p>}</section>
   <RetailModulePractice key={brand.id} lesson={brand.lesson} question={brand.lesson.question} progress={practice.moduleProgress} onSave={practice.updateModuleProgress} readOnly={inspection}/>
  </div></details>)}</section>
 </main></div>
}
