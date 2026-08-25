// src/pages/tasks/phase2/Task8MockInterview.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Mic, MicOff, Clock, AlertTriangle, RefreshCw, Home,
  Volume2, Info, Edit3, CheckCircle, ArrowLeft
} from 'lucide-react';
import { positionConfig } from '../../../data/interviewQuestions';
import interviewQuestions from '../../../data/interviewQuestions';
import RequireActivation from '../../../components/RequireActivation';
import { syncLocalPathProfile } from '../../../services/userPathService';
import { saveInterviewPracticeRecord } from '../../../services/interviewPracticeService';

function Task8MockInterview() {
  const navigate = useNavigate();
  const location = useLocation();

  // ===== 判断来源 =====
  const fromAcademy = location.state?.from === 'academy';

  // 如果从学院进入，清除之前选择的职位，强制显示职位选择页面
  useEffect(() => {
    if (fromAcademy) {
      localStorage.removeItem('interviewSelectedPosition');
    }
  }, [fromAcademy]);

  // ==================== 常量 ====================
  const interviewers = [
    { id: 1, name: 'Sarah Johnson', title: 'HR Manager', initial: 'SJ', color: 'bg-purple-500' },
    { id: 2, name: 'Michael Chen', title: 'Talent Acquisition', initial: 'MC', color: 'bg-blue-500' },
    { id: 3, name: 'Emily Rodriguez', title: 'Recruitment Specialist', initial: 'ER', color: 'bg-green-500' },
    { id: 4, name: 'David Kim', title: 'Hiring Manager', initial: 'DK', color: 'bg-amber-500' },
    { id: 5, name: 'Jessica Williams', title: 'Talent Director', initial: 'JW', color: 'bg-pink-500' },
    { id: 6, name: 'Robert Lee', title: 'HR Coordinator', initial: 'RL', color: 'bg-indigo-500' }
  ];

  const positionNames = {
    bar_server: '酒吧服务员',
    restaurant: '餐厅服务员',
    housekeeping: '客房服务员',
    front_office: '前台接待',
    retail: '免税店销售',
    youth_staff: '儿童看护',
    kitchen: '厨房帮厨',
    utility: '后勤清洁'
  };

  const restaurantServerQuestions = [
    { id: 1, question: "Tell me about yourself and why you want to work as a restaurant server.", keywords: ["customer", "service", "experience", "team", "enjoy", "people", "communication"] },
    { id: 2, question: "What does good customer service mean to you?", keywords: ["attentive", "responsive", "friendly", "professional", "satisfaction", "expectations"] },
    { id: 3, question: "How would you handle a customer who is unhappy with their food?", keywords: ["apologize", "listen", "solve", "manager", "compensate", "satisfaction"] },
    { id: 4, question: "Can you describe a time when you worked as part of a team?", keywords: ["teamwork", "collaborate", "support", "achieve", "example", "contribution"] },
    { id: 5, question: "How do you handle working under pressure during busy hours?", keywords: ["calm", "prioritize", "multitask", "focus", "efficiency", "stress"] },
    { id: 6, question: "What would you do if a customer asked about menu items you are not familiar with?", keywords: ["honest", "help", "find", "manager", "knowledge", "assistance"] },
    { id: 7, question: "Are you comfortable working evenings, weekends, and holidays?", keywords: ["flexible", "availability", "willing", "schedule", "commitment"] },
    { id: 8, question: "How would you deal with a difficult coworker?", keywords: ["communicate", "respect", "resolve", "professional", "team", "conflict"] },
    { id: 9, question: "Why should we hire you for this position?", keywords: ["skills", "experience", "passion", "value", "qualifications", "fit"] },
    { id: 10, question: "Do you have any experience in the food service industry?", keywords: ["experience", "restaurant", "service", "food", "beverage", "previous"] }
  ];

  // ==================== State ====================
  const [stage, setStage] = useState('ready');
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [showPositionSelector, setShowPositionSelector] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [manualAnswer, setManualAnswer] = useState('');
  const [answers, setAnswers] = useState([]);
  const [evaluation, setEvaluation] = useState(null);
  const [selectedInterviewer, setSelectedInterviewer] = useState(null);
  const [browserSupported, setBrowserSupported] = useState(true);
  const [currentStatus, setCurrentStatus] = useState('');
  const [recognitionStatus, setRecognitionStatus] = useState('idle');
  const [task2Position, setTask2Position] = useState(null);
  const [positionMismatch, setPositionMismatch] = useState(false);
  const [showMismatchModal, setShowMismatchModal] = useState(false);
  const [initialPositionLoaded, setInitialPositionLoaded] = useState(false);

  // ==================== Refs ====================
  const recognizedTextRef = useRef('');
  const manualAnswerRef = useRef('');
  const currentQuestionIndexRef = useRef(0);
  const lastSpeechTimeRef = useRef(Date.now());
  const answersRef = useRef([]);
  const isTransitioningRef = useRef(false);
  const extractedQuestionsRef = useRef([]);
  const isRecordingRef = useRef(false);
  const recordingTimerRef = useRef(null);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');

  // 同步 ref
  useEffect(() => { currentQuestionIndexRef.current = currentQuestionIndex; }, [currentQuestionIndex]);
  useEffect(() => { extractedQuestionsRef.current = extractedQuestions; }, [extractedQuestions]);
  useEffect(() => { manualAnswerRef.current = manualAnswer; }, [manualAnswer]);
  useEffect(() => { recognizedTextRef.current = recognizedText; }, [recognizedText]);
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);

  // ==================== 任务2职位绑定 ====================
  useEffect(() => {
    if (initialPositionLoaded) return;
    
    const task2Result = localStorage.getItem('task2_result');
    if (task2Result) {
      const task2Data = JSON.parse(task2Result);
      if (task2Data.selectedTargetJob) {
        setTask2Position(task2Data.selectedTargetJob);
        if (!selectedPosition) {
          setSelectedPosition(task2Data.selectedTargetJob);
          localStorage.setItem('interviewSelectedPosition', task2Data.selectedTargetJob);
          setInitialPositionLoaded(true);
        } else if (selectedPosition !== task2Data.selectedTargetJob) {
          setPositionMismatch(true);
          setShowMismatchModal(true);
        }
      }
    }
  }, [selectedPosition, initialPositionLoaded]);

  const getTask2PositionName = () => {
    const position = positionConfig.find(p => p.key === task2Position);
    return position ? `${position.icon} ${position.nameZh}` : '';
  };

  const handleUseTask2Position = () => {
    if (task2Position) {
      setSelectedPosition(task2Position);
      localStorage.setItem('interviewSelectedPosition', task2Position);
      setShowMismatchModal(false);
      setPositionMismatch(false);
    }
  };

  // ==================== 关键词提取（修复核心） ====================
  const getKeywordsForQuestion = (question) => {
    if (question.keywords && question.keywords.length > 0) return question.keywords;

    const text = (question.question || '').toLowerCase();

    if (text.includes('tell me about yourself'))
      return ['experience', 'skills', 'passion', 'customer', 'team', 'service', 'enjoy'];
    if (text.includes('customer service') || text.includes('good service'))
      return ['attentive', 'friendly', 'professional', 'satisfaction', 'responsive', 'expectations'];
    if (text.includes('unhappy') || text.includes('complaint') || text.includes('difficult') || text.includes('rude'))
      return ['apologize', 'listen', 'solve', 'calm', 'empathy', 'resolution', 'manager'];
    if (text.includes('team'))
      return ['collaborate', 'support', 'communicate', 'achieve', 'contribution', 'together'];
    if (text.includes('pressure') || text.includes('busy') || text.includes('stress'))
      return ['calm', 'prioritize', 'multitask', 'focus', 'efficiency', 'organized'];
    if (text.includes('allergy') || text.includes('dietary'))
      return ['safety', 'inform', 'kitchen', 'careful', 'alternative', 'health', 'chef'];
    if (text.includes('upsell') || text.includes('recommend') || text.includes('suggest'))
      return ['recommend', 'describe', 'enthusiasm', 'knowledge', 'pairing', 'special', 'feature'];
    if (text.includes('pos') || text.includes('system') || text.includes('technology') || text.includes('order management'))
      return ['experience', 'efficient', 'accurate', 'learn', 'technology', 'training', 'system'];
    if (text.includes('why should we hire') || text.includes('why this position') || text.includes('why do you want'))
      return ['skills', 'experience', 'passion', 'value', 'dedication', 'fit', 'growth'];
    if (text.includes('schedule') || text.includes('weekend') || text.includes('holiday') || text.includes('flexible'))
      return ['flexible', 'available', 'willing', 'commitment', 'reliable', 'schedule'];
    if (text.includes('coworker') || text.includes('colleague') || text.includes('conflict'))
      return ['communicate', 'respect', 'resolve', 'professional', 'understanding', 'team'];
    if (text.includes('mistake') || text.includes('error') || text.includes('wrong'))
      return ['apologize', 'responsibility', 'correct', 'learn', 'prevent', 'honest'];
    if (text.includes('multitask') || text.includes('multiple'))
      return ['organize', 'prioritize', 'efficient', 'calm', 'focus', 'time'];
    if (text.includes('experience'))
      return ['experience', 'restaurant', 'service', 'customer', 'skills', 'learned'];

    return ['experience', 'example', 'skill', 'team', 'customer', 'service'];
  };

  // ==================== 题目抽取 ====================
  const extractInterviewQuestions = (position) => {
    let allQuestions = [];
    if (interviewQuestions[position]?.questions) {
      allQuestions = [...interviewQuestions[position].questions];
    } else {
      allQuestions = [...restaurantServerQuestions];
    }

    const selected = [];
    
    // 第1题：固定自我介绍
    const selfIntroQuestion = {
      question: "Tell me about yourself and why you're interested in this position.",
      keywords: ["experience", "skills", "passion", "customer", "team", "service", "enjoy"]
    };
    selected.push(selfIntroQuestion);
    
    // 第2题：固定邮轮工作动机
    const cruiseQuestion = {
      question: "Why do you want to work on a cruise ship?",
      keywords: ["travel", "experience", "culture", "customer service", "adventure", "team", "opportunity"]
    };
    selected.push(cruiseQuestion);
    
    // 从题库中移除可能存在的这两道题，避免重复
    allQuestions = allQuestions.filter(q => {
      const lowerQ = q.question.toLowerCase();
      return !lowerQ.includes('tell me about yourself') && !lowerQ.includes('why do you want to work on a cruise ship');
    });
    
    // 从剩余题库中随机选择5道题
    for (let i = 0; i < 5 && allQuestions.length > 0; i++) {
      const randIdx = Math.floor(Math.random() * allQuestions.length);
      selected.push(allQuestions[randIdx]);
      allQuestions.splice(randIdx, 1);
    }

    return selected;
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

  // ==================== 语音识别（修复核心） ====================
  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionStatus('unsupported');
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('[Speech] Recognition started');
      setRecognitionStatus('listening');
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      const fullText = (finalTranscriptRef.current + interimTranscript).trim();
      setRecognizedText(fullText);
      recognizedTextRef.current = fullText;
      lastSpeechTimeRef.current = Date.now();
      console.log('[Speech] Recognized:', fullText.slice(-60));
    };

    recognition.onerror = (event) => {
      console.error('[Speech] Error:', event.error);
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return; // 这些是正常情况，不需要报错
      }
      if (event.error === 'network') {
        // 网络错误，可能是 SpeechRecognition 服务不可用，切换到文字输入
        setRecognitionStatus('error');
        // 不自动重启，避免无限循环
        isRecordingRef.current = false;
        setIsRecording(false);
      } else {
        setRecognitionStatus('error');
      }
    };

    recognition.onend = () => {
      console.log('[Speech] Recognition ended, isRecording:', isRecordingRef.current);
      if (isRecordingRef.current) {
        // 还在录音中，尝试重启识别
        try {
          setTimeout(() => {
            if (isRecordingRef.current) {
              // 检查当前状态，如果是错误状态则不重启
              if (recognitionStatus !== 'error') {
                recognition.start();
                console.log('[Speech] Recognition restarted');
              } else {
                console.log('[Speech] Not restarting due to error status');
              }
            }
          }, 100);
        } catch (e) {
          console.error('[Speech] Failed to restart:', e);
          setRecognitionStatus('error');
        }
      } else {
        setRecognitionStatus('idle');
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      console.log('[Speech] Recognition start called');
    } catch (e) {
      console.error('[Speech] Failed to start:', e);
      setRecognitionStatus('error');
    }
  };

  // ==================== 核心流程 ====================
  const startInterview = async () => {
    try {
      // 检查麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // 立即释放，避免和 SpeechRecognition 抢占麦克风
      stream.getTracks().forEach(track => track.stop());

      setStage('interviewing');
      startInterviewProcess(0);
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
      finalTranscriptRef.current = '';
      setManualAnswer('');
      manualAnswerRef.current = '';

      setCurrentStatus('interviewerSpeaking');
      await speakQuestion(extractedQuestionsRef.current[questionIndex]?.question);
      await new Promise(resolve => setTimeout(resolve, 800));

      setCurrentStatus('waitingForAnswer');
      startListening();
    } else {
      finishInterview();
    }
  };

  const startListening = () => {
    setIsRecording(true);
    isRecordingRef.current = true;
    setRecordingTime(0);
    lastSpeechTimeRef.current = Date.now();

    // 开始计时
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= 120) {
          finishCurrentQuestion();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    // 启动语音识别
    startSpeechRecognition();
  };

  const stopListening = () => {
    // 先设标志位，防止 onend 重启识别
    isRecordingRef.current = false;
    setIsRecording(false);

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
      recognitionRef.current = null;
    }

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    setRecognitionStatus('idle');
  };

  const finishCurrentQuestion = () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    stopListening();

    // 优先使用手动输入，其次使用语音识别结果
    const finalAnswer = manualAnswerRef.current.trim() || recognizedTextRef.current.trim() || '';
    const currentIdx = currentQuestionIndexRef.current;

    console.log(`[Q${currentIdx + 1}] Answer saved:`, finalAnswer.slice(0, 80));

    const updatedAnswers = [...answersRef.current, finalAnswer];
    answersRef.current = updatedAnswers;
    setAnswers(updatedAnswers);

    const nextIdx = currentIdx + 1;
    if (nextIdx < extractedQuestionsRef.current.length) {
      setCurrentQuestionIndex(nextIdx);
      currentQuestionIndexRef.current = nextIdx;
      setCurrentStatus('analyzing');

      setTimeout(() => {
        isTransitioningRef.current = false;
        startInterviewProcess(nextIdx);
      }, 1500);
    } else {
      finishInterview();
    }
  };

  const evaluateAnswer = (question, answerText) => {
    const keywords = getKeywordsForQuestion(question);

    const words = answerText.trim().split(/\s+/).filter(w => w.length > 0);
    let lengthScore = 0;
    if (words.length > 60) lengthScore = 8;
    else if (words.length > 30) lengthScore = 7;
    else if (words.length > 15) lengthScore = 6;
    else if (words.length > 10) lengthScore = 5;
    else if (words.length > 5) lengthScore = 3;
    else if (words.length > 0) lengthScore = 1;
    else lengthScore = 0;

    let keywordScore = 0;
    const lowerAnswer = answerText.toLowerCase();
    const matchedKeywords = [];
    const missedKeywords = [];
    keywords.forEach(keyword => {
      if (lowerAnswer.includes(keyword.toLowerCase())) {
        keywordScore += 2;
        matchedKeywords.push(keyword);
      } else {
        missedKeywords.push(keyword);
      }
    });
    keywordScore = Math.min(keywordScore, 8);

    let fluencyScore = 4;
    if (words.length === 0) fluencyScore = 0;
    else if (words.length < 5) fluencyScore = 1;
    else if (words.length < 15) fluencyScore = 2;
    else if (words.length < 30) fluencyScore = 3;
    else fluencyScore = 4;

    const totalScore = lengthScore + keywordScore + fluencyScore;

    let comment = '';
    if (words.length === 0) {
      comment = "No answer was provided. Try to practice answering this question out loud, or type your response.";
    } else if (totalScore >= 16) {
      comment = "Excellent! Your answer was detailed and covered the key points well.";
    } else if (totalScore >= 11) {
      comment = "Good answer! Try to include more specific examples to make it even stronger.";
    } else if (totalScore >= 6) {
      if (missedKeywords.length > 0) {
        comment = `Decent start, but try to also mention: ${missedKeywords.slice(0, 3).join(', ')}. Adding specific examples would help.`;
      } else {
        comment = "Your answer was a bit short. Try to expand with specific examples from your experience.";
      }
    } else {
      if (missedKeywords.length > 0) {
        comment = `You need more practice. Try to cover these key points: ${missedKeywords.slice(0, 3).join(', ')}. Give longer, more detailed answers.`;
      } else {
        comment = "You need more practice. Try to give longer, more detailed answers with specific examples.";
      }
    }

    return { score: totalScore, lengthScore, keywordScore, fluencyScore, comment, matchedKeywords, missedKeywords };
  };

  const mockScoring = (questions, answersList) => {
    const questionScores = questions.map((q, index) => {
      const ev = evaluateAnswer(q, answersList[index] || '');
      return {
        question: q.question,
        answer: answersList[index] || '',
        score: ev.score,
        maxScore: 20,
        comment: ev.comment,
        matchedKeywords: ev.matchedKeywords,
        missedKeywords: ev.missedKeywords
      };
    });

    const maxPossible = questionScores.length * 20;
    const totalPoints = questionScores.reduce((sum, item) => sum + item.score, 0);
    const overallScore = maxPossible > 0 ? Math.round((totalPoints / maxPossible) * 100) : 0;
    const rating = Math.max(1, Math.ceil(overallScore / 20));

    let overallSuggestion = '';
    if (overallScore >= 80) {
      overallSuggestion = "Excellent job! Your answers were detailed and covered all the key points. You're well-prepared for the interview.";
    } else if (overallScore >= 60) {
      overallSuggestion = "Good job! Your answers were solid, but try to include more specific examples and details to stand out.";
    } else if (overallScore >= 30) {
      overallSuggestion = "You're on the right track, but need more practice. Focus on expanding your answers and including specific examples from your experience.";
    } else {
      overallSuggestion = "You need more practice. Make sure to speak clearly and give detailed answers. Try using the text input if speech recognition isn't capturing your voice well.";
    }

    return { overallScore, rating, questionScores, overallSuggestion };
  };

  const finishInterview = () => {
    stopListening();
    setStage('scoring');

    const allAnswers = answersRef.current;
    const allQuestions = extractedQuestionsRef.current;

    setTimeout(async () => {
      const evaluationData = mockScoring(allQuestions, allAnswers);
      setEvaluation(evaluationData);

      const progressKey = 'boarding_progress';
      const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
      progress.task8 = { completed: true, completedAt: new Date().toISOString() };
      localStorage.setItem(progressKey, JSON.stringify(progress));
      try {
        await saveInterviewPracticeRecord({
          targetPosition: selectedPosition,
          interviewerName: selectedInterviewer?.name || null,
          questions: allQuestions,
          answers: allAnswers,
          evaluation: evaluationData,
        });
      } catch (error) {
        console.error('保存 AI 面试记录失败:', error);
      }

      await syncLocalPathProfile({
        target_position: selectedPosition,
        interview_status: 'ai_mock_done',
        application_stage: 'interview',
        career_stage: 'interview_preparation',
        last_completed_task_id: 8,
        lead_score: evaluationData.overallScore >= 70 ? 90 : 82,
      });

      setStage('result');
      isTransitioningRef.current = false;
    }, 3000);
  };

  const restartInterview = () => {
    stopListening();
    window.speechSynthesis && window.speechSynthesis.cancel();

    setStage('ready');
    setCurrentQuestionIndex(0);
    currentQuestionIndexRef.current = 0;
    setRecordingTime(0);
    setIsRecording(false);
    isRecordingRef.current = false;
    setRecognizedText('');
    recognizedTextRef.current = '';
    finalTranscriptRef.current = '';
    setManualAnswer('');
    manualAnswerRef.current = '';
    setAnswers([]);
    answersRef.current = [];
    setEvaluation(null);
    setCurrentStatus('');
    setRecognitionStatus('idle');
    isTransitioningRef.current = false;

    if (selectedPosition) {
      const questions = extractInterviewQuestions(selectedPosition);
      setExtractedQuestions(questions);
      extractedQuestionsRef.current = questions;
    }
  };

  const backToTasks = () => {
    stopListening();
    window.speechSynthesis && window.speechSynthesis.cancel();
    navigate(fromAcademy ? '/academy' : '/tasks');
  };

  const goToTask7 = () => navigate('/tasks/phase2/Task7');

  // ==================== Effects ====================
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setBrowserSupported(!!SpeechRecognition && 'speechSynthesis' in window);
  }, []);

  useEffect(() => {
    if (stage === 'ready') {
      setSelectedInterviewer(interviewers[Math.floor(Math.random() * interviewers.length)]);
    }
  }, [stage]);

  useEffect(() => {
    // 如果从学院进入，不自动加载职位，显示职位选择页面
    if (fromAcademy) {
      return;
    }
    
    // 从任务进入时，加载之前选择的职位
    const task7Data = JSON.parse(localStorage.getItem('task7_data') || '{}');
    if (task7Data.progress?.position) {
      setSelectedPosition(task7Data.progress.position);
    } else {
      const pos = localStorage.getItem('interviewSelectedPosition');
      if (pos) setSelectedPosition(pos);
    }
  }, [fromAcademy]);

  useEffect(() => {
    if (selectedPosition) {
      const questions = extractInterviewQuestions(selectedPosition);
      setExtractedQuestions(questions);
      extractedQuestionsRef.current = questions;
    }
  }, [selectedPosition]);

  useEffect(() => {
    if (!fromAcademy) {
      const progress = JSON.parse(localStorage.getItem('boarding_progress') || '{}');
      if (!progress.task7?.completed) {
        navigate('/tasks');
      }
    }
  }, [navigate, fromAcademy]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
      }
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  // ==================== 渲染 ====================

  if (!selectedPosition) {
    // 从学院进来且没有选择职位，显示职位选择器
    // 从任务进来且没有选择职位，提示完成任务7
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
                    setSelectedPosition(position.key);
                    localStorage.setItem('interviewSelectedPosition', position.key);
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
            <p className="text-white/80 text-sm mt-1">目标职位：{positionNames[selectedPosition]}</p>
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
                {Object.entries(positionNames).map(([key, name]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedPosition(key);
                      localStorage.setItem('interviewSelectedPosition', key);
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
                    {positionNames[selectedPosition] || '请选择'}
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
                  <li>如果语音识别不工作，可以直接打字输入</li>
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
                  <p className="text-gray-700 text-sm">推荐使用 Chrome 或 Edge 浏览器以获得最佳语音识别体验</p>
                </div>
              </div>

              {!browserSupported && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={18} className="text-red-600 mt-0.5" />
                    <div>
                      <p className="text-red-800 text-sm font-medium">您的浏览器不完全支持语音功能</p>
                      <p className="text-red-700 text-sm mt-1">仍可使用文字输入方式完成面试</p>
                    </div>
                  </div>
                </div>
              )}

              <RequireActivation variant="inline">
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
                  <button onClick={() => { setCurrentStatus(''); startInterviewProcess(0); }}
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

                {/* 语音识别状态 */}
                <div className={`border rounded-lg p-3 ${
                  recognitionStatus === 'listening' ? 'bg-green-50 border-green-200' :
                  recognitionStatus === 'error' ? 'bg-red-50 border-red-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {recognitionStatus === 'listening' ? (
                      <>
                        <Mic size={16} className="text-green-600 animate-pulse" />
                        <span className="text-sm font-medium text-green-800">🟢 语音识别中 — 请用英语回答</span>
                      </>
                    ) : recognitionStatus === 'error' ? (
                      <>
                        <MicOff size={16} className="text-red-600" />
                        <span className="text-sm font-medium text-red-800">🔴 语音识别出错 — 请在下方输入你的回答</span>
                      </>
                    ) : recognitionStatus === 'unsupported' ? (
                      <>
                        <MicOff size={16} className="text-gray-600" />
                        <span className="text-sm font-medium text-gray-800">⚪ 浏览器不支持语音识别 — 请在下方输入你的回答</span>
                      </>
                    ) : (
                      <>
                        <Mic size={16} className="text-gray-600" />
                        <span className="text-sm font-medium text-gray-800">⏳ 正在启动语音识别...</span>
                      </>
                    )}
                  </div>
                </div>

                {/* 识别到的文字 */}
                {recognizedText && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-800 mb-2 flex items-center gap-1">
                      <Mic size={14} /> 语音识别结果：
                    </p>
                    <p className="text-gray-700">{recognizedText}</p>
                  </div>
                )}

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
                    💡 如果语音识别正常工作，此区域可留空。如果识别不到语音，直接在这里打字即可。
                  </p>
                </div>

                {/* 结束按钮 */}
                <button
                  onClick={finishCurrentQuestion}
                  className="w-full py-3 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
                >
                  {currentQuestionIndex < extractedQuestions.length - 1 ? '✅ 结束回答，下一题' : '✅ 结束回答，完成面试'}
                </button>
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
            <div className="space-y-6">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <h2 className="text-xl font-bold text-gray-800">⏳ 面试结束，AI正在评估你的表现...</h2>
              <p className="text-gray-600">请稍候，评分报告正在生成中...</p>
            </div>
          </div>
        </div>
      )}

      {/* ===== 评分报告 ===== */}
      {stage === 'result' && evaluation && (
        <div className="px-6 py-8">
          <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">📊 面试评估报告</h2>

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
                    <p className="text-sm text-blue-700">💬 {item.comment}</p>
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
