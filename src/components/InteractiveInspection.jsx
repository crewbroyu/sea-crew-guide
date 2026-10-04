import { isActiveAdministrator } from '../utils/accessPolicy.js'
import { useState } from 'react'
import { useAccessStore } from '../store/accessStore'
import { TrainingInspectionContext } from '../hooks/useTrainingInspection'
import BarServerFoundationTraining from './training/BarServerFoundationTraining'
import RetailFoundationTraining from './training/RetailFoundationTraining'
import ScenarioLesson from './interview/ScenarioLesson'
import { barServerTrialScenarios } from '../data/barServerTrial'

const steps = { briefing: 0, vocabulary: 1, knowledge: 2, speaking: 3, challenge: 4, quiz: 5 }
const scenarioSteps = { story: 'story', knowledge: 'knowledge', speaking: 'language', decision: 'decision' }

function Session({ moduleId, lessonId, sectionId }) {
  const [progress, setProgress] = useState({})
  const [scenarioProgress, setScenarioProgress] = useState({ step: scenarioSteps[sectionId] || 'story' })
  const [finished, setFinished] = useState(sectionId === 'answer')
  const [savedLines, setSavedLines] = useState([])
  const toggleLine = (line) => setSavedLines(current => current.some(item => item.text === line.text)
    ? current.filter(item => item.text !== line.text) : [...current, line])
  const props = { onlyDayId: lessonId, initialLessonStep: steps[sectionId] || 0, showCourseHeader: false, savedLines, onToggleSavedLine: toggleLine }
  const scenario = barServerTrialScenarios.find(item => item.id === lessonId)

  return <TrainingInspectionContext.Provider value={true}>
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
      临时交互：复用实际课程组件，可以答题、切步骤和试收藏。跳过不计为完成。
      录音与语音播放在此关闭。切换章节、步骤或离开页面会丢弃试操作。
    </div>
    {moduleId === 'bar-foundation' && <BarServerFoundationTraining {...props} progress={progress} onProgressChange={setProgress} />}
    {moduleId === 'retail-foundation' && <RetailFoundationTraining {...props} initialProgress={{ days: {} }} />}
    {moduleId === 'bar-trial' && scenario && (finished
      ? <div className="space-y-3"><p className="font-semibold">独立回答入口 · 巡检终点</p><p>{scenario.interviewerQuestion}</p><p className="text-sm text-slate-600">本批未接入录音、AI 评分及报告生成，不会提交练习记录。</p><button type="button" onClick={() => { setFinished(false); setScenarioProgress({ step: 'story' }) }} className="rounded-lg border px-3 py-2">重新查看场景课程</button></div>
      : <ScenarioLesson scenario={scenario} progress={scenarioProgress} onProgressChange={setScenarioProgress} onComplete={() => setFinished(true)} />)}
  </TrainingInspectionContext.Provider>
}

export default function InteractiveInspection(props) {
  const access = useAccessStore()
  const { isRegistered, authChecked, accessChecked, isCheckingAuth, isCheckingAccess } = access
  const [revision, setRevision] = useState(0)
  if (!isActiveAdministrator(access) || !isRegistered || !authChecked || !accessChecked || isCheckingAuth || isCheckingAccess) return <p>需要有效管理员权限。</p>
  return <div>
    <button type="button" onClick={() => setRevision(value => value + 1)} className="mb-3 rounded-lg border bg-white px-3 py-2 text-sm">重置本次试操作</button>
    <Session key={`${props.moduleId}:${props.lessonId}:${props.sectionId}:${revision}`} {...props} />
  </div>
}
