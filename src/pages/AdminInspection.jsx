import InteractiveInspection from '../components/InteractiveInspection'
import { Link, useSearchParams } from 'react-router-dom'
import { INSPECTION_MODULES, resolveInspectionSelection } from '../data/adminInspection'

const labels = {
  mission: '训练目标', shift: '班次场景', location: '地点', time: '时间', situation: '情境',
  sections: '知识单元', knowledge: '岗位知识', knowledgeCards: '知识卡片', referenceGroups: '分类参考',
  title: '标题', items: '要点', term: '词汇', ipa: '音标', meaning: '含义', example: '例句',
  cue: '使用场景', line: '表达', role: '角色', prompt: '客人问题', question: '题目',
  options: '选项', id: '编号', text: '内容', correctOptionId: '正确选项', explanation: '解析',
  correct: '是否正确', setting: '背景', objective: '学习目标', dialogue: '对话',
  speaker: '说话人', translation: '翻译', body: '说明', task: '回答要求', focus: '训练重点',
  checkpoints: '检查要点', watchOuts: '注意事项', name: '名称', profile: '特点',
  examples: '示例', build: '构成', fit: '适用性', drinkComparison: '饮品比较', serviceSequence: '服务顺序',
}

function Content({ value }) {
  if (value === null || value === undefined || value === '') return <p className="text-sm text-slate-500">此项暂无内容。</p>
  if (Array.isArray(value)) return <ol className="space-y-3">{value.map((item, index) => <li key={index} className="rounded-lg border border-slate-200 p-3"><Content value={item} /></li>)}</ol>
  if (typeof value === 'object') return <dl className="space-y-3">{Object.entries(value).filter(([, item]) => item !== undefined && item !== null).map(([key, item]) => (
    <div key={key}><dt className="mb-1 text-xs font-semibold text-slate-500">{labels[key] || key}</dt><dd className="break-words"><Content value={item} /></dd></div>
  ))}</dl>
  return <p className="whitespace-pre-wrap text-sm leading-7 text-slate-800">{typeof value === 'boolean' ? (value ? '是' : '否') : String(value)}</p>
}

export default function AdminInspection() {
  const [params, setParams] = useSearchParams()
  const { module, lesson, section } = resolveInspectionSelection(params)
  const sectionIndex = lesson.sections.indexOf(section)
  const select = (moduleId, lessonId, sectionId) => setParams({ module: moduleId, lesson: lessonId, section: sectionId, view: params.get('view') === 'interactive' ? 'interactive' : 'content' })
  const moveSection = (offset) => {
    const next = lesson.sections[sectionIndex + offset]
    if (next) select(module.id, lesson.id, next.id)
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white px-5 py-7">
        <div className="mx-auto max-w-6xl">
          <Link to="/profile" className="text-sm font-semibold text-blue-700">退出巡检，返回我的账户</Link>
          <h1 className="mt-4 text-2xl font-bold text-slate-950">管理员只读巡检</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">任意选择章节与步骤，无需打卡或录音。这里展示现有课程内容，不写入学习进度，也不调用 AI。</p>
          <p className="mt-2 text-xs leading-5 text-amber-800">支持内容审阅和实际课程组件的临时交互。录音、云端语音、AI 评分与报告生成未接入；试操作不进入真实学习记录。</p>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-5 px-5 py-6 md:grid-cols-[260px_1fr]">
        <aside className="space-y-4">
          <label className="block text-sm font-semibold text-slate-700">模块
            <select value={module.id} onChange={event => {
              const next = INSPECTION_MODULES.find(item => item.id === event.target.value)
              select(next.id, next.lessons[0].id, next.lessons[0].sections[0].id)
            }} className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-3">
              {INSPECTION_MODULES.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </label>
          <nav aria-label="课程章节" className="max-h-96 space-y-2 overflow-y-auto md:max-h-[65vh]">
            {module.lessons.map(item => <button key={item.id} type="button" aria-current={item.id === lesson.id ? 'page' : undefined}
              onClick={() => select(module.id, item.id, item.sections[0].id)}
              className={`w-full rounded-lg border p-3 text-left text-sm leading-6 ${item.id === lesson.id ? 'border-blue-300 bg-blue-50 text-blue-900' : 'border-slate-200 bg-white text-slate-700'}`}>{item.title}</button>)}
          </nav>
        </aside>
        <section className="min-w-0">
          <h2 className="text-xl font-semibold text-slate-950">{lesson.title}</h2>
          <nav aria-label="任意跳转课程步骤" className="my-4 flex flex-wrap gap-2">
            {lesson.sections.map(item => <button key={item.id} type="button" aria-current={item.id === section.id ? 'step' : undefined}
              onClick={() => select(module.id, lesson.id, item.id)}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${item.id === section.id ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white text-slate-700'}`}>{item.title}</button>)}
          </nav>
          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-4 font-semibold text-slate-950">{section.title}</h3>
            <div className="mb-4 flex gap-2">{[['content', '内容与答案'], ['interactive', '实际组件 · 临时交互']].map(([view, label]) => <button key={view} type="button" aria-pressed={(params.get('view') || 'content') === view} onClick={() => setParams({ module: module.id, lesson: lesson.id, section: section.id, view })} className="rounded-lg border px-3 py-2 text-sm aria-pressed:bg-blue-50">{label}</button>)}</div>
            {params.get('view') === 'interactive' ? <InteractiveInspection moduleId={module.id} lessonId={lesson.id} sectionId={section.id} /> : <Content value={section.content} />}
          </article>
          <div className="mt-4 flex justify-between gap-3">
            <button type="button" disabled={sectionIndex === 0} onClick={() => moveSection(-1)} className="rounded-lg border bg-white px-4 py-3 text-sm disabled:opacity-40">上一步</button>
            <button type="button" disabled={sectionIndex === lesson.sections.length - 1} onClick={() => moveSection(1)} className="rounded-lg bg-blue-600 px-4 py-3 text-sm text-white disabled:opacity-40">跳过要求，查看下一步</button>
          </div>
        </section>
      </div>
    </main>
  )
}
