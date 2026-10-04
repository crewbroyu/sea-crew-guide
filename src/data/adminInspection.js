import { barServerFoundationDays, barServerShiftLabs } from './barServerFoundation.js'
import { retailFoundationDays } from './retailFoundation.js'
import { barServerTrialScenarios } from './barServerTrial.js'

const section = (id, title, content) => ({ id, title, content })
const foundation = (day, lab = day) => ({
  id: day.id,
  title: `Day ${day.day} · ${day.title}`,
  sections: [
    section('briefing', '任务与场景', { mission: lab.mission || day.outcome, shift: lab.shift }),
    section('vocabulary', '词汇', lab.vocabulary),
    section('knowledge', '岗位知识', { sections: day.sections, knowledge: day.knowledge, referenceGroups: day.referenceGroups }),
    section('speaking', '跟读表达', lab.serviceLines),
    section('challenge', '客人挑战', lab.challenge),
    section('quiz', '完成检查与答案', day.quiz),
    section('source', '完整课程内容', { day, lab }),
  ],
})

export const INSPECTION_MODULES = [
  { id: 'bar-foundation', title: 'Bar Server 基础课', lessons: barServerFoundationDays.map(day => foundation(day, barServerShiftLabs[day.id] || day)) },
  { id: 'retail-foundation', title: 'Retail 基础课', lessons: retailFoundationDays.map(day => foundation(day)) },
  { id: 'bar-trial', title: 'Bar Server 免费体验', lessons: barServerTrialScenarios.map(scenario => ({
    id: scenario.id,
    title: scenario.title,
    sections: [
      section('story', '剧情与对话', { setting: scenario.setting, objective: scenario.lesson?.objective, dialogue: scenario.lesson?.dialogue }),
      section('knowledge', '岗位知识', { knowledge: scenario.lesson?.knowledge, knowledgeCards: scenario.lesson?.knowledgeCards, drinkComparison: scenario.lesson?.drinkComparison, serviceSequence: scenario.lesson?.serviceSequence }),
      section('speaking', '跟读表达', scenario.lesson?.sentencePatterns),
      section('decision', '场景判断与答案', scenario.lesson?.decisionCheck),
      section('answer', '独立回答要求', { question: scenario.interviewerQuestion, task: scenario.task, focus: scenario.focus, checkpoints: scenario.checkpoints, watchOuts: scenario.watchOuts }),
      section('source', '完整课程内容', scenario),
    ],
  })) },
]

export function resolveInspectionSelection(params) {
  const module = INSPECTION_MODULES.find(item => item.id === params.get('module')) || INSPECTION_MODULES[0]
  const lesson = module.lessons.find(item => item.id === params.get('lesson')) || module.lessons[0]
  const selectedSection = lesson.sections.find(item => item.id === params.get('section')) || lesson.sections[0]
  return { module, lesson, section: selectedSection }
}
