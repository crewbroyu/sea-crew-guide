import { BAR_SERVER_TRIAL_STORAGE_KEY } from '../data/barServerTrial.js'
import { readBarLearningStage, readBarLearningStageUpdatedAt, readBarListeningProgress, readBarShiftHistory } from '../data/barServerListening.js'
import { mergeBarServerPractice } from '../data/barServerProgressSync.js'
import { mergeFoundationProgress } from '../data/foundationSync.js'
import { buildHomeToday } from '../data/homeToday.js'
import { mergeRetailPractice, readRetailPractice } from '../data/retailPracticeProgress.js'
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
  const baseResults = await Promise.allSettled([
    getMyPathProfile(),
    getMyJobPreparation(access.isRegistered && !access.isPreviewing ? access.userId : undefined),
    getLatestCareerReport(),
  ])

  const cloudPathProfile = valueOf(baseResults[0], null)
  const jobPreparation = valueOf(baseResults[1], null)
  const cloudCareerReport = valueOf(baseResults[2], null)
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
  const roleValue = pathProfile.target_position || jobPreparation?.selected_role || careerReport?.profile?.targetRole || jobPreparation?.role_title || ''
  const isRetail = /retail|免税|零售/i.test(String(roleValue))
  const isBarServer = /(^bar$|bar.?server|酒吧)/i.test(String(roleValue))
  const jobKey = isRetail ? 'retail' : 'bar_server'
  const scenarioResults = isRetail || isBarServer
    ? await Promise.allSettled([getMyScenarioProfile(jobKey), getMyScenarioHistory(jobKey, 5)])
    : []
  const scenarioProfile = valueOf(scenarioResults[0] || {}, null)
  const scenarioHistory = valueOf(scenarioResults[1] || {}, [])
  const cloudFoundation = jobPreparation?.learning_records?.foundationCourses?.[jobKey]?.progress || {}
  const foundationProgress = mergeFoundationProgress(cloudFoundation, readFoundationProgress(jobKey, ownerId))
  const practice = isRetail
    ? mergeRetailPractice(jobPreparation?.learning_records?.retailPractice, readRetailPractice(ownerId))
    : mergeBarServerPractice(jobPreparation?.learning_records?.barServerPractice || {}, {
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
      interviewCompleted: Boolean(practice.interviewCompletedAt || readJson('task6_result', {}).completedAt),
      hasBarServerPack: hasProductEntitlement(access, 'bar_server_pack'),
      hasRetailPack: hasProductEntitlement(access, 'retail_sales_pack'),
      learningStage: practice.learningStage || practice.stageId,
    }),
    isPartial: [...baseResults, ...scenarioResults].some((result) => result.status === 'rejected'),
  }
}

