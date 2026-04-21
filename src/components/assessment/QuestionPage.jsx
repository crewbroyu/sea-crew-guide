// src/components/assessment/QuestionPage.jsx
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function QuestionPage({
  question,
  dimension,
  currentQuestion,
  totalQuestions,
  currentDimension,
  totalDimensions,
  answers,
  onSelectAnswer,
  onNext,
  onPrev
}) {
  const selectedAnswers = question.type === 'multiple' ? (answers[question.id] || []) : answers[question.id]
  const [played, setPlayed] = useState(false)

  // 生成提示音
  const playBeep = () => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;
    oscillator.start();
    setTimeout(() => oscillator.stop(), 300);
    return new Promise(resolve => setTimeout(resolve, 500));
  };

  // 提示音结束后开始TTS
  const speakText = async (text) => {
    await playBeep();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // 检测是否是维度2的听力题
  const isListeningQuestion = dimension.id === 'english' && currentQuestion === 0;

  // 进入听力题时自动播放
  useEffect(() => {
    if (isListeningQuestion && !played) {
      speakText(question.scenario);
      setPlayed(true);
    }
  }, [isListeningQuestion, question.scenario, played]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 主要内容 */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-md mx-auto">
          {/* 题目编号 */}
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-gray-500">
              第 {currentQuestion + 1} / {totalQuestions} 题
            </div>
            <div className="text-sm text-gray-500">
              维度 {currentDimension} / {totalDimensions}
            </div>
          </div>

          {/* 场景描述 */}
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className={`${isListeningQuestion ? 'text-transparent user-select-none' : 'text-gray-700'}`}>
              {question.scenario}
            </p>
            {isListeningQuestion && (
              <div className="text-center text-gray-500 text-sm mt-2">
                正在播放听力内容...
              </div>
            )}
          </div>

          {/* 选项 */}
          <div className="space-y-3 mb-8">
            {question.options.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  if (question.type === 'multiple') {
                    const newSelected = selectedAnswers.includes(option.id)
                      ? selectedAnswers.filter(id => id !== option.id)
                      : [...selectedAnswers, option.id]
                    onSelectAnswer(question.id, newSelected)
                  } else {
                    onSelectAnswer(question.id, option.id)
                  }
                }}
                className={`w-full py-3 px-4 rounded-lg text-left transition-all ${question.type === 'multiple' 
                  ? selectedAnswers.includes(option.id)
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : 'bg-white border border-gray-200 hover:border-blue-300'
                  : selectedAnswers === option.id
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : 'bg-white border border-gray-200 hover:border-blue-300'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 flex items-center justify-center mt-0.5 ${question.type === 'multiple' 
                    ? selectedAnswers.includes(option.id)
                      ? 'bg-blue-500 text-white border-2 border-blue-500'
                      : 'border-2 border-gray-300'
                    : selectedAnswers === option.id
                      ? 'bg-blue-500 text-white border-2 border-blue-500'
                      : 'border-2 border-gray-300'}`}>
                    {(question.type === 'multiple' ? selectedAnswers.includes(option.id) : selectedAnswers === option.id) && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                  <span className="text-gray-800">{option.text}</span>
                </div>
              </button>
            ))}
          </div>

          {/* 底部按钮 */}
          <div className="flex gap-4">
            <button
              onClick={onPrev}
              disabled={currentQuestion === 0}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${currentQuestion === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              <div className="flex items-center justify-center gap-1">
                <ChevronLeft size={16} />
                上一题
              </div>
            </button>
            <button
              onClick={onNext}
              disabled={question.type === 'multiple' ? selectedAnswers.length === 0 : !selectedAnswers}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${question.type === 'multiple' 
                ? selectedAnswers.length === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
                : !selectedAnswers
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'}`}
            >
              <div className="flex items-center justify-center gap-1">
                {currentQuestion === totalQuestions - 1 ? '完成本维度' : '下一题'}
                <ChevronRight size={16} />
              </div>
            </button>
          </div>

          {/* 题目指示器 */}
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: totalQuestions }).map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${index === currentQuestion
                  ? 'bg-green-600'
                  : 'bg-gray-300'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
