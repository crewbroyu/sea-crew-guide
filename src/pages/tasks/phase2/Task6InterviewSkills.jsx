// src/pages/tasks/phase2/Task6InterviewSkills.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { syncLocalPathProfile } from '../../../services/userPathService';
import { upsertMyInterviewAnswerProfile } from '../../../services/interviewAnswerService';

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

const answerCards = [
  {
    id: 'service_case',
    title: '我的服务案例',
    description: '准备一个处理客人问题的故事，面试里最常被追问。',
    status: 'available',
    focusPoints: ['先听懂客人真正不满什么', '不要只说 I was nice', '要有具体动作和结果'],
    referenceCase: '旧练习里的“商品缺货但顾客很不高兴”可以直接改成你的服务案例：先道歉确认需求，再查询库存或提供替代方案，最后让客人接受解决方案。',
    avoidAnswer: 'I just try to be nice to the customer.',
    fields: [
      { key: 'context', label: '当时发生了什么？', placeholder: '例如：客人因为等太久、商品缺货、订单错误而不满意。' },
      { key: 'guestProblem', label: '客人为什么不满意？', placeholder: '写清楚客人的情绪、需求或具体投诉点。' },
      { key: 'actions', label: '你具体做了哪几个动作？', placeholder: '写 2-3 个动作，例如先道歉、确认问题、找主管、提供替代方案。' },
      { key: 'result', label: '最后结果有没有变好？', placeholder: '例如客人接受了解决方案、情绪缓和、留下好评、问题被解决。' },
      { key: 'learning', label: '你从这件事学到了什么？', placeholder: '例如先倾听、保持冷静、及时沟通、给客人选择。' },
    ],
  },
  {
    id: 'pressure_case',
    title: '我的压力案例',
    description: '准备一个高峰期、长时间工作或同事缺勤的故事。',
    status: 'available',
    focusPoints: ['说明压力来自哪里', '展示你怎么排优先级', '证明你能稳定完成长合同'],
    referenceCase: '旧练习里的“同事请假，一个人承担两个人工作量”很适合邮轮面试，因为它能展示抗压、排班适应和团队责任感。',
    avoidAnswer: 'I do not mind working long hours as long as I get paid overtime.',
    fields: [
      { key: 'context', label: '当时压力来自哪里？', placeholder: '例如：高峰期客人很多、同事临时请假、任务突然增加。' },
      { key: 'challenge', label: '最难处理的点是什么？', placeholder: '写清楚时间紧、人手少、客人催促、多个任务同时发生等。' },
      { key: 'actions', label: '你怎么安排优先级？', placeholder: '例如先处理紧急客人、和同事分工、向主管同步、保持节奏。' },
      { key: 'result', label: '最后有没有完成？', placeholder: '例如服务没有中断、客人等待时间缩短、主管认可、团队顺利收尾。' },
      { key: 'learning', label: '你证明了什么能力？', placeholder: '例如抗压、时间管理、团队协作、长时间工作稳定性。' },
    ],
  },
  {
    id: 'team_case',
    title: '我的团队案例',
    description: '准备一个和同事配合解决问题的故事。',
    status: 'available',
    focusPoints: ['不要把功劳都放在自己身上', '说明你如何沟通和配合', '体现跨文化团队意识'],
    referenceCase: '旧练习里的“外国客人问路但你听不太懂”可以延展成团队/跨文化案例：你保持冷静，用简单英语、地图或翻译工具确认需求，必要时请同事协助。',
    avoidAnswer: 'I just treat everyone the same.',
    fields: [
      { key: 'context', label: '当时团队遇到了什么情况？', placeholder: '例如：客人语言不通、部门很忙、同事需要协助、跨部门沟通不顺。' },
      { key: 'yourRole', label: '你在团队里负责什么？', placeholder: '写清楚你的角色，不要只写大家一起努力。' },
      { key: 'communication', label: '你怎么和同事沟通？', placeholder: '例如用简单英语确认信息、同步主管、请更熟悉流程的同事协助。' },
      { key: 'result', label: '最后团队怎么解决？', placeholder: '例如客人得到帮助、工作恢复顺畅、团队减少误会。' },
      { key: 'learning', label: '你学到了什么团队能力？', placeholder: '例如尊重文化差异、主动沟通、及时求助、共同完成服务。' },
    ],
  },
  {
    id: 'motivation',
    title: '我的岗位动机',
    description: '准备为什么做海乘、为什么选这个岗位。',
    status: 'available',
    focusPoints: ['不要只说想旅行', '把岗位和你的经历连起来', '让面试官相信你能完成合同'],
    referenceCase: '旧模块里的 Why cruise ship 和 Why this position 可以合并使用：先讲相关经验，再讲为什么这个岗位匹配你，最后讲你理解邮轮工作的强度和成长空间。',
    avoidAnswer: 'Because I like traveling and I want to see the world for free.',
    fields: [
      { key: 'background', label: '你过去有什么相关经历？', placeholder: '例如：餐饮、酒店、销售、英语沟通、活动组织或服务经验。' },
      { key: 'positionReason', label: '为什么这个岗位适合你？', placeholder: '写你的能力和岗位要求之间的关系，不要只写想上船。' },
      { key: 'cruiseReason', label: '为什么选择邮轮环境？', placeholder: '例如国际客人、多元文化、服务标准、职业成长。' },
      { key: 'stability', label: '你怎么证明自己能稳定完成合同？', placeholder: '例如能接受排班、长时间工作、离家环境、团队生活。' },
      { key: 'goal', label: '你希望在岗位上成长什么？', placeholder: '例如英语服务、销售能力、酒店标准、跨文化沟通。' },
    ],
  },
  {
    id: 'self_intro',
    title: '我的英文自我介绍',
    description: '准备 30 秒自我介绍，不背流水账。',
    status: 'available',
    focusPoints: ['30 秒内讲清经验、能力和目标', '不要从姓名年龄学校流水账开始', '结尾要回到申请岗位'],
    referenceCase: '旧模块里的 Self Introduction 脚本可以保留结构，但要缩短：身份/经验、服务能力、抗压或团队特点、为什么适合邮轮岗位。',
    avoidAnswer: 'My name is... I am 25 years old... I graduated from... I like music and movies.',
    fields: [
      { key: 'role', label: '你想让面试官记住你的身份是什么？', placeholder: '例如：I am a retail sales assistant with two years of customer service experience.' },
      { key: 'experience', label: '你最相关的一段经历是什么？', placeholder: '例如餐饮、酒店、销售、前台、活动组织、英语服务。' },
      { key: 'strengths', label: '你最适合邮轮的 2 个特点是什么？', placeholder: '例如 calm under pressure, good teamwork, enjoy helping guests.' },
      { key: 'positionFit', label: '这些特点为什么适合目标岗位？', placeholder: '把你的能力和申请岗位连接起来。' },
      { key: 'closing', label: '你想用哪句话收尾？', placeholder: '例如：I am excited to bring my service skills to an international cruise environment.' },
    ],
  },
];

// 主组件
function Task6InterviewSkills() {
  const navigate = useNavigate();
  const [activeAnswerCardId, setActiveAnswerCardId] = useState(null);
  const [answerCardData, setAnswerCardData] = useState(() => {
    const data = loadFromLocalStorage({});
    return data.answerCardData || {};
  });
  
  // 当数据变化时，保存到 localStorage
  useEffect(() => {
    saveToLocalStorage({ answerCardData });
  }, [answerCardData]);

  const handleAnswerCardChange = (cardId, field, value) => {
    setAnswerCardData(prev => ({
      ...prev,
      [cardId]: {
        ...(prev[cardId] || {}),
        [field]: value
      }
    }));
  };

  const isAnswerCardCompleted = (card) => {
    if (!card.fields) return false;
    const saved = answerCardData[card.id] || {};
    return card.fields.every(field => saved[field.key]?.trim());
  };

  const preparedAnswerCount = answerCards.filter(card => isAnswerCardCompleted(card)).length;

  const buildAnswerCardOutput = (cardId) => {
    const data = answerCardData[cardId] || {};

    if (cardId === 'pressure_case') {
      const context = data.context || 'we had a very busy shift';
      const challenge = data.challenge || 'there were many tasks at the same time';
      const actions = data.actions || 'I stayed calm, set priorities, communicated with my team, and focused on urgent tasks first';
      const result = data.result || 'we finished the shift smoothly';
      const learning = data.learning || 'I can stay organized and reliable under pressure';

      return {
        basic: `In my previous work, ${context}. The biggest challenge was that ${challenge}. I did not panic. Instead, ${actions}. In the end, ${result}. This experience showed me that ${learning}.`,
        concise: `I once worked under pressure when ${challenge}. I stayed calm, prioritized tasks, and communicated with my team. As a result, ${result}. It showed that ${learning}.`,
      };
    }

    if (cardId === 'motivation') {
      const background = data.background || 'I have experience related to service and communication';
      const positionReason = data.positionReason || 'this position matches my skills and personality';
      const cruiseReason = data.cruiseReason || 'I want to work with international guests in a professional service environment';
      const stability = data.stability || 'I understand the contract requires discipline, teamwork, and long working hours';
      const goal = data.goal || 'I want to improve my service skills and grow in the hospitality industry';

      return {
        basic: `${background}. I am interested in this position because ${positionReason}. I want to work on a cruise ship because ${cruiseReason}. I also understand that ${stability}, and I am prepared for that. My goal is to ${goal}.`,
        concise: `I believe this position fits me because ${positionReason}. I am interested in cruise work because ${cruiseReason}. I understand the contract requires stability and teamwork, and my goal is to ${goal}.`,
      };
    }

    if (cardId === 'team_case') {
      const context = data.context || 'my team had to handle a challenging guest situation';
      const yourRole = data.yourRole || 'my role was to support the guest and share clear information with my team';
      const communication = data.communication || 'I communicated calmly, confirmed the details, and asked for support when needed';
      const result = data.result || 'we solved the problem together and the guest received the help they needed';
      const learning = data.learning || 'good teamwork means clear communication, respect, and taking responsibility';

      return {
        basic: `In my previous work, ${context}. ${yourRole}. To solve it, ${communication}. In the end, ${result}. This experience taught me that ${learning}.`,
        concise: `I once worked with my team during a difficult situation. ${communication}. As a result, ${result}. It taught me that ${learning}.`,
      };
    }

    if (cardId === 'self_intro') {
      const role = data.role || 'I am a service-oriented candidate with customer service experience';
      const experience = data.experience || 'I have experience working with guests and handling daily service tasks';
      const strengths = data.strengths || 'I stay calm under pressure and enjoy working with a team';
      const positionFit = data.positionFit || 'these qualities match the needs of this position';
      const closing = data.closing || 'I am excited to bring my service skills to an international cruise environment';

      return {
        basic: `${role}. ${experience}. I believe my strengths are that ${strengths}. I am interested in this role because ${positionFit}. ${closing}.`,
        concise: `${role}. I have relevant experience in guest service, and ${strengths}. I believe this fits the position because ${positionFit}. ${closing}.`,
      };
    }

    const context = data.context || 'a guest had a problem during service';
    const guestProblem = data.guestProblem || 'the guest was unhappy and needed a quick solution';
    const actions = data.actions || 'I listened carefully, apologized, checked the situation, and offered a practical solution';
    const result = data.result || 'the guest accepted the solution and the situation improved';
    const learning = data.learning || 'I learned that staying calm and communicating clearly is very important in guest service';

    return {
      basic: `In my previous work, ${context}. The guest was upset because ${guestProblem}. I stayed calm, listened carefully, and apologized first. Then ${actions}. In the end, ${result}. From this experience, I learned that ${learning}.`,
      concise: `I once handled a guest issue where ${guestProblem}. I listened first, apologized, and took action: ${actions}. The result was that ${result}. This taught me to stay calm and focus on solutions.`,
    };
  };

  const completeTask6FromWorkbench = async () => {
    const completedAt = new Date().toISOString();
    const preparedCards = answerCards.map(card => ({
      id: card.id,
      title: card.title,
      completed: isAnswerCardCompleted(card),
      answers: answerCardData[card.id] || {},
      generated: buildAnswerCardOutput(card.id),
    }));
    const taskResult = {
      taskId: 6,
      completedAt,
      preparedAnswerCount,
      answerCards: preparedCards,
    };
    localStorage.setItem('task6_result', JSON.stringify(taskResult));

    const progressKey = 'boarding_progress';
    const boardingProgress = JSON.parse(localStorage.getItem(progressKey) || '{}');
    boardingProgress.task6 = {
      completed: true,
      completedAt
    };
    localStorage.setItem(progressKey, JSON.stringify(boardingProgress));

    try {
      await upsertMyInterviewAnswerProfile(taskResult);
    } catch (error) {
      console.error('同步面试答案卡失败:', error);
    }

    await syncLocalPathProfile({
      career_stage: 'interview_preparation',
      application_stage: 'interview',
      interview_status: 'learning',
      last_completed_task_id: 6,
    });

    navigate('/tasks');
  };
  
  const renderAnswerCardDetail = () => {
    const card = answerCards.find(item => item.id === activeAnswerCardId);
    if (!card) return null;

    const saved = answerCardData[card.id] || {};
    const generated = buildAnswerCardOutput(card.id);
    const completed = isAnswerCardCompleted(card);
    const followUpQuestions = {
      service_case: [
        'What exactly did you do first?',
        'How did the guest react?',
        'What would you do differently next time?',
      ],
      pressure_case: [
        'How did you decide what to do first?',
        'How did you communicate with your team?',
        'How do you keep your energy during long working hours?',
      ],
      team_case: [
        'What was your specific role in the team?',
        'How did you communicate when there was a misunderstanding?',
        'What did you learn about working with people from different cultures?',
      ],
      motivation: [
        'Why this position, not another cruise position?',
        'How do you know you can complete a long contract?',
        'What do you want to learn from this job?',
      ],
      self_intro: [
        'Can you tell me more about your previous job?',
        'Why do you think your experience fits this position?',
        'What is your strongest service skill?',
      ],
    }[card.id] || [];

    return (
      <div className="min-h-screen bg-slate-50 pb-24">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-lg px-5 py-4">
            <button
              type="button"
              onClick={() => setActiveAnswerCardId(null)}
              className="mb-3 text-sm font-medium text-slate-500"
            >
              返回工作台
            </button>
            <p className="text-sm font-medium text-blue-700">面试答案卡</p>
            <h1 className="mt-1 text-xl font-bold text-slate-950">{card.title}</h1>
            <p className="mt-1 text-sm leading-6 text-slate-600">{card.description}</p>
          </div>
        </div>

        <main className="mx-auto max-w-lg px-5 py-5">
          <section className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <h2 className="font-semibold text-blue-950">训练目标</h2>
            <p className="mt-1 text-sm leading-6 text-blue-900">
              这不是背模板。你要先把真实经历讲清楚，再把它变成一段能在面试里自然说出来的英文回答。
            </p>
          </section>

          <section className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-slate-950">面试官看什么</h2>
            <div className="mt-3 space-y-2">
              {card.focusPoints?.map(point => (
                <div key={point} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {point}
                </div>
              ))}
            </div>
          </section>

          <section className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="font-semibold text-amber-950">可参考素材</h2>
            <p className="mt-1 text-sm leading-6 text-amber-900">{card.referenceCase}</p>
            <div className="mt-3 rounded-lg bg-white/70 p-3">
              <p className="text-xs font-medium text-amber-700">避免这样说</p>
              <p className="mt-1 text-sm text-amber-950">{card.avoidAnswer}</p>
            </div>
          </section>

          <section className="space-y-4">
            {card.fields.map(field => (
              <div key={field.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <label className="block text-sm font-semibold text-slate-900">{field.label}</label>
                <textarea
                  value={saved[field.key] || ''}
                  onChange={(event) => handleAnswerCardChange(card.id, field.key, event.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  className="mt-3 w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            ))}
          </section>

          <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-950">生成的英文回答</h2>
                <p className="mt-1 text-xs text-slate-500">先能说清楚，再追求更漂亮。</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${completed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {completed ? '可用于练习' : '继续补素材'}
              </span>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="mb-1 text-xs font-medium text-slate-500">基础版</p>
                <p className="text-sm leading-6 text-slate-800">{generated.basic}</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="mb-1 text-xs font-medium text-blue-700">30 秒精简版</p>
                <p className="text-sm leading-6 text-blue-950">{generated.concise}</p>
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-slate-950">面试官可能追问</h2>
            <div className="mt-3 space-y-2">
              {followUpQuestions.map(question => (
                <div key={question} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {question}
                </div>
              ))}
            </div>
          </section>

          <button
            type="button"
            onClick={() => setActiveAnswerCardId(null)}
            className="mt-5 w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700"
          >
            保存并返回工作台
          </button>
        </main>
      </div>
    );
  };
  
  // 渲染主页面
  const renderMainPage = () => {
    return (
      <div className="min-h-screen bg-slate-50 pb-24">
        <div className="border-b border-slate-200 bg-white px-6 pb-6 pt-12">
          <p className="text-sm font-medium text-blue-700">面试准备工作台</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">把你的经历打磨成英文面试答案</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            不先背模板。先准备自己的服务案例、压力案例和岗位动机，再进入 AI 模拟面试。
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">已准备回答</p>
              <p className="mt-1 text-lg font-bold text-slate-950">{preparedAnswerCount}/5</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">完成条件</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">3 张答案卡</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">下一步</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">服务案例</p>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-5">
          <section className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-slate-950">我的面试答案卡</h2>
              <span className="text-xs text-slate-500">完成 3 张即可进入下一步</span>
            </div>
            <div className="space-y-3">
              {answerCards.map((card) => {
                const completed = isAnswerCardCompleted(card);
                const available = card.status === 'available';

                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => available && setActiveAnswerCardId(card.id)}
                    className={`w-full rounded-xl border p-4 text-left shadow-sm transition ${
                      available
                        ? 'border-slate-200 bg-white hover:border-blue-200'
                        : 'border-slate-200 bg-slate-100 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <h3 className="font-semibold text-slate-950">{card.title}</h3>
                          {completed && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              已准备
                            </span>
                          )}
                        </div>
                        <p className="text-sm leading-6 text-slate-600">{card.description}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                        available ? 'bg-blue-50 text-blue-700' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {available ? '开始' : '下一步'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h2 className="font-semibold text-amber-950">训练逻辑</h2>
            <p className="mt-1 text-sm leading-6 text-amber-900">
              STAR 会保留在后台作为结构，但页面不再让你背概念。你只需要把真实经历写清楚，系统会帮你整理成可练的英文回答。
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-950">进入下一步前，请先准备 3 个可用回答</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  这三个回答会直接服务于后面的 AI 模拟面试：服务案例、压力案例和岗位动机。
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                preparedAnswerCount >= 3 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}>
                {preparedAnswerCount}/3
              </span>
            </div>
            <button
              type="button"
              onClick={completeTask6FromWorkbench}
              disabled={preparedAnswerCount < 3}
              className="mt-4 w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {preparedAnswerCount >= 3 ? '完成面试答案准备' : '继续准备答案卡'}
            </button>
          </section>
        </div>
        
      </div>
    );
  };
  
  if (activeAnswerCardId) return renderAnswerCardDetail();
  return renderMainPage();
}

export default Task6InterviewSkills;
