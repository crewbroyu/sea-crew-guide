export const BAR_SERVER_FOUNDATION_VERSION = 1

export const barServerFoundationDays = [
  {
    id: 'service-role',
    day: 1,
    title: '先弄清 Bar Server 到底负责什么',
    duration: '30-40 分钟',
    outcome: '能说清岗位边界、完整服务流程和责任售酒原则。',
    sections: [
      {
        title: 'Bar Server 与 Bartender 的边界',
        items: [
          'Bar Server 负责迎接客人、确认需求、介绍菜单、录入 POS、送饮品、跟进体验、清台和基础备货。',
          'Bartender 主要负责按标准配方制作饮品、控制出品质量、管理吧台设备与更专业的酒水操作。',
          '遇到不确定的配方、过敏信息、套餐规则或补偿权限时，先核实，再向客人承诺。',
        ],
      },
      {
        title: '一次完整服务的 7 个动作',
        items: [
          '主动看见客人并问候，即使很忙也先确认对方已经被注意到。',
          '确认酒精、基酒、甜度、风味和预算或套餐等关键偏好。',
          '推荐一到两款真正不同的选择，并解释为什么适合。',
          '复述订单、确认特殊要求，再准确录入 POS。',
          '与 Bartender 清楚交接，关注等待时间和订单顺序。',
          '送达时核对饮品与客人，必要时说明配料或装饰。',
          '短时间内回访，处理问题并完成清台。',
        ],
      },
      {
        title: '安全永远高于销售',
        items: [
          '年龄核验、停止供酒、酒精限量和事故上报必须遵守所在船公司的正式政策。',
          '说话含糊、站立不稳、判断力下降和行为明显变化可能是需要关注的信号，但不要直接与客人争论“你醉了”。',
          '使用中性语言停止或延后酒精服务，提供水或无酒精选择，并尽早通知主管。',
        ],
      },
    ],
    quiz: {
      question: '客人问一款你不熟悉的鸡尾酒是否包含在套餐里，最专业的处理是什么？',
      options: [
        { id: 'a', text: '先答应包含，之后再问 Bartender' },
        { id: 'b', text: '说明自己会立即核实配方和套餐规则，再给客人准确答复' },
        { id: 'c', text: '让客人自己去 Guest Services 查询' },
      ],
      correctOptionId: 'b',
      explanation: '准确性比快速承诺更重要。Bar Server 要承担沟通和核实责任，但不能越权编造规则。',
    },
    task7QuestionIds: ['bs_03', 'bs_06', 'bs_10', 'bs_31'],
  },
  {
    id: 'spirit-map',
    day: 2,
    title: '建立六大基酒地图',
    duration: '35-45 分钟',
    outcome: '看到酒名时能判断基酒、典型风味和常见鸡尾酒方向。',
    referenceGroups: [
      { name: 'Vodka', profile: '通常风味较中性、干净', examples: 'Vodka Soda、Moscow Mule、Cosmopolitan、Bloody Mary' },
      { name: 'Gin', profile: '杜松子和植物香气明显', examples: 'Gin & Tonic、Martini、Tom Collins、Negroni' },
      { name: 'Rum', profile: '从轻盈甘蔗感到深色焦糖与香料感', examples: 'Mojito、Daiquiri、Piña Colada、Mai Tai、Rum Runner' },
      { name: 'Tequila / Mezcal', profile: '龙舌兰风味；Mezcal 常带烟熏感', examples: 'Margarita、Paloma、Tequila Sunrise' },
      { name: 'Whisk(e)y', profile: '谷物、木桶、香草、香料或烟熏等风味', examples: 'Old Fashioned、Whiskey Sour、Manhattan、Highball' },
      { name: 'Brandy / Cognac', profile: '蒸馏葡萄酒，常有果干、橡木和温暖香气', examples: 'Sidecar、Brandy Alexander，或 neat 服务' },
    ],
    sections: [
      {
        title: '学习重点不是背品牌',
        items: [
          '先记“基酒 → 风味方向 → 代表性饮品”，再到船上学习分配酒吧的具体品牌和标准配方。',
          '同一种基酒可能覆盖经济、标准和 premium 多个等级，推荐前要确认预算或套餐范围。',
          'Liqueur 是增加甜味、香气或颜色的利口酒，不等于六大基酒。常见例子有 Aperol、Campari、Cointreau、Baileys、Kahlúa 和 Amaretto。',
        ],
      },
      {
        title: '客人描述如何映射到酒水方向',
        items: [
          'light / refreshing：优先考虑 soda、citrus、spritz 或 highball 结构。',
          'sweet / fruity：可能涉及果汁、糖浆、利口酒、椰奶或果泥。',
          'strong / spirit-forward：可能接近 Martini、Old Fashioned、Manhattan 或 neat spirits。',
          'smoky：先确认客人是否喜欢 smoky Scotch 或 Mezcal，不要只凭一个词直接下单。',
        ],
      },
    ],
    quiz: {
      question: '客人说想要 botanical、dry、not fruity 的饮品，最值得先确认哪类基酒？',
      options: [
        { id: 'a', text: 'Gin' },
        { id: 'b', text: 'Malibu coconut rum' },
        { id: 'c', text: 'Peach liqueur' },
      ],
      correctOptionId: 'a',
      explanation: 'Gin 的杜松子和植物香气最符合 botanical，之后还应继续确认客人喜欢 Martini、G&T 还是其他结构。',
    },
    task7QuestionIds: ['bs_02', 'bs_13', 'bs_20'],
  },
  {
    id: 'classic-cocktails',
    day: 3,
    title: '看懂邮轮酒吧最常见的经典鸡尾酒',
    duration: '45-60 分钟',
    outcome: '能说出 15 款高频饮品的基酒、结构、风味和推荐线索。',
    referenceGroups: [
      { name: '清爽长饮', profile: 'Vodka Soda、Gin & Tonic、Tom Collins、Mojito、Paloma、Aperol Spritz', examples: '常见关键词：light、refreshing、citrusy、bubbly' },
      { name: '热带与泳池酒吧', profile: 'Piña Colada、Mai Tai、Rum Runner、Blue Hawaiian、Daiquiri', examples: '常见关键词：tropical、fruity、coconut、frozen' },
      { name: '酸甜平衡', profile: 'Margarita、Whiskey Sour、Daiquiri、Cosmopolitan', examples: '通常围绕基酒 + citrus + sweetener 建立平衡' },
      { name: '烈酒感与经典', profile: 'Martini、Old Fashioned、Manhattan、Negroni', examples: '常见关键词：dry、bitter、spirit-forward、classic' },
    ],
    sections: [
      {
        title: '不要求你在面试中背毫升数',
        items: [
          'Bar Server 至少要知道主要配料、基酒、甜度和口感，才能准确推荐和复述订单。',
          '真正制作必须使用船公司的 approved recipe、量酒器具和出品标准，不要把网上配方当成公司标准。',
          '同名鸡尾酒可能因船公司、酒吧或当地原料而调整，向客人说明时应以当前菜单为准。',
        ],
      },
      {
        title: '四种快速判断方法',
        items: [
          '看基酒：决定饮品的主要酒精风格。',
          '看酸：lime、lemon、grapefruit 等决定清爽度。',
          '看甜：syrup、liqueur、juice、purée、coconut 等会提高甜度或厚重感。',
          '看长度与气泡：soda、tonic、ginger beer、Prosecco 常让饮品更长、更清爽。',
        ],
      },
    ],
    quiz: {
      question: '客人要 light、citrusy、not too sweet，并且接受 vodka，哪个方向通常更稳妥？',
      options: [
        { id: 'a', text: 'Vodka Soda with Lime' },
        { id: 'b', text: 'Piña Colada' },
        { id: 'c', text: 'Mudslide' },
      ],
      correctOptionId: 'a',
      explanation: 'Vodka Soda with Lime 结构轻、带柑橘且甜度低；实际服务仍需确认客人的具体偏好与菜单可用性。',
    },
    task7QuestionIds: ['bs_01', 'bs_04', 'bs_26', 'bs_28'],
  },
  {
    id: 'whiskey-service',
    day: 4,
    title: 'Whisky / Whiskey 与烈酒服务',
    duration: '35-45 分钟',
    outcome: '能分辨主要威士忌类型、服务方式和常见推荐问题。',
    referenceGroups: [
      { name: 'Scotch whisky', profile: '来自苏格兰；可能是 single malt 或 blended', examples: '风味可从清淡果香到泥煤烟熏，不能一概而论' },
      { name: 'Bourbon', profile: '美国威士忌，以玉米为主要谷物', examples: '常见香草、焦糖和橡木方向' },
      { name: 'Rye whiskey', profile: '黑麦比例带来更明显的香料感', examples: '常用于 Manhattan、Old Fashioned 等经典结构' },
      { name: 'Irish whiskey', profile: '常给人较柔和、易饮的印象', examples: '可 neat、on the rocks、highball 或用于鸡尾酒' },
    ],
    sections: [
      {
        title: '最常见的服务术语',
        items: [
          'neat：不加冰，直接倒入合适酒杯。',
          'on the rocks：加冰服务。',
          'with a splash of water：加少量水；必须由客人决定。',
          'highball：烈酒加较多无酒精调和饮料，通常更清爽易饮。',
          'double：双份酒精，必须遵守份量、套餐与责任售酒政策。',
        ],
      },
      {
        title: '推荐前至少问两件事',
        items: [
          '客人喜欢柔和、甜香、辛香还是烟熏方向？',
          '希望 neat、rocks、highball，还是经典鸡尾酒？',
          '确认预算或套餐范围，不要把 premium 品牌自动当成最好选择。',
        ],
      },
      {
        title: '五个高频威士忌方向',
        items: [
          'Old Fashioned：whiskey、sweetener、bitters，烈酒感明显。',
          'Whiskey Sour：whiskey、citrus、sweetener，酸甜平衡。',
          'Manhattan：whiskey、sweet vermouth、bitters，经典且酒体较强。',
          'Highball：whiskey 加 soda 或其他长饮调和，清爽。',
          'Lynchburg Lemonade：Jack Daniel’s 风格的 whiskey、citrus 与 lemonade 长饮。',
        ],
      },
    ],
    quiz: {
      question: '客人点 “whiskey neat”，你应该如何理解？',
      options: [
        { id: 'a', text: '加满碎冰' },
        { id: 'b', text: '不加冰直接服务，并按标准份量出酒' },
        { id: 'c', text: '自动加入 soda water' },
      ],
      correctOptionId: 'b',
      explanation: 'neat 表示不加冰、不自动添加调和饮料；仍需确认具体品牌和标准份量。',
    },
    task7QuestionIds: ['bs_05', 'bs_13', 'bs_20'],
  },
  {
    id: 'wine-beer-zero',
    day: 5,
    title: '葡萄酒、啤酒与无酒精选择',
    duration: '35-45 分钟',
    outcome: '面对不喝鸡尾酒的客人，也能完成基础分类、推荐与安全确认。',
    referenceGroups: [
      { name: 'Wine', profile: 'sparkling、white、rosé、red', examples: '先问干甜度、酒体、食物搭配和预算' },
      { name: 'Beer', profile: 'lager、IPA、wheat beer、stout 等', examples: '先问清爽还是浓郁、苦度接受度和本地/进口偏好' },
      { name: 'Non-alcoholic', profile: 'mocktail、soda、juice、coffee、water', examples: '不能只给果汁；也要询问甜度、气泡和过敏信息' },
    ],
    sections: [
      {
        title: '葡萄酒只需先掌握服务级基础',
        items: [
          'Sparkling 常用于庆祝或餐前；Sauvignon Blanc 往往偏清爽；Chardonnay 风格跨度较大；Pinot Noir 通常比 Cabernet Sauvignon 更轻。',
          '推荐时用 light / full-bodied、dry / sweet、crisp / fruity 等客人容易理解的词，不要假装是侍酒师。',
          '整瓶服务通常涉及展示酒标、确认、按标准开瓶与倒酒，必须遵守所在酒吧流程。',
        ],
      },
      {
        title: '啤酒与无酒精也有推荐逻辑',
        items: [
          'Lager 通常清爽易饮；IPA 常有更明显的啤酒花苦味与香气；wheat beer 可能有柑橘、香蕉或香料感；stout 更深色浓郁。',
          '无酒精不等于无风险：仍需确认坚果、乳制品、蛋白、香料或其他潜在过敏原，并核实交叉接触信息。',
          '不要把 non-alcoholic 和 alcohol-free 的法律或公司定义混为一谈，按当前菜单与政策说明。',
        ],
      },
    ],
    quiz: {
      question: '客人说不喝酒、也不喜欢甜饮，最佳下一步是什么？',
      options: [
        { id: 'a', text: '直接给一杯很甜的果汁' },
        { id: 'b', text: '询问是否喜欢 citrus 和 sparkling，再推荐低甜度 mocktail 或 soda-based 选择' },
        { id: 'c', text: '告诉客人酒吧没有适合的饮品' },
      ],
      correctOptionId: 'b',
      explanation: '无酒精推荐同样要从偏好出发，并用具体风味解释选择。',
    },
    task7QuestionIds: ['bs_33', 'bs_39'],
  },
  {
    id: 'cruise-menu-patterns',
    day: 6,
    title: '五家邮轮公司的菜单样本怎么读',
    duration: '45-60 分钟',
    outcome: '理解不同品牌与酒吧场景的菜单侧重点，而不是死背一份会变化的酒单。',
    cruiseLinePatterns: [
      {
        company: 'Royal Caribbean 皇家加勒比',
        pattern: '泳池酒吧偏热带与度假风，特色酒吧同时保留 Martini、Old Fashioned、G&T 等经典方向。',
        examples: '官方样本可见 Mai Tai、Rum Runner、Blue Hawaiian、Aperol sparkling drinks，以及按基酒组织的饮品。',
      },
      {
        company: 'Princess 公主邮轮',
        pattern: '经典酒廊、Martini、Italian aperitivo、泳池热带饮品与故事型 signature cocktails 并存。',
        examples: '公开样本覆盖 Margarita、Spritz、tropical cocktails，并列出完整 Vodka、Gin、Rum、Whisk(e)y 等烈酒分类。',
      },
      {
        company: 'Carnival 嘉年华',
        pattern: '氛围轻松，frozen、tropical、Margarita、Daiquiri 与定制型 craft cocktails 较突出。',
        examples: '官方菜单样本包括 Aperol Spritz、Lynchburg Lemonade、Mojito、Margarita、Strawberry Daiquiri 等方向。',
      },
      {
        company: 'Norwegian Cruise Line 诺唯真',
        pattern: '按主题酒吧分化明显，包括 Martini、Mojito、Whiskey、Sake、Beer、pool bar 与 atrium bar。',
        examples: '学习重点是先判断自己所在 venue 的主题，再熟悉该酒吧的 approved menu 与库存。',
      },
      {
        company: 'Costa 歌诗达',
        pattern: 'Italian aperitivo、Spritz、经典鸡尾酒、咖啡文化和多层级饮品套餐较突出。',
        examples: '官方套餐说明提及 Gin & Tonic、Mojito、Bacardi Breezer、whisky、brandy、cognac 与 premium cocktails。',
      },
    ],
    sections: [
      {
        title: '所有菜单都要带着三个问题看',
        items: [
          '这是什么类型的 venue：pool bar、martini lounge、whiskey bar、piano bar 还是 atrium bar？',
          '菜单如何组织：按基酒、风味、酒吧主题、价格或套餐等级？',
          '哪些信息可能变化：价格、品牌、配方、套餐上限、服务费、供应情况和航线政策。',
        ],
      },
      {
        title: '面试中正确的表达方式',
        items: [
          '可以说明你研究过目标公司的公开菜单风格，但不要声称自己背过所有船的当前菜单。',
          '强调自己会快速学习 assigned venue 的 approved recipes、brands、POS buttons 和 package rules。',
          '真正专业不是背 100 个品牌，而是能把菜单知识转化成准确推荐、销售和安全服务。',
        ],
      },
    ],
    quiz: {
      question: '为什么不能把一份网上找到的邮轮酒单当成所有船都适用的标准？',
      options: [
        { id: 'a', text: '因为邮轮酒吧从来不提供菜单' },
        { id: 'b', text: '因为船、venue、航线、库存、价格和套餐规则都可能变化' },
        { id: 'c', text: '因为所有邮轮公司只卖同一种鸡尾酒' },
      ],
      correctOptionId: 'b',
      explanation: '公开酒单适合学习结构和风格；实际服务必须以当前船舶、当前 venue 的菜单和政策为准。',
    },
    task7QuestionIds: ['bs_27', 'bs_28', 'bs_33'],
  },
  {
    id: 'service-application',
    day: 7,
    title: '把酒水知识变成服务与面试答案',
    duration: '45-60 分钟',
    outcome: '能完成推荐、客诉、缺货、开档和收档五类关键场景。',
    sections: [
      {
        title: '推荐公式：Ask → Match → Explain → Confirm',
        items: [
          'Ask：只问真正影响结果的偏好，例如基酒、甜度、风味、酒精或预算。',
          'Match：选择一款最匹配的饮品，必要时给一个不同方向的备选。',
          'Explain：用客人听得懂的风味词说明为什么适合。',
          'Confirm：核实套餐、价格、配方调整和最终订单。',
        ],
      },
      {
        title: '开档与高峰期',
        items: [
          '检查清洁、玻璃杯、冰、garnish、napkin、straw、菜单、库存、设备、POS 和安全区域。',
          '高峰期先看见等待客人、保持订单准确、清楚交接，不用牺牲安全换速度。',
          '热门原料缺货时先道歉并推荐真正可比的替代，不要偷偷换配方。',
        ],
      },
      {
        title: '客诉与收档',
        items: [
          '饮品不符合预期时先承认体验，确认问题，再按权限重做、替换或请主管支持。',
          '收档要核对库存与 POS 差异、记录损耗、清洁设备、补充物料并报告异常。',
          '任何差异都要重新核对和上报，不隐藏、不擅自改记录。',
        ],
      },
    ],
    quiz: {
      question: '客人想要一杯不太甜的热带饮品，但常用原料缺货。最好的回答结构是什么？',
      options: [
        { id: 'a', text: '偷偷换一种原料，不告诉客人' },
        { id: 'b', text: '说明缺货，确认客人最在意的风味，再推荐一款可用且甜度可控的替代品' },
        { id: 'c', text: '只说 sold out，然后离开' },
      ],
      correctOptionId: 'b',
      explanation: '专业替代必须透明、基于需求且能解释差异，这同时体现产品知识、服务和销售判断。',
    },
    task7QuestionIds: ['bs_20', 'bs_21', 'bs_29', 'bs_31', 'bs_32', 'bs_34'],
  },
]

export const barServerFoundationSources = [
  {
    company: 'Royal Caribbean',
    label: 'The Lime and Coconut sample menu',
    url: 'https://www.royalcaribbean.com/content/dam/royal/resources/menus/the-lime-and-coconut-menu-sample.pdf',
  },
  {
    company: 'Princess Cruises',
    label: 'Wheelhouse Bar sample menu',
    url: 'https://www.princess.com/content/dam/princess/onboard-experience/food-dining/pdfs/may-2025/Wheelhouse-Bar-Beverage-SAMPLE-MENU.pdf',
  },
  {
    company: 'Carnival Cruise Line',
    label: 'Serenity Bar sample menu',
    url: 'https://www.carnival.com/~/media/Images/explore/onboard/bars/menus/serenity-bar-menu.pdf',
  },
  {
    company: 'Norwegian Cruise Line',
    label: 'Bars and lounges overview',
    url: 'https://www.ncl.com/cruise-ships/norwegian-breakaway/whats-on-board/bars-and-lounges',
  },
  {
    company: 'Costa Cruises',
    label: 'My Drinks package overview',
    url: 'https://www.costacruises.com/experience/drink-package.html',
  },
]

export const getCompletedFoundationDays = (progress = {}) =>
  barServerFoundationDays.filter((day) => progress[day.id]?.completedAt).length

