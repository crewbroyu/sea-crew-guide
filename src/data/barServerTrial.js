export const BAR_SERVER_TRIAL_VERSION = 1
export const BAR_SERVER_TRIAL_STORAGE_KEY = 'bar_server_trial_v1'

export const barServerTrialScenario = {
  id: 'bar_server_drink_recommendation_01',
  title: 'Busy Night：为客人推荐一杯合适的饮品',
  setting: '海上日晚上 8:30，Pool Bar 正在高峰期。几位客人在等候，一位客人走到吧台前向你咨询。',
  guestLine: "I'd like something light, citrusy, and not too sweet. What do you recommend?",
  task: '请直接用英文扮演 Bar Server 回答客人，建议控制在 30-60 秒。',
  interviewerQuestion: [
    'You are serving a guest during a busy evening at the pool bar.',
    'The guest says: “I’d like something light, citrusy, and not too sweet. What do you recommend?”',
    'Respond as the Bar Server and explain how you would continue the service.',
  ].join(' '),
  focus: '先确认一个关键偏好，再给出具体推荐并解释口味；自然确认价格或 beverage package，不要为了加售而忽略客人需求。',
  keywords: [
    'preference',
    'alcohol',
    'recommend',
    'citrus',
    'flavor',
    'package',
    'choice',
    'guest',
  ],
  checkpoints: [
    '先确认是否含酒精、基酒或其他关键偏好',
    '推荐一款具体饮品，并用客人听得懂的语言描述口味',
    '自然确认 beverage package 或价格，不强行推销',
    '结尾确认选择并推进点单',
  ],
  watchOuts: [
    '不要一次罗列很多酒名，让客人自己猜',
    '不要虚构邮轮公司的套餐、价格或酒精政策',
    '高峰期也要保持简洁、准确和礼貌',
  ],
}

export const getReadinessLabel = (score) => {
  if (score >= 80) return '回答已经接近可面试状态'
  if (score >= 65) return '基础方向正确，仍需强化'
  if (score >= 50) return '能开口，但岗位证据不足'
  return '建议先按反馈重建回答'
}

export const getScoreDeltaMessage = (delta) => {
  if (delta >= 12) return '这次重练出现了明显提升，说明反馈已经转化成回答动作。'
  if (delta >= 5) return '回答有所提升，再补强具体推荐和服务收尾会更稳定。'
  if (delta > 0) return '方向在改善，但变化还不够明显，建议继续针对最低项练习。'
  if (delta === 0) return '两次表现基本持平，需要把反馈转化成更具体的句子和动作。'
  return '第二次分数暂时下降并不代表退步，请放慢速度，先只改一个关键问题。'
}
