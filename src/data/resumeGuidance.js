const defaultGuidance = {
  key: 'general',
  label: 'Cruise Hospitality',
  targetRole: 'Cruise Hospitality Candidate',
  headline: '把普通服务经历改写成邮轮可投递简历',
  keywords: ['customer service', 'teamwork', 'communication', 'problem-solving', 'hospitality'],
  summaryTemplates: [
    {
      label: '服务转岗',
      text: 'Customer-focused hospitality candidate with hands-on experience in guest service, daily operations, and team collaboration. Able to stay calm in a fast-paced environment, communicate clearly with guests, and support consistent service standards. Seeking to bring reliable service skills to an international cruise team.',
    },
    {
      label: '零经验入门',
      text: 'Motivated cruise hospitality candidate with strong responsibility, English communication ability, and willingness to learn onboard service standards. Prepared to work in a multicultural team, follow procedures, and support guests with a professional attitude throughout the contract.',
    },
  ],
  bulletExamples: [
    'Handled daily guest requests and maintained a positive service experience in a busy environment.',
    'Worked with team members to keep operations smooth during peak hours.',
    'Resolved customer questions by listening carefully, confirming details, and providing practical solutions.',
  ],
  qualityFocus: ['服务经历是否具体', '是否出现邮轮/酒店关键词', '是否能看出抗压和团队协作'],
}

const roleGuidance = {
  retail: {
    key: 'retail',
    label: 'Retail Sales Associate',
    targetRole: 'Retail Sales Associate',
    headline: '突出销售、产品推荐和目标感',
    keywords: ['retail sales', 'upselling', 'product recommendation', 'customer needs', 'sales target'],
    summaryTemplates: [
      {
        label: '销售经验',
        text: 'Retail sales candidate with experience in customer needs analysis, product recommendation, and sales target support. Skilled at introducing products clearly, handling objections with patience, and creating a positive shopping experience for guests. Ready to contribute to onboard retail sales in a multicultural cruise environment.',
      },
      {
        label: '服务转销售',
        text: 'Service-oriented candidate with strong communication skills and a clear interest in cruise retail. Able to understand guest needs, recommend suitable products, and stay professional during busy service periods. Prepared to develop product knowledge and sales performance onboard.',
      },
    ],
    bulletExamples: [
      'Recommended products based on customer needs and supported daily sales targets.',
      'Handled customer questions, product comparisons, and objections with clear communication.',
      'Maintained product display, stock awareness, and a clean shopping environment.',
    ],
    qualityFocus: ['有没有销售结果或目标意识', '有没有产品推荐动作', '有没有处理犹豫顾客的经历'],
  },
  restaurant: {
    key: 'restaurant',
    label: 'Restaurant Assistant',
    targetRole: 'Restaurant Assistant',
    headline: '突出餐饮流程、高峰期协作和客诉处理',
    keywords: ['food service', 'order taking', 'guest request', 'peak hours', 'table service'],
    summaryTemplates: [
      {
        label: '餐饮经验',
        text: 'Restaurant service candidate with experience in order taking, table service, guest requests, and peak-hour teamwork. Able to maintain service standards, communicate politely with guests, and support smooth restaurant operations. Seeking to apply food service experience in an international cruise environment.',
      },
      {
        label: '基础服务',
        text: 'Reliable hospitality candidate with a strong service attitude and willingness to learn cruise restaurant standards. Comfortable with fast-paced work, team coordination, and guest-facing communication. Prepared to support restaurant operations and improve onboard service skills.',
      },
    ],
    bulletExamples: [
      'Served guests during busy shifts while keeping table service organized and polite.',
      'Took orders, answered menu questions, and responded to guest requests in a timely manner.',
      'Coordinated with team members to prepare tables, deliver items, and maintain service flow.',
    ],
    qualityFocus: ['有没有餐饮服务流程', '有没有高峰期经历', '有没有客人需求处理'],
  },
  bar: {
    key: 'bar',
    label: 'Bar Server',
    targetRole: 'Bar Server',
    headline: '突出点单、互动、晚班和快节奏服务',
    keywords: ['bar service', 'drink order', 'guest interaction', 'upselling', 'busy shift'],
    summaryTemplates: [
      {
        label: '酒吧服务',
        text: 'Bar service candidate with experience in guest interaction, drink orders, and fast-paced service support. Able to communicate clearly, stay organized during busy shifts, and recommend suitable options to guests. Interested in contributing to a professional cruise bar team.',
      },
      {
        label: '服务转酒吧',
        text: 'Outgoing service candidate with strong communication skills and readiness to learn bar product knowledge. Comfortable working in a lively environment, supporting guest needs, and collaborating with team members during peak service periods.',
      },
    ],
    bulletExamples: [
      'Supported drink orders, guest interaction, and table service during busy periods.',
      'Recommended suitable drinks or menu items based on guest preferences.',
      'Maintained service speed, cleanliness, and teamwork in a high-energy environment.',
    ],
    qualityFocus: ['有没有快节奏服务经历', '有没有推荐/追加销售', '是否能接受晚班和互动'],
  },
  frontOffice: {
    key: 'frontOffice',
    label: 'Guest Service Associate',
    targetRole: 'Guest Service Associate',
    headline: '突出英文沟通、信息确认和投诉处理',
    keywords: ['guest service', 'complaint handling', 'information accuracy', 'front desk', 'cross-department communication'],
    summaryTemplates: [
      {
        label: '前台/客服',
        text: 'Guest service candidate with experience in front-desk communication, guest inquiries, complaint handling, and information accuracy. Able to stay calm, confirm details clearly, and coordinate with team members to solve guest issues. Seeking to bring professional communication skills to a cruise guest services team.',
      },
      {
        label: '英语服务',
        text: 'English-speaking service candidate with strong patience, clear communication, and interest in international guest service. Prepared to handle inquiries, confirm guest information, and support service recovery in a multicultural cruise environment.',
      },
    ],
    bulletExamples: [
      'Handled guest inquiries by confirming details accurately and providing clear information.',
      'Supported complaint resolution with patience, empathy, and timely communication.',
      'Coordinated with other departments to follow up guest requests and service issues.',
    ],
    qualityFocus: ['有没有英文沟通证据', '有没有投诉处理案例', '有没有信息准确性和跨部门配合'],
  },
  housekeeping: {
    key: 'housekeeping',
    label: 'Housekeeping',
    targetRole: 'Housekeeping Attendant',
    headline: '突出清洁标准、效率、隐私和安全意识',
    keywords: ['housekeeping', 'cleaning standards', 'time management', 'guest privacy', 'sanitation'],
    summaryTemplates: [
      {
        label: '客房/清洁',
        text: 'Housekeeping candidate with strong attention to detail, time management, and respect for guest privacy. Able to follow cleaning standards, maintain sanitation, and complete tasks reliably in a fast-paced hospitality environment. Prepared to support onboard housekeeping operations.',
      },
      {
        label: '入门稳妥',
        text: 'Reliable and detail-oriented candidate prepared for housekeeping work in the cruise industry. Comfortable with physical tasks, standard procedures, and teamwork. Ready to learn onboard cleaning standards and support a safe, clean guest environment.',
      },
    ],
    bulletExamples: [
      'Maintained clean and organized service areas according to hygiene standards.',
      'Completed repetitive tasks efficiently while keeping attention to detail.',
      'Protected guest privacy and reported issues clearly to supervisors or team members.',
    ],
    qualityFocus: ['有没有清洁标准意识', '有没有效率和细节', '有没有隐私/安全意识'],
  },
}

export const mapPositionToResumeRole = (position = '') => {
  const normalized = position.toLowerCase()
  if (normalized.includes('retail') || normalized.includes('shop') || normalized.includes('sales') || normalized.includes('jewelry')) return 'retail'
  if (normalized.includes('restaurant') || normalized.includes('waiter') || normalized.includes('buffet')) return 'restaurant'
  if (normalized.includes('bar') || normalized.includes('bartender')) return 'bar'
  if (normalized.includes('guest service') || normalized.includes('front') || normalized.includes('reception') || normalized.includes('concierge')) return 'frontOffice'
  if (normalized.includes('housekeeping') || normalized.includes('cabin') || normalized.includes('laundry')) return 'housekeeping'
  return 'general'
}

export const getTargetPositionFromTask2 = () => {
  try {
    const task2Result = JSON.parse(localStorage.getItem('task2_result') || '{}')
    return task2Result.selectedTargetJob || task2Result.target_position || ''
  } catch {
    return ''
  }
}

export const getResumeGuidance = (position = getTargetPositionFromTask2()) => {
  const roleKey = mapPositionToResumeRole(position)
  return roleGuidance[roleKey] || defaultGuidance
}

export const actionVerbs = [
  'Handled',
  'Supported',
  'Coordinated',
  'Resolved',
  'Maintained',
  'Recommended',
  'Communicated',
  'Assisted',
]
