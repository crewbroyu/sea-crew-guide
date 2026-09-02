export const BAR_SERVER_TRIAL_VERSION = 3
export const BAR_SERVER_TRIAL_STORAGE_KEY = 'bar_server_trial_v3'

export const barServerTrialScenarios = [
  {
    id: 'bar_server_drink_recommendation_01',
    episodeNumber: 1,
    shortTitle: '饮品推荐',
    category: 'Sales & Recommendation',
    title: 'Busy Night：为客人推荐一杯合适的饮品',
    image: '/images/bar-server/ep01-busy-night.png',
    imageAlt: '邮轮露天酒吧晚间高峰，一名 Bar Server 正在倾听客人的饮品需求',
    visualPrompt: 'Cruise ship pool bar at evening rush, recurring trainee Bar Server listening to a guest who needs a drink recommendation, cinematic 16:9 editorial illustration.',
    characters: ['Trainee Bar Server Leo', 'Guest Maya', 'Bartender Daniel'],
    location: 'Pool Bar · Deck 12',
    audio: null,
    video: null,
    setting: '海上日晚上 8:30，Pool Bar 正在高峰期。几位客人在等候，一位客人走到吧台前向你咨询。',
    guestLine: "I'd like something light, citrusy, and not too sweet. What do you recommend?",
    task: '请直接用英文扮演 Bar Server 回答客人，建议控制在 30-60 秒。',
    interviewerQuestion: [
      'You are serving a guest during a busy evening at the pool bar.',
      'The guest says: “I’d like something light, citrusy, and not too sweet. What do you recommend?”',
      'Respond as the Bar Server and explain how you would continue the service.',
    ].join(' '),
    focus: '先确认一个关键偏好，再给出具体推荐并解释口味；自然确认价格或 beverage package，不要为了加售而忽略客人需求。',
    keywords: ['preference', 'alcohol', 'recommend', 'citrus', 'flavor', 'package', 'choice', 'guest'],
    checkpoints: [
      '先确认是否含酒精、基酒或其他关键偏好',
      '推荐一款具体饮品，并用客人听得懂的语言描述口味',
      '自然确认 beverage package 或价格，不强行推销',
      '结尾确认选择并推进点单',
    ],
    watchOuts: ['不要一次罗列很多酒名，让客人自己猜', '不要虚构邮轮公司的套餐、价格或酒精政策', '高峰期也要保持简洁、准确和礼貌'],
    lesson: {
      objective: '学会先确认一个关键偏好，再用基础酒水知识推荐一款真正符合客人需求的饮品，并完成服务收尾。',
      storyTitle: 'A guest wants “light, citrusy, and not too sweet” during the evening rush.',
      dialogue: [
        {
          speaker: 'Guest Maya',
          role: 'guest',
          text: "I'd like something light, citrusy, and not too sweet. What do you recommend?",
          translation: '我想喝清爽、有柑橘味、但不要太甜的饮品。你推荐什么？',
        },
        {
          speaker: 'Bar Server Leo',
          role: 'server',
          text: 'Certainly. May I ask whether you prefer gin, vodka, or a non-alcoholic option?',
          translation: '当然可以。请问您更喜欢金酒、伏特加，还是无酒精饮品？',
        },
        {
          speaker: 'Guest Maya',
          role: 'guest',
          text: 'Vodka would be good.',
          translation: '伏特加可以。',
        },
        {
          speaker: 'Bar Server Leo',
          role: 'server',
          text: 'In that case, I would recommend a vodka soda with fresh lime. It is light, refreshing, and not sweet. Shall I check whether it is included in your beverage package?',
          translation: '那我推荐伏特加苏打加新鲜青柠。它清爽、不甜。我帮您确认一下是否包含在饮品套餐内，可以吗？',
        },
      ],
      knowledge: [
        {
          title: 'Bar Server 不是只负责报酒名',
          body: '你的任务是听懂需求、缩小选择、准确描述风味、确认价格或套餐信息，再把订单清楚地交给 Bartender。复杂调酒由 Bartender 负责，但客人体验从你的沟通开始。',
        },
        {
          title: '先问一个能改变推荐结果的问题',
          body: '高峰期不适合问五六个问题。确认是否含酒精、偏好的基酒，或是否需要低糖，通常只需一个关键问题就能避免随机推荐。',
        },
        {
          title: '推荐必须同时解释“为什么合适”',
          body: '不要只说 I recommend...。至少补充风味、甜度或口感，让客人知道这款饮品如何对应 light、citrusy 和 not too sweet。',
        },
        {
          title: '套餐与定制都要先核实',
          body: '不同船公司、航线和套餐规则可能不同。可以主动提出帮客人确认，但不要直接承诺某款酒免费、包含在套餐中，或一定可以修改配方。',
        },
      ],
      drinkComparison: [
        {
          name: 'Screwdriver',
          build: 'Vodka + orange juice',
          profile: 'Citrusy，但橙汁可能更甜、更厚重',
          fit: '不是本题最稳妥的首选',
        },
        {
          name: 'Tom Collins',
          build: 'Gin + lemon + soda + syrup',
          profile: '清爽、有柠檬风味；甜度取决于糖浆',
          fit: '先确认客人接受 gin，并核实能否少糖',
        },
        {
          name: 'Vodka Soda with Lime',
          build: 'Vodka + soda + fresh lime',
          profile: '轻盈、清爽、低甜度',
          fit: '客人接受 vodka 时是稳妥选择',
        },
      ],
      serviceSequence: [
        '确认一个关键偏好：酒精、基酒或甜度',
        '推荐一款具体饮品，并解释风味匹配',
        '必要时给一个真正不同的备选，不罗列酒单',
        '核实套餐、价格或定制要求，不擅自承诺',
        '确认客人选择并准确推进点单',
      ],
      vocabulary: [
        { term: 'citrus-forward', meaning: '柑橘风味突出', example: 'It is light and citrus-forward.' },
        { term: 'refreshing', meaning: '清爽的', example: 'This is a refreshing option for a warm evening.' },
        { term: 'less syrup', meaning: '减少糖浆', example: 'I can check whether it can be made with less syrup.' },
        { term: 'beverage package', meaning: '饮品套餐', example: 'Shall I check whether it is included in your beverage package?' },
      ],
      sentencePatterns: [
        'May I ask whether you prefer gin, vodka, or a non-alcoholic option?',
        'I would recommend this because it is light, refreshing, and citrus-forward.',
        'I can check whether the bartender can make it with less syrup.',
        'Shall I check whether it is included in your beverage package?',
      ],
      decisionCheck: {
        question: '客人说想要 light、citrusy、not too sweet，并确认可以喝 vodka。高峰期你下一步最合适怎么做？',
        options: [
          {
            id: 'a',
            text: '直接推荐 Screwdriver，因为里面有橙汁',
            correct: false,
            explanation: 'Screwdriver 确实有柑橘风味，但橙汁可能偏甜、口感较厚，不能只因为“有橙汁”就判断完全匹配。',
          },
          {
            id: 'b',
            text: '推荐 Vodka Soda with Lime，解释它清爽、不甜，再提出帮客人核实套餐',
            correct: true,
            explanation: '这个选择同时回应了基酒、口感、柑橘风味和甜度，并包含了符合权限的服务收尾。',
          },
          {
            id: 'c',
            text: '一次介绍五款鸡尾酒，让客人自己选择',
            correct: false,
            explanation: '高峰期罗列大量选择会增加客人的判断负担，也没有体现你真正理解了需求。',
          },
        ],
      },
      interviewTransfer: {
        question: 'How do you recommend a drink when a guest is not sure what to order?',
        tip: '把当前场景总结成“确认偏好 → 推荐并解释 → 核实规则 → 确认订单”的岗位方法。',
      },
    },
  },
  {
    id: 'bar_server_complaint_recovery_02',
    episodeNumber: 2,
    shortTitle: '客诉补救',
    category: 'Complaint & Recovery',
    title: 'Wrong Drink：客人等了很久，却收到一杯太甜的酒',
    image: '/images/bar-server/ep02-wrong-drink.png',
    imageAlt: '繁忙的邮轮酒吧里，一位客人对过甜的鸡尾酒表示不满，Bar Server 正在倾听',
    visualPrompt: 'Busy cruise ship lounge bar after a show, recurring trainee Bar Server listening calmly as a disappointed guest returns an overly sweet cocktail, supervisor visible in the distance, cinematic 16:9 editorial illustration.',
    characters: ['Trainee Bar Server Leo', 'Guest Maya', 'Bartender Daniel', 'Supervisor Elena'],
    location: 'Lounge Bar · Deck 6',
    audio: null,
    video: null,
    setting: '晚间演出结束后酒吧很忙。一位客人把刚收到的鸡尾酒推回来，明显不满意，旁边还有其他客人在等待。',
    guestLine: 'This is much too sweet and not what I expected. I waited a long time for it.',
    task: '请用英文完成接诉、确认问题、给出解决方案和服务收尾。',
    interviewerQuestion: [
      'You are working at a busy cruise ship bar.',
      'A guest says: “This is much too sweet and not what I expected. I waited a long time for it.”',
      'Respond as the Bar Server and explain how you would recover the service.',
    ].join(' '),
    focus: '先处理客人的体验，再核对订单和口味；给出符合政策的重做或替换方案，保持客人知情，并在送达后跟进。',
    keywords: ['listen', 'apologize', 'confirm', 'order', 'replace', 'bartender', 'update', 'follow-up'],
    checkpoints: ['先承认等待和口味问题，不争辩也不甩锅', '确认原订单及客人真正想要的口味', '提出重做、替换或请主管协助的可执行方案', '说明下一步并在新饮品送达后跟进'],
    watchOuts: ['不要责怪 bartender、系统或客人自己点错', '不要未经授权承诺免费、退款或额外补偿', '不要只说 sorry 后立刻离开'],
    lesson: {
      objective: '学会把道歉转化成完整的服务补救：确认问题、提出可执行方案、同步进度并回访结果。',
      storyTitle: 'The guest waited a long time and the drink still missed the requested flavor.',
      dialogue: [
        { speaker: 'Guest Maya', role: 'guest', text: 'This is much too sweet and not what I expected. I waited a long time for it.', translation: '这杯太甜了，和我预期的不一样，而且我等了很久。' },
        { speaker: 'Bar Server Leo', role: 'server', text: 'I’m sorry the drink was not what you expected, especially after the wait.', translation: '很抱歉这杯饮品没有达到您的预期，尤其您还等了这么久。' },
        { speaker: 'Bar Server Leo', role: 'server', text: 'May I confirm what you ordered and whether you would prefer something less sweet?', translation: '我确认一下您原本点的饮品，以及您是否希望换成甜度更低的，可以吗？' },
        { speaker: 'Bar Server Leo', role: 'server', text: 'I’ll check with the bartender right away and arrange the appropriate replacement. I’ll keep you updated.', translation: '我马上和调酒师核对并安排合适的替换饮品，我会及时告诉您处理进度。' },
      ],
      knowledge: [
        { title: '先承认影响，不急着解释原因', body: '同时承认等待时间和饮品不符合预期。客人此刻首先需要被理解，而不是听你解释酒吧为什么忙。' },
        { title: '确认事实与真正需求', body: '核对原订单、特殊要求和客人期待的口味，避免在没弄清问题时再次随机重做。' },
        { title: '只承诺自己有权执行的动作', body: '可以承诺立即核对、联系 Bartender、更新进度；免费饮品、退款或补偿通常需要主管授权。' },
        { title: '送达不是结束，回访才闭环', body: '替换饮品送达后再次确认口味和满意度，体现你对结果负责，而不是把问题转交后离开。' },
      ],
      drinkComparison: [
        { name: 'Remake', build: '按原配方重新制作并纠正错误', profile: '适合确认是制作或传递错误时', fit: '先核对订单与特殊要求' },
        { name: 'Less-sweet alternative', build: '根据客人口味推荐不同饮品', profile: '适合原饮品本身风格不匹配时', fit: '需要再次确认基酒和风味' },
        { name: 'Supervisor support', build: '涉及退款、补偿或升级客诉', profile: '由有授权的人决定补救范围', fit: '不要自行承诺补偿' },
      ],
      serviceSequence: ['承认等待与饮品问题并真诚道歉', '核对订单及客人期待的口味', '提出重做、替换或主管协助方案', '告知预计动作并保持进度更新', '新饮品送达后回访确认'],
      vocabulary: [
        { term: 'not what you expected', meaning: '没有达到您的预期', example: 'I’m sorry it was not what you expected.' },
        { term: 'confirm the order', meaning: '核对订单', example: 'May I confirm the original order with you?' },
        { term: 'appropriate replacement', meaning: '合适的替换方案', example: 'I’ll arrange the appropriate replacement.' },
        { term: 'keep you updated', meaning: '及时告知进度', example: 'I’ll keep you updated while we prepare it.' },
      ],
      sentencePatterns: ['I’m sorry the drink was not what you expected, especially after the wait.', 'May I confirm what you ordered and the flavor you were expecting?', 'I’ll speak with the bartender right away and arrange the appropriate replacement.', 'I’ll keep you updated and check back after the new drink arrives.'],
      decisionCheck: {
        question: '客人抱怨等待很久且饮品太甜，最专业的第一组动作是什么？',
        options: [
          { id: 'a', text: '解释今晚太忙，并告诉客人配方本来就是甜的', correct: false, explanation: '这会把焦点放在辩解上，也没有解决客人的体验和需求。' },
          { id: 'b', text: '承认等待和口味问题，核对原订单与期望，再安排合规的重做或替换', correct: true, explanation: '这组动作同时包含同理心、事实确认和可执行解决方案。' },
          { id: 'c', text: '立即承诺免费送一杯更贵的酒', correct: false, explanation: '未经授权承诺补偿可能违反政策，也没有先确认客人的真实需求。' },
        ],
      },
      interviewTransfer: { question: 'Tell me about a time you handled a guest complaint.', tip: '用“承认影响 → 核对问题 → 执行补救 → 回访结果”组织具体经历。' },
    },
  },
  {
    id: 'bar_server_responsible_service_03',
    episodeNumber: 3,
    shortTitle: '安全拒酒',
    category: 'Safety & Judgment',
    title: 'Last Drink：疑似醉酒客人坚持再点一杯双份威士忌',
    image: '/images/bar-server/ep03-last-drink.png',
    imageAlt: '邮轮酒吧临近打烊，一位 Bar Server 平静地处理客人继续点烈酒的要求',
    visualPrompt: 'Cruise ship bar near last call, recurring trainee Bar Server calmly setting a responsible-service boundary with an unsteady guest requesting double whisky, supervisor approaching, cinematic 16:9 editorial illustration.',
    characters: ['Trainee Bar Server Leo', 'Guest Alex', 'Supervisor Elena'],
    location: 'Atrium Bar · Deck 5',
    audio: null,
    video: null,
    setting: '接近 Last Call，一位客人说话含糊、站立不稳，却坚持要求一杯 double whisky，并开始质疑你为什么不马上服务。',
    guestLine: 'Give me a double whisky. I’m fine, and I paid for the package.',
    task: '请用英文展示如何安全、尊重地拒绝继续供酒，并说明后续行动。',
    interviewerQuestion: [
      'It is close to last call at a cruise ship bar.',
      'A guest appears unsteady and says: “Give me a double whisky. I’m fine, and I paid for the package.”',
      'Respond as the Bar Server and explain the safe next steps.',
    ].join(' '),
    focus: '使用中性语言，依据公司 responsible-service policy 停止供酒；提供水或其他安全替代，并尽早通知主管，必要时请求安保或医疗支持。',
    keywords: ['policy', 'cannot serve', 'water', 'alternative', 'supervisor', 'safety', 'calm', 'support'],
    checkpoints: ['保持平静，不与客人争论是否喝醉', '明确但尊重地说明现在不能继续提供酒精', '提供水、无酒精饮品或其他安全替代', '通知主管，并按情况联系安保或医疗支持'],
    watchOuts: ['不要使用 You are drunk 之类容易激化冲突的表达', 'beverage package 不会凌驾于安全售酒政策之上', '不要独自处理不断升级或可能不安全的情况'],
    lesson: {
      objective: '学会在不羞辱、不争辩的前提下停止供酒，提供安全替代，并按流程及时升级处理。',
      storyTitle: 'A guest appears unsteady but insists that the beverage package guarantees another double whisky.',
      dialogue: [
        { speaker: 'Guest Alex', role: 'guest', text: 'Give me a double whisky. I’m fine, and I paid for the package.', translation: '给我一杯双份威士忌。我没事，而且我买了饮品套餐。' },
        { speaker: 'Bar Server Leo', role: 'server', text: 'I understand, but for your safety I’m unable to serve another alcoholic drink at this time.', translation: '我理解，不过出于您的安全考虑，我现在不能继续为您提供酒精饮品。' },
        { speaker: 'Bar Server Leo', role: 'server', text: 'I can bring you water or a non-alcoholic option instead.', translation: '我可以为您送上水或无酒精饮品作为替代。' },
        { speaker: 'Bar Server Leo', role: 'server', text: 'Let me ask my supervisor to assist us.', translation: '我请主管过来协助我们。' },
      ],
      knowledge: [
        { title: '描述决定，不给客人贴标签', body: '不要说 You are drunk。用中性、简短的语言说明此刻不能继续供酒，并把重点放在安全与政策上。' },
        { title: '套餐不等于无限供酒', body: 'Beverage package 始终受 responsible-service policy 约束，安全规则高于套餐权益。' },
        { title: '拒绝之后必须提供下一步', body: '主动提供水、无酒精饮品或其他安全替代，避免只说 no 后让冲突悬在原地。' },
        { title: '尽早升级，不独自硬扛', body: '通知主管；若客人持续升级、可能伤害自己或他人，按船公司流程请求安保或医疗支持。' },
      ],
      drinkComparison: [
        { name: 'Double whisky', build: '双份烈酒', profile: '酒精浓度和单次摄入量更高', fit: '当前安全情境下不应继续提供' },
        { name: 'Water', build: '水与适当休息', profile: '清晰、低风险的第一替代', fit: '可立即主动提供' },
        { name: 'Non-alcoholic option', build: '无酒精饮品', profile: '保留服务感但不增加酒精摄入', fit: '核实客人接受后提供' },
      ],
      serviceSequence: ['保持安全距离和冷静语气', '明确说明此刻不能继续供酒', '提供水或无酒精替代', '及时请主管到场支持', '按政策记录并在必要时请求安保或医疗协助'],
      vocabulary: [
        { term: 'responsible-service policy', meaning: '负责任酒水服务政策', example: 'Our responsible-service policy applies to every guest.' },
        { term: 'unable to serve', meaning: '无法继续提供', example: 'I’m unable to serve another alcoholic drink at this time.' },
        { term: 'non-alcoholic option', meaning: '无酒精替代', example: 'I can offer a non-alcoholic option instead.' },
        { term: 'assist us', meaning: '协助我们处理', example: 'Let me ask my supervisor to assist us.' },
      ],
      sentencePatterns: ['For your safety, I’m unable to serve another alcoholic drink at this time.', 'I can bring you water or a non-alcoholic option instead.', 'Let me ask my supervisor to assist us.', 'The beverage package remains subject to our responsible-service policy.'],
      decisionCheck: {
        question: '客人站立不稳，却用 beverage package 要求双份威士忌，你应该怎么处理？',
        options: [
          { id: 'a', text: '告诉客人 You are drunk，所以不能喝', correct: false, explanation: '给客人贴标签容易升级冲突，也不是最专业的安全表达。' },
          { id: 'b', text: '基于安全政策停止供酒，提供替代并通知主管', correct: true, explanation: '这是明确、尊重且符合 responsible service 的完整行动链。' },
          { id: 'c', text: '因为客人买了套餐，所以只给单份威士忌', correct: false, explanation: '把双份改成单份仍然是在继续供酒，套餐不能覆盖安全判断。' },
        ],
      },
      interviewTransfer: { question: 'How would you handle a guest who appears intoxicated and asks for another drink?', tip: '回答必须包含停止供酒、替代选择、主管介入和必要时的安全升级。' },
    },
  },
]

export const getReadinessLabel = (score) => {
  if (score >= 80) return '回答已经接近可面试状态'
  if (score >= 65) return '基础方向正确，仍需强化'
  if (score >= 50) return '能开口，但岗位证据不足'
  return '建议先按反馈重建回答'
}

export const getScoreDeltaMessage = (delta) => {
  if (delta >= 12) return '这次重练出现了明显提升，说明反馈已经转化成回答动作。'
  if (delta >= 5) return '回答有所提升，再补强具体动作和服务收尾会更稳定。'
  if (delta > 0) return '方向在改善，但变化还不够明显，建议继续针对最低项练习。'
  if (delta === 0) return '两次表现基本持平，需要把反馈转化成更具体的句子和动作。'
  return '第二次分数暂时下降并不代表退步，请放慢速度，先只改一个关键问题。'
}
