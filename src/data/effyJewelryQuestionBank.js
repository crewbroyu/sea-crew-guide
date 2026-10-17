// Effy jewelry sales question bank, the first specialist position under the retail department.
// Every question carries its own source type, so the page never presents a training question as a
// verified interview question. Ids stay fixed because reference answers and practice records key on
// them; the array order is the suggested study order (core first, then applied selling, then
// role knowledge), and `order` is renumbered to match.

export const EFFY_SOURCE_TYPES = {
  interview_report: '公开面经改写',
  recruitment_material: '招聘材料练习',
  skills_training: '岗位能力训练',
}

export const EFFY_STAGES = {
  core: '先练',
  apply: '接着练',
  extend: '再补',
}

const sources = {
  glassdoorInterviews: {
    label: 'Glassdoor：Effy Jewelry 面试评价（仅摘要）',
    url: 'https://www.glassdoor.com/Interview/Effy-Jewelry-Interview-Questions-E1696373.htm',
  },
  indeedProcess: {
    label: 'Indeed 问答：Effy 面试流程',
    url: 'https://www.indeed.com/cmp/Effy-Jewelry-1/faq/what-is-the-interview-process-like-at-effy-jewelry?quid=1e82ss2f84pdh800',
  },
  indeedQuestions: {
    label: 'Indeed 问答：Effy 面试问了什么',
    url: 'https://www.indeed.com/cmp/Effy-Jewelry-1/faq/what-questions-did-they-ask-during-your-interview-at-effy-jewelry?quid=1ebmbrueapc5k800',
  },
  indeedReviews: {
    label: 'Indeed：Effy Jewelry 员工评价',
    url: 'https://www.indeed.com/cmp/Effy-Jewelry-1/reviews',
  },
  glassdoorReview: {
    label: 'Glassdoor：Effy 船上销售员工评价（仅摘要）',
    url: 'https://www.glassdoor.com/Reviews/Employee-Review-Effy-Jewelry-E1696373-RVW96343326.htm',
  },
  hiringEvent: {
    label: 'AllCruiseJobs：Effy Sales Specialists / Presenters 招聘',
    url: 'https://www.allcruisejobs.com/i59455/sales-specialists-presenters-onboard-luxury-cruise-ship-effy-jewellery/',
  },
  cruiseCriticPrice: {
    label: 'Cruise Critic：乘客关于 Effy 价格的讨论',
    url: 'https://boards.cruisecritic.com/topic/2982620-effy-cruise-offer/',
  },
  consumerRescue: {
    label: 'Consumer Rescue：船上钻石项链纠纷报道',
    url: 'https://consumerrescue.org/cruise-fiascos/rccl-caribbean-cruise-diamond-necklace-fiasco-help/',
  },
  gia4c: { label: 'GIA：钻石 4C', url: 'https://4cs.gia.edu/en-us/' },
  giaLabGrown: {
    label: 'GIA：仿钻、莫桑石与培育钻石',
    url: 'https://4cs.gia.edu/en-us/simulants-moissanite-and-lab-grown-diamonds/',
  },
  giaTreatment: { label: 'GIA：宝石优化处理简介', url: 'https://www.gia.edu/gem-treatment' },
  cbpDuty: {
    label: 'U.S. CBP：境外购物与免税额度',
    url: 'https://www.cbp.gov/travel/us-citizens/know-before-you-go/shopping-abroad-duty-free-gifts-household-items',
  },
}

const SELF_WRITTEN = '根据珠宝零售通行做法自编的情景题，没有对应的面经出处。'

// The three video prompts come from one agency post (2024); the page lets users pick their own
// answer time because no source gives a current, fleet-wide length requirement.
export const effyVideoPractice = {
  title: '视频三问练习',
  sourceNote: '据 2024 年国内中介招聘材料设计（公众号“邮轮村”2024-02-29《EFFY（爱妃）珠宝诚聘驻邮轮销售》）：申请时需上传一段回答这三个问题的视频。现在的招聘是否仍要求视频、时长多少，以中介最新通知为准。',
  durations: [60, 90, 120, 180],
  prompts: [
    {
      id: 'ejv_1',
      question: 'Introduce yourself. What are your personal strengths?',
      outline: ['姓名、现在做什么、和零售或服务相关的经历', '两个最能代表你的优点，每个配一个真实小例子', '一句话说明这些优点怎样用在船上珠宝销售'],
      checks: ['开头 10 秒内说清自己是谁', '优点有具体例子，不只是形容词', '没有照着稿子念，语速平稳'],
    },
    {
      id: 'ejv_2',
      question: 'What does Effy jewelry retail mean to you?',
      outline: ['你理解的珠宝零售：帮客人纪念旅途和重要时刻', '你看重的东西：诚实介绍产品、长期客户关系', '你为什么想在 Effy 做这份工作'],
      checks: ['讲的是自己的理解，不是背品牌介绍', '提到对客人诚实', '和自己的经历或目标连起来'],
    },
    {
      id: 'ejv_3',
      question: 'Which Effy collections do you know, and which piece would you show a guest first?',
      outline: ['先在 Effy 官网看系列页面，只说你核实过的系列名', '选一件具体款式，说清材质、宝石和适合的客人', '说明你会先问客人什么问题再推荐'],
      checks: ['系列名和产品信息都来自官方资料', '推荐前先问客人需求', '没有夸大价格优势或投资价值'],
    },
  ],
}

const coreQuestions = [
  { id: 'ej_31', stage: 'core', question: 'Introduce yourself and tell us what you are doing now and which experience is most relevant to this role.', difficulty: 'easy', category: 'foundation', tip: 'Give your current role, one or two relevant experiences in retail or service, and why they lead to jewelry sales. Keep it under a minute.', tipZh: '现在在做什么 → 最相关的经历 → 为什么来做珠宝销售，一分钟内讲完。', keywords: ['current role', 'experience', 'retail', 'service', 'relevant'], followUps: ['Why are you leaving your current job?', 'Which part of that experience matters most for selling jewelry?'], sourceType: 'interview_report', source: sources.indeedQuestions, sourceNote: '改写自 Indeed 上 2024 年一位 Brand Ambassador 候选人的回答（已全文核对）：现场一对一面试时被问到“你目前在做什么”。自我介绍部分是配套练习。' },
  { id: 'ej_02', stage: 'core', question: 'Tell me about the most expensive item you have ever sold. How did you get there?', difficulty: 'medium', category: 'behavioral', tip: 'Give an honest figure and walk through discovery, presentation, the guest’s hesitation, and how you closed without pressure.', tipZh: '用真实数字，按“了解需求 → 展示 → 客人犹豫 → 怎么成交”的顺序讲，不要编。', keywords: ['high value', 'discovery', 'hesitation', 'close', 'result'], followUps: ['Why was the customer hesitant at first?', 'What exactly did you do yourself?', 'What was the final result, and what would you do differently next time?'], sourceType: 'interview_report', source: sources.glassdoorInterviews, sourceNote: 'Glassdoor 摘要显示 Jewelry Sales Associate 候选人被问到“说说你的销售经历”（年份未显示，未能打开全文）。本题把它具体化为最高单笔销售。' },
  { id: 'ej_32', stage: 'core', question: 'Why Effy? What do you know about our company?', difficulty: 'medium', category: 'foundation', tip: 'Use facts you checked on Effy’s official materials, such as its history and onboard boutiques, then connect them to what you value in jewelry retail. Do not invent figures.', tipZh: '只用在 Effy 官方资料里核实过的事实，再落到你自己为什么认同。', keywords: ['Effy', 'brand', 'research', 'values', 'motivation'], followUps: ['Which Effy piece would you show a guest first, and why?', 'How is selling jewelry onboard different from selling it in a mall?'], sourceType: 'interview_report', source: sources.glassdoorInterviews, sourceNote: 'Glassdoor 摘要里有候选人被问到“为什么选 Effy”和创始人的经历（未能打开全文）。2024 年国内招聘材料的视频题也要求谈 Effy 珠宝零售。这不代表每场面试都会问到原题。' },
  { id: 'ej_01', stage: 'core', question: 'Why do you want to sell fine jewelry on a cruise ship rather than general retail?', difficulty: 'easy', category: 'foundation', tip: 'Connect a real interest in jewelry to the role: product depth, longer consultations, and high-value guest trust, not only commission.', keywords: ['jewelry', 'motivation', 'consultation', 'trust', 'commission'], sourceType: 'skills_training', sourceNote: '动机类基础题。' + SELF_WRITTEN },
  { id: 'ej_35', stage: 'core', question: 'What motivates you in a sales role?', difficulty: 'medium', category: 'foundation', tip: 'Name one real driver, such as helping a guest choose well or reaching a goal you set, and back it with an example. Commission can be part of it but should not be the whole answer.', tipZh: '说一个真实的动力，配一个例子；可以提收入，但不要只说钱。', keywords: ['motivation', 'goal', 'guest', 'example', 'honest'], followUps: ['Tell me about a week when that motivation was tested.'], sourceType: 'interview_report', source: sources.glassdoorInterviews, sourceNote: 'Glassdoor 摘要：一位销售岗候选人 2026 年的终面问到“是什么在驱动你”（单条评价，未能打开全文）。' },
  { id: 'ej_33', stage: 'core', question: 'Why are you the candidate we should hire? Give me your 30-second pitch.', difficulty: 'hard', category: 'foundation', tip: 'Lead with one result you can prove, add one strength that fits onboard jewelry sales, and finish with what you will bring to the team in your first contract.', tipZh: '一个能证明的成绩 + 一个适合船上珠宝销售的优点 + 第一个合同能带来什么。', keywords: ['pitch', 'result', 'strength', 'fit', 'contribution'], followUps: ['What result can you point to that proves it?', 'What is one weakness we should know about?'], sourceType: 'interview_report', source: sources.glassdoorInterviews, sourceNote: 'Glassdoor 摘要：一位销售岗候选人 2026 年终面被要求说明自己为什么是最值得录用的人（单条评价，未能打开全文）。' },
  { id: 'ej_34', stage: 'core', question: 'You have no jewelry or cruise experience. Why should we take you?', difficulty: 'hard', category: 'behavioral', tip: 'Point to transferable sales or service results, show what you have already learned about jewelry, and show you understand contract life.', tipZh: '讲可迁移的销售或服务成绩、已经自学的珠宝知识、对合同生活的了解。', keywords: ['transferable', 'learning', 'sales', 'service', 'contract'], followUps: ['What have you already done to learn about jewelry?', 'A guest knows more about diamonds than you do. What do you do?'], sourceType: 'interview_report', source: sources.indeedProcess, sourceNote: '根据 Indeed 上 2024 年一位候选人的回答设计（已全文核对）：对方因没有珠宝和邮轮经验被拒。这是落选原因，不是面试原题。' },
]
const applyQuestions = [
  { id: 'ej_15', stage: 'apply', question: 'Sell me this pendant.', difficulty: 'medium', category: 'demonstration', tip: 'Ask a discovery question first, then describe two or three verified features as benefits for the person, and ask for the sale naturally.', tipZh: '先问一个了解需求的问题，再讲两三个核实过的卖点，自然地请对方做决定。', keywords: ['discovery', 'features', 'benefits', 'close', 'demonstration'], followUps: ['I am not sure. It feels expensive.', 'Why should I buy it here instead of at home?'], sourceType: 'interview_report', source: sources.glassdoorInterviews, sourceNote: 'Glassdoor 摘要：2025 年纽约一位 Jewelry Sales Associate 候选人被要求“卖个东西给我，说服我买”（未能打开全文）。' },
  { id: 'ej_06', stage: 'apply', question: 'A guest says, "I am just looking at the window." How do you start a conversation?', difficulty: 'easy', category: 'sales', tip: 'Open with an observation or a light question about the piece they are looking at, invite them to try it on, and respect a no.', keywords: ['greeting', 'observation', 'try on', 'no pressure', 'browse'], sourceType: 'skills_training', sourceNote: SELF_WRITTEN },
  { id: 'ej_07', stage: 'apply', question: 'What questions would you ask before recommending an anniversary gift?', difficulty: 'medium', category: 'sales', tip: 'Ask who it is for, what they already wear, metal and style preference, the occasion story, and a comfortable budget range.', keywords: ['discovery', 'occasion', 'style', 'metal', 'budget'], sourceType: 'skills_training', sourceNote: SELF_WRITTEN },
  { id: 'ej_11', stage: 'apply', question: 'A guest likes a ring but says the price is too high. How do you respond?', difficulty: 'medium', category: 'sales', tip: 'Acknowledge it, ask what matters most to them, explain value from verified quality factors, and offer a real alternative if it fits better.', tipZh: '先认可顾虑，问清客人最在意什么，用核实过的品质说明价值，合适时给真实的替代选择。', keywords: ['price', 'value', 'quality', 'alternative', 'acknowledge'], followUps: ['Can you give me a discount?', 'I will think about it and come back later.'], sourceType: 'skills_training', sourceNote: SELF_WRITTEN },
  { id: 'ej_12', stage: 'apply', question: 'A guest says they saw the same piece cheaper in a shop at the last port. What do you do?', difficulty: 'hard', category: 'scenario', tip: 'Do not criticise the other shop. Explain what you can verify about your piece, its documentation and after-sales support, and let the guest decide.', keywords: ['comparison', 'port', 'documentation', 'after-sales', 'respect'], followUps: ['What if they say a department store at home sells it for less?'], sourceType: 'skills_training', source: sources.cruiseCriticPrice, sourceNote: '情景依据：Cruise Critic 上乘客 2025 年的讨论，提到在港口门店之间、和美国商场比价。这是乘客经历，不是面试题。' },
  { id: 'ej_13', stage: 'apply', question: 'A couple cannot decide between two engagement rings. How do you help them choose?', difficulty: 'medium', category: 'demonstration', tip: 'Compare them side by side on what they said matters, let them see both in different light, and ask which one they keep coming back to.', keywords: ['compare', 'priorities', 'light', 'decision', 'couple'], sourceType: 'skills_training', sourceNote: SELF_WRITTEN },
  { id: 'ej_23', stage: 'apply', question: 'Jewelry sales onboard are often driven by in-store events. How would you invite guests without being pushy?', difficulty: 'medium', category: 'sales', tip: 'Give a short, specific reason the event is worth their time, accept a no politely, and focus on guests who already showed interest.', keywords: ['event', 'invitation', 'specific', 'no pressure', 'interest'], sourceType: 'recruitment_material', source: sources.hiringEvent, sourceNote: '依据 2026 年 Effy 招聘广告：岗位职责包括主持活动和讲座、对大群客人讲解。是岗位要求，不是面经题。' },
  { id: 'ej_22', stage: 'apply', question: 'How would you build a relationship with a guest over a seven-night cruise?', difficulty: 'medium', category: 'sales', tip: 'Remember names and preferences, invite them to store events, follow up on pieces they liked, and never chase them around the ship.', keywords: ['relationship', 'names', 'events', 'follow-up', 'respect'], sourceType: 'skills_training', sourceNote: SELF_WRITTEN },
  { id: 'ej_25', stage: 'apply', question: 'How do you handle a month where you are well below your sales target?', difficulty: 'hard', category: 'ship_life', tip: 'Review what changed, ask your manager and top sellers for advice, focus on what you can control, and keep the guest experience honest.', tipZh: '复盘原因、请教经理和销售好的同事、做能控制的事，不靠误导客人追业绩。', keywords: ['target', 'review', 'advice', 'control', 'resilience'], followUps: ['What would you never do to hit a target?'], sourceType: 'skills_training', source: sources.glassdoorReview, sourceNote: '背景依据：一条 2025 年的员工评价提到每周销售目标压力大（未能打开全文）。这是员工经历，不是面试题。' },
  { id: 'ej_24', stage: 'apply', question: 'A colleague is helping a guest who then asks you for the price. How do you handle it?', difficulty: 'medium', category: 'teamwork', tip: 'Respect your colleague’s guest, answer politely and bring them back in, and follow the store’s rules on shared sales.', keywords: ['colleague', 'shared sale', 'respect', 'teamwork', 'commission'], sourceType: 'skills_training', sourceNote: SELF_WRITTEN },
  { id: 'ej_28', stage: 'apply', question: 'How would you sell to a guest whose English is limited?', difficulty: 'medium', category: 'communication', tip: 'Use simple words, gestures and the product itself, write down prices clearly, and confirm the key details before payment.', keywords: ['language', 'simple', 'gestures', 'confirm', 'patience'], sourceType: 'skills_training', sourceNote: SELF_WRITTEN },
  { id: 'ej_29', stage: 'apply', question: 'Long sea days with long hours on your feet are normal in onboard retail. How will you stay at your best?', difficulty: 'medium', category: 'ship_life', tip: 'Talk about real routines for rest, presentation and energy, and show you understand the schedule changes between sea and port days.', keywords: ['sea day', 'hours', 'routine', 'energy', 'presentation'], sourceType: 'skills_training', source: sources.indeedReviews, sourceNote: '背景依据：一位员工 2025 年在 Indeed 上描述过海上日和港口日的工作时段。各船、各合同不同，不要当作标准答案背。' },
  { id: 'ej_30', stage: 'apply', question: 'Where do you see yourself in the jewelry business in three years?', difficulty: 'medium', category: 'foundation', tip: 'Show realistic growth, such as deeper gemological knowledge, a senior sales role, or store management, and how this contract helps.', keywords: ['growth', 'gemology', 'senior', 'management', 'goals'], followUps: ['And five years from now?'], sourceType: 'interview_report', source: sources.glassdoorInterviews, sourceNote: 'Glassdoor 摘要：一位候选人 2026 年终面被问到五年规划（单条评价，未能打开全文）。本题保留三年，五年放在追问里。' },
]
const extendQuestions = [
  { id: 'ej_03', stage: 'extend', question: 'Explain the 4Cs of a diamond to a guest who has never bought one.', difficulty: 'easy', category: 'knowledge', tip: 'Cut, colour, clarity and carat weight, in plain language, and explain that cut has the biggest effect on sparkle.', keywords: ['cut', 'colour', 'clarity', 'carat', 'sparkle'], sourceType: 'skills_training', source: sources.gia4c, sourceNote: '知识点参考 GIA 公开资料。这个链接说明知识内容，不是面经出处。' },
  { id: 'ej_04', stage: 'extend', question: 'What is the difference between 14K and 18K gold, and which would you suggest for everyday wear?', difficulty: 'easy', category: 'knowledge', tip: '14K is about 58% gold and harder wearing; 18K is 75% gold, richer in colour and softer. Ask how the guest will wear it before suggesting.', keywords: ['14K', '18K', 'durability', 'colour', 'everyday'], sourceType: 'skills_training', sourceNote: '贵金属常识题，具体以门店培训资料为准。' },
  { id: 'ej_05', stage: 'extend', question: 'A guest asks why her white gold ring looks slightly yellow after a few years. What do you tell her?', difficulty: 'medium', category: 'knowledge', tip: 'White gold is usually rhodium plated; the plating wears and can be redone. Explain care honestly and the approved after-sales option.', keywords: ['white gold', 'rhodium', 'plating', 'care', 'after-sales'], sourceType: 'skills_training', sourceNote: '贵金属常识题，售后选项以门店政策为准。' },
  { id: 'ej_10', stage: 'extend', question: 'Name some gemstones guests often ask about and one thing you would tell them about each.', difficulty: 'medium', category: 'knowledge', tip: 'Pick a few you know well, such as sapphire, emerald, tanzanite or opal, and give one accurate point on colour, hardness or care.', keywords: ['gemstones', 'hardness', 'colour', 'care', 'accuracy'], sourceType: 'skills_training', sourceNote: '宝石常识题，内容以门店培训资料和公开宝石学资料为准。' },
  { id: 'ej_20', stage: 'extend', question: 'How would you explain caring for jewelry to a guest who is on holiday?', difficulty: 'easy', category: 'knowledge', tip: 'Remove before swimming, sunscreen and the gym, store pieces separately, and clean them gently. Mention stone-specific care where it matters.', keywords: ['care', 'chlorine', 'storage', 'cleaning', 'stone'], sourceType: 'skills_training', sourceNote: '保养常识题。' + SELF_WRITTEN },
  { id: 'ej_27', stage: 'extend', question: 'A guest asks you a question about a stone you do not know. What do you do?', difficulty: 'easy', category: 'integrity', tip: 'Say you will check, use the product information or ask a more experienced colleague, and come back with an accurate answer.', keywords: ['honesty', 'check', 'colleague', 'accuracy', 'learning'], sourceType: 'skills_training', sourceNote: SELF_WRITTEN },
  { id: 'ej_08', stage: 'extend', question: 'A guest asks whether a diamond is natural or lab-grown. How do you answer?', difficulty: 'medium', category: 'integrity', tip: 'Answer only from the item’s documentation, state the origin clearly, and never blur the difference to make a sale. What you say about origin and carat weight must match the paperwork.', tipZh: '只按商品单据回答来源，口头说的来源和克拉数必须和书面一致。', keywords: ['natural', 'lab-grown', 'disclosure', 'documentation', 'honesty'], followUps: ['The paperwork has not arrived yet. What do you tell the guest?', 'The guest asks you to just say it is natural. What do you say?'], sourceType: 'skills_training', source: sources.giaLabGrown, sourceNote: '知识点参考 GIA 公开资料。Consumer Rescue 2025 年报道过一起船上钻饰的天然/培育来源和克拉数纠纷，可作背景。不是面经题。' },
  { id: 'ej_09', stage: 'extend', question: 'A guest asks if a sapphire has been treated. What do you say?', difficulty: 'hard', category: 'integrity', tip: 'Many coloured stones are heat treated, which is common and stable. Disclose what the documentation says and do not guess.', keywords: ['treatment', 'heat', 'disclosure', 'documentation', 'gemstone'], sourceType: 'skills_training', source: sources.giaTreatment, sourceNote: '知识点参考 GIA 公开资料。这个链接说明知识内容，不是面经出处。' },
  { id: 'ej_19', stage: 'extend', question: 'What documents should a guest receive with a significant diamond purchase, and how do you explain them?', difficulty: 'medium', category: 'knowledge', tip: 'Check which documents this piece actually comes with, such as a detailed receipt, a grading report or a warranty, and when each will be handed over. Explain each one exactly as provided, and if one is not ready, tell the guest honestly and follow the store’s process for completing it.', tipZh: '先核实这件商品实际附带哪些文件、各自什么时候交付；没准备好的要如实说明，按门店流程补齐，不要替所有商品承诺统一条件。', keywords: ['receipt', 'grading report', 'warranty', 'delivery', 'honesty'], followUps: ['A document will not be ready before the guest leaves the ship. What do you do?'], sourceType: 'skills_training', source: sources.consumerRescue, sourceNote: '情景依据：Consumer Rescue 2025 年的消费者报道，客人下船前没收到证书、收据描述过于简单。这是消费纠纷，不是面经题。' },
  { id: 'ej_18', stage: 'extend', question: 'A guest asks whether they will have to pay duty when they take the jewelry home. How do you answer?', difficulty: 'medium', category: 'knowledge', tip: 'Allowances depend on the destination country. Give the approved information, suggest they check official guidance, and never promise a tax outcome.', keywords: ['duty', 'customs', 'allowance', 'approved information', 'accuracy'], sourceType: 'skills_training', source: sources.cbpDuty, sourceNote: '以美国 CBP 的公开规定为例；其他国家的客人以当地官方信息为准。' },
  { id: 'ej_21', stage: 'extend', question: 'A guest returns on the last day and wants to return a bracelet bought earlier in the cruise. What do you do?', difficulty: 'hard', category: 'scenario', tip: 'Listen to the reason first, check the item and the store’s return policy, offer what the policy allows, and involve the manager if needed.', keywords: ['return', 'policy', 'listen', 'manager', 'service'], sourceType: 'skills_training', sourceNote: SELF_WRITTEN },
  { id: 'ej_16', stage: 'extend', question: 'You are showing several high-value pieces and the store suddenly gets busy. What do you do?', difficulty: 'hard', category: 'security', tip: 'Follow the one-item-at-a-time and locked-showcase rules, count pieces back before helping the next guest, and ask a colleague for cover.', keywords: ['security', 'showcase', 'count', 'busy', 'colleague'], sourceType: 'skills_training', sourceNote: SELF_WRITTEN },
  { id: 'ej_17', stage: 'extend', question: 'You notice a guest trying to distract you while another person stands near an open showcase. How do you react?', difficulty: 'hard', category: 'security', tip: 'Stay calm and polite, close and lock the showcase, keep items in view, and alert the team through the approved process. Do not accuse anyone.', keywords: ['distraction', 'lock', 'alert', 'calm', 'procedure'], sourceType: 'skills_training', sourceNote: SELF_WRITTEN },
  { id: 'ej_14', stage: 'extend', question: 'How do you size a ring for a guest, and what if the ring is a surprise?', difficulty: 'medium', category: 'operations', tip: 'Use the store’s sizer and explain fit changes with temperature. For a surprise, use approved options such as a borrowed ring and the resizing policy.', keywords: ['sizing', 'fit', 'surprise', 'resizing', 'policy'], sourceType: 'skills_training', sourceNote: SELF_WRITTEN },
  { id: 'ej_26', stage: 'extend', question: 'A guest wants to pay part in cash and part on card for a large purchase. What do you check?', difficulty: 'medium', category: 'operations', tip: 'Follow the store’s split-payment and high-value procedures, count cash carefully, verify the card and get a manager if a limit applies.', keywords: ['payment', 'split', 'cash', 'card', 'procedure'], sourceType: 'skills_training', sourceNote: SELF_WRITTEN },
]

export const effyJewelryBank = {
  positionName: 'Effy 珠宝销售',
  positionNameEn: 'Effy Jewelry Sales',
  questions: [...coreQuestions, ...applyQuestions, ...extendQuestions].map((question, index) => ({ ...question, order: index + 1 })),
  knowledge: [
    { id: 'ej_k01', content: 'Explain the 4Cs of diamond quality in plain language' },
    { id: 'ej_k02', content: 'Know common gold karats, white gold rhodium plating, platinum and sterling silver' },
    { id: 'ej_k03', content: 'Disclose natural or lab-grown origin and gemstone treatments only from documentation' },
    { id: 'ej_k04', content: 'Follow one-item-at-a-time and locked-showcase security rules' },
    { id: 'ej_k05', content: 'Check which documents a piece comes with and when each is handed over' },
    { id: 'ej_k06', content: 'Give approved customs information without promising a tax outcome' },
    { id: 'ej_k07', content: 'Size rings accurately and know the resizing policy' },
    { id: 'ej_k08', content: 'Give stone-specific care advice for guests on holiday' },
    { id: 'ej_k09', content: 'Follow high-value payment and split-payment procedures' },
    { id: 'ej_k10', content: 'Build guest relationships across the cruise without pressure selling' },
  ],
}
