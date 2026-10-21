import { barServerFoundationDays, barServerShiftLabs } from '../barServerFoundation.js'

// Narrated slide lesson for Bar Server Day 1. Narration text is the reviewed
// lecture script; audio files are pre-generated from it by
// scripts/lectures/generate-lecture-audio.mjs, so rerun it after editing narration.
const day = barServerFoundationDays.find((item) => item.id === 'service-role')
const lab = barServerShiftLabs['service-role']

export const barServerDay1Lecture = {
  id: 'bar-server-day1',
  courseSlug: 'bar-server',
  dayId: day.id,
  version: 1,
  language: 'English',
  audioBase: '/audio/lectures/bar-server/day1/',
  slides: [
    {
      id: '01',
      layout: 'cover',
      eyebrow: 'Day 1',
      title: day.title,
      subtitle: `${lab.shift.location} · ${lab.shift.time}`,
      bullets: [`今天的目标：${day.outcome.replace(/。$/, '')}`],
      narration: 'Welcome to Day 1 of the Bar Server foundation course. Picture this. It’s embarkation day, five thirty in the evening, at the Atrium Bar. New guests are arriving, and the bar is filling up fast. This is your first shift. In this lesson, you will learn three things: what a Bar Server is responsible for, how one complete service flows, and why safety always comes before sales.',
    },
    {
      id: '02',
      layout: 'columns',
      title: 'Bar Server 与 Bartender 的边界',
      columns: [
        { heading: 'Bar Server', items: ['迎接客人', '确认需求', '介绍菜单', '录入 POS', '送饮品', '跟进体验', '清台和基础备货'] },
        { heading: 'Bartender', items: ['按标准配方制作', '控制出品质量', '管理吧台设备', '专业酒水操作'] },
      ],
      narration: 'Many people mix up the Bar Server and the Bartender, and interviewers want to know if you understand the difference. The Bar Server works on the guest side. You welcome guests, find out what they want, present the menu, enter orders in the POS, deliver drinks, follow up, clear tables, and do basic restocking. The Bartender works behind the bar. They make drinks to the standard recipe, control drink quality, and manage the bar equipment. In short, you take care of the guest, the Bartender takes care of the drink, and you work together through a clear handover.',
    },
    {
      id: '03',
      layout: 'statement',
      title: '不确定，先核实',
      tags: ['不确定的配方', '过敏信息', '套餐规则', '补偿权限'],
      statement: '先核实，再承诺',
      narration: 'Here is a rule you must always follow. If you are not sure about a recipe, allergy information, package rules, or what compensation you are allowed to offer, check first, then promise. A common mistake for new crew is to sound confident and say, “Sure, that’s included in your package.” Get it wrong once, and the guest stops trusting you. Saying “Let me check that for you” is completely professional.',
    },
    {
      id: '04',
      layout: 'steps',
      title: '完整服务的 7 个动作（上）',
      startAt: 1,
      steps: ['主动问候', '确认关键偏好', '推荐一到两款', '复述并录入 POS'],
      narration: 'Now let’s walk through the seven steps of a complete service. The first four happen before the order is placed. Step one: notice the guest and greet them. Even when you are busy, let them know you have seen them. Step two: confirm their key preferences, such as alcohol or no alcohol, base spirit, sweetness, flavor, and budget or beverage package. Step three: recommend one or two genuinely different options, and explain why they suit the guest. Step four: repeat the order back, confirm any special requests, and enter it accurately in the POS.',
    },
    {
      id: '05',
      layout: 'steps',
      title: '完整服务的 7 个动作（下）',
      startAt: 5,
      steps: ['与 Bartender 交接', '送达时核对', '回访与清台'],
      narration: 'The last three steps happen after the order. Step five: hand the order over clearly to the Bartender, and keep an eye on waiting times and the order sequence. Step six: when you deliver, check that the right drink goes to the right guest, and explain the ingredients or garnish if needed. Step seven: come back a little later, fix any problem on the spot, and clear the table. Put these seven steps together, and the guest feels truly looked after.',
    },
    {
      id: '06',
      layout: 'bullets',
      title: '安全永远高于销售',
      bullets: [
        '年龄核验、停止供酒、酒精限量、事故上报：按船公司正式政策',
        '需要关注的信号：说话含糊 · 站立不稳 · 判断力下降 · 行为明显变化',
        '处理方式：中性语言 · 提供水或无酒精选择 · 尽早通知主管',
      ],
      narration: 'The last part is the most important: safety always comes before sales. Age checks, stopping alcohol service, drink limits, and incident reporting must follow your cruise line’s official policy, not your personal judgment. Slurred speech, unsteady balance, poor judgment, and clear changes in behavior can be signs that need attention. But never argue with a guest about whether they are drunk. Use neutral language to stop or delay alcohol service, offer water or a non-alcoholic option, and inform your supervisor as early as possible.',
    },
    {
      id: '07',
      layout: 'vocabulary',
      // Long pauses give learners time to repeat each word.
      sentenceGapMs: 1500,
      title: '今天的 5 个关键词',
      vocabulary: lab.vocabulary,
      narration: 'Here are today’s five key words. Repeat after me. Recommend. Preference. Confirm. Beverage package. Intoxication. You will rarely say that last word to a guest, but you will use it when you talk to your supervisor or write an incident report.',
    },
    {
      id: '08',
      layout: 'lines',
      title: '三句马上能用的服务句型',
      lines: [
        { cue: '客人在等', line: lab.serviceLines[0].line },
        { cue: '了解偏好', line: lab.serviceLines[1].line },
        { cue: '下单前确认', line: lab.serviceLines[2].line },
      ],
      narration: 'Here are three service lines you can use right away. When a guest is waiting, say: Good evening. I’ll be right with you. Thank you for waiting. When you want to learn their preference, ask: Are you looking for something refreshing, fruity, dry, or spirit-forward? Before you send the order, confirm: That’s one Mojito, less sweet, with no straw. Is that correct? Open the shadowing practice to repeat each line until it feels natural.',
    },
    {
      id: '09',
      layout: 'quiz',
      title: '停下来想一想',
      quiz: day.quiz,
      narration: 'Now it’s your turn to decide. A guest asks whether an unfamiliar cocktail is included in the beverage package. What is the most professional response? Don’t skip ahead. Choose an answer first.',
    },
    {
      id: '10',
      layout: 'quizReveal',
      title: '答案讲解',
      quiz: day.quiz,
      narration: 'The answer is B. Tell the guest you will check the recipe and the package rules, then come back with an accurate answer. The problem with A is that you promise first and check later. If you are wrong, it is very hard to take back. C sends the guest to Guest Services. It looks easy, but you are passing on something that is your responsibility. Remember: accuracy matters more than a quick promise. Take responsibility for checking, but never invent package rules.',
    },
    {
      id: '11',
      layout: 'challenge',
      title: '轮到你开口',
      challenge: lab.challenge,
      hint: '确认偏好 → 推荐一到两款 → 复述订单',
      narration: 'Finally, it’s your turn to speak. A guest says to you: I don’t know what I want. Just bring me something good, but I don’t like sweet drinks. Think about what you learned today. First, confirm their preferences. Then recommend one or two different options. Finally, repeat the order back. When you are ready, tap the challenge button and answer the guest in English.',
    },
    {
      id: '12',
      layout: 'bullets',
      title: '今天的小结',
      bullets: [
        'Bar Server 服务客人，Bartender 负责出品；不确定就先核实',
        '一次完整服务：7 个动作，从问候到清台',
        '安全高于销售：中性语言，及时通知主管',
        '明天：Build Your Spirit Map',
      ],
      narration: 'Let’s review today’s lesson. One: the Bar Server looks after the guest, and the Bartender makes the drinks. If you are unsure about something, check before you promise. Two: a complete service has seven steps, from the greeting to clearing the table. Three: safety always comes before sales. Use neutral language and inform your supervisor early. Tomorrow, we will meet the six main spirit families and build your own Spirit Map.',
    },
  ],
}
