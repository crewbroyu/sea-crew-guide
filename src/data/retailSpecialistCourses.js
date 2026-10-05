import { moduleComplete, moduleProgressKey } from './retailModuleProgress.js'
export const RETAIL_SPECIALIST_SOURCES = {
  "cosmetics": {
    "label": "FDA · Using Cosmetics Safely",
    "url": "https://www.fda.gov/cosmetics/resources-consumers-cosmetics/using-cosmetics-safely"
  },
  "chanel": {
    "label": "CHANEL · Fragrance, Makeup & Skincare Consultations",
    "url": "https://www.chanel.com/in/les-rendez-vous-chanel/"
  },
  "fragrance": {
    "label": "CHANEL · Fragrance collections",
    "url": "https://www.chanel.com/us/fragrance/women/c/7x1x1/"
  },
  "citizen": {
    "label": "CITIZEN · Eco-Drive",
    "url": "https://www.citizenwatch.com/us/en/technology-eco-drive"
  },
  "longines": {
    "label": "Longines · Model-specific product information",
    "url": "https://www.longines.com/en-us/p/watch-hydroconquest-l3-788-4-90-6"
  },
  "rolex": {
    "label": "Rolex · Certified Pre-Owned",
    "url": "https://www.rolex.com/buying-a-rolex/rolex-certified-pre-owned"
  }
}
export const RETAIL_SPECIALIST_COURSES = [
  {
    "id": "beauty-specialist",
    "name": "Beauty Specialist",
    "subtitle": "美妆专员 · 跨品牌咨询与体验",
    "description": "从需求发现、香水比较到护肤和彩妆咨询，完成有依据的推荐与服务交接。",
    "prerequisite": "beauty-fragrance",
    "sourceIds": [
      "cosmetics"
    ],
    "modules": [
      {
        "id": "consultation",
        "title": "咨询：先问需求，再选产品",
        "objective": "用四个问题形成咨询摘要。",
        "points": [
          "询问自用或送礼、预算、使用场合与现有偏好，避免靠年龄或外观猜测。",
          "把客人的原话转成两个选择条件，例如清新香调、便于携带；先复述再推荐。",
          "区分偏好与医疗问题。遇到持续不适或治疗诉求时，联系适当的医疗人员。"
        ],
        "phrase": "What do you enjoy about your current fragrance, and what would you like to change?",
        "lesson": {
          "id": "specialist:beauty-specialist:consultation",
          "revision": 1,
          "question": "客人说“想买个礼物”，第一步是什么？",
          "options": [
            "询问收礼人偏好、预算与场合",
            "直接推荐最高价套装",
            "保证畅销款适合每个人"
          ],
          "correct": 0,
          "prompt": "A guest wants a gift but knows little about fragrance. Ask three questions and summarise the brief.",
          "reviewChecks": [
            "我回应了客人的具体需求",
            "我说明了需核实的事实与下一步",
            "我没有超出自己的服务或操作权限"
          ]
        }
      },
      {
        "id": "fragrance",
        "title": "香水：有顺序地比较",
        "objective": "引导客人比较两款香水，并区分浓度与容量。",
        "points": [
          "记录品牌、系列、具体版本、浓度与容量，不把同名系列当作同一 SKU。",
          "提供两张分别标记的试香纸，依次比较；不要将多款喷在同一张纸上。",
          "用客人能理解的词描述差异，给气味变化留出时间；不承诺统一留香时长。"
        ],
        "phrase": "Let us label these two blotters so we can compare them without mixing them up.",
        "lesson": {
          "id": "specialist:beauty-specialist:fragrance",
          "revision": 1,
          "question": "两款香水试闻后，怎样保持比较清晰？",
          "options": [
            "混喷以节省时间",
            "按价格保证留香时间",
            "标记并分开试香纸，核对版本"
          ],
          "correct": 2,
          "prompt": "Compare two fragrance options for a guest. Explain the testing sequence and one detail you must verify.",
          "reviewChecks": [
            "我回应了客人的具体需求",
            "我说明了需核实的事实与下一步",
            "我没有超出自己的服务或操作权限"
          ]
        }
      },
      {
        "id": "skincare",
        "title": "护肤：了解步骤与标签",
        "objective": "解释基础产品角色，保持销售咨询边界。",
        "points": [
          "了解客人现有洁面、保湿等步骤及质地偏好，再讨论一个合适的补充选项。",
          "按产品标签介绍用途和用法；不把所有精华、面霜当成同一种配方。",
          "“天然”或“低敏”不能当作不会过敏的保证；遇到反应，应停止试用并寻求医疗帮助。"
        ],
        "phrase": "I can explain the product label, but I cannot diagnose a skin concern.",
        "lesson": {
          "id": "specialist:beauty-specialist:skincare",
          "revision": 1,
          "question": "如何回应“这款天然精华一定不过敏吗”？",
          "options": [
            "用品牌知名度保证安全",
            "不能保证；核对标签并说明咨询边界",
            "天然就一定安全"
          ],
          "correct": 1,
          "prompt": "A guest asks for a serum to cure a skin condition. Respond helpfully without making a treatment claim.",
          "reviewChecks": [
            "我回应了客人的具体需求",
            "我说明了需核实的事实与下一步",
            "我没有超出自己的服务或操作权限"
          ]
        }
      },
      {
        "id": "makeup",
        "title": "彩妆：色号、妆效与试用",
        "objective": "组织经过同意的色号比较。",
        "points": [
          "先问妆效、遮盖度和现用色号，再选有限的候选，不因个人喜好替客人决定。",
          "试用前取得同意，按门店卫生规范准备工具，避免共用或污染化妆品。",
          "核对色号代码、质地及 SKU，口头确认后再取可售库存；tester 与可售品分开。"
        ],
        "phrase": "Would you prefer a sheer or fuller coverage? May I show you two shades?",
        "lesson": {
          "id": "specialist:beauty-specialist:makeup",
          "revision": 1,
          "question": "试色后取货要核对什么？",
          "options": [
            "准确色号、质地与 SKU，并区分试用品",
            "仅凭包装颜色取货",
            "把试用品装盒出售"
          ],
          "correct": 0,
          "prompt": "A guest wants a foundation match. Explain your questions, permission step and stock check.",
          "reviewChecks": [
            "我回应了客人的具体需求",
            "我说明了需核实的事实与下一步",
            "我没有超出自己的服务或操作权限"
          ]
        }
      },
      {
        "id": "service",
        "title": "售后：反应、退换与记录",
        "objective": "把健康诉求与退换流程分别交接。",
        "points": [
          "出现不适时停止试用，并帮助联系医疗团队；不要再用其他产品掩盖反应。",
          "记录客人描述、产品与发生时间，避免自行诊断原因。只在雇主批准系统中记录必要信息。",
          "核对票据、开封情况与门店政策，再由授权人员决定退换，不先承诺结果。"
        ],
        "phrase": "I will stop the demonstration and help you contact the medical team. We can review the store policy separately.",
        "lesson": {
          "id": "specialist:beauty-specialist:service",
          "revision": 1,
          "question": "遇到反应并要求退款，怎样处理？",
          "options": [
            "换一种产品继续试用",
            "先保证退款并诊断原因",
            "停止试用、转介健康问题，另按政策审核退换"
          ],
          "correct": 2,
          "prompt": "A guest reports irritation and requests a refund. Explain two separate next steps without diagnosing or promising a refund.",
          "reviewChecks": [
            "我回应了客人的具体需求",
            "我说明了需核实的事实与下一步",
            "我没有超出自己的服务或操作权限"
          ]
        }
      },
      {
        "id": "interview",
        "title": "综合实战与面试",
        "objective": "用咨询、推荐和交接证据讲清自己的服务过程。",
        "points": [
          "练习“礼物预算有限、时间有限”的咨询：问清需求，给两种选择，核实标签与促销。",
          "解释为什么推荐某项，并提出一个与需求相关的可选搭配，尊重拒绝。",
          "面试用真实经历或明确标注的模拟案例讲述情境、行动、结果与改进，不编造销售业绩。"
        ],
        "phrase": "I narrowed the options after confirming the guest’s budget and preferences, then checked the promotion conditions.",
        "lesson": {
          "id": "specialist:beauty-specialist:interview",
          "revision": 1,
          "question": "没有真实美妆销售经历时怎样回答案例题？",
          "options": [
            "声称模拟训练等于工作经历",
            "明确是模拟案例，并解释判断过程",
            "编造销售额和客人评价"
          ],
          "correct": 1,
          "prompt": "Write a short interview example about a beauty consultation. Label it as real or simulated, and explain your action, result and lesson.",
          "reviewChecks": [
            "我标明了真实或模拟，并交代情境",
            "我解释了行动、结果和改进",
            "我没有编造经历、业绩或认证"
          ]
        }
      }
    ]
  },
  {
    "id": "chanel-ambassador",
    "name": "Chanel Ambassador",
    "subtitle": "品牌大使方向 · 香水与美妆柜台",
    "description": "以 CHANEL 香水和美妆咨询为范围，训练准确的品牌表达、个性化体验与柜台交接。",
    "prerequisite": "beauty-fragrance",
    "sourceIds": [
      "chanel",
      "fragrance",
      "cosmetics"
    ],
    "modules": [
      {
        "id": "scope",
        "title": "岗位范围与品牌表达",
        "objective": "区分品牌知识、柜台职责与授权。",
        "points": [
          "本课程聚焦香水、美妆与护肤咨询，不涵盖包袋鉴定、高级珠宝或制表专修。",
          "CHANEL 官方咨询页面覆盖香水、彩妆和护肤；不同地区、门店可提供的服务需另核实。",
          "讲述公开产品事实与客人需求的关联，不自称官方培训认证，不把船店经营样本扩大成全船队授权。"
        ],
        "phrase": "I can help you explore fragrance and beauty options available at this counter.",
        "lesson": {
          "id": "specialist:chanel-ambassador:scope",
          "revision": 1,
          "question": "本课程完成意味着什么？",
          "options": [
            "完成本站岗位准备训练，实际授权由雇主与品牌确认",
            "获得 CHANEL 官方任职认证",
            "可以鉴定所有 CHANEL 商品"
          ],
          "correct": 0,
          "prompt": "Introduce your fragrance and beauty counter to a guest. Explain the service scope and one availability detail to check.",
          "reviewChecks": [
            "我回应了客人的具体需求",
            "我说明了需核实的事实与下一步",
            "我没有超出自己的服务或操作权限"
          ]
        }
      },
      {
        "id": "fragrance",
        "title": "香水系列与具体版本",
        "objective": "从系列识别走到准确取货。",
        "points": [
          "认识 N°5、COCO MADEMOISELLE、CHANCE 三个系列名称，随后确认客人指的具体版本。",
          "系列名不足以判断浓度、容量或包装；用标签与本店商品资料核对。",
          "邀请比较两款，问已有偏好与使用场景；不靠性别刻板印象或统一留香承诺推销。"
        ],
        "phrase": "Which concentration and size are you looking for? Let me check the exact version.",
        "lesson": {
          "id": "specialist:chanel-ambassador:fragrance",
          "revision": 1,
          "question": "客人只说“CHANCE”，可以直接拿货吗？",
          "options": [
            "随便取同系列即可",
            "直接拿最贵版本",
            "先确认具体版本、浓度和容量"
          ],
          "correct": 2,
          "prompt": "A guest asks for CHANCE but cannot recall the version. Ask clarifying questions and explain how you will verify the item.",
          "reviewChecks": [
            "我回应了客人的具体需求",
            "我说明了需核实的事实与下一步",
            "我没有超出自己的服务或操作权限"
          ]
        }
      },
      {
        "id": "experience",
        "title": "香氛体验与故事表达",
        "objective": "将一个可核实的产品事实连到需求。",
        "points": [
          "用简短结构介绍：客人偏好 → 可核实特征 → 邀请体验，避免堆砌品牌历史。",
          "先用标记的试香纸比较，再按同意与柜台规范安排进一步试用。",
          "将官网描述与自己的感受分开；不编造原料来源、稀缺性或名人故事。"
        ],
        "phrase": "You mentioned a preference for a lighter impression. Shall we compare these two versions on separate blotters?",
        "lesson": {
          "id": "specialist:chanel-ambassador:experience",
          "revision": 1,
          "question": "品牌故事不确定时应怎样表达？",
          "options": [
            "把个人猜测当成官方说法",
            "核实后再讲，把主观感受与事实分开",
            "编一个更有吸引力的故事"
          ],
          "correct": 1,
          "prompt": "Give a 30-second fragrance introduction using one verified fact, a guest preference and an invitation to compare.",
          "reviewChecks": [
            "我回应了客人的具体需求",
            "我说明了需核实的事实与下一步",
            "我没有超出自己的服务或操作权限"
          ]
        }
      },
      {
        "id": "beauty",
        "title": "美妆与护肤咨询交接",
        "objective": "从目标妆效出发，明确演示权限。",
        "points": [
          "了解客人关注眼妆、唇妆、底妆还是护肤步骤，并询问可用时间。",
          "参考官方咨询分类理解服务范围，具体手法与流程需由雇主和品牌培训后执行。",
          "产品宣称、用法和试用品卫生按已核准资料处理；未经训练的服务转交合适同事。"
        ],
        "phrase": "Would you like to focus on lips, complexion or your skincare routine today?",
        "lesson": {
          "id": "specialist:chanel-ambassador:beauty",
          "revision": 1,
          "question": "客人请求尚未受训的演示手法时？",
          "options": [
            "说明范围并交接给受训同事",
            "照着记忆直接操作",
            "保证网上见过就能提供"
          ],
          "correct": 0,
          "prompt": "A guest requests a makeup service you have not been trained to perform. Clarify their goal and arrange a helpful handover.",
          "reviewChecks": [
            "我回应了客人的具体需求",
            "我说明了需核实的事实与下一步",
            "我没有超出自己的服务或操作权限"
          ]
        }
      },
      {
        "id": "counter",
        "title": "柜台管理与顾客跟进",
        "objective": "完成缺货、赠礼与后续联系的核实。",
        "points": [
          "取货时核对版本、色号、容量、套装明细与当前库存；试用品与可售品分开管理。",
          "包装、样品、赠礼及折扣按本店已核准条件执行，不把其他国家官网活动套用到船上。",
          "如需跟进，先取得客人同意，使用雇主批准系统；不私存联系方式或承诺到货日期。"
        ],
        "phrase": "This offer may differ from the website. Let me confirm the conditions at our store.",
        "lesson": {
          "id": "specialist:chanel-ambassador:counter",
          "revision": 1,
          "question": "看到官网赠礼活动，船上可以直接承诺吗？",
          "options": [
            "只要同一品牌就一定适用",
            "用个人承诺代替门店规则",
            "先核实本店活动、库存与资格条件"
          ],
          "correct": 2,
          "prompt": "A guest shows an online gift offer for an unavailable item. Explain local verification and an optional follow-up without promising stock.",
          "reviewChecks": [
            "我回应了客人的具体需求",
            "我说明了需核实的事实与下一步",
            "我没有超出自己的服务或操作权限"
          ]
        }
      },
      {
        "id": "interview",
        "title": "品牌大使综合任务",
        "objective": "演练完整咨询并解释自己的选择。",
        "points": [
          "以“送礼、不了解版本、船上时间有限”为场景：了解偏好、确认版本、邀请体验、核对库存。",
          "结束前复述选中商品与已核实条件，不以逼单替代服务。",
          "面试说明如何保持事实准确、处理未知问题与同事交接；模拟案例需明确标注。"
        ],
        "phrase": "Before we complete the purchase, let us confirm the version, size and the conditions we checked together.",
        "lesson": {
          "id": "specialist:chanel-ambassador:interview",
          "revision": 1,
          "question": "品牌大使面试最可靠的证据是什么？",
          "options": [
            "把课程结业当作品牌雇佣证明",
            "清晰的咨询行动、核实与反思",
            "未经确认的品牌内幕"
          ],
          "correct": 1,
          "prompt": "Write a real or clearly labelled simulated ambassador interview example: a gift consultation, an uncertain product detail, your handover and reflection.",
          "reviewChecks": [
            "我标明了真实或模拟，并交代情境",
            "我解释了行动、结果和改进",
            "我没有编造经历、业绩或认证"
          ]
        }
      }
    ]
  },
  {
    "id": "watch-specialist",
    "name": "Watch Specialist",
    "subtitle": "腕表专员 · 型号、演示与售后",
    "description": "从需求和型号记录开始，训练机芯表达、规格核对、安全演示与新表及二手表销售交接。",
    "prerequisite": "watch-basics",
    "sourceIds": [
      "citizen",
      "longines",
      "rolex"
    ],
    "modules": [
      {
        "id": "discovery",
        "title": "需求与型号档案",
        "objective": "用可核对的信息比较两款腕表。",
        "points": [
          "询问预算、日常或特定活动用途、尺寸偏好及新表或二手需求。",
          "记录品牌、系列、reference、尺寸、机芯类型、状态和随附文件，不只记系列名。",
          "相同系列可有不同型号与配置；报价和参数必须绑定实际商品。"
        ],
        "phrase": "Do you have a model reference, or would you like to compare two sizes first?",
        "lesson": {
          "id": "specialist:watch-specialist:discovery",
          "revision": 1,
          "question": "两块表同属一个系列，能否直接使用同一规格？",
          "options": [
            "不能，需核对每块表的型号与配置",
            "能，系列名保证所有参数相同",
            "只比较价格即可"
          ],
          "correct": 0,
          "prompt": "A guest wants a watch for everyday use and occasional travel. Ask three questions and list the details you need for a comparison.",
          "reviewChecks": [
            "我回应了客人的具体需求",
            "我说明了需核实的事实与下一步",
            "我没有超出自己的服务或操作权限"
          ]
        }
      },
      {
        "id": "movement",
        "title": "机芯与光动能表达",
        "objective": "清楚解释工作方式，不扩大技术承诺。",
        "points": [
          "区分石英、机械与自动上链等术语；销售时先查具体型号，不能用品牌推断机芯。",
          "CITIZEN Eco-Drive 将自然光或人造光转成能量；充电条件和储能说明按型号核对。",
          "不要承诺永不保养、永不失准或所有型号同样续航；不知道时查手册或交接。"
        ],
        "phrase": "This Eco-Drive model uses light as an energy source. I will check the charging guidance for this reference.",
        "lesson": {
          "id": "specialist:watch-specialist:movement",
          "revision": 1,
          "question": "介绍 Eco-Drive 哪个说法合适？",
          "options": [
            "永远不需要任何保养",
            "只要品牌相同就有相同储能",
            "光转为能量，具体充电与使用要求查型号说明"
          ],
          "correct": 2,
          "prompt": "A guest asks if an Eco-Drive watch runs forever without care. Explain the basic technology and what you need to verify.",
          "reviewChecks": [
            "我回应了客人的具体需求",
            "我说明了需核实的事实与下一步",
            "我没有超出自己的服务或操作权限"
          ]
        }
      },
      {
        "id": "specifications",
        "title": "防水、功能与手册",
        "objective": "把使用需求交给具体规格核验。",
        "points": [
          "询问客人计划如何使用腕表，再核对该型号官方说明中的适用条件。",
          "防水标示不是对所有场景、所有表况的无限保证；不能把另一款表的说明套过来。",
          "操作表冠、计时按钮、日期等功能前先查手册并取得演示权限；未经训练不拆修。"
        ],
        "phrase": "Let me check the guidance for this exact reference before recommending it for that activity.",
        "lesson": {
          "id": "specialist:watch-specialist:specifications",
          "revision": 1,
          "question": "客人问能否用于某项水上活动，最佳下一步？",
          "options": [
            "所有有防水标示的表都一样",
            "核对具体型号手册及适用条件",
            "只凭外观保证能潜水"
          ],
          "correct": 1,
          "prompt": "A guest asks whether this watch can be used for a water activity. Explain how you will verify suitability without making a blanket guarantee.",
          "reviewChecks": [
            "我回应了客人的具体需求",
            "我说明了需核实的事实与下一步",
            "我没有超出自己的服务或操作权限"
          ]
        }
      },
      {
        "id": "demonstration",
        "title": "试戴与高价值商品交接",
        "objective": "组织可追踪的试戴与库存归还。",
        "points": [
          "按门店安保流程控制展示数量，使用适当托盘，保持商品与记录一一对应。",
          "试戴前征得同意，观察尺寸反馈；调整表带、开盖或技术操作只由有权限人员执行。",
          "试戴后核对商品、附件与状态，再按流程归位；发现差异及时报告，不自行修改库存掩盖。"
        ],
        "phrase": "I can show you the fit, and our authorised colleague can advise on bracelet adjustment.",
        "lesson": {
          "id": "specialist:watch-specialist:demonstration",
          "revision": 1,
          "question": "没有表带调整授权时怎样处理？",
          "options": [
            "交给有权限人员，保留商品交接记录",
            "使用手边工具尝试",
            "让客人自行拆装柜台商品"
          ],
          "correct": 0,
          "prompt": "A guest wants a bracelet adjustment during a busy period. Explain a safe demonstration and handover without exceeding your authority.",
          "reviewChecks": [
            "我回应了客人的具体需求",
            "我说明了需核实的事实与下一步",
            "我没有超出自己的服务或操作权限"
          ]
        }
      },
      {
        "id": "preowned",
        "title": "新表、二手与售后文件",
        "objective": "区分商品状态、认证来源与服务承诺。",
        "points": [
          "明确商品是新表还是二手，逐件核对状态、随附文件、服务记录与售价说明。",
          "Rolex 官方 Certified Pre-Owned 是特定计划；运营商说“认证二手”不能自动等同该计划。",
          "确认实际销售方、保修文件、售后渠道和退换条件，不保证升值、保值或全球统一服务。"
        ],
        "phrase": "Let us review the documents supplied with this particular watch and confirm who provides the warranty.",
        "lesson": {
          "id": "specialist:watch-specialist:preowned",
          "revision": 1,
          "question": "运营商写“认证二手”，能直接称为 Rolex 官方 CPO 吗？",
          "options": [
            "能，二手都等于官方 CPO",
            "品牌名即可证明认证",
            "不能，需核实该计划证据和具体文件"
          ],
          "correct": 2,
          "prompt": "A guest asks whether a pre-owned Rolex has manufacturer certification and worldwide warranty. Explain the documents and provider you must verify.",
          "reviewChecks": [
            "我回应了客人的具体需求",
            "我说明了需核实的事实与下一步",
            "我没有超出自己的服务或操作权限"
          ]
        }
      },
      {
        "id": "interview",
        "title": "综合比较与面试",
        "objective": "完成有依据的推荐及交付复述。",
        "points": [
          "按客人需求列出两款候选，用实际型号资料比较，不靠夸大品牌声望成交。",
          "复述已核实规格、商品状态、总价与售后；交付时核对表款、附件和文件。",
          "面试用真实或明确标注的模拟案例说明核实、演示、交接与改进，不编造鉴定资历。"
        ],
        "phrase": "My recommendation is based on your needs and the verified details of these two references.",
        "lesson": {
          "id": "specialist:watch-specialist:interview",
          "revision": 1,
          "question": "面对不确定的型号技术问题，专员应展示什么能力？",
          "options": [
            "用价格代替技术回答",
            "承认待核实，查手册或交接并说明下一步",
            "立即猜一个参数显得专业"
          ],
          "correct": 1,
          "prompt": "Write a real or labelled simulated watch-sales interview example comparing two references, including an uncertain specification, handover and reflection.",
          "reviewChecks": [
            "我标明了真实或模拟，并交代情境",
            "我解释了行动、结果和改进",
            "我没有编造经历、业绩或认证"
          ]
        }
      }
    ]
  }
]
export const getRetailSpecialistCourse = id => RETAIL_SPECIALIST_COURSES.find(course=>course.id===id)
export function getSpecialistProgress(course, progress = {}) {
 const completed = course.modules.filter(module=>moduleComplete(progress[moduleProgressKey(module.lesson)]))
 return {completedCount:completed.length,total:course.modules.length,percent:Math.round(completed.length/course.modules.length*100),next:course.modules.find(module=>!moduleComplete(progress[moduleProgressKey(module.lesson)])) || null}
}
