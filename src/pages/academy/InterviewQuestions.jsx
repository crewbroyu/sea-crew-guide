import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Clock, Mic, Video, Play, Pause, X, RefreshCw, Check, BarChart3, ArrowLeft, Volume2, BookOpen, AlertTriangle } from 'lucide-react';
import { positionConfig } from '../../data/interviewQuestions';
import interviewQuestions from '../../data/interviewQuestions';

const STORAGE_KEY = 'interview_practice_data';

const saveToLocalStorage = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

const loadFromLocalStorage = (defaultValue) => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
};

const RECORDING_STATUS = {
  IDLE: 'idle',
  RECORDING: 'recording',
  COMPLETED: 'completed'
};

function InterviewQuestions() {
  const navigate = useNavigate();
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [selectedKnowledge, setSelectedKnowledge] = useState(null);
  const [activeTab, setActiveTab] = useState('questions');
  
  const [progress, setProgress] = useState(() => {
    const data = loadFromLocalStorage({
      position: null,
      completedQuestions: [],
      completedKnowledge: [],
      totalQuestions: 25,
      totalKnowledge: 10
    });
    return data;
  });
  
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState(RECORDING_STATUS.IDLE);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingUrl, setRecordingUrl] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [stream, setStream] = useState(null);
  
  const [knowledgeRecordingStatus, setKnowledgeRecordingStatus] = useState(RECORDING_STATUS.IDLE);
  const [knowledgeRecordingTime, setKnowledgeRecordingTime] = useState(0);
  const [knowledgeRecordingUrl, setKnowledgeRecordingUrl] = useState(null);
  const [knowledgeMediaRecorder, setKnowledgeMediaRecorder] = useState(null);
  const [knowledgeStream, setKnowledgeStream] = useState(null);
  
  const [speaking, setSpeaking] = useState(false);
  const [knowledgeSpeaking, setKnowledgeSpeaking] = useState(false);
  const [task2Position, setTask2Position] = useState(null);
  const [positionMismatch, setPositionMismatch] = useState(false);
  const [showMismatchModal, setShowMismatchModal] = useState(false);
  
  const recordingTimerRef = useRef(null);
  const knowledgeRecordingTimerRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const utteranceRef = useRef(null);

  useEffect(() => {
    const task2Result = localStorage.getItem('task2_result');
    if (task2Result) {
      const task2Data = JSON.parse(task2Result);
      if (task2Data.selectedTargetJob) {
        setTask2Position(task2Data.selectedTargetJob);
        if (!progress.position) {
          setSelectedPosition(task2Data.selectedTargetJob);
          setProgress(prev => ({ ...prev, position: task2Data.selectedTargetJob }));
        } else if (progress.position !== task2Data.selectedTargetJob) {
          setPositionMismatch(true);
          setShowMismatchModal(true);
        }
      }
    } else if (progress.position) {
      setSelectedPosition(progress.position);
    }
  }, []);

  useEffect(() => {
    saveToLocalStorage(progress);
  }, [progress]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (knowledgeRecordingTimerRef.current) {
        clearInterval(knowledgeRecordingTimerRef.current);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (knowledgeStream) {
        knowledgeStream.getTracks().forEach(track => track.stop());
      }
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      if (knowledgeMediaRecorder && knowledgeMediaRecorder.state !== 'inactive') {
        knowledgeMediaRecorder.stop();
      }
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
      }
      if (knowledgeRecordingUrl) {
        URL.revokeObjectURL(knowledgeRecordingUrl);
      }
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, [stream, mediaRecorder, recordingUrl, knowledgeStream, knowledgeMediaRecorder, knowledgeRecordingUrl]);

  const getCurrentData = () => {
    if (!progress.position) return null;
    return interviewQuestions[progress.position];
  };

  const currentData = getCurrentData();

  const handlePositionSelect = (position) => {
    setSelectedPosition(position);
    setProgress({
      position: position,
      completedQuestions: [],
      completedKnowledge: [],
      totalQuestions: 25,
      totalKnowledge: 10
    });
    setShowPositionModal(false);
    setShowMismatchModal(false);
    setPositionMismatch(false);
  };

  const handleUseTask2Position = () => {
    if (task2Position) {
      setSelectedPosition(task2Position);
      setProgress(prev => ({ ...prev, position: task2Position }));
      setShowMismatchModal(false);
      setPositionMismatch(false);
    }
  };

  const speakText = (text, onEnd = null) => {
    if (speaking || knowledgeSpeaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setKnowledgeSpeaking(false);
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    utterance.onstart = () => {
      setSpeaking(true);
      setKnowledgeSpeaking(true);
    };
    
    utterance.onend = () => {
      setSpeaking(false);
      setKnowledgeSpeaking(false);
      if (onEnd) onEnd();
    };
    
    utterance.onerror = () => {
      setSpeaking(false);
      setKnowledgeSpeaking(false);
    };
    
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setKnowledgeSpeaking(false);
  };

  const handleQuestionClick = (question) => {
    stopSpeaking();
    setSelectedQuestion(question);
    setShowQuestionModal(true);
    setRecordingStatus(RECORDING_STATUS.IDLE);
    setRecordingTime(0);
    setRecordingUrl(null);
  };

  const startAudioRecording = async () => {
    try {
      stopSpeaking();
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(audioStream);
      
      const recorder = new MediaRecorder(audioStream);
      setMediaRecorder(recorder);
      
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordingUrl(url);
        setRecordingStatus(RECORDING_STATUS.COMPLETED);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }
      };
      
      recorder.start();
      setRecordingStatus(RECORDING_STATUS.RECORDING);
      setRecordingTime(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting audio recording:', error);
      alert('无法访问麦克风，请确保你已授权麦克风权限。');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
  };

  const restartRecording = () => {
    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
      setRecordingUrl(null);
    }
    setRecordingStatus(RECORDING_STATUS.IDLE);
    setRecordingTime(0);
  };

  const confirmCheckIn = () => {
    if (!selectedQuestion) return;
    
    setProgress(prev => {
      if (!prev.completedQuestions.includes(selectedQuestion.id)) {
        const newCompleted = [...prev.completedQuestions, selectedQuestion.id];
        return {
          ...prev,
          completedQuestions: newCompleted
        };
      }
      return prev;
    });
    
    setShowQuestionModal(false);
    setSelectedQuestion(null);
    stopSpeaking();
  };

  const handleKnowledgeClick = (knowledge) => {
    stopSpeaking();
    setSelectedKnowledge(knowledge);
    setShowKnowledgeModal(true);
    setKnowledgeRecordingStatus(RECORDING_STATUS.IDLE);
    setKnowledgeRecordingTime(0);
    setKnowledgeRecordingUrl(null);
  };
  
  const startKnowledgeAudioRecording = async () => {
    try {
      stopSpeaking();
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setKnowledgeStream(audioStream);
      
      const recorder = new MediaRecorder(audioStream);
      setKnowledgeMediaRecorder(recorder);
      
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setKnowledgeRecordingUrl(url);
        setKnowledgeRecordingStatus(RECORDING_STATUS.COMPLETED);
        if (knowledgeRecordingTimerRef.current) {
          clearInterval(knowledgeRecordingTimerRef.current);
        }
      };
      
      recorder.start();
      setKnowledgeRecordingStatus(RECORDING_STATUS.RECORDING);
      setKnowledgeRecordingTime(0);
      
      knowledgeRecordingTimerRef.current = setInterval(() => {
        setKnowledgeRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting audio recording:', error);
      alert('无法访问麦克风，请确保你已授权麦克风权限。');
    }
  };
  
  const stopKnowledgeRecording = () => {
    if (knowledgeMediaRecorder && knowledgeMediaRecorder.state !== 'inactive') {
      knowledgeMediaRecorder.stop();
    }
    if (knowledgeStream) {
      knowledgeStream.getTracks().forEach(track => track.stop());
      setKnowledgeStream(null);
    }
    if (knowledgeRecordingTimerRef.current) {
      clearInterval(knowledgeRecordingTimerRef.current);
    }
  };
  
  const restartKnowledgeRecording = () => {
    if (knowledgeRecordingUrl) {
      URL.revokeObjectURL(knowledgeRecordingUrl);
      setKnowledgeRecordingUrl(null);
    }
    setKnowledgeRecordingStatus(RECORDING_STATUS.IDLE);
    setKnowledgeRecordingTime(0);
  };

  const confirmKnowledgeCheckIn = () => {
    if (!selectedKnowledge) return;
    
    setProgress(prev => {
      if (!prev.completedKnowledge.includes(selectedKnowledge.id)) {
        const newCompleted = [...prev.completedKnowledge, selectedKnowledge.id];
        return {
          ...prev,
          completedKnowledge: newCompleted
        };
      }
      return prev;
    });
    
    setShowKnowledgeModal(false);
    setSelectedKnowledge(null);
    stopSpeaking();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isQuestionCompleted = (questionId) => {
    return progress.completedQuestions.includes(questionId);
  };

  const isKnowledgeCompleted = (knowledgeId) => {
    return progress.completedKnowledge.includes(knowledgeId);
  };

  const getTask2PositionName = () => {
    const position = positionConfig.find(p => p.key === task2Position);
    return position ? `${position.icon} ${position.nameZh}` : '';
  };

  if (!progress.position) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 pt-16 pb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/academy')} className="text-white/80 hover:text-white">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-white text-xl font-bold">选择目标职位</h1>
              <p className="text-white/80 text-sm mt-1">
                请选择一个目标职位开始面试训练
              </p>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-8">
          {task2Position && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-amber-800 font-medium mb-2">任务2已选择职位：{getTask2PositionName()}</p>
                  <button
                    onClick={handleUseTask2Position}
                    className="w-full py-2 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700"
                  >
                    使用任务2所选职位
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {positionConfig.map((position) => (
              <button
                key={position.key}
                onClick={() => handlePositionSelect(position.key)}
                className="bg-white rounded-xl border-2 border-gray-200 p-4 text-center hover:border-purple-500 transition-colors"
              >
                <div className="text-4xl mb-2">{position.icon}</div>
                <h3 className="font-bold text-gray-800">{position.nameZh}</h3>
                <p className="text-xs text-gray-500">{position.nameEn}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const completedQuestions = progress.completedQuestions.length;
  const totalQuestions = currentData?.questions.length || 0;
  const completedKnowledge = progress.completedKnowledge.length;
  const totalKnowledge = currentData?.knowledge.length || 0;

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

      <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 pt-16 pb-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/academy')} className="text-white/80 hover:text-white">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-white text-xl font-bold">
                {positionConfig.find(p => p.key === progress.position)?.nameZh} 面试训练
              </h1>
              <p className="text-white/80 text-sm mt-1">
                {positionConfig.find(p => p.key === progress.position)?.nameEn}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowPositionModal(true)}
            className="bg-white/20 text-white text-sm px-3 py-1.5 rounded-full"
          >
            切换职位
          </button>
        </div>
        
        <div className="flex gap-4 mt-4">
          <div className="flex-1">
            <div className="text-white/60 text-xs mb-1">面试问题 {completedQuestions}/{totalQuestions}</div>
            <div className="h-2 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${(completedQuestions / totalQuestions) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="text-white/60 text-xs mb-1">岗位知识 {completedKnowledge}/{totalKnowledge}</div>
            <div className="h-2 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-400 rounded-full transition-all"
                style={{ width: `${(completedKnowledge / totalKnowledge) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('questions')}
            className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'questions' ? 'bg-purple-100 text-purple-700' : 'text-gray-600'}`}
          >
            面试问题
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${activeTab === 'knowledge' ? 'bg-green-100 text-green-700' : 'text-gray-600'}`}
          >
            岗位知识
          </button>
        </div>
      </div>

      {activeTab === 'questions' && (
        <div className="px-6 py-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-800">面试问题列表</h2>
            <span className="text-sm text-gray-500">{completedQuestions}/{totalQuestions} 已完成</span>
          </div>
          
          {currentData?.questions.map((question, index) => {
            const isCompleted = isQuestionCompleted(question.id);
            return (
              <button
                key={question.id}
                onClick={() => handleQuestionClick(question)}
                className={`w-full rounded-xl border ${isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'} shadow-sm p-4 text-left transition-all hover:shadow-md`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                    {isCompleted ? <CheckCircle size={16} /> : <span className="font-medium text-sm">{index + 1}</span>}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${isCompleted ? 'text-gray-700' : 'text-gray-800'}`}>
                      {question.question}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {question.difficulty}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {isCompleted ? '已打卡' : '待练习'}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {activeTab === 'knowledge' && (
        <div className="px-6 py-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-800">岗位知识点</h2>
            <span className="text-sm text-gray-500">{completedKnowledge}/{totalKnowledge} 已跟读</span>
          </div>
          
          {currentData?.knowledge.map((knowledge, index) => {
            const isCompleted = isKnowledgeCompleted(knowledge.id);
            return (
              <button
                key={knowledge.id}
                onClick={() => handleKnowledgeClick(knowledge)}
                className={`w-full rounded-xl border ${isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'} shadow-sm p-4 text-left transition-all hover:shadow-md`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-green-100 text-green-600'}`}>
                    {isCompleted ? <CheckCircle size={16} /> : <BookOpen size={16} />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{knowledge.content}</p>
                    <div className="mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {isCompleted ? '已跟读' : '点击跟读'}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {showPositionModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-800">切换目标职位</h3>
              {task2Position && (
                <p className="text-sm text-amber-600 mt-1">
                  任务2已选择：{getTask2PositionName()}
                </p>
              )}
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {positionConfig.map((position) => (
                <button
                  key={position.key}
                  onClick={() => handlePositionSelect(position.key)}
                  className={`rounded-xl border-2 p-3 text-center transition-colors ${
                    selectedPosition === position.key 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="text-3xl mb-1">{position.icon}</div>
                  <h3 className="font-bold text-gray-800 text-sm">{position.nameZh}</h3>
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-gray-200 space-y-2">
              {task2Position && (
                <button
                  onClick={handleUseTask2Position}
                  className="w-full py-2.5 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700"
                >
                  使用任务2所选职位
                </button>
              )}
              <button
                onClick={() => setShowPositionModal(false)}
                className="w-full py-2.5 rounded-lg bg-gray-200 text-gray-800 font-medium"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {showQuestionModal && selectedQuestion && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800">Q{selectedQuestion.order}</h3>
                <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                  selectedQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                  selectedQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {selectedQuestion.difficulty}
                </span>
              </div>
              <button onClick={() => { setShowQuestionModal(false); stopSpeaking(); }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-lg font-medium text-gray-800">{selectedQuestion.question}</p>
              </div>
              
              <button
                onClick={() => speakText(selectedQuestion.question)}
                className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                  speaking ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                }`}
              >
                {speaking ? <><Pause size={18} /> 停止朗读</> : <><Volume2 size={18} /> 朗读问题</>}
              </button>
              
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">回答提示</h4>
                <p className="text-blue-700 text-sm">{selectedQuestion.tip}</p>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">录音练习</h4>
                
                {recordingStatus === RECORDING_STATUS.IDLE && (
                  <button
                    onClick={startAudioRecording}
                    className="w-full py-3 rounded-lg font-medium bg-purple-600 text-white hover:bg-purple-700 flex items-center justify-center gap-2"
                  >
                    <Mic size={18} />
                    开始录音
                  </button>
                )}
                
                {recordingStatus === RECORDING_STATUS.RECORDING && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-3 py-4">
                      <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse"></div>
                      <span className="text-red-600 font-medium">录制中 {formatTime(recordingTime)}</span>
                    </div>
                    <button
                      onClick={stopRecording}
                      className="w-full py-3 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 flex items-center justify-center gap-2"
                    >
                      <X size={18} />
                      停止录制
                    </button>
                  </div>
                )}
                
                {recordingStatus === RECORDING_STATUS.COMPLETED && (
                  <div className="space-y-3">
                    <audio src={recordingUrl} controls className="w-full" />
                    <div className="flex gap-3">
                      <button
                        onClick={restartRecording}
                        className="flex-1 py-3 rounded-lg font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 flex items-center justify-center gap-2"
                      >
                        <RefreshCw size={18} />
                        重新录制
                      </button>
                      <button
                        onClick={confirmCheckIn}
                        className="flex-1 py-3 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-2"
                      >
                        <Check size={18} />
                        确认打卡
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showKnowledgeModal && selectedKnowledge && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">知识点跟读</h3>
              <button onClick={() => { setShowKnowledgeModal(false); stopSpeaking(); }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-lg font-medium text-gray-800">{selectedKnowledge.content}</p>
              </div>
              
              <button
                onClick={() => speakText(selectedKnowledge.content)}
                className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                  knowledgeSpeaking ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600 hover:bg-green-200'
                }`}
              >
                {knowledgeSpeaking ? <><Pause size={18} /> 停止朗读</> : <><Volume2 size={18} /> 朗读跟读</>}
              </button>
              
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">跟读练习</h4>
                <p className="text-blue-700 text-sm">点击上方按钮听标准发音，然后录下你的跟读发音，对比练习。</p>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">录音打卡</h4>
                
                {knowledgeRecordingStatus === RECORDING_STATUS.IDLE && (
                  <button
                    onClick={startKnowledgeAudioRecording}
                    className="w-full py-3 rounded-lg font-medium bg-purple-600 text-white hover:bg-purple-700 flex items-center justify-center gap-2"
                  >
                    <Mic size={18} />
                    开始录音
                  </button>
                )}
                
                {knowledgeRecordingStatus === RECORDING_STATUS.RECORDING && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-3 py-4">
                      <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse"></div>
                      <span className="text-red-600 font-medium">录制中 {formatTime(knowledgeRecordingTime)}</span>
                    </div>
                    <button
                      onClick={stopKnowledgeRecording}
                      className="w-full py-3 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 flex items-center justify-center gap-2"
                    >
                      <X size={18} />
                      停止录制
                    </button>
                  </div>
                )}
                
                {knowledgeRecordingStatus === RECORDING_STATUS.COMPLETED && (
                  <div className="space-y-3">
                    <audio src={knowledgeRecordingUrl} controls className="w-full" />
                    <div className="flex gap-3">
                      <button
                        onClick={restartKnowledgeRecording}
                        className="flex-1 py-3 rounded-lg font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 flex items-center justify-center gap-2"
                      >
                        <RefreshCw size={18} />
                        重新录制
                      </button>
                      <button
                        onClick={confirmKnowledgeCheckIn}
                        className="flex-1 py-3 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-2"
                      >
                        <Check size={18} />
                        确认打卡
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InterviewQuestions;