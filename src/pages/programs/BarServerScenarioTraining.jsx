import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle, MessageSquareText, Mic, RotateCcw, Send, Square, Sparkles } from 'lucide-react'
import JobReadinessDashboard from '../../components/training/JobReadinessDashboard'
import EdgeReadAloudHint from '../../components/EdgeReadAloudHint'
import { BAR_SERVER_SKILLS, barServerSimulationScenarios, getScenarioById } from '../../data/jobScenarioCatalog'
import { continueScenarioRoleplay, evaluateScenarioSimulation, transcribeInterviewAudio } from '../../services/interviewAiService'
import { createScenarioTrainingDraft, getMyInProgressScenarioSession, getMyScenarioHistory, getMyScenarioProfile, saveScenarioTrainingResult, updateScenarioTrainingDraft } from '../../services/scenarioTrainingService'

const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
const createRequestId = () => globalThis.crypto?.randomUUID?.() || `scenario-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

export default function BarServerScenarioTraining() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [history, setHistory] = useState([])
  const [scenarioId, setScenarioId] = useState(barServerSimulationScenarios[0].id)
  const [stage, setStage] = useState('briefing')
  const [turns, setTurns] = useState([])
  const [answer, setAnswer] = useState('')
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [result, setResult] = useState(null)
  const [draft, setDraft] = useState(null)
  const [activeSessionId, setActiveSessionId] = useState(null)
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const secondsRef = useRef(0)
  const firstTurnRequestIdRef = useRef(null)
  const finalEvaluationRequestIdRef = useRef(null)

  const scenario = useMemo(() => getScenarioById(scenarioId) || barServerSimulationScenarios[0], [scenarioId])

  useEffect(() => {
    let active = true

    const loadTrainingData = async () => {
      try {
        const [nextProfile, nextHistory, nextDraft] = await Promise.all([getMyScenarioProfile(), getMyScenarioHistory(), getMyInProgressScenarioSession()])
        if (!active) return
        setProfile(nextProfile)
        setHistory(nextHistory)
        setDraft(nextDraft)
        if (nextProfile?.recommended_scenario_id) setScenarioId((current) => current || nextProfile.recommended_scenario_id)
      } catch (error) {
        console.warn('Unable to load scenario readiness:', error)
      }
    }

    void loadTrainingData()
    return () => { active = false }
  }, [])
  useEffect(() => () => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
  }, [])

  const resetScenario = (nextScenarioId = scenario.id) => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setScenarioId(nextScenarioId)
    setStage('briefing')
    setTurns([])
    setAnswer('')
    setResult(null)
    setErrorMessage('')
    setRecording(false)
    setTranscribing(false)
    setSeconds(0)
    setActiveSessionId(null)
    firstTurnRequestIdRef.current = null
    finalEvaluationRequestIdRef.current = null
  }

  const resumeDraft = () => {
    const savedScenario = getScenarioById(draft?.scenario_id)
    const savedTurns = Array.isArray(draft?.turns) ? draft.turns : []
    if (!savedScenario || savedTurns.length < 3) return
    resetScenario(savedScenario.id)
    setScenarioId(savedScenario.id)
    setTurns(savedTurns)
    setActiveSessionId(draft.id)
    setStage('followup')
    setDraft(null)
  }

  const startRecording = async () => {
    setErrorMessage('')
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setErrorMessage('Recording is not supported in this browser. Type your answer instead.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      secondsRef.current = 0
      setSeconds(0)
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((type) => MediaRecorder.isTypeSupported?.(type))
      const recorder = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 32000 })
      recorderRef.current = recorder
      recorder.ondataavailable = (event) => { if (event.data?.size) chunksRef.current.push(event.data) }
      recorder.onstop = async () => {
        if (timerRef.current) window.clearInterval(timerRef.current)
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        setRecording(false)
        setTranscribing(true)
        try {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType || 'audio/webm' })
          const prompt = stage === 'first' ? scenario.openingLine : turns.find((turn) => turn.role !== 'trainee' && turn.isFollowUp)?.content
          const transcription = await transcribeInterviewAudio(blob, { mode: 'premium_scenario', position: 'Bar Server', question: prompt, scenarioId: scenario.id })
          setAnswer(transcription.transcript)
        } catch (error) {
          setErrorMessage(error.message || 'Transcription failed. Record again or type your answer.')
        } finally {
          setTranscribing(false)
        }
      }
      recorder.start()
      setRecording(true)
      timerRef.current = window.setInterval(() => {
        secondsRef.current += 1
        setSeconds(secondsRef.current)
        if (secondsRef.current >= 90 && recorder.state === 'recording') recorder.stop()
      }, 1000)
    } catch {
      setErrorMessage('Microphone access is unavailable. Check your browser permission.')
    }
  }

  const stopRecording = () => { if (recorderRef.current?.state === 'recording') recorderRef.current.stop() }

  const submitAnswer = async () => {
    const response = answer.trim()
    if (!response) return setErrorMessage('Record or type your English answer first.')
    setBusy(true)
    setErrorMessage('')
    try {
      if (stage === 'first') {
        const firstTurns = [
          { role: scenario.aiRole, content: scenario.openingLine },
          { role: 'trainee', content: response },
        ]
        firstTurnRequestIdRef.current ||= createRequestId()
        const followUp = await continueScenarioRoleplay({ scenarioId: scenario.id, firstAnswer: response, requestId: firstTurnRequestIdRef.current })
        const followUpTurns = [...firstTurns, { role: followUp.role, content: followUp.message, isFollowUp: true }]
        const savedDraft = await createScenarioTrainingDraft({ scenario, turns: followUpTurns })
        setTurns(followUpTurns)
        setActiveSessionId(savedDraft?.id || null)
        firstTurnRequestIdRef.current = null
        setAnswer('')
        setStage('followup')
      } else {
        const finalTurns = [...turns, { role: 'trainee', content: response }]
        await updateScenarioTrainingDraft({ sessionId: activeSessionId, turns: finalTurns })
        finalEvaluationRequestIdRef.current ||= createRequestId()
        const evaluation = await evaluateScenarioSimulation({ scenarioId: scenario.id, turns: finalTurns, requestId: finalEvaluationRequestIdRef.current })
        const saved = await saveScenarioTrainingResult({ sessionId: activeSessionId, scenario, turns: finalTurns, evaluation })
        finalEvaluationRequestIdRef.current = null
        setActiveSessionId(null)
        setDraft(null)
        setTurns(finalTurns)
        setResult(evaluation)
        if (saved?.profile) setProfile({
          readiness_score: saved.profile.readinessScore,
          skill_scores: saved.profile.skillScores,
          weakest_skill: saved.profile.weakestSkill,
          recommended_scenario_id: saved.profile.recommendedScenario?.id || null,
          completed_scenario_count: new Set([...history.map((item) => item.scenario_id), scenario.id]).size,
        })
        setHistory((previous) => [{ scenario_id: scenario.id, overall_readiness: evaluation.overallReadiness, skill_scores: evaluation.skillScores, completed_at: new Date().toISOString() }, ...previous])
        setStage('result')
      }
    } catch (error) {
      setErrorMessage(error.message || 'AI training is temporarily unavailable. Please try again shortly.')
    } finally { setBusy(false) }
  }

  const selectedHistory = history.filter((item) => item.scenario_id === scenario.id)
  const best = selectedHistory.length ? Math.max(...selectedHistory.map((item) => Number(item.overall_readiness || 0))) : null
  const latest = selectedHistory[0]?.overall_readiness

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-3xl px-5 pb-5 pt-10"><button type="button" onClick={() => navigate('/tasks/phase2/Task7')} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700"><ArrowLeft size={16} />Return to Interview Training</button><p className="mt-5 text-xs font-medium text-blue-700">BAR SERVER · CRUISE JOB SIMULATOR</p><h1 className="mt-2 text-2xl font-semibold text-slate-950">Job Simulation Training</h1><p className="mt-2 text-sm leading-6 text-slate-600">Brief, practical knowledge. Respond to a guest, handle one follow-up, then train your weakest skill next.</p></div></header>
      <main className="mx-auto max-w-3xl space-y-5 px-5 py-6">
        <JobReadinessDashboard profile={profile} onOpenScenario={(id) => resetScenario(id)} />
        {draft && getScenarioById(draft.scenario_id) && (
          <section className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-sm font-semibold text-amber-950">You have an unfinished simulation</p><p className="mt-1 text-xs leading-5 text-amber-900">Your first response and the AI follow-up are saved. Continue without losing progress.</p></div>
            <button type="button" onClick={resumeDraft} className="inline-flex shrink-0 min-h-10 items-center justify-center rounded-lg bg-amber-700 px-4 text-sm font-semibold text-white hover:bg-amber-800">Continue</button>
          </section>
        )}
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-medium text-blue-700">{scenario.episode}</p><h2 className="mt-1 text-xl font-semibold text-slate-950">{scenario.title}</h2></div><select value={scenario.id} onChange={(event) => resetScenario(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"><option value={scenario.id}>Change simulation</option>{barServerSimulationScenarios.filter((item) => item.id !== scenario.id).map((item) => <option key={item.id} value={item.id}>{item.episode} · {item.title}</option>)}</select></div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">{[['LOCATION', scenario.location], ['GUEST', scenario.guestType], ['WORKLOAD', scenario.workload], ['NOISE', scenario.noiseLevel]].map(([label, value]) => <div key={label} className="rounded-lg bg-slate-50 p-3"><p className="text-slate-500">{label}</p><p className="mt-1 font-medium text-slate-800">{value}</p></div>)}</div>
          {stage === 'briefing' && <><div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4"><p className="text-xs font-semibold text-blue-700">WHAT YOU NEED FOR THIS SIMULATION</p><ul className="mt-2 space-y-1.5 text-sm leading-6 text-blue-950">{scenario.knowledgeRequired.map((item) => <li key={item}>• {item}</li>)}</ul></div><div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-950">This simulation includes one role-play follow-up and one skills evaluation. Completing it uses 2 AI feedback credits. Your progress is saved if you leave early.</div><div className="mt-5 border-l-4 border-blue-500 bg-slate-50 px-4 py-3"><p className="text-xs font-semibold text-blue-700">{scenario.aiRole}</p><p className="mt-1 text-base font-medium leading-7 text-slate-950">“{scenario.openingLine}”</p></div><EdgeReadAloudHint /><button type="button" onClick={() => setStage('first')} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">Respond to the guest <ArrowRight size={18} /></button></>}
          {(stage === 'first' || stage === 'followup') && <div className="mt-5 space-y-4"><div className="space-y-3">{stage === 'first' ? <div className="border-l-4 border-blue-500 bg-blue-50 px-4 py-3"><p className="text-xs font-semibold text-blue-700">{scenario.aiRole}</p><p className="mt-1 text-sm font-medium leading-6 text-blue-950">“{scenario.openingLine}”</p></div> : turns.map((turn, index) => <div key={`${turn.role}-${index}`} className={turn.role === 'trainee' ? 'ml-6 rounded-lg bg-slate-900 px-4 py-3 text-sm leading-6 text-white' : 'mr-6 border-l-4 border-blue-500 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-950'}><p className="mb-1 text-xs font-semibold opacity-70">{turn.role === 'trainee' ? 'You' : turn.role}</p>{turn.content}</div>)}</div><EdgeReadAloudHint />
            <div className="rounded-lg border border-slate-200 p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold text-slate-950">{stage === 'first' ? 'Your first response' : 'Respond to the guest follow-up'}</p><p className="mt-1 text-xs text-slate-500">Aim for 20-60 seconds. Audio is transcribed but never stored.</p></div>{recording ? <button type="button" onClick={stopRecording} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white"><Square size={15} />Stop {formatTime(seconds)}</button> : <button type="button" onClick={startRecording} disabled={transcribing || busy} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-300">{transcribing ? <LoaderCircle size={15} className="animate-spin" /> : <Mic size={15} />}{transcribing ? 'Transcribing' : 'Record'}</button>}</div><textarea value={answer} onChange={(event) => setAnswer(event.target.value)} rows={5} placeholder="Record your answer or type it in English." className="mt-4 w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></div>
            {errorMessage && <p className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>}<button type="button" onClick={submitAnswer} disabled={busy || recording || transcribing || !answer.trim()} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:bg-slate-300">{busy ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}{busy ? 'AI is working...' : stage === 'first' ? 'Continue the simulation' : 'Generate my skills result'}</button></div>}
          {stage === 'result' && result && <div className="mt-5 space-y-4"><div className="flex items-start justify-between rounded-lg border border-emerald-100 bg-emerald-50 p-4"><div><p className="text-xs font-semibold text-emerald-700">SIMULATION COMPLETE</p><h3 className="mt-1 text-lg font-semibold text-emerald-950">Simulation readiness {result.overallReadiness}/100</h3><p className="mt-1 text-sm leading-6 text-emerald-900">{result.nextTrainingRecommendation}</p></div><CheckCircle2 className="shrink-0 text-emerald-600" /></div><div className="grid gap-3 sm:grid-cols-2">{[['What worked', result.strengths, 'emerald'], ['Improve next time', result.weaknesses, 'amber']].map(([title, items, tone]) => <div key={title} className={`rounded-lg border p-4 ${tone === 'emerald' ? 'border-emerald-100 bg-emerald-50' : 'border-amber-100 bg-amber-50'}`}><p className="font-semibold text-slate-950">{title}</p><ul className="mt-2 space-y-1.5 text-sm leading-6 text-slate-700">{items.map((item) => <li key={item}>• {item}</li>)}</ul></div>)}</div>{result.criticalMistakes?.length > 0 && <div className="rounded-lg border border-red-100 bg-red-50 p-4"><p className="font-semibold text-red-950">Critical risks</p><ul className="mt-2 space-y-1.5 text-sm leading-6 text-red-800">{result.criticalMistakes.map((item) => <li key={item}>• {item}</li>)}</ul></div>}<div className="rounded-lg border border-blue-200 bg-blue-50 p-4"><div className="flex items-center gap-2"><MessageSquareText size={17} className="text-blue-700" /><p className="font-semibold text-blue-950">A response you can say again</p></div><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-blue-950">{result.betterResponse}</p></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{BAR_SERVER_SKILLS.map(({ key, label }) => <div key={key} className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold text-slate-950">{result.skillScores[key]}</p></div>)}</div>{(latest || best) && <p className="text-xs text-slate-500">Simulation history:{latest ? ` Latest ${latest}` : ''}{best ? ` · Best ${best}` : ''}</p>}<div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => resetScenario()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700"><RotateCcw size={17} />Try this simulation again</button><button type="button" onClick={() => resetScenario(profile?.recommended_scenario_id || barServerSimulationScenarios[0].id)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white">Train my weakest skill <ArrowRight size={17} /></button></div></div>}
        </section>
      </main>
    </div>
  )
}
