// src/pages/tasks/phase2/Task8MockInterview.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Mic, MicOff, Clock, AlertTriangle, RefreshCw, Home,
  Volume2, Info, Edit3, CheckCircle, LoaderCircle, BrainCircuit
} from 'lucide-react';
import { positionConfig } from '../../../data/interviewQuestions';
import interviewQuestions from '../../../data/interviewQuestions';
import RequireActivation from '../../../components/RequireActivation';
import { useAccessStore } from '../../../store/accessStore';
import {
  evaluateInterviewWithAi,
  transcribeInterviewAudio,
} from '../../../services/interviewAiService';
import { syncLocalPathProfile } from '../../../services/userPathService';
import { saveInterviewPracticeRecord } from '../../../services/interviewPracticeService';
import { normalizeInterviewPosition } from '../../../utils/interviewPosition';

const INTERVIEWERS = [
  { id: 1, name: 'Sarah Johnson', title: 'HR Manager', initial: 'SJ', color: 'bg-purple-500' },
  { id: 2, name: 'Michael Chen', title: 'Talent Acquisition', initial: 'MC', color: 'bg-blue-500' },
  { id: 3, name: 'Emily Rodriguez', title: 'Recruitment Specialist', initial: 'ER', color: 'bg-green-500' },
  { id: 4, name: 'David Kim', title: 'Hiring Manager', initial: 'DK', color: 'bg-amber-500' },
  { id: 5, name: 'Jessica Williams', title: 'Talent Director', initial: 'JW', color: 'bg-pink-500' },
  { id: 6, name: 'Robert Lee', title: 'HR Coordinator', initial: 'RL', color: 'bg-indigo-500' },
];

const POSITION_NAMES = {
  bar_server: '酒吧服务员',
  restaurant: '餐厅服务员',
  housekeeping: '客房服务员',
  front_office: '前台接待',
  retail: '免税店销售',
  youth_staff: '儿童看护',
  kitchen: '厨房帮厨',
  utility: '后勤清洁',
};

const RESTAURANT_SERVER_QUESTIONS = [
  { id: 1, question: 'Tell me about yourself and why you want to work as a restaurant server.', keywords: ['customer', 'service', 'experience', 'team', 'enjoy', 'people', 'communication'] },
  { id: 2, question: 'What does good customer service mean to you?', keywords: ['attentive', 'responsive', 'friendly', 'professional', 'satisfaction', 'expectations'] },
  { id: 3, question: 'How would you handle a customer who is unhappy with their food?', keywords: ['apologize', 'listen', 'solve', 'manager', 'compensate', 'satisfaction'] },
  { id: 4, question: 'Can you describe a time when you worked as part of a team?', keywords: ['teamwork', 'collaborate', 'support', 'achieve', 'example', 'contribution'] },
  { id: 5, question: 'How do you handle working under pressure during busy hours?', keywords: ['calm', 'prioritize', 'multitask', 'focus', 'efficiency', 'stress'] },
  { id: 6, question: 'What would you do if a customer asked about menu items you are not familiar with?', keywords: ['honest', 'help', 'find', 'manager', 'knowledge', 'assistance'] },
  { id: 7, question: 'Are you comfortable working evenings, weekends, and holidays?', keywords: ['flexible', 'availability', 'willing', 'schedule', 'commitment'] },
  { id: 8, question: 'How would you deal with a difficult coworker?', keywords: ['communicate', 'respect', 'resolve', 'professional', 'team', 'conflict'] },
  { id: 9, question: 'Why should we hire you for this position?', keywords: ['skills', 'experience', 'passion', 'value', 'qualifications', 'fit'] },
  { id: 10, question: 'Do you have any experience in the food service industry?', keywords: ['experience', 'restaurant', 'service', 'food', 'beverage', 'previous'] },
];

const readTask2Position = () => {
  try {
    const task2Data = JSON.parse(localStorage.getItem('task2_result') || '{}');
    return normalizeInterviewPosition(task2Data.selectedTargetJob);
  } catch {
    return '';
  }
};

const readSavedInterviewPosition = () => {
  try {
    const task7Data = JSON.parse(localStorage.getItem('task7_data') || '{}');
    return normalizeInterviewPosition(
      task7Data.progress?.position || localStorage.getItem('interviewSelectedPosition')
    );
  } catch {
    return normalizeInterviewPosition(localStorage.getItem('interviewSelectedPosition'));
  }
};

const pickInterviewer = () =>
  INTERVIEWERS[Math.floor(Math.random() * INTERVIEWERS.length)];

const buildInterviewQuestions = (position) => {
  let allQuestions = interviewQuestions[position]?.questions
    ? [...interviewQuestions[position].questions]
    : [...RESTAURANT_SERVER_QUESTIONS];

  const selected = [
    {
      question: "Tell me about yourself and why you're interested in this position.",
      keywords: ['experience', 'skills', 'passion', 'customer', 'team', 'service', 'enjoy'],
    },
    {
      question: 'Why do you want to work on a cruise ship?',
      keywords: ['travel', 'experience', 'culture', 'customer service', 'adventure', 'team', 'opportunity'],
    },
  ];

  allQuestions = allQuestions.filter((item) => {
    const question = item.question.toLowerCase();
    return !question.includes('tell me about yourself')
      && !question.includes('why do you want to work on a cruise ship');
  });

  for (let index = 0; index < 5 && allQuestions.length > 0; index += 1) {
    const randomIndex = Math.floor(Math.random() * allQuestions.length);
    selected.push(allQuestions[randomIndex]);
    allQuestions.splice(randomIndex, 1);
  }

  return selected;
};

function Task8MockInterview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { openRegisterModal, openUnlockModal } = useAccessStore();

  // ===== 判断来源 =====
  const fromAcademy = location.state?.from === 'academy';

  // 如果从学院进入，清除之前选择的职位，强制显示职位选择页面
  useEffect(() => {
    if (fromAcademy) {
      localStorage.removeItem('interviewSelectedPosition');
    }
  }, [fromAcademy]);

  // ==================== State ====================
  const [task2Position] = useState(readTask2Position);
  const [stage, setStage] = useState('ready');
  const [selectedPosition, setSelectedPosition] = useState(() =>
    fromAcademy ? null : task2Position || readSavedInterviewPosition()
  );
  const [showPositionSelector, setShowPositionSelector] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState(() =>
    selectedPosition ? buildInterviewQuestions(selectedPosition) : []
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [manualAnswer, setManualAnswer] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [selectedInterviewer, setSelectedInterviewer] = useState(pickInterviewer);
  const [browserSupported, setBrowserSupported] = useState(() =>
    Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder)
  );
  const [currentStatus, setCurrentStatus] = useState('');
  const [recognitionStatus, setRecognitionStatus] = useState('idle');
  const [answerReady, setAnswerReady] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiErrorCode, setAiErrorCode] = useState('');
  const [showMismatchModal, setShowMismatchModal] = useState(false);

  // ==================== Refs ====================
  const recognizedTextRef = useRef('');
  const manualAnswerRef = useRef('');
  const currentQuestionIndexRef = useRef(0);
  const answersRef = useRef([]);
  const answerDetailsRef = useRef([]);
  const isTransitioningRef = useRef(false);
  const extractedQuestionsRef = useRef(extractedQuestions);
  const isRecordingRef = useRef(false);
  const recordingTimerRef = useRef(null);
  const recordingTimeRef = useRef(0);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const currentAudioBlobRef = useRef(null);
  const stopRecordingResolverRef = useRef(null);
  const answerReadyRef = useRef(false);
  const textOnlyModeRef = useRef(false);

  // 同步 ref
  useEffect(() => { currentQuestionIndexRef.current = currentQuestionIndex; }, [currentQuestionIndex]);
  useEffect(() => { extractedQuestionsRef.current = extractedQuestions; }, [extractedQuestions]);
  useEffect(() => { manualAnswerRef.current = manualAnswer; }, [manualAnswer]);
  useEffect(() => { recognizedTextRef.current = recognizedText; }, [recognizedText]);
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);
  useEffect(() => { recordingTimeRef.current = recordingTime; }, [recordingTime]);
  useEffect(() => { answerReadyRef.current = answerReady; }, [answerReady]);

  const getTask2PositionName = () => {
    const position = positionConfig.find(p => p.key === task2Position);
    return position ? `${position.icon} ${position.nameZh}` : '';
  };

  const handleUseTask2Position = () => {
    if (task2Position) {
      selectPosition(task2Position);
      setShowMismatchModal(false);
    }
  };

  const selectPosition = (value) => {
    const normalizedPosition = normalizeInterviewPosition(value);
    const questions = buildInterviewQuestions(normalizedPosition);
    setSelectedPosition(normalizedPosition);
    setExtractedQuestions(questions);
    extractedQuestionsRef.current = questions;
    localStorage.setItem('interviewSelectedPosition', normalizedPosition);
  };

  // ==================== 工具函数 ====================
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ==================== 语音合成 ====================
  const speakQuestion = (text) => {
    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
        // 安全超时：如果语音合成卡住，15秒后强制继续
        setTimeout(() => {
          window.speechSynthesis.cancel();
          resolve();
        }, 15000);
      } else {
        setTimeout(resolve, 2000);
      }
    });
  };

  // ==================== 核心流程 ====================
  const startInterview = async () => {
    setAiError('');
    textOnlyModeRef.current = false;

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setBrowserSupported(false);
      setStage('interviewing');
      setCurrentStatus('micError');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());

      setStage('interviewing');
      await startInterviewProcess(0);
    } catch (error) {
      console.error('Microphone error:', error);
      setStage('interviewing');
      setCurrentStatus('micError');
    }
  };

  const startInterviewProcess = async (questionIndex) => {
    if (questionIndex < extractedQuestionsRef.current.length) {
      // 重置当前题的状态
      setRecognizedText('');
      recognizedTextRef.current = '';
      setManualAnswer('');
      manualAnswerRef.current = '';
      setAnswerReady(false);
      answerReadyRef.current = false;
      currentAudioBlobRef.current = null;
      setRecognitionStatus(textOnlyModeRef.current ? 'unsupported' : 'idle');
      setAiError('');

      setCurrentStatus('interviewerSpeaking');
      await speakQuestion(extractedQuestionsRef.current[questionIndex]?.question);
      await new Promise(resolve => setTimeout(resolve, 800));

      setCurrentStatus('waitingForAnswer');
      if (!textOnlyModeRef.current) {
        await startListening();
      }
    } else {
      await finishInterview();
    }
  };

  const releaseMediaStream = () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];
      currentAudioBlobRef.current = null;
      const mimeType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
      ].find((type) => MediaRecorder.isTypeSupported?.(type));
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 32000,
      });

      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || mimeType || 'audio/webm',
        });
        currentAudioBlobRef.current = blob;
        releaseMediaStream();
        const resolve = stopRecordingResolverRef.current;
        stopRecordingResolverRef.current = null;
        resolve?.(blob);
      };
      recorder.onerror = () => {
        releaseMediaStream();
        setRecognitionStatus('error');
        setAiError('录音失败，请重新尝试或改用文字回答。');
      };

      recorder.start();
      setIsRecording(true);
      isRecordingRef.current = true;
      setRecordingTime(0);
      recordingTimeRef.current = 0;
      setRecognitionStatus('recording');

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((previous) => {
          const next = Math.min(previous + 1, 120);
          recordingTimeRef.current = next;
          if (next >= 120) void finishCurrentQuestion();
          return next;
        });
      }, 1000);
    } catch (error) {
      console.error('Recording start failed:', error);
      releaseMediaStream();
      setIsRecording(false);
      isRecordingRef.current = false;
      setRecognitionStatus('error');
      setCurrentStatus('micError');
    }
  };

  const stopListening = ({ discard = false } = {}) => {
    isRecordingRef.current = false;
    setIsRecording(false);

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    return new Promise((resolve) => {
      const finish = (blob) => {
        if (discard) currentAudioBlobRef.current = null;
        resolve(discard ? null : blob);
      };
      const recorder = mediaRecorderRef.current;

      if (recorder?.state === 'recording') {
        stopRecordingResolverRef.current = finish;
        recorder.stop();
        return;
      }

      releaseMediaStream();
      finish(currentAudioBlobRef.current);
    });
  };

  const saveCurrentAnswerAndContinue = async (finalAnswer) => {
    const currentIdx = currentQuestionIndexRef.current;
    const question = extractedQuestionsRef.current[currentIdx];
    const updatedAnswers = [...answersRef.current, finalAnswer];
    const updatedDetails = [
      ...answerDetailsRef.current,
      {
        questionId: question?.id || String(currentIdx + 1),
        textAnswer: finalAnswer,
        durationSeconds: recordingTimeRef.current,
        transcriptSource: answerReadyRef.current ? 'qwen-audio-3.0-asr-flash' : 'manual',
        answeredAt: new Date().toISOString(),
      },
    ];

    answersRef.current = updatedAnswers;
    answerDetailsRef.current = updatedDetails;

    const nextIdx = currentIdx + 1;
    if (nextIdx < extractedQuestionsRef.current.length) {
      setCurrentQuestionIndex(nextIdx);
      currentQuestionIndexRef.current = nextIdx;
      setCurrentStatus('analyzing');
      window.setTimeout(() => {
        isTransitioningRef.current = false;
        void startInterviewProcess(nextIdx);
      }, 900);
      return;
    }

    await finishInterview();
  };

  const finishCurrentQuestion = async () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    const manualText = manualAnswerRef.current.trim();
    if (answerReadyRef.current && !manualText) {
      setAiError('请确认或修改转写文字后再进入下一题。');
      isTransitioningRef.current = false;
      return;
    }

    if (answerReadyRef.current || manualText) {
      await stopListening({ discard: !answerReadyRef.current });
      await saveCurrentAnswerAndContinue(manualText);
      return;
    }

    setCurrentStatus('transcribing');
    setRecognitionStatus('transcribing');
    setAiError('');
    const blob = await stopListening();

    if (!blob?.size) {
      setRecognitionStatus('error');
      setAiError('没有读取到录音，请重新录制或直接输入英文回答。');
      setCurrentStatus('waitingForAnswer');
      isTransitioningRef.current = false;
      return;
    }

    try {
      const question = extractedQuestionsRef.current[currentQuestionIndexRef.current];
      const result = await transcribeInterviewAudio(blob, {
        mode: 'premium_mock',
        position: POSITION_NAMES[selectedPosition] || selectedPosition,
        question: question?.question || '',
      });
      setRecognizedText(result.transcript);
      recognizedTextRef.current = result.transcript;
      setManualAnswer(result.transcript);
      manualAnswerRef.current = result.transcript;
      setAnswerReady(true);
      answerReadyRef.current = true;
      setRecognitionStatus('success');
      setCurrentStatus('waitingForAnswer');
    } catch (error) {
      console.error('Task8 transcription failed:', error);
      setRecognitionStatus('error');
      setAiError(error.message || '语音转写失败，请重试或手动输入。');
      setCurrentStatus('waitingForAnswer');
      if (error.code === 'LOGIN_REQUIRED') openRegisterModal();
      if (error.code === 'ACTIVATION_REQUIRED') openUnlockModal();
    } finally {
      isTransitioningRef.current = false;
    }
  };

  const finishInterview = async () => {
    await stopListening();
    setStage('scoring');
    setAiError('');
    setAiErrorCode('');

    const allQuestions = extractedQuestionsRef.current;

    try {
      const evaluationData = await evaluateInterviewWithAi({
        mode: 'premium_mock',
        position: POSITION_NAMES[selectedPosition] || selectedPosition,
        questions: allQuestions,
        answers: answerDetailsRef.current,
      });
      setEvaluation(evaluationData);

      const progressKey = 'boarding_progress';
      const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
      progress.task7AiMock = { completed: true, completedAt: new Date().toISOString() };
      localStorage.setItem(progressKey, JSON.stringify(progress));
      try {
        await saveInterviewPracticeRecord({
          targetPosition: selectedPosition,
          interviewerName: selectedInterviewer?.name || null,
          questions: allQuestions,
          answers: answerDetailsRef.current,
          evaluation: evaluationData,
          source: 'ai_mock_interview',
        });
      } catch (error) {
        console.error('保存 AI 面试记录失败:', error);
      }

      await syncLocalPathProfile({
        target_position: selectedPosition,
        interview_status: 'ai_mock_done',
        application_stage: 'interview',
        career_stage: 'interview_preparation',
        lead_score: evaluationData.overallScore >= 70 ? 90 : 82,
      });

      setStage('result');
      isTransitioningRef.current = false;
    } catch (error) {
      console.error('AI 面试评分失败:', error);
      setAiError(error.message || 'AI 评分生成失败，请稍后重试。');
      setAiErrorCode(error.code || '');
      if (error.code === 'LOGIN_REQUIRED') openRegisterModal();
      if (error.code === 'ACTIVATION_REQUIRED') openUnlockModal();
      isTransitioningRef.current = false;
    }
  };

  const restartInterview = () => {
    void stopListening({ discard: true });
    window.speechSynthesis && window.speechSynthesis.cancel();

    setStage('ready');
    setCurrentQuestionIndex(0);
    currentQuestionIndexRef.current = 0;
    setRecordingTime(0);
    setIsRecording(false);
    isRecordingRef.current = false;
    setRecognizedText('');
    recognizedTextRef.current = '';
    setManualAnswer('');
    manualAnswerRef.current = '';
    setAnswerReady(false);
    answerReadyRef.current = false;
    answersRef.current = [];
    answerDetailsRef.current = [];
    setEvaluation(null);
    setAiError('');
    setCurrentStatus('');
    setRecognitionStatus('idle');
    isTransitioningRef.current = false;
    textOnlyModeRef.current = false;

    if (selectedPosition) {
      const questions = buildInterviewQuestions(selectedPosition);
      setExtractedQuestions(questions);
      extractedQuestionsRef.current = questions;
    }
    setSelectedInterviewer(pickInterviewer());
  };

  const backToTasks = () => {
    void stopListening({ discard: true });
    window.speechSynthesis && window.speechSynthesis.cancel();
    navigate(fromAcademy ? '/academy' : '/tasks/phase2/Task7');
  };

  // ==================== Effects ====================
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current?.state === 'recording') {
        try { mediaRecorderRef.current.stop(); } catch (error) { console.warn('Unable to stop recorder:', error); }
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  // ==================== 渲染 ====================

  if (!selectedPosition) {
    // 从学院进来且没有选择职位，显示职位选择器
    // 没有目标职位时先在当前页面完成选择
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          {task2Position && fromAcademy && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
              <div className="flex items-start gap-2">
                <AlertTriangle size={18} className="text-amber-600 mt-0.5" />
                <p className="text-amber-800 text-sm font-medium">
                  任务2已选择：{getTask2PositionName()}
                </p>
              </div>
            </div>
          )}
          <div className="text-center space-y-6">
            <h2 className="text-xl font-bold text-gray-800">选择目标职位</h2>
            <p className="text-gray-600">请选择你要练习的职位方向</p>
            <div className="space-y-3">
              {positionConfig.map((position) => (
                <button
                  key={position.key}
                  onClick={() => {
                    selectPosition(position.key);
                  }}
                  className="w-full py-3 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                >
                  <span>{position.icon}</span>
                  <span>{position.nameZh} ({position.nameEn})</span>
                </button>
              ))}
            </div>
            {task2Position && (
              <button
                onClick={handleUseTask2Position}
                className="w-full py-3 rounded-lg font-medium bg-amber-600 text-white hover:bg-amber-700"
              >
                使用任务2所选职位
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {showMismatchModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="text-center mb-4">
              <AlertTriangle size={48} className="text-amber-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">职位不一致</h3>
              <p className="text-gray-600">
                你当前选择的职位与任务2所选职位不一致。
              </p>
              <p className="text-gray-600 mt-2">
                任务2选择：<span className="font-medium">{getTask2PositionName()}</span>
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleUseTask2Position}
                className="w-full py-3 rounded-lg font-medium bg-amber-600 text-white hover:bg-amber-700"
              >
                使用任务2所选职位
              </button>
              <button
                onClick={() => setShowMismatchModal(false)}
                className="w-full py-3 rounded-lg font-medium bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                继续使用当前职位
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 头部 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 pt-16 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold">AI模拟面试</h1>
            <p className="text-white/80 text-sm mt-1">目标职位：{POSITION_NAMES[selectedPosition]}</p>
          </div>
          <button onClick={backToTasks} className="text-white/80 hover:text-white"><Home size={20} /></button>
        </div>
      </div>

      {/* ===== 准备阶段 ===== */}
      {stage === 'ready' && (
        <div className="px-6 py-8">
          {/* 职位选择模式 */}
          {showPositionSelector ? (
            <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">🎯 选择面试职位</h2>
              <p className="text-gray-600 text-center mb-6">请选择你要面试的职位</p>
              
              <div className="space-y-3 mb-6">
                {Object.entries(POSITION_NAMES).map(([key, name]) => (
                  <button
                    key={key}
                    onClick={() => {
                      selectPosition(key);
                      setShowPositionSelector(false);
                    }}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      selectedPosition === key 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">{name}</span>
                      {selectedPosition === key && (
                        <CheckCircle size={20} className="text-blue-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setShowPositionSelector(false)}
                className="w-full py-3 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                返回
              </button>
            </div>
          ) : (
            /* 面试准备模式 */
            <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">🎯 AI模拟面试</h2>

              {selectedInterviewer && (
                <div className="flex items-center justify-center mb-6">
                  <div className={`w-20 h-20 rounded-full ${selectedInterviewer.color} flex items-center justify-center text-white text-2xl font-bold`}>
                    {selectedInterviewer.initial}
                  </div>
                  <div className="ml-4 text-center">
                    <h3 className="font-bold text-gray-800">{selectedInterviewer.name}</h3>
                    <p className="text-gray-600 text-sm">{selectedInterviewer.title}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">目标职位：</span>
                  <button
                    onClick={() => setShowPositionSelector(true)}
                    className="font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    {POSITION_NAMES[selectedPosition] || '请选择'}
                    <Edit3 size={14} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">面试题数：</span>
                  <span className="font-medium text-gray-800">7 题（题目从任务7题库中随机抽取）</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">预计时长：</span>
                  <span className="font-medium text-gray-800">10-15 分钟</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-800 mb-2">📋 面试流程说明：</h3>
                <ol className="list-decimal list-inside space-y-2 text-blue-700">
                  <li>AI面试官会用语音向你提问</li>
                  <li>你需要用英语语音回答每个问题</li>
                  <li>结束录音后，AI 会转写；确认文字后进入下一题</li>
                  <li>面试题目从任务7的题库中随机抽取，每次面试题目不同</li>
                  <li>每题回答时间不超过2分钟</li>
                  <li>面试结束后会给出评分和点评</li>
                </ol>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={18} className="text-amber-600 mt-0.5" />
                  <p className="text-amber-800 text-sm">请确保麦克风可用，在安静环境中进行面试</p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
                <div className="flex items-start gap-2">
                  <Info size={18} className="text-gray-600 mt-0.5" />
                  <p className="text-gray-700 text-sm">录音只用于本次转写，不会保存到个人档案；长期保存的是确认后的文字和评分。</p>
                </div>
              </div>

              {!browserSupported && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={18} className="text-red-600 mt-0.5" />
                    <div>
                      <p className="text-red-800 text-sm font-medium">您的浏览器不支持网页录音</p>
                      <p className="text-red-700 text-sm mt-1">仍可使用文字输入方式完成面试</p>
                    </div>
                  </div>
                </div>
              )}

              <RequireActivation variant="inline" productCode={selectedPosition === 'bar_server' ? 'bar_server_pack' : undefined}>
              <button
                onClick={startInterview}
                disabled={!selectedPosition}
                className={`w-full py-4 rounded-lg font-medium transition-colors text-lg ${
                  selectedPosition 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                开始面试
              </button>
              </RequireActivation>
            </div>
          )}
        </div>
      )}

      {/* ===== 面试进行中 ===== */}
      {stage === 'interviewing' && (
        <div className="px-6 py-8">
          <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl mx-auto">
            {/* 顶部信息 */}
            <div className="flex justify-between items-center mb-6">
              {selectedInterviewer && (
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${selectedInterviewer.color} flex items-center justify-center text-white text-lg font-bold`}>
                    {selectedInterviewer.initial}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{selectedInterviewer.name}</p>
                    <p className="text-xs text-gray-600">{selectedInterviewer.title}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Clock size={16} />
                <span>{formatTime(recordingTime)}</span>
              </div>
            </div>

            {/* 进度 */}
            <div className="flex justify-between items-center mb-6">
              <div className="font-medium text-gray-800">
                问题 {currentQuestionIndex + 1} / {extractedQuestions.length}
              </div>
              <div className="w-3/4 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / extractedQuestions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* 麦克风错误 */}
            {currentStatus === 'micError' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <AlertTriangle size={32} className="text-red-500 mx-auto mb-3" />
                <p className="font-medium text-red-800 mb-2">无法访问麦克风</p>
                <p className="text-red-700 text-sm mb-4">您可以使用文字输入模式继续面试</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => { setStage('ready'); setCurrentStatus(''); }}
                    className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300">返回</button>
                  <button onClick={() => {
                    textOnlyModeRef.current = true;
                    setRecognitionStatus('unsupported');
                    setCurrentStatus('');
                    void startInterviewProcess(currentQuestionIndexRef.current);
                  }}
                    className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">用文字模式继续</button>
                </div>
              </div>
            )}

            {/* 面试官提问中 */}
            {currentStatus === 'interviewerSpeaking' && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full ${selectedInterviewer?.color || 'bg-blue-500'} flex items-center justify-center text-white text-lg font-bold flex-shrink-0`}>
                      {selectedInterviewer?.initial || 'AI'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 mb-1">{selectedInterviewer?.name || 'AI面试官'}：</p>
                      <p className="text-gray-600">{extractedQuestions[currentQuestionIndex]?.question}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Volume2 size={20} className="text-blue-600 animate-pulse" />
                    <span className="font-medium text-blue-800">面试官提问中...</span>
                  </div>
                  <div className="flex gap-1 justify-center">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-4 w-2 rounded-full bg-blue-500 animate-pulse"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 等待回答 */}
            {currentStatus === 'waitingForAnswer' && (
              <div className="space-y-4">
                {/* 题目 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full ${selectedInterviewer?.color || 'bg-blue-500'} flex items-center justify-center text-white text-lg font-bold flex-shrink-0`}>
                      {selectedInterviewer?.initial || 'AI'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 mb-1">{selectedInterviewer?.name || 'AI面试官'}：</p>
                      <p className="text-gray-600">{extractedQuestions[currentQuestionIndex]?.question}</p>
                    </div>
                  </div>
                </div>

                {/* 录音与转写状态 */}
                <div className={`border rounded-lg p-3 ${
                  recognitionStatus === 'recording' ? 'bg-green-50 border-green-200' :
                  recognitionStatus === 'success' ? 'bg-blue-50 border-blue-200' :
                  recognitionStatus === 'error' ? 'bg-red-50 border-red-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {recognitionStatus === 'recording' ? (
                      <>
                        <Mic size={16} className="text-green-600 animate-pulse" />
                        <span className="text-sm font-medium text-green-800">正在录音，请用英语完整回答</span>
                      </>
                    ) : recognitionStatus === 'success' ? (
                      <>
                        <CheckCircle size={16} className="text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">AI 转写完成，请检查下方文字</span>
                      </>
                    ) : recognitionStatus === 'error' ? (
                      <>
                        <MicOff size={16} className="text-red-600" />
                        <span className="text-sm font-medium text-red-800">录音或转写出错，请在下方输入回答</span>
                      </>
                    ) : recognitionStatus === 'unsupported' ? (
                      <>
                        <MicOff size={16} className="text-gray-600" />
                        <span className="text-sm font-medium text-gray-800">当前为文字回答模式</span>
                      </>
                    ) : (
                      <>
                        <Mic size={16} className="text-gray-600" />
                        <span className="text-sm font-medium text-gray-800">正在准备录音...</span>
                      </>
                    )}
                  </div>
                </div>

                {/* 文字输入区域 */}
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="font-medium text-gray-800 mb-2 flex items-center gap-1">
                    <Edit3 size={14} />
                    {recognizedText ? '修改或补充你的回答：' : '在此输入你的英文回答：'}
                  </p>
                  <textarea
                    value={manualAnswer}
                    onChange={(e) => { setManualAnswer(e.target.value); manualAnswerRef.current = e.target.value; }}
                    placeholder="Type your answer in English here... (e.g., I have two years of experience working in restaurants. I enjoy providing excellent customer service...)"
                    className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    录音结束后转写会自动填入这里；你也可以直接输入或修改英文回答。
                  </p>
                </div>

                {aiError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {aiError}
                  </div>
                )}

                {/* 结束按钮 */}
                <button
                  onClick={finishCurrentQuestion}
                  disabled={recognitionStatus === 'transcribing'}
                  className="w-full py-3 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {answerReady
                    ? currentQuestionIndex < extractedQuestions.length - 1
                      ? '确认转写，进入下一题'
                      : '确认转写，生成 AI 报告'
                    : manualAnswer.trim()
                      ? currentQuestionIndex < extractedQuestions.length - 1
                        ? '保存文字回答，进入下一题'
                        : '保存文字回答，生成 AI 报告'
                      : isRecording
                        ? '结束录音并转写'
                        : '提交当前回答'}
                </button>
              </div>
            )}

            {currentStatus === 'transcribing' && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 text-center">
                <LoaderCircle size={32} className="mx-auto mb-3 animate-spin text-blue-600" />
                <p className="font-medium text-blue-900">AI 正在转写你的回答</p>
                <p className="mt-1 text-sm text-blue-700">完成后请确认文字，再进入下一题。</p>
              </div>
            )}

            {/* 过渡 */}
            {currentStatus === 'analyzing' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <CheckCircle size={32} className="text-green-500 mx-auto mb-3" />
                <p className="font-medium text-gray-800">回答已记录 ✓</p>
                <p className="text-gray-600 text-sm mt-1">正在准备下一题...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== 评分中 ===== */}
      {stage === 'scoring' && (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            {aiError ? (
              <div className="space-y-5">
                <AlertTriangle size={42} className="mx-auto text-red-500" />
                <h2 className="text-xl font-bold text-gray-800">AI 报告生成失败</h2>
                <p className="text-sm leading-6 text-red-700">{aiError}</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={backToTasks} className="rounded-lg bg-gray-100 px-4 py-3 font-medium text-gray-700">返回</button>
                  <button
                    onClick={() => aiErrorCode === 'AI_QUOTA_EXHAUSTED' ? navigate('/premium?source=task8-ai-quota') : finishInterview()}
                    className="rounded-lg bg-blue-600 px-4 py-3 font-medium text-white"
                  >
                    {aiErrorCode === 'AI_QUOTA_EXHAUSTED' ? '查看权益方案' : '重新生成'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <LoaderCircle size={56} className="mx-auto animate-spin text-blue-600" />
                <h2 className="text-xl font-bold text-gray-800">AI 正在评估面试表现</h2>
                <p className="text-gray-600">正在根据目标岗位、回答证据和英文表达生成报告...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== 评分报告 ===== */}
      {stage === 'result' && evaluation && (
        <div className="px-6 py-8">
          <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl mx-auto">
            <h2 className="mb-6 flex items-center justify-center gap-2 text-2xl font-bold text-gray-800">
              <BrainCircuit size={24} className="text-blue-600" /> AI 面试评估报告
            </h2>

            {/* 综合评分 */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6 text-center">
              <div className="text-4xl font-bold text-blue-700 mb-2">{evaluation.overallScore} / 100</div>
              <div className="flex items-center justify-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`text-xl ${i < evaluation.rating ? 'text-yellow-400' : 'text-gray-300'}`}>⭐</span>
                ))}
                <span className="ml-2 text-gray-700 font-medium">
                  {evaluation.rating >= 5 ? '优秀' :
                   evaluation.rating >= 4 ? '良好' :
                   evaluation.rating >= 3 ? '中等' :
                   evaluation.rating >= 2 ? '一般' : '需改进'}
                </span>
              </div>
            </div>

            {(evaluation.strengths?.length > 0 || evaluation.priorities?.length > 0) && (
              <div className="mb-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-green-100 bg-green-50 p-4 text-left">
                  <h3 className="font-medium text-green-900">表现优势</h3>
                  <ul className="mt-2 space-y-1 text-sm leading-6 text-green-800">
                    {evaluation.strengths?.map((item) => <li key={item}>• {item}</li>)}
                  </ul>
                </div>
                <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 text-left">
                  <h3 className="font-medium text-amber-900">优先改进</h3>
                  <ul className="mt-2 space-y-1 text-sm leading-6 text-amber-800">
                    {evaluation.priorities?.map((item) => <li key={item}>• {item}</li>)}
                  </ul>
                </div>
              </div>
            )}

            {/* 各题得分 */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-800 mb-3">📋 各题详情：</h3>
              <div className="space-y-3">
                {evaluation.questionScores.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-800 mb-2">Q{index + 1}: {item.question}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            item.score >= 16 ? 'bg-green-500' :
                            item.score >= 11 ? 'bg-blue-500' :
                            item.score >= 6 ? 'bg-amber-500' : 'bg-red-400'
                          }`}
                          style={{ width: `${(item.score / 20) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-16 text-right">{item.score} / 20</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-700">你的回答：</span>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.answer || <span className="italic text-gray-400">未作答</span>}
                      </p>
                    </div>
                    {item.matchedKeywords && item.matchedKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {item.matchedKeywords.map((kw, ki) => (
                          <span key={ki} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ {kw}</span>
                        ))}
                      </div>
                    )}
                    <p className="text-sm leading-6 text-blue-700">{item.comment}</p>
                    {item.improvements?.length > 0 && (
                      <p className="mt-2 text-xs leading-5 text-amber-700">
                        优先调整：{item.improvements.slice(0, 2).join('；')}
                      </p>
                    )}
                    {item.improvedAnswer && (
                      <details className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
                        <summary className="cursor-pointer text-xs font-medium text-blue-700">查看参考表达</summary>
                        <p className="mt-2 text-sm leading-6 text-gray-700">{item.improvedAnswer}</p>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 总体建议 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
              <h3 className="font-medium text-amber-800 mb-2">💡 总体建议：</h3>
              <p className="text-amber-700">{evaluation.overallSuggestion}</p>
            </div>

            {/* 按钮 */}
            <div className="flex gap-3">
              <button onClick={restartInterview}
                className="flex-1 py-3 rounded-lg font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 flex items-center justify-center gap-2">
                <RefreshCw size={18} /> 重新面试
              </button>
              <button onClick={backToTasks}
                className="flex-1 py-3 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2">
                <Home size={18} /> {fromAcademy ? '返回学院' : '返回任务列表'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Task8MockInterview;
