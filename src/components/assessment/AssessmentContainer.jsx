// src/components/assessment/AssessmentContainer.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import WelcomePage from './WelcomePage'
import BackgroundSelect from './BackgroundSelect'
import QuestionPage from './QuestionPage'
import VocabQuestion from './VocabQuestion'
import RecordingQuestion from './RecordingQuestion'
import DimensionTransition from './DimensionTransition'
import ResultPage from './ResultPage'
import { DIMENSIONS, ALL_QUESTIONS } from '../../data/assessmentData'
import { calculateDimensionScore, calculateOverallScore, getLevel } from '../../data/assessmentScoring'

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
  if (dimensionId === 'professional') {
    return ALL_QUESTIONS.professional[serviceBackground]
  }

  return ALL_QUESTIONS[dimensionId]
}

export default function AssessmentContainer() {
  const navigate = useNavigate()
  const [savedAssessmentResult] = useState(getSavedAssessmentResult)
  const [step, setStep] = useState(savedAssessmentResult ? 7 : 0)
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
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }))
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
    progress.task1 = { completed: true }
    localStorage.setItem('boarding_progress', JSON.stringify(progress))

    setStep(7)
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
    if (window.confirm('测评还没完成，退出将丢失进度，确定离开吗？')) {
      navigate('/jobs/preparation')
    }
  }

  const renderQuestionStep = () => {
    const dimensionData = DIMENSIONS[currentDimension]
    const questions = getQuestionsForDimension(dimensionData.id, serviceBackground)
    const currentQuestionData = questions[currentQuestion]

    if (currentQuestionData.type === 'multi' && currentQuestionData.scoringRule === 'vocab') {
      return (
        <VocabQuestion
          question={currentQuestionData}
          dimension={dimensionData}
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

    if (dimensionData.id === 'english' && currentQuestion === 3) {
      return (
        <RecordingQuestion
          question={currentQuestionData}
          dimension={dimensionData}
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

    return (
      <QuestionPage
        question={currentQuestionData}
        dimension={dimensionData}
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
    switch (step) {
      case 0:
        return <WelcomePage onStart={handleStartAssessment} />
      case 1:
        return <BackgroundSelect onSelect={handleBackgroundSelect} />
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
        if (step === 2 + currentDimension) {
          return renderQuestionStep()
        }

        if (step > 2 + currentDimension) {
          return (
            <DimensionTransition
              dimension={DIMENSIONS[currentDimension]}
              completedDimensions={completedDimensions}
              totalDimensions={DIMENSIONS.length}
              onContinue={handleContinueToNextDimension}
            />
          )
        }
        break
      case 7:
        return (
          <ResultPage
            dimensionScores={dimensionScores}
            overallScore={overallScore}
            serviceBackground={serviceBackground}
            answers={answers}
            onRestart={handleRestartAssessment}
          />
        )
      default:
        return null
    }

    return null
  }

  const currentDimensionData = DIMENSIONS[currentDimension]
  const currentQuestions =
    step >= 2 && step <= 6
      ? getQuestionsForDimension(currentDimensionData.id, serviceBackground)
      : []
  const progressWidth =
    step >= 2 && step <= 6
      ? (currentDimension * 100) / DIMENSIONS.length +
        ((currentQuestion + 1) / currentQuestions.length) * (100 / DIMENSIONS.length)
      : 0

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {step >= 2 && step <= 6 && (
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-medium">
                  {currentDimension + 1}
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">{currentDimensionData.name}</h3>
                  <p className="text-sm text-gray-500">
                    维度 {currentDimension + 1}/{DIMENSIONS.length}
                  </p>
                </div>
              </div>
              <button
                onClick={handleExitAssessment}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                退出
              </button>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
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
