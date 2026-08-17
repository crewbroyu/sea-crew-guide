import { supabase } from '../supabase'

const fallbackArticles = [
  {
    id: 'what-is-sea-crew',
    slug: 'what-is-sea-crew',
    title: '海乘到底是做什么的？',
    category: '海乘入门',
    categoryName: '海乘入门',
    summary: '用简单语言了解海乘的工作内容、岗位类型和真实工作环境。',
    content: '<p>海乘通常指在国际邮轮或相关海上服务场景中工作的服务人员。常见岗位包括餐饮服务、客房服务、前台宾客服务、零售、娱乐、厨房和后勤等。</p><p>海乘工作的核心不是“旅行”，而是在船上为来自不同国家的客人提供稳定、专业、礼貌的服务。</p>',
    createdAt: new Date().toISOString(),
    sortOrder: 1,
  },
  {
    id: 'sea-crew-english-level',
    slug: 'sea-crew-english-level',
    title: '海乘英语需要什么水平？',
    category: '英语要求',
    categoryName: '英语要求',
    summary: '很多人担心英语不够好，这篇文章帮你判断真实要求。',
    content: '<p>海乘英语不一定要求你像母语者一样流利，但需要能完成岗位相关沟通。</p><p>餐饮、客房、前台等岗位的英语要求不同。建议先从服务场景句子开始练习，再逐步准备面试回答。</p>',
    createdAt: new Date().toISOString(),
    sortOrder: 2,
  },
  {
    id: 'sea-crew-income-contract',
    slug: 'sea-crew-income-contract',
    title: '海乘收入和合同周期真实吗？',
    category: '收入合同',
    categoryName: '收入合同',
    summary: '了解海乘收入、合同长度、休假和工作节奏的基本情况。',
    content: '<p>海乘收入会受到公司、岗位、航线、小费制度和个人经验影响。不同岗位之间差异很大，不建议只看网上最高收入案例。</p><p>判断一个机会是否适合你，不能只看收入，也要看英语、服务经验、家庭情况和长期职业目标。</p>',
    createdAt: new Date().toISOString(),
    sortOrder: 3,
  },
]

const mapArticle = (article) => ({
  id: article.slug || article.id,
  uuid: article.id,
  slug: article.slug,
  title: article.title,
  category: article.category,
  categoryName: article.category,
  summary: article.excerpt || '',
  content: formatContent(article.content || ''),
  coverImageUrl: article.cover_image_url,
  createdAt: article.published_at || article.created_at,
  updatedAt: article.updated_at,
  sortOrder: article.sort_order || 0,
})

const formatContent = (content) => {
  if (content.includes('<')) return content

  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('')
}

const escapeHtml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const getFallbackCategories = () => {
  const names = [...new Set(fallbackArticles.map((article) => article.category))]
  return names.map((name, index) => ({ id: name, name, sortOrder: index + 1 }))
}

export const getEncyclopediaCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('category')
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
      .order('published_at', { ascending: false })

    if (error) throw error

    const names = [...new Set((data || []).map((item) => item.category).filter(Boolean))]
    if (names.length === 0) return getFallbackCategories()

    return names.map((name, index) => ({ id: name, name, sortOrder: index + 1 }))
  } catch (error) {
    console.error('获取百科分类失败:', error)
    return getFallbackCategories()
  }
}

export const getEncyclopediaArticles = async (categoryId) => {
  try {
    let query = supabase
      .from('articles')
      .select('id, slug, title, category, excerpt, content, cover_image_url, sort_order, published_at, created_at, updated_at')
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
      .order('published_at', { ascending: false })

    if (categoryId) {
      query = query.eq('category', categoryId)
    }

    const { data, error } = await query
    if (error) throw error

    const articles = (data || []).map(mapArticle)
    if (articles.length === 0 && !categoryId) return fallbackArticles
    if (articles.length === 0 && categoryId) {
      return fallbackArticles.filter((article) => article.category === categoryId)
    }

    return articles
  } catch (error) {
    console.error('获取百科文章失败:', error)
    return categoryId
      ? fallbackArticles.filter((article) => article.category === categoryId)
      : fallbackArticles
  }
}

export const getEncyclopediaArticle = async (idOrSlug) => {
  try {
    let query = supabase
      .from('articles')
      .select('id, slug, title, category, excerpt, content, cover_image_url, sort_order, published_at, created_at, updated_at')
      .eq('status', 'published')

    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrSlug)) {
      query = query.eq('id', idOrSlug)
    } else {
      query = query.eq('slug', idOrSlug)
    }

    const { data, error } = await query.maybeSingle()

    if (error) throw error
    if (data) return mapArticle(data)

    return fallbackArticles.find((article) => article.slug === idOrSlug || article.id === idOrSlug) || null
  } catch (error) {
    console.error('获取百科文章详情失败:', error)
    return fallbackArticles.find((article) => article.slug === idOrSlug || article.id === idOrSlug) || null
  }
}
