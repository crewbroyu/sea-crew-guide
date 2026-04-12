// src/pages/tasks/phase2/Task7InterviewPractice.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Clock, Mic, Video, Play, Pause, X, RefreshCw, Check, BarChart3 } from 'lucide-react';
import useAuthStore from '../../../store/useAuthStore';
import { positionConfig } from '../../../data/interviewQuestions';
import interviewQuestions from '../../../data/interviewQuestions';

// 封装 localStorage 工具函数
const STORAGE_KEY = 'task7_data';

const saveToLocalStorage = (data) => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, serializedData);
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      alert('存储空间不足，请清理浏览器缓存后重试');
    }
    return false;
  }
};

const loadFromLocalStorage = (defaultValue) => {
  try {
    const serializedData = localStorage.getItem(STORAGE_KEY);
    if (serializedData === null) {
      return defaultValue;
    }
    return JSON.parse(serializedData);
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
};

// 问题分类颜色映射
const categoryColors = {
  personal: 'bg-blue-100 text-blue-700',
  experience: 'bg-green-100 text-green-700',
  scenario: 'bg-purple-100 text-purple-700',
  behavioral: 'bg-amber-100 text-amber-700',
  knowledge: 'bg-red-100 text-red-700',
  skill: 'bg-indigo-100 text-indigo-700'
};

// 录制状态
const RECORDING_STATUS = {
  IDLE: 'idle',
  RECORDING: 'recording',
  COMPLETED: 'completed'
};

function Task7InterviewPractice() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  
  // 从 localStorage 加载初始数据
  const [progress, setProgress] = useState(() => {
    const data = loadFromLocalStorage({});
    let position = null;
    
    // 先检查 Task7 的数据
    if (data.progress && data.progress.position) {
      position = data.progress.position;
    }
    // 再检查 InterviewQuestions 页面的职位选择
    else {
      const interviewPosition = localStorage.getItem('interviewSelectedPosition');
      if (interviewPosition) {
        position = interviewPosition;
      }
    }
    
    return {
      position: position,
      completedQuestions: data.progress?.completedQuestions || [],
      totalQuestions: 25,
      completed: data.progress?.completed || false,
      completedAt: data.progress?.completedAt || null
    };
  });
  
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState(RECORDING_STATUS.IDLE);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingUrl, setRecordingUrl] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [stream, setStream] = useState(null);
  const [recordingType, setRecordingType] = useState('audio'); // 'audio' or 'video'
  
  const recordingTimerRef = useRef(null);
  const videoPreviewRef = useRef(null);
  
  // 检查任务6是否已完成
  useEffect(() => {
    const progressKey = 'boarding_progress';
    const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
    if (!progress.task6 || !progress.task6.completed) {
      // 任务6未完成，重定向到任务列表
      navigate('/tasks');
    }
  }, [navigate]);
  
  // 当数据变化时，保存到 localStorage
  useEffect(() => {
    const data = {
      progress
    };
    saveToLocalStorage(data);
  }, [progress]);
  
  // 清理录制资源
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
      }
    };
  }, [stream, mediaRecorder, recordingUrl]);
  
  // 职位选项（从 positionConfig 读取）
  const positionOptions = positionConfig;
  
  // 处理职位选择
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // 获取当前职位的面试问题
  const getCurrentQuestions = () => {
    if (!progress.position) return null;
    return interviewQuestions[progress.position];
  };
  
  const currentQuestions = getCurrentQuestions();
  
  // 处理职位确认
  const handlePositionConfirm = () => {
    if (!selectedPosition) return;
    
    setProgress({
      position: selectedPosition,
      completedQuestions: [],
      totalQuestions: 25,
      completed: false,
      completedAt: null
    });
    
    // 同时保存到 profile 中
    const profileData = JSON.parse(localStorage.getItem('profile') || '{}');
    profileData.selected_job = selectedPosition;
    localStorage.setItem('profile', JSON.stringify(profileData));
    
    // 保存到 interviewSelectedPosition，与 InterviewQuestions 页面共用
    localStorage.setItem('interviewSelectedPosition', selectedPosition);
  };
  

  
  // 职位选择页面
  if (!progress.position) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* 顶部头部区域 */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 pt-16 pb-6">
          <h1 className="text-white text-xl font-bold">选择你的目标职位</h1>
          <p className="text-white/80 text-sm mt-1">
            请选择一个目标职位，系统将为你展示该职位的 25 道常见面试问题
          </p>
        </div>
        
        {/* 职位选择卡片 */}
        <div className="px-6 py-8 space-y-6">
          {/* 提醒文字 */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <div className="text-amber-600 font-bold">⚠️</div>
              <p className="text-amber-800 text-sm">
                选择职位后将无法更改，请确认你的目标职位后再选择。
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {positionOptions.map((option) => (
              <div
                key={option.key}
                onClick={() => setSelectedPosition(option.key)}
                className={`rounded-xl border-2 p-6 cursor-pointer transition-all hover:shadow-md ${selectedPosition === option.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
              >
                <div className="text-4xl mb-4">{option.icon}</div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">{option.nameZh}</h3>
                <p className="text-sm text-gray-500 mb-4">{option.nameEn}</p>
                {selectedPosition === option.key && (
                  <div className="flex items-center justify-center mt-2">
                    <CheckCircle size={20} className="text-blue-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* 确认按钮 */}
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={!selectedPosition}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${selectedPosition ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400'}`}
          >
            确认选择
          </button>
        </div>
        
        {/* 职位选择确认弹窗 */}
        {showConfirmModal && selectedPosition && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">确认选择</h3>
              <p className="text-gray-600 mb-6">
                你选择的目标职位是「{positionOptions.find(opt => opt.key === selectedPosition)?.nameZh}」，确认后将无法更改。确定要选择该职位吗？
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 rounded-lg font-medium transition-colors bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  再想想
                </button>
                <button
                  onClick={handlePositionConfirm}
                  className="flex-1 py-3 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
                >
                  确认选择
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // 计算完成进度
  const completedCount = progress.completedQuestions.length;
  const totalCount = currentQuestions?.questions.length || 0;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  // 处理问题点击
  const handleQuestionClick = (question) => {
    setSelectedQuestion(question);
    setShowQuestionModal(true);
    setRecordingStatus(RECORDING_STATUS.IDLE);
    setRecordingTime(0);
    setRecordingUrl(null);
    setRecordingType('audio');
  };
  
  // 开始录音
  const startAudioRecording = async () => {
    try {
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
      
      // 开始计时
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting audio recording:', error);
      alert('无法访问麦克风，请确保你已授权麦克风权限。');
    }
  };
  
  // 开始录像
  const startVideoRecording = async () => {
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(videoStream);
      
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = videoStream;
      }
      
      const recorder = new MediaRecorder(videoStream);
      setMediaRecorder(recorder);
      
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordingUrl(url);
        setRecordingStatus(RECORDING_STATUS.COMPLETED);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
        }
      };
      
      recorder.start();
      setRecordingStatus(RECORDING_STATUS.RECORDING);
      setRecordingTime(0);
      setRecordingType('video');
      
      // 开始计时
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting video recording:', error);
      alert('无法访问摄像头，请确保你已授权摄像头权限。');
    }
  };
  
  // 停止录制
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
  
  // 重新录制
  const restartRecording = () => {
    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
      setRecordingUrl(null);
    }
    setRecordingStatus(RECORDING_STATUS.IDLE);
    setRecordingTime(0);
  };
  
  // 确认打卡
  const confirmCheckIn = () => {
    if (!selectedQuestion) return;
    
    setProgress(prev => {
      if (!prev.completedQuestions.includes(selectedQuestion.id)) {
        const newCompletedQuestions = [...prev.completedQuestions, selectedQuestion.id];
        const isAllCompleted = newCompletedQuestions.length === totalCount;
        
        return {
          ...prev,
          completedQuestions: newCompletedQuestions,
          completed: isAllCompleted,
          completedAt: isAllCompleted ? new Date().toISOString() : null
        };
      }
      return prev;
    });
    
    setShowQuestionModal(false);
    setSelectedQuestion(null);
  };
  
  // 处理完成任务
  const handleCompleteTask = () => {
    // 标记任务7为已完成
    const progressKey = 'boarding_progress';
    const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
    progress.task7 = {
      completed: true,
      completedAt: new Date().toISOString()
    };
    localStorage.setItem(progressKey, JSON.stringify(progress));
    console.log('Task7 完成状态已写入:', progress);
    
    // 跳转到任务列表页面
    navigate('/tasks');
  };
  
  // 格式化时间
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 检查问题是否已完成
  const isQuestionCompleted = (questionId) => {
    return progress.completedQuestions.includes(questionId);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部头部区域 */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 pt-16 pb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-white text-xl font-bold">常见面试问题演练</h1>
            <p className="text-white/80 text-sm mt-1">
              当前职位：{currentQuestions?.positionName} {currentQuestions?.positionNameEn}
            </p>
          </div>
          <div className="bg-white/20 rounded-full px-3 py-1.5">
            <span className="text-white text-sm font-medium">{completedCount}/{totalCount} 已完成</span>
          </div>
        </div>
        
        {/* 总进度条 */}
        <div className="mt-4">
          <div className="flex justify-between text-white/60 text-xs mb-1">
            <span>完成进度</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="h-2 bg-white/30 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ease-out ${progressPercentage === 100 ? 'bg-green-400' : 'bg-white'}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>
      

      
      {/* 庆祝文案 */}
      {progress.completed && (
        <div className="px-6 py-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <CheckCircle size={20} className="text-green-600" />
              <h3 className="text-lg font-bold text-green-800">🎉 恭喜你完成了所有面试问题演练！</h3>
            </div>
            <p className="text-green-700 mt-2">
              你已经为面试做好了充分的准备，相信你在实际面试中会表现出色！
            </p>
            <button
              onClick={() => navigate('/tasks/phase2/task8')}
              className="mt-4 w-full py-3 rounded-lg font-medium transition-colors bg-green-600 text-white hover:bg-green-700"
            >
              开始 AI 模拟面试
            </button>
          </div>
        </div>
      )}
      
      {/* 问题列表区域 */}
      <div className="px-6 py-4 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">面试问题列表</h2>
          <BarChart3 size={20} className="text-gray-500" />
        </div>
        
        <div className="space-y-3">
          {currentQuestions?.questions.map((question, index) => {
            const isCompleted = isQuestionCompleted(question.id);
            return (
              <div 
                key={question.id}
                onClick={() => handleQuestionClick(question)}
                className={`rounded-xl border ${isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'} shadow-sm p-4 cursor-pointer transition-all hover:shadow-md`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      {isCompleted ? (
                        <CheckCircle size={16} />
                      ) : (
                        <span className="font-medium">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${isCompleted ? 'text-gray-700' : 'text-gray-800'}`}>
                        {question.question}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[question.category] || 'bg-gray-100 text-gray-700'}`}>
                          {question.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {isCompleted ? '已打卡' : '待练习'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* 问题练习详情弹窗 */}
      {showQuestionModal && selectedQuestion && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* 弹窗头部 */}
            <div className="border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">
                Q{selectedQuestion.order}: {selectedQuestion.question}
              </h3>
              <button 
                onClick={() => setShowQuestionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            {/* 弹窗内容 */}
            <div className="p-4 space-y-6">
              {/* 回答小贴士 */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">回答小贴士</h4>
                <p className="text-blue-700">{selectedQuestion.tip}</p>
              </div>
              
              {/* 录制区域 */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-800">录制你的回答</h4>
                
                {/* 录制按钮 */}
                {recordingStatus === RECORDING_STATUS.IDLE && (
                  <div className="flex gap-3">
                    <button
                      onClick={startAudioRecording}
                      className="flex-1 py-3 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <Mic size={18} />
                      开始录音
                    </button>
                    <button
                      onClick={startVideoRecording}
                      className="flex-1 py-3 rounded-lg font-medium transition-colors bg-purple-600 text-white hover:bg-purple-700 flex items-center justify-center gap-2"
                    >
                      <Video size={18} />
                      开始录像
                    </button>
                  </div>
                )}
                
                {/* 录制中状态 */}
                {recordingStatus === RECORDING_STATUS.RECORDING && (
                  <div className="space-y-4">
                    {/* 视频预览 */}
                    {recordingType === 'video' && (
                      <div className="bg-gray-900 rounded-lg overflow-hidden">
                        <video 
                          ref={videoPreviewRef} 
                          autoPlay 
                          muted 
                          className="w-full aspect-video"
                        />
                      </div>
                    )}
                    
                    {/* 录制状态 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse"></div>
                        <span className="text-red-600 font-medium">录制中</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-500" />
                        <span className="font-medium">{formatTime(recordingTime)}</span>
                      </div>
                    </div>
                    
                    {/* 停止按钮 */}
                    <button
                      onClick={stopRecording}
                      className="w-full py-3 rounded-lg font-medium transition-colors bg-red-600 text-white hover:bg-red-700 flex items-center justify-center gap-2"
                    >
                      <X size={18} />
                      停止录制
                    </button>
                  </div>
                )}
                
                {/* 录制完成状态 */}
                {recordingStatus === RECORDING_STATUS.COMPLETED && (
                  <div className="space-y-4">
                    {/* 录制回放 */}
                    {recordingType === 'audio' ? (
                      <audio 
                        src={recordingUrl} 
                        controls 
                        className="w-full"
                      />
                    ) : (
                      <video 
                        src={recordingUrl} 
                        controls 
                        className="w-full aspect-video"
                      />
                    )}
                    
                    {/* 操作按钮 */}
                    <div className="flex gap-3">
                      <button
                        onClick={restartRecording}
                        className="flex-1 py-3 rounded-lg font-medium transition-colors bg-gray-200 text-gray-800 hover:bg-gray-300 flex items-center justify-center gap-2"
                      >
                        <RefreshCw size={18} />
                        重新录制
                      </button>
                      <button
                        onClick={confirmCheckIn}
                        className="flex-1 py-3 rounded-lg font-medium transition-colors bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-2"
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

export default Task7InterviewPractice;