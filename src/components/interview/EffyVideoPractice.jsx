import { useEffect, useState } from 'react'
import { CheckCircle2, Pause, Play, RotateCcw, Volume2, X } from 'lucide-react'
import { effyVideoPractice } from '../../data/effyJewelryQuestionBank'
import { speakEnglish, stopSpeech } from '../../services/ttsService'

// A light rehearsal for the three video prompts: read the outline, answer aloud against a timer the
// user picks, then tick a self-check. Nothing is recorded or uploaded; only notes stay on this device.
const STORAGE_KEY = 'effy_video_practice_notes'

const readNotes = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

export default function EffyVideoPractice({ onClose }) {
  const { prompts, durations, sourceNote } = effyVideoPractice
  const [index, setIndex] = useState(0)
  const [duration, setDuration] = useState(durations[1])
  const [remaining, setRemaining] = useState(durations[1])
  const [running, setRunning] = useState(false)
  const [notes, setNotes] = useState(readNotes)
  const [checked, setChecked] = useState({})
  const prompt = prompts[index]

  useEffect(() => {
    if (!running) return undefined
    const timer = setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          setRunning(false)
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [running])

  useEffect(() => () => stopSpeech(), [])

  const resetTimer = (seconds = duration) => {
    setRunning(false)
    setRemaining(seconds)
  }

  const selectPrompt = (nextIndex) => {
    setIndex(nextIndex)
    resetTimer()
  }

  const selectDuration = (seconds) => {
    setDuration(seconds)
    resetTimer(seconds)
  }

  const updateNote = (value) => {
    const next = { ...notes, [prompt.id]: value }
    setNotes(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Notes are a convenience; the practice still works if storage is full or blocked.
    }
  }

  const toggleCheck = (key) => setChecked((current) => ({ ...current, [key]: !current[key] }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-5 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-700">招聘材料练习</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">{effyVideoPractice.title}</h2>
          </div>
          <button type="button" onClick={() => { stopSpeech(); onClose() }} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {prompts.map((item, itemIndex) => (
            <button key={item.id} type="button" onClick={() => selectPrompt(itemIndex)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${itemIndex === index ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>
              第 {itemIndex + 1} 问
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-start justify-between gap-3">
          <p className="font-medium leading-6 text-slate-950">{prompt.question}</p>
          <button type="button" onClick={() => void speakEnglish(prompt.question, { position: 'effy_jewelry', rate: 0.9 })} className="shrink-0 rounded-lg border border-slate-200 p-2 text-slate-600" aria-label="听问题"><Volume2 size={16} /></button>
        </div>

        <section className="mt-4 rounded-lg border border-amber-100 bg-amber-50 p-4">
          <p className="text-xs font-semibold text-amber-700">1. 准备提纲</p>
          <ul className="mt-2 space-y-1">
            {prompt.outline.map((line) => <li key={line} className="text-sm leading-6 text-amber-950">· {line}</li>)}
          </ul>
          <textarea value={notes[prompt.id] || ''} onChange={(event) => updateNote(event.target.value)} rows={3} placeholder="写几个英文关键词，不要写成整段稿子" className="mt-3 w-full rounded-lg border border-amber-200 bg-white p-2 text-sm outline-none focus:border-amber-400" />
        </section>

        <section className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-semibold text-blue-700">2. 限时英文回答</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {durations.map((seconds) => (
              <button key={seconds} type="button" onClick={() => selectDuration(seconds)} className={`rounded-full px-3 py-1 text-xs font-medium ${duration === seconds ? 'bg-blue-600 text-white' : 'border border-blue-200 bg-white text-blue-700'}`}>
                {formatTime(seconds)}
              </button>
            ))}
          </div>
          <p className="mt-3 text-center text-3xl font-semibold tabular-nums text-blue-950">{formatTime(remaining)}</p>
          {remaining === 0 && <p className="text-center text-xs text-blue-700">时间到，收个尾就好。</p>}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setRunning((value) => !value)} disabled={remaining === 0} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {running ? <><Pause size={16} />暂停</> : <><Play size={16} />开始</>}
            </button>
            <button type="button" onClick={() => resetTimer()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700"><RotateCcw size={16} />重来</button>
          </div>
          <p className="mt-2 text-xs leading-5 text-blue-700">时长自己选，用来练习控制节奏，不代表招聘方的统一要求。</p>
        </section>

        <section className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-700">3. 自查</p>
          <div className="mt-2 space-y-2">
            {prompt.checks.map((check) => {
              const key = `${prompt.id}:${check}`
              return (
                <button key={key} type="button" onClick={() => toggleCheck(key)} className="flex w-full items-start gap-2 text-left text-sm leading-6 text-slate-700">
                  <CheckCircle2 size={17} className={`mt-0.5 shrink-0 ${checked[key] ? 'text-emerald-600' : 'text-slate-300'}`} />{check}
                </button>
              )
            })}
          </div>
        </section>

        <p className="mt-4 text-xs leading-5 text-slate-500">{sourceNote}</p>
      </div>
    </div>
  )
}
