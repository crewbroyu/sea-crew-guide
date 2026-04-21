// src/pages/tasks/phase2/Task6InterviewSkills.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, Clock, BookOpen, Star, ChevronDown, ChevronUp, AlertCircle, Play, Pause } from 'lucide-react';

// 封装 localStorage 工具函数
const STORAGE_KEY = 'task6_data';

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

// 模块配置
const modules = [
  {
    id: 1,
    title: '邮轮面试基本规则',
    description: '了解邮轮面试的核心考察点和评分标准',
    duration: '2分钟',
    minDuration: 120000, // 2分钟（毫秒）
  },
  {
    id: 2,
    title: 'STAR 回答结构训练',
    description: '学习并练习使用 STAR 方法回答问题',
    duration: '5分钟',
    minDuration: 300000, // 5分钟（毫秒）
  },
  {
    id: 3,
    title: '高频错误回答示范',
    description: '避免常见的面试回答陷阱',
    duration: '3分钟',
    minDuration: 180000, // 3分钟（毫秒）
  },
  {
    id: 4,
    title: '视频示范教学',
    description: '学习标准面试回答脚本',
    duration: '3分钟',
    minDuration: 180000, // 3分钟（毫秒）
  },
  {
    id: 5,
    title: '模拟面试练习',
    description: '进行完整的模拟面试',
    duration: '无限制',
    minDuration: 0, // 无时长限制
  },
];

// 模块1内容
const module1Content = [
  {
    id: 1,
    title: '邮轮公司最看重什么',
    content: '邮轮面试不是英语考试。面试官真正考察的是三件事：你能不能用英语正常沟通（不需要完美）、你有没有发自内心的服务意识、你是否足够稳定和可靠能完成6-9个月的合同。很多英语一般但服务意识强的候选人通过了面试，而英语流利但态度傲慢的候选人被淘汰了。',
  },
  {
    id: 2,
    title: '面试官的真实筛选标准',
    content: '面试官通常在前30秒就形成了第一印象。他们观察的是：你的微笑是否自然、你的眼神是否有交流感、你回答问题时是否镇定。技术问题可以培训，但性格和态度很难改变，所以面试官更看重你是什么样的人，而不是你知道多少知识。',
  },
  {
    id: 3,
    title: '为什么英语不完美也能通过',
    content: '邮轮上的工作语言是英语，但你的同事来自全球50多个国家，大家都不是 native speaker。面试官不会因为你的语法有小错误就淘汰你，他们更看重你能不能听懂问题并给出有逻辑的回答。所以不要害怕犯语法错误，专注于表达清楚你的意思。',
  },
];

// 模块2内容
const module2Content = {
  starExamples: [
    {
      step: 'S',
      title: 'Situation / 场景',
      color: 'blue',
      content: '午餐高峰期，一位客人已经等了30分钟还没上菜，开始发脾气',
    },
    {
      step: 'T',
      title: 'Task / 任务',
      color: 'green',
      content: '我是当班服务员，需要安抚客人并尽快解决问题',
    },
    {
      step: 'A',
      title: 'Action / 行动',
      color: 'orange',
      content: '我先真诚道歉，然后立刻去厨房确认订单状态，发现订单被遗漏了，我请厨房优先处理并为客人送上一份免费饮品表示歉意',
    },
    {
      step: 'R',
      title: 'Result / 结果',
      color: 'purple',
      content: '客人的菜在5分钟内上桌，离开时对我说 thank you，还在评价卡上给了好评',
    },
  ],
  practiceScenarios: [
    {
      id: 1,
      scenario: '一位顾客想买的商品缺货了，他很不高兴',
      placeholder: {
        S: '描述一下当时的情况...',
        T: '你的职责是什么...',
        A: '你具体做了什么...',
        R: '最终结果如何...',
      },
      answer: {
        S: '一位顾客来到我们的商店，想要购买一款特定的商品，但这款商品已经缺货了',
        T: '作为销售顾问，我需要帮助顾客解决这个问题，同时保持良好的顾客体验',
        A: '首先，我向顾客道歉并确认他想要的具体商品。然后，我查询了系统，发现这款商品需要3天才能补货。我向顾客说明了情况，并提供了两种解决方案：一是为他预订，到货后通知他；二是推荐了一款类似的替代产品，详细介绍了其功能和优势。',
        R: '顾客选择了预订，并对我的服务表示满意。他留下了联系方式，3天后我通知他到货时，他很高兴地前来购买，并表示会向朋友推荐我们的商店。',
      },
    },
    {
      id: 2,
      scenario: '你的同事今天请假了，你需要一个人负责两个人的工作量',
      placeholder: {
        S: '描述一下当时的情况...',
        T: '你的职责是什么...',
        A: '你具体做了什么...',
        R: '最终结果如何...',
      },
      answer: {
        S: '我的同事因为突发疾病请假，当天的工作任务突然增加了一倍，而我需要一个人完成两个人的工作量',
        T: '作为团队成员，我需要确保所有工作都能按时完成，同时保持工作质量',
        A: '首先，我列出了当天的所有任务，并按优先级排序。然后，我合理安排时间，先处理紧急和重要的任务。在工作过程中，我保持专注，避免不必要的干扰。当遇到困难时，我及时向主管沟通，寻求必要的支持。',
        R: '虽然工作强度很大，但我成功完成了所有任务，并且没有出现任何错误。主管对我的表现表示认可，同事回来后也对我的帮助表示感谢。',
      },
    },
    {
      id: 3,
      scenario: '一位外国客人问路，但他说的语言你听不太懂',
      placeholder: {
        S: '描述一下当时的情况...',
        T: '你的职责是什么...',
        A: '你具体做了什么...',
        R: '最终结果如何...',
      },
      answer: {
        S: '一位外国客人来到我们酒店前台，看起来很着急，用一种我不太熟悉的语言向我问路',
        T: '作为前台接待员，我需要帮助客人找到他想去的地方，尽管存在语言障碍',
        A: '首先，我保持微笑，用手势表示我理解他需要帮助。然后，我尝试使用简单的英语与他沟通，并拿出酒店附近的地图。我还使用翻译应用程序来理解他的需求。最终，我确认他想去附近的博物馆，并为他提供了详细的路线指引。',
        R: '客人理解了我的指引，对我的帮助表示感谢，并顺利找到了博物馆。后来他回到酒店时，还特意来前台告诉我他找到了地方，对我的服务表示满意。',
      },
    },
  ],
};

// 模块3内容
const module3Content = [
  {
    id: 1,
    question: 'Why do you want to work on a cruise ship?',
    wrongAnswer: 'Because I like traveling and I want to see the world for free.',
    wrongExplanation: '面试官会觉得你只是想免费旅游，不是真心想工作',
    correctAnswer: 'I have experience in hospitality and I enjoy serving international guests. I believe working on a cruise ship will allow me to grow professionally while providing excellent service.',
    correctExplanation: '体现了服务意识和职业发展意愿',
  },
  {
    id: 2,
    question: 'Tell me about yourself',
    wrongAnswer: 'My name is... I am 25 years old... I graduated from... I like music and movies...',
    wrongExplanation: '像在念简历，没有重点，面试官听了会走神',
    correctAnswer: 'I\'m a hospitality professional with 3 years of restaurant experience. I\'m passionate about guest service and I\'m known for staying calm under pressure. I\'m excited to bring my skills to a cruise environment.',
    correctExplanation: '30秒内突出了经验、特质和意愿',
  },
  {
    id: 3,
    question: 'What is your weakness?',
    wrongAnswer: 'I don\'t have any weaknesses. 或 I\'m a perfectionist.',
    wrongExplanation: '第一种不真实，第二种是被用烂的套话，面试官听过几千次了',
    correctAnswer: 'Sometimes I focus too much on details, which can slow me down. I\'ve been working on this by setting time limits for tasks and prioritizing what matters most.',
    correctExplanation: '承认真实弱点 + 展示你在改进',
  },
  {
    id: 4,
    question: 'How do you handle difficult customers?',
    wrongAnswer: 'I just try to be nice to them.',
    wrongExplanation: '太空洞，面试官无法判断你的实际能力',
    correctAnswer: 'I always listen to the guest first without interrupting. Then I apologize for the inconvenience and offer a solution. For example, in my last job, a guest complained about a wrong order, I apologized, replaced it immediately, and offered a complimentary drink. The guest left happy.',
    correctExplanation: '用了 STAR 结构，有具体例子',
  },
  {
    id: 5,
    question: 'Where do you see yourself in 5 years?',
    wrongAnswer: 'I want to open my own business.',
    wrongExplanation: '面试官会觉得你干几个月就跑了',
    correctAnswer: 'I see myself growing within the cruise industry. I\'d like to start in this position, gain experience, and eventually move into a supervisory role onboard.',
    correctExplanation: '表达了在行业内长期发展的意愿',
  },
];

// 模块4内容
const module4Content = [
  {
    id: 1,
    title: '自我介绍 Self Introduction 示范',
    script: 'Good morning, my name is [Name]. I\'m from [City], China. I have [X] years of experience in the hospitality industry, working as a [position] at [place]. During my time there, I developed strong skills in guest service, teamwork, and problem-solving. I\'m passionate about creating positive experiences for guests from different cultural backgrounds. I\'m a quick learner, I stay calm under pressure, and I genuinely enjoy helping people. I\'m very excited about the opportunity to work on a cruise ship because I believe it\'s the perfect environment to combine my professional skills with my love for meeting people from around the world. Thank you.',
    explanation: [
      'Good morning, my name is [Name].',
      '早上好，我的名字是 [姓名]。',
      'I\'m from [City], China.',
      '我来自中国 [城市]。',
      'I have [X] years of experience in the hospitality industry, working as a [position] at [place].',
      '我在 hospitality 行业有 [X] 年经验，曾在 [地点] 担任 [职位]。',
      'During my time there, I developed strong skills in guest service, teamwork, and problem-solving.',
      '在那里工作期间，我培养了良好的客户服务、团队合作和解决问题的能力。',
      'I\'m passionate about creating positive experiences for guests from different cultural backgrounds.',
      '我热衷于为来自不同文化背景的客人创造积极的体验。',
      'I\'m a quick learner, I stay calm under pressure, and I genuinely enjoy helping people.',
      '我学习能力强，在压力下保持冷静，并且真诚地喜欢帮助别人。',
      'I\'m very excited about the opportunity to work on a cruise ship because I believe it\'s the perfect environment to combine my professional skills with my love for meeting people from around the world.',
      '我对在邮轮上工作的机会感到非常兴奋，因为我相信这是一个完美的环境，可以将我的专业技能与我喜欢结识来自世界各地的人的爱好结合起来。',
      'Thank you.',
      '谢谢。',
    ],
    readingTime: '约45秒',
  },
  {
    id: 2,
    title: 'Why cruise ship? 示范',
    script: 'I\'ve always been passionate about hospitality and travel. Working on a cruise ship allows me to combine these two interests while providing excellent service to guests from all over the world. I\'m excited about the opportunity to work in a multicultural environment, learn from colleagues from different backgrounds, and grow both personally and professionally. I believe the cruise industry offers unique opportunities for career advancement, and I\'m eager to be part of a team that creates memorable experiences for guests every day.',
    explanation: [
      'I\'ve always been passionate about hospitality and travel.',
      '我一直对 hospitality 和旅行充满热情。',
      'Working on a cruise ship allows me to combine these two interests while providing excellent service to guests from all over the world.',
      '在邮轮上工作让我能够结合这两个兴趣，同时为来自世界各地的客人提供优质服务。',
      'I\'m excited about the opportunity to work in a multicultural environment, learn from colleagues from different backgrounds, and grow both personally and professionally.',
      '我对在多元文化环境中工作、向来自不同背景的同事学习以及在个人和专业方面成长的机会感到兴奋。',
      'I believe the cruise industry offers unique opportunities for career advancement, and I\'m eager to be part of a team that creates memorable experiences for guests every day.',
      '我相信邮轮行业提供了独特的职业发展机会，我渴望成为一个每天为客人创造难忘体验的团队的一员。',
    ],
    readingTime: '约30秒',
  },
  {
    id: 3,
    title: 'Why this position? 示范',
    script: 'I\'m applying for this position because it aligns perfectly with my skills and experience. I have [X] years of experience in [relevant field], where I developed strong [specific skill] skills. I\'m particularly drawn to this role because it allows me to use my [specific skill] to make a positive impact on guests\' experiences. I\'ve researched your company and I\'m impressed by your commitment to excellence and your focus on employee development. I believe I can contribute to your team\'s success and I\'m excited about the opportunity to grow with your company.',
    explanation: [
      'I\'m applying for this position because it aligns perfectly with my skills and experience.',
      '我申请这个职位是因为它与我的技能和经验完全匹配。',
      'I have [X] years of experience in [relevant field], where I developed strong [specific skill] skills.',
      '我在 [相关领域] 有 [X] 年经验，在那里我培养了强大的 [特定技能] 技能。',
      'I\'m particularly drawn to this role because it allows me to use my [specific skill] to make a positive impact on guests\' experiences.',
      '我特别被这个角色吸引，因为它让我能够使用我的 [特定技能] 对客人的体验产生积极影响。',
      'I\'ve researched your company and I\'m impressed by your commitment to excellence and your focus on employee development.',
      '我研究了贵公司，对你们对卓越的承诺和对员工发展的关注印象深刻。',
      'I believe I can contribute to your team\'s success and I\'m excited about the opportunity to grow with your company.',
      '我相信我可以为团队的成功做出贡献，并且对与贵公司一起成长的机会感到兴奋。',
    ],
    readingTime: '约35秒',
  },
  {
    id: 4,
    title: 'Difficult customer handling 示范',
    script: 'I once had a guest who was very upset because his room wasn\'t ready when he arrived. He had traveled a long distance and was tired and frustrated. I listened to his concerns without interrupting, apologized sincerely for the inconvenience, and explained that we were experiencing a high volume of check-ins that day. I then offered him a complimentary drink at our lobby bar while we prepared his room, and I personally ensured it was ready within 15 minutes. The guest appreciated my attention to his needs and left a positive review at the end of his stay.',
    explanation: [
      'I once had a guest who was very upset because his room wasn\'t ready when he arrived. He had traveled a long distance and was tired and frustrated.',
      '我曾经有一位客人，因为到达时房间还没准备好而非常不高兴。他长途旅行，又累又沮丧。',
      'I listened to his concerns without interrupting, apologized sincerely for the inconvenience, and explained that we were experiencing a high volume of check-ins that day.',
      '我不打断他，倾听他的 concerns，真诚地为不便道歉，并解释说我们当天办理入住的客人很多。',
      'I then offered him a complimentary drink at our lobby bar while we prepared his room, and I personally ensured it was ready within 15 minutes.',
      '然后，我在我们准备他的房间时，邀请他在大堂酒吧免费喝一杯，并亲自确保房间在15分钟内准备就绪。',
      'The guest appreciated my attention to his needs and left a positive review at the end of his stay.',
      '客人 appreciate 我对他需求的关注，并在入住结束时留下了积极的评价。',
    ],
    readingTime: '约40秒',
  },
];

// 模块5内容 - 包含10个面试问题和正确答案
const module5Content = {
  questions: [
    {
      id: 1,
      question: 'Why do you want to work on a cruise ship?',
      options: [
        'Because I like traveling and want to see the world for free.',
        'I have experience in hospitality and enjoy serving international guests. I believe working on a cruise ship will allow me to grow professionally while providing excellent service.',
        'I heard the salary is good and the benefits are great.',
        'I don\'t like working in a fixed location and want to change my environment.'
      ],
      correctAnswer: 1,
      explanation: '这个回答体现了服务意识和职业发展意愿，是面试官最希望听到的。'
    },
    {
      id: 2,
      question: 'Tell me about yourself.',
      options: [
        'My name is... I am 25 years old... I graduated from... I like music and movies...',
        'I\'m a hospitality professional with 3 years of restaurant experience. I\'m passionate about guest service and I\'m known for staying calm under pressure. I\'m excited to bring my skills to a cruise environment.',
        'I\'m a hard worker and I\'m willing to do whatever it takes to get the job done.',
        'I\'m looking for a job that pays well and allows me to travel.'
      ],
      correctAnswer: 1,
      explanation: '30秒内突出了经验、特质和意愿，是一个简洁有力的自我介绍。'
    },
    {
      id: 3,
      question: 'What is your weakness?',
      options: [
        'I don\'t have any weaknesses.',
        'I\'m a perfectionist.',
        'Sometimes I focus too much on details, which can slow me down. I\'ve been working on this by setting time limits for tasks and prioritizing what matters most.',
        'I get nervous when speaking in public, but I\'m taking classes to improve.'
      ],
      correctAnswer: 2,
      explanation: '承认真实弱点并展示你在改进，这是面试官最欣赏的回答方式。'
    },
    {
      id: 4,
      question: 'How do you handle difficult customers?',
      options: [
        'I just try to be nice to them.',
        'I listen to their concerns without interrupting, apologize for the inconvenience, and offer a solution. For example, in my last job, a guest complained about a wrong order, I apologized, replaced it immediately, and offered a complimentary drink. The guest left happy.',
        'I explain the company policy to them and try to get them to understand our position.',
        'I ask my manager to handle it.'
      ],
      correctAnswer: 1,
      explanation: '使用了STAR结构，有具体例子，展示了你的问题解决能力。'
    },
    {
      id: 5,
      question: 'Where do you see yourself in 5 years?',
      options: [
        'I want to open my own business.',
        'I see myself growing within the cruise industry. I\'d like to start in this position, gain experience, and eventually move into a supervisory role onboard.',
        'I hope to be making more money and have a better job.',
        'I haven\'t really thought about it.'
      ],
      correctAnswer: 1,
      explanation: '表达了在行业内长期发展的意愿，这让面试官相信你会稳定工作。'
    },
    {
      id: 6,
      question: 'What experience do you have in hospitality?',
      options: [
        'I worked in a restaurant for 2 years.',
        'I have 3 years of experience as a server at a high-end restaurant where I consistently received positive feedback from guests. I\'m skilled at handling busy shifts and resolving customer issues.',
        'I\'ve never worked in hospitality, but I\'m a quick learner.',
        'I worked in retail before, so I know how to deal with customers.'
      ],
      correctAnswer: 1,
      explanation: '提供了具体的经验和成就，展示了你的专业能力。'
    },
    {
      id: 7,
      question: 'How do you handle working long hours?',
      options: [
        'I don\'t mind working long hours as long as I get paid overtime.',
        'I understand that working on a cruise ship requires long hours and I\'m prepared for that. I stay organized and manage my time effectively to handle the workload.',
        'I prefer to work regular hours, but I\'ll do what\'s needed.',
        'I can work long hours for a short period, but not for months at a time.'
      ],
      correctAnswer: 1,
      explanation: '展示了对邮轮工作性质的理解和应对能力。'
    },
    {
      id: 8,
      question: 'Why should we hire you?',
      options: [
        'Because I need a job.',
        'I have the skills and experience you\'re looking for. I\'m passionate about hospitality, I\'m a team player, and I\'m committed to providing excellent service to guests.',
        'I\'m a hard worker and I\'ll do whatever you ask.',
        'I think I\'d be a good fit for the company.'
      ],
      correctAnswer: 1,
      explanation: '清晰地展示了你的价值和优势，让面试官相信你是最佳人选。'
    },
    {
      id: 9,
      question: 'Do you have any questions for us?',
      options: [
        'No, I think I have all the information I need.',
        'What opportunities for career advancement are available onboard?',
        'How much vacation time do I get?',
        'When will I get paid?'
      ],
      correctAnswer: 1,
      explanation: '问关于职业发展的问题显示你对这份工作的认真态度和长期规划。'
    },
    {
      id: 10,
      question: 'How do you handle working with people from different cultures?',
      options: [
        'I just treat everyone the same.',
        'I respect cultural differences and try to learn about other cultures. I\'ve worked with people from different backgrounds before and I enjoy the diversity.',
        'I find it challenging, but I try my best.',
        'I prefer to work with people from my own culture.'
      ],
      correctAnswer: 1,
      explanation: '展示了你的文化敏感度和团队合作能力，这在邮轮工作中非常重要。'
    }
  ],
};

// 主组件
function Task6InterviewSkills() {
  const navigate = useNavigate();
  
  // 检查任务5是否已完成（注释掉，允许用户直接访问）
  // useEffect(() => {
  //   const progressKey = 'boarding_progress';
  //   const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
  //   if (!progress.task5 || !progress.task5.completed) {
  //     // 任务5未完成，重定向到任务列表
  //     navigate('/tasks');
  //   }
  // }, [navigate]);
  
  // 从 localStorage 加载初始数据
  const [progress, setProgress] = useState(() => {
    const data = loadFromLocalStorage({});
    return data.progress || { completedModules: [], learningTime: {}, starScenarios: {} };
  });
  const [currentModule, setCurrentModule] = useState(null);
  const [showLockModal, setShowLockModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [currentScenario, setCurrentScenario] = useState(null);
  const [userAnswers, setUserAnswers] = useState(() => {
    const data = loadFromLocalStorage({});
    return data.userAnswers || {};
  });
  const [phrases, setPhrases] = useState(() => {
    const data = loadFromLocalStorage({});
    return data.phrases || [];
  });
  
  // 学习时间相关
  const [timeSpent, setTimeSpent] = useState(() => {
    const data = loadFromLocalStorage({});
    return data.timeSpent || {};
  });
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  
  // 模块5相关状态
  const [module5CurrentQuestion, setModule5CurrentQuestion] = useState(0);
  const [module5Answers, setModule5Answers] = useState({});
  const [module5ShowFeedback, setModule5ShowFeedback] = useState(false);
  const [module5Score, setModule5Score] = useState(0);
  const [module5QuizCompleted, setModule5QuizCompleted] = useState(false);
  
  // 当数据变化时，保存到 localStorage
  useEffect(() => {
    const data = {
      progress,
      userAnswers,
      phrases,
      timeSpent
    };
    saveToLocalStorage(data);
  }, [progress, userAnswers, phrases, timeSpent]);
  
  // 计时器逻辑
  useEffect(() => {
    if (isTimerRunning && currentModule) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setTimeSpent(prev => {
          const moduleTime = prev[currentModule] || 0;
          const newTime = moduleTime + (Date.now() - startTimeRef.current);
          startTimeRef.current = Date.now();
          return {
            ...prev,
            [currentModule]: newTime
          };
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, currentModule]);
  
  // 检查模块是否已完成
  const isModuleCompleted = (moduleId) => {
    return progress.completedModules.includes(moduleId);
  };
  
  // 检查模块是否已解锁
  const isModuleUnlocked = (moduleId) => {
    if (moduleId === 1) return true;
    return isModuleCompleted(moduleId - 1);
  };
  
  // 检查模块是否为当前学习模块
  const isCurrentModule = (moduleId) => {
    const completedCount = progress.completedModules.length;
    return moduleId === completedCount + 1;
  };
  
  // 计算已完成模块数量
  const completedCount = progress.completedModules.length;
  
  // 处理模块点击
  const handleModuleClick = (module) => {
    if (!isModuleUnlocked(module.id)) {
      setSelectedModule(module);
      setShowLockModal(true);
      return;
    }
    
    // 重置模块5的状态
    if (module.id === 5) {
      setModule5CurrentQuestion(0);
      setModule5Answers({});
      setModule5ShowFeedback(false);
      setModule5Score(0);
      setModule5QuizCompleted(false);
    }
    
    setCurrentModule(module.id);
    setIsTimerRunning(true);
  };
  
  // 处理完成模块
  const handleCompleteModule = (moduleId) => {
    setProgress(prev => {
      if (!prev.completedModules.includes(moduleId)) {
        const newCompletedModules = [...prev.completedModules, moduleId].sort((a, b) => a - b);
        
        // 当完成模块5时，标记 Task6 为已完成
        if (moduleId === 5 && newCompletedModules.length === 5) {
          // 标记任务6为已完成
          const progressKey = 'boarding_progress';
          const boardingProgress = JSON.parse(localStorage.getItem(progressKey) || '{}');
          boardingProgress.task6 = {
            completed: true,
            completedAt: new Date().toISOString()
          };
          localStorage.setItem(progressKey, JSON.stringify(boardingProgress));
        }
        
        return {
          ...prev,
          completedModules: newCompletedModules
        };
      }
      return prev;
    });
    setCurrentModule(null);
    setIsTimerRunning(false);
  };
  
  // 处理收藏短语
  const handleCollectPhrase = (phrase) => {
    setPhrases(prev => {
      if (!prev.includes(phrase)) {
        return [...prev, phrase];
      }
      return prev;
    });
  };
  
  // 处理场景回答
  const handleScenarioAnswer = (scenarioId, step, value) => {
    setUserAnswers(prev => {
      const scenario = prev[scenarioId] || {};
      return {
        ...prev,
        [scenarioId]: {
          ...scenario,
          [step]: value
        }
      };
    });
  };
  
  // 检查场景是否已完成
  const isScenarioCompleted = (scenarioId) => {
    const answer = userAnswers[scenarioId];
    if (!answer) return false;
    return Object.values(answer).every(value => value && value.trim() !== '');
  };
  
  // 检查模块2是否已完成
  const isModule2Completed = () => {
    return module2Content.practiceScenarios.every(scenario => isScenarioCompleted(scenario.id));
  };
  
  // 渲染模块1
  const renderModule1 = () => {
    return (
      <div className="space-y-4">
        {module1Content.map((card) => (
          <div key={card.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
              <BookOpen size={20} className="text-blue-600" />
              {card.title}
            </h3>
            <p className="text-gray-600 mb-3">{card.content}</p>
            <button
              onClick={() => handleCollectPhrase(card.content)}
              className="text-amber-500 hover:text-amber-600 flex items-center gap-1 text-sm"
            >
              <Star size={16} />
              收藏关键短语
            </button>
          </div>
        ))}
        <div className="mt-8">
          <button
            onClick={() => handleCompleteModule(1)}
            disabled={(timeSpent[1] || 0) < modules[0].minDuration}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${(timeSpent[1] || 0) < modules[0].minDuration ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            完成本模块
          </button>
          {(timeSpent[1] || 0) < modules[0].minDuration && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              请认真学习，还需 {Math.ceil((modules[0].minDuration - (timeSpent[1] || 0)) / 60000)} 分钟
            </p>
          )}
        </div>
      </div>
    );
  };
  
  // 渲染模块2
  const renderModule2 = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-gray-800">Part A: STAR 方法教学</h3>
        <div className="grid grid-cols-1 gap-4">
          {module2Content.starExamples.map((item) => {
            let bgColor = '';
            let borderColor = '';
            
            switch (item.color) {
              case 'blue':
                bgColor = 'bg-blue-50';
                borderColor = 'border-blue-200';
                break;
              case 'green':
                bgColor = 'bg-green-50';
                borderColor = 'border-green-200';
                break;
              case 'orange':
                bgColor = 'bg-orange-50';
                borderColor = 'border-orange-200';
                break;
              case 'purple':
                bgColor = 'bg-purple-50';
                borderColor = 'border-purple-200';
                break;
              default:
                bgColor = 'bg-gray-50';
                borderColor = 'border-gray-200';
            }
            
            return (
              <div key={item.step} className={`rounded-xl p-4 ${bgColor} border ${borderColor}`}>
                <h4 className="text-md font-bold text-gray-800 mb-2">{item.step} - {item.title}</h4>
                <p className="text-gray-600">{item.content}</p>
                <button
                  onClick={() => handleCollectPhrase(item.content)}
                  className="text-amber-500 hover:text-amber-600 flex items-center gap-1 text-sm mt-2"
                >
                  <Star size={16} />
                  收藏关键短语
                </button>
              </div>
            );
          })}
        </div>
        
        <h3 className="text-lg font-bold text-gray-800 mt-8">Part B: STAR 互动填写器</h3>
        <div className="space-y-6">
          {module2Content.practiceScenarios.map((scenario) => (
            <div key={scenario.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h4 className="text-md font-bold text-gray-800 mb-3">场景 {scenario.id}</h4>
              <p className="text-gray-600 mb-4">{scenario.scenario}</p>
              
              <div className="space-y-3">
                {Object.entries(scenario.placeholder).map(([step, placeholder]) => {
                  const answer = userAnswers[scenario.id]?.[step] || '';
                  return (
                    <div key={step}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{step}</label>
                      <textarea
                        value={answer}
                        onChange={(e) => handleScenarioAnswer(scenario.id, step, e.target.value)}
                        placeholder={placeholder}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                        rows={2}
                      />
                    </div>
                  );
                })}
              </div>
              
              <button
                onClick={() => {
                  setCurrentScenario(scenario);
                  setShowAnswerModal(true);
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                查看参考答案
              </button>
            </div>
          ))}
        </div>
        
        <div className="mt-8">
          <button
            onClick={() => handleCompleteModule(2)}
            disabled={(timeSpent[2] || 0) < modules[1].minDuration || !isModule2Completed()}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${(timeSpent[2] || 0) < modules[1].minDuration || !isModule2Completed() ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            完成本模块
          </button>
          {(timeSpent[2] || 0) < modules[1].minDuration && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              请认真学习，还需 {Math.ceil((modules[1].minDuration - (timeSpent[2] || 0)) / 60000)} 分钟
            </p>
          )}
          {timeSpent[2] >= modules[1].minDuration && !isModule2Completed() && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              请完成所有场景练习
            </p>
          )}
        </div>
      </div>
    );
  };
  
  // 渲染模块3
  const renderModule3 = () => {
    return (
      <div className="space-y-6">
        {module3Content.map((item) => (
          <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-md font-bold text-gray-800 mb-3">问题 {item.id}：{item.question}</h3>
            
            <div className="mb-4">
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg mb-3">
                <h4 className="text-sm font-medium text-red-800 mb-1">❌ 错误回答</h4>
                <p className="text-sm text-red-700 mb-2">{item.wrongAnswer}</p>
                <p className="text-xs text-red-600">{item.wrongExplanation}</p>
              </div>
              
              <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded-r-lg">
                <h4 className="text-sm font-medium text-green-800 mb-1">✅ 正确回答</h4>
                <p className="text-sm text-green-700 mb-2">{item.correctAnswer}</p>
                <p className="text-xs text-green-600">{item.correctExplanation}</p>
                <button
                  onClick={() => handleCollectPhrase(item.correctAnswer)}
                  className="text-amber-500 hover:text-amber-600 flex items-center gap-1 text-sm mt-2"
                >
                  <Star size={16} />
                  收藏关键短语
                </button>
              </div>
            </div>
          </div>
        ))}
        
        <div className="mt-8">
          <button
            onClick={() => handleCompleteModule(3)}
            disabled={(timeSpent[3] || 0) < modules[2].minDuration}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${(timeSpent[3] || 0) < modules[2].minDuration ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            完成本模块
          </button>
          {(timeSpent[3] || 0) < modules[2].minDuration && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              请认真学习，还需 {Math.ceil((modules[2].minDuration - (timeSpent[3] || 0)) / 60000)} 分钟
            </p>
          )}
        </div>
      </div>
    );
  };
  
  // 渲染模块4
  const renderModule4 = () => {
    const toggleCard = (id) => {
      setExpandedCards(prev => ({
        ...prev,
        [id]: !prev[id]
      }));
    };
    
    return (
      <div className="space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
          <p className="text-sm text-amber-800">
            🎬 视频版正在制作中，以下为完整文字版教学脚本，学习效果等同
          </p>
        </div>
        
        {module4Content.map((script) => (
          <div key={script.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div 
              className="p-4 cursor-pointer flex justify-between items-center"
              onClick={() => toggleCard(script.id)}
            >
              <h3 className="text-md font-bold text-gray-800">{script.title}</h3>
              {expandedCards[script.id] ? (
                <ChevronUp size={20} className="text-gray-400" />
              ) : (
                <ChevronDown size={20} className="text-gray-400" />
              )}
            </div>
            
            {expandedCards[script.id] && (
              <div className="p-4 border-t border-gray-100">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">英文示范：</h4>
                  <p className="text-gray-600 mb-4">{script.script}</p>
                  <button
                    onClick={() => handleCollectPhrase(script.script)}
                    className="text-amber-500 hover:text-amber-600 flex items-center gap-1 text-sm mb-4"
                  >
                    <Star size={16} />
                    收藏关键短语
                  </button>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">中文逐句解析：</h4>
                  <div className="space-y-2">
                    {script.explanation.map((line, index) => (
                      <p key={index} className="text-gray-600 text-sm">{line}</p>
                    ))}
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mt-4">预计朗读时间：{script.readingTime}</p>
              </div>
            )}
          </div>
        ))}
        
        <div className="mt-8">
          <button
            onClick={() => handleCompleteModule(4)}
            disabled={(timeSpent[4] || 0) < modules[3].minDuration}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${(timeSpent[4] || 0) < modules[3].minDuration ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            完成本模块
          </button>
          {(timeSpent[4] || 0) < modules[3].minDuration && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              请认真学习，还需 {Math.ceil((modules[3].minDuration - (timeSpent[4] || 0)) / 60000)} 分钟
            </p>
          )}
        </div>
      </div>
    );
  };
  
  // 模块5相关处理函数
  const handleModule5AnswerSelect = (questionId, optionIndex) => {
    const question = module5Content.questions[module5CurrentQuestion];
    setModule5Answers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
    setModule5ShowFeedback(true);
    
    // 检查是否正确
    if (optionIndex === question.correctAnswer) {
      setModule5Score(prev => prev + 1);
    }
  };
  
  const handleModule5NextQuestion = () => {
    setModule5ShowFeedback(false);
    if (module5CurrentQuestion < module5Content.questions.length - 1) {
      setModule5CurrentQuestion(prev => prev + 1);
    } else {
      setModule5QuizCompleted(true);
    }
  };
  
  const handleModule5RestartQuiz = () => {
    setModule5CurrentQuestion(0);
    setModule5Answers({});
    setModule5ShowFeedback(false);
    setModule5Score(0);
    setModule5QuizCompleted(false);
  };
  
  // 渲染模块5 - 面试问答练习
  const renderModule5 = () => {
    if (module5QuizCompleted) {
      const percentage = Math.round((module5Score / module5Content.questions.length) * 100);
      let feedback = '';
      let feedbackColor = '';
      
      if (percentage >= 80) {
        feedback = '优秀！你已经掌握了面试的核心技巧。';
        feedbackColor = 'text-green-600';
      } else if (percentage >= 60) {
        feedback = '良好！继续练习，你会做得更好。';
        feedbackColor = 'text-blue-600';
      } else {
        feedback = '需要更多练习，建议回顾前面的模块内容。';
        feedbackColor = 'text-amber-600';
      }
      
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">面试问答练习 - 结果</h3>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
            <h4 className="text-xl font-bold text-gray-900 mb-2">你的得分</h4>
            <p className="text-4xl font-bold text-blue-600 mb-4">{module5Score}/{module5Content.questions.length}</p>
            <p className="text-lg font-medium mb-4">{percentage}%</p>
            <p className={`text-lg font-medium ${feedbackColor} mb-6`}>{feedback}</p>
            
            <div className="space-y-4">
              <button
                onClick={handleModule5RestartQuiz}
                className="w-full py-3 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
              >
                重新练习
              </button>
              <button
                onClick={() => handleCompleteModule(5)}
                className="w-full py-3 rounded-lg font-medium transition-colors bg-green-600 text-white hover:bg-green-700"
              >
                完成本模块
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    const question = module5Content.questions[module5CurrentQuestion];
    const userAnswer = module5Answers[question.id];
    
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">面试问答练习</h3>
        <p className="text-gray-600 mb-6">
          请回答以下问题，这些是邮轮面试中最常见的问题。
        </p>
        
        {/* 进度指示器 */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>问题 {module5CurrentQuestion + 1}/{module5Content.questions.length}</span>
            <span>得分: {module5Score}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${((module5CurrentQuestion + 1) / module5Content.questions.length) * 100}%` }}
            />
          </div>
        </div>
        
        {/* 问题卡片 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h4 className="text-md font-bold text-gray-800 mb-4">{question.question}</h4>
          
          <div className="space-y-3">
            {question.options.map((option, index) => {
              let optionClass = 'border border-gray-300 bg-white';
              let textClass = 'text-gray-700';
              
              if (module5ShowFeedback) {
                if (index === question.correctAnswer) {
                  optionClass = 'border-green-500 bg-green-50';
                  textClass = 'text-green-700';
                } else if (index === userAnswer && index !== question.correctAnswer) {
                  optionClass = 'border-red-500 bg-red-50';
                  textClass = 'text-red-700';
                }
              } else if (index === userAnswer) {
                optionClass = 'border-blue-500 bg-blue-50';
                textClass = 'text-blue-700';
              }
              
              return (
                <div 
                  key={index}
                  onClick={() => !module5ShowFeedback && handleModule5AnswerSelect(question.id, index)}
                  className={`rounded-lg p-4 cursor-pointer transition-all ${optionClass}`}
                >
                  <p className={`${textClass}`}>{option}</p>
                </div>
              );
            })}
          </div>
          
          {/* 反馈信息 */}
          {module5ShowFeedback && (
            <div className="mt-4 p-4 rounded-lg bg-gray-50">
              <p className="text-sm text-gray-700">
                <strong>解析：</strong>{question.explanation}
              </p>
            </div>
          )}
          
          {/* 导航按钮 */}
          <div className="mt-6">
            <button
              onClick={handleModule5NextQuestion}
              disabled={!module5ShowFeedback}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${module5ShowFeedback ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
              {module5CurrentQuestion < module5Content.questions.length - 1 ? '下一题' : '查看结果'}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // 处理完成 Task6
  const handleCompleteTask6 = () => {
    // 标记任务6为已完成（使用与其他任务相同的方式）
    const progressKey = 'boarding_progress';
    const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
    progress.task6 = {
      completed: true,
      completedAt: new Date().toISOString()
    };
    localStorage.setItem(progressKey, JSON.stringify(progress));

    // 调试：打印写入后的状态
    console.log('Task6 完成状态已写入');
    console.log('当前 localStorage:', localStorage);

    // 跳转到任务列表页面，传递 justCompleted 参数
    navigate('/tasks?justCompleted=6');
  };

  // 渲染学习摘要
  const renderLearningSummary = () => {
    if (completedCount < 5) return null;
    
    return (
      <div className="mt-8 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-3">学习摘要</h3>
        <div className="space-y-3">
          <p className="text-gray-600">🎉 恭喜你完成了所有面试技巧学习模块！</p>
          <p className="text-gray-600">你已经掌握了：</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>邮轮面试的核心考察点</li>
            <li>STAR 回答结构的使用方法</li>
            <li>常见面试错误及正确回答</li>
            <li>标准面试回答脚本</li>
            <li>模拟面试练习</li>
          </ul>
          <p className="text-gray-600 mt-3">
            建议你在面试前再次复习这些内容，并进行充分的口语练习。
          </p>
          <button
            onClick={handleCompleteTask6}
            className="mt-4 w-full py-3 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
          >
            继续前往下一个任务
          </button>
        </div>
      </div>
    );
  };
  
  // 渲染模块详情
  const renderModuleDetail = () => {
    if (!currentModule) return null;
    
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center">
            <button 
              onClick={() => {
                setCurrentModule(null);
                setIsTimerRunning(false);
              }} 
              className="text-gray-500 mr-3"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{modules[currentModule - 1].title}</h1>
              <p className="text-sm text-gray-500">模块 {currentModule}/5</p>
            </div>
          </div>
        </div>
        
        <div className="max-w-lg mx-auto px-4 py-6">
          {currentModule === 1 && renderModule1()}
          {currentModule === 2 && renderModule2()}
          {currentModule === 3 && renderModule3()}
          {currentModule === 4 && renderModule4()}
          {currentModule === 5 && renderModule5()}
        </div>
        
        {/* 参考答案弹窗 */}
        {showAnswerModal && currentScenario && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-5 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-gray-900 mb-3">参考答案</h3>
              <p className="text-gray-600 mb-4">场景：{currentScenario.scenario}</p>
              
              <div className="space-y-3 mb-4">
                {Object.entries(currentScenario.answer).map(([step, answer]) => (
                  <div key={step}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{step}</label>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{answer}</p>
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => setShowAnswerModal(false)}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                我知道了
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // 渲染主页面
  const renderMainPage = () => {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 pt-12 pb-6">
          <h1 className="text-white text-lg font-bold">面试技巧学习</h1>
          <p className="text-purple-200 text-sm mt-1">掌握邮轮面试的核心技巧</p>
          
          {/* 进度条 */}
          <div className="mt-4">
            <div className="flex justify-between text-white/60 text-xs mb-1">
              <span>学习进度</span>
              <span>{completedCount}/5 模块</span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-2">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${(completedCount / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 space-y-4">
          {modules.map((module) => {
            const isCompleted = isModuleCompleted(module.id);
            const isUnlocked = isModuleUnlocked(module.id);
            const isCurrent = isCurrentModule(module.id);
            
            return (
              <div 
                key={module.id}
                onClick={() => handleModuleClick(module)}
                className={`rounded-xl p-4 transition-all cursor-pointer ${isCurrent ? 'border-2 border-blue-500 shadow-md' : 'border border-gray-100'} ${isUnlocked ? 'bg-white' : 'bg-gray-50 opacity-70'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-100 text-green-600' : isUnlocked ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                      {isCompleted ? (
                        <CheckCircle size={16} />
                      ) : isUnlocked ? (
                        <Clock size={16} />
                      ) : (
                        <Lock size={16} />
                      )}
                    </div>
                    <div>
                      <h3 className={`font-bold ${isUnlocked ? 'text-gray-800' : 'text-gray-400'}`}>模块 {module.id}：{module.title}</h3>
                      <p className={`text-xs ${isUnlocked ? 'text-gray-500' : 'text-gray-400'}`}>{module.description}</p>
                      <p className={`text-xs ${isUnlocked ? 'text-gray-400' : 'text-gray-300'}`}>预计学习时长：{module.duration}</p>
                    </div>
                  </div>
                  <svg className={`w-4 h-4 ${isUnlocked ? 'text-gray-400' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            );
          })}
          
          {renderLearningSummary()}
        </div>
        
        {/* 锁定提示弹窗 */}
        {showLockModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-5 max-w-md w-full mx-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={24} className="text-amber-500" />
                <h3 className="text-lg font-bold text-gray-900">模块未解锁</h3>
              </div>
              <p className="text-gray-600 mb-4">
                请先完成模块 {selectedModule?.id - 1}，才能开始学习模块 {selectedModule?.id}。
              </p>
              <button
                onClick={() => setShowLockModal(false)}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                我知道了
              </button>
            </div>
          </div>
        )}
        
        {/* 参考答案弹窗 */}
        {showAnswerModal && currentScenario && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-5 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-gray-900 mb-3">参考答案</h3>
              <p className="text-gray-600 mb-4">场景：{currentScenario.scenario}</p>
              
              <div className="space-y-3 mb-4">
                {Object.entries(currentScenario.answer).map(([step, answer]) => (
                  <div key={step}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{step}</label>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{answer}</p>
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => setShowAnswerModal(false)}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                我知道了
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return currentModule ? renderModuleDetail() : renderMainPage();
}

export default Task6InterviewSkills;