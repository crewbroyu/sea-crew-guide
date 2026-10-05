import { BAR_SERVER_TRIAL_STORAGE_KEY } from '../data/barServerTrial.js'
import { readBarLearningStage, readBarLearningStageUpdatedAt, readBarListeningProgress, readBarShiftHistory } from '../data/barServerListening.js'
import { mergeBarServerPractice } from '../data/barServerProgressSync.js'
import { mergeFoundationProgress } from '../data/foundationSync.js'
import { buildHomeToday } from '../data/homeToday.js'
import { hasProductEntitlement } from './activationService.js'
import { getLatestCareerReport } from './careerReportService.js'
import { readFoundationProgress } from './foundationProgressService.js'
import { getMyJobPreparation } from './jobPreparationService.js'
import { getMyScenarioHistory, getMyScenarioProfile } from './scenarioTrainingService.js'
import { getLocalTaskProgress, getMyPathProfile, mergeTaskProgress } from './userPathService.js'

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '') || fallback
  } catch {
    return fallback
  }
}

const valueOf = (result, fallback) => result.status === 'fulfilled' ? result.value : fallback

export const getHomeDashboard = async (access) => {
  const ownerId = access.isPreviewing ? 'preview' : access.userId || 'guest'
  const results = await Promise.allSettled([
    getMyPathProfile(),
    getMyJobPreparation(access.isRegistered && !access.isPreviewing ? access.userId : undefined),
    getLatestCareerReport(),
    getMyScenarioProfile('bar_server'),
    getMyScenarioHistory('bar_server', 5),
  ])

  const cloudPathProfile = valueOf(results[0], null)
  const jobPreparation = valueOf(results[1], null)
  const cloudCareerReport = valueOf(results[2], null)
  const scenarioProfile = valueOf(results[3], null)
  const scenarioHistory = valueOf(results[4], [])
  const localAssessment = readJson('assessment_result', {})
  const localTask2 = readJson('task2_result', {})
  const pathProfile = cloudPathProfile ? {
    ...cloudPathProfile,
    task_progress: mergeTaskProgress(cloudPathProfile.task_progress || {}, getLocalTaskProgress()),
  } : {
    target_position: localTask2.selectedTargetJob || localTask2.target_position || null,
    latest_assessment_score: Number(localAssessment.overallScore || 0) || null,
    latest_assessment_level: localAssessment.level?.label || localAssessment.level_label || null,
    task_progress: getLocalTaskProgress(),
  }
  const careerReport = cloudCareerReport || (localAssessment.careerReport ? {
    profile: localAssessment.careerProfile || {},
    assessment_snapshot: localAssessment,
    report: localAssessment.careerReport,
  } : null)
  const cloudFoundation = jobPreparation?.learning_records?.foundationCourses?.bar_server?.progress || {}
  const cloudPractice = jobPreparation?.learning_records?.barServerPractice || {}
  const foundationProgress = mergeFoundationProgress(cloudFoundation, readFoundationProgress('bar_server', ownerId))
  const practice = mergeBarServerPractice(cloudPractice, {
    listeningProgress: readBarListeningProgress(ownerId),
    shiftHistory: readBarShiftHistory(ownerId),
    learningStage: readBarLearningStage(ownerId),
    stageUpdatedAt: readBarLearningStageUpdatedAt(ownerId),
  })

  return {
    dashboard: buildHomeToday({
      pathProfile,
      jobPreparation,
      careerReport,
      foundationProgress,
      listeningProgress: practice.listeningProgress,
      shiftHistory: practice.shiftHistory,
      scenarioProfile,
      scenarioHistory,
      trial: readJson(BAR_SERVER_TRIAL_STORAGE_KEY, {}),
      interviewCompleted: Boolean(readJson('task6_result', {}).completedAt),
      hasBarServerPack: hasProductEntitlement(access, 'bar_server_pack'),
      learningStage: practice.learningStage,
    }),
    isPartial: results.some((result) => result.status === 'rejected'),
  }
}

