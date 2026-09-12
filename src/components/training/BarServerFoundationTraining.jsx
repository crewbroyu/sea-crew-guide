import { useMemo, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  GraduationCap,
  MapPin,
  Volume2,
} from 'lucide-react'
import {
  barServerFoundationDays,
  barServerFoundationSources,
  barServerShiftLabs,
  getCompletedFoundationDays,
} from '../../data/barServerFoundation'

const speakEnglish = (text) => {
  if (typeof window === 'undefined' || !window.speechSynthesis || !text) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.88
  window.speechSynthesis.speak(utterance)
}

export default function BarServerFoundationTraining({
  progress = {},
  onProgressChange,
  task6Completed = false,
  onStartTask6,
  onStartTask7,
  onStartScenarioTraining,
}) {
  const firstIncompleteDay = useMemo(
    () => barServerFoundationDays.find((day) => !progress[day.id]?.completedAt)?.id
      || barServerFoundationDays[0].id,
    [progress],
  )
  const [activeDayId, setActiveDayId] = useState(firstIncompleteDay)
  const completedDays = getCompletedFoundationDays(progress)
  const masteredDays = barServerFoundationDays.filter(
    (day) => Number(progress[day.id]?.practice?.bestScore || 0) >= 70,
  ).length
  const completionPercent = Math.round((completedDays / barServerFoundationDays.length) * 100)

  const updateDayProgress = (dayId, nextValue) => {
    onProgressChange?.({
      ...progress,
      [dayId]: {
        ...(progress[dayId] || {}),
        ...nextValue,
      },
    })
  }

  const selectAnswer = (day, optionId) => {
    const correct = optionId === day.quiz.correctOptionId
    updateDayProgress(day.id, {
      selectedOptionId: optionId,
      lastAnsweredAt: new Date().toISOString(),
      ...(correct ? { completedAt: progress[day.id]?.completedAt || new Date().toISOString() } : {}),
    })
  }

  const openNextDay = (dayIndex) => {
    const nextDay = barServerFoundationDays[dayIndex + 1]
    if (nextDay) setActiveDayId(nextDay.id)
  }

  return (
    <section className="mb-5 border-y border-slate-200 bg-white py-5 sm:rounded-lg sm:border sm:p-5 sm:shadow-sm">
      <div className="px-0">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <GraduationCap size={21} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-blue-700">Bar Server 内部基础课程</p>
            <h2 className="mt-1 text-lg font-bold text-slate-950">{barServerFoundationDays.length} 天酒水、卫生与服务基础训练</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              每天约 30-60 分钟。先掌握通用知识，再看邮轮公司菜单样本；任务7负责把知识变成英文回答和场景判断。
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>基础课程进度</span>
            <span>已学 {completedDays}/{barServerFoundationDays.length} · 会说 {masteredDays}/{barServerFoundationDays.length}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${completionPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
        {barServerFoundationDays.map((day, dayIndex) => {
          const shiftLab = barServerShiftLabs[day.id]
          const dayProgress = progress[day.id] || {}
          const selectedOption = day.quiz.options.find((option) => option.id === dayProgress.selectedOptionId)
          const isCorrect = selectedOption?.id === day.quiz.correctOptionId
          const isCompleted = Boolean(dayProgress.completedAt)
          const isActive = activeDayId === day.id

          return (
            <article key={day.id} className="py-1">
              <button
                type="button"
                onClick={() => setActiveDayId(isActive ? '' : day.id)}
                className="flex min-h-16 w-full items-center gap-3 py-3 text-left"
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${isCompleted ? 'bg-emerald-50 text-emerald-700' : isActive ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                  {isCompleted ? <CheckCircle2 size={19} /> : day.day}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium text-slate-500">DAY {day.day} · {day.duration}</span>
                  <span className="mt-0.5 block text-sm font-semibold leading-6 text-slate-900">{day.title}</span>
                  <span className={`mt-0.5 block text-xs ${dayProgress.practice ? Number(dayProgress.practice.bestScore || 0) >= 70 ? 'text-emerald-700' : 'text-amber-700' : 'text-slate-400'}`}>
                    {dayProgress.practice
                      ? `口头运用 ${dayProgress.practice.bestScore || 0}/100 · ${Number(dayProgress.practice.bestScore || 0) >= 70 ? '已达标' : '建议重练'}`
                      : '口头运用待任务7训练'}
                  </span>
                </span>
                <ChevronDown size={18} className={`shrink-0 text-slate-400 transition ${isActive ? 'rotate-180' : ''}`} />
              </button>

              {isActive && (
                <div className="pb-6 pl-0 sm:pl-12">
                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="text-xs font-semibold text-blue-700">TODAY&apos;S MISSION</p>
                    <p className="mt-1 text-sm font-medium leading-6 text-blue-950">{shiftLab?.mission || day.outcome}</p>
                  </div>

                  {shiftLab && (
                    <>
                      <section className="mt-5 border-y border-slate-200 py-4">
                        <div className="flex items-center gap-2 text-blue-700">
                          <MapPin size={16} />
                          <h3 className="text-xs font-bold">SHIFT BRIEFING</h3>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-700">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">{shiftLab.shift.location}</span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">{shiftLab.shift.time}</span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-700">{shiftLab.shift.situation}</p>
                      </section>

                      <section className="mt-5">
                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold text-blue-700">PRONUNCIATION DRILL</p>
                            <h3 className="mt-1 text-sm font-bold text-slate-950">Bar vocabulary you need on shift</h3>
                          </div>
                          <span className="shrink-0 text-xs text-slate-400">Common English IPA</span>
                        </div>
                        <div className="mt-3 divide-y divide-slate-100 border-y border-slate-100">
                          {shiftLab.vocabulary.map((item) => (
                            <div key={item.term} className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                  <p className="font-semibold text-slate-950">{item.term}</p>
                                  <p className="font-mono text-xs text-blue-700">{item.ipa}</p>
                                  <p className="text-xs text-slate-500">{item.meaning}</p>
                                </div>
                                <p className="mt-1 text-sm leading-6 text-slate-700">{item.example}</p>
                              </div>
                              <button type="button" onClick={() => speakEnglish(`${item.term}. ${item.example}`)} title={`Listen to ${item.term}`} aria-label={`Listen to ${item.term}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-blue-700 transition hover:border-blue-300 hover:bg-blue-50">
                                <Volume2 size={17} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="mt-5">
                        <p className="text-xs font-semibold text-blue-700">SAY IT LIKE A BAR SERVER</p>
                        <div className="mt-3 divide-y divide-slate-100 border-y border-slate-100">
                          {shiftLab.serviceLines.map((item) => (
                            <div key={item.line} className="flex items-start gap-3 py-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-slate-500">{item.cue}</p>
                                <p className="mt-1 text-sm font-medium leading-6 text-slate-900">“{item.line}”</p>
                              </div>
                              <button type="button" onClick={() => speakEnglish(item.line)} title="Listen to this service line" aria-label="Listen to this service line" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-blue-700 transition hover:border-blue-300 hover:bg-blue-50">
                                <Volume2 size={17} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="mt-5 bg-slate-950 p-4 text-white sm:rounded-lg">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold text-blue-300">GUEST CHALLENGE</p>
                          <span className="text-xs text-slate-400">Role · {shiftLab.challenge.role}</span>
                        </div>
                        <p className="mt-3 text-base font-medium leading-7">“{shiftLab.challenge.prompt}”</p>
                        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-700 pt-3">
                          <p className="text-xs leading-5 text-slate-400">Answer aloud before opening the knowledge notes below.</p>
                          <button type="button" onClick={() => speakEnglish(shiftLab.challenge.prompt)} title="Listen to the guest" aria-label="Listen to the guest" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-950 transition hover:bg-blue-50">
                            <Volume2 size={17} />
                          </button>
                        </div>
                      </section>
                    </>
                  )}

                  {dayProgress.practice && (
                    <div className={`mt-4 rounded-lg border p-4 ${Number(dayProgress.practice.bestScore || 0) >= 70 ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <p className={`text-sm font-semibold ${Number(dayProgress.practice.bestScore || 0) >= 70 ? 'text-emerald-900' : 'text-amber-950'}`}>任务7口头运用</p>
                        <span className={`text-sm font-bold ${Number(dayProgress.practice.bestScore || 0) >= 70 ? 'text-emerald-700' : 'text-amber-800'}`}>{dayProgress.practice.bestScore || 0}/100</span>
                      </div>
                      {dayProgress.practice.improvements?.length > 0 && (
                        <p className={`mt-2 text-xs leading-5 ${Number(dayProgress.practice.bestScore || 0) >= 70 ? 'text-emerald-800' : 'text-amber-900'}`}>
                          优先改进：{dayProgress.practice.improvements.slice(0, 2).join('；')}
                        </p>
                      )}
                    </div>
                  )}

                  {day.referenceGroups?.length > 0 && (
                    <div className="mt-5">
                      <h3 className="text-sm font-bold text-slate-950">核心知识地图</h3>
                      <div className="mt-3 divide-y divide-slate-100 border-y border-slate-100">
                        {day.referenceGroups.map((group) => (
                          <div key={group.name} className="py-3">
                            <p className="text-sm font-semibold text-slate-950">{group.name}</p>
                            <p className="mt-1 text-sm leading-6 text-slate-700">{group.profile}</p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">{group.examples}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {day.cruiseLinePatterns?.length > 0 && (
                    <div className="mt-5">
                      <h3 className="text-sm font-bold text-slate-950">公开菜单样本对照</h3>
                      <p className="mt-1 text-xs leading-5 text-slate-500">用于理解品牌与 venue 风格，不代表所有船舶当前供应。</p>
                      <div className="mt-3 divide-y divide-slate-100 border-y border-slate-100">
                        {day.cruiseLinePatterns.map((line) => (
                          <div key={line.company} className="py-4">
                            <p className="text-sm font-semibold text-slate-950">{line.company}</p>
                            <p className="mt-1 text-sm leading-6 text-slate-700">{line.pattern}</p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">{line.examples}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-5 space-y-5">
                    {day.sections.map((section) => (
                      <section key={section.title}>
                        <div className="flex items-center gap-2">
                          <BookOpen size={16} className="text-blue-700" />
                          <h3 className="text-sm font-bold text-slate-950">{section.title}</h3>
                        </div>
                        <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
                          {section.items.map((item) => <li key={item}>• {item}</li>)}
                        </ul>
                      </section>
                    ))}
                  </div>

                  <section className="mt-6 rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Clock3 size={16} />
                      <p className="text-xs font-semibold">完成检查</p>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold leading-6 text-slate-950">{day.quiz.question}</h3>
                    <div className="mt-3 space-y-2">
                      {day.quiz.options.map((option) => {
                        const selected = selectedOption?.id === option.id
                        const selectedCorrect = selected && option.id === day.quiz.correctOptionId
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => selectAnswer(day, option.id)}
                            className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left text-sm leading-6 transition ${selected ? selectedCorrect ? 'border-emerald-300 bg-emerald-50 text-emerald-950' : 'border-amber-300 bg-amber-50 text-amber-950' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200'}`}
                          >
                            <span className="font-semibold">{option.id.toUpperCase()}.</span>
                            <span>{option.text}</span>
                          </button>
                        )
                      })}
                    </div>

                    {selectedOption && (
                      <div className={`mt-3 rounded-lg p-3 text-sm leading-6 ${isCorrect ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'}`}>
                        <p className="font-semibold">{isCorrect ? '回答正确，今天的知识已完成' : '这个选择还不够稳妥'}</p>
                        <p className="mt-1">{day.quiz.explanation}</p>
                      </div>
                    )}
                  </section>

                  {isCompleted && dayIndex < barServerFoundationDays.length - 1 && (
                    <button type="button" onClick={() => openNextDay(dayIndex)} className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700">
                      进入第 {day.day + 1} 天 <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              )}
            </article>
          )
        })}
      </div>

      <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm font-semibold text-blue-950">任务5学知识，任务6组答案，任务7练输出</p>
        <p className="mt-1 text-sm leading-6 text-blue-900">
          {task6Completed
              ? `岗位回答框架已经准备好。现在可以进入任务7，用定向题检验这 ${barServerFoundationDays.length} 天知识能不能真正说出来。`
            : '完成基础课后，先在任务6把知识与个人经历组织成回答框架，再进入任务7进行语音和AI反馈。'}
        </p>
        <button type="button" onClick={task6Completed ? onStartTask7 : onStartTask6} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-800">
          {task6Completed ? '进入任务7知识巩固' : '进入任务6建立回答框架'}
          <ArrowRight size={16} />
        </button>
        {completedDays === barServerFoundationDays.length && onStartScenarioTraining && (
          <button type="button" onClick={onStartScenarioTraining} className="mt-3 flex items-center gap-2 text-sm font-semibold text-blue-800">
            用真实岗位场景检验这 {barServerFoundationDays.length} 天知识
            <ArrowRight size={16} />
          </button>
        )}
      </div>

      <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <summary className="cursor-pointer text-xs font-semibold text-slate-700">公开菜单参考来源与更新说明</summary>
        <p className="mt-2 text-xs leading-5 text-slate-500">菜单、品牌、价格、套餐与政策会变化，实际上船后必须以当前船舶和 assigned venue 的资料为准。</p>
        <div className="mt-3 space-y-2">
          {barServerFoundationSources.map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 text-xs font-medium text-blue-700 hover:text-blue-900">
              <span>{source.company} · {source.label}</span>
              <ExternalLink size={13} className="shrink-0" />
            </a>
          ))}
        </div>
      </details>
    </section>
  )
}
