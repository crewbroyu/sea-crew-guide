export const positionConfig = [
  { key: 'restaurant_server', nameZh: '餐厅服务员', nameEn: 'Restaurant Server', icon: '🍽️' },
  { key: 'duty_free_sales', nameZh: '免税店销售', nameEn: 'Duty-Free Shop Sales', icon: '🛍️' },
  { key: 'bar_server', nameZh: '酒吧服务员', nameEn: 'Bar Server / Bartender', icon: '🍸' },
];

const interviewQuestions = {
  restaurant_server: {
    positionName: '餐厅服务员',
    positionNameEn: 'Restaurant Server',
    questions: [
      {
        id: 'rs_01',
        order: 1,
        question: 'Tell me about yourself and why you want to work as a restaurant server on a cruise ship.',
        category: 'personal',
        tip: '简要介绍背景，重点说明对邮轮餐饮服务的热情和相关经验'
      },
      {
        id: 'rs_02',
        order: 2,
        question: 'What experience do you have in food and beverage service?',
        category: 'experience',
        tip: '用具体例子说明你的餐饮服务经历，包括工作场所、职责、时长'
      },
      {
        id: 'rs_03',
        order: 3,
        question: 'How would you handle a guest who complains about the food?',
        category: 'scenario',
        tip: '展示你的同理心和解决问题的能力，按照道歉-倾听-解决-跟进的步骤回答'
      },
      {
        id: 'rs_04',
        order: 4,
        question: 'Describe a time when you provided excellent customer service.',
        category: 'behavioral',
        tip: '用 STAR 结构回答：情境-任务-行动-结果'
      },
      {
        id: 'rs_05',
        order: 5,
        question: 'How do you handle working long hours in a fast-paced environment?',
        category: 'personal',
        tip: '强调你的体力、抗压能力和积极心态，举一个实际例子'
      },
      {
        id: 'rs_06',
        order: 6,
        question: 'What do you know about different types of cuisine and dietary restrictions?',
        category: 'knowledge',
        tip: '展示你对不同菜系、常见过敏原和饮食限制的了解'
      },
      {
        id: 'rs_07',
        order: 7,
        question: 'How would you deal with a difficult or rude guest?',
        category: 'scenario',
        tip: '保持专业和冷静，展示你不会把情绪带入工作的能力'
      },
      {
        id: 'rs_08',
        order: 8,
        question: 'Can you describe the proper way to serve a formal dinner?',
        category: 'knowledge',
        tip: '展示你对正式西餐服务流程的了解，包括上菜顺序、餐具摆放等'
      },
      {
        id: 'rs_09',
        order: 9,
        question: 'What would you do if you accidentally spilled something on a guest?',
        category: 'scenario',
        tip: '立即道歉，帮助清理，通知经理，提供补偿方案'
      },
      {
        id: 'rs_10',
        order: 10,
        question: 'How do you prioritize tasks when the restaurant is extremely busy?',
        category: 'behavioral',
        tip: '展示你的时间管理和多任务处理能力'
      },
      {
        id: 'rs_11',
        order: 11,
        question: 'Tell me about a time you worked as part of a team to achieve a goal.',
        category: 'behavioral',
        tip: '用 STAR 结构，强调团队协作和你的具体贡献'
      },
      {
        id: 'rs_12',
        order: 12,
        question: 'How would you handle a situation where a guest has a food allergy?',
        category: 'scenario',
        tip: '展示你对食物过敏的严肃态度，立即通知厨房，确认安全替代方案'
      },
      {
        id: 'rs_13',
        order: 13,
        question: 'What do you know about wine service and pairing?',
        category: 'knowledge',
        tip: '展示基本的葡萄酒知识，包括主要品种、服务温度、基本搭配原则'
      },
      {
        id: 'rs_14',
        order: 14,
        question: 'How would you upsell menu items to guests?',
        category: 'skill',
        tip: '用自然的方式推荐，基于客人的喜好，而不是强行推销'
      },
      {
        id: 'rs_15',
        order: 15,
        question: 'Describe a time you had to deal with a conflict with a coworker.',
        category: 'behavioral',
        tip: '展示你的沟通能力和成熟度，重点在如何解决而不是指责'
      },
      {
        id: 'rs_16',
        order: 16,
        question: 'What would you do if a guest asked you a question you didn\'t know the answer to?',
        category: 'scenario',
        tip: '诚实承认不知道，但立即帮客人找到答案，展示积极解决问题的态度'
      },
      {
        id: 'rs_17',
        order: 17,
        question: 'How do you feel about living and working on a ship for several months?',
        category: 'personal',
        tip: '展示你已经做好了充分的心理准备，理解船上生活的特点'
      },
      {
        id: 'rs_18',
        order: 18,
        question: 'What makes you a good fit for the cruise ship lifestyle?',
        category: 'personal',
        tip: '强调适应能力、开放心态、喜欢多元文化环境'
      },
      {
        id: 'rs_19',
        order: 19,
        question: 'How would you handle homesickness while working on a ship?',
        category: 'personal',
        tip: '展示你有应对策略，比如保持联系、建立船上友谊、专注工作目标'
      },
      {
        id: 'rs_20',
        order: 20,
        question: 'Describe your experience with POS systems or order management.',
        category: 'experience',
        tip: '说明你使用过的系统，如果没有经验就强调你的学习能力'
      },
      {
        id: 'rs_21',
        order: 21,
        question: 'How do you ensure cleanliness and hygiene standards in your work area?',
        category: 'knowledge',
        tip: '展示你对卫生标准的重视，提到具体的清洁流程和习惯'
      },
      {
        id: 'rs_22',
        order: 22,
        question: 'What would you do if you noticed a coworker not following safety procedures?',
        category: 'scenario',
        tip: '先友善提醒同事，如果问题持续则报告上级，强调安全第一'
      },
      {
        id: 'rs_23',
        order: 23,
        question: 'How do you handle multiple tables with different needs at the same time?',
        category: 'skill',
        tip: '展示你的组织能力和优先级判断能力'
      },
      {
        id: 'rs_24',
        order: 24,
        question: 'Tell me about a time you went above and beyond for a customer.',
        category: 'behavioral',
        tip: '用 STAR 结构讲一个让客人感动的真实故事'
      },
      {
        id: 'rs_25',
        order: 25,
        question: 'Why should we hire you over other candidates?',
        category: 'personal',
        tip: '总结你最大的优势，结合具体经验，展示你的热情和决心'
      }
    ]
  },
  duty_free_sales: {
    positionName: '免税店销售',
    positionNameEn: 'Duty-Free Shop Sales',
    questions: [
      {
        id: 'df_01',
        order: 1,
        question: 'Tell me about yourself and why you\'re interested in working in duty-free retail on a cruise ship.',
        category: 'personal',
        tip: '简要介绍背景，突出对零售和邮轮工作的兴趣'
      },
      {
        id: 'df_02',
        order: 2,
        question: 'What sales experience do you have?',
        category: 'experience',
        tip: '具体说明销售经历、业绩数据、工作环境'
      },
      {
        id: 'df_03',
        order: 3,
        question: 'How would you approach a customer who is just browsing?',
        category: 'skill',
        tip: '先给空间，友善问候，观察兴趣点再自然地开启对话'
      },
      {
        id: 'df_04',
        order: 4,
        question: 'Describe a time you successfully closed a difficult sale.',
        category: 'behavioral',
        tip: '用 STAR 结构，展示你的说服力和耐心'
      },
      {
        id: 'df_05',
        order: 5,
        question: 'How do you handle rejection from customers?',
        category: 'personal',
        tip: '展示积极心态，不会因为被拒绝而气馁'
      },
      {
        id: 'df_06',
        order: 6,
        question: 'What do you know about luxury brands and products?',
        category: 'knowledge',
        tip: '展示你对主流奢侈品牌的了解，提几个具体品牌和产品线'
      },
      {
        id: 'df_07',
        order: 7,
        question: 'How would you deal with a customer who wants a refund?',
        category: 'scenario',
        tip: '先了解原因，按公司政策处理，保持专业和同理心'
      },
      {
        id: 'df_08',
        order: 8,
        question: 'Describe your experience with meeting sales targets.',
        category: 'experience',
        tip: '用具体数据说明你达成或超额完成销售目标的经历'
      },
      {
        id: 'df_09',
        order: 9,
        question: 'How would you upsell or cross-sell products to customers?',
        category: 'skill',
        tip: '基于客人需求推荐相关产品，而不是强行推销'
      },
      {
        id: 'df_10',
        order: 10,
        question: 'What would you do if a customer complained about a product?',
        category: 'scenario',
        tip: '倾听、道歉、提供解决方案、跟进'
      },
      {
        id: 'df_11',
        order: 11,
        question: 'How do you stay motivated during slow sales periods?',
        category: 'personal',
        tip: '利用空闲时间整理陈列、学习产品知识、准备促销策略'
      },
      {
        id: 'df_12',
        order: 12,
        question: 'Tell me about a time you provided exceptional customer service in a retail setting.',
        category: 'behavioral',
        tip: '用 STAR 结构讲述一个让顾客满意的具体经历'
      },
      {
        id: 'df_13',
        order: 13,
        question: 'How do you handle working with sales targets or commission?',
        category: 'personal',
        tip: '展示你把目标当作动力而不是压力'
      },
      {
        id: 'df_14',
        order: 14,
        question: 'What do you know about duty-free regulations and tax exemptions?',
        category: 'knowledge',
        tip: '展示你对免税购物基本规则的了解'
      },
      {
        id: 'df_15',
        order: 15,
        question: 'How would you handle a situation where a product is out of stock?',
        category: 'scenario',
        tip: '向客人道歉，推荐替代产品，记录需求以便后续跟进'
      },
      {
        id: 'df_16',
        order: 16,
        question: 'Describe a time you worked as part of a team in a retail environment.',
        category: 'behavioral',
        tip: '强调团队合作和你的具体贡献'
      },
      {
        id: 'df_17',
        order: 17,
        question: 'How do you keep yourself updated on product knowledge?',
        category: 'skill',
        tip: '说明你的学习习惯，主动了解新品、关注品牌动态'
      },
      {
        id: 'df_18',
        order: 18,
        question: 'What would you do if you suspected a customer of shoplifting?',
        category: 'scenario',
        tip: '不要直接指控，通知安保或经理，遵循公司流程'
      },
      {
        id: 'df_19',
        order: 19,
        question: 'How do you feel about living and working on a ship for extended periods?',
        category: 'personal',
        tip: '展示你已做好充分准备，理解船上生活的挑战和乐趣'
      },
      {
        id: 'df_20',
        order: 20,
        question: 'How would you handle a language barrier with an international customer?',
        category: 'scenario',
        tip: '用简单英语、肢体语言、翻译工具，保持耐心和微笑'
      },
      {
        id: 'df_21',
        order: 21,
        question: 'Describe your experience with inventory management or stock counting.',
        category: 'experience',
        tip: '说明你参与过的库存管理工作，展示你的细心和准确性'
      },
      {
        id: 'df_22',
        order: 22,
        question: 'How do you build rapport with customers quickly?',
        category: 'skill',
        tip: '微笑、眼神交流、真诚赞美、找共同话题'
      },
      {
        id: 'df_23',
        order: 23,
        question: 'What strategies do you use to remember product details and prices?',
        category: 'skill',
        tip: '展示你的学习方法，比如每天复习、制作笔记、实际操练'
      },
      {
        id: 'df_24',
        order: 24,
        question: 'Tell me about a time you exceeded your sales targets and how you did it.',
        category: 'behavioral',
        tip: '用具体数据和 STAR 结构说明你的销售策略和成果'
      },
      {
        id: 'df_25',
        order: 25,
        question: 'Why should we hire you for this position?',
        category: 'personal',
        tip: '总结核心优势，结合销售能力和对邮轮工作的热情'
      }
    ]
  },
  bar_server: {
    positionName: '酒吧服务员',
    positionNameEn: 'Bar Server',
    questions: [
      {
        id: 'bs_01',
        order: 1,
        question: 'Tell me about yourself and why you want to work as a bar server on a cruise ship.',
        category: 'personal',
        tip: '简要介绍背景，重点说明对调酒和邮轮服务的热情'
      },
      {
        id: 'bs_02',
        order: 2,
        question: 'What experience do you have in bartending or mixology?',
        category: 'experience',
        tip: '具体说明你的调酒经验、熟悉的饮品、工作环境'
      },
      {
        id: 'bs_03',
        order: 3,
        question: 'How would you handle a guest who has had too much to drink?',
        category: 'scenario',
        tip: '展示你如何专业、礼貌地处理，同时确保安全'
      },
      {
        id: 'bs_04',
        order: 4,
        question: 'Describe a time you provided excellent customer service in a bar setting.',
        category: 'behavioral',
        tip: '用 STAR 结构讲述一个让客人满意的具体经历'
      },
      {
        id: 'bs_05',
        order: 5,
        question: 'What do you know about different types of alcohol and cocktails?',
        category: 'knowledge',
        tip: '展示你对烈酒、葡萄酒、鸡尾酒的了解，提到一些经典配方'
      },
      {
        id: 'bs_06',
        order: 6,
        question: 'How do you handle working in a fast-paced bar environment?',
        category: 'personal',
        tip: '强调你的速度、准确性和压力管理能力'
      },
      {
        id: 'bs_07',
        order: 7,
        question: 'How would you deal with a difficult or rude guest?',
        category: 'scenario',
        tip: '保持专业和冷静，展示你不会把情绪带入工作的能力'
      },
      {
        id: 'bs_08',
        order: 8,
        question: 'Can you make a classic cocktail? Describe the process.',
        category: 'skill',
        tip: '选择一个经典鸡尾酒，详细说明制作步骤和注意事项'
      },
      {
        id: 'bs_09',
        order: 9,
        question: 'What would you do if you ran out of a key ingredient for a cocktail?',
        category: 'scenario',
        tip: '展示你的应变能力，提供替代方案，保持客人满意'
      },
      {
        id: 'bs_10',
        order: 10,
        question: 'How do you ensure responsible alcohol service?',
        category: 'knowledge',
        tip: '展示你对酒精服务法规的了解，包括年龄验证、识别醉酒迹象等'
      },
      {
        id: 'bs_11',
        order: 11,
        question: 'Tell me about a time you worked as part of a team in a bar setting.',
        category: 'behavioral',
        tip: '强调团队合作和你的具体贡献'
      },
      {
        id: 'bs_12',
        order: 12,
        question: 'How do you handle cash and credit card transactions in a bar?',
        category: 'skill',
        tip: '展示你的准确性和对收银系统的熟悉程度'
      },
      {
        id: 'bs_13',
        order: 13,
        question: 'What do you know about wine service and pairing?',
        category: 'knowledge',
        tip: '展示基本的葡萄酒知识，包括服务温度、酒杯选择、基本搭配原则'
      },
      {
        id: 'bs_14',
        order: 14,
        question: 'How would you upsell drinks to guests?',
        category: 'skill',
        tip: '用自然的方式推荐，基于客人的喜好，而不是强行推销'
      },
      {
        id: 'bs_15',
        order: 15,
        question: 'Describe a time you had to deal with a conflict with a coworker.',
        category: 'behavioral',
        tip: '展示你的沟通能力和成熟度，重点在如何解决而不是指责'
      },
      {
        id: 'bs_16',
        order: 16,
        question: 'What would you do if a guest asked for a custom cocktail you\'ve never made before?',
        category: 'scenario',
        tip: '展示你的学习能力和创造力，愿意尝试新配方'
      },
      {
        id: 'bs_17',
        order: 17,
        question: 'How do you feel about living and working on a ship for several months?',
        category: 'personal',
        tip: '展示你已经做好了充分的心理准备，理解船上生活的特点'
      },
      {
        id: 'bs_18',
        order: 18,
        question: 'What makes you a good fit for the cruise ship lifestyle?',
        category: 'personal',
        tip: '强调适应能力、开放心态、喜欢多元文化环境'
      },
      {
        id: 'bs_19',
        order: 19,
        question: 'How would you handle homesickness while working on a ship?',
        category: 'personal',
        tip: '展示你有应对策略，比如保持联系、建立船上友谊、专注工作目标'
      },
      {
        id: 'bs_20',
        order: 20,
        question: 'Describe your experience with inventory management for a bar.',
        category: 'experience',
        tip: '说明你参与过的库存管理工作，展示你的细心和准确性'
      },
      {
        id: 'bs_21',
        order: 21,
        question: 'How do you ensure cleanliness and hygiene in the bar area?',
        category: 'knowledge',
        tip: '展示你对卫生标准的重视，提到具体的清洁流程和习惯'
      },
      {
        id: 'bs_22',
        order: 22,
        question: 'What would you do if you noticed a coworker not following safety procedures?',
        category: 'scenario',
        tip: '先友善提醒同事，如果问题持续则报告上级，强调安全第一'
      },
      {
        id: 'bs_23',
        order: 23,
        question: 'How do you handle multiple drink orders at the same time?',
        category: 'skill',
        tip: '展示你的组织能力和优先级判断能力'
      },
      {
        id: 'bs_24',
        order: 24,
        question: 'Tell me about a time you went above and beyond for a customer in a bar setting.',
        category: 'behavioral',
        tip: '用 STAR 结构讲一个让客人感动的真实故事'
      },
      {
        id: 'bs_25',
        order: 25,
        question: 'Why should we hire you over other candidates?',
        category: 'personal',
        tip: '总结你最大的优势，结合调酒技能和对邮轮工作的热情'
      }
    ]
  }
};

export default interviewQuestions;