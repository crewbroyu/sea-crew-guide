export const listeningSpeakingCategories = [
  {
    id: 'eslpod',
    name: '基础听说',
    description: '从一句服务表达开始，听完立即开口并完成情境回应',
    accent: 'blue',
    courses: [
      { id: 'eslpod-1', title: 'Confirming a Location', transcript: 'Good morning. Could you please tell me where the staff meeting is held?', translation: '早上好。请问员工会议在哪里举行？', position: 'bar_server', cue: 'Ask clearly and politely', challenge: { role: 'Coworker', prompt: 'The briefing room has changed, but you did not hear the new location. What would you ask me?' }, transferQuestion: 'Tell me about a time you had to confirm unclear information before starting a task.' },
      { id: 'eslpod-2', title: 'Taking Ownership', transcript: 'Thank you for your time. I will follow up with the information this afternoon.', translation: '感谢您的时间。我会在今天下午跟进并提供相关信息。', position: 'bar_server', cue: 'Confirm the next action and time', challenge: { role: 'Bar Manager', prompt: 'A guest asked about a beverage package rule you cannot confirm yet. What will you say and do next?' }, transferQuestion: 'How do you handle a guest question when you are not certain about the correct information?' },
    ],
  },
  {
    id: 'englishpod',
    name: '岗位听说',
    description: '用自然语速练服务反应，再把结果带入任务7',
    accent: 'emerald',
    courses: [
      { id: 'englishpod-1', title: 'Responding to a Request', transcript: 'No problem. I can take care of that for you right away.', translation: '没问题。我可以马上为您处理。', position: 'bar_server', cue: 'Acknowledge and take ownership', challenge: { role: 'Guest', prompt: 'Excuse me, I have been waiting for my drink for quite a while. Can you check it for me?' }, transferQuestion: 'Tell me how you would handle a guest who has waited too long for a drink.' },
      { id: 'englishpod-2', title: 'Welcoming a Guest', transcript: 'Welcome aboard. Please let me know if there is anything I can help you with.', translation: '欢迎登船。如有任何需要帮助的地方，请告诉我。', position: 'bar_server', cue: 'Welcome, observe, and offer help', challenge: { role: 'Guest', prompt: 'It is my first day onboard and I am not sure what to order. Could you help me choose something refreshing?' }, transferQuestion: 'How would you welcome an undecided guest and recommend a suitable drink?' },
    ],
  },
]

export const getListeningSpeakingCategory = (categoryId) => listeningSpeakingCategories.find((category) => category.id === categoryId)

export const getListeningSpeakingCourse = (categoryId, courseId) => {
  const category = getListeningSpeakingCategory(categoryId)
  const course = category?.courses.find((item) => item.id === courseId)
  return category && course ? { category, course } : null
}
