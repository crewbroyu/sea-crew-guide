// src/data/assessmentData.js

export const SERVICE_BACKGROUNDS = [
  { id: 'bar_server', label: '酒吧服务（Bar Server）' },
  { id: 'restaurant', label: '餐厅服务（Restaurant）' },
  { id: 'housekeeping', label: '客房服务（Housekeeping）' },
  { id: 'front_office', label: '前台服务（Front Office）' },
  { id: 'retail', label: '免税店服务（Retail）' },
  { id: 'youth_staff', label: '儿童看护（Youth Staff）' },
  { id: 'kitchen', label: '厨房工作（Kitchen）' },
  { id: 'utility', label: '后勤清洁（Utility）' },
  { id: 'none', label: '暂无服务行业经验' },
];

export const DIMENSIONS = [
  {
    id: 'professional',
    name: '专业服务知识',
    icon: 'BookOpen',
    weight: 0.20,
    description: '邮轮服务标准、卫生规范与优先级判断',
  },
  {
    id: 'english',
    name: '英语听说能力',
    icon: 'Languages',
    weight: 0.25,
    description: '船上指令理解、专业词汇与场景应答',
  },
  {
    id: 'interview',
    name: '面试表达能力',
    icon: 'MessageSquare',
    weight: 0.20,
    description: 'STAR结构化表达与自我展示',
  },
  {
    id: 'personality',
    name: '职业性格特质',
    icon: 'Heart',
    weight: 0.15,
    description: '情绪耐受、边界感与跨文化协作',
  },
  {
    id: 'adaptability',
    name: '服务应变意识',
    icon: 'Zap',
    weight: 0.20,
    description: '突发处理、多任务与团队协作',
  },
];

// 维度一的题目按服务背景分组
export const PROFESSIONAL_QUESTIONS = {
  bar_server: [
    {
      id: 'p-bar-1',
      scenario: '一位客人点了一杯 Dry Martini，然后跟你说 "make it dirty"。他的意思是？',
      options: [
        { id: 'a', text: '加一点橄榄汁（olive brine）', score: 3 },
        { id: 'b', text: '不加冰', score: 0 },
        { id: 'c', text: '多加一份酒精', score: 0 },
        { id: 'd', text: '不太确定，需要查配方手册', score: 1 },
      ],
      maxScore: 3,
    },
    {
      id: 'p-bar-2',
      scenario: '一位客人明显醉酒、走路不稳，但坚持要再来一杯。他的朋友在旁边说"没事，给他倒吧"。',
      options: [
        { id: 'a', text: '朋友都说没事了，再给他倒一杯', score: 0 },
        { id: 'b', text: '礼貌但坚定地拒绝继续供酒，推荐水或软饮，必要时通知值班经理', score: 3 },
        { id: 'c', text: '假装没听到，先忙别的', score: 0 },
        { id: 'd', text: '给他倒一杯，但偷偷把酒精含量减半', score: 1 },
      ],
      maxScore: 3,
    },
    {
      id: 'p-bar-3',
      scenario: 'Happy Hour 时段，吧台前排了8位客人，其中一位开始抱怨等太久了。你手上正在做一杯复杂的鸡尾酒。',
      options: [
        { id: 'a', text: '停下手上的酒，先过去道歉安抚', score: 1 },
        { id: 'b', text: '边做酒边用眼神和微笑致意，做完后立刻过去，先问等候最久的客人点单', score: 3 },
        { id: 'c', text: '大声说"马上就好，稍等！"', score: 0 },
        { id: 'd', text: '加快手速，做完后按顺序一个一个来', score: 2 },
      ],
      maxScore: 3,
    },
  ],
  restaurant: [
    {
      id: 'p-food-1',
      scenario: '主管突然抽检你负责的自助餐台，用温度探针测了一道热菜，问你 USPH 标准要求热食内部温度保持在多少以上？',
      options: [
        { id: 'a', text: '60°C（140°F）以上', score: 3 },
        { id: 'b', text: '50°C 以上', score: 1 },
        { id: 'c', text: '只要客人没投诉应该就没问题', score: 0 },
      ],
      maxScore: 3,
    },
    {
      id: 'p-food-2',
      scenario: '你正在给一桌客人上主菜，余光看到旁边桌的一位老人碰翻了玻璃杯，碎片散落在过道上。',
      options: [
        { id: 'a', text: '先把手里的主菜稳稳放好，然后立刻去处理碎片', score: 2 },
        { id: 'b', text: '立刻放下手中的菜，先用身体或椅子挡住碎片区域防止其他客人踩到，同时呼叫同事协助清理', score: 3 },
        { id: 'c', text: '先把这桌菜上完，再通知 busboy 去清理', score: 1 },
        { id: 'd', text: '大声提醒附近客人小心碎片', score: 1 },
      ],
      maxScore: 3,
    },
    {
      id: 'p-food-3',
      scenario: '正式晚宴上，你需要为客人进行分餐式上菜（plated service），同时提供饮品。正确的操作方式是？',
      options: [
        { id: 'a', text: '左侧上菜，右侧撤盘，饮品从右侧服务', score: 3 },
        { id: 'b', text: '右侧统一上菜和撤盘', score: 1 },
        { id: 'c', text: '看哪边空间大就从哪边', score: 0 },
      ],
      maxScore: 3,
    },
  ],
  housekeeping: [
    {
      id: 'p-hk-1',
      scenario: '按照 USPH 标准，打扫客房时马桶和洗手台可以用同一块抹布吗？',
      options: [
        { id: 'a', text: '可以，只要消过毒就行', score: 0 },
        { id: 'b', text: '绝对不可以，必须使用不同颜色编码的抹布分区清洁', score: 3 },
        { id: 'c', text: '先擦洗手台再擦马桶就可以了', score: 1 },
      ],
      maxScore: 3,
    },
    {
      id: 'p-hk-2',
      scenario: '打扫房间时，你发现客人把贵重珠宝散放在桌上，客人不在房间。',
      options: [
        { id: 'a', text: '继续打扫，不碰那些东西，打扫完直接离开', score: 1 },
        { id: 'b', text: '帮客人把珠宝整理到一起，方便客人', score: 0 },
        { id: 'c', text: '不碰珠宝，完成清洁后记录情况并报告给主管', score: 3 },
        { id: 'd', text: '打电话提醒客人注意保管贵重物品', score: 2 },
      ],
      maxScore: 3,
    },
    {
      id: 'p-hk-3',
      scenario: '你还有3间房没打扫完，这时收到通知——一位客人报告浴室漏水。',
      options: [
        { id: 'a', text: '先把手上这间房做完再去处理', score: 0 },
        { id: 'b', text: '立刻去查看漏水情况，严重的话先做紧急处理并联系维修部门，再回来继续打扫', score: 3 },
        { id: 'c', text: '通知前台让他们安排人去处理，自己继续打扫', score: 2 },
      ],
      maxScore: 3,
    },
  ],
  front_office: [
    {
      id: 'p-fo-1',
      scenario: '一位客人办理入住时，信用卡被拒绝，他说卡里有钱，情绪开始激动。你会怎么做？',
      options: [
        { id: 'a', text: '微笑安抚客人，建议换一张卡或使用其他支付方式，同时悄悄联系主管协助', score: 3 },
        { id: 'b', text: '直接告诉客人"您的卡有问题，换一张吧"', score: 1 },
        { id: 'c', text: '让客人稍等，自己去后台查原因', score: 2 },
        { id: 'd', text: '建议客人去ATM取钱支付现金', score: 1 },
      ],
      maxScore: 3,
    },
    {
      id: 'p-fo-2',
      scenario: '凌晨3点，一位客人从岸上回来，说房间钥匙卡丢了，要你帮忙开门。',
      options: [
        { id: 'a', text: '核对客人身份信息，确认无误后陪客人回房间开门，提醒他第二天去前台补办', score: 3 },
        { id: 'b', text: '直接给客人一张新的钥匙卡', score: 1 },
        { id: 'c', text: '让客人自己想办法，明天再处理', score: 0 },
        { id: 'd', text: '打电话给客房部让他们处理', score: 2 },
      ],
      maxScore: 3,
    },
    {
      id: 'p-fo-3',
      scenario: '一位VIP客人预订了海景房，但到店后发现房间朝向不好，强烈要求换房，而所有海景房都已满。',
      options: [
        { id: 'a', text: '道歉并解释情况，主动提出免费升级到更高等级的房间或提供其他补偿', score: 3 },
        { id: 'b', text: '说"房间已经订满了，没办法"', score: 0 },
        { id: 'c', text: '让客人等一下，看看有没有取消的房间', score: 1 },
        { id: 'd', text: '建议客人接受现有房间，下次优先安排', score: 2 },
      ],
      maxScore: 3,
    },
  ],
  retail: [
    {
      id: 'p-retail-1',
      scenario: '一位客人在免税店看中一款手表，犹豫是否购买，担心价格不是最低。你会如何处理？',
      options: [
        { id: 'a', text: '介绍产品的品质和船上免税价格的优势，提供专业建议但不强迫购买', score: 3 },
        { id: 'b', text: '说"这已经是最低价了，过了这个村就没这个店"', score: 1 },
        { id: 'c', text: '让客人自己考虑，去忙别的客人', score: 0 },
        { id: 'd', text: '承诺如果发现更便宜的可以退款', score: 1 },
      ],
      maxScore: 3,
    },
    {
      id: 'p-retail-2',
      scenario: '一位客人购买了一瓶香水，离开10分钟后回来要求退货，说不喜欢味道。',
      options: [
        { id: 'a', text: '查看商品是否完好，按退换货政策处理，同时推荐其他适合的产品', score: 3 },
        { id: 'b', text: '说"香水开封后不能退"', score: 0 },
        { id: 'c', text: '直接给客人退款，不管规定', score: 1 },
        { id: 'd', text: '让客人去找经理', score: 1 },
      ],
      maxScore: 3,
    },
    {
      id: 'p-retail-3',
      scenario: '船上促销活动期间，多位客人同时询问不同商品，你一个人忙不过来。',
      options: [
        { id: 'a', text: '微笑致意，按顺序服务，对等待的客人说"Ill be with you shortly"', score: 3 },
        { id: 'b', text: '优先服务看起来购买意向强的客人', score: 1 },
        { id: 'c', text: '大声说"大家排队，一个一个来"', score: 0 },
        { id: 'd', text: '呼叫同事过来帮忙', score: 2 },
      ],
      maxScore: 3,
    },
  ],
  youth_staff: [
    {
      id: 'p-ys-1',
      scenario: '你在儿童俱乐部带5-7岁的孩子做手工，一个孩子突然开始哭闹，说想妈妈。',
      options: [
        { id: 'a', text: '蹲下来安抚孩子，用温和的语气转移注意力，同时联系家长', score: 3 },
        { id: 'b', text: '让其他孩子继续玩，带这个孩子去安静的地方', score: 2 },
        { id: 'c', text: '说"别哭了，妈妈一会儿就来了"', score: 1 },
        { id: 'd', text: '直接给家长打电话让他们来接', score: 0 },
      ],
      maxScore: 3,
    },
    {
      id: 'p-ys-2',
      scenario: '两个孩子在玩游戏时发生争执，其中一个动手推了另一个。',
      options: [
        { id: 'a', text: '立即分开两个孩子，了解情况后公平处理，教他们正确的解决方式', score: 3 },
        { id: 'b', text: '批评动手的孩子', score: 1 },
        { id: 'c', text: '让他们自己解决', score: 0 },
        { id: 'd', text: '把两个孩子分开，不让他们一起玩', score: 1 },
      ],
      maxScore: 3,
    },
    {
      id: 'p-ys-3',
      scenario: '一个孩子对花生过敏，家长特别交代过。但你发现另一个孩子带了花生酱三明治。',
      options: [
        { id: 'a', text: '立即让带花生酱的孩子去其他区域吃，清理周围环境，提醒所有孩子不要分享食物', score: 3 },
        { id: 'b', text: '让带花生酱的孩子把三明治收起来', score: 1 },
        { id: 'c', text: '告诉过敏孩子的家长', score: 2 },
        { id: 'd', text: '觉得应该没事，继续活动', score: 0 },
      ],
      maxScore: 3,
    },
  ],
  kitchen: [
    {
      id: 'p-kitchen-1',
      scenario: '厨师长让你准备10份牛排，其中3份要 medium rare，4份 medium，3份 well done。你会如何确保不会弄错？',
      options: [
        { id: 'a', text: '用不同颜色的餐碟标记，每煎好一份就记录，最后再核对一遍', score: 3 },
        { id: 'b', text: '凭记忆做，应该不会错', score: 0 },
        { id: 'c', text: '让同事帮忙记', score: 1 },
        { id: 'd', text: '先做一种熟度，再做另一种', score: 2 },
      ],
      maxScore: 3,
    },
    {
      id: 'p-kitchen-2',
      scenario: '你发现冰箱里的三文鱼闻起来有点不对，但还没到保质期。',
      options: [
        { id: 'a', text: '立即报告给厨师长，按食品安全规定处理', score: 3 },
        { id: 'b', text: '再闻闻看，可能是冰的味道', score: 1 },
        { id: 'c', text: '切一点尝尝，没坏就用', score: 0 },
        { id: 'd', text: '把它放到另一边，不用它', score: 1 },
      ],
      maxScore: 3,
    },
    {
      id: 'p-kitchen-3',
      scenario: '高峰时段，传菜员催菜很急，你负责的菜还没完全做好。',
      options: [
        { id: 'a', text: '按标准完成烹饪，同时告知传菜员预计时间', score: 3 },
        { id: 'b', text: '加快速度，可能会影响一点质量', score: 1 },
        { id: 'c', text: '让传菜员先上其他菜', score: 2 },
        { id: 'd', text: '不管催，按自己的节奏做', score: 0 },
      ],
      maxScore: 3,
    },
  ],
  utility: [
    {
      id: 'p-utility-1',
      scenario: '你负责清洁餐厅，发现地面有大片油污，用普通清洁剂擦不掉。',
      options: [
        { id: 'a', text: '使用专门的油污清洁剂，按比例稀释后彻底清洁', score: 3 },
        { id: 'b', text: '用更多的普通清洁剂用力擦', score: 1 },
        { id: 'c', text: '先不管，等明天再说', score: 0 },
        { id: 'd', text: '找同事帮忙一起擦', score: 2 },
      ],
      maxScore: 3,
    },
    {
      id: 'p-utility-2',
      scenario: '你在清理垃圾时，发现一个垃圾桶里有客人丢弃的贵重物品。',
      options: [
        { id: 'a', text: '立即报告给主管，按失物招领流程处理', score: 3 },
        { id: 'b', text: '自己收起来，看看能不能找到失主', score: 0 },
        { id: 'c', text: '交给前台处理', score: 2 },
        { id: 'd', text: '当作没看见，继续工作', score: 0 },
      ],
      maxScore: 3,
    },
    {
      id: 'p-utility-3',
      scenario: '你的清洁区域包括厨房和餐厅，两个区域同时需要紧急清洁。',
      options: [
        { id: 'a', text: '先清洁厨房（食品安全优先），再清洁餐厅，同时告知相关部门预计完成时间', score: 3 },
        { id: 'b', text: '先清洁餐厅，因为客人看得见', score: 1 },
        { id: 'c', text: '同时做两个区域，可能两边都做不完', score: 0 },
        { id: 'd', text: '找主管安排其他人帮忙', score: 2 },
      ],
      maxScore: 3,
    },
  ],
  none: [
    {
      id: 'p-none-1',
      scenario: '你在餐厅帮忙摆放自助餐，发现一道菜放了快两个小时还剩很多，温度摸上去已经不太热了。',
      options: [
        { id: 'a', text: '继续放着，等客人吃完再撤', score: 0 },
        { id: 'b', text: '先把这道菜撤掉，通知厨房重新出一份新的', score: 3 },
        { id: 'c', text: '搅拌一下让它看起来更新鲜', score: 0 },
      ],
      maxScore: 3,
    },
    {
      id: 'p-none-2',
      scenario: '你在大厅工作，看到地上有一滩水渍，周围有客人在走动。你手上还端着一盘东西。',
      options: [
        { id: 'a', text: '先把手上的东西送到目的地再回来处理', score: 1 },
        { id: 'b', text: '先放下手上的东西，用任何可用物品标记或阻隔水渍区域，再去找人清理', score: 3 },
        { id: 'c', text: '跟路过的客人说一声"小心地滑"', score: 1 },
      ],
      maxScore: 3,
    },
    {
      id: 'p-none-3',
      scenario: '一位外国客人用英语问你一个问题，你没有完全听懂。',
      options: [
        { id: 'a', text: '微笑点头假装听懂了', score: 0 },
        { id: 'b', text: '礼貌地说"Sorry, could you say that again slowly?"，如果还是不懂就找英语好的同事帮忙', score: 3 },
        { id: 'c', text: '摇头走开', score: 0 },
        { id: 'd', text: '用手机翻译软件试着沟通', score: 2 },
      ],
      maxScore: 3,
    },
  ],
};

// 维度二：英语听说
export const ENGLISH_QUESTIONS = [
  {
    id: 'e-1',
    type: 'listening',
    scenario: 'Attention all crew members. This is a Bravo Bravo call. A fire has been reported on Deck 7, Section C, near the Windjammer Café. All designated fire team members report to your stations immediately. All other crew members, stand by for further instructions. Passengers should remain calm and stay in their current locations.',
    audioUrl: '', // 后期将替换为真实音频
    showText: false, // 纯听力模式，隐藏文字
    options: [
      { id: 'a', text: 'Deck 7 附近有火情，消防组成员立即到岗，其他船员原地待命', score: 3 },
      { id: 'b', text: '所有人都要去 Deck 7 帮忙灭火', score: 0 },
      { id: 'c', text: '大概听出是紧急情况，但不确定具体要求', score: 1 },
      { id: 'd', text: '让乘客全部回房间', score: 0 },
    ],
    maxScore: 3,
  },
  {
    id: 'e-2',
    type: 'multiple',
    scenario: '以下邮轮专业词汇，请选出你知道含义的：',
    options: [
      { id: 'v1', text: 'Muster Station / Muster Drill', score: 0.5 },
      { id: 'v2', text: 'Embarkation / Disembarkation', score: 0.5 },
      { id: 'v3', text: 'Galley', score: 0.5 },
      { id: 'v4', text: "Purser's Desk", score: 0.5 },
      { id: 'v5', text: 'Linen', score: 0.5 },
      { id: 'v6', text: 'Turndown Service', score: 0.5 },
      { id: 'v7', text: 'SeaPass', score: 0.5 },
      { id: 'v8', text: 'Shore Excursion', score: 0.5 },
    ],
    maxScore: 3,
  },
  {
    id: 'e-3',
    type: 'single',
    scenario: '一位客人走到你面前说："Excuse me, I lost my SeaPass card and I can\'t get into my cabin. What should I do?"\n\n以下哪个最接近你的真实回答能力？',
    options: [
      { id: 'a', text: '"I\'m sorry to hear that. Please don\'t worry — I\'ll escort you to Guest Services on Deck 5. They can verify your identity and issue a replacement card right away. May I have your cabin number?"', score: 3 },
      { id: 'b', text: '"Oh, you go to the front desk, they can help you. Deck 5. Ask them for a new card."', score: 2 },
      { id: 'c', text: '"No problem! First, can you tell me your name and cabin number? Wait, maybe you should go to Guest Services. They can help you better."', score: 2 },
      { id: 'd', text: '"Sorry, I don\'t know. Maybe ask someone else?"', score: 1 },
      { id: 'e', text: '我可能听不太懂客人说的话', score: 0 },
    ],
    maxScore: 3,
  },
  {
    id: 'e-4',
    type: 'recording',
    scenario: '请用英语回答："Tell me about yourself and why you want to work on a cruise ship."',
    recordingTime: 120, // 2分钟录音时间
    maxScore: 3,
  },
];

// 维度三：面试表达
export const INTERVIEW_QUESTIONS = [
  {
    id: 'i-1',
    scenario: 'The interviewer asks you to introduce yourself. Which of the following styles is closest to your actual expression?',
    options: [
      { id: 'c', text: 'Hi, I\'m [name] from Shenzhen. For the past two years, I\'ve been working as a guest relations officer at a five-star hotel, handling VIP guests and resolving service issues daily. Working on a cruise ship feels like the natural next step for me — I\'m genuinely excited to bring my hospitality experience to a diverse, international environment.', score: 3 },
      { id: 'a', text: 'Hello. My name is [name]. I am from China. I am 25 years old. I studied tourism in university. I like to travel and I like to meet new people very much. I think cruise ship is very interesting job. I am a hard worker and I am very friendly person. I want to join your company. Thank you very much for this chance.', score: 0 },
      { id: 'b', text: 'Hi, my name is [name], and I\'m from China. I\'ve been working in the hospitality industry for about two years now. I\'ve always wanted to work on a cruise ship because I enjoy meeting people from different cultures. I\'m a team player, I\'m responsible, and I believe I could be a great fit for your team. Thank you.', score: 1 },
    ],
    maxScore: 3,
  },
  {
    id: 'i-2',
    scenario: 'The interviewer asks you: "Tell me about a time you dealt with a difficult customer." Which of the following is closest to your answer?',
    options: [
      { id: 'c', text: 'At my hotel job, a guest was furious because his room wasn\'t ready at check-in after a long flight. I acknowledged his frustration, immediately arranged access to our lounge with complimentary drinks, and personally ensured his room was prioritized. I also upgraded him at no charge. He ended up leaving a five-star review and specifically mentioned how we turned his bad experience around.', score: 3 },
      { id: 'a', text: 'Yes, I have dealt with many difficult customers before. When a customer is angry, I always try to be patient and listen to them carefully. I think the most important thing is to stay calm and be polite. I never argue with customers because the customer is always right. I always try my best to make them happy and solve their problems quickly.', score: 0 },
      { id: 'b', text: 'Once at my previous job, a customer complained about the service and was quite upset. I listened to what they had to say and apologized for the inconvenience. Then I offered a solution to fix the problem. The customer calmed down eventually and thanked me for my help. I learned that staying professional and showing empathy can really make a difference in difficult situations.', score: 1 },
    ],
    maxScore: 3,
  },
  {
    id: 'i-3',
    scenario: 'The interviewer asks you: "How do you handle pressure at work?" Which of the following is your most likely way of answering?',
    options: [
      { id: 'c', text: 'During peak season at my hotel, we were fully booked and two colleagues called in sick on the same day. I quickly reorganized the front desk schedule, covered the evening check-ins myself, and coordinated with housekeeping to avoid delays. It was intense, but I actually enjoy that kind of fast-paced problem-solving. By the end of the shift, every guest was checked in on time with zero complaints.', score: 3 },
      { id: 'a', text: 'I think I am good at handling pressure. I always stay calm and try to do my best. I believe pressure can make people stronger, so I think it is a good thing. When I feel stressed, I just tell myself to keep going and not give up. I am a very positive person and I always have a good attitude at work no matter what happens.', score: 0 },
      { id: 'b', text: 'When things get busy or stressful, I try to stay organized and focus on one task at a time. I make a list of priorities so I know what needs to be done first. I also think communication is important, so I always keep my team updated if I need support. Taking a deep breath and staying focused usually helps me get through high-pressure moments at work.', score: 1 },
    ],
    maxScore: 3,
  },
];

// 维度四：职业性格特质
export const PERSONALITY_QUESTIONS = [
  {
    id: 'pr-1',
    scenario: '上船两个月后，极度想家。信号很差没法视频，今天还是你的生日，没人知道。',
    options: [
      { id: 'a', text: '下班后找个安静角落待一会儿，给家人写一封离线消息，调整好明天继续', score: 2 },
      { id: 'b', text: '去船员活动室看看有没有人聊天，主动社交转移注意力', score: 3 },
      { id: 'c', text: '跟主管说状态不好，想了解提前解约流程', score: 0 },
      { id: 'd', text: '工作时忍不住跟客人聊起自己想家的事', score: 0 },
    ],
    maxScore: 3,
  },
  {
    id: 'pr-2',
    scenario: '连续工作10小时后，餐厅又来了一批补餐客人。你精疲力竭，腰也开始疼。',
    options: [
      { id: 'a', text: '深呼吸调整状态，用标准流程完成最后这段工作，下班后去医务室', score: 3 },
      { id: 'b', text: '和同事商量换一下，自己做不用一直站着的收尾工作', score: 2 },
      { id: 'c', text: '完成最基本的服务就好，不额外关注什么了', score: 1 },
      { id: 'd', text: '找主管说腰疼严重，申请提前下班', score: 1 },
    ],
    maxScore: 3,
  },
  {
    id: 'pr-3',
    scenario: '一位客人连续几天找你聊天、给小费，最后一天邀请你下班后去他的套房参加私人派对。',
    options: [
      { id: 'a', text: '感谢好意，说明船员有行为规范不能去客人房间，推荐参加船上公共活动', score: 3 },
      { id: 'b', text: '去待一小会儿，觉得是好意不好意思拒绝', score: 0 },
      { id: 'c', text: '直接说"不行，这是违规的"', score: 1 },
      { id: 'd', text: '加了社交账号，说下船以后保持联系', score: 0 },
    ],
    maxScore: 3,
  },
  {
    id: 'pr-4',
    scenario: '你的上级当众严厉批评了你的摆台方式，语气很重。但你确定自己是按标准手册做的，周围同事都在看。',
    options: [
      { id: 'a', text: '当场拿出手册指出自己没错', score: 0 },
      { id: 'b', text: '先说"Yes, I understand."执行修改，之后私下拿着手册和他沟通', score: 3 },
      { id: 'c', text: '不说话，按他说的改了，但不打算沟通', score: 1 },
      { id: 'd', text: '下班后跟其他中国同事吐槽这个上级', score: 0 },
    ],
    maxScore: 3,
  },
  {
    id: 'pr-5',
    scenario: '主管要求餐巾折花统一折法、统一朝向。今天洗衣房送来的餐巾比平时软，折出来效果不够挺括。',
    options: [
      { id: 'a', text: '差不多就行，客人不会注意这种细节', score: 0 },
      { id: 'b', text: '尝试调整折法让效果尽量接近标准，同时反馈给主管协调洗衣房', score: 3 },
      { id: 'c', text: '好看的放外面，差的藏在不显眼的位置', score: 1 },
      { id: 'd', text: '停下手上的活去洗衣房要求重新处理', score: 0 },
    ],
    maxScore: 3,
  },
];

// 维度五：服务应变意识
export const ADAPTABILITY_QUESTIONS = [
  {
    id: 'ad-1',
    scenario: '一位客人因行李延误在服务台大声辱骂你，十几位客人在旁边看着。',
    options: [
      { id: 'a', text: '保持冷静，降低音量说"I completely understand your frustration."，引导他去旁边私密区域解决', score: 3 },
      { id: 'b', text: '保持沉默，等他发泄完情绪后再温和地询问具体情况', score: 2 },
      { id: 'c', text: '严肃告知"Sir, I need you to lower your voice. Otherwise I\'ll call security."', score: 1 },
      { id: 'd', text: '立刻道歉并承诺升舱或免单来快速平息他的情绪', score: 0 },
    ],
    maxScore: 3,
  },
  {
    id: 'ad-2',
    scenario: '吧台值班，三位客人等着点单，内线电话响了，同时旁边同事打碎了一个玻璃杯、碎片散在地上。',
    options: [
      { id: 'a', text: '先快速隔离碎片区域防止客人踩到，跟客人说"I\'ll be right with you"，快速接电话记录，再点单，最后彻底清理', score: 3 },
      { id: 'b', text: '先接电话了解情况，同时让同事先清理碎玻璃，等电话结束后再点单', score: 2 },
      { id: 'c', text: '先给三位客人点完单，再依次处理电话和碎玻璃的问题', score: 1 },
      { id: 'd', text: '呼叫领班来支援，自己先维持现场秩序等待指示', score: 0 },
    ],
    maxScore: 3,
  },
  {
    id: 'ad-3',
    scenario: '餐厅21:00关门，你已开始收台。21:05一位疲惫的母亲带着哭闹的孩子进来，说孩子饿了。',
    options: [
      { id: 'a', text: '告诉她餐厅已关闭，指引她去24小时自助餐区解决问题', score: 2 },
      { id: 'b', text: '礼貌解释餐厅已关门，但主动帮她打包一份三明治、水果和牛奶让她带走', score: 3 },
      { id: 'c', text: '让她进来随便拿些剩下的食物，反正马上要收掉了', score: 1 },
      { id: 'd', text: '说"关门了，不好意思"然后继续收台工作', score: 0 },
    ],
    maxScore: 3,
  },
  {
    id: 'ad-4',
    scenario: '凌晨两点，你在船员舱休息，突然响起全船紧急集合警报（7短1长）。你被惊醒，心跳加速。',
    options: [
      { id: 'a', text: '按训练流程：穿好衣服→拿救生衣→前往指定集合站→等待指令', score: 3 },
      { id: 'b', text: '先看手机确认是否是演习，然后再决定是否行动', score: 2 },
      { id: 'c', text: '穿好衣服直接冲向最近的救生艇准备逃生', score: 0 },
      { id: 'd', text: '先打电话问上级确认情况，得到指示后再行动', score: 1 },
    ],
    maxScore: 3,
  },
  {
    id: 'ad-5',
    scenario: '部门全船评比倒数第二，原因是另一个班组拖后腿，你的班组一直表现很好。部门会议上你会怎么做？',
    options: [
      { id: 'a', text: '明确指出是那个班组的问题，要求他们立即改进工作方式', score: 1 },
      { id: 'b', text: '不说话，觉得跟自己这组没关系，做好自己就行', score: 0 },
      { id: 'c', text: '主动分享自己班组的做法和经验，提议一起优化工作流程', score: 3 },
      { id: 'd', text: '会后跟自己组说"做好自己的就行，别管他们"', score: 2 },
    ],
    maxScore: 3,
  },
];

// 反馈文案数据
export const DIMENSION_FEEDBACK = {
  professional: {
    ready: {
      feedback: '你对服务标准、USPH卫生规范和安全优先级有扎实的理解。这在面试中会是明显加分项。',
      suggestions: ['在简历中突出你的USPH相关经验', '面试时可以主动提及你对卫生标准的了解'],
    },
    almost: {
      feedback: '你具备一定的服务知识基础，但在某些专业细节上还需加强，特别是国际卫生标准和优先级判断。',
      suggestions: ['学习USPH核心标准（温度、交叉污染、个人卫生）', '练习服务场景中的优先级排序'],
    },
    improve: {
      feedback: '你的服务知识还比较基础，建议系统学习邮轮服务标准后再投递。',
      suggestions: ['完成海乘学院的"USPH卫生标准"课程', '了解西餐服务基本礼仪和流程'],
    },
    gap: {
      feedback: '你在专业服务知识方面有较大的提升空间。不用担心，这些都是可以学习的。',
      suggestions: ['从零开始学习USPH基础知识', '建议先积累3-6个月的星级酒店或西餐厅工作经验'],
    },
  },
  english: {
    ready: {
      feedback: '你的英语听说能力达到了邮轮工作的基本要求，能理解船上指令并进行专业场景沟通。',
      suggestions: ['继续积累邮轮专业术语', '可以开始准备英文面试模拟'],
    },
    almost: {
      feedback: '你能进行基本的英语沟通，但专业场景的表达流畅度和准确度还需提升。',
      suggestions: ['每天练习20分钟邮轮英语场景对话', '重点攻克客诉处理和指路类常用句型'],
    },
    improve: {
      feedback: '你的英语基础可以应付简单交流，但距离邮轮工作要求还有差距。',
      suggestions: ['系统学习邮轮英语（推荐海乘学院英语课程）', '先把船上100个高频词汇背熟'],
    },
    gap: {
      feedback: '英语目前是你最需要突破的短板。邮轮工作对英语听说有硬性要求，需要重点投入。',
      suggestions: ['建议每天至少30分钟英语听说练习', '从基础日常对话开始，逐步过渡到专业场景'],
    },
  },
  interview: {
    ready: {
      feedback: '你的表达有清晰的结构和具体的细节，面试官能从你的回答中感受到专业度。',
      suggestions: ['准备3-5个STAR结构的经历故事，覆盖投诉处理、团队协作、压力应对等常见面试题', '用英语把这些故事练熟'],
    },
    almost: {
      feedback: '你能描述出基本经历，但缺少结构化表达的训练。面试官可能觉得你有经验，但表达不够有力。',
      suggestions: ['学习STAR面试法（情境-目标-行动-结果）', '把过往经历按STAR框架重新整理'],
    },
    improve: {
      feedback: '你的面试表达偏笼统，缺少具体事例支撑。面试官很难判断你的真实能力。',
      suggestions: ['每个常见面试题准备一个具体故事', '开始面试模拟训练，找人陪练'],
    },
    gap: {
      feedback: '面试表达需要系统训练。好消息是这是最容易通过练习快速提升的维度。',
      suggestions: ['先从中文梳理自己的工作经历开始', '完成海乘学院的面试训练课程'],
    },
  },
  personality: {
    ready: {
      feedback: '你的情绪管理、边界意识和团队协作能力都很出色，非常适合邮轮的封闭式工作环境。',
      suggestions: ['面试时可以分享你在高压或孤独环境中的真实经历', '这些特质是你的核心竞争力，好好展现'],
    },
    almost: {
      feedback: '你在大部分情况下能保持专业，但在某些极端场景下可能需要更成熟的应对方式。',
      suggestions: ['重点关注你得分较低的题目，思考更优的处理方式', '了解邮轮船员行为规范（Code of Conduct）'],
    },
    improve: {
      feedback: '邮轮生活的封闭性和高强度可能会给你带来较大挑战，建议提前做好心理准备。',
      suggestions: ['认真了解邮轮工作的真实生活状态', '评估自己是否能接受6-8个月远离家人'],
    },
    gap: {
      feedback: '你目前的性格特质可能不太适合邮轮的工作环境。建议深入了解后再做决定。',
      suggestions: ['和有邮轮经验的人深入聊聊船上生活的真实感受', '考虑是否需要更多时间准备'],
    },
  },
  adaptability: {
    ready: {
      feedback: '你在突发情况下的判断力和行动力都很强，能在保证安全的前提下灵活处理问题。',
      suggestions: ['面试中多展现你的应变能力', '关注安全优先级意识的表达'],
    },
    almost: {
      feedback: '你有一定的应变能力，但在多任务和突发安全场景的优先级判断上还可以更果断。',
      suggestions: ['记住邮轮服务的核心原则：安全 > 卫生 > 服务', '多做场景模拟训练'],
    },
    improve: {
      feedback: '你在复杂场景下的优先级判断和行动力需要加强。',
      suggestions: ['系统学习邮轮安全应急流程', '用"安全第一"原则重新审视每个场景的最优解'],
    },
    gap: {
      feedback: '服务应变是邮轮工作中非常关键的能力，你需要系统提升这方面的意识。',
      suggestions: ['从了解邮轮紧急信号和基本应急流程开始', '参加海乘学院的安全与应急课程'],
    },
  },
};

// 所有题目集合
export const ALL_QUESTIONS = {
  professional: PROFESSIONAL_QUESTIONS,
  english: ENGLISH_QUESTIONS,
  interview: INTERVIEW_QUESTIONS,
  personality: PERSONALITY_QUESTIONS,
  adaptability: ADAPTABILITY_QUESTIONS,
};
