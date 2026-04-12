// src/pages/tasks/phase2/Task5Training.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Clock, BookOpen, CheckCircle2, Upload, X, ChevronUp } from 'lucide-react';
import trainingCourses from '../../../data/trainingCourses';

// 封装 localStorage 工具函数
const STORAGE_KEY = 'task5_data';

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

function getPlatformStyle(color) {
  const styles = {
    purple: 'bg-purple-100 text-purple-700',
    blue: 'bg-blue-100 text-blue-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    pink: 'bg-pink-100 text-pink-700',
    gray: 'bg-gray-200 text-gray-700',
    red: 'bg-red-100 text-red-700',
    violet: 'bg-violet-100 text-violet-700',
    amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700'
  };
  return styles[color] || 'bg-gray-100 text-gray-700';
}

export default function Task5Training() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  
  // 从 localStorage 加载初始数据
  const [completedCourses, setCompletedCourses] = useState(() => {
    const data = loadFromLocalStorage({});
    return data.completedCourses || {};
  });
  const [expandedCourse, setExpandedCourse] = useState(null);

  // 学习计时相关状态
  const [activeTimer, setActiveTimer] = useState(null); // { courseId, startTime, elapsedTime, courseName }
  const [timerInterval, setTimerInterval] = useState(null);
  const [showTimerBar, setShowTimerBar] = useState(false);
  
  // 学习笔记相关状态
  const [learningRecords, setLearningRecords] = useState(() => {
    const data = loadFromLocalStorage({});
    return data.learningRecords || {};
  }); // { courseId: [{ date, duration, note }] }
  const [showLearningEndModal, setShowLearningEndModal] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  
  // 完成凭证相关状态
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [currentCourseForCompletion, setCurrentCourseForCompletion] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionImage, setCompletionImage] = useState(null);
  const [completedCourseDetails, setCompletedCourseDetails] = useState(() => {
    const data = loadFromLocalStorage({});
    return data.completedCourseDetails || {};
  }); // { courseId: { completedAt, notes, image } }

  // 当数据变化时，保存到 localStorage
  useEffect(() => {
    const data = {
      completedCourses,
      learningRecords,
      completedCourseDetails
    };
    saveToLocalStorage(data);
  }, [completedCourses, learningRecords, completedCourseDetails]);

  const toggleComplete = (courseId) => {
    setCompletedCourses(prev => ({ ...prev, [courseId]: !prev[courseId] }));
  };

  // 启动计时器
  const startTimer = (course) => {
    // 停止当前计时器
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    // 打开外部链接
    window.open(course.url, '_blank');

    // 启动新计时器
    const startTime = Date.now();
    const newTimer = {
      courseId: course.id,
      startTime,
      courseName: course.nameZh
    };
    setActiveTimer(newTimer);
    setShowTimerBar(true);

    // 设置计时器间隔（仅用于UI刷新）
    const interval = setInterval(() => {
      setActiveTimer(prev => {
        if (!prev) return prev;
        // 每次都重新计算已用时间，不依赖累加
        return {
          ...prev,
          elapsedTime: Date.now() - prev.startTime
        };
      });
    }, 1000);
    setTimerInterval(interval);
  };

  // 停止计时器
  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setShowTimerBar(false);
  };

  // 格式化时间
  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // 保存学习记录
  const saveLearningRecord = () => {
    if (!activeTimer) return;

    const { courseId, startTime, courseName } = activeTimer;
    // 实时计算学习时长，不依赖 state 中的 elapsedTime
    const elapsedTime = Date.now() - startTime;
    const newRecord = {
      date: new Date().toISOString(),
      duration: elapsedTime,
      note: currentNote
    };

    setLearningRecords(prev => ({
      ...prev,
      [courseId]: [...(prev[courseId] || []), newRecord]
    }));

    // 重置状态
    setActiveTimer(null);
    setCurrentNote('');
    setShowLearningEndModal(false);
    stopTimer();
  };

  // 提交完成凭证
  const submitCompletion = () => {
    if (!currentCourseForCompletion || !completionNotes) return;

    setCompletedCourseDetails(prev => ({
      ...prev,
      [currentCourseForCompletion.id]: {
        completedAt: new Date().toISOString(),
        notes: completionNotes,
        image: completionImage
      }
    }));

    // 标记课程为已完成
    setCompletedCourses(prev => ({
      ...prev,
      [currentCourseForCompletion.id]: true
    }));

    // 重置状态
    setShowCompletionModal(false);
    setCurrentCourseForCompletion(null);
    setCompletionNotes('');
    setCompletionImage(null);
  };

  // 处理图片上传
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompletionImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 计算学习统计
  const getLearningStats = (roleKey) => {
    const courses = trainingCourses[roleKey].courses;
    let totalLearningTime = 0;
    let totalLearningSessions = 0;

    courses.forEach(course => {
      const records = learningRecords[course.id] || [];
      totalLearningSessions += records.length;
      totalLearningTime += records.reduce((sum, record) => sum + record.duration, 0);
    });

    return {
      totalLearningSessions,
      totalLearningTime,
      completedCourses: courses.filter(c => completedCourses[c.id]).length
    };
  };

  // 检查是否所有课程都已完成
  const isAllCoursesCompleted = () => {
    if (!selectedRole) return false;
    const courses = trainingCourses[selectedRole].courses;
    return courses.every(course => completedCourses[course.id]);
  };

  // 处理任务完成
  const handleTaskComplete = () => {
    // 标记任务5为已完成
    const progressKey = 'boarding_progress';
    const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
    progress.task5 = {
      completed: true,
      completedAt: new Date().toISOString()
    };
    localStorage.setItem(progressKey, JSON.stringify(progress));

    // 跳转到任务列表页面，标记任务5为已完成
    navigate('/tasks?justCompleted=5');
  };

  // 监听页面可见性变化
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && activeTimer) {
        setShowLearningEndModal(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [activeTimer, timerInterval]);

  const roles = Object.entries(trainingCourses);
  const currentRole = selectedRole ? trainingCourses[selectedRole] : null;

  const getCompletedCount = (roleKey) => {
    return trainingCourses[roleKey].courses.filter(c => completedCourses[c.id]).length;
  };

  const getProgress = (roleKey) => {
    const courses = trainingCourses[roleKey].courses;
    const completed = courses.filter(c => completedCourses[c.id]).length;
    return Math.round((completed / courses.length) * 100);
  };

  // ====== 岗位选择页 ======
  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white pb-20">
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center">
            <button onClick={() => navigate('/academy')} className="text-gray-500 mr-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">岗位英语课程</h1>
              <p className="text-sm text-gray-500">海乘学院 {'>'} 岗位英语课程</p>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pt-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-2">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-sm font-medium text-amber-800">重要提示</p>
                <p className="text-xs text-amber-700 mt-1">
                  以下课程均来自站外平台（Alison、Coursera等），需自行前往对应网站注册账号学习。大部分课程免费，部分平台可能需付费获取证书。
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {roles.map(([key, role]) => {
              const progress = getProgress(key);
              const completed = getCompletedCount(key);
              return (
                <button
                  key={key}
                  onClick={() => setSelectedRole(key)}
                  className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-left hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{role.icon}</span>
                      <div>
                        <h3 className="font-bold text-gray-900">{role.title}</h3>
                        <p className="text-xs text-gray-500">{role.courses.length} 个课程/资源</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>学习进度</span>
                      <span>{completed}/{role.courses.length} 已完成</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                      <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    {/* 学习统计 */}
                    {getLearningStats(key).totalLearningSessions > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">学习次数</p>
                          <p className="text-sm font-medium text-gray-900">{getLearningStats(key).totalLearningSessions}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">累计时长</p>
                          <p className="text-sm font-medium text-gray-900">{formatTime(getLearningStats(key).totalLearningTime)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">已完成</p>
                          <p className="text-sm font-medium text-gray-900">{getLearningStats(key).completedCourses}</p>
                        </div>
                      </div>
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

  // ====== 课程列表页 ======
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white pb-20">
      <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center">
            <button onClick={() => navigate('/academy')} className="text-gray-500 mr-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{currentRole.icon} {currentRole.title}</h1>
              <p className="text-sm text-gray-500">已完成 {getCompletedCount(selectedRole)}/{currentRole.courses.length}</p>
            </div>
          </div>
        </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
          <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${getProgress(selectedRole)}%` }} />
        </div>

        {isAllCoursesCompleted() && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} className="text-green-600" />
              <div>
                <h3 className="text-sm font-bold text-green-800">✅ 任务5已完成！</h3>
                <p className="text-xs text-green-700 mt-1">你可以继续进行任务6：面试技巧学习</p>
              </div>
            </div>
            <button
              onClick={handleTaskComplete}
              className="mt-3 w-full py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              前往任务6
            </button>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
          <p className="text-xs text-blue-700">📌 以下均为站外课程，点击"前往学习"将跳转到对应网站。学完后回来点"标记完成"记录进度。</p>
        </div>

        <div className="space-y-3">
          {currentRole.courses.sort((a, b) => a.order - b.order).map((course) => {
            const isCompleted = completedCourses[course.id];
            const isExpanded = expandedCourse === course.id;
            return (
              <div key={course.id} className={`bg-white rounded-xl border overflow-hidden transition-all ${
                course.highlight ? 'border-yellow-300 ring-1 ring-yellow-200' : isCompleted ? 'border-green-200' : 'border-gray-100'
              }`}>
                <div className="p-4 cursor-pointer" onClick={() => setExpandedCourse(isExpanded ? null : course.id)}>
                  <div className="flex items-start gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleComplete(course.id); }}
                      className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300'
                      }`}
                    >
                      {isCompleted && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {course.highlight && <span className="text-xs">⭐</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPlatformStyle(course.platformColor)}`}>
                          {course.platform}
                        </span>
                        <span className="text-xs text-gray-400">{course.level}</span>
                        {course.recommended && <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">推荐</span>}
                      </div>
                      <h3 className={`font-medium text-sm ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {course.nameZh}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">{course.name}</p>
                    </div>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 mt-2 ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                    <p className="text-sm text-gray-600 mb-3">{course.description}</p>
                    <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500 mb-3">
                      <span>⏱️ {course.duration}</span>
                      {course.tags && course.tags.map((tag, i) => (
                        <span key={i} className="bg-gray-100 px-2 py-0.5 rounded">{tag}</span>
                      ))}
                    </div>
                    {course.note && <p className="text-xs text-amber-600 mb-3">💡 {course.note}</p>}

                    {/* 未完成的课程显示开始学习和完成凭证按钮 */}
                    {!isCompleted && (
                      <div className="flex gap-2 mb-4">
                        <button 
                          onClick={() => startTimer(course)}
                          disabled={activeTimer !== null && activeTimer.courseId !== course.id}
                          className={`flex-1 ${activeTimer !== null && activeTimer.courseId !== course.id ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'} text-sm font-medium py-2.5 rounded-lg text-center transition-colors`}
                        >
                          开始学习
                        </button>
                        <button 
                          onClick={() => {
                            setCurrentCourseForCompletion(course);
                            setShowCompletionModal(true);
                          }}
                          className="flex-1 bg-purple-600 text-white text-sm font-medium py-2.5 rounded-lg text-center hover:bg-purple-700 transition-colors"
                        >
                          完成凭证
                        </button>
                      </div>
                    )}

                    {/* 已完成的课程显示完成信息 */}
                    {isCompleted && completedCourseDetails[course.id] && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-green-800">已完成</p>
                            <p className="text-xs text-green-600 mt-1">
                              完成时间：{new Date(completedCourseDetails[course.id].completedAt).toLocaleString()}
                            </p>
                            {completedCourseDetails[course.id].notes && (
                              <p className="text-sm text-green-700 mt-2">
                                学习心得：{completedCourseDetails[course.id].notes}
                              </p>
                            )}
                            {completedCourseDetails[course.id].image && (
                              <div className="mt-2">
                                <img 
                                  src={completedCourseDetails[course.id].image} 
                                  alt="完成凭证" 
                                  className="max-h-40 object-contain rounded"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 学习记录 */}
                    {learningRecords[course.id] && learningRecords[course.id].length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                          <BookOpen size={14} />
                          学习记录
                        </h4>
                        <div className="space-y-2">
                          {[...(learningRecords[course.id] || [])].reverse().map((record, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-2">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>{new Date(record.date).toLocaleString()}</span>
                                <span>时长：{formatTime(record.duration)}</span>
                              </div>
                              {record.note && (
                                <p className="text-xs text-gray-700">{record.note}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 悬浮计时条 */}
      <AnimatePresence>
        {showTimerBar && activeTimer && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white p-3 flex items-center justify-between z-50"
          >
            <div className="flex items-center gap-2">
              <Clock size={18} />
              <div>
                <p className="text-sm font-medium">{activeTimer.courseName}</p>
                <p className="text-xs">{formatTime(activeTimer.elapsedTime)}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowLearningEndModal(true)}
              className="bg-white text-blue-600 px-4 py-1.5 rounded-full text-sm font-medium"
            >
              结束
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 学习结束弹窗 */}
      <AnimatePresence>
        {showLearningEndModal && activeTimer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="bg-white rounded-xl p-5 max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-3">学习结束</h3>
              <p className="text-sm text-gray-600 mb-2">
                课程：{activeTimer.courseName}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                学习时长：{formatTime(Date.now() - activeTimer.startTime)}
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  学习笔记
                </label>
                <textarea
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  placeholder="写一句今天学了什么..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLearningEndModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium"
                >
                  继续学习
                </button>
                <button
                  onClick={saveLearningRecord}
                  className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
                >
                  保存记录
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 完成凭证弹窗 */}
      <AnimatePresence>
        {showCompletionModal && currentCourseForCompletion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="bg-white rounded-t-xl p-5 w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">完成凭证</h3>
                <button 
                  onClick={() => {
                    setShowCompletionModal(false);
                    setCurrentCourseForCompletion(null);
                    setCompletionNotes('');
                    setCompletionImage(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                课程：{currentCourseForCompletion.nameZh}
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  学习心得 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="分享一下你的学习收获..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  rows={4}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  上传凭证（可选）
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {completionImage ? (
                    <div className="relative">
                      <img 
                        src={completionImage} 
                        alt="凭证" 
                        className="max-h-40 object-contain mx-auto"
                      />
                      <button 
                        onClick={() => setCompletionImage(null)}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md"
                      >
                        <X size={16} className="text-gray-600" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload size={32} className="text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-2">点击或拖拽文件到此处上传</p>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload}
                        className="hidden"
                        id="completion-image-upload"
                      />
                      <label 
                        htmlFor="completion-image-upload"
                        className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium cursor-pointer hover:bg-blue-200"
                      >
                        选择文件
                      </label>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={submitCompletion}
                disabled={!completionNotes}
                className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${
                  completionNotes ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                提交
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}