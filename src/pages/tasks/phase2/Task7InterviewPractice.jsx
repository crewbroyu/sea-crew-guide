// src/pages/tasks/phase2/Task7InterviewPractice.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  LoaderCircle,
  Mic,
  RotateCcw,
  Square,
  Target,
} from 'lucide-react';
import TaskLayout from '../../../components/TaskLayout';
import interviewQuestions, { positionConfig } from '../../../data/interviewQuestions';
import { barServerFoundationDays } from '../../../data/barServerFoundation';
import useEffectiveAccess from '../../../hooks/useEffectiveAccess';
import { hasProductEntitlement } from '../../../services/activationService';
import {
  evaluateInterviewWithAi,
  transcribeInterviewAudio,
} from '../../../services/interviewAiService';
import { saveInterviewPracticeRecord } from '../../../services/interviewPracticeService';
import { upsertMyJobPreparation } from '../../../services/jobPreparationService';
import { syncLocalPathProfile } from '../../../services/userPathService';
import { normalizeInterviewPosition } from '../../../utils/interviewPosition';

const STORAGE_KEY = 'task7_voice_practice';
const RESULT_KEY = 'task7_result';
const PRACTICE_VERSION = 5;

const barKnowledgeQuestionIds = [
  'bs_02',
  'bs_04',
  'bs_05',
  'bs_26',
  'bs_28',
  'bs_31',
  'bs_33',
  'bs_39',
];

const readJson = (key, fallback = null) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.warn(`Unable to read ${key}:`, error);
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const stripEphemeralAudioUrls = (answers = {}) =>
  Object.fromEntries(
    Object.entries(answers).map(([questionId, answer]) => {
      const persistableAnswer = { ...(answer || {}) };
      delete persistableAnswer.audioUrl;
      delete persistableAnswer.transcriptionStatus;
      delete persistableAnswer.transcriptionError;
      return [questionId, persistableAnswer];
    })
  );

const uniqueItems = (items = []) => [...new Set(items.filter(Boolean))];

const buildFoundationMastery = ({ questions, evaluation, currentProgress = {} }) => {
  const scoredQuestions = questions.map((question, index) => ({
    question,
    score: evaluation?.questionScores?.[index] || {},
  }));

  return barServerFoundationDays.reduce((nextProgress, day) => {
    const relevantScores = scoredQuestions.filter(({ question }) =>
      day.task7QuestionIds?.includes(question.id)
    );
    if (!relevantScores.length) return nextProgress;

    const lastScore = Math.round(
      relevantScores.reduce((sum, item) => sum + Number(item.score.score || 0), 0)
      / (relevantScores.length * 20)
      * 100
    );
    const previousPractice = currentProgress[day.id]?.practice || {};
    const bestScore = Math.max(Number(previousPractice.bestScore || 0), lastScore);

    nextProgress[day.id] = {
      ...(currentProgress[day.id] || {}),
      practice: {
        ...previousPractice,
        lastScore,
        bestScore,
        status: bestScore >= 70 ? 'mastered' : bestScore >= 50 ? 'developing' : 'needs_practice',
        questionIds: relevantScores.map((item) => item.question.id),
        improvements: uniqueItems(relevantScores.flatMap((item) => item.score.improvements || [])).slice(0, 4),
        missedKeywords: uniqueItems(relevantScores.flatMap((item) => item.score.missedKeywords || [])).slice(0, 6),
        practicedAt: new Date().toISOString(),
      },
    };
    return nextProgress;
  }, { ...currentProgress });
};

const getTimestamp = () => Date.now();

const coreQuestionTemplates = [
  {
    id: 'self_intro',
    phase: 'Opening',
    question: 'Tell me about yourself and why you are interested in this position onboard.',
    focus: '30-60 秒讲清楚经历、服务能力和目标岗位，不要从姓名年龄流水账开始。',
    keywords: ['experience', 'service', 'guest', 'team', 'cruise'],
  },
  {
    id: 'motivation',
    phase: 'Motivation',
    question: 'Why do you want to work on a cruise ship?',
    focus: '不要只说想旅行。要体现你理解邮轮工作的强度、合同和国际服务环境。',
    keywords: ['international', 'service', 'contract', 'team', 'growth'],
  },
  {
    id: 'experience',
    phase: 'Experience',
    question: 'Tell me about a time you handled a difficult guest or customer.',
    focus: '说清楚客人问题、你的动作、结果。重点不是态度好，而是解决问题。',
    keywords: ['guest', 'customer', 'problem', 'apologize', 'solution', 'result'],
  },
  {
    id: 'role_fit',
    phase: 'Role Fit',
    question: 'What makes you suitable for this position?',
    focus: '把你的过往经历和岗位要求连起来，避免只说 I am hardworking。',
    keywords: ['skills', 'position', 'communication', 'team', 'pressure'],
  },
  {
    id: 'pressure',
    phase: 'Pressure',
    question: 'How do you handle pressure during a busy shift?',
    focus: '展示排优先级、沟通、稳定完成任务，而不是简单说 I can handle it。',
    keywords: ['pressure', 'busy', 'priority', 'team', 'calm'],
  },
];

const getTargetPositionKey = () => {
  const task2Result = readJson('task2_result', {});
  const assessmentResult = readJson('assessment_result', {});
  const storedPosition =
    task2Result.selectedTargetJob ||
    task2Result.target_position ||
    assessmentResult.recommendations?.[0]?.position ||
    localStorage.getItem('interviewSelectedPosition') ||
    'retail';

  return normalizeInterviewPosition(storedPosition, 'retail');
};

const getTargetPositionMeta = (key) => {
  const base = positionConfig.find((item) => item.key === key);
  const questionBank = interviewQuestions[key];

  return {
    key,
    nameZh: base?.nameZh || questionBank?.positionName || '目标岗位',
    nameEn: base?.nameEn || questionBank?.positionNameEn || key,
  };
};

const categoryLabels = {
  behavioral: 'Experience',
  communication: 'Communication',
  demonstration: 'Live Task',
  emergency: 'Emergency',
  health: 'Public Health',
  inclusion: 'Inclusion',
  integrity: 'Integrity',
  knowledge: 'Role Knowledge',
  operations: 'Operations',
  privacy: 'Privacy',
  safeguarding: 'Safeguarding',
  safety: 'Safety',
  sales: 'Sales',
  scenario: 'Role Scenario',
  security: 'Security',
  service_judgment: 'Service Judgment',
  ship_life: 'Ship Life',
  teamwork: 'Teamwork',
};

const inferQuestionKeywords = (question) => {
  if (question.keywords?.length) return question.keywords;

  const text = `${question.question} ${question.tip || ''}`.toLowerCase();
  if (/complain|upset|difficult|angry|cold food|dissatisfied/.test(text)) {
    return ['listen', 'apologize', 'calm', 'solution', 'follow-up'];
  }
  if (/sell|sales|upsell|recommend|product|target/.test(text)) {
    return ['need', 'recommend', 'customer', 'product', 'result'];
  }
  if (/clean|sanit|hygiene|allerg|ill|safety|hazard|injur/.test(text)) {
    return ['safety', 'procedure', 'report', 'protect', 'check'];
  }
  if (/child|parent|youth|activity/.test(text)) {
    return ['child', 'safety', 'activity', 'parent', 'supervisor'];
  }
  if (/busy|pressure|multiple|peak|stress/.test(text)) {
    return ['priority', 'calm', 'team', 'accurate', 'communicate'];
  }
  if (/team|coworker|colleague|conflict/.test(text)) {
    return ['team', 'communicate', 'respect', 'support', 'result'];
  }
  return ['experience', 'example', 'action', 'service', 'result'];
};

const buildPracticeQuestions = (
  positionKey,
  roundNumber = 0,
  practiceMode = 'standard',
  requestedQuestionId = ''
) => {
  const bank = interviewQuestions[positionKey]?.questions || interviewQuestions.retail.questions;

  if (practiceMode === 'knowledge' && positionKey === 'bar_server') {
    return barKnowledgeQuestionIds
      .map((questionId) => bank.find((item) => item.id === questionId))
      .filter(Boolean)
      .map((item, index) => ({
        ...item,
        order: index + 1,
        phase: item.category ? (categoryLabels[item.category] || 'Knowledge Review') : 'Knowledge Review',
        focus: item.tip || '先讲清知识，再说明如何把它用于客人服务。',
        keywords: inferQuestionKeywords(item),
      }));
  }

  const roleBank = bank.filter((item) => {
    const text = item.question.toLowerCase();
    return !text.includes('why do you want to work on a cruise ship') &&
      !text.includes('where do you see yourself') &&
      !text.includes('tell me about yourself');
  });
  const foundationBank = roleBank.filter((item) => !item.category);
  const scenarioBank = roleBank.filter((item) => item.category);
  const selectedFoundation = [0, 7]
    .map((offset) => foundationBank[(roundNumber * 2 + offset) % foundationBank.length])
    .filter(Boolean);
  const selectedScenarios = [0, 5, 10]
    .map((offset) => scenarioBank[(roundNumber * 3 + offset) % scenarioBank.length])
    .filter(Boolean);
  const requestedQuestion = bank.find((item) => item.id === requestedQuestionId);
  const roleSelection = [...selectedFoundation, ...selectedScenarios]
    .filter((item) => item.id !== requestedQuestion?.id);
  const selectedRoleQuestions = roleSelection.map((item) => ({
    ...item,
    phase: categoryLabels[item.category] || `Role ${item.difficulty === 'hard' ? 'Challenge' : 'Practice'}`,
    focus: item.tip || '用具体经历或清晰步骤回答，避免只给结论。',
    keywords: inferQuestionKeywords(item),
  }));

  const roundQuestions = requestedQuestion
    ? [requestedQuestion, ...coreQuestionTemplates.slice(0, 3), ...selectedRoleQuestions].slice(0, 8)
    : [...coreQuestionTemplates.slice(0, 3), ...selectedRoleQuestions];

  return roundQuestions.map((item, index) => ({
    ...item,
    order: index + 1,
    phase: item.phase || categoryLabels[item.category] || 'Selected Question',
    focus: item.focus || item.tip || '用具体经历或清晰步骤回答，避免只给结论。',
    keywords: item.keywords || inferQuestionKeywords(item),
  }));
};

const getPreparationSnapshot = (fallbackPosition = '') => {
  const assessment = readJson('assessment_result', {});
  const task2 = readJson('task2_result', {});
  const task4 = readJson('task4_result', {});
  const task5 = readJson('task5_result', {});
  const task6 = readJson('task6_result', {});

  return [
    {
      label: '适配测评',
      value: assessment.overallScore ? `${assessment.overallScore}/100` : '未读取到结果',
      ready: Boolean(assessment.overallScore),
    },
    {
      label: '目标岗位',
      value: task2.selectedTargetJob || task2.target_position || fallbackPosition || '使用默认岗位',
      ready: Boolean(task2.selectedTargetJob || task2.target_position || fallbackPosition),
    },
    {
      label: '英文简历',
      value: task4.completedAt ? '已完成简历准备' : '可先练基础题',
      ready: Boolean(task4.completedAt),
    },
    {
      label: '岗位知识',
      value: task5.completedAt ? '已完成岗位准备' : '建议后续补充',
      ready: Boolean(task5.completedAt),
    },
    {
      label: '答案卡',
      value: task6.preparedAnswerCount ? `已准备 ${task6.preparedAnswerCount} 张` : '可先用文字兜底',
      ready: Number(task6.preparedAnswerCount || 0) >= 3,
    },
  ];
};

function Task7InterviewPractice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const access = useEffectiveAccess();
  const { isRegistered, openRegisterModal, openUnlockModal } = access;
  const requestedPosition = normalizeInterviewPosition(searchParams.get('position'), '');
  const requestedQuestionId = searchParams.get('question') || '';
  const source = searchParams.get('source') || '';
  const practiceMode = searchParams.get('mode') === 'knowledge' ? 'knowledge' : 'standard';
  const savedPractice = useMemo(() => readJson(STORAGE_KEY, {}), []);
  const compatiblePractice = savedPractice.version === PRACTICE_VERSION
    && savedPractice.practiceMode === practiceMode
    && (!requestedPosition || savedPractice.targetPositionKey === requestedPosition)
    && (savedPractice.requestedQuestionId || '') === requestedQuestionId
    ? savedPractice
    : {};
  const [targetPositionKey] = useState(() => requestedPosition || getTargetPositionKey());
  const [roundNumber, setRoundNumber] = useState(compatiblePractice.roundNumber || 0);
  const targetPosition = useMemo(() => getTargetPositionMeta(targetPositionKey), [targetPositionKey]);
  const hasPaidAiAccess = targetPositionKey === 'bar_server'
    && hasProductEntitlement(access, 'bar_server_pack');
  const questions = useMemo(
    () => buildPracticeQuestions(targetPositionKey, roundNumber, practiceMode, requestedQuestionId),
    [practiceMode, requestedQuestionId, roundNumber, targetPositionKey]
  );
  const preparationSnapshot = useMemo(
    () => getPreparationSnapshot(targetPosition.nameEn),
    [targetPosition.nameEn]
  );
  const [stage, setStage] = useState(compatiblePractice.stage || 'briefing');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(compatiblePractice.currentQuestionIndex || 0);
  const [answers, setAnswers] = useState(compatiblePractice.answers || {});
  const [evaluation, setEvaluation] = useState(compatiblePractice.evaluation || null);
  const [recordingQuestionId, setRecordingQuestionId] = useState(null);
  const [recorderError, setRecorderError] = useState('');
  const [isGeneratingEvaluation, setIsGeneratingEvaluation] = useState(false);
  const [evaluationError, setEvaluationError] = useState('');
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const startedAtRef = useRef(null);
  const audioUrlsRef = useRef(new Set());
  const audioBlobsRef = useRef(new Map());
  const transcriptionSequenceRef = useRef(new Map());

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = questions.filter((question) => {
    const answer = answers[question.id] || {};
    return answer.hasRecording || answer.textAnswer?.trim();
  }).length;
  const canComplete = stage === 'report' && Boolean(evaluation);

  useEffect(() => {
    writeJson(STORAGE_KEY, {
      version: PRACTICE_VERSION,
      stage,
      roundNumber,
      currentQuestionIndex,
      answers: stripEphemeralAudioUrls(answers),
      evaluation,
      targetPositionKey,
      practiceMode,
      requestedQuestionId,
    });
  }, [answers, currentQuestionIndex, evaluation, practiceMode, requestedQuestionId, roundNumber, stage, targetPositionKey]);

  useEffect(() => () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    audioUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    audioUrlsRef.current.clear();
    audioBlobsRef.current.clear();
  }, []);

  const updateAnswer = (questionId, partial) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {}),
        ...partial,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const transcribeRecording = async (questionId, blob) => {
    const sequence = (transcriptionSequenceRef.current.get(questionId) || 0) + 1;
    transcriptionSequenceRef.current.set(questionId, sequence);
    updateAnswer(questionId, {
      transcriptionStatus: 'loading',
      transcriptionError: '',
    });

    try {
      const result = await transcribeInterviewAudio(blob, {
        mode: 'practice',
        position: targetPosition.nameEn,
        question: questions.find((item) => item.id === questionId)?.question || '',
      });
      if (transcriptionSequenceRef.current.get(questionId) !== sequence) return;

      updateAnswer(questionId, {
        textAnswer: result.transcript,
        transcriptionStatus: 'success',
        transcriptionError: '',
        transcriptSource: result.model,
      });
    } catch (error) {
      if (transcriptionSequenceRef.current.get(questionId) !== sequence) return;
      console.error('语音转写失败:', error);
      updateAnswer(questionId, {
        transcriptionStatus: 'error',
        transcriptionError: error.message || '语音转写失败，请重试或手动输入。',
      });
      if (error.code === 'LOGIN_REQUIRED') {
        openRegisterModal();
      }
    }
  };

  const startRecording = async (questionId) => {
    setRecorderError('');

    if (!isRegistered) {
      setRecorderError('登录后可使用 AI 语音转写，登录不会影响当前训练进度。');
      openRegisterModal();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setRecorderError('当前浏览器不支持录音，请先使用文字回答。');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      startedAtRef.current = getTimestamp();

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
        if (event.data?.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType || 'audio/webm' });
        const previousUrl = answers[questionId]?.audioUrl;
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl);
          audioUrlsRef.current.delete(previousUrl);
        }

        const durationSeconds = Math.max(1, Math.round((getTimestamp() - startedAtRef.current) / 1000));
        const audioUrl = URL.createObjectURL(blob);
        audioUrlsRef.current.add(audioUrl);
        audioBlobsRef.current.set(questionId, blob);
        updateAnswer(questionId, {
          hasRecording: true,
          audioUrl,
          durationSeconds,
          transcriptionStatus: 'loading',
          transcriptionError: '',
        });
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setRecordingQuestionId(null);
        await transcribeRecording(questionId, blob);
      };

      recorder.start();
      setRecordingQuestionId(questionId);
    } catch (error) {
      console.error('录音启动失败:', error);
      setRecorderError('无法打开麦克风权限，请检查浏览器授权，或先使用文字回答。');
      setRecordingQuestionId(null);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const retryTranscription = (questionId) => {
    const blob = audioBlobsRef.current.get(questionId);
    if (blob) {
      transcribeRecording(questionId, blob);
    } else {
      updateAnswer(questionId, {
        transcriptionError: '当前录音已失效，请重新录制。',
      });
    }
  };

  const persistKnowledgeMastery = async (evaluationData) => {
    if (practiceMode !== 'knowledge' || targetPositionKey !== 'bar_server') return null;

    const task5Data = readJson('task5_data', {});
    const currentProgress = task5Data.foundationProgress || {};
    const foundationProgress = buildFoundationMastery({
      questions,
      evaluation: evaluationData,
      currentProgress,
    });
    writeJson('task5_data', {
      ...task5Data,
      selectedRole: task5Data.selectedRole || 'barServer',
      foundationProgress,
    });

    const task5Result = readJson('task5_result', {});
    if (task5Result.taskId === 5) {
      const updatedTask5Result = {
        ...task5Result,
        foundationProgress,
        learningRecords: {
          ...(task5Result.learningRecords || {}),
          barServerFoundation: foundationProgress,
        },
        knowledgePracticeUpdatedAt: new Date().toISOString(),
      };
      writeJson('task5_result', updatedTask5Result);

      try {
        await upsertMyJobPreparation(updatedTask5Result);
      } catch (error) {
        console.error('同步岗位知识口头运用结果失败:', error);
      }
    }

    return foundationProgress;
  };

  const goToNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((index) => index + 1);
      return;
    }

    if (!hasPaidAiAccess) {
      setEvaluationError('题库和录音可免费练习；AI逐题评分与训练报告属于岗位训练权益。');
      navigate(`/premium?source=task7-ai-report&position=${targetPositionKey}`);
      return;
    }

    setIsGeneratingEvaluation(true);
    setEvaluationError('');
    const normalizedAnswers = questions.map((question) => ({
      questionId: question.id,
      textAnswer: answers[question.id]?.textAnswer || '',
      durationSeconds: answers[question.id]?.durationSeconds || 0,
    }));

    try {
      const evaluationData = await evaluateInterviewWithAi({
        mode: 'premium_practice',
        position: targetPosition.nameEn,
        questions,
        answers: normalizedAnswers,
      });
      setEvaluation(evaluationData);
      await persistKnowledgeMastery(evaluationData);
      setStage('report');
    } catch (error) {
      console.error('AI 训练报告生成失败:', error);
      if (error.code === 'LOGIN_REQUIRED') {
        openRegisterModal();
      }
      if (error.code === 'ACTIVATION_REQUIRED') {
        openUnlockModal();
      }
      if (error.code === 'AI_QUOTA_EXHAUSTED') {
        navigate(`/premium?source=task7-ai-quota&position=${targetPositionKey}`);
      }
      setEvaluationError(error.message || 'AI 训练报告生成失败，请稍后重试。');
    } finally {
      setIsGeneratingEvaluation(false);
    }
  };

  const restartPractice = () => {
    audioUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    audioUrlsRef.current.clear();
    setAnswers({});
    setEvaluation(null);
    setEvaluationError('');
    setCurrentQuestionIndex(0);
    setRoundNumber((number) => number + 1);
    setStage('practice');
  };

  const completeTask7 = async () => {
    const completedAt = new Date().toISOString();
    const normalizedAnswers = questions.map((question) => {
      const answer = answers[question.id] || {};
      return {
        questionId: question.id,
        textAnswer: answer.textAnswer || '',
        durationSeconds: answer.durationSeconds || 0,
        hasRecording: Boolean(answer.hasRecording),
        transcriptSource: answer.transcriptSource || null,
        answeredAt: answer.updatedAt || completedAt,
      };
    });
    const taskResult = {
      taskId: 7,
      completedAt,
      targetPosition: targetPosition.key,
      targetPositionName: targetPosition.nameEn,
      practiceMode,
      questions,
      answers: normalizedAnswers,
      evaluation,
    };

    writeJson(RESULT_KEY, taskResult);
    const progress = readJson('boarding_progress', {});
    progress.task7 = { completed: true, completedAt };
    writeJson('boarding_progress', progress);

    try {
      await saveInterviewPracticeRecord({
        targetPosition: targetPosition.key,
        interviewerName: practiceMode === 'knowledge' ? 'Task7 Bar Knowledge Review' : 'Task7 Voice Practice',
        questions,
        answers: normalizedAnswers,
        evaluation,
        source: practiceMode === 'knowledge' ? 'task5_knowledge_review' : 'voice_practice',
      });
    } catch (error) {
      console.error('保存语音面试演练记录失败:', error);
    }

    await syncLocalPathProfile({
      target_position: targetPosition.key,
      interview_status: 'practicing',
      application_stage: 'interview',
      career_stage: 'interview_preparation',
      last_completed_task_id: 7,
      lead_score: evaluation?.overallScore >= 70 ? 86 : 78,
    });
  };

  const renderBriefing = () => (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-blue-700">
          {practiceMode === 'knowledge'
            ? '任务5 → 任务7 · 知识巩固'
            : source === 'academy'
              ? '海乘学院 → 任务7 · 正式训练'
              : source === 'scenario'
                ? '岗位场景 → 任务7 · 正式训练'
              : '语音演练第一轮'}
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-950">
          {practiceMode === 'knowledge'
            ? '把酒水知识说成岗位答案'
            : requestedQuestionId
              ? '从你在题库选择的问题开始'
              : '先把答案说出来，再追求说漂亮'}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {practiceMode === 'knowledge'
            ? '本轮固定练习任务5对应的 8 类 Bar Server 基础知识。录音停止后会临时发送给 AI 做英文转写，音频本身不会写入你的长期档案。'
            : requestedQuestionId
              ? '你选择的问题会排在本轮第一题，其余题目由通用问题和岗位场景组成。录音会临时用于英文转写，音频本身不会写入长期档案。'
              : '本轮会根据你的目标岗位安排 8 道题。录音停止后会临时发送给 AI 做英文转写，音频本身不会写入你的长期档案；你可以在评分前修改转写文本。'}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs text-slate-500">目标岗位</p>
            <p className="mt-1 font-semibold text-slate-950">{targetPosition.nameZh}</p>
            <p className="text-sm text-slate-500">{targetPosition.nameEn}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs text-slate-500">题目数量</p>
            <p className="mt-1 font-semibold text-slate-950">{questions.length} 题</p>
            <p className="text-sm text-slate-500">
              {practiceMode === 'knowledge'
                ? '8 道岗位知识题'
                : requestedQuestionId
                  ? '选中题 + 3 道核心题 + 4 道岗位题'
                  : '3 道核心题 + 5 道岗位题'}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <ClipboardCheck size={18} className="text-blue-600" />
          <h2 className="font-semibold text-slate-950">已读取的准备数据</h2>
        </div>
        <div className="space-y-3">
          {preparationSnapshot.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{item.label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{item.value}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                item.ready ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}>
                {item.ready ? '已准备' : '可补充'}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-blue-100 bg-blue-50 p-5">
        <div className="flex items-start gap-3">
          <Target size={20} className="mt-0.5 text-blue-700" />
          <div>
            <h2 className="font-semibold text-blue-950">本轮训练重点</h2>
            <p className="mt-1 text-sm leading-6 text-blue-900">
              {practiceMode === 'knowledge'
                ? '依次练基酒、Mojito、neat / on the rocks、饮品推荐、未知配方、开档检查、过敏处理和葡萄酒服务。AI会检查你是否把知识转成了准确的服务动作。'
                : requestedQuestionId
                  ? `先完成你从学院选中的问题，再练3道核心题和4道${targetPosition.nameZh}岗位题；重练下一轮会更换其余岗位题。`
                  : `先练自我介绍、上船动机和服务案例，再从 ${targetPosition.nameZh} 的 40 道题库中轮换抽取 5 道岗位题；重练下一轮会自动换题。`}
            </p>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={() => setStage('practice')}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        开始语音演练
        <ArrowRight size={18} />
      </button>
    </div>
  );

  const renderPractice = () => {
    const answer = answers[currentQuestion.id] || {};
    const hasAnswer = answer.hasRecording || answer.textAnswer?.trim();

    return (
      <div className="space-y-5">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-blue-700">
                Question {currentQuestion.order}/{questions.length} · {currentQuestion.phase}
              </p>
              <h2 className="mt-2 text-xl font-semibold leading-7 text-slate-950">{currentQuestion.question}</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {answeredCount}/{questions.length}
            </span>
          </div>

          <div className="rounded-lg bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            {currentQuestion.focus}
          </div>

          {recorderError && (
            <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
              {recorderError}
            </div>
          )}

          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-slate-950">录音回答</p>
                <p className="mt-0.5 text-xs text-slate-500">建议每题 30-60 秒。停止后自动转写，音频不长期保存。</p>
              </div>
              {recordingQuestionId === currentQuestion.id ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  <Square size={16} />
                  停止
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => startRecording(currentQuestion.id)}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Mic size={16} />
                  开始录音
                </button>
              )}
            </div>

            {recordingQuestionId === currentQuestion.id && (
              <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                正在录音，请像真实面试一样完整回答。
              </div>
            )}

            {answer.audioUrl && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>已录制 {answer.durationSeconds || 0} 秒</span>
                  <button
                    type="button"
                    onClick={() => startRecording(currentQuestion.id)}
                    className="font-medium text-blue-700"
                  >
                    重新录制
                  </button>
                </div>
                <audio src={answer.audioUrl} controls className="w-full" />
              </div>
            )}

            {answer.transcriptionStatus === 'loading' && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
                <LoaderCircle size={16} className="animate-spin" />
                AI 正在转写录音，请稍候...
              </div>
            )}
            {answer.transcriptionStatus === 'success' && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                <CheckCircle2 size={16} />
                AI 转写完成，可在下方修改后再提交。
              </div>
            )}
            {answer.transcriptionStatus === 'error' && (
              <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                <p>{answer.transcriptionError}</p>
                <button
                  type="button"
                  onClick={() => retryTranscription(currentQuestion.id)}
                  className="mt-2 font-semibold text-red-800 underline underline-offset-2"
                >
                  重新转写
                </button>
              </div>
            )}
          </div>

          <label className="mt-5 block">
            <span className="text-sm font-semibold text-slate-900">文字补充</span>
            <span className="ml-2 text-xs text-slate-500">后续 AI 评分会主要依赖文字或语音转写</span>
            <textarea
              value={answer.textAnswer || ''}
              onChange={(event) => updateAnswer(currentQuestion.id, { textAnswer: event.target.value })}
              rows={5}
              placeholder="可以把你刚才说的重点写下来，例如：In my previous job, a customer was upset because..."
              className="mt-3 w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm leading-6 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </section>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setCurrentQuestionIndex((index) => Math.max(0, index - 1))}
            disabled={currentQuestionIndex === 0}
            className="w-1/3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            上一题
          </button>
          <button
            type="button"
            onClick={goToNextQuestion}
            disabled={!hasAnswer || answer.transcriptionStatus === 'loading' || isGeneratingEvaluation}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isGeneratingEvaluation
              ? 'AI 正在生成报告...'
              : currentQuestionIndex === questions.length - 1
                ? hasPaidAiAccess ? '生成 AI 训练报告' : '解锁 AI 评分与报告'
                : '保存并下一题'}
          </button>
        </div>
        {evaluationError && (
          <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
            <p>{evaluationError}</p>
            <button
              type="button"
              onClick={goToNextQuestion}
              disabled={isGeneratingEvaluation}
              className="mt-2 font-semibold text-red-800 underline underline-offset-2 disabled:opacity-50"
            >
              重新生成报告
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderReport = () => (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-blue-700">
              <BrainCircuit size={16} /> AI 训练报告
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">本轮语音演练完成</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{evaluation?.overallSuggestion}</p>
          </div>
          <div className="rounded-lg bg-blue-50 px-4 py-3 text-center">
            <p className="text-xs font-medium text-blue-700">总分</p>
            <p className="mt-1 text-2xl font-bold text-blue-950">{evaluation?.overallScore || 0}</p>
          </div>
        </div>
      </section>

      {(evaluation?.strengths?.length > 0 || evaluation?.priorities?.length > 0) && (
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
            <h2 className="font-semibold text-emerald-950">已经做对的</h2>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-emerald-900">
              {evaluation.strengths?.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
            <h2 className="font-semibold text-amber-950">优先改进</h2>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-amber-900">
              {evaluation.priorities?.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-blue-600" />
          <h2 className="font-semibold text-slate-950">每题表现</h2>
        </div>
        <div className="space-y-3">
          {evaluation?.questionScores.map((item, index) => (
            <div key={item.question} className="rounded-lg bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Q{index + 1}. {item.question}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.comment}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  item.score >= 16 ? 'bg-emerald-50 text-emerald-700' :
                    item.score >= 11 ? 'bg-blue-50 text-blue-700' :
                      'bg-amber-50 text-amber-700'
                }`}>
                  {item.score}/20
                </span>
              </div>
              {item.improvements?.length > 0 && (
                <p className="mt-2 text-xs leading-5 text-amber-700">
                  优先调整：{item.improvements.slice(0, 2).join('；')}
                </p>
              )}
              {item.missedKeywords?.length > 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  可补关键词：{item.missedKeywords.slice(0, 3).join(', ')}
                </p>
              )}
              {item.improvedAnswer && (
                <details className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-blue-700">查看更好的英文表达</summary>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{item.improvedAnswer}</p>
                </details>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
        <h2 className="font-semibold text-amber-950">下一步建议</h2>
        <p className="mt-1 text-sm leading-6 text-amber-900">
          {practiceMode === 'knowledge'
            ? '分数已经按课程天数回写到任务5。低于70分的知识模块会标记为“建议重练”，你可以回去复习对应内容后再练一轮。'
            : '如果总分低于 70，建议先重练低分题；如果已经超过 70，可以进入完整 AI 模拟，把追问和临场表现练起来。'}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={restartPractice}
            className="flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-white px-4 py-3 text-sm font-semibold text-amber-800"
          >
            <RotateCcw size={16} />
            重练一轮
          </button>
          <button
            type="button"
            onClick={() => navigate(practiceMode === 'knowledge' ? '/tasks/phase2/Task5' : '/tasks/phase2/Task7/mock')}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
          >
            {practiceMode === 'knowledge' ? '查看任务5能力状态' : '完整 AI 模拟'}
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
        <div className="flex gap-2">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-700" />
          <p>{practiceMode === 'knowledge'
            ? '知识分项成绩已经回写任务5。点击底部“完成任务”后，本轮完整记录还会写入申请进度和后台面试练习记录。'
            : '点击底部“完成任务”后，本轮结果会写入申请进度。登录用户会同步到后台面试练习记录。'}</p>
        </div>
      </section>
    </div>
  );

  return (
    <TaskLayout
      taskId={7}
      taskTitle="单题语音练习"
      canComplete={canComplete}
      onComplete={completeTask7}
    >
      {stage === 'briefing' && renderBriefing()}
      {stage === 'practice' && renderPractice()}
      {stage === 'report' && renderReport()}
    </TaskLayout>
  );
}

export default Task7InterviewPractice;
