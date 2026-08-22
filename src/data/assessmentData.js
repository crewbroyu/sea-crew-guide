// src/data/assessmentData.js

export const SERVICE_BACKGROUNDS = [
  { id: 'retail', label: '零售 / 销售 / 免税店相关经验' },
  { id: 'restaurant', label: '餐饮 / 西餐厅 / 咖啡厅相关经验' },
  { id: 'bar_server', label: '酒吧 / 饮品 / 夜场服务相关经验' },
  { id: 'front_office', label: '酒店前台 / 客服 / 接待相关经验' },
  { id: 'housekeeping', label: '客房 / 保洁 / 后勤执行相关经验' },
  { id: 'youth_staff', label: '儿童看护 / 教育 / 活动组织相关经验' },
  { id: 'beauty_spa', label: '美容 / SPA / 健身 / 摄影等技能服务经验' },
  { id: 'none', label: '暂时没有服务行业经验' },
]

export const DIMENSIONS = [
  {
    id: 'eligibility',
    name: '基础可行性',
    icon: 'ClipboardCheck',
    weight: 0.16,
    description: '判断年龄、证件、健康、离家和工作强度等现实条件是否支持海乘求职。',
  },
  {
    id: 'english',
    name: '英语服务沟通',
    icon: 'Languages',
    weight: 0.22,
    description: '评估服务英语、客诉表达、岗位词汇和面试英文表达。',
  },
  {
    id: 'service_experience',
    name: '服务与岗位背景',
    icon: 'Briefcase',
    weight: 0.18,
    description: '判断既有经历能否迁移到海乘岗位，并识别更适合的切入方向。',
  },
  {
    id: 'work_preference',
    name: '工作偏好',
    icon: 'Target',
    weight: 0.14,
    description: '识别用户更适合销售、前台、餐饮、客房、儿童活动或技能服务岗位。',
  },
  {
    id: 'ship_adaptability',
    name: '船上适应力',
    icon: 'Anchor',
    weight: 0.18,
    description: '评估封闭环境、长工时、多国团队、规则意识和情绪稳定性。',
  },
  {
    id: 'application_readiness',
    name: '求职准备度',
    icon: 'Route',
    weight: 0.12,
    description: '评估简历、渠道、面试、证件和时间线准备程度。',
  },
]

export const ELIGIBILITY_QUESTIONS = [
  {
    id: 'el-1',
    scenario: '你目前对海乘工作的真实了解程度更接近哪一种？',
    options: [
      { id: 'a', text: '只知道工资可能不错，还不了解合同、工时、休假和船上生活', score: 0 },
      { id: 'b', text: '了解一些岗位和工资，但还不清楚申请流程和真实工作强度', score: 1 },
      { id: 'c', text: '基本了解岗位、合同、休假、工时和申请方式，正在判断自己是否适合', score: 2 },
      { id: 'd', text: '已经系统了解岗位、合同、船上规则、证件和申请路径，准备进入执行阶段', score: 3 },
    ],
    maxScore: 3,
  },
  {
    id: 'el-2',
    scenario: '如果一份合同需要你连续 6-8 个月在船上工作，期间不能随时回家，你的接受程度是？',
    options: [
      { id: 'a', text: '很难接受，我更需要稳定在家附近工作', score: 0 },
      { id: 'b', text: '有点担心，需要先了解真实生活后再决定', score: 1 },
      { id: 'c', text: '可以接受，但希望提前做好心理和家庭沟通', score: 2 },
      { id: 'd', text: '可以接受，我已经把长期离家和封闭环境纳入考虑', score: 3 },
    ],
    maxScore: 3,
  },
  {
    id: 'el-3',
    scenario: '关于护照、体检、海员证、签证等登船材料，你现在的状态是？',
    options: [
      { id: 'a', text: '完全不了解需要哪些材料', score: 0 },
      { id: 'b', text: '大概知道需要护照和签证，但不清楚流程', score: 1 },
      { id: 'c', text: '知道主要材料，护照或部分材料已经准备中', score: 2 },
      { id: 'd', text: '清楚证件流程、时间和预算，已经有明确准备计划', score: 3 },
    ],
    maxScore: 3,
  },
  {
    id: 'el-4',
    scenario: '如果岗位需要长时间站立、轮班、周末和节假日工作，你更可能怎么应对？',
    options: [
      { id: 'a', text: '不能接受，我更倾向固定双休和规律作息', score: 0 },
      { id: 'b', text: '可以短期接受，但长期会比较吃力', score: 1 },
      { id: 'c', text: '能接受，只要提前知道规则并合理休息', score: 2 },
      { id: 'd', text: '能接受，我有服务业/高强度工作经验，知道如何管理体力', score: 3 },
    ],
    maxScore: 3,
  },
]

export const ENGLISH_QUESTIONS = [
  {
    id: 'en-1',
    scenario: '客人问你：“Could you tell me where the main dining room is?” 你会如何回应？',
    options: [
      { id: 'a', text: 'I do not know.', score: 0 },
      { id: 'b', text: 'Dining room is there. You go there.', score: 1 },
      { id: 'c', text: 'Of course. The main dining room is on Deck 5, near the aft elevators.', score: 3 },
      { id: 'd', text: 'Please wait. I ask my colleague.', score: 2 },
    ],
    maxScore: 3,
  },
  {
    id: 'en-2',
    scenario: '客人说：“I’ve been waiting for 30 minutes. This is unacceptable.” 最合适的回应是？',
    options: [
      { id: 'a', text: 'Sorry, we are busy. Please wait.', score: 0 },
      { id: 'b', text: 'I understand your frustration. Let me check this immediately and update you in two minutes.', score: 3 },
      { id: 'c', text: 'It is not my fault. The kitchen is slow.', score: 0 },
      { id: 'd', text: 'Please calm down. I will try.', score: 1 },
    ],
    maxScore: 3,
  },
  {
    id: 'en-3',
    scenario: '面试官问：“Why do you want to work on a cruise ship?” 哪个回答更专业？',
    options: [
      { id: 'a', text: 'Because I want to travel and make money.', score: 0 },
      { id: 'b', text: 'I like meeting people and I think cruise ship is interesting.', score: 1 },
      { id: 'c', text: 'I enjoy hospitality work and want to grow in an international service environment where I can serve guests from different cultures.', score: 3 },
      { id: 'd', text: 'My friend said this job is good, so I want to try.', score: 0 },
    ],
    maxScore: 3,
  },
  {
    id: 'en-4',
    scenario: '如果客人说话很快、你没有完全听懂，最专业的处理方式是？',
    options: [
      { id: 'a', text: '假装听懂，避免尴尬', score: 0 },
      { id: 'b', text: '直接说 My English is poor', score: 0 },
      { id: 'c', text: '礼貌请对方重复或确认关键信息：Could you please repeat that? I want to make sure I understand correctly.', score: 3 },
      { id: 'd', text: '马上找同事，不再继续沟通', score: 1 },
    ],
    maxScore: 3,
  },
  {
    id: 'en-5',
    scenario: '关于岗位英文词汇，你现在的掌握程度是？',
    options: [
      { id: 'a', text: '几乎不知道海乘岗位相关英文', score: 0 },
      { id: 'b', text: '知道一些基础服务词汇，但不熟练', score: 1 },
      { id: 'c', text: '能说清常见服务流程、客诉和岗位用品', score: 2 },
      { id: 'd', text: '能用英文完成岗位场景服务，并能准备英文面试案例', score: 3 },
    ],
    maxScore: 3,
  },
]

const sharedServiceQuestions = [
  {
    id: 'se-common-1',
    scenario: '你过去是否有真实服务客户、处理需求或面对投诉的经历？',
    options: [
      { id: 'a', text: '没有相关经历', score: 0 },
      { id: 'b', text: '有兼职或短期服务经历，但不系统', score: 1 },
      { id: 'c', text: '有 6 个月以上服务/销售/接待经验', score: 2 },
      { id: 'd', text: '有稳定服务业经验，并处理过投诉、销售或高峰期压力', score: 3 },
    ],
    maxScore: 3,
  },
  {
    id: 'se-common-2',
    scenario: '如果你需要把过去经历写成英文邮轮简历，你现在能做到什么程度？',
    options: [
      { id: 'a', text: '不知道怎么写，也不知道邮轮岗位看重什么', score: 0 },
      { id: 'b', text: '能列出经历，但很难写出岗位匹配点', score: 1 },
      { id: 'c', text: '能写出服务、沟通、团队协作等相关经历', score: 2 },
      { id: 'd', text: '能用数据和具体案例证明自己的服务能力或销售能力', score: 3 },
    ],
    maxScore: 3,
  },
]

export const SERVICE_EXPERIENCE_QUESTIONS = {
  retail: [
    ...sharedServiceQuestions,
    {
      id: 'se-retail-1',
      scenario: '客人犹豫是否购买一款香水，你更习惯的销售方式是？',
      options: [
        { id: 'a', text: '等客人自己决定，不主动推荐', score: 1 },
        { id: 'b', text: '不断强调优惠，尽快促成购买', score: 1 },
        { id: 'c', text: '询问使用场景和偏好，再推荐 2-3 个合适选择', score: 3 },
        { id: 'd', text: '直接推荐最贵的，因为提成更高', score: 0 },
      ],
      maxScore: 3,
    },
  ],
  restaurant: [
    ...sharedServiceQuestions,
    {
      id: 'se-restaurant-1',
      scenario: '餐厅高峰期同时有上菜、补水、客人催单，你会怎么处理？',
      options: [
        { id: 'a', text: '先做眼前最近的事', score: 1 },
        { id: 'b', text: '按安全、客诉风险、等待时间排序处理，并及时告知客人', score: 3 },
        { id: 'c', text: '只处理自己负责的桌，其他不管', score: 1 },
        { id: 'd', text: '让主管决定所有顺序', score: 0 },
      ],
      maxScore: 3,
    },
  ],
  bar_server: [
    ...sharedServiceQuestions,
    {
      id: 'se-bar-1',
      scenario: '客人明显喝多但继续点酒，你会怎么做？',
      options: [
        { id: 'a', text: '继续卖酒，客人买单就可以', score: 0 },
        { id: 'b', text: '减少酒精含量但不告诉客人', score: 1 },
        { id: 'c', text: '礼貌停止供酒，提供水或软饮，必要时通知主管', score: 3 },
        { id: 'd', text: '让客人的朋友决定', score: 0 },
      ],
      maxScore: 3,
    },
  ],
  front_office: [
    ...sharedServiceQuestions,
    {
      id: 'se-front-1',
      scenario: '前台遇到情绪激动的客人，你最应该先做什么？',
      options: [
        { id: 'a', text: '解释规则，证明自己没错', score: 0 },
        { id: 'b', text: '先稳定情绪、确认问题、给出下一步处理时间', score: 3 },
        { id: 'c', text: '马上叫安保', score: 1 },
        { id: 'd', text: '让客人自己冷静后再来', score: 0 },
      ],
      maxScore: 3,
    },
  ],
  housekeeping: [
    ...sharedServiceQuestions,
    {
      id: 'se-housekeeping-1',
      scenario: '打扫房间时发现客人贵重物品散放在桌上，你会怎么做？',
      options: [
        { id: 'a', text: '帮客人整理好', score: 0 },
        { id: 'b', text: '不触碰贵重物品，完成清洁后按流程记录或报告', score: 3 },
        { id: 'c', text: '直接跳过这个房间', score: 1 },
        { id: 'd', text: '拍照发给同事提醒', score: 0 },
      ],
      maxScore: 3,
    },
  ],
  youth_staff: [
    ...sharedServiceQuestions,
    {
      id: 'se-youth-1',
      scenario: '儿童活动中两个孩子发生推搡，你会怎么处理？',
      options: [
        { id: 'a', text: '让他们自己解决', score: 0 },
        { id: 'b', text: '立刻分开，确认安全，了解情况并按规则处理', score: 3 },
        { id: 'c', text: '只批评动手的孩子', score: 1 },
        { id: 'd', text: '马上取消所有活动', score: 1 },
      ],
      maxScore: 3,
    },
  ],
  beauty_spa: [
    ...sharedServiceQuestions,
    {
      id: 'se-spa-1',
      scenario: '客人对服务效果不满意，认为价格太高，你会怎么回应？',
      options: [
        { id: 'a', text: '告诉客人这是正常价格', score: 0 },
        { id: 'b', text: '先倾听具体不满，再解释服务内容并提供合理补救方案', score: 3 },
        { id: 'c', text: '直接打折避免投诉', score: 1 },
        { id: 'd', text: '让客人找经理', score: 1 },
      ],
      maxScore: 3,
    },
  ],
  none: [
    ...sharedServiceQuestions,
    {
      id: 'se-none-1',
      scenario: '如果你没有服务经验，最现实的补强方式是？',
      options: [
        { id: 'a', text: '直接投递，等上船后再学', score: 0 },
        { id: 'b', text: '先做 1-3 个月餐饮/酒店/零售兼职，积累真实服务案例', score: 3 },
        { id: 'c', text: '只背面试答案，不需要真实经验', score: 0 },
        { id: 'd', text: '只看网上经验帖', score: 1 },
      ],
      maxScore: 3,
    },
  ],
}

export const WORK_PREFERENCE_QUESTIONS = [
  {
    id: 'wp-1',
    scenario: '你更能接受哪种工作压力？',
    options: [
      { id: 'retail', text: '销售目标和客单价压力', score: 3, jobSignals: { retail: 3 } },
      { id: 'front_office', text: '客诉、信息查询和多任务沟通压力', score: 3, jobSignals: { front_office: 3 } },
      { id: 'restaurant', text: '高峰期节奏快、体力消耗大', score: 3, jobSignals: { restaurant: 3, bar: 2 } },
      { id: 'housekeeping', text: '重复执行、细节标准和体力任务', score: 3, jobSignals: { housekeeping: 3 } },
    ],
    maxScore: 3,
  },
  {
    id: 'wp-2',
    scenario: '你更喜欢哪种与客人的互动方式？',
    options: [
      { id: 'a', text: '主动介绍产品、推荐购买', score: 3, jobSignals: { retail: 3 } },
      { id: 'b', text: '解决问题、解释规则、处理投诉', score: 3, jobSignals: { front_office: 3 } },
      { id: 'c', text: '按流程提供餐饮/饮品服务', score: 3, jobSignals: { restaurant: 2, bar: 3 } },
      { id: 'd', text: '少说话，多做细节执行', score: 3, jobSignals: { housekeeping: 3 } },
    ],
    maxScore: 3,
  },
  {
    id: 'wp-3',
    scenario: '如果让你选择一个最想强化的能力，你会选？',
    options: [
      { id: 'a', text: '销售成交和产品知识', score: 3, jobSignals: { retail: 3 } },
      { id: 'b', text: '英文投诉处理和跨文化沟通', score: 3, jobSignals: { front_office: 3 } },
      { id: 'c', text: '餐饮/酒水服务流程', score: 3, jobSignals: { restaurant: 2, bar: 3 } },
      { id: 'd', text: '儿童活动组织或安全看护', score: 3, jobSignals: { youth_staff: 3 } },
    ],
    maxScore: 3,
  },
  {
    id: 'wp-4',
    scenario: '下面哪句话最像你？',
    options: [
      { id: 'a', text: '我喜欢清楚标准，按流程稳定完成任务', score: 3, jobSignals: { housekeeping: 2, restaurant: 2 } },
      { id: 'b', text: '我喜欢和人交流，能主动开口影响别人', score: 3, jobSignals: { retail: 2, front_office: 2 } },
      { id: 'c', text: '我喜欢有节奏感的服务现场，越忙越进入状态', score: 3, jobSignals: { restaurant: 2, bar: 2 } },
      { id: 'd', text: '我喜欢组织活动、照顾人、保持现场气氛', score: 3, jobSignals: { youth_staff: 3 } },
    ],
    maxScore: 3,
  },
]

export const SHIP_ADAPTABILITY_QUESTIONS = [
  {
    id: 'sa-1',
    scenario: '上船两个月后非常想家，信号很差，今天又是生日，你会怎么处理？',
    options: [
      { id: 'a', text: '下班后找安静地方调整情绪，给家人写消息，第二天继续工作', score: 2 },
      { id: 'b', text: '主动去 crew area 和同事聊天，转移注意力并建立支持系统', score: 3 },
      { id: 'c', text: '工作中忍不住和客人聊自己的难过', score: 0 },
      { id: 'd', text: '马上想提前解约', score: 0 },
    ],
    maxScore: 3,
  },
  {
    id: 'sa-2',
    scenario: '主管当众批评你，但你觉得自己是按标准做的。最成熟的处理方式是？',
    options: [
      { id: 'a', text: '当场拿手册证明自己没错', score: 0 },
      { id: 'b', text: '先接受指令，之后私下拿着标准和主管沟通确认', score: 3 },
      { id: 'c', text: '表面答应，但以后不再主动沟通', score: 1 },
      { id: 'd', text: '下班后和同事抱怨主管', score: 0 },
    ],
    maxScore: 3,
  },
  {
    id: 'sa-3',
    scenario: '客人邀请你下班后去他的套房参加私人派对，你会怎么做？',
    options: [
      { id: 'a', text: '感谢好意，说明船员行为规范不允许进入客人房间，推荐公共活动', score: 3 },
      { id: 'b', text: '去一小会儿，避免客人不开心', score: 0 },
      { id: 'c', text: '加社交账号，下船后保持联系', score: 0 },
      { id: 'd', text: '直接说不行，不解释', score: 1 },
    ],
    maxScore: 3,
  },
  {
    id: 'sa-4',
    scenario: '凌晨两点响起全船紧急集合警报，你第一反应应该是？',
    options: [
      { id: 'a', text: '按训练流程穿衣、拿救生衣、前往指定集合站、等待指令', score: 3 },
      { id: 'b', text: '先看手机确认是不是演习', score: 1 },
      { id: 'c', text: '直接冲向最近救生艇', score: 0 },
      { id: 'd', text: '打电话问上级确认后再行动', score: 1 },
    ],
    maxScore: 3,
  },
  {
    id: 'sa-5',
    scenario: '和来自不同国家的同事合作时，对方沟通方式很直接，你会如何理解？',
    options: [
      { id: 'a', text: '觉得对方不尊重人，尽量少合作', score: 0 },
      { id: 'b', text: '先区分文化差异和真实冒犯，必要时用事实沟通边界', score: 3 },
      { id: 'c', text: '忍着不说，避免冲突', score: 1 },
      { id: 'd', text: '用同样强硬的方式回应', score: 0 },
    ],
    maxScore: 3,
  },
]

export const APPLICATION_READINESS_QUESTIONS = [
  {
    id: 'ar-1',
    scenario: '你的英文简历现在处于什么状态？',
    options: [
      { id: 'a', text: '还没有英文简历', score: 0 },
      { id: 'b', text: '有翻译版英文简历，但没有针对邮轮岗位优化', score: 1 },
      { id: 'c', text: '已经按目标岗位整理服务经历和关键词', score: 2 },
      { id: 'd', text: '已完成邮轮岗位版本，并准备好英文自我介绍和案例', score: 3 },
    ],
    maxScore: 3,
  },
  {
    id: 'ar-2',
    scenario: '你对申请渠道的了解程度是？',
    options: [
      { id: 'a', text: '只知道可以找中介，不知道怎么判断可靠性', score: 0 },
      { id: 'b', text: '知道中介、一代、官网等渠道，但还没比较', score: 1 },
      { id: 'c', text: '已经知道目标岗位可走的主要渠道', score: 2 },
      { id: 'd', text: '已经确定申请渠道、材料要求和时间安排', score: 3 },
    ],
    maxScore: 3,
  },
  {
    id: 'ar-3',
    scenario: '你目前的面试准备程度是？',
    options: [
      { id: 'a', text: '还没有准备英文面试', score: 0 },
      { id: 'b', text: '背过一些常见问题，但回答比较模板化', score: 1 },
      { id: 'c', text: '准备了自我介绍、服务案例和岗位问题', score: 2 },
      { id: 'd', text: '已经做过模拟面试，并能用 STAR 结构回答', score: 3 },
    ],
    maxScore: 3,
  },
  {
    id: 'ar-4',
    scenario: '你希望多久内进入实际投递或面试阶段？',
    options: [
      { id: 'a', text: '只是先了解，没有明确时间', score: 0 },
      { id: 'b', text: '3-6 个月内，如果准备顺利', score: 1 },
      { id: 'c', text: '1-3 个月内，已经开始准备材料', score: 2 },
      { id: 'd', text: '1 个月内，目标岗位和材料基本确定', score: 3 },
    ],
    maxScore: 3,
  },
]

export const ALL_QUESTIONS = {
  eligibility: ELIGIBILITY_QUESTIONS,
  english: ENGLISH_QUESTIONS,
  service_experience: SERVICE_EXPERIENCE_QUESTIONS,
  work_preference: WORK_PREFERENCE_QUESTIONS,
  ship_adaptability: SHIP_ADAPTABILITY_QUESTIONS,
  application_readiness: APPLICATION_READINESS_QUESTIONS,
}
