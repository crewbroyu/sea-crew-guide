// src/components/MiniCheckin.jsx
import { useState, useEffect } from 'react';
import { Volume2, Mic, CheckCircle2, RefreshCw, Play, Pause } from 'lucide-react';
import { recordCheckin } from '../store/scoreStore';

// 100个英文短句
const sentences = [
  "I start small, but I move forward with purpose every single day.",
  "Every shift I work brings me closer to my long-term career goals.",
  "I am building a stronger future for myself through daily effort at sea.",
  "I do not quit when things get hard, I learn and adjust quickly.",
  "Hard days are part of growth, and I choose to face them bravely.",
  "I am getting closer to my dream job with every shift I complete.",
  "I learn something useful from every guest interaction and daily experience.",
  "I trust the process even when progress feels slow and uncertain.",
  "I show up every day and give my best effort no matter what.",
  "My hard work and consistency will eventually create real opportunities for me.",
  "I am becoming more confident when speaking English with guests and colleagues.",
  "I speak clearly and bravely even if I still make some mistakes.",
  "Practice helps me improve, and I do not need to be perfect yet.",
  "I improve step by step through repetition, patience, and daily speaking practice.",
  "I am not afraid to try new things and challenge myself daily.",
  "Every guest interaction gives me a chance to improve my communication skills.",
  "I stay calm and professional even during busy and stressful working hours.",
  "I handle difficult situations with patience, confidence, and a positive mindset.",
  "I grow stronger and more experienced through every conversation I have.",
  "I am building real-world skills that will support my long-term career success.",
  "I belong in this industry and I deserve this valuable opportunity to grow.",
  "I choose progress over comfort because growth always requires some discomfort.",
  "I stay focused on my goals even when distractions appear around me.",
  "I take full responsibility for improving my skills and my overall performance.",
  "I am learning to communicate more naturally and effectively in English daily.",
  "I listen carefully, understand clearly, and respond confidently in every conversation.",
  "I improve my service mindset by paying attention to every small detail.",
  "I feel proud of my effort even when results are not perfect yet.",
  "I keep going forward even when I feel tired or slightly discouraged.",
  "I adapt quickly to new environments and different cultural situations onboard.",
  "I stay professional and respectful when working with guests from many countries.",
  "I am learning to think directly in English instead of translating every sentence.",
  "I speak more fluently because I practice consistently every single day.",
  "I no longer fear mistakes because they are part of my learning process.",
  "I use every opportunity to practice English with guests and coworkers onboard.",
  "I grow stronger mentally and emotionally when I face pressure at work.",
  "I stay positive and focused even during long and exhausting working days.",
  "I believe in my ability to improve and succeed in this industry.",
  "I know I am on the right path even if progress feels slow.",
  "I choose discipline over excuses because consistency creates real long-term results.",
  "I stay consistent with my daily practice because small steps lead to big change.",
  "I build strong habits that support my growth and future career development.",
  "I take action immediately instead of waiting for the perfect moment to start.",
  "I control my attitude and choose positivity in every situation I face.",
  "I stay patient because meaningful progress always takes time and effort.",
  "I learn from every mistake and use it to improve my future performance.",
  "I am becoming more professional through my daily work and communication practice.",
  "I improve little by little, and I trust this steady process of growth.",
  "I never stop learning because there is always something new to improve.",
  "I am preparing myself for better positions and bigger opportunities in the future.",
  "I stay ready for opportunities by improving my skills and mindset daily.",
  "I give my best effort during every shift no matter how busy it gets.",
  "I take pride in my work and always try to provide excellent service.",
  "I handle stress with strength and learn how to stay calm under pressure.",
  "I keep a positive mindset even when things do not go as planned.",
  "I am stronger than I think and more capable than I often realize.",
  "I stay focused on my personal growth instead of comparing myself to others.",
  "I believe in long-term success rather than looking for quick and easy results.",
  "I do not give up easily because I know success requires persistence.",
  "I communicate with confidence and clarity in both simple and complex situations.",
  "I improve my listening skills by paying close attention to native speakers daily.",
  "I speak with purpose and try to express my ideas clearly and effectively.",
  "I learn valuable lessons from my teammates and experienced coworkers onboard.",
  "I grow faster when I actively participate in teamwork and communication.",
  "I support my teammates and create a positive working environment for everyone.",
  "I stay open to feedback because it helps me improve more quickly.",
  "I improve with every correction and use feedback as a learning opportunity.",
  "I am becoming more skilled and confident in my role every single day.",
  "I trust my journey even when I cannot see immediate results clearly.",
  "I am building a global lifestyle through my work and travel experiences.",
  "I work hard today to create more choices and freedom in the future.",
  "I stay focused on my long-term goals instead of temporary discomfort.",
  "I push through difficult days because they make me stronger and more resilient.",
  "I am proud to be here and grateful for this opportunity to grow.",
  "I take every chance to improve myself instead of wasting valuable time.",
  "I do not waste opportunities because I know they are not always available.",
  "I am creating my own path instead of waiting for others to guide me.",
  "I stay motivated by remembering why I started this journey in the first place.",
  "I grow every day through discipline, effort, and consistent self-improvement.",
  "I face challenges with courage and treat them as opportunities to learn.",
  "I stay calm and confident even when facing unexpected problems at work.",
  "I learn faster because I stay curious and actively seek improvement daily.",
  "I improve my service mindset by understanding guest needs more deeply.",
  "I build real experience that will help me move to better positions later.",
  "I stay committed to my goals even when progress feels slow and difficult.",
  "I do not let fear stop me from trying new things and improving myself.",
  "I move forward step by step without rushing or losing my direction.",
  "I am getting better every day because I never stop practicing consistently.",
  "I stay disciplined even when I do not feel motivated or inspired.",
  "I believe in my progress even if others cannot see it yet.",
  "I am stronger than yesterday and more prepared for new challenges ahead.",
  "I am ready to face new opportunities and grow from every experience.",
  "I stay focused and consistent because success depends on daily actions.",
  "I keep improving my English through speaking, listening, and real conversations.",
  "I speak with more confidence and ease as I continue practicing daily.",
  "I am building a better future through effort, patience, and persistence.",
  "I stay patient because real growth takes time and consistent effort.",
  "I trust my hard work and believe it will create real results.",
  "I keep going forward even when the journey feels long and uncertain.",
  "I will make it happen because I never stop trying and improving."
];

export default function MiniCheckin() {
  const [currentSentence, setCurrentSentence] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [checkInCount, setCheckInCount] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audio, setAudio] = useState(null);

  // 初始化
  useEffect(() => {
    loadCheckInData();
    selectRandomSentence();
  }, []);

  // 加载打卡数据
  const loadCheckInData = () => {
    const checkInData = JSON.parse(localStorage.getItem('checkin_data') || '{}');
    const today = new Date().toDateString();
    setHasCheckedIn(checkInData[today] || false);
    
    // 计算连续打卡天数
    let streak = 0;
    const todayDate = new Date();
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(todayDate);
      checkDate.setDate(todayDate.getDate() - i);
      const checkDateStr = checkDate.toDateString();
      
      if (checkInData[checkDateStr]) {
        streak++;
      } else {
        break;
      }
    }
    
    setCheckInCount(streak);
  };

  // 随机选择句子
  const selectRandomSentence = () => {
    const randomIndex = Math.floor(Math.random() * sentences.length);
    setCurrentSentence(sentences[randomIndex]);
  };

  // 播放TTS
  const playTTS = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentSentence);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // 停止TTS
  const stopTTS = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  // 开始录音
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];
      
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setRecording(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setMediaRecorder(mediaRecorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  // 播放录音
  const playRecording = () => {
    if (recording) {
      const audioUrl = URL.createObjectURL(recording);
      const audio = new Audio(audioUrl);
      
      audio.onplay = () => setIsPlayingRecording(true);
      audio.onended = () => setIsPlayingRecording(false);
      
      audio.play();
      setAudio(audio);
    }
  };

  // 停止播放录音
  const stopPlayingRecording = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlayingRecording(false);
    }
  };

  // 重录
  const reRecord = () => {
    setRecording(null);
    setIsPlayingRecording(false);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  // 打卡
  const checkIn = () => {
    if (!recording) return;
    
    const today = new Date().toDateString();
    const checkInData = JSON.parse(localStorage.getItem('checkin_data') || '{}');
    
    checkInData[today] = true;
    localStorage.setItem('checkin_data', JSON.stringify(checkInData));
    
    setHasCheckedIn(true);
    setCheckInCount(prev => prev + 1);
    
    // 记录打卡并获得积分奖励
    recordCheckin();
    
    // 保存打卡记录
    const checkInRecords = JSON.parse(localStorage.getItem('checkin_records') || '[]');
    checkInRecords.push({
      date: new Date().toISOString(),
      sentence: currentSentence,
      recording: recording instanceof Blob ? recording.size > 0 : false
    });
    localStorage.setItem('checkin_records', JSON.stringify(checkInRecords));
  };

  // 格式化日期
  const formatDate = () => {
    const date = new Date();
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-3">
      {/* 头部 */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-gray-800">每日英语打卡</h3>
        <div className="text-sm text-gray-500">
          {formatDate()}
        </div>
        <div className="text-sm">
          <span className="text-gray-500">连续打卡: </span>
          <span className="font-medium text-gray-800">{checkInCount}</span>
        </div>
      </div>

      {/* 句子展示 */}
      <div className="mb-3">
        <p className="text-gray-800 text-sm leading-relaxed mb-3">
          {currentSentence}
        </p>
      </div>

      {/* 控制按钮 */}
      {!recording ? (
        <div className="flex gap-2 mb-2">
          <button
            onClick={isPlaying ? stopTTS : playTTS}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-xs"
          >
            {isPlaying ? <Pause size={14} /> : <Volume2 size={14} />}
            {isPlaying ? '暂停' : '播放'}
          </button>
          <button
            onClick={startRecording}
            disabled={isRecording || hasCheckedIn}
            className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 ${
              isRecording || hasCheckedIn 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors'
            } rounded-lg text-xs`}
          >
            <Mic size={14} />
            开始录音
          </button>
          <button
            onClick={stopRecording}
            disabled={!isRecording}
            className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 ${
              isRecording 
                ? 'bg-red-100 text-red-600 hover:bg-red-200 transition-colors' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            } rounded-lg text-xs`}
          >
            <Mic size={14} />
            停止录音
          </button>
        </div>
      ) : (
        <div className="space-y-2 mb-2">
          <div className="flex gap-2">
            <button
              onClick={isPlayingRecording ? stopPlayingRecording : playRecording}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs"
            >
              {isPlayingRecording ? <Pause size={14} /> : <Play size={14} />}
              {isPlayingRecording ? '停止' : '播放'}
            </button>
            <button
              onClick={reRecord}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-xs"
            >
              <RefreshCw size={14} />
              重录
            </button>
            <button
              onClick={checkIn}
              disabled={hasCheckedIn}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 ${
                hasCheckedIn 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 transition-colors'
              } rounded-lg text-xs`}
            >
              <CheckCircle2 size={14} />
              {hasCheckedIn ? '已打卡' : '打卡'}
            </button>
          </div>
        </div>
      )}

      {/* 已打卡提示 */}
      {hasCheckedIn && (
        <div className="mt-2 flex items-center gap-1 text-green-600 text-xs font-medium">
          <CheckCircle2 size={14} />
          今日已打卡
        </div>
      )}
    </div>
  );
}