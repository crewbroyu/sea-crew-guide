export const getEncyclopediaCategories = async () => {
  try {
    const response = await fetch('/api/encyclopedia/categories')
    const data = await response.json()
    return Array.isArray(data) ? data : [
      { id: 'cognition', name: '入行认知', sortOrder: 1 },
      { id: 'diy', name: '低成本DIY上船', sortOrder: 2 },
      { id: 'position', name: '岗位选择', sortOrder: 3 },
      { id: 'english', name: '英语提升', sortOrder: 4 },
      { id: 'interview', name: '面试与上船流程', sortOrder: 5 },
      { id: 'experience', name: '实战经验', sortOrder: 6 }
    ]
  } catch (error) {
    console.error('获取分类失败:', error)
    // 返回默认数据作为备用
    return [
      { id: 'cognition', name: '入行认知', sortOrder: 1 },
      { id: 'diy', name: '低成本DIY上船', sortOrder: 2 },
      { id: 'position', name: '岗位选择', sortOrder: 3 },
      { id: 'english', name: '英语提升', sortOrder: 4 },
      { id: 'interview', name: '面试与上船流程', sortOrder: 5 },
      { id: 'experience', name: '实战经验', sortOrder: 6 }
    ]
  }
}

export const getEncyclopediaArticles = async (categoryId) => {
  try {
    const url = categoryId 
      ? `/api/encyclopedia/articles?categoryId=${categoryId}` 
      : '/api/encyclopedia/articles'
    const response = await fetch(url)
    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取文章失败:', error)
    // 返回空数组作为备用
    return []
  }
}

export const getEncyclopediaArticle = async (id) => {
  try {
    const response = await fetch(`/api/encyclopedia/articles/${id}`)
    return response.json()
  } catch (error) {
    console.error('获取文章详情失败:', error)
    return null
  }
}