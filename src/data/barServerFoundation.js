export const BAR_SERVER_FOUNDATION_VERSION = 2

// English-first shift labs sit beside the Chinese safety notes below. Keeping
// them separate makes the speaking layer reusable when more job packs arrive.
export const barServerShiftLabs = {
  'service-role': {
    shift: { location: 'Atrium Bar', time: 'Embarkation Day · 5:30 PM', situation: 'New guests are arriving while the bar is filling quickly.' },
    mission: 'Welcome a guest, discover what they want, recommend one drink, confirm the order and close the interaction professionally.',
    vocabulary: [
      { term: 'recommend', ipa: '/ˌrekəˈmend/', meaning: '推荐', example: 'What would you recommend?' },
      { term: 'preference', ipa: '/ˈprefrəns/', meaning: '偏好', example: 'May I ask about your drink preferences?' },
      { term: 'confirm', ipa: '/kənˈfɜːrm/', meaning: '确认', example: 'Let me confirm your order.' },
      { term: 'beverage package', ipa: '/ˈbevərɪdʒ ˌpækɪdʒ/', meaning: '饮品套餐', example: 'I’ll check whether it is included in your beverage package.' },
      { term: 'intoxication', ipa: '/ɪnˌtɒksɪˈkeɪʃən/', meaning: '醉酒状态', example: 'Guest safety comes before another sale.' },
    ],
    serviceLines: [
      { cue: 'Acknowledge a waiting guest', line: 'Good evening. I’ll be right with you. Thank you for waiting.' },
      { cue: 'Discover a preference', line: 'Are you looking for something refreshing, fruity, dry or spirit-forward?' },
      { cue: 'Confirm before sending', line: 'That’s one Mojito, less sweet, with no straw. Is that correct?' },
    ],
    challenge: { role: 'Guest', prompt: 'I don’t know what I want. Just bring me something good, but I don’t like sweet drinks.' },
  },
  'spirit-map': {
    shift: { location: 'Lobby Bar', time: 'Evening Service · 7:15 PM', situation: 'A guest is comparing several base spirits before ordering.' },
    mission: 'Recognize the six main spirit families and describe each one with simple, guest-friendly flavor language.',
    vocabulary: [
      { term: 'vodka', ipa: '/ˈvɒdkə/', meaning: '伏特加', example: 'Vodka is often clean and neutral in flavor.' },
      { term: 'gin', ipa: '/dʒɪn/', meaning: '金酒', example: 'Gin usually has juniper and botanical notes.' },
      { term: 'rum', ipa: '/rʌm/', meaning: '朗姆酒', example: 'Rum can range from light to rich and spiced.' },
      { term: 'tequila', ipa: '/təˈkiːlə/', meaning: '龙舌兰酒', example: 'Tequila is made from agave.' },
      { term: 'whisk(e)y', ipa: '/ˈwɪski/', meaning: '威士忌', example: 'Whiskey may show grain, oak, spice or smoke.' },
      { term: 'brandy', ipa: '/ˈbrændi/', meaning: '白兰地', example: 'Brandy is distilled from wine or fermented fruit.' },
    ],
    serviceLines: [
      { cue: 'Clarify the base spirit', line: 'Do you usually prefer vodka, gin, rum, tequila or whiskey?' },
      { cue: 'Describe gin simply', line: 'This gin is dry and botanical, with noticeable juniper and citrus notes.' },
      { cue: 'Avoid guessing', line: 'Let me confirm the brand and flavor profile with the bartender.' },
    ],
    challenge: { role: 'Guest', prompt: 'I usually drink vodka, but tonight I’d like to try something with more character. What would you suggest?' },
  },
  'classic-cocktails': {
    shift: { location: 'Pool Bar', time: 'Sea Day · 2:00 PM', situation: 'Guests are asking for familiar refreshing and tropical cocktails.' },
    mission: 'Identify common cocktails by base spirit, structure and taste, then match one to a guest’s request.',
    vocabulary: [
      { term: 'Mojito', ipa: '/moʊˈhiːtoʊ/', meaning: '莫吉托', example: 'Rum, lime, mint, sugar and soda water.' },
      { term: 'Daiquiri', ipa: '/ˈdaɪkəri/', meaning: '代基里', example: 'Rum, citrus and sweetener in a balanced sour style.' },
      { term: 'Piña Colada', ipa: '/ˌpiːnjə kəˈlɑːdə/', meaning: '椰林飘香', example: 'Rum, pineapple and coconut; creamy and tropical.' },
      { term: 'Negroni', ipa: '/neɪˈɡroʊni/', meaning: '内格罗尼', example: 'Gin, sweet vermouth and Campari; bitter and spirit-forward.' },
      { term: 'Aperol Spritz', ipa: '/ˈæpərɒl sprɪts/', meaning: '阿佩罗气泡酒', example: 'Bubbly, bittersweet and refreshing.' },
      { term: 'citrusy', ipa: '/ˈsɪtrəsi/', meaning: '柑橘风味的', example: 'It is light, citrusy and not too sweet.' },
    ],
    serviceLines: [
      { cue: 'Recommend a Mojito', line: 'I’d recommend a Mojito. It’s refreshing and citrusy, with fresh mint and a light sweetness.' },
      { cue: 'Offer a drier option', line: 'For something drier, I can suggest a Gin and Tonic with a fresh lime garnish.' },
      { cue: 'Control sweetness', line: 'We can make it less sweet, subject to the bar’s approved recipe.' },
    ],
    challenge: { role: 'Guest', prompt: 'I’d like something tropical, but creamy drinks are too heavy for me. What do you recommend?' },
  },
  'whiskey-service': {
    shift: { location: 'Whiskey Bar', time: 'Late Evening · 9:40 PM', situation: 'A guest wants help choosing a whiskey and serving style.' },
    mission: 'Explain major whiskey styles and confirm whether the guest wants it neat, on the rocks, with water or in a cocktail.',
    vocabulary: [
      { term: 'Scotch whisky', ipa: '/skɒtʃ ˈwɪski/', meaning: '苏格兰威士忌', example: 'Scotch may range from light and fruity to smoky and peated.' },
      { term: 'bourbon', ipa: '/ˈbɜːrbən/', meaning: '波本威士忌', example: 'Bourbon often shows vanilla, caramel and oak.' },
      { term: 'rye whiskey', ipa: '/raɪ ˈwɪski/', meaning: '黑麦威士忌', example: 'Rye whiskey often has a spicier character.' },
      { term: 'neat', ipa: '/niːt/', meaning: '不加冰、不加调和饮料', example: 'Would you like it neat or on the rocks?' },
      { term: 'on the rocks', ipa: '/ɒn ðə rɒks/', meaning: '加冰饮用', example: 'He ordered bourbon on the rocks.' },
      { term: 'spirit-forward', ipa: '/ˈspɪrɪt ˌfɔːrwərd/', meaning: '烈酒感突出的', example: 'An Old Fashioned is spirit-forward.' },
    ],
    serviceLines: [
      { cue: 'Learn the guest’s taste', line: 'Do you prefer something smooth and approachable, spicy, or smoky?' },
      { cue: 'Confirm service style', line: 'Would you like it neat, on the rocks, or with a small splash of water?' },
      { cue: 'Offer a premium option', line: 'If you enjoy that style, I can also show you a premium alternative within your package range.' },
    ],
    challenge: { role: 'Guest', prompt: 'I’m new to whiskey. I want something smooth, not smoky, and easy to drink.' },
  },
  'wine-beer-zero': {
    shift: { location: 'Wine & Tap Bar', time: 'Pre-dinner · 6:00 PM', situation: 'A couple wants one glass of wine and one beer before dinner.' },
    mission: 'Recognize common wine and beer styles, ask useful preference questions and make a simple recommendation without pretending to be a sommelier.',
    vocabulary: [
      { term: 'Sauvignon Blanc', ipa: '/ˌsoʊvɪnˈjoʊn blɑːŋk/', meaning: '长相思', example: 'Often crisp, refreshing and citrus-led.' },
      { term: 'Chardonnay', ipa: '/ˌʃɑːrdəˈneɪ/', meaning: '霞多丽', example: 'Styles range from fresh and unoaked to rich and creamy.' },
      { term: 'Pinot Noir', ipa: '/ˌpiːnoʊ ˈnwɑːr/', meaning: '黑皮诺', example: 'Usually lighter-bodied with red-fruit character.' },
      { term: 'Cabernet Sauvignon', ipa: '/ˌkæbərneɪ soʊvɪnˈjoʊn/', meaning: '赤霞珠', example: 'Often fuller-bodied with darker fruit and firmer tannin.' },
      { term: 'lager', ipa: '/ˈlɑːɡər/', meaning: '拉格啤酒', example: 'Usually clean, crisp and easy-drinking.' },
      { term: 'India Pale Ale (IPA)', ipa: '/ˌɪndiə peɪl ˈeɪl/', meaning: '印度淡色艾尔', example: 'Usually more hop-forward, aromatic and bitter.' },
      { term: 'stout', ipa: '/staʊt/', meaning: '世涛啤酒', example: 'Often dark with roasted coffee or chocolate notes.' },
    ],
    serviceLines: [
      { cue: 'Recommend wine', line: 'Would you prefer white, red, rosé or sparkling, and do you like it dry or slightly sweet?' },
      { cue: 'Recommend beer', line: 'Would you like something crisp and easy-drinking, hoppy and bitter, or dark and roasted?' },
      { cue: 'Stay accurate', line: 'Let me check which labels are available by the glass and included in your package.' },
    ],
    challenge: { role: 'Guest', prompt: 'I usually drink lager, but I want to try a beer with more flavor without too much bitterness.' },
  },
  'public-health': {
    shift: { location: 'Pool Bar', time: 'Opening Check · 10:30 AM', situation: 'The supervisor asks you to explain the public-health checks before service.' },
    mission: 'Protect guests through correct hand hygiene, illness reporting, safe ice and garnish handling, and contamination control.',
    vocabulary: [
      { term: 'sanitize', ipa: '/ˈsænətaɪz/', meaning: '清洁之后进行消毒', example: 'Clean the surface first, then sanitize it.' },
      { term: 'cross-contamination', ipa: '/ˌkrɒs kənˌtæmɪˈneɪʃən/', meaning: '交叉污染', example: 'Keep dirty glassware away from sanitized items.' },
      { term: 'food-contact surface', ipa: '/ˈfuːd kɒntækt ˌsɜːrfɪs/', meaning: '食品接触面', example: 'Food-contact surfaces require approved cleaning and sanitizing.' },
      { term: 'illness reporting', ipa: '/ˈɪlnəs rɪˌpɔːrtɪŋ/', meaning: '疾病症状报告', example: 'Vomiting or diarrhea must be reported immediately.' },
      { term: 'contact time', ipa: '/ˈkɒntækt taɪm/', meaning: '消毒剂有效接触时间', example: 'Follow the label for concentration and contact time.' },
      { term: 'test strip', ipa: '/test strɪp/', meaning: '浓度测试条', example: 'Use the approved test strip when required.' },
    ],
    serviceLines: [
      { cue: 'Report an equipment failure', line: 'The glasswasher is not meeting the required standard, so I have stopped using it and informed my supervisor.' },
      { cue: 'Protect the ice', line: 'I use the designated scoop and never handle service ice with a glass or my bare hands.' },
      { cue: 'Report illness', line: 'I would report symptoms immediately and follow the medical and public-health procedure.' },
    ],
    challenge: { role: 'Bar Manager', prompt: 'The bar opens in ten minutes, but the glasswasher is not reaching its required operating standard. What do you do?' },
  },
  'glassware-garnish': {
    shift: { location: 'Cocktail Bar', time: 'Mise en Place · 4:30 PM', situation: 'You must prepare glassware and fresh garnishes before a busy evening.' },
    mission: 'Select suitable glassware, describe the approved warewashing flow and handle cocktail garnishes as food.',
    vocabulary: [
      { term: 'highball glass', ipa: '/ˈhaɪbɔːl ɡlɑːs/', meaning: '高球杯', example: 'Use it for long drinks with a larger mixer volume.' },
      { term: 'rocks glass', ipa: '/rɒks ɡlɑːs/', meaning: '古典杯、威士忌杯', example: 'An Old Fashioned is commonly served in a rocks glass.' },
      { term: 'stemware', ipa: '/ˈstemweər/', meaning: '高脚杯类', example: 'Hold clean stemware by the stem or base.' },
      { term: 'garnish', ipa: '/ˈɡɑːrnɪʃ/', meaning: '鸡尾酒装饰物', example: 'The garnish should match the approved recipe.' },
      { term: 'citrus twist', ipa: '/ˈsɪtrəs twɪst/', meaning: '柑橘皮扭花', example: 'Express the citrus oils over the drink when the recipe requires it.' },
      { term: 'air-dry', ipa: '/ˌeər ˈdraɪ/', meaning: '自然风干', example: 'Sanitized glassware must air-dry before storage.' },
    ],
    serviceLines: [
      { cue: 'Reject an unsafe glass', line: 'This glass still has residue on it, so I’ll send it back through the approved cleaning and sanitizing process.' },
      { cue: 'Explain garnish safety', line: 'I prepare garnishes with clean tools, protect and label them, and discard anything outside the required standard.' },
      { cue: 'Confirm a glass choice', line: 'I would use the venue’s approved glassware for this drink and check for chips, cracks and residue before service.' },
    ],
    challenge: { role: 'Bartender', prompt: 'You find lipstick on a freshly washed glass, and the bar has run out of that glass type during peak service. What do you do?' },
  },
  'cruise-menu-patterns': {
    shift: { location: 'Assigned Venue', time: 'First Contract · Day 2', situation: 'Your trainer asks how you will learn a menu that differs from the one you studied ashore.' },
    mission: 'Read a cruise-bar menu by venue, spirit, flavor, price and package rules instead of memorizing one outdated menu.',
    vocabulary: [
      { term: 'assigned venue', ipa: '/əˈsaɪnd ˈvenjuː/', meaning: '被分配工作的具体酒吧场所', example: 'I will learn the approved menu for my assigned venue.' },
      { term: 'signature cocktail', ipa: '/ˈsɪɡnətʃər ˈkɒkteɪl/', meaning: '招牌鸡尾酒', example: 'This is one of the venue’s signature cocktails.' },
      { term: 'availability', ipa: '/əˌveɪləˈbɪləti/', meaning: '供应情况', example: 'Prices and availability may change by sailing.' },
      { term: 'package limit', ipa: '/ˈpækɪdʒ ˌlɪmɪt/', meaning: '套餐价格或数量限制', example: 'I’ll confirm the package limit before placing the order.' },
      { term: 'approved recipe', ipa: '/əˈpruːvd ˈresəpi/', meaning: '公司批准的标准配方', example: 'The bartender follows the approved recipe.' },
    ],
    serviceLines: [
      { cue: 'Explain your learning method', line: 'I study the menu by spirit, flavor, price and package eligibility, then practise describing each key drink.' },
      { cue: 'Handle uncertainty', line: 'Menus and availability can vary, so I’ll verify the current sailing’s information before promising anything.' },
      { cue: 'Explain a venue', line: 'This venue focuses on tropical and frozen drinks, while the lounge offers more classic and spirit-forward cocktails.' },
    ],
    challenge: { role: 'Bar Manager', prompt: 'You studied another ship’s menu online. How will you learn our current venue without confusing guests?' },
  },
  'service-application': {
    shift: { location: 'Atrium Bar', time: 'Sea Day Rush · 8:20 PM', situation: 'The bar is busy, one ingredient is unavailable and a guest is unhappy with the wait.' },
    mission: 'Combine product knowledge, service recovery, safe upselling, stock awareness and clear team communication.',
    vocabulary: [
      { term: 'acknowledge', ipa: '/əkˈnɒlɪdʒ/', meaning: '先承认并回应客人的感受或等待', example: 'Acknowledge the delay before offering a solution.' },
      { term: 'substitute', ipa: '/ˈsʌbstɪtuːt/', meaning: '替代品', example: 'I can recommend a comparable substitute.' },
      { term: 'upsell', ipa: '/ˈʌpsel/', meaning: '基于需求进行升级销售', example: 'Upsell only when the premium option genuinely fits the guest.' },
      { term: 'discrepancy', ipa: '/dɪˈskrepənsi/', meaning: '记录与实际不一致', example: 'Report any stock or POS discrepancy.' },
      { term: 'handover', ipa: '/ˈhændoʊvər/', meaning: '交接', example: 'Give the bartender a clear and accurate handover.' },
    ],
    serviceLines: [
      { cue: 'Recover from a delay', line: 'I’m sorry for the wait. Thank you for your patience. Let me confirm your order and update you right away.' },
      { cue: 'Offer a substitute', line: 'That ingredient is currently unavailable, but I can recommend a similar option with the same citrusy, low-sweetness profile.' },
      { cue: 'Upsell appropriately', line: 'If you enjoy a smoother finish, there is also a premium option. I can confirm the price and package coverage for you.' },
    ],
    challenge: { role: 'Complaining Guest', prompt: 'I’ve waited fifteen minutes, and now you’re telling me my drink is unavailable. This is unacceptable.' },
  },
}

export const barServerFoundationDays = [
  {
    id: 'service-role',
    day: 1,
    title: 'Your First Bar Shift',
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
      question: 'A guest asks whether an unfamiliar cocktail is included in the beverage package. What is the most professional response?',
      options: [
        { id: 'a', text: 'Promise that it is included, then ask the bartender later.' },
        { id: 'b', text: 'Tell the guest you will check the recipe and package rules, then return with an accurate answer.' },
        { id: 'c', text: 'Send the guest to Guest Services to find out.' },
      ],
      correctOptionId: 'b',
      explanation: 'Accuracy matters more than a quick promise. Take responsibility for checking, but never invent package rules.',
    },
    task7QuestionIds: ['bs_03', 'bs_06', 'bs_10', 'bs_31'],
  },
  {
    id: 'spirit-map',
    day: 2,
    title: 'Build Your Spirit Map',
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
      question: 'A guest wants something botanical, dry and not fruity. Which base spirit should you explore first?',
      options: [
        { id: 'a', text: 'Gin' },
        { id: 'b', text: 'Malibu coconut rum' },
        { id: 'c', text: 'Peach liqueur' },
      ],
      correctOptionId: 'a',
      explanation: 'Gin best matches the botanical description. Continue by asking whether the guest prefers a Martini, a Gin and Tonic or another style.',
    },
    task7QuestionIds: ['bs_02', 'bs_13', 'bs_20'],
  },
  {
    id: 'classic-cocktails',
    day: 3,
    title: 'Know the Classic Cocktails',
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
      question: 'A guest wants something light, citrusy and not too sweet, and likes vodka. Which option is usually the best match?',
      options: [
        { id: 'a', text: 'Vodka Soda with Lime' },
        { id: 'b', text: 'Piña Colada' },
        { id: 'c', text: 'Mudslide' },
      ],
      correctOptionId: 'a',
      explanation: 'A Vodka Soda with Lime is light, citrusy and low in sweetness. Confirm the guest’s preferences and current menu availability.',
    },
    task7QuestionIds: ['bs_01', 'bs_04', 'bs_26', 'bs_28'],
  },
  {
    id: 'whiskey-service',
    day: 4,
    title: 'Serve Whiskey with Confidence',
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
      question: 'What does a guest mean when ordering “whiskey neat”?',
      options: [
        { id: 'a', text: 'Fill the glass with crushed ice.' },
        { id: 'b', text: 'Serve the standard measure without ice or mixer.' },
        { id: 'c', text: 'Automatically add soda water.' },
      ],
      correctOptionId: 'b',
      explanation: 'Neat means no ice and no automatic mixer. You still need to confirm the brand and follow the standard measure.',
    },
    task7QuestionIds: ['bs_05', 'bs_13', 'bs_20'],
  },
  {
    id: 'wine-beer-zero',
    day: 5,
    title: 'Navigate Wine, Beer & Zero-proof Drinks',
    duration: '45-60 分钟',
    outcome: '能说出高频葡萄酒和啤酒类型、代表名称与基础推荐逻辑。',
    referenceGroups: [
      { name: 'Sparkling Wine', profile: '通常酸度较高、带气泡，常见 dry 到 sweet 风格', examples: 'Champagne、Prosecco、Cava；先确认甜度和预算' },
      { name: 'White Wine', profile: '从轻盈清爽到饱满圆润', examples: 'Sauvignon Blanc、Pinot Grigio、Riesling、Chardonnay' },
      { name: 'Red Wine', profile: '从轻酒体红果味到饱满单宁与深色水果', examples: 'Pinot Noir、Merlot、Malbec、Cabernet Sauvignon' },
      { name: 'Rosé / Fortified Wine', profile: 'Rosé 常清爽果香；fortified wine 酒精度更高、服务份量不同', examples: 'Rosé、Port、Sherry、Vermouth' },
      { name: 'Lager family', profile: '通常清爽、干净、易饮', examples: 'International lager、Pilsner；Pilsner 往往酒花感更明显' },
      { name: 'Ale family', profile: '风味跨度大，发酵或酒花特征更突出', examples: 'Pale Ale、IPA、Wheat Beer、Stout、Porter' },
      { name: 'Non-alcoholic', profile: 'mocktail、soda、juice、coffee、water', examples: '不能只给果汁；也要询问甜度、气泡和过敏信息' },
    ],
    sections: [
      {
        title: '葡萄酒只需先掌握服务级基础',
        items: [
          '先记“类型 + 代表葡萄/名称 + 风味”：Sauvignon Blanc 常偏清爽草本，Riesling 可干可甜，Chardonnay 风格跨度较大。',
          '红葡萄酒中 Pinot Noir 通常较轻，Merlot 常较圆润，Cabernet Sauvignon 往往更饱满、单宁更明显。不能把这些倾向当成每一瓶酒的绝对答案。',
          '推荐时用 light / full-bodied、dry / sweet、crisp / fruity 等客人容易理解的词，不要假装是侍酒师。',
          '整瓶服务通常涉及展示酒标、确认、按标准开瓶与倒酒，必须遵守所在酒吧流程。',
        ],
      },
      {
        title: '啤酒与无酒精也有推荐逻辑',
        items: [
          'Lager 通常清爽易饮；Pilsner 更突出酒花与苦度；IPA 常有明显的 citrus、tropical、pine 等酒花香气。',
          'Wheat beer 可能有柑橘、香蕉或香料感；stout / porter 常见 coffee、chocolate、roasted malt 方向。',
          '客人说品牌名时先确认当前库存、瓶装/罐装/生啤和套餐范围；不知道某款酒时查菜单或问 Bartender，不凭印象编造。',
          '无酒精不等于无风险：仍需确认坚果、乳制品、蛋白、香料或其他潜在过敏原，并核实交叉接触信息。',
          '不要把 non-alcoholic 和 alcohol-free 的法律或公司定义混为一谈，按当前菜单与政策说明。',
        ],
      },
    ],
    quiz: {
      question: 'A guest does not drink alcohol and dislikes sweet drinks. What should you do next?',
      options: [
        { id: 'a', text: 'Bring a very sweet fruit juice.' },
        { id: 'b', text: 'Ask about citrus and sparkling preferences, then suggest a low-sweetness mocktail or soda-based option.' },
        { id: 'c', text: 'Say that the bar has nothing suitable.' },
      ],
      correctOptionId: 'b',
      explanation: 'A non-alcoholic recommendation should still begin with the guest’s preferences and a clear flavor description.',
    },
    task7QuestionIds: ['bs_39', 'bs_45', 'bs_46'],
  },
  {
    id: 'public-health',
    day: 6,
    title: 'Protect Public Health',
    duration: '40-50 分钟',
    outcome: '能解释个人卫生、疾病报告、交叉污染与食品接触面的基本处理原则。',
    referenceGroups: [
      { name: 'Personal hygiene', profile: '正确洗手、干净制服、伤口保护、避免徒手接触即食食品', examples: '开始工作、污染后、如厕后、处理脏杯后都要按船上程序洗手' },
      { name: 'Illness reporting', profile: '呕吐、腹泻等症状必须立即报告，不带病处理饮品或 garnish', examples: '不要隐瞒症状，也不要自行决定何时恢复食品服务工作' },
      { name: 'Cross-contamination', profile: '把脏杯、清洁杯、化学品、冰、工具和 garnish 分开', examples: '冰铲有固定洁净存放位置；破杯后的冰槽按程序停用和处理' },
      { name: 'Clean then sanitize', profile: 'Cleaning 去除污物，sanitizing 在清洁之后降低微生物风险', examples: '浓度、接触时间、温度和检测方法以设备标签及船公司 SOP 为准' },
    ],
    sections: [
      {
        title: 'Bar Server 每班都要做到的 Public Health 行为',
        items: [
          '只从指定区域取冰并使用冰铲；杯子、手和任何脏器具都不能伸进食用冰。',
          '手接触脸、手机、脏杯、垃圾、清洁布或化学品后，按程序洗手再回到饮品与 garnish 操作。',
          '食品接触面必须先清洁再消毒；不能用同一块脏布在吧台、杯口和设备间来回擦。',
          '化学品保持原标签或正确工作标签，远离饮品、冰和 garnish；绝不凭感觉混配浓度。',
        ],
      },
      {
        title: '面试最看重的不是背数值，而是守程序',
        items: [
          '不同船舶设备和 approved chemical 可能不同，回答时说明会检查标签、测试结果和公司标准。',
          '设备温度、消毒浓度或洗杯结果不达标时，停止使用受影响设备，隔离未确认洁净的物品并通知主管。',
          '客人呕吐、腹泻或出现血液污染时，不自行用普通抹布处理；保护现场并启动指定的上报与消毒流程。',
        ],
      },
    ],
    quiz: {
      question: 'The glasswasher is not meeting its required operating standard, but the bar is about to open. What should you do?',
      options: [
        { id: 'a', text: 'Keep using it because the glasses look clean.' },
        { id: 'b', text: 'Stop using it, protect unverified glassware, inform the supervisor and follow the approved alternative procedure.' },
        { id: 'c', text: 'Polish every glass with a towel and treat that as sanitizing.' },
      ],
      correctOptionId: 'b',
      explanation: 'Looking clean does not prove that glassware was sanitized. Stop, isolate, report and use only the approved alternative procedure.',
    },
    task7QuestionIds: ['bs_33', 'bs_36', 'bs_41', 'bs_42'],
  },
  {
    id: 'glassware-garnish',
    day: 7,
    title: 'Master Glassware & Garnishes',
    duration: '45-60 分钟',
    outcome: '能选择常见杯型，说明安全洗杯流程，并正确准备、保存和使用装饰物。',
    referenceGroups: [
      { name: 'Highball / Collins', profile: '高直杯，适合较长、含较多 mixer 或气泡的饮品', examples: 'Highball、Tom Collins、Mojito（以公司标准为准）' },
      { name: 'Rocks / Old Fashioned', profile: '短而宽，适合 rocks 或 spirit-forward 饮品', examples: 'Old Fashioned、whiskey on the rocks' },
      { name: 'Cocktail / Martini / Coupe', profile: '常用于过滤后、不加冰呈现的鸡尾酒', examples: 'Martini、Cosmopolitan、Daiquiri；拿杯梗或杯底，避免碰杯口' },
      { name: 'Wine / Flute', profile: '按酒款与当前服务标准选择杯型', examples: 'red、white、sparkling 的杯型与容量可能不同' },
      { name: 'Beer glassware', profile: 'Pint、Pilsner、Weizen 等用于不同啤酒呈现', examples: '杯型以 venue 配置为准，重点是洁净、无油脂、无裂口' },
      { name: 'Common garnishes', profile: 'citrus wedge/wheel/twist、cherry、olive、mint、pineapple 等', examples: '装饰应匹配配方和香气，不是随手往杯里塞水果' },
    ],
    sections: [
      {
        title: '一只杯子从脏到可用的工作逻辑',
        items: [
          '先倒空和预处理，再按指定机器或洗涤流程完成 wash、rinse、sanitize；检查设备和化学品状态。',
          '洗后检查 lipstick、油膜、碎屑、裂纹和缺口；不合格杯具重新处理或报废，不直接交给客人。',
          '清洁消毒后的杯具应充分 air-dry / drain；不要用潮湿或反复使用的布擦杯口。',
          '按指定位置倒置或防尘存放，拿杯梗、杯底或下半部，避免触碰客人饮用接触区域。',
        ],
      },
      {
        title: 'Garnish 既是出品，也是食品安全',
        items: [
          '使用新鲜、合格、按程序清洗与切配的原料；砧板、刀具、夹子和容器保持清洁并防止交叉接触。',
          '按时间与温度要求覆盖、标识、保存和轮换；变色、干枯、受污染或超过规定时间的 garnish 必须丢弃。',
          '使用夹子或规定工具取用，不徒手反复抓取；过敏或成分不确定时查 approved ingredient information。',
          '装饰必须与菜单和标准配方一致。客人要求调整时先确认是否影响过敏、安全或出品标准。',
        ],
      },
    ],
    quiz: {
      question: 'A freshly washed glass still has lipstick on it, and no clean glass of the same type is available during peak service. What should you do?',
      options: [
        { id: 'a', text: 'Wipe the rim with your apron and use it.' },
        { id: 'b', text: 'Rewash and sanitize it. If necessary, use an approved alternative glass and inform the team.' },
        { id: 'c', text: 'Hide the lipstick mark with a garnish.' },
      ],
      correctOptionId: 'b',
      explanation: 'Unacceptable glassware cannot be served. Cleaning, sanitizing and glass integrity come before speed, and substitutes must follow venue standards.',
    },
    task7QuestionIds: ['bs_31', 'bs_42', 'bs_43', 'bs_44'],
  },
  {
    id: 'cruise-menu-patterns',
    day: 8,
    title: 'Read Any Cruise Bar Menu',
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
      question: 'Why should you not treat one online cruise-bar menu as the standard for every ship?',
      options: [
        { id: 'a', text: 'Cruise bars never provide menus.' },
        { id: 'b', text: 'Ships, venues, itineraries, stock, prices and package rules can differ or change.' },
        { id: 'c', text: 'Every cruise line sells only one cocktail.' },
      ],
      correctOptionId: 'b',
      explanation: 'Public menus help you study structure and style, but actual service must follow the current ship, venue menu and policy.',
    },
    task7QuestionIds: ['bs_27', 'bs_28', 'bs_33'],
  },
  {
    id: 'service-application',
    day: 9,
    title: 'Run the Shift Under Pressure',
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
      question: 'A guest wants a tropical drink that is not too sweet, but a common ingredient is unavailable. What is the best response?',
      options: [
        { id: 'a', text: 'Secretly replace the ingredient without telling the guest.' },
        { id: 'b', text: 'Explain the shortage, confirm the guest’s key preference and recommend an available alternative with controlled sweetness.' },
        { id: 'c', text: 'Say “sold out” and walk away.' },
      ],
      correctOptionId: 'b',
      explanation: 'A professional substitute is transparent, needs-based and clearly explained. It demonstrates product knowledge, service and sales judgment.',
    },
    task7QuestionIds: ['bs_20', 'bs_21', 'bs_29', 'bs_31', 'bs_32', 'bs_34'],
  },
]

export const barServerFoundationSources = [
  {
    company: 'CDC Vessel Sanitation Program',
    label: '2025 Environmental Public Health Standards',
    url: 'https://www.cdc.gov/vessel-sanitation/media/pdfs/2025/06/2025_VSP_Environmental_Public_Health_Standards-508.pdf',
  },
  {
    company: 'WSET Global',
    label: 'A beginner’s guide to beer styles',
    url: 'https://www.wsetglobal.com/knowledge-centre/blog/2023/december/08/a-beginners-guide-to-beer-styles',
  },
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
