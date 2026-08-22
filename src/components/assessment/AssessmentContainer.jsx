import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import WelcomePage from './WelcomePage'
import BackgroundSelect from './BackgroundSelect'
import QuestionPage from './QuestionPage'
import DimensionTransition from './DimensionTransition'
import ResultPage from './ResultPage'
import { DIMENSIONS, ALL_QUESTIONS } from '../../data/assessmentData'
import { calculateDimensionScore, calculateOverallScore, getLevel } from '../../data/assessmentScoring'
import { syncLocalPathProfile } from '../../services/userPathService'

const getSavedAssessmentResult = () => {
  try {
    const savedResult = localStorage.getItem('assessment_result')
    if (!savedResult) return null

    const result = JSON.parse(savedResult)
    return result.completed ? result : null
  } catch (error) {
    console.warn('Unable to read saved assessment result:', error)
    return null
  }
}

const getQuestionsForDimension = (dimensionId, serviceBackground) => {
  if (dimensionId === 'service_experience') {
    return ALL_QUESTIONS.service_experience[serviceBackground] || ALL_QUESTIONS.service_experience.none
  }

  return ALL_QUESTIONS[dimensionId]
}

export default function AssessmentContainer() {
  const navigate = useNavigate()
  const [savedAssessmentResult] = useState(getSavedAssessmentResult)
  const resultStep = 2 + DIMENSIONS.length
  const [step, setStep] = useState(savedAssessmentResult ? resultStep : 0)
  const [currentDimension, setCurrentDimension] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [serviceBackground, setServiceBackground] = useState(savedAssessmentResult?.serviceBackground || null)
  const [answers, setAnswers] = useState(savedAssessmentResult?.answers || {})
  const [dimensionScores, setDimensionScores] = useState(savedAssessmentResult?.dimensionScores || {})
  const [overallScore, setOverallScore] = useState(savedAssessmentResult?.overallScore || 0)
  const [completedDimensions, setCompletedDimensions] = useState(0)

  const handleStartAssessment = () => {
    setStep(1)
  }

  const handleBackgroundSelect = (background) => {
    setServiceBackground(background)
    setStep(2)
    setCurrentDimension(0)
    setCurrentQuestion(0)
  }

  const handleSelectAnswer = (questionId, answer) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const handleNextQuestion = () => {
    const currentDimensionData = DIMENSIONS[currentDimension]
    const questions = getQuestionsForDimension(currentDimensionData.id, serviceBackground)

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
      return
    }

    const dimensionScore = calculateDimensionScore(answers, questions)
    const updatedDimensionScores = {
      ...dimensionScores,
      [currentDimensionData.id]: dimensionScore,
    }

    setDimensionScores(updatedDimensionScores)
    setCompletedDimensions((prev) => prev + 1)

    if (currentDimension < DIMENSIONS.length - 1) {
      setStep(step + 1)
      return
    }

    const finalOverallScore = calculateOverallScore(updatedDimensionScores)
    const assessmentResult = {
      completed: true,
      completedAt: new Date().toISOString(),
      serviceBackground,
      answers,
      dimensionScores: updatedDimensionScores,
      overallScore: finalOverallScore,
      level: getLevel(finalOverallScore),
    }

    setOverallScore(finalOverallScore)
    localStorage.setItem('assessment_result', JSON.stringify(assessmentResult))

    const progress = JSON.parse(localStorage.getItem('boarding_progress') || '{}')
    progress.task1 = { completed: true, completedAt: new Date().toISOString() }
    localStorage.setItem('boarding_progress', JSON.stringify(progress))

    syncLocalPathProfile({
      career_stage: 'assessment_done',
      application_stage: 'assessed',
      latest_assessment_score: finalOverallScore,
      latest_assessment_level: assessmentResult.level?.label || null,
      last_completed_task_id: 1,
    })

    setStep(resultStep)
  }

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  const handleContinueToNextDimension = () => {
    const nextDimension = currentDimension + 1
    setCurrentDimension(nextDimension)
    setCurrentQuestion(0)
    setStep(2 + nextDimension)
  }

  const handleRestartAssessment = () => {
    localStorage.removeItem('assessment_result')
    setStep(0)
    setCurrentDimension(0)
    setCurrentQuestion(0)
    setServiceBackground(null)
    setAnswers({})
    setDimensionScores({})
    setOverallScore(0)
    setCompletedDimensions(0)
  }

  const handleExitAssessment = () => {
    if (window.confirm('测评还没完成，退出将丢失当前进度，确定离开吗？')) {
      navigate('/jobs/preparation')
    }
  }

  const renderQuestionStep = () => {
    const dimensionData = DIMENSIONS[currentDimension]
    const questions = getQuestionsForDimension(dimensionData.id, serviceBackground)
    const currentQuestionData = questions[currentQuestion]

    return (
      <QuestionPage
        question={currentQuestionData}
        currentQuestion={currentQuestion}
        totalQuestions={questions.length}
        currentDimension={currentDimension + 1}
        totalDimensions={DIMENSIONS.length}
        answers={answers}
        onSelectAnswer={handleSelectAnswer}
        onNext={handleNextQuestion}
        onPrev={handlePrevQuestion}
      />
    )
  }

  const renderCurrentStep = () => {
    if (step === 0) return <WelcomePage onStart={handleStartAssessment} />
    if (step === 1) return <BackgroundSelect onSelect={handleBackgroundSelect} />

    if (step >= 2 && step < resultStep) {
      if (step === 2 + currentDimension) return renderQuestionStep()

      return (
        <DimensionTransition
          dimension={DIMENSIONS[currentDimension]}
          completedDimensions={completedDimensions}
          totalDimensions={DIMENSIONS.length}
          onContinue={handleContinueToNextDimension}
        />
      )
    }

    if (step === resultStep) {
      return (
        <ResultPage
          dimensionScores={dimensionScores}
          overallScore={overallScore}
          serviceBackground={serviceBackground}
          answers={answers}
          onRestart={handleRestartAssessment}
        />
      )
    }

    return null
  }

  const currentDimensionData = DIMENSIONS[currentDimension]
  const currentQuestions =
    step >= 2 && step < resultStep
      ? getQuestionsForDimension(currentDimensionData.id, serviceBackground)
      : []
  const progressWidth =
    step >= 2 && step < resultStep
      ? (currentDimension * 100) / DIMENSIONS.length +
        ((currentQuestion + 1) / currentQuestions.length) * (100 / DIMENSIONS.length)
      : 0

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {step >= 2 && step < resultStep && (
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="mx-auto max-w-3xl px-6 py-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 font-medium">
                  {currentDimension + 1}
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">{currentDimensionData.name}</h3>
                  <p className="text-sm text-slate-500">
                    维度 {currentDimension + 1}/{DIMENSIONS.length}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExitAssessment}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                退出
              </button>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${progressWidth}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1">{renderCurrentStep()}</div>
    </div>
  )
}
