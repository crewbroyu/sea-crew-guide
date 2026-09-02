export const listeningSpeakingCategories = [
  {
    id: 'eslpod',
    name: 'ESLPod',
    description: '慢速短句训练，适合建立听说信心',
    accent: 'blue',
    courses: [
      { id: 'eslpod-1', title: 'Daily English', transcript: 'Good morning. Could you please tell me where the staff meeting is held?', translation: '早上好。请问员工会议在哪里举行？' },
      { id: 'eslpod-2', title: 'Business English', transcript: 'Thank you for your time. I will follow up with the information this afternoon.', translation: '感谢您的时间。我会在今天下午跟进并提供相关信息。' },
    ],
  },
  {
    id: 'englishpod',
    name: 'EnglishPod',
    description: '自然语速短句训练，适合提升反应速度',
    accent: 'emerald',
    courses: [
      { id: 'englishpod-1', title: 'Casual English', transcript: 'No problem. I can take care of that for you right away.', translation: '没问题。我可以马上为您处理。' },
      { id: 'englishpod-2', title: 'Travel English', transcript: 'Welcome aboard. Please let me know if there is anything I can help you with.', translation: '欢迎登船。如有任何需要帮助的地方，请告诉我。' },
    ],
  },
]

export const getListeningSpeakingCategory = (categoryId) => listeningSpeakingCategories.find((category) => category.id === categoryId)

export const getListeningSpeakingCourse = (categoryId, courseId) => {
  const category = getListeningSpeakingCategory(categoryId)
  const course = category?.courses.find((item) => item.id === courseId)
  return category && course ? { category, course } : null
}
