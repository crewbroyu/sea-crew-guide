import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Volume2, BookOpen, Tag, MessageSquare, CheckCircle2, ChevronRight } from 'lucide-react';

const STORAGE_KEY = 'scenario_progress';

const saveProgress = (progress) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving progress:', error);
  }
};

const loadProgress = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error loading progress:', error);
    return {};
  }
};

function ScenarioDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { scenario, job } = location.state || {};
  
  const [playing, setPlaying] = useState(false);
  const [currentSentence, setCurrentSentence] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [progress, setProgress] = useState(() => loadProgress());
  
  const utteranceRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!scenario) {
      navigate('/academy/scenarios');
    }
  }, [scenario, navigate]);

  useEffect(() => {
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
      // The recording interval is allocated after mount, so cleanup needs its latest handle.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const activeInterval = intervalRef.current;
      if (activeInterval) {
        clearInterval(activeInterval);
      }
    };
  }, []);

  const speakText = (text, onEnd = null) => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    utterance.onstart = () => {
      setSpeaking(true);
    };
    
    utterance.onend = () => {
      setSpeaking(false);
      if (onEnd) onEnd();
    };
    
    utterance.onerror = () => {
      setSpeaking(false);
    };
    
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const handlePlayDialogue = () => {
    if (playing) {
      stopSpeaking();
      setPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    setPlaying(true);
    let index = 0;
    
    const playNext = () => {
      if (index < scenario.dialogue.length) {
        setCurrentSentence(index);
        speakText(scenario.dialogue[index].text, () => {
          index++;
          if (index < scenario.dialogue.length) {
            setTimeout(playNext, 500);
          } else {
            setPlaying(false);
            setCurrentSentence(0);
          }
        });
      }
    };
    
    playNext();
  };

  const handlePlaySentence = (text, index) => {
    setCurrentSentence(index);
    speakText(text);
  };

  const handleMarkAsCompleted = () => {
    const newProgress = { ...progress, [scenario.id]: true };
    setProgress(newProgress);
    saveProgress(newProgress);
  };

  const handleGoToInterview = (questionId) => {
    const params = new URLSearchParams({
      position: job || 'bar_server',
      question: questionId,
      source: 'scenario',
    });
    navigate(`/tasks/phase2/Task7/voice?${params.toString()}`);
  };

  if (!scenario) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 pt-16 pb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/academy/scenarios')} className="text-white/80 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-white text-xl font-bold">Day {scenario.day}: {scenario.title}</h1>
            <p className="text-white/80 text-sm mt-1">
              {scenario.titleEn}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* 音频播放模块 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-bold text-gray-800 mb-4">完整对话</h2>
          <div className="flex items-center justify-center py-6 bg-blue-50 rounded-lg">
            <button
              onClick={handlePlayDialogue}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                playing ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
              }`}
            >
              {playing ? <Pause size={32} /> : <Play size={32} />}
            </button>
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">
            {playing ? '播放中...' : '点击播放完整对话'}
          </p>
        </div>

        {/* 对话展示 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-bold text-gray-800 mb-4">对话练习</h2>
          <div className="space-y-4">
            {scenario.dialogue.map((line, index) => (
              <div 
                key={index}
                className={`rounded-lg p-4 transition-all ${
                  currentSentence === index 
                    ? 'bg-blue-100 border border-blue-200' 
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    line.role === 'You' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {line.role.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-2">{line.role}</p>
                    <p className="text-gray-800">{line.text}</p>
                  </div>
                  <button
                    onClick={() => handlePlaySentence(line.text, index)}
                    className={`p-2 rounded-full hover:bg-gray-100 ${
                      speaking && currentSentence === index ? 'bg-blue-100 text-blue-600' : 'text-gray-500'
                    }`}
                  >
                    <Volume2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 关键词模块 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Tag size={20} className="text-blue-600" />
            关键词
          </h2>
          <div className="flex flex-wrap gap-2">
            {scenario.keywords.map((keyword, index) => (
              <span key={index} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {keyword}
              </span>
            ))}
          </div>
        </div>

        {/* 句型模块 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MessageSquare size={20} className="text-blue-600" />
            核心句型
          </h2>
          <div className="space-y-3">
            {scenario.patterns.map((pattern, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-gray-800 font-medium">{pattern}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 面试衔接模块 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BookOpen size={20} className="text-blue-600" />
            面试衔接
          </h2>
          <div className="space-y-4">
            {scenario.interview_questions.map((question, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <p className="text-gray-800 mb-3">{question.text}</p>
                <button
                  onClick={() => handleGoToInterview(question.id)}
                  className="w-full py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                  去回答
                  <ChevronRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 完成按钮 */}
        {!progress[scenario.id] && (
          <button
            onClick={handleMarkAsCompleted}
            className="w-full py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={20} />
            完成训练
          </button>
        )}

        {progress[scenario.id] && (
          <div className="w-full py-3 rounded-lg bg-green-100 text-green-700 font-medium flex items-center justify-center gap-2">
            <CheckCircle2 size={20} />
            训练已完成
          </div>
        )}
      </div>
    </div>
  );
}

export default ScenarioDetail;
