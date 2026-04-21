import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Play, CheckCircle2, Calendar, BarChart3, AlertTriangle } from 'lucide-react';
import scenarioData from '../../data/scenarioData';
import { positionConfig } from '../../data/interviewQuestions';

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

function ScenarioList() {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState([]);
  const [progress, setProgress] = useState(() => loadProgress());
  const [selectedJob, setSelectedJob] = useState('bar_server');
  const [task2Position, setTask2Position] = useState(null);
  const [positionMismatch, setPositionMismatch] = useState(false);
  const [showMismatchModal, setShowMismatchModal] = useState(false);

  useEffect(() => {
    const task2Result = localStorage.getItem('task2_result');
    if (task2Result) {
      const task2Data = JSON.parse(task2Result);
      if (task2Data.selectedTargetJob) {
        setTask2Position(task2Data.selectedTargetJob);
        if (scenarioData[task2Data.selectedTargetJob]) {
          setSelectedJob(task2Data.selectedTargetJob);
        } else {
          setPositionMismatch(true);
          setShowMismatchModal(true);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (scenarioData[selectedJob]) {
      setScenarios(scenarioData[selectedJob].scenarios);
    }
  }, [selectedJob]);

  const handleScenarioClick = (scenario) => {
    navigate('/academy/scenarios/detail', {
      state: { scenario, job: selectedJob }
    });
  };

  const isCompleted = (scenarioId) => {
    return progress[scenarioId] === true;
  };

  const markAsCompleted = (scenarioId) => {
    const newProgress = { ...progress, [scenarioId]: true };
    setProgress(newProgress);
    saveProgress(newProgress);
  };

  const getTask2PositionName = () => {
    const position = positionConfig.find(p => p.key === task2Position);
    return position ? `${position.icon} ${position.nameZh}` : '';
  };

  const handleUseTask2Position = () => {
    if (task2Position && scenarioData[task2Position]) {
      setSelectedJob(task2Position);
      setShowMismatchModal(false);
      setPositionMismatch(false);
    }
  };

  const getScenarioDataInfo = () => {
    const info = [];
    for (const key in scenarioData) {
      info.push({ key, ...scenarioData[key] });
    }
    return info;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {showMismatchModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="text-center mb-4">
              <AlertTriangle size={48} className="text-amber-500 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">职位不匹配</h3>
              <p className="text-gray-600">
                任务2选择了 <span className="font-medium">{getTask2PositionName()}</span>，
                但该职位的场景训练尚未添加。
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
                选择其他职位
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 pt-16 pb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/academy')} className="text-white/80 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-white text-xl font-bold">岗位场景训练</h1>
            <p className="text-white/80 text-sm mt-1">
              {scenarioData[selectedJob]?.jobTitle} ({scenarioData[selectedJob]?.jobTitleEn})
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {task2Position && positionMismatch && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-amber-800 font-medium mb-2">
                  任务2选择：{getTask2PositionName()}（暂无场景训练）
                </p>
                <p className="text-amber-700 text-sm">
                  当前显示的是酒吧服务员场景训练，其他职位场景训练陆续添加中。
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <h2 className="text-lg font-bold text-gray-800">训练计划</h2>
          <p className="text-gray-600 mt-2">
            通过10天的场景训练，提升你的{scenarioData[selectedJob]?.jobTitle}技能和英语表达能力。
          </p>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="text-sm text-gray-500 mb-1">
                完成进度 {Object.values(progress).filter(Boolean).length}/{scenarios.length}
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${(Object.values(progress).filter(Boolean).length / scenarios.length) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-700 font-medium">
              <BarChart3 size={16} />
              {Math.round((Object.values(progress).filter(Boolean).length / scenarios.length) * 100)}%
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-bold text-gray-800">场景列表</h2>
          
          {scenarios.map((scenario, index) => {
            const completed = isCompleted(scenario.id);
            return (
              <button
                key={scenario.id}
                onClick={() => handleScenarioClick(scenario)}
                className={`w-full bg-white rounded-xl shadow-sm p-4 flex items-start gap-4 transition-all hover:shadow-md ${
                  completed ? 'border border-green-200 bg-green-50' : 'border border-gray-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  completed ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {completed ? <CheckCircle2 size={20} /> : <Play size={20} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                      Day {scenario.day}
                    </span>
                    <h3 className="font-medium text-gray-800">{scenario.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{scenario.titleEn}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>6-8句对话</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen size={14} />
                      <span>{scenario.interview_questions.length}个面试问题</span>
                    </div>
                  </div>
                </div>
                <div className="text-gray-400">
                  {completed ? (
                    <span className="text-xs text-green-600 font-medium">已完成</span>
                  ) : index === 0 || isCompleted(scenarios[index - 1]?.id) ? (
                    <span className="text-xs text-blue-600 font-medium">可练习</span>
                  ) : (
                    <span className="text-xs text-gray-400 font-medium">锁定</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ScenarioList;