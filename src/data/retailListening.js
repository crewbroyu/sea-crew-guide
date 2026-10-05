import { createListeningEngine } from './listeningEngine.js'
export const RETAIL_LISTENING_DRILLS = [
  {
    "id": "retail-budget-gift",
    "unit": "需求发现",
    "level": 1,
    "role": "Guest",
    "context": "Gift counter · 礼物预算",
    "prompt": "I need a gift for my sister, something under sixty dollars. She prefers fresh scents, nothing too sweet.",
    "task": "捕捉预算、对象和偏好。",
    "response": "A gift for your sister under sixty dollars, with a fresh scent. Let me show you two options.",
    "responseCue": "复述预算与偏好",
    "type": "capture",
    "fields": [
      {
        "key": "budget",
        "label": "预算",
        "options": [
          "Under $60",
          "Under $16",
          "Over $60"
        ],
        "correct": "Under $60"
      },
      {
        "key": "preference",
        "label": "香味偏好",
        "options": [
          "Fresh, not too sweet",
          "Very sweet",
          "No preference"
        ],
        "correct": "Fresh, not too sweet"
      }
    ],
    "explanation": "复述预算与偏好。以本题给出的信息作答；实际商品、活动和处理权限需按当班资料核对。"
  },
  {
    "id": "retail-size-colour",
    "unit": "尺码与数量",
    "level": 1,
    "role": "Guest",
    "context": "Fashion · 尺码确认",
    "prompt": "Do you have this navy shirt in medium? I need two, but I'll try one on first.",
    "task": "确认颜色、尺码和数量。",
    "response": "Two navy shirts in medium. Let me check availability and arrange for you to try one on first.",
    "responseCue": "复述商品条件",
    "type": "capture",
    "fields": [
      {
        "key": "size",
        "label": "尺码",
        "options": [
          "Medium",
          "Small",
          "Large"
        ],
        "correct": "Medium"
      },
      {
        "key": "quantity",
        "label": "数量",
        "options": [
          "Two",
          "One",
          "Three"
        ],
        "correct": "Two"
      },
      {
        "key": "colour",
        "label": "颜色",
        "options": [
          "Navy",
          "Black",
          "White"
        ],
        "correct": "Navy"
      }
    ],
    "explanation": "复述商品条件。以本题给出的信息作答；实际商品、活动和处理权限需按当班资料核对。"
  },
  {
    "id": "retail-gift-wrap",
    "unit": "礼品服务",
    "level": 1,
    "role": "Guest",
    "context": "Checkout · 包装要求",
    "prompt": "These are two separate gifts. Please wrap them separately and keep the price off the gift receipts.",
    "task": "捕捉包装与小票要求。",
    "response": "Certainly, I'll wrap them separately and check our gift receipt options so the prices are not shown.",
    "responseCue": "确认包装并核对礼品小票",
    "type": "capture",
    "fields": [
      {
        "key": "wrap",
        "label": "包装",
        "options": [
          "Separately",
          "Together",
          "No wrapping"
        ],
        "correct": "Separately"
      },
      {
        "key": "receipt",
        "label": "礼品小票",
        "options": [
          "No price shown",
          "Include full prices",
          "No purchase record"
        ],
        "correct": "No price shown"
      }
    ],
    "explanation": "确认包装并核对礼品小票。以本题给出的信息作答；实际商品、活动和处理权限需按当班资料核对。"
  },
  {
    "id": "retail-clarify-model",
    "unit": "确认信息",
    "level": 1,
    "role": "Guest",
    "context": "Watch counter · 型号没听清",
    "prompt": "Could I see the silver one with the blue dial, not the black dial?",
    "task": "捕捉客人的纠正。",
    "response": "The silver watch with the blue dial, not the black one. Let me confirm the model for you.",
    "responseCue": "重复纠正信息",
    "type": "capture",
    "fields": [
      {
        "key": "case",
        "label": "表身颜色",
        "options": [
          "Silver",
          "Gold",
          "Black"
        ],
        "correct": "Silver"
      },
      {
        "key": "dial",
        "label": "表盘颜色",
        "options": [
          "Blue",
          "Black",
          "White"
        ],
        "correct": "Blue"
      }
    ],
    "explanation": "重复纠正信息。以本题给出的信息作答；实际商品、活动和处理权限需按当班资料核对。"
  },
  {
    "id": "retail-promotion-terms",
    "unit": "促销条件",
    "level": 2,
    "role": "Supervisor",
    "context": "Promotion table · 本场景的活动条款",
    "prompt": "The twenty percent discount applies only to selected bags. New arrivals are excluded, and it cannot be combined with other offers.",
    "task": "识别折扣与排除条件。",
    "response": "This offer is for selected bags only. Let me check whether your item qualifies before confirming the final price.",
    "responseCue": "核对适用商品，不提前承诺",
    "type": "capture",
    "fields": [
      {
        "key": "discount",
        "label": "折扣",
        "options": [
          "20% off",
          "12% off",
          "Two for one"
        ],
        "correct": "20% off"
      },
      {
        "key": "excluded",
        "label": "排除商品",
        "options": [
          "New arrivals",
          "All bags",
          "Gift wrapping"
        ],
        "correct": "New arrivals"
      },
      {
        "key": "combine",
        "label": "叠加其他优惠",
        "options": [
          "Not allowed",
          "Always allowed",
          "Only at closing"
        ],
        "correct": "Not allowed"
      }
    ],
    "explanation": "核对适用商品，不提前承诺。以本题给出的信息作答；实际商品、活动和处理权限需按当班资料核对。"
  },
  {
    "id": "retail-product-comparison",
    "unit": "产品比较",
    "level": 2,
    "role": "Guest",
    "context": "Bags · 使用需求",
    "prompt": "I like both bags, but I travel a lot. I need something lightweight with a secure zip, not just a designer logo.",
    "task": "判断最应优先比较的内容。",
    "response": "Let's compare their weight, zip closures and compartments so you can choose the one that suits your travel needs.",
    "responseCue": "以实际需求比较",
    "type": "choice",
    "options": [
      {
        "id": "a",
        "text": "重量、拉链与收纳结构"
      },
      {
        "id": "b",
        "text": "只强调品牌标志"
      },
      {
        "id": "c",
        "text": "直接推荐价格最高的一款"
      }
    ],
    "correctOptionId": "a",
    "explanation": "以实际需求比较。以本题给出的信息作答；实际商品、活动和处理权限需按当班资料核对。"
  },
  {
    "id": "retail-stock-alternative",
    "unit": "缺货替代",
    "level": 2,
    "role": "Supervisor",
    "context": "Stockroom · 库存指令",
    "prompt": "The fifty-millilitre bottle is sold out. We have the thirty-millilitre size, but do not promise a restock date.",
    "task": "捕捉可用容量与不能承诺的事项。",
    "response": "The fifty-millilitre size is sold out. We have thirty millilitres available, and I can check other suitable options.",
    "responseCue": "透明说明库存并提供选择",
    "type": "capture",
    "fields": [
      {
        "key": "available",
        "label": "可用容量",
        "options": [
          "30 ml",
          "50 ml",
          "100 ml"
        ],
        "correct": "30 ml"
      },
      {
        "key": "promise",
        "label": "不能承诺",
        "options": [
          "Restock date",
          "Current bottle size",
          "Checking alternatives"
        ],
        "correct": "Restock date"
      }
    ],
    "explanation": "透明说明库存并提供选择。以本题给出的信息作答；实际商品、活动和处理权限需按当班资料核对。"
  },
  {
    "id": "retail-price-question",
    "unit": "价格异议",
    "level": 2,
    "role": "Guest",
    "context": "Sales floor · 外部比价",
    "prompt": "I saw a similar watch online for less. Is this exactly the same model, and does your price include the same warranty?",
    "task": "选择核实顺序。",
    "response": "Let's check the exact model and warranty details first, so we can compare the offers accurately.",
    "responseCue": "先核对同款与保修",
    "type": "choice",
    "options": [
      {
        "id": "a",
        "text": "保证船上一定最低价"
      },
      {
        "id": "b",
        "text": "核对型号和保修条件后再比较"
      },
      {
        "id": "c",
        "text": "说网上都是假货"
      }
    ],
    "correctOptionId": "b",
    "explanation": "先核对同款与保修。以本题给出的信息作答；实际商品、活动和处理权限需按当班资料核对。"
  },
  {
    "id": "retail-return-concern",
    "unit": "服务补救",
    "level": 3,
    "role": "Guest",
    "context": "Service desk · 商品问题",
    "prompt": "I bought this yesterday, and the clasp will not close. I have the receipt, but I leave the ship tomorrow.",
    "task": "捕捉问题与时间压力。",
    "response": "I'm sorry the clasp isn't working. Let's check your receipt and involve the authorised colleague before you leave tomorrow.",
    "responseCue": "承认影响并及时转交",
    "type": "capture",
    "fields": [
      {
        "key": "issue",
        "label": "问题",
        "options": [
          "Clasp will not close",
          "Wrong colour",
          "Missing receipt"
        ],
        "correct": "Clasp will not close"
      },
      {
        "key": "deadline",
        "label": "离船时间",
        "options": [
          "Tomorrow",
          "Today",
          "Next week"
        ],
        "correct": "Tomorrow"
      }
    ],
    "explanation": "承认影响并及时转交。以本题给出的信息作答；实际商品、活动和处理权限需按当班资料核对。"
  },
  {
    "id": "retail-queue-priority",
    "unit": "高峰服务",
    "level": 3,
    "role": "Supervisor",
    "context": "Sea Day · 排队与专人服务",
    "prompt": "Please acknowledge the waiting guests first. Ask Mia to cover the till while you help the guest with the locked watch display.",
    "task": "确认第一动作与分工。",
    "response": "I'll acknowledge the waiting guests, ask Mia to cover the till, then help at the watch display.",
    "responseCue": "复述顺序与分工",
    "type": "capture",
    "fields": [
      {
        "key": "first",
        "label": "先做什么",
        "options": [
          "Acknowledge waiting guests",
          "Open every display",
          "Leave the queue"
        ],
        "correct": "Acknowledge waiting guests"
      },
      {
        "key": "till",
        "label": "谁负责收银",
        "options": [
          "Mia",
          "The guest",
          "Nobody"
        ],
        "correct": "Mia"
      }
    ],
    "explanation": "复述顺序与分工。以本题给出的信息作答；实际商品、活动和处理权限需按当班资料核对。"
  },
  {
    "id": "retail-stock-handover",
    "unit": "库存交接",
    "level": 3,
    "role": "Supervisor",
    "context": "Closing · 差异上报",
    "prompt": "Count the display pieces before locking up. If the count is short, keep the area secure and report it to me immediately.",
    "task": "选择发现差异后的动作。",
    "response": "I'll count the display pieces first. If anything is missing, I'll secure the area and report it to you immediately.",
    "responseCue": "盘点、保护现场、及时上报",
    "type": "choice",
    "options": [
      {
        "id": "a",
        "text": "自行改数量让账目一致"
      },
      {
        "id": "b",
        "text": "等下一班同事处理"
      },
      {
        "id": "c",
        "text": "保持区域安全并立即报告主管"
      }
    ],
    "correctOptionId": "c",
    "explanation": "盘点、保护现场、及时上报。以本题给出的信息作答；实际商品、活动和处理权限需按当班资料核对。"
  },
  {
    "id": "retail-event-exclusions",
    "unit": "活动沟通",
    "level": 3,
    "role": "Guest",
    "context": "Event table · 组合优惠",
    "prompt": "The sign says buy two and save, but I only want this one. Can you give me the same discount anyway?",
    "task": "在权限范围内回应优惠请求。",
    "response": "Let me check the offer terms for this item. I can explain the eligible options, but I cannot promise an exception.",
    "responseCue": "核对条款，解释选择",
    "type": "choice",
    "options": [
      {
        "id": "a",
        "text": "先承诺折扣再问主管"
      },
      {
        "id": "b",
        "text": "核对活动条款，解释可用选择"
      },
      {
        "id": "c",
        "text": "要求客人必须买两件"
      }
    ],
    "correctOptionId": "b",
    "explanation": "核对条款，解释选择。以本题给出的信息作答；实际商品、活动和处理权限需按当班资料核对。"
  }
]
export const RETAIL_LEARNING_STAGES = [
 {id:'job_search',label:'正在准备求职',description:'先建立岗位基础，再把销售经历转成面试表达。'},
 {id:'first_contract',label:'已签合同，第一次上船',description:'按接待、销售和交接顺序训练工作听说。'},
 {id:'experienced',label:'已有零售或船上经验',description:'先做班次诊断，再定向补齐听说与服务弱项。'},
]
export const retailListeningEngine = createListeningEngine(RETAIL_LISTENING_DRILLS)
