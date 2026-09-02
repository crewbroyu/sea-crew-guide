import { useEffect, useRef, useState } from 'react'
import { Check, Mic, RotateCcw, Square, Volume2 } from 'lucide-react'

const DEFAULT_REQUIRED_PHRASE_REPETITIONS = 3
const DEFAULT_REQUIRED_FULL_ANSWER_REPETITIONS = 3
const DEFAULT_MASTERY_FULL_ANSWER_REPETITIONS = 5

const pickRecordingMimeType = () => [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
].find((type) => MediaRecorder.isTypeSupported?.(type))

const getMinimumRecordingSeconds = (text, isFullAnswer) => {
  if (!isFullAnswer) return 1
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  return Math.min(15, Math.max(5, Math.round(wordCount / 4)))
}

export default function PhraseShadowingPractice({
  phrases = [],
  referenceAnswer = '',
  practice = {},
  onPracticeChange,
  requiredPhraseRepetitions = DEFAULT_REQUIRED_PHRASE_REPETITIONS,
  requiredFullAnswerRepetitions = DEFAULT_REQUIRED_FULL_ANSWER_REPETITIONS,
  masteryFullAnswerRepetitions = DEFAULT_MASTERY_FULL_ANSWER_REPETITIONS,
  title,
  description,
}) {
  const legacyCompletedPhrases = practice.completedPhrases || []
  const phraseRepetitions = practice.phraseRepetitions || Object.fromEntries(
    legacyCompletedPhrases.map((phrase) => [phrase, 1]),
  )
  const fullAnswerRepetitions = Number(practice.fullAnswerRepetitions || 0)
  const [speakingKey, setSpeakingKey] = useState(null)
  const [recordingKey, setRecordingKey] = useState(null)
  const [recordingUrls, setRecordingUrls] = useState({})
  const [errorMessage, setErrorMessage] = useState('')
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const recordingUrlsRef = useRef({})
  const discardRecordingRef = useRef(false)
  const recordingStartedAtRef = useRef(0)

  useEffect(() => {
    recordingUrlsRef.current = recordingUrls
  }, [recordingUrls])

  useEffect(() => () => {
    discardRecordingRef.current = true
    window.speechSynthesis?.cancel()
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    Object.values(recordingUrlsRef.current).forEach((url) => URL.revokeObjectURL(url))
  }, [])

  if (!phrases.length && !referenceAnswer) return null

  const completedPhraseCount = phrases.filter(
    (phrase) => Number(phraseRepetitions[phrase] || 0) >= requiredPhraseRepetitions,
  ).length
  const requiredPhraseRecordings = phrases.length * requiredPhraseRepetitions
  const completedPhraseRecordings = phrases.reduce(
    (total, phrase) => total + Math.min(Number(phraseRepetitions[phrase] || 0), requiredPhraseRepetitions),
    0,
  )
  const hasCompletedFullAnswer = !referenceAnswer
    || fullAnswerRepetitions >= requiredFullAnswerRepetitions
  const isPracticeComplete = completedPhraseCount === phrases.length && hasCompletedFullAnswer
  const requiredRecordingCount = requiredPhraseRecordings
    + (referenceAnswer ? requiredFullAnswerRepetitions : 0)
  const completedRecordingCount = completedPhraseRecordings
    + (referenceAnswer ? Math.min(fullAnswerRepetitions, requiredFullAnswerRepetitions) : 0)
  const completedUnitCount = completedPhraseCount
    + (referenceAnswer && hasCompletedFullAnswer ? 1 : 0)
  const requiredUnitCount = phrases.length + (referenceAnswer ? 1 : 0)
  const progress = requiredRecordingCount
    ? Math.round((completedRecordingCount / requiredRecordingCount) * 100)
    : 0

  const emitPracticeChange = (nextPhraseRepetitions, nextFullAnswerRepetitions) => {
    const allPhrasesComplete = phrases.every(
      (phrase) => Number(nextPhraseRepetitions[phrase] || 0) >= requiredPhraseRepetitions,
    )
    const completed = allPhrasesComplete
      && (!referenceAnswer || nextFullAnswerRepetitions >= requiredFullAnswerRepetitions)
    onPracticeChange?.({
      phraseRepetitions: nextPhraseRepetitions,
      fullAnswerRepetitions: nextFullAnswerRepetitions,
      completedAt: completed
        ? ((practice.phraseRepetitions && practice.completedAt) || new Date().toISOString())
        : null,
    })
  }

  const playText = (text, key) => {
    setErrorMessage('')
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      setErrorMessage('当前浏览器不支持示范朗读，可以直接录音跟读。')
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const voices = window.speechSynthesis.getVoices()
    utterance.voice = voices.find((voice) => /^en-(US|GB)/i.test(voice.lang))
      || voices.find((voice) => voice.lang?.toLowerCase().startsWith('en'))
      || null
    utterance.lang = utterance.voice?.lang || 'en-US'
    utterance.rate = 0.86
    utterance.pitch = 1
    utterance.onstart = () => setSpeakingKey(key)
    utterance.onend = () => setSpeakingKey(null)
    utterance.onerror = () => setSpeakingKey(null)
    window.speechSynthesis.speak(utterance)
  }

  const handleStartRecording = async ({ text, key, phrase, isFullAnswer = false }) => {
    setErrorMessage('')
    window.speechSynthesis?.cancel()
    setSpeakingKey(null)

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setErrorMessage('当前浏览器不支持录音，请使用最新版 Chrome 或 Edge。')
      return
    }

    let stream
    try {
      discardRecordingRef.current = false
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      recordingStartedAtRef.current = 0
      const mimeType = pickRecordingMimeType()
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 32000,
      })
      recorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstart = (event) => {
        recordingStartedAtRef.current = event.timeStamp
      }
      recorder.onstop = (event) => {
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        if (discardRecordingRef.current) return

        const elapsedSeconds = (event.timeStamp - recordingStartedAtRef.current) / 1000
        const minimumSeconds = getMinimumRecordingSeconds(text, isFullAnswer)
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || mimeType || 'audio/webm',
        })
        const nextUrl = URL.createObjectURL(blob)
        setRecordingUrls((previous) => {
          if (previous[key]) URL.revokeObjectURL(previous[key])
          return { ...previous, [key]: nextUrl }
        })
        setRecordingKey(null)

        if (elapsedSeconds < minimumSeconds) {
          setErrorMessage(`本次录音少于 ${minimumSeconds} 秒，不计入训练次数。请完整读完后重试。`)
          return
        }

        if (isFullAnswer) {
          const nextCount = Math.min(
            fullAnswerRepetitions + 1,
            masteryFullAnswerRepetitions,
          )
          emitPracticeChange(phraseRepetitions, nextCount)
        } else {
          const currentCount = Number(phraseRepetitions[phrase] || 0)
          const nextPhraseRepetitions = {
            ...phraseRepetitions,
            [phrase]: Math.min(currentCount + 1, requiredPhraseRepetitions),
          }
          emitPracticeChange(nextPhraseRepetitions, fullAnswerRepetitions)
        }
      }

      recorder.start()
      setRecordingKey(key)
    } catch (error) {
      console.error('Phrase shadowing recording failed:', error)
      stream?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setRecordingKey(null)
      setErrorMessage('无法打开麦克风，请检查浏览器权限后重试。')
    }
  }

  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }

  const resetPractice = () => {
    discardRecordingRef.current = true
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    window.speechSynthesis?.cancel()
    Object.values(recordingUrls).forEach((url) => URL.revokeObjectURL(url))
    setRecordingUrls({})
    setSpeakingKey(null)
    setRecordingKey(null)
    setErrorMessage('')
    emitPracticeChange({}, 0)
  }

  const renderRecordingControls = ({ text, key, phrase, isFullAnswer = false }) => {
    const isRecording = recordingKey === key
    const isAnotherRecording = recordingKey !== null && !isRecording

    return (
      <>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => playText(text, key)}
            disabled={recordingKey !== null}
            title="播放示范"
            className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Volume2 size={15} />{speakingKey === key ? '播放中' : '听示范'}
          </button>

          {isRecording ? (
            <button type="button" onClick={stopRecording} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white">
              <Square size={14} />停止录音
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleStartRecording({ text, key, phrase, isFullAnswer })}
              disabled={isAnotherRecording}
              title={recordingUrls[key] ? '继续跟读' : '开始跟读录音'}
              className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Mic size={14} />{recordingUrls[key] ? '再读一次' : '录音跟读'}
            </button>
          )}
        </div>

        {recordingUrls[key] && (
          <audio src={recordingUrls[key]} controls className="mt-3 h-9 max-w-full" />
        )}
      </>
    )
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-950">{title || (phrases.length ? '表达内化训练' : '最终回答跟练')}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description || (phrases.length ? `每条表达读 ${requiredPhraseRepetitions} 次${referenceAnswer ? `，再把完整回答连续练 ${requiredFullAnswerRepetitions} 次` : ''}。` : `把基于最后一次回答生成的修正版至少完整练 ${requiredFullAnswerRepetitions} 次。`)}录音只保留在当前页面。
          </p>
        </div>
        <span className="shrink-0 text-sm font-semibold text-blue-700">{completedUnitCount}/{requiredUnitCount} 项</span>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
      </div>

      {errorMessage && (
        <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
          {errorMessage}
        </p>
      )}

      {phrases.length > 0 && <div className="mt-4 divide-y divide-slate-100 border-y border-slate-100">
        {phrases.map((phrase, index) => {
          const repetitionCount = Number(phraseRepetitions[phrase] || 0)
          const isCompleted = repetitionCount >= requiredPhraseRepetitions
          const key = `phrase-${index}`

          return (
            <div key={phrase} className="py-4">
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {isCompleted ? <Check size={14} /> : index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium leading-6 text-slate-800">{phrase}</p>
                    <span className={`shrink-0 text-xs font-semibold ${isCompleted ? 'text-emerald-700' : 'text-slate-500'}`}>{repetitionCount}/{requiredPhraseRepetitions}</span>
                  </div>
                  {renderRecordingControls({ text: phrase, key, phrase })}
                </div>
              </div>
            </div>
          )
        })}
      </div>}

      {referenceAnswer && (
        <div className={`${phrases.length ? 'mt-5 border-t border-slate-200 pt-5' : 'mt-4'}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">完整回答跟练</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">先完成 {requiredFullAnswerRepetitions} 次形成完整表达，继续到 {masteryFullAnswerRepetitions} 次作为熟练训练。</p>
            </div>
            <span className={`shrink-0 text-xs font-semibold ${hasCompletedFullAnswer ? 'text-emerald-700' : 'text-slate-500'}`}>
              {fullAnswerRepetitions}/{masteryFullAnswerRepetitions}
            </span>
          </div>
          <p className="mt-3 rounded-lg bg-blue-50 px-3 py-3 text-sm leading-7 text-blue-950">{referenceAnswer}</p>
          {renderRecordingControls({
            text: referenceAnswer,
            key: 'full-answer',
            isFullAnswer: true,
          })}
          {fullAnswerRepetitions >= masteryFullAnswerRepetitions && (
            <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-700"><Check size={14} />已完成 {masteryFullAnswerRepetitions} 次熟练训练</p>
          )}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className={`text-xs font-medium ${isPracticeComplete ? 'text-emerald-700' : 'text-slate-500'}`}>
          {isPracticeComplete
            ? (phrases.length ? '表达训练已完成，可以开始修正后的第二次回答。' : '最终回答已完成 3 次跟练。')
            : (phrases.length ? `已完成 ${completedPhraseCount}/${phrases.length} 条表达${referenceAnswer ? `，完整回答需至少练 ${requiredFullAnswerRepetitions} 次` : ''}。` : `完整回答需至少练 ${requiredFullAnswerRepetitions} 次。`)}
        </p>
        {completedRecordingCount > 0 && (
          <button type="button" onClick={resetPractice} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-blue-700">
            <RotateCcw size={13} />重置
          </button>
        )}
      </div>
    </section>
  )
}
