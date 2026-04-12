// src/data/trainingCourses.js
const trainingCourses = {
  waiter: {
    title: '餐厅服务员 Waiter',
    icon: '🍽️',
    description: '掌握餐饮服务技能，从基础服务到高级侍酒，全面提升你的餐厅服务水平。',
    courses: [
      {
        id: 'w1',
        name: 'English for Tourism - Restaurant Service',
        nameZh: '旅游英语 - 餐厅服务',
        platform: 'Alison',
        platformColor: 'purple',
        level: '入门',
        duration: '2-3小时',
        description: '学习餐厅场景下的旅游英语，包括点单、推荐菜品、处理客户需求等实用英语表达。',
        url: 'https://alison.com/topic/learn/79298/learning-outcomes',
        tags: ['英语', '餐厅服务'],
        recommended: true,
        order: 1
      },
      {
        id: 'w2',
        name: "Food & Beverage Service: Basic Waiter's Training",
        nameZh: '餐饮服务：基础服务员培训',
        platform: 'Alison',
        platformColor: 'purple',
        level: '入门',
        duration: '3-4小时',
        description: '了解餐厅服务类型、基本服务流程、餐具摆放和用餐礼仪等基础知识。',
        url: 'https://alison.com/topic/learn/134907/types-of-service-in-restaurant',
        tags: ['餐饮服务', '基础培训'],
        recommended: true,
        order: 2
      },
      {
        id: 'w3',
        name: 'Skills for a Successful Waiter',
        nameZh: '成功服务员必备技能',
        platform: 'Alison',
        platformColor: 'purple',
        level: '初级',
        duration: '3-4小时',
        description: '学习优秀服务员的硬技能和软技能，包括服务流程、卫生标准、设备使用和客户服务技巧。',
        url: 'https://alison.com/course/skills-for-a-successful-waiter',
        tags: ['服务技能', 'CPD认证'],
        recommended: true,
        order: 3
      },
      {
        id: 'w4',
        name: "Food & Beverage Service: Advanced Waiter's Training",
        nameZh: '餐饮服务：高级服务员培训',
        platform: 'Alison',
        platformColor: 'purple',
        level: '进阶',
        duration: '3-4小时',
        description: '进阶课程，深入学习高级餐饮服务技能，提升专业水平。',
        url: 'https://alison.com/topic/learn/135387/learning-outcomes',
        tags: ['高级培训', '进阶'],
        order: 4
      }
    ]
  },
  retail: {
    title: '免税店销售 Retail Sales',
    icon: '🛍️',
    description: '从零售基础到邮轮免税店专项技能，系统学习销售、陈列和产品知识。',
    courses: [
      {
        id: 'r1',
        name: 'An Introduction to Retail Associate',
        nameZh: '零售入门：了解零售岗位',
        platform: 'Alison',
        platformColor: 'purple',
        level: '入门',
        duration: '3-4小时',
        description: '了解零售岗位职责、零售心理学、客户行为分析、销售流程、视觉陈列和健康安全规定。',
        url: 'https://alison.com/course/an-introduction-to-retail-associate',
        tags: ['零售基础', 'CPD认证'],
        recommended: true,
        order: 1
      },
      {
        id: 'r2',
        name: 'Retail Management: Merchandising, Sales & Communications',
        nameZh: '零售管理：商品陈列与销售沟通',
        platform: 'Alison',
        platformColor: 'purple',
        level: '初级',
        duration: '3-4小时',
        description: '学习 upselling、cross-selling 销售技巧，商品陈列、定价策略和客户沟通。',
        url: 'https://alison.com/course/retail-management-merchandising-sales-and-customer-communications',
        tags: ['销售技巧', '客户沟通'],
        recommended: true,
        order: 2
      },
      {
        id: 'r3',
        name: 'Cruise Retail Academy Training',
        nameZh: '邮轮零售学院培训（最对口）',
        platform: 'CruiseRetail Academy',
        platformColor: 'blue',
        level: '专项',
        duration: '100+小时（多课程）',
        description: '邮轮免税零售专项平台，50+免费课程，涵盖邮轮零售文凭、品牌培训、行业播客。最对口邮轮免税店岗位。',
        url: 'https://www.cruiseretailacademy.com/training',
        tags: ['邮轮专项', '强烈推荐'],
        recommended: true,
        highlight: true,
        order: 3
      },
      {
        id: 'r4',
        name: 'Introduction to Merchandising',
        nameZh: '商品陈列入门',
        platform: 'Coursera',
        platformColor: 'indigo',
        level: '中级',
        duration: '约2小时',
        description: '学习商品展示逻辑、消费者行为、零售策略和店铺布局，帮助理解香水/手表/酒类销售陈列。',
        url: 'https://www.coursera.org/learn/introduction-to-merchandising',
        tags: ['商品陈列', '可获证书'],
        order: 4
      },
      {
        id: 'r5',
        name: 'Retail Management: Customer Interactions',
        nameZh: '零售客户接待英语',
        platform: 'Alison',
        platformColor: 'purple',
        level: '初级',
        duration: '2-3小时',
        description: '专练客户接待英语、投诉处理英语，提升销售场景下的英语沟通能力。',
        url: 'https://alison.com/course/retail-management-customer-interactions',
        tags: ['销售英语', '客户服务'],
        order: 5
      },
      {
        id: 'r6',
        name: 'The Fragrance Foundation',
        nameZh: '香水基础知识',
        platform: '行业资源',
        platformColor: 'pink',
        level: '知识补充',
        duration: '自主浏览',
        description: '全球香水行业权威机构，了解香水品牌、调香师、行业趋势。销售香水前的必备知识储备。',
        url: 'https://www.fragrance.org/',
        tags: ['香水', '产品知识'],
        isResource: true,
        order: 6
      },
      {
        id: 'r7',
        name: 'Hodinkee - Watch Education',
        nameZh: '手表基础知识',
        platform: '行业资源',
        platformColor: 'gray',
        level: '知识补充',
        duration: '自主浏览',
        description: '全球知名手表媒体，学习手表品牌、机芯知识、行业文化，提升手表销售专业谈资。',
        url: 'https://www.hodinkee.com/',
        tags: ['手表', '产品知识'],
        isResource: true,
        order: 7
      },
      {
        id: 'r8',
        name: 'YouTube: Retail Sales Role Play',
        nameZh: '模拟销售英语对话练习',
        platform: 'YouTube',
        platformColor: 'red',
        level: '实战练习',
        duration: '自主练习',
        description: '搜索 "Retail Sales Role Play English Conversation"，通过真实销售场景视频练习英语。推荐频道：English with Lucy、Business English Pod。',
        url: 'https://www.youtube.com/results?search_query=retail+sales+role+play+english+conversation',
        tags: ['口语练习', '最重要'],
        recommended: true,
        order: 8
      }
    ]
  },
  barServer: {
    title: '酒吧服务员 Bar Server',
    icon: '🍸',
    description: '从调酒入门到专业认证，系统学习酒类知识和调酒技能。',
    courses: [
      {
        id: 'b1',
        name: 'The Working Bartender: Beginner Bartending Course',
        nameZh: '实战调酒师：零基础入门',
        platform: 'Udemy',
        platformColor: 'violet',
        level: '入门',
        duration: '数小时',
        description: '零基础入门，重点学习吧台工具、基础酒类知识、经典鸡尾酒配方和岗位英语表达。',
        url: 'https://www.udemy.com/',
        tags: ['调酒入门', '零基础'],
        recommended: true,
        note: '在Udemy搜索课程名',
        order: 1
      },
      {
        id: 'b2',
        name: 'Bartending Skills Training – Learn to Bartend',
        nameZh: '调酒技能培训',
        platform: 'LIQUORexam',
        platformColor: 'amber',
        level: '初级',
        duration: '数小时',
        description: '快速建立 spirits / beer / wine / cocktail 知识体系，适合面试前补充专业术语。',
        url: 'https://liquorexam.com/',
        tags: ['酒类知识', '面试准备'],
        recommended: true,
        note: '在网站搜索课程名',
        order: 2
      },
      {
        id: 'b3',
        name: 'BarSmarts Beginner',
        nameZh: 'BarSmarts 行业认证入门',
        platform: 'BarSmarts',
        platformColor: 'emerald',
        level: '进阶',
        duration: '数小时',
        description: '行业认可度高的调酒培训，适合有一定基础后进阶学习，业内普遍认为很值得。',
        url: 'https://barsmarts.com/',
        tags: ['行业认证', '进阶'],
        order: 3
      }
    ]
  }
};

export default trainingCourses;