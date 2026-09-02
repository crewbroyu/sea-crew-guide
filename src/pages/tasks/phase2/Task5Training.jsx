// src/pages/tasks/phase2/Task5Training.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Clock, BookOpen, CheckCircle2, Upload, X, ChevronRight, ChevronUp } from 'lucide-react';
import trainingCourses from '../../../data/trainingCourses';
import BarServerFoundationTraining from '../../../components/training/BarServerFoundationTraining';
import { barServerFoundationDays, getCompletedFoundationDays } from '../../../data/barServerFoundation';
import { syncLocalPathProfile } from '../../../services/userPathService';
import { getMyJobPreparation, upsertMyJobPreparation } from '../../../services/jobPreparationService';

// 封装 localStorage 工具函数
const STORAGE_KEY = 'task5_data';

const readJson = (key, fallback = null) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const getTimestamp = () => new Date().getTime();

const mapTargetPositionToRole = (position = '') => {
  const normalized = position.toLowerCase();
  if (normalized.includes('retail') || normalized.includes('shop') || normalized.includes('sales') || normalized.includes('jewelry')) return 'retail';
  if (normalized.includes('bar') || normalized.includes('bartender')) return 'barServer';
  if (normalized.includes('restaurant') || normalized.includes('waiter') || normalized.includes('buffet')) return 'waiter';
  if (normalized.includes('housekeeping') || normalized.includes('cabin') || normalized.includes('laundry')) return 'housekeeping';
  if (normalized.includes('guest service') || normalized.includes('front') || normalized.includes('reception') || normalized.includes('concierge')) return 'frontOffice';
  if (normalized.includes('youth') || normalized.includes('activity')) return 'youthStaff';
  if (normalized.includes('galley') || normalized.includes('kitchen')) return 'kitchen';
  if (normalized.includes('utility') || normalized.includes('cleaner')) return 'utility';
  return null;
};

const saveToLocalStorage = (data) => {
  try {
    // 保存前先排除 image 数据计算大小，避免超限
    const serializedData = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, serializedData);
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('存储空间不足，尝试清理图片数据...');
      // 尝试移除图片后重新保存
      try {
        const cleanData = { ...data };
        if (cleanData.completedCourseDetails) {
          const cleanDetails = {};
          Object.entries(cleanData.completedCourseDetails).forEach(([key, val]) => {
            cleanDetails[key] = { ...val, image: null };
          });
          cleanData.completedCourseDetails = cleanDetails;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanData));
        return true;
      } catch (e2) {
        console.error('即使清理图片后仍然无法保存:', e2);
      }
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

const rolePreparation = {
  waiter: {
    suitableFor: '有餐饮、咖啡店、酒店或基础服务经验，能接受高峰期节奏和重复服务动作的人。',
    interviewFocus: ['点餐和上菜流程', '处理客诉和特殊需求', '高峰期配合与抗压'],
    mustLearn: ['菜单描述', '推荐菜品', '餐具和餐桌设置', '投诉处理英语'],
    nextStep: '准备一个餐厅高峰期服务案例，并在 Task6 写成英文回答。',
    onePage: {
      duties: '负责迎接客人、点单、上菜、清台、回应需求，并保持餐区服务标准。',
      scenarios: ['客人等待过久', '点单错误', '推荐菜品或饮品', '过敏或特殊饮食需求'],
      weakness: '只会说简单服务英语，但讲不清服务流程、投诉处理和团队配合。',
      priority: '先掌握服务流程和投诉英语，再补菜单描述和推荐表达。',
    },
    checklist: ['我能说清餐厅服务员每天做什么', '我知道 3 个常见客诉场景', '我能用英文推荐一道菜或饮品', '我准备了一个高峰期服务案例', '我知道这个岗位的压力点'],
  },
  retail: {
    suitableFor: '有销售、客服、美妆、奢侈品、英语沟通或目标感强的人。',
    interviewFocus: ['销售动机', '产品推荐逻辑', '处理缺货和犹豫客人', 'KPI 压力'],
    mustLearn: ['upselling', 'cross-selling', '商品陈列', '品牌和产品基础', '销售英语'],
    nextStep: '准备一个“客人犹豫/缺货/推荐替代品”的销售服务案例。',
    onePage: {
      duties: '负责接待客人、介绍产品、促成销售、补货陈列、处理退换货或客人异议。',
      scenarios: ['客人只看不买', '商品缺货', '推荐更高价产品', '客人比较多个品牌'],
      weakness: '只说自己喜欢购物，但没有销售逻辑、产品意识和业绩压力认知。',
      priority: '先学销售沟通和客户异议处理，再补香水、手表、美妆等产品知识。',
    },
    checklist: ['我能说清免税店销售每天做什么', '我知道 upselling 和 cross-selling 的区别', '我能用英文推荐一个产品', '我准备了一个销售服务案例', '我知道 KPI 和站立服务压力'],
  },
  barServer: {
    suitableFor: '适合外向、反应快、能接受晚班和快节奏服务，并愿意练口语的人。',
    interviewFocus: ['点单英语', '酒水基础', '客人互动', '高峰期服务节奏'],
    mustLearn: ['basic drinks', 'order taking', 'small talk', 'responsible service', 'upselling'],
    nextStep: '准备一个忙碌吧台下保持服务质量的压力案例。',
    onePage: {
      duties: '协助点单、送酒水、清理吧台或桌面、推荐饮品，并和酒保及服务团队配合。',
      scenarios: ['客人不知道点什么', '高峰期排队', '客人催单', '推荐更合适的饮品'],
      weakness: '误以为一定要会复杂调酒，忽略服务节奏、点单英语和客人互动。',
      priority: '先学点单和推荐表达，再补酒水分类和基础风味。',
    },
    checklist: ['我能说清 Bar Server 和 Bartender 的区别', '我知道基础酒水分类', '我能用英文推荐一款饮品', '我准备了一个高峰期压力案例', '我能接受晚班和快节奏服务'],
  },
  housekeeping: {
    suitableFor: '适合踏实、细心、动作稳定，能接受体力劳动和重复标准流程的人。',
    interviewFocus: ['清洁标准', '时间管理', '细节意识', '客人隐私和安全'],
    mustLearn: ['room cleaning sequence', 'linen handling', 'sanitation', 'lost and found', 'team handover'],
    nextStep: '准备一个按标准完成大量房间或处理客人特殊需求的案例。',
    onePage: {
      duties: '负责客房清洁、布草更换、补充用品、报告维修问题，并保持卫生和安全标准。',
      scenarios: ['房间时间紧', '客人要求额外用品', '发现遗留物品', '发现设备损坏'],
      weakness: '只说自己能吃苦，但讲不出标准流程、隐私意识和效率管理。',
      priority: '先理解清洁流程和卫生标准，再补酒店服务英语。',
    },
    checklist: ['我能说清客房清洁标准流程', '我知道客人隐私和遗留物处理原则', '我能描述一次高效率完成任务的经历', '我知道这个岗位的体力压力', '我能用英文回应客人基础需求'],
  },
  frontOffice: {
    suitableFor: '适合英语较好、表达清楚、能处理信息和突发问题的人。',
    interviewFocus: ['入住/退房流程', '信息确认', '投诉处理', '跨部门沟通'],
    mustLearn: ['check-in', 'check-out', 'guest inquiry', 'complaint handling', 'phone etiquette'],
    nextStep: '准备一个前台或客服场景中确认信息、安抚客人并协调解决的案例。',
    onePage: {
      duties: '负责接待咨询、入住退房、信息确认、解决客人问题，并和客房/餐饮等部门沟通。',
      scenarios: ['房间未准备好', '账单疑问', '客人问路', '客人投诉设施问题'],
      weakness: '只强调英语好，但缺少服务流程、耐心和信息准确性。',
      priority: '先练信息确认和投诉处理，再补电话英语和系统流程。',
    },
    checklist: ['我能说清前台核心工作流程', '我能用英文确认客人信息', '我知道如何处理房间未准备好', '我准备了一个协调沟通案例', '我能接受持续面对客人和突发问题'],
  },
  youthStaff: {
    suitableFor: '适合喜欢孩子、有活动组织经验、耐心强，并重视安全边界的人。',
    interviewFocus: ['儿童安全', '活动组织', '家长沟通', '突发情况处理'],
    mustLearn: ['child safety', 'activity planning', 'first aid awareness', 'parent communication'],
    nextStep: '准备一个组织活动或处理孩子突发情况的团队案例。',
    onePage: {
      duties: '负责儿童活动组织、现场看护、安全提醒、家长沟通和活动记录。',
      scenarios: ['孩子哭闹', '活动中有人受伤', '家长有特殊要求', '不同年龄孩子一起活动'],
      weakness: '只说喜欢孩子，但没有安全意识、规则意识和活动管理经验。',
      priority: '先学儿童安全和活动组织，再补儿童沟通英语。',
    },
    checklist: ['我能说清 Youth Staff 的安全责任', '我知道如何组织一个简单活动', '我能处理孩子哭闹或轻微冲突', '我准备了一个活动组织案例', '我知道家长沟通的重要性'],
  },
  kitchen: {
    suitableFor: '适合能吃苦、执行力强、重视卫生安全，并有厨房或食品相关经验的人。',
    interviewFocus: ['食品安全', '厨房协作', '卫生标准', '高强度执行力'],
    mustLearn: ['food hygiene', 'knife/basic prep', 'kitchen safety', 'team communication'],
    nextStep: '准备一个遵守卫生标准、配合团队完成任务的压力案例。',
    onePage: {
      duties: '协助备菜、清洁、食品处理、设备维护，并遵守厨房卫生和安全规范。',
      scenarios: ['高峰期备餐', '食材污染风险', '设备使用安全', '和厨师团队配合'],
      weakness: '只说愿意吃苦，但不了解食品安全、卫生标准和团队节奏。',
      priority: '先学食品安全和厨房卫生，再补基础厨房英语。',
    },
    checklist: ['我能说清食品安全基本原则', '我知道厨房高峰期怎么配合', '我能描述一个高强度工作经历', '我知道卫生和安全的重要性', '我能接受后场工作环境'],
  },
  utility: {
    suitableFor: '适合执行力强、能接受体力劳动、愿意从基础岗位开始的人。',
    interviewFocus: ['安全意识', '清洁标准', '设备使用', '稳定性和责任心'],
    mustLearn: ['cleaning chemicals', 'PPE', 'waste handling', 'basic maintenance', 'team support'],
    nextStep: '准备一个完成脏累任务、保持安全和效率的工作案例。',
    onePage: {
      duties: '负责公共区域或后场清洁、垃圾处理、设备辅助、基础维护和团队支持。',
      scenarios: ['地面湿滑', '清洁剂使用', '垃圾分类处理', '设备或区域临时清洁'],
      weakness: '只把它当低门槛岗位，忽略安全规范、稳定性和执行力要求。',
      priority: '先理解安全规范和清洁流程，再补设备和基础维护知识。',
    },
    checklist: ['我能说清 Utility 的核心职责', '我知道清洁安全和 PPE 的重要性', '我能描述一个体力劳动经历', '我能接受基础岗位和重复任务', '我知道如何与团队配合'],
  },
};

export default function Task5Training() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(() => {
    const task2Result = readJson('task2_result', {});
    return mapTargetPositionToRole(task2Result.selectedTargetJob || task2Result.target_position)
      || loadFromLocalStorage({}).selectedRole
      || null;
  });
  
  // 从 localStorage 加载初始数据
  const [completedCourses, setCompletedCourses] = useState(() => {
    const data = loadFromLocalStorage({});
    return data.completedCourses || {};
  });
  const [preparationChecks, setPreparationChecks] = useState(() => {
    const data = loadFromLocalStorage({});
    return data.preparationChecks || {};
  });
  const [foundationProgress, setFoundationProgress] = useState(() => {
    const data = loadFromLocalStorage({});
    return data.foundationProgress || {};
  });
  const [expandedCourse, setExpandedCourse] = useState(null);

  // 学习计时相关状态
  const [activeTimer, setActiveTimer] = useState(null); // { courseId, startTime, elapsedTime, courseName }
  const timerIntervalRef = useRef(null);
  const [showTimerBar, setShowTimerBar] = useState(false);
  
  // 用 ref 追踪 activeTimer，供 visibilitychange 使用
  const activeTimerRef = useRef(null);
  useEffect(() => {
    activeTimerRef.current = activeTimer;
  }, [activeTimer]);
  
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
      selectedRole,
      completedCourses,
      preparationChecks,
      foundationProgress,
      learningRecords,
      completedCourseDetails
    };
    saveToLocalStorage(data);
  }, [selectedRole, completedCourses, preparationChecks, foundationProgress, learningRecords, completedCourseDetails]);

  useEffect(() => {
    const localData = loadFromLocalStorage({});
    if (localData.selectedRole || Object.keys(localData.foundationProgress || {}).length) return;

    getMyJobPreparation()
      .then((profile) => {
        if (!profile) return;
        const roleKey = profile.selected_role || null;
        const checks = (profile.preparation_checklist || []).reduce((result, item, index) => {
          result[index] = Boolean(item?.completed);
          return result;
        }, {});
        const courses = (profile.completed_resources || []).reduce((result, item) => {
          if (item?.id) result[item.id] = true;
          return result;
        }, {});
        const records = profile.learning_records || {};

        setSelectedRole(roleKey);
        setPreparationChecks(roleKey ? { [roleKey]: checks } : {});
        setCompletedCourses(courses);
        setLearningRecords(records);
        setFoundationProgress(records.barServerFoundation || {});
        setCompletedCourseDetails(profile.completed_course_details || {});
      })
      .catch((error) => console.error('恢复云端岗位准备资料失败:', error));
  }, []);



  // 启动计时器
  const startTimer = (course) => {
    // 停止当前计时器
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    // 打开外部链接
    window.open(course.url, '_blank');

    // 启动新计时器
    const startTime = getTimestamp();
    const newTimer = {
      courseId: course.id,
      startTime,
      courseName: course.nameZh,
      elapsedTime: 0
    };
    setActiveTimer(newTimer);
    setShowTimerBar(true);

    // 设置计时器间隔
    const interval = setInterval(() => {
      setActiveTimer(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          elapsedTime: getTimestamp() - prev.startTime
        };
      });
    }, 1000);
    timerIntervalRef.current = interval;
  };

  // 停止计时器
  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setShowTimerBar(false);
  }, []);

  // 格式化时间
  const formatTime = (milliseconds) => {
    if (!milliseconds || milliseconds < 0) return '00:00:00';
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // 保存学习记录
  const saveLearningRecord = () => {
    if (!activeTimer) return;

    const { courseId, startTime } = activeTimer;
    // 实时计算学习时长，不依赖 state 中的 elapsedTime
    const elapsedTime = getTimestamp() - startTime;
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

  // 处理图片上传 - 限制大小
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // 限制文件大小为 500KB
    if (file.size > 500 * 1024) {
      // 压缩图片
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        // 缩放到最大 600px 宽
        const maxWidth = 600;
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setCompletionImage(compressedDataUrl);
      };
      img.src = URL.createObjectURL(file);
    } else {
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

  // 检查岗位准备清单是否完成
  const isPreparationCompleted = () => {
    if (!selectedRole) return false;
    const checklist = rolePreparation[selectedRole]?.checklist || [];
    const checks = preparationChecks[selectedRole] || {};
    const checklistCompleted = checklist.length > 0 && checklist.every((_, index) => checks[index]);
    const foundationCompleted = selectedRole !== 'barServer'
      || getCompletedFoundationDays(foundationProgress) === barServerFoundationDays.length;
    return checklistCompleted && foundationCompleted;
  };

  // 处理任务完成
  const handleTaskComplete = async () => {
    const selectedChecks = rolePreparation[selectedRole]?.checklist || [];
    const checks = preparationChecks[selectedRole] || {};
    const completedResources = trainingCourses[selectedRole]?.courses
      .filter(course => completedCourses[course.id])
      .map(course => ({
        id: course.id,
        name: course.nameZh,
        platform: course.platform,
      })) || [];
    const persistedLearningRecords = selectedRole === 'barServer'
      ? { ...learningRecords, barServerFoundation: foundationProgress }
      : learningRecords;
    const taskResult = {
      taskId: 5,
      completedAt: new Date().toISOString(),
      selectedRole,
      roleTitle: trainingCourses[selectedRole]?.title || '',
      preparationChecklist: selectedChecks.map((item, index) => ({
        item,
          completed: Boolean(checks[index]),
        })),
      completedResources,
      learningRecords: persistedLearningRecords,
      foundationProgress: selectedRole === 'barServer' ? foundationProgress : {},
      foundationCompletedDays: selectedRole === 'barServer' ? getCompletedFoundationDays(foundationProgress) : 0,
      completedCourseDetails,
    };
    localStorage.setItem('task5_result', JSON.stringify(taskResult));

    // 标记任务5为已完成
    const progressKey = 'boarding_progress';
    const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
    progress.task5 = {
      completed: true,
      completedAt: new Date().toISOString()
    };
    localStorage.setItem(progressKey, JSON.stringify(progress));

    try {
      await upsertMyJobPreparation(taskResult);
    } catch (error) {
      console.error('同步岗位准备资料失败:', error);
    }

    await syncLocalPathProfile({
      career_stage: 'resume_preparation',
      application_stage: 'job_knowledge',
      last_completed_task_id: 5,
    });

    // 任务5学知识，任务6把知识和经历组织成可练的回答。
    navigate('/tasks/phase2/Task6?source=task5&justCompleted=5');
  };

  // 监听页面可见性变化 - 用 ref 避免每秒重建
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && activeTimerRef.current) {
        setShowLearningEndModal(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []); // 空依赖，只注册一次

  const roles = Object.entries(trainingCourses);
  const currentRole = selectedRole ? trainingCourses[selectedRole] : null;
  const currentPreparation = selectedRole ? rolePreparation[selectedRole] : null;
  const task6Completed = Boolean(
    readJson('task6_result', {})?.completedAt
    || readJson('boarding_progress', {})?.task6?.completed
  );

  const getCompletedCount = (roleKey) => {
    return trainingCourses[roleKey].courses.filter(c => completedCourses[c.id]).length;
  };

  const getPreparationCount = (roleKey) => {
    const checklist = rolePreparation[roleKey]?.checklist || [];
    const checks = preparationChecks[roleKey] || {};
    return checklist.filter((_, index) => checks[index]).length;
  };

  const togglePreparationCheck = (index) => {
    setPreparationChecks(prev => ({
      ...prev,
      [selectedRole]: {
        ...(prev[selectedRole] || {}),
        [index]: !prev[selectedRole]?.[index]
      }
    }));
  };

  const getProgress = (roleKey) => {
    const courses = trainingCourses[roleKey].courses;
    const completed = courses.filter(c => completedCourses[c.id]).length;
    return Math.round((completed / courses.length) * 100);
  };

  // ====== 岗位选择页 ======
  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center">
            <button onClick={() => navigate('/tasks')} className="text-gray-500 mr-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-950">岗位知识准备</h1>
              <p className="text-sm text-slate-500">任务列表 {'>'} 岗位知识准备</p>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-5 pt-5">
          <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-950">先判断岗位，再完成基础知识训练</p>
            <p className="mt-1 text-sm leading-6 text-blue-900">
              岗位一页纸负责讲清方向；内部基础课负责具体知识；站外英文课程只作为听力和知识补充。
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/programs/bar-server')}
            className="mb-5 flex w-full items-center justify-between rounded-xl border border-blue-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300"
          >
            <div>
              <p className="text-xs font-medium text-blue-700">首个岗位训练闭环</p>
              <p className="mt-1 font-semibold text-slate-950">Bar Server 免费场景语音训练</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">免费完成 3 个真实场景，每题都有岗位知识反馈、参考回答和重练对比。</p>
            </div>
            <ChevronRight size={19} className="shrink-0 text-blue-700" />
          </button>

          <div className="space-y-3">
            {roles.map(([key, role]) => {
              const progress = getProgress(key);
              const completed = getCompletedCount(key);
              const preparation = rolePreparation[key];
              const prepCount = getPreparationCount(key);
              const prepTotal = preparation?.checklist.length || 0;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedRole(key)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{role.icon}</span>
                      <div>
                        <h3 className="font-bold text-slate-950">{role.title}</h3>
                        <p className="text-xs text-slate-500">
                          {key === 'barServer'
                            ? `7 天内部课 ${getCompletedFoundationDays(foundationProgress)}/7 · ${role.courses.length} 个英文资源`
                            : `${role.courses.length} 个英文资源 · 准备清单 ${prepCount}/${prepTotal}`}
                        </p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-sm leading-6 text-slate-600 mb-3">{preparation?.suitableFor || role.description}</p>
                  <div className="mb-3 grid grid-cols-1 gap-2">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">面试重点</p>
                      <p className="mt-1 text-sm text-slate-800">{preparation?.interviewFocus.slice(0, 3).join(' / ')}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">推荐下一步</p>
                      <p className="mt-1 text-sm text-slate-800">{preparation?.nextStep}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>英文资源完成</span>
                      <span>{completed}/{role.courses.length}</span>
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

  // ====== 岗位准备页 ======
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center">
            <button onClick={() => setSelectedRole(null)} className="text-gray-500 mr-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-950">{currentRole.icon} {currentRole.title}</h1>
              <p className="text-sm text-slate-500">准备清单 {getPreparationCount(selectedRole)}/{currentPreparation.checklist.length}</p>
            </div>
          </div>
        </div>

      <div className="max-w-lg mx-auto px-5 pt-5">
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-blue-700">岗位一页纸</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">{currentRole.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{currentRole.description}</p>

          <div className="mt-4 space-y-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-500">每天主要做什么</p>
              <p className="mt-1 text-sm leading-6 text-slate-800">{currentPreparation.onePage.duties}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-500">典型服务场景</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {currentPreparation.onePage.scenarios.map(item => (
                  <span key={item} className="rounded-full bg-white px-2.5 py-1 text-xs text-slate-700 ring-1 ring-slate-200">{item}</span>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 p-3">
              <p className="text-xs font-medium text-amber-700">常见短板</p>
              <p className="mt-1 text-sm leading-6 text-amber-950">{currentPreparation.onePage.weakness}</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-3">
              <p className="text-xs font-medium text-blue-700">准备优先级</p>
              <p className="mt-1 text-sm leading-6 text-blue-950">{currentPreparation.onePage.priority}</p>
            </div>
          </div>
        </div>

        {selectedRole === 'barServer' && (
          <BarServerFoundationTraining
            progress={foundationProgress}
            onProgressChange={setFoundationProgress}
            task6Completed={task6Completed}
            onStartTask6={() => navigate('/tasks/phase2/Task6?source=task5')}
            onStartTask7={() => navigate('/tasks/phase2/Task7/voice?mode=knowledge&position=bar_server&source=task5')}
          />
        )}

        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-950">岗位准备清单</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">完成这些判断和输出，就说明你不是在盲学课程，而是在准备这个岗位。</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
              isPreparationCompleted() ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {getPreparationCount(selectedRole)}/{currentPreparation.checklist.length}
            </span>
          </div>

          <div className="space-y-2">
            {currentPreparation.checklist.map((item, index) => {
              const checked = preparationChecks[selectedRole]?.[index];
              return (
                <button
                  type="button"
                  key={item}
                  onClick={() => togglePreparationCheck(index)}
                  className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition ${
                    checked ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white hover:border-blue-200'
                  }`}
                >
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    checked ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 text-transparent'
                  }`}>
                    <CheckCircle2 size={14} />
                  </span>
                  <span className={`text-sm leading-6 ${checked ? 'text-emerald-900' : 'text-slate-700'}`}>{item}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleTaskComplete}
            disabled={!isPreparationCompleted()}
            className="mt-4 w-full rounded-lg bg-blue-600 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isPreparationCompleted()
              ? '完成岗位知识准备，进入 Task6'
              : selectedRole === 'barServer' && getCompletedFoundationDays(foundationProgress) < barServerFoundationDays.length
                ? `完成 7 天基础训练与清单后进入 Task6（${getCompletedFoundationDays(foundationProgress)}/7）`
                : '完成清单后进入 Task6'}
          </button>
        </div>

        {isPreparationCompleted() && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} className="text-green-600" />
              <div>
                <h3 className="text-sm font-bold text-green-800">岗位准备清单已完成</h3>
                <p className="text-xs text-green-700 mt-1">外部英文资源可以继续作为补充，不再阻塞进入 Task6。</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-3">
          <h2 className="font-bold text-slate-950">英文资源包</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            这些是岗位知识巩固和听力输入材料。建议先看推荐资源，每学完一个表达，回到 Task6 写进自己的面试答案。
          </p>
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
                    <div
                  className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300'
                  }`}
                >
                  {isCompleted && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
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
          <Motion.div
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
          </Motion.div>
        )}
      </AnimatePresence>

      {/* 学习结束弹窗 */}
      <AnimatePresence>
        {showLearningEndModal && activeTimer && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <Motion.div
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
                学习时长：{formatTime(activeTimer.elapsedTime)}
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
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* 完成凭证弹窗 */}
      <AnimatePresence>
        {showCompletionModal && currentCourseForCompletion && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50"
          >
            <Motion.div
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
                      <p className="text-amber-600 text-xs mb-3">
                        上传文件只是为了解锁任务，请打码重要信息（姓名、证件编号）后上传
                      </p>
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
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
