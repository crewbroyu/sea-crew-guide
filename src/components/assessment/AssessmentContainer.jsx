// src/components/assessment/AssessmentContainer.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import WelcomePage from './WelcomePage'
import BackgroundSelect from './BackgroundSelect'
import QuestionPage from './QuestionPage'
import VocabQuestion from './VocabQuestion'
import RecordingQuestion from './RecordingQuestion'
import DimensionTransition from './DimensionTransition'
import ResultPage from './ResultPage'
import { DIMENSIONS, ALL_QUESTIONS, SERVICE_BACKGROUNDS } from '../../data/assessmentData'
import { calculateDimensionScore, calculateOverallScore, getLevel } from '../../data/assessmentScoring'

export default function AssessmentContainer() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0) // 0: welcome, 1: background select, 2-6: questions, 7: result
  const [currentDimension, setCurrentDimension] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [serviceBackground, setServiceBackground] = useState(null)
  const [answers, setAnswers] = useState({})
  const [dimensionScores, setDimensionScores] = useState({})
  const [overallScore, setOverallScore] = useState(0)
  const [completedDimensions, setCompletedDimensions] = useState(0)

  // 进入测评时检查是否有已完成的测评结果
  useEffect(() => {
    const savedResult = localStorage.getItem('assessment_result');
    if (savedResult) {
      const result = JSON.parse(savedResult);
      if (result.completed) {
        // 直接显示结果页
        setDimensionScores(result.dimensionScores || {});
        setOverallScore(result.overallScore || 0);
        setStep(7);
      }
    }
  }, [])

  // 处理开始测评
  const handleStartAssessment = () => {
    setStep(1)
  }

  // 处理服务背景选择
  const handleBackgroundSelect = (background) => {
    setServiceBackground(background)
    setStep(2)
    setCurrentDimension(0)
    setCurrentQuestion(0)
  }

  // 处理选择答案
  const handleSelectAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  // 处理下一题
  const handleNextQuestion = () => {
    const currentDimensionData = DIMENSIONS[currentDimension]
    let questions

    if (currentDimensionData.id === 'professional') {
      questions = ALL_QUESTIONS.professional[serviceBackground]
    } else {
      questions = ALL_QUESTIONS[currentDimensionData.id]
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      // 完成当前维度
      const dimensionScore = calculateDimensionScore(answers, questions)
      setDimensionScores(prev => ({
        ...prev,
        [currentDimensionData.id]: dimensionScore
      }))

      const newCompletedDimensions = completedDimensions + 1
      setCompletedDimensions(newCompletedDimensions)

      if (currentDimension < DIMENSIONS.length - 1) {
        // 显示维度过渡页
        setStep(step + 1)
      } else {
        // 计算总分并显示结果页
        const finalOverallScore = calculateOverallScore(dimensionScores)
        setOverallScore(finalOverallScore)
        
        // 存储测评结果到localStorage
        const assessmentResult = {
          completed: true,
          completedAt: new Date().toISOString(),
          dimensionScores: dimensionScores,
          overallScore: finalOverallScore,
          level: getLevel(finalOverallScore)
        }
        localStorage.setItem('assessment_result', JSON.stringify(assessmentResult))
        
        // 更新登船路径中任务1的完成状态
        const progress = JSON.parse(localStorage.getItem('boarding_progress') || '{}')
        progress.task1 = { completed: true }
        localStorage.setItem('boarding_progress', JSON.stringify(progress))
        
        setStep(7)
      }
    }
  }

  // 处理上一题
  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  // 处理继续下一维度
  const handleContinueToNextDimension = () => {
    const nextDimension = currentDimension + 1
    setCurrentDimension(nextDimension)
    setCurrentQuestion(0)
    setStep(2 + nextDimension)
  }

  // 处理重新测评
  const handleRestartAssessment = () => {
    setStep(0)
    setCurrentDimension(0)
    setCurrentQuestion(0)
    setServiceBackground(null)
    setAnswers({})
    setDimensionScores({})
    setOverallScore(0)
    setCompletedDimensions(0)
  }

  // 处理退出测评
  const handleExitAssessment = () => {
    if (window.confirm('测评还没完成，退出将丢失进度，确定离开吗？')) {
      navigate('/jobs/preparation')
    }
  }

  // 渲染当前步骤
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
          const dimensionData = DIMENSIONS[currentDimension]
          let questions

          if (dimensionData.id === 'professional') {
            questions = ALL_QUESTIONS.professional[serviceBackground]
          } else {
            questions = ALL_QUESTIONS[dimensionData.id]
          }

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
          } else if (dimensionData.id === 'english' && currentQuestion === 3) {
            // 维度2第4题：录音题
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
          } else {
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
        } else if (step > 2 + currentDimension) {
          // 显示维度过渡页
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
            onRestart={handleRestartAssessment}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部进度条 */}
      {step >= 2 && step <= 6 && (
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-medium">
                  {currentDimension + 1}
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">{DIMENSIONS[currentDimension].name}</h3>
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
                style={{ width: `${((currentDimension * 100) / DIMENSIONS.length) + ((currentQuestion + 1) / (DIMENSIONS[currentDimension].id === 'professional' ? ALL_QUESTIONS.professional[serviceBackground].length : ALL_QUESTIONS[DIMENSIONS[currentDimension].id].length) * (100 / DIMENSIONS.length))}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 主要内容 */}
      <div className="flex-1">
        {renderCurrentStep()}
      </div>
    </div>
  )
}
