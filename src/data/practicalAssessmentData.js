export const ENGLISH_PRACTICAL_TASKS = [
  {
    id: 'practical-english-complaint',
    category: 'english',
    title: '英语实战 1：投诉闭环',
    prompt: '客人对你说：“I ordered thirty minutes ago, but another table was served first. This is unacceptable.” 请直接用英语回应客人。',
    spokenPrompt: 'Excuse me. I ordered thirty minutes ago, but another table was served first. This is unacceptable.',
    preparationSeconds: 15,
    recordingSeconds: 45,
    language: '请全程使用英语',
  },
  {
    id: 'practical-english-safety',
    category: 'english',
    title: '英语实战 2：过敏安全',
    prompt: '客人问：“I have a severe shellfish allergy. Is this soup safe?” 你暂时不能确认配方。请直接用英语回应。',
    spokenPrompt: 'Excuse me. I have a severe shellfish allergy. Is this soup safe?',
    preparationSeconds: 15,
    recordingSeconds: 30,
    language: '请全程使用英语',
  },
]

const STAR_PROMPTS = {
  retail: '请用中文讲一次你面对犹豫、拒绝或不满意的顾客，并最终推动问题解决或购买决定的真实经历。重点说清你本人做了什么。',
  restaurant: '请用中文讲一次餐饮高峰期出现延误、出错或客诉时，你亲自判断优先级并处理的真实经历。',
  bar_server: '请用中文讲一次你在饮品服务、客人情绪或安全边界之间作出判断的真实经历。',
  front_office: '请用中文讲一次你处理复杂客诉、信息冲突或跨部门协调的真实经历。重点说清你的个人责任。',
  housekeeping: '请用中文讲一次你发现质量、安全或客人物品风险，并按流程处理的真实经历。',
  youth_staff: '请用中文讲一次你处理儿童安全、现场冲突或监护边界的真实经历。',
  beauty_spa: '请用中文讲一次客人对服务效果不满、出现禁忌风险或需要调整方案时，你亲自处理的真实经历。',
  none: '请用中文讲一次你在兼职、校园或日常协作中，面对他人不满或突发问题并承担解决责任的真实经历。',
}

export const getStarPracticalTask = (serviceBackground) => ({
  id: 'practical-star-main',
  category: 'star',
  title: '经历核验：STAR 主问题',
  prompt: STAR_PROMPTS[serviceBackground] || STAR_PROMPTS.none,
  spokenPrompt: STAR_PROMPTS[serviceBackground] || STAR_PROMPTS.none,
  preparationSeconds: 20,
  recordingSeconds: 90,
  language: '请使用中文，讲真实事件；不要背标准答案',
})

export const STAR_FALLBACK_FOLLOW_UPS = [
  {
    id: 'practical-star-followup-1',
    category: 'star',
    title: '经历核验：追问 1',
    prompt: '刚才这件事里，哪一步是你本人独立判断并完成的？请说明当时先做了什么，以及为什么。',
    spokenPrompt: '刚才这件事里，哪一步是你本人独立判断并完成的？请说明当时先做了什么，以及为什么。',
    preparationSeconds: 10,
    recordingSeconds: 45,
    language: '请使用中文，只补充真实细节',
  },
  {
    id: 'practical-star-followup-2',
    category: 'star',
    title: '经历核验：追问 2',
    prompt: '你如何确认这次处理产生了结果？如果再发生一次，你会保留或改变哪一步？',
    spokenPrompt: '你如何确认这次处理产生了结果？如果再发生一次，你会保留或改变哪一步？',
    preparationSeconds: 10,
    recordingSeconds: 45,
    language: '请使用中文，只补充真实细节',
  },
]
