// src/data/assessmentData.js

export const ASSESSMENT_VERSION = 2

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
    weight: 0.17,
    description: '核验证件、健康、家庭安排、资金缓冲和合同周期等现实约束。',
  },
  {
    id: 'english',
    name: '英语服务沟通',
    icon: 'Languages',
    weight: 0.24,
    description: '通过真实船上场景评估听力确认、安全沟通、客诉闭环和面试表达。',
  },
  {
    id: 'service_experience',
    name: '服务与岗位背景',
    icon: 'Briefcase',
    weight: 0.19,
    description: '用行为证据判断服务经历的深度、复盘能力和岗位迁移价值。',
  },
  {
    id: 'work_preference',
    name: '岗位方向清晰度',
    icon: 'Target',
    weight: 0.1,
    description: '用强制取舍识别岗位信号是否稳定；偏好没有好坏，清晰度影响选岗效率。',
  },
  {
    id: 'ship_adaptability',
    name: '船上适应力',
    icon: 'Anchor',
    weight: 0.18,
    description: '评估疲劳管理、层级协作、安全纪律、边界意识和跨文化冲突处理。',
  },
  {
    id: 'application_readiness',
    name: '求职准备度',
    icon: 'Route',
    weight: 0.12,
    description: '核验目标岗位、定制简历、渠道尽调、面试演练和材料时间线。',
  },
]

export const DIMENSION_GUIDANCE = {
  eligibility: {
    focus: '现实约束是否已被逐项核验，而不是只看工资和旅行机会。',
    evidence: '护照有效期、体检风险、家庭共识、启动预算与可接受合同周期。',
    actions: {
      low: '先完成证件、健康、预算和家庭安排清单，再决定是否投入申请成本。',
      mid: '把尚未确认的硬条件标注负责人和截止日期，形成可执行时间线。',
      high: '复核目标公司的具体证件与体检要求，并为延误预留时间和资金。',
    },
  },
  english: {
    focus: '能否在有口音、压力和安全责任的情况下完成确认与闭环。',
    evidence: '复述关键信息、处理过敏或投诉、完成交接，并用 STAR 讲真实案例。',
    actions: {
      low: '先练方向指引、澄清、过敏确认和投诉四类高频句型，每次录音复盘。',
      mid: '加入不同口音和限时场景，重点练复述确认、承诺时限和交接摘要。',
      high: '用目标岗位场景做全英文模拟，把准确、简洁和服务判断练到稳定。',
    },
  },
  service_experience: {
    focus: '是否真正承担过客户结果、服务标准和高峰压力，而不只是“做过服务业”。',
    evidence: '可核验的职责、一次复杂事件、你的具体动作、结果数据与复盘。',
    actions: {
      low: '通过短期服务实践积累真实案例，并记录问题、行动、结果和反馈。',
      mid: '整理 3 个 STAR 案例，补上数字、个人责任和复盘后的流程改进。',
      high: '把成熟案例改写为目标岗位英文表达，突出可迁移能力和服务标准。',
    },
  },
  work_preference: {
    focus: '不同工作取舍是否持续指向相近岗位，而不是只选择听起来体面的选项。',
    evidence: '对销售目标、客诉、多任务、体力重复和活动责任的稳定选择。',
    actions: {
      low: '分别体验或访谈两个候选岗位，再明确自己愿意长期承受哪类压力。',
      mid: '比较前两类岗位的收入结构、日常任务和淘汰原因，做一次明确取舍。',
      high: '围绕首选岗位集中准备，保留一个能力相邻的备选岗位。',
    },
  },
  ship_adaptability: {
    focus: '在疲劳、冲突和规则压力下，是否仍能优先安全、报告和专业边界。',
    evidence: '按链路报告、闭环执行、使用事实沟通，并能主动建立支持系统。',
    actions: {
      low: '先学习安全纪律、船员边界和报告链路，确认自己能否接受强规则环境。',
      mid: '针对疲劳、主管冲突和跨文化沟通做情景演练，练习事实化表达。',
      high: '继续训练复杂冲突和应急优先级，避免因经验增加而放松报告纪律。',
    },
  },
  application_readiness: {
    focus: '是否已有能被验证的申请资产与节奏，而不是停留在“准备开始”。',
    evidence: '单一目标岗位、定制简历、核验渠道、录制面试和材料截止日期。',
    actions: {
      low: '先确定一个目标岗位，并建立材料、渠道和练习三张清单。',
      mid: '完成一次简历校准和两次录制面试，开始小批量验证投递。',
      high: '按周跟踪回复率和面试反馈，只根据真实数据调整材料与渠道。',
    },
  },
}

export const ELIGIBILITY_QUESTIONS = [
  {
    id: 'el-1',
    scenario: '一份合同写明连续在船 7 个月，每周工作 7 天，休息按班次安排。你目前的判断是？',
    options: [
      { id: 'a', text: '先接受工作，能否适应可以上船后再判断', score: 0 },
      { id: 'b', text: '只要收入达到预期，合同周期不是主要问题', score: 1 },
      { id: 'c', text: '已和家人沟通，并用类似排班测试过自己的状态', score: 3 },
      { id: 'd', text: '原则上能接受，但还没有验证长期离家和轮班影响', score: 2 },
    ],
    maxScore: 3,
  },
  {
    id: 'el-2',
    scenario: '目标公司要求护照在预计下船日后仍有至少 6 个月有效期。你现在会怎么确认？',
    options: [
      { id: 'a', text: '按合同期计算，核对护照到期日', score: 3 },
      { id: 'b', text: '护照现在没过期，等拿到 offer 后再看', score: 1 },
      { id: 'c', text: '询问其他申请者，他们能用我应该也能用', score: 0 },
      { id: 'd', text: '先提交现有护照，收到补件通知后再处理', score: 2 },
    ],
    maxScore: 3,
  },
  {
    id: 'el-3',
    scenario: '你有一项长期健康问题，目前不影响日常工作。面对海员体检和健康申报，你会怎么做？',
    options: [
      { id: 'a', text: '只要没有症状，就不需要在申请阶段说明', score: 0 },
      { id: 'b', text: '查公司标准，向合格机构如实咨询', score: 3 },
      { id: 'c', text: '等体检医生问到时，再决定是否完整说明', score: 1 },
      { id: 'd', text: '先问中介能否通过，按对方经验准备材料', score: 2 },
    ],
    maxScore: 3,
  },
  {
    id: 'el-4',
    scenario: '从申请到首月工资到账可能有体检、签证、培训和差旅支出。你的资金安排最接近哪种？',
    options: [
      { id: 'a', text: '列清费用，预留生活费和延误缓冲', score: 3 },
      { id: 'b', text: '能支付主要费用，但尚未预留流程延误资金', score: 2 },
      { id: 'c', text: '计划先借款支付，之后用船上收入立即偿还', score: 1 },
      { id: 'd', text: '还没算过总成本，拿到通知后再临时筹钱', score: 0 },
    ],
    maxScore: 3,
  },
  {
    id: 'el-5',
    scenario: '家人临时反对你长期离家，但面试已经通过。最能降低实际违约风险的做法是？',
    options: [
      { id: 'a', text: '先签合同，等登船前家人自然会接受', score: 0 },
      { id: 'b', text: '让招聘方直接向家人解释岗位的可靠性', score: 1 },
      { id: 'c', text: '先确认家庭照护、联络和紧急预案', score: 3 },
      { id: 'd', text: '继续准备，同时避免再讨论可能出现的困难', score: 1 },
    ],
    maxScore: 3,
  },
]

export const ENGLISH_QUESTIONS = [
  {
    id: 'en-1',
    scenario: '客人问：“Is the main dining room forward or aft?” 餐厅在船尾电梯旁。哪个回答最准确？',
    options: [
      { id: 'a', text: 'It is downstairs, beside the elevators.', score: 1 },
      { id: 'b', text: 'Take any elevator and you will see it.', score: 0 },
      { id: 'c', text: 'It is aft, by the Deck 5 elevators.', score: 3 },
      { id: 'd', text: 'Go to Deck 5 first, then ask a colleague.', score: 2 },
    ],
    maxScore: 3,
  },
  {
    id: 'en-2',
    scenario: '客人说：“I ordered thirty minutes ago, but table 18 was served first.” 你还不知道延误原因，先说哪一句？',
    options: [
      { id: 'a', text: 'I am sorry. I will check your order and return in two minutes.', score: 3 },
      { id: 'b', text: 'Table 18 may have ordered something faster, so please wait.', score: 0 },
      { id: 'c', text: 'I understand. The kitchen is busy, but your order should arrive soon.', score: 1 },
      { id: 'd', text: 'Let me ask my supervisor to explain why this happened.', score: 2 },
    ],
    maxScore: 3,
  },
  {
    id: 'en-3',
    scenario: '客人说：“I am allergic to shellfish. Is this soup safe?” 你不确定配方。哪句最合适？',
    options: [
      { id: 'a', text: 'It should be safe because shellfish is not listed on the menu.', score: 0 },
      { id: 'b', text: 'I will confirm with the kitchen before serving it.', score: 3 },
      { id: 'c', text: 'Try a small amount first and tell me if you feel unwell.', score: 0 },
      { id: 'd', text: 'Choose another soup today; this one may contain seafood.', score: 2 },
    ],
    maxScore: 3,
  },
  {
    id: 'en-4',
    scenario: '电话里客人有较重口音，你只听清“cabin 8142”和“water”。你下一句怎么说？',
    options: [
      { id: 'a', text: 'Could you speak more slowly? Your accent is difficult for me.', score: 1 },
      { id: 'b', text: 'Cabin 8142: drinking water or a leak?', score: 3 },
      { id: 'c', text: 'Please call again later when another crew member is available.', score: 0 },
      { id: 'd', text: 'You need water in cabin 8142, correct?', score: 2 },
    ],
    maxScore: 3,
  },
  {
    id: 'en-5',
    scenario: '交班时需要说明：“客人已投诉空调两次，工程部说十分钟内到。” 哪句信息最完整？',
    options: [
      { id: 'a', text: 'The guest has an air-conditioning problem. Engineering knows.', score: 1 },
      { id: 'b', text: 'Engineering will visit the guest soon. Please follow up later.', score: 2 },
      { id: 'c', text: 'Two complaints; engineering is due in ten minutes. Please follow up.', score: 3 },
      { id: 'd', text: 'The air conditioning is broken, and the guest is already very unhappy.', score: 1 },
    ],
    maxScore: 3,
  },
  {
    id: 'en-6',
    scenario: '客人想买香水，但说：“I need something light for daytime, not too sweet.” 你会先怎么回应？',
    options: [
      { id: 'a', text: 'This is our bestseller, and it is on promotion today.', score: 1 },
      { id: 'b', text: 'The expensive one lasts longer, so I recommend that one.', score: 0 },
      { id: 'c', text: 'I can show you all our light fragrances on this shelf.', score: 2 },
      { id: 'd', text: 'Do you prefer fresh citrus or soft floral?', score: 3 },
    ],
    maxScore: 3,
  },
  {
    id: 'en-7',
    scenario: '面试官问：“Tell me about a time you handled an upset customer.” 哪个回答最能证明经验？',
    options: [
      { id: 'a', text: 'I always stay calm because customer service is very important to me.', score: 1 },
      { id: 'b', text: 'At my last job, I corrected a wrong charge and the guest stayed.', score: 3 },
      { id: 'c', text: 'I would listen carefully, apologize politely, and ask my manager for help.', score: 2 },
      { id: 'd', text: 'Customers were often upset, but I never argued and always solved everything.', score: 0 },
    ],
    maxScore: 3,
  },
  {
    id: 'en-8',
    scenario: '广播说：“Crew assigned to muster station B must report immediately; this is not a drill.” 这句话要求什么？',
    options: [
      { id: 'a', text: '所有船员先确认是否真的发生紧急情况', score: 0 },
      { id: 'b', text: 'B 集合站的值班船员完成手头工作后前往', score: 1 },
      { id: 'c', text: 'B 集合站人员立即报到，这不是演习', score: 3 },
      { id: 'd', text: 'B 集合站的客人和船员立即穿好救生衣', score: 2 },
    ],
    maxScore: 3,
  },
]

const sharedServiceQuestions = [
  {
    id: 'se-common-1',
    scenario: '过去 12 个月里，你承担一线客户服务责任的情况最接近哪一种？',
    options: [
      { id: 'a', text: '没有直接面对客户，也没有承担服务结果', score: 0 },
      { id: 'b', text: '偶尔协助接待，但复杂问题通常由别人处理', score: 1 },
      { id: 'c', text: '持续面对客户，能独立完成标准服务流程', score: 2 },
      { id: 'd', text: '持续服务客户，处理过投诉、高峰或业绩', score: 3 },
    ],
    maxScore: 3,
  },
  {
    id: 'se-common-2',
    scenario: '主管追问：“这件客诉具体是你解决的，还是团队解决的？” 哪种回答最能证明你的贡献？',
    options: [
      { id: 'a', text: '我们配合得很好，最后客人对处理结果满意', score: 1 },
      { id: 'b', text: '我核对记录、提出方案并在批准后回访', score: 3 },
      { id: 'c', text: '主要是我解决的，其他同事只提供了一些帮助', score: 0 },
      { id: 'd', text: '团队按流程解决，我负责向主管汇报处理进度', score: 2 },
    ],
    maxScore: 3,
  },
  {
    id: 'se-common-3',
    scenario: '高峰结束后发现同类失误当天发生了三次。你最可能采取哪一步？',
    options: [
      { id: 'a', text: '提醒当班同事下次注意，避免把问题扩大', score: 1 },
      { id: 'b', text: '找共同原因，和主管确定一项改进', score: 3 },
      { id: 'c', text: '先观察几天，确认问题是否会自然消失', score: 0 },
      { id: 'd', text: '把三次失误分别修正，确保客人没有继续投诉', score: 2 },
    ],
    maxScore: 3,
  },
  {
    id: 'se-common-4',
    scenario: '面试要你提供一项最能核验的服务成果。你目前能拿出的证据最接近哪种？',
    options: [
      { id: 'a', text: '同事都认为我认真，客户通常也比较喜欢我', score: 1 },
      { id: 'b', text: '能说出职责和大致过程，但没有结果或反馈记录', score: 2 },
      { id: 'c', text: '有具体情境、个人动作、结果数据或主管反馈', score: 3 },
      { id: 'd', text: '暂时想不到一件能完整说明个人贡献的事件', score: 0 },
    ],
    maxScore: 3,
  },
]

export const SERVICE_EXPERIENCE_QUESTIONS = {
  retail: [
    ...sharedServiceQuestions,
    {
      id: 'se-retail-1',
      scenario: '客人试了三款香水仍犹豫，身后又有两位客人在等。你会怎么推进？',
      options: [
        { id: 'a', text: '再次介绍三款卖点，让客人慢慢比较后决定', score: 1 },
        { id: 'b', text: '确认场景，缩小选择并约定稍后试香', score: 3 },
        { id: 'c', text: '先服务等待客人，让当前客人自己继续试用', score: 2 },
        { id: 'd', text: '强调限时折扣，建议先付款避免错过优惠', score: 0 },
      ],
      maxScore: 3,
    },
  ],
  restaurant: [
    ...sharedServiceQuestions,
    {
      id: 'se-restaurant-1',
      scenario: '你正端热汤，另一桌客人催单，第三桌报告疑似过敏反应。第一步是什么？',
      options: [
        { id: 'a', text: '把热汤送完，再向主管报告第三桌情况', score: 1 },
        { id: 'b', text: '放下热汤，立即启动过敏应急流程', score: 3 },
        { id: 'c', text: '请催单客人稍等，然后询问第三桌具体症状', score: 2 },
        { id: 'd', text: '让邻区同事查看第三桌，自己继续完成上菜', score: 1 },
      ],
      maxScore: 3,
    },
  ],
  bar_server: [
    ...sharedServiceQuestions,
    {
      id: 'se-bar-1',
      scenario: '熟客说自己没醉并要求再来一杯，同伴也替他保证。你会怎么处理？',
      options: [
        { id: 'a', text: '改做低酒精饮品，不说明调整以避免争执', score: 0 },
        { id: 'b', text: '请同伴负责照看，再提供最后一杯标准酒', score: 1 },
        { id: 'c', text: '拒绝供酒并提供水，同时按流程通知主管', score: 3 },
        { id: 'd', text: '先拖延十分钟，观察客人状态是否有所改善', score: 2 },
      ],
      maxScore: 3,
    },
  ],
  front_office: [
    ...sharedServiceQuestions,
    {
      id: 'se-front-1',
      scenario: '客人坚持要免费升级，并说另一位前台昨晚已经答应，但系统没有记录。你先做什么？',
      options: [
        { id: 'a', text: '说明系统没有记录，因此无法兑现口头承诺', score: 1 },
        { id: 'b', text: '先免费升级，再请主管补做授权和系统记录', score: 0 },
        { id: 'c', text: '确认时间线，再核查交班记录和权限', score: 3 },
        { id: 'd', text: '请昨晚当班同事来说明，再决定是否提供升级', score: 2 },
      ],
      maxScore: 3,
    },
  ],
  housekeeping: [
    ...sharedServiceQuestions,
    {
      id: 'se-housekeeping-1',
      scenario: '打扫房间时发现现金压在床单下，客人不在房内。你会怎么处理？',
      options: [
        { id: 'a', text: '把现金放到桌面显眼处，再继续更换床单', score: 0 },
        { id: 'b', text: '停止触碰，立即联系主管见证', score: 3 },
        { id: 'c', text: '保留原样并跳过床铺，完成房间其他清洁', score: 2 },
        { id: 'd', text: '拍照留证后收好现金，等客人回来再归还', score: 0 },
      ],
      maxScore: 3,
    },
  ],
  youth_staff: [
    ...sharedServiceQuestions,
    {
      id: 'se-youth-1',
      scenario: '接孩子的人姓名不在授权名单上，但孩子认识对方并坚持要走。你会怎么做？',
      options: [
        { id: 'a', text: '孩子能够确认身份，可以在登记后让其离开', score: 0 },
        { id: 'b', text: '请对方出示证件，再由孩子口头确认一次关系', score: 1 },
        { id: 'c', text: '不放行，联系授权监护人并按升级流程处理', score: 3 },
        { id: 'd', text: '先让对方等待，同时请另一位同事判断情况', score: 2 },
      ],
      maxScore: 3,
    },
  ],
  beauty_spa: [
    ...sharedServiceQuestions,
    {
      id: 'se-spa-1',
      scenario: '护理开始后客人说皮肤刺痛，但又担心停止后不能退款。你会怎么做？',
      options: [
        { id: 'a', text: '先停止操作并评估反应，再按流程记录和升级', score: 3 },
        { id: 'b', text: '解释轻微刺痛很常见，降低强度后继续完成护理', score: 1 },
        { id: 'c', text: '立即承诺退款，让客人放心后再决定是否继续', score: 2 },
        { id: 'd', text: '请客人签字确认自愿继续，避免后续责任争议', score: 0 },
      ],
      maxScore: 3,
    },
  ],
  none: [
    ...sharedServiceQuestions,
    {
      id: 'se-none-1',
      scenario: '你没有正式服务经历，面试在六周后。哪种准备最能产生可验证证据？',
      options: [
        { id: 'a', text: '集中背熟常见题，确保回答听起来完整专业', score: 1 },
        { id: 'b', text: '参加短期一线实践，记录三次真实服务事件', score: 3 },
        { id: 'c', text: '研究岗位职责，用过去校园经历替代服务经验', score: 2 },
        { id: 'd', text: '先广泛投递，用实际面试反馈判断缺少什么', score: 0 },
      ],
      maxScore: 3,
    },
  ],
}

export const WORK_PREFERENCE_QUESTIONS = [
  {
    id: 'wp-1',
    scenario: '四种压力都存在时，你最愿意长期承担哪一种？',
    options: [
      { id: 'a', text: '每天有销售指标，收入也随业绩波动', jobSignals: { retail: 3, beauty_spa: 1 } },
      { id: 'b', text: '持续处理客诉，需要准确协调多个部门', jobSignals: { front_office: 3 } },
      { id: 'c', text: '高峰连续服务，体力消耗和节奏都很快', jobSignals: { restaurant: 3, bar: 2 } },
      { id: 'd', text: '重复执行标准，质量检查会具体到每个细节', jobSignals: { housekeeping: 3 } },
    ],
    maxScore: 0,
  },
  {
    id: 'wp-2',
    scenario: '一班结束时，哪种结果最容易让你觉得“今天做得值”？',
    options: [
      { id: 'a', text: '复杂问题被厘清，客人知道接下来会发生什么', jobSignals: { front_office: 3 } },
      { id: 'b', text: '区域始终整洁达标，交班时没有返工项目', jobSignals: { housekeeping: 3 } },
      { id: 'c', text: '客人接受了合适推荐，同时完成当天目标', jobSignals: { retail: 3, beauty_spa: 2 } },
      { id: 'd', text: '高峰运转顺畅，桌台或吧台没有服务断点', jobSignals: { restaurant: 3, bar: 3 } },
    ],
    maxScore: 0,
  },
  {
    id: 'wp-3',
    scenario: '必须放弃一项工作条件时，你最不介意放弃哪一项？',
    options: [
      { id: 'a', text: '固定节奏，只要现场忙起来更有状态', jobSignals: { restaurant: 2, bar: 3, youth_staff: 1 } },
      { id: 'b', text: '低沟通压力，愿意长时间面对客人问题', jobSignals: { front_office: 3, retail: 1 } },
      { id: 'c', text: '稳定收入，愿意用销售表现争取更高回报', jobSignals: { retail: 3, beauty_spa: 2 } },
      { id: 'd', text: '工作变化，愿意按同一标准反复完成任务', jobSignals: { housekeeping: 3 } },
    ],
    maxScore: 0,
  },
  {
    id: 'wp-4',
    scenario: '以下哪类失误最会让你主动复盘，而不是只觉得麻烦？',
    options: [
      { id: 'a', text: '没有发现房间或区域里一个很小的标准问题', jobSignals: { housekeeping: 3 } },
      { id: 'b', text: '没有问清需求，导致推荐的产品并不适合客人', jobSignals: { retail: 3, beauty_spa: 2 } },
      { id: 'c', text: '交接信息不完整，让客人不得不重复解释问题', jobSignals: { front_office: 3 } },
      { id: 'd', text: '活动规则不清，导致儿童安全或现场秩序风险', jobSignals: { youth_staff: 3 } },
    ],
    maxScore: 0,
  },
  {
    id: 'wp-5',
    scenario: '如果培训只能优先选一门，你会选择哪一门？',
    options: [
      { id: 'a', text: '品牌产品知识、需求探询与组合销售', jobSignals: { retail: 3 } },
      { id: 'b', text: '酒水知识、负责任供酒与吧台销售', jobSignals: { bar: 3 } },
      { id: 'c', text: '儿童活动设计、签到制度与安全边界', jobSignals: { youth_staff: 3 } },
      { id: 'd', text: '护理咨询、禁忌判断与服务后销售', jobSignals: { beauty_spa: 3, retail: 1 } },
    ],
    maxScore: 0,
  },
]

export const SHIP_ADAPTABILITY_QUESTIONS = [
  {
    id: 'sa-1',
    scenario: '连续几个班次睡眠不足，你开始漏记客人要求，但距离换班还有两小时。你会怎么做？',
    options: [
      { id: 'a', text: '喝咖啡坚持到换班，避免给团队增加额外负担', score: 1 },
      { id: 'b', text: '减少与客人交流，只完成最必要的操作', score: 0 },
      { id: 'c', text: '向主管报告状态，请求调整并对遗漏做交接', score: 3 },
      { id: 'd', text: '请熟悉的同事暗中帮忙，不留下疲劳记录', score: 2 },
    ],
    maxScore: 3,
  },
  {
    id: 'sa-2',
    scenario: '主管口头要求你跳过一项检查以赶进度，但书面流程要求必须完成。你会怎么做？',
    options: [
      { id: 'a', text: '先按主管要求执行，之后再补做书面记录', score: 1 },
      { id: 'b', text: '确认冲突点，按合规链路升级', score: 3 },
      { id: 'c', text: '坚持照书面流程执行，但不再向主管解释原因', score: 2 },
      { id: 'd', text: '请同事共同见证，由多数人的意见决定做法', score: 0 },
    ],
    maxScore: 3,
  },
  {
    id: 'sa-3',
    scenario: '客人多次私下送礼并索要你的联系方式，称只是想感谢服务。你会怎么处理？',
    options: [
      { id: 'a', text: '只收价值较低的礼物，但不提供私人联系方式', score: 1 },
      { id: 'b', text: '说明规定并拒绝，再次发生则报告', score: 3 },
      { id: 'c', text: '不收礼物，等客人离船后再添加社交账号', score: 0 },
      { id: 'd', text: '请同事代为服务，避免自己再次面对这位客人', score: 2 },
    ],
    maxScore: 3,
  },
  {
    id: 'sa-4',
    scenario: '凌晨听到紧急广播，但同舱室友说可能只是误报，正在等群聊通知。你先做什么？',
    options: [
      { id: 'a', text: '立即按训练流程前往指定岗位', score: 3 },
      { id: 'b', text: '穿好衣服等待一分钟，确认是否有第二次广播', score: 1 },
      { id: 'c', text: '给直属主管打电话，确认自己是否需要集合', score: 2 },
      { id: 'd', text: '跟着室友行动，因为两人的安全职责应该相同', score: 0 },
    ],
    maxScore: 3,
  },
  {
    id: 'sa-5',
    scenario: '同事用很直接的语气指出你的错误，你不确定这是文化差异还是针对你。你会怎么做？',
    options: [
      { id: 'a', text: '先核对事实，再私下沟通表达方式', score: 3 },
      { id: 'b', text: '保持沉默并减少合作，避免产生更大的正面冲突', score: 1 },
      { id: 'c', text: '当场要求对方道歉，明确这种语气不能被接受', score: 0 },
      { id: 'd', text: '先向其他同事求证，确认大家是否也有相同看法', score: 2 },
    ],
    maxScore: 3,
  },
  {
    id: 'sa-6',
    scenario: '室友长期在你的睡眠时间打视频电话，第一次沟通后仍未改善。你下一步会怎么做？',
    options: [
      { id: 'a', text: '买耳塞继续忍耐，等换航次后自然解决', score: 1 },
      { id: 'b', text: '在同事群里说明情况，请大家评评谁更合理', score: 0 },
      { id: 'c', text: '记录时间并重谈规则，无效则申请协调', score: 3 },
      { id: 'd', text: '直接申请换舱，不再尝试和室友讨论这件事', score: 2 },
    ],
    maxScore: 3,
  },
]

export const APPLICATION_READINESS_QUESTIONS = [
  {
    id: 'ar-1',
    scenario: '如果今天只能投递一个岗位，你目前的目标状态是？',
    options: [
      { id: 'a', text: '仍在比较多个方向，还不能排出明确优先级', score: 0 },
      { id: 'b', text: '有大致方向，但会根据哪个岗位招人再决定', score: 1 },
      { id: 'c', text: '已确定主岗位和备选岗位，知道主要差距', score: 2 },
      { id: 'd', text: '锁定主岗位，能说明证据和风险', score: 3 },
    ],
    maxScore: 3,
  },
  {
    id: 'ar-2',
    scenario: '你的英文简历目前最接近哪个可验证状态？',
    options: [
      { id: 'a', text: '还没有形成一份可以发送的英文简历', score: 0 },
      { id: 'b', text: '已有通用翻译版，但没有对应具体职位要求', score: 1 },
      { id: 'c', text: '按目标职位改写，并加入两项结果证据', score: 3 },
      { id: 'd', text: '已加入岗位关键词，但案例和数据仍需要补充', score: 2 },
    ],
    maxScore: 3,
  },
  {
    id: 'ar-3',
    scenario: '准备通过代理或中介申请时，你已经完成哪种渠道核验？',
    options: [
      { id: 'a', text: '主要依据社交平台评价和对方展示的成功案例', score: 1 },
      { id: 'b', text: '核对授权、费用、合同主体和退款条款', score: 3 },
      { id: 'c', text: '对比过几家报价，选择承诺上船速度最快的一家', score: 0 },
      { id: 'd', text: '看过合同与费用，但还没有核实招聘授权关系', score: 2 },
    ],
    maxScore: 3,
  },
  {
    id: 'ar-4',
    scenario: '你的英文面试训练目前留下了什么证据？',
    options: [
      { id: 'a', text: '看过常见题，也在脑中组织过主要回答', score: 1 },
      { id: 'b', text: '写好完整答案，并能逐句背出主要内容', score: 2 },
      { id: 'c', text: '录过限时回答，并按三项标准复盘', score: 3 },
      { id: 'd', text: '还没有用英文完整回答过目标岗位问题', score: 0 },
    ],
    maxScore: 3,
  },
  {
    id: 'ar-5',
    scenario: '关于证件、体检、培训和可入职时间，你现在有哪种时间线？',
    options: [
      { id: 'a', text: '等拿到录用通知后，再按通知逐项开始办理', score: 1 },
      { id: 'b', text: '知道主要项目，但还没有确认周期和前后依赖', score: 2 },
      { id: 'c', text: '列出项目、周期、依赖和缓冲时间', score: 3 },
      { id: 'd', text: '参考他人的办理时间，预计自己也能按期完成', score: 0 },
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
