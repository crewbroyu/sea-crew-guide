import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  GlassWater,
  Headphones,
  Languages,
  ListChecks,
  Play,
  Square,
} from 'lucide-react'
import PhraseShadowingPractice from './PhraseShadowingPractice'

const lessonSteps = [
  { id: 'story', label: '剧情', icon: Headphones },
  { id: 'knowledge', label: '知识', icon: BookOpen },
  { id: 'language', label: '表达', icon: Languages },
  { id: 'decision', label: '判断', icon: ListChecks },
]

export default function ScenarioLesson({ scenario, progress = {}, onProgressChange, onComplete }) {
  const lesson = scenario.lesson
  const [isPlayingDialogue, setIsPlayingDialogue] = useState(false)
  const step = progress.step || 'story'
  const stepIndex = lessonSteps.findIndex((item) => item.id === step)
  const selectedOption = lesson.decisionCheck.options.find(
    (option) => option.id === progress.selectedOptionId,
  )
  const phrasePracticeComplete = Boolean(progress.phrasePractice?.completedAt)

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  const updateProgress = (nextValue) => {
    onProgressChange?.({ ...progress, ...nextValue })
  }

  const changeStep = (nextStep) => {
    window.speechSynthesis?.cancel()
    setIsPlayingDialogue(false)
    updateProgress({ step: nextStep })
  }

  const playDialogue = () => {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return
    window.speechSynthesis.cancel()
    const voices = window.speechSynthesis.getVoices()
    const englishVoices = voices.filter((voice) => voice.lang?.toLowerCase().startsWith('en'))
    setIsPlayingDialogue(true)

    lesson.dialogue.forEach((line, index) => {
      const utterance = new SpeechSynthesisUtterance(line.text)
      utterance.lang = 'en-US'
      utterance.rate = line.role === 'guest' ? 0.92 : 0.86
      utterance.voice = line.role === 'guest'
        ? (englishVoices.find((voice) => /female|samantha|zira/i.test(voice.name)) || englishVoices[0] || null)
        : (englishVoices.find((voice) => /male|david|mark/i.test(voice.name)) || englishVoices[1] || englishVoices[0] || null)
      if (index === lesson.dialogue.length - 1) {
        utterance.onend = () => setIsPlayingDialogue(false)
        utterance.onerror = () => setIsPlayingDialogue(false)
      }
      window.speechSynthesis.speak(utterance)
    })
  }

  const stopDialogue = () => {
    window.speechSynthesis?.cancel()
    setIsPlayingDialogue(false)
  }

  const renderStepNav = () => (
    <div className="grid grid-cols-4 gap-2">
      {lessonSteps.map((item, index) => {
        const Icon = item.icon
        const active = item.id === step
        const completed = index < stepIndex
        return (
          <div key={item.id} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg border text-xs font-semibold ${active ? 'border-blue-200 bg-blue-50 text-blue-700' : completed ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-400'}`}>
            {completed ? <Check size={16} /> : <Icon size={16} />}
            {item.label}
          </div>
        )
      })}
    </div>
  )

  const renderStory = () => (
    <div className="space-y-5">
      <figure className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
        <img src={scenario.image} alt={scenario.imageAlt} className="aspect-video w-full object-cover" loading="eager" />
        <figcaption className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
          <span>EP.{String(scenario.episodeNumber).padStart(2, '0')} · {scenario.location}</span>
          <span>{scenario.category}</span>
        </figcaption>
      </figure>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold text-blue-700">SCENE INPUT</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-950">{scenario.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{scenario.setting}</p>
        <p className="mt-4 border-l-4 border-blue-500 pl-3 text-sm font-medium leading-6 text-slate-800">{lesson.storyTitle}</p>

        <button type="button" onClick={isPlayingDialogue ? stopDialogue : playDialogue} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700">
          {isPlayingDialogue ? <Square size={15} /> : <Play size={16} />}{isPlayingDialogue ? '停止剧情音频' : '播放剧情音频'}
        </button>

        <div className="mt-5 divide-y divide-slate-100 border-y border-slate-100">
          {lesson.dialogue.map((line) => (
            <div key={`${line.speaker}-${line.text}`} className="py-4">
              <p className={`text-xs font-semibold ${line.role === 'guest' ? 'text-amber-700' : 'text-blue-700'}`}>{line.speaker}</p>
              <p className="mt-1 text-sm font-medium leading-6 text-slate-900">{line.text}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{line.translation}</p>
            </div>
          ))}
        </div>
      </section>

      <button type="button" onClick={() => changeStep('knowledge')} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700">理解这个场景 <ArrowRight size={17} /></button>
    </div>
  )

  const renderKnowledge = () => (
    <div className="space-y-5">
      <button type="button" onClick={() => changeStep('story')} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-700"><ArrowLeft size={16} />返回剧情</button>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 text-blue-700"><BookOpen size={18} /><p className="text-sm font-semibold">本场基础知识</p></div>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-900">{lesson.objective}</p>
        <div className="mt-5 divide-y divide-slate-100 border-y border-slate-100">
          {lesson.knowledge.map((item, index) => (
            <div key={item.title} className="py-4">
              <p className="text-sm font-semibold text-slate-950">{index + 1}. {item.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 text-blue-700"><GlassWater size={18} /><h3 className="font-semibold text-slate-950">三款饮品怎么判断</h3></div>
        <div className="mt-4 space-y-3">
          {lesson.drinkComparison.map((drink) => (
            <div key={drink.name} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
              <div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold text-slate-950">{drink.name}</p><span className="text-right text-xs font-medium text-blue-700">{drink.fit}</span></div>
              <p className="mt-1 text-xs text-slate-500">{drink.build}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{drink.profile}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-950">高峰期服务顺序</h3>
        <ol className="mt-4 space-y-3">
          {lesson.serviceSequence.map((item, index) => (
            <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-700"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">{index + 1}</span><span>{item}</span></li>
          ))}
        </ol>
      </section>

      <button type="button" onClick={() => changeStep('language')} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700">进入表达训练 <ArrowRight size={17} /></button>
    </div>
  )

  const renderLanguage = () => (
    <div className="space-y-5">
      <button type="button" onClick={() => changeStep('knowledge')} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-700"><ArrowLeft size={16} />返回基础知识</button>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 text-blue-700"><Languages size={18} /><h2 className="font-semibold text-slate-950">先掌握这四个表达</h2></div>
        <div className="mt-4 divide-y divide-slate-100 border-y border-slate-100">
          {lesson.vocabulary.map((item) => (
            <div key={item.term} className="py-3">
              <div className="flex items-baseline justify-between gap-3"><p className="text-sm font-semibold text-slate-950">{item.term}</p><span className="text-xs text-slate-500">{item.meaning}</span></div>
              <p className="mt-1 text-sm leading-6 text-slate-600">{item.example}</p>
            </div>
          ))}
        </div>
      </section>

      <PhraseShadowingPractice
        phrases={lesson.sentencePatterns}
        practice={progress.phrasePractice || {}}
        requiredPhraseRepetitions={3}
        title="场景句型跟读"
        description="每条先听清，再完整录音跟读 3 次；重复到第三次才算形成训练。"
        onPracticeChange={(phrasePractice) => updateProgress({ phrasePractice })}
      />

      <button type="button" onClick={() => changeStep('decision')} disabled={!phrasePracticeComplete} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">{phrasePracticeComplete ? '进入场景判断' : '完成四条跟读后继续'} <ArrowRight size={17} /></button>
    </div>
  )

  const renderDecision = () => (
    <div className="space-y-5">
      <button type="button" onClick={() => changeStep('language')} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-700"><ArrowLeft size={16} />返回表达训练</button>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 text-blue-700"><ListChecks size={18} /><p className="text-sm font-semibold">场景判断</p></div>
        <h2 className="mt-3 text-lg font-semibold leading-7 text-slate-950">{lesson.decisionCheck.question}</h2>
        <div className="mt-5 space-y-3">
          {lesson.decisionCheck.options.map((option) => {
            const selected = selectedOption?.id === option.id
            return (
              <button key={option.id} type="button" onClick={() => updateProgress({ selectedOptionId: option.id })} className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition ${selected ? option.correct ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white hover:border-blue-200'}`}>
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${selected ? option.correct ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{option.id.toUpperCase()}</span>
                <span className="text-sm font-medium leading-6 text-slate-800">{option.text}</span>
              </button>
            )
          })}
        </div>

        {selectedOption && (
          <div className={`mt-4 rounded-lg border p-4 ${selectedOption.correct ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
            <p className={`flex items-center gap-2 text-sm font-semibold ${selectedOption.correct ? 'text-emerald-800' : 'text-amber-800'}`}>{selectedOption.correct && <CheckCircle2 size={17} />}{selectedOption.correct ? '判断正确' : '再想一步'}</p>
            <p className={`mt-1 text-sm leading-6 ${selectedOption.correct ? 'text-emerald-800' : 'text-amber-900'}`}>{selectedOption.explanation}</p>
          </div>
        )}
      </section>

      {selectedOption?.correct && (
        <section className="rounded-lg border border-blue-200 bg-blue-50 p-5">
          <p className="text-xs font-semibold text-blue-700">对应面试题</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-blue-950">{lesson.interviewTransfer.question}</p>
          <p className="mt-2 text-xs leading-5 text-blue-800">{lesson.interviewTransfer.tip}</p>
        </section>
      )}

      <button type="button" onClick={onComplete} disabled={!selectedOption?.correct} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">进入独立场景回答 <ArrowRight size={17} /></button>
    </div>
  )

  return (
    <div className="space-y-5">
      {renderStepNav()}
      {step === 'story' && renderStory()}
      {step === 'knowledge' && renderKnowledge()}
      {step === 'language' && renderLanguage()}
      {step === 'decision' && renderDecision()}
    </div>
  )
}
