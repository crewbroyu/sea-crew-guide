// 完成反馈提示文案配置
export const completionMessages = {
  // 任务完成通用文案
  general: [
    { en: 'Good progress. One step closer.', zh: '进展不错，又近一步。' },
    { en: 'Task completed. Keep going.', zh: '任务完成，继续前进。' },
    { en: 'Nice. You\'re moving forward.', zh: '很好，你正在前进。' },
    { en: 'Well done. Next step awaits.', zh: '做得好，下一步在等你。' },
    { en: 'Progress saved. Keep it up.', zh: '进度已保存，继续保持。' },
  ],
  
  // 海乘场景类文案
  onboard: [
    { en: 'Onboard mindset unlocked.', zh: '解锁登船心态。' },
    { en: 'Crew experience updated.', zh: '船员经验已更新。' },
    { en: 'You\'re getting closer to onboard reality.', zh: '离登船更近了。' },
    { en: 'This is how real crew start.', zh: '真正的船员就是这样开始的。' },
    { en: 'Your onboard journey continues.', zh: '你的登船旅程继续。' },
  ],
  
  // 技能提升类文案
  skills: [
    { en: 'Skill level up.', zh: '技能提升。' },
    { en: 'New skill acquired.', zh: '获得新技能。' },
    { en: 'You\'re building your path.', zh: '你正在建立自己的道路。' },
    { en: 'Small step, real progress.', zh: '小步前进，真实进步。' },
    { en: 'Experience gained.', zh: '经验值增加。' },
  ],
  
  // 面试相关文案
  interview: [
    { en: 'Interview skills improved.', zh: '面试技能提升。' },
    { en: 'You\'re ready for the next step.', zh: '你已准备好下一步。' },
    { en: 'Confidence boosted.', zh: '信心提升。' },
    { en: 'One step closer to your dream job.', zh: '离梦想工作更近一步。' },
  ],
  
  // 证件相关文案
  documents: [
    { en: 'Document progress saved.', zh: '证件进度已保存。' },
    { en: 'One more document ready.', zh: '又一份证件准备就绪。' },
    { en: 'Getting closer to onboard requirements.', zh: '离登船要求更近了。' },
  ],
};

// 任务类型映射
export const taskTypeMap = {
  1: 'general',    // 海乘适配评估
  2: 'general',    // 岗位选择测评
  3: 'general',    // 预算设置
  4: 'skills',     // 简历构建
  5: 'skills',     // 岗位英语课程
  6: 'interview',  // 面试技巧
  7: 'interview',  // 面试练习
  8: 'interview',  // AI模拟面试
  9: 'documents',  // 我的Offer
  10: 'documents', // 海乘职业资质
  11: 'onboard',   // 登船准备
  12: 'onboard',   // 最终确认
};

// 获取随机文案
export const getRandomMessage = (taskId) => {
  const type = taskTypeMap[taskId] || 'general';
  const messages = completionMessages[type];
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
};
