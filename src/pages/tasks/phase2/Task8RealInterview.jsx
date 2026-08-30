import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Edit3,
  LoaderCircle,
  MessageSquareText,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react'
import TaskLayout from '../../../components/TaskLayout'
import { positionConfig } from '../../../data/interviewQuestions'
import {
  createRealInterviewRecord,
  deleteRealInterviewRecord,
  listRealInterviewRecords,
  updateRealInterviewRecord,
} from '../../../services/realInterviewService'
import { markLocalTaskComplete, syncLocalPathProfile } from '../../../services/userPathService'

const statusOptions = [
  { value: 'scheduled', label: '已预约' },
  { value: 'completed', label: '已完成' },
  { value: 'waiting', label: '等待结果' },
  { value: 'next_round', label: '进入下一轮' },
  { value: 'passed', label: '已通过' },
  { value: 'rejected', label: '未通过' },
  { value: 'withdrawn', label: '已放弃' },
]

const roundOptions = [
  { value: 'screening', label: '初筛' },
  { value: 'first', label: '第一轮' },
  { value: 'second', label: '第二轮' },
  { value: 'final', label: '终面' },
]

const formatOptions = [
  { value: 'video', label: '在线视频' },
  { value: 'phone', label: '电话' },
  { value: 'onsite', label: '线下' },
  { value: 'recorded', label: '录制视频' },
]

const completedStatuses = new Set(['completed', 'waiting', 'next_round', 'passed', 'rejected'])

const readTargetPosition = () => {
  try {
    const result = JSON.parse(localStorage.getItem('task2_result') || '{}')
    return result.selectedTargetJob || result.target_position || ''
  } catch (error) {
    console.warn('Unable to read target position:', error)
    return ''
  }
}

const createEmptyForm = () => ({
  cruiseCompany: '',
  targetPosition: readTargetPosition(),
  interviewDate: '',
  interviewRound: 'first',
  interviewFormat: 'video',
  platform: '',
  interviewerName: '',
  status: 'scheduled',
  questionsText: '',
  overallConfidence: '',
  interviewerFeedback: '',
  nextAction: '',
  nextActionAt: '',
  notes: '',
  consentAnonymousQuestions: false,
})

const toLocalDateTimeInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

const toIsoDate = (value) => (value ? new Date(value).toISOString() : null)

const parseQuestions = (value) =>
  value
    .split('\n')
    .map((question) => question.trim())
    .filter(Boolean)
    .map((question) => ({ question }))

const formatQuestions = (questions) =>
  (Array.isArray(questions) ? questions : [])
    .map((item) => (typeof item === 'string' ? item : item?.question))
    .filter(Boolean)
    .join('\n')

const getLabel = (options, value) => options.find((item) => item.value === value)?.label || value

const statusTone = {
  scheduled: 'bg-blue-50 text-blue-700',
  completed: 'bg-slate-100 text-slate-700',
  waiting: 'bg-amber-50 text-amber-700',
  next_round: 'bg-indigo-50 text-indigo-700',
  passed: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
  withdrawn: 'bg-slate-100 text-slate-600',
}

export default function Task8RealInterview() {
  const [records, setRecords] = useState([])
  const [form, setForm] = useState(createEmptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const canComplete = useMemo(
    () => records.some((record) => completedStatuses.has(record.status)),
    [records]
  )

  useEffect(() => {
    let active = true

    listRealInterviewRecords()
      .then((data) => {
        if (active) setRecords(data)
      })
      .catch((loadError) => {
        console.error('加载真实面试记录失败:', loadError)
        if (active) setError('真实面试记录暂时无法加载，请稍后重试。')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const resetForm = () => {
    setForm(createEmptyForm())
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  const startEditing = (record) => {
    setForm({
      cruiseCompany: record.cruise_company || '',
      targetPosition: record.target_position || '',
      interviewDate: toLocalDateTimeInput(record.interview_date),
      interviewRound: record.interview_round || 'first',
      interviewFormat: record.interview_format || 'video',
      platform: record.platform || '',
      interviewerName: record.interviewer_name || '',
      status: record.status || 'scheduled',
      questionsText: formatQuestions(record.questions),
      overallConfidence: record.overall_confidence || '',
      interviewerFeedback: record.interviewer_feedback || '',
      nextAction: record.next_action || '',
      nextActionAt: toLocalDateTimeInput(record.next_action_at),
      notes: record.notes || '',
      consentAnonymousQuestions: Boolean(record.consent_anonymous_questions),
    })
    setEditingId(record.id)
    setShowForm(true)
    setMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!form.cruiseCompany.trim() || !form.targetPosition) {
      setError('请填写船公司并选择面试岗位。')
      return
    }

    setSaving(true)
    const payload = {
      ...form,
      interviewDate: toIsoDate(form.interviewDate),
      nextActionAt: toIsoDate(form.nextActionAt),
      questions: parseQuestions(form.questionsText),
    }

    try {
      if (editingId) {
        const updated = await updateRealInterviewRecord(editingId, payload)
        setRecords((current) => current.map((record) => (record.id === editingId ? updated : record)))
        setMessage('面试记录已更新。')
      } else {
        const created = await createRealInterviewRecord(payload)
        setRecords((current) => [created, ...current])
        setMessage('面试记录已保存。')
      }
      resetForm()
    } catch (saveError) {
      console.error('保存真实面试记录失败:', saveError)
      setError('保存失败，请检查网络后重试。')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (record) => {
    if (!window.confirm(`确定删除 ${record.cruise_company} 的这条面试记录吗？`)) return

    setError('')
    try {
      await deleteRealInterviewRecord(record.id)
      setRecords((current) => current.filter((item) => item.id !== record.id))
      setMessage('面试记录已删除。')
    } catch (deleteError) {
      console.error('删除真实面试记录失败:', deleteError)
      setError('删除失败，请稍后重试。')
    }
  }

  const completeTask8 = async () => {
    markLocalTaskComplete(8)
    await syncLocalPathProfile({
      interview_status: 'real_interview_recorded',
      application_stage: 'interview',
      career_stage: 'interview_process',
      last_completed_task_id: 8,
      lead_score: 94,
    })
  }

  return (
    <TaskLayout
      taskId={8}
      taskTitle="真实面试跟进"
      canComplete={canComplete}
      onComplete={completeTask8}
    >
      <div className="space-y-5">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-blue-700">从邀请到结果</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">把真实面试变成可跟进的申请记录</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                记录面试时间、真实提问、反馈和下一步。完成一次真实面试后，才可提交任务8。
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowForm((value) => !value)
                setEditingId(null)
                setForm(createEmptyForm())
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              {showForm ? <ChevronDown size={17} /> : <Plus size={17} />}
              {showForm ? '收起表单' : '记录面试'}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">全部记录</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{records.length}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">等待结果</p>
              <p className="mt-1 text-lg font-semibold text-amber-700">
                {records.filter((record) => record.status === 'waiting').length}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">进入下一轮</p>
              <p className="mt-1 text-lg font-semibold text-emerald-700">
                {records.filter((record) => ['next_round', 'passed'].includes(record.status)).length}
              </p>
            </div>
          </div>
        </section>

        {message && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <CheckCircle2 size={17} /> {message}
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-blue-700">{editingId ? '更新记录' : '新增记录'}</p>
                <h2 className="mt-1 font-semibold text-slate-950">{editingId ? '补充这次面试结果' : '先记录面试安排'}</h2>
              </div>
              {editingId && (
                <button type="button" onClick={resetForm} className="inline-flex items-center gap-1 text-sm font-medium text-slate-600">
                  <RotateCcw size={15} /> 取消编辑
                </button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                船公司 <span className="text-red-500">*</span>
                <input
                  value={form.cruiseCompany}
                  onChange={(event) => updateField('cruiseCompany', event.target.value)}
                  placeholder="例如 Royal Caribbean"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                面试岗位 <span className="text-red-500">*</span>
                <select
                  value={form.targetPosition}
                  onChange={(event) => updateField('targetPosition', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">请选择岗位</option>
                  {form.targetPosition && !positionConfig.some((position) => position.key === form.targetPosition) && (
                    <option value={form.targetPosition}>{form.targetPosition}</option>
                  )}
                  {positionConfig.map((position) => (
                    <option key={position.key} value={position.key}>{position.nameZh} · {position.nameEn}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                面试时间
                <input
                  type="datetime-local"
                  value={form.interviewDate}
                  onChange={(event) => updateField('interviewDate', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                当前状态
                <select
                  value={form.status}
                  onChange={(event) => updateField('status', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                面试轮次
                <select
                  value={form.interviewRound}
                  onChange={(event) => updateField('interviewRound', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {roundOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                面试形式
                <select
                  value={form.interviewFormat}
                  onChange={(event) => updateField('interviewFormat', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {formatOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>

              <label className="text-sm font-medium text-slate-700">
                平台或地点
                <input
                  value={form.platform}
                  onChange={(event) => updateField('platform', event.target.value)}
                  placeholder="Teams、Zoom 或城市"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                面试官
                <input
                  value={form.interviewerName}
                  onChange={(event) => updateField('interviewerName', event.target.value)}
                  placeholder="可选"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            <div className="mt-5 border-t border-slate-200 pt-5">
              <div className="mb-4 flex items-center gap-2">
                <MessageSquareText size={18} className="text-blue-700" />
                <h3 className="font-semibold text-slate-950">面试后复盘</h3>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                真实面试问题
                <textarea
                  value={form.questionsText}
                  onChange={(event) => updateField('questionsText', event.target.value)}
                  placeholder={'每行一个问题，例如：\nTell me about yourself.\nHow do you handle an upset guest?'}
                  className="mt-2 h-28 w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  自我表现感受
                  <select
                    value={form.overallConfidence}
                    onChange={(event) => updateField('overallConfidence', event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">暂不评价</option>
                    <option value="1">1 · 很不理想</option>
                    <option value="2">2 · 有明显卡顿</option>
                    <option value="3">3 · 基本完成</option>
                    <option value="4">4 · 表现稳定</option>
                    <option value="5">5 · 很有把握</option>
                  </select>
                </label>

                <label className="text-sm font-medium text-slate-700">
                  下一步时间
                  <input
                    type="datetime-local"
                    value={form.nextActionAt}
                    onChange={(event) => updateField('nextActionAt', event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>

              <label className="mt-4 block text-sm font-medium text-slate-700">
                面试官反馈
                <textarea
                  value={form.interviewerFeedback}
                  onChange={(event) => updateField('interviewerFeedback', event.target.value)}
                  placeholder="面试官强调了什么，给了哪些反馈"
                  className="mt-2 h-20 w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="mt-4 block text-sm font-medium text-slate-700">
                下一步行动
                <input
                  value={form.nextAction}
                  onChange={(event) => updateField('nextAction', event.target.value)}
                  placeholder="例如：周五前发送感谢邮件并补充证书"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="mt-4 block text-sm font-medium text-slate-700">
                复盘备注
                <textarea
                  value={form.notes}
                  onChange={(event) => updateField('notes', event.target.value)}
                  placeholder="哪些回答需要回任务7重练"
                  className="mt-2 h-20 w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="mt-4 flex items-start gap-3 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                <input
                  type="checkbox"
                  checked={form.consentAnonymousQuestions}
                  onChange={(event) => updateField('consentAnonymousQuestions', event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300"
                />
                同意将问题匿名汇总到岗位题库，不公开姓名、联系方式或具体申请信息。
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {saving ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? '保存中...' : editingId ? '更新面试记录' : '保存面试记录'}
            </button>
          </form>
        )}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-950">我的真实面试</h2>
            <span className="text-xs text-slate-500">仅本人可见</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white p-8 text-sm text-slate-600">
              <LoaderCircle size={18} className="animate-spin" /> 正在加载记录
            </div>
          ) : records.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
              <ClipboardList size={28} className="mx-auto text-slate-400" />
              <h3 className="mt-3 font-semibold text-slate-950">还没有真实面试记录</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">收到邀请后先记录时间；面试结束再回来补问题和结果。</p>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Plus size={17} /> 记录第一场面试
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => {
                const questionCount = Array.isArray(record.questions) ? record.questions.length : 0
                const position = positionConfig.find((item) => item.key === record.target_position)
                return (
                  <article key={record.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-950">{record.cruise_company}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusTone[record.status] || statusTone.completed}`}>
                            {getLabel(statusOptions, record.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          {position ? `${position.nameZh} · ${position.nameEn}` : record.target_position}
                          {' · '}{getLabel(roundOptions, record.interview_round)}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button type="button" onClick={() => startEditing(record)} title="编辑记录" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-700">
                          <Edit3 size={16} />
                        </button>
                        <button type="button" onClick={() => handleDelete(record)} title="删除记录" className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                      <div className="flex items-center gap-2 text-slate-600">
                        <CalendarDays size={15} />
                        {record.interview_date ? new Date(record.interview_date).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '时间待定'}
                      </div>
                      <div className="text-slate-600">{getLabel(formatOptions, record.interview_format)}</div>
                      <div className="text-slate-600">{questionCount ? `${questionCount} 道真题` : '待补面试问题'}</div>
                    </div>

                    {(record.next_action || record.interviewer_feedback) && (
                      <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                        {record.next_action && <p><span className="font-semibold">下一步：</span>{record.next_action}</p>}
                        {record.interviewer_feedback && <p><span className="font-semibold">反馈：</span>{record.interviewer_feedback}</p>}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <p className="font-semibold">任务完成条件</p>
          <p className="mt-1">至少保存一条已完成、等待结果、进入下一轮、通过或未通过的真实面试记录。</p>
        </section>
      </div>
    </TaskLayout>
  )
}
