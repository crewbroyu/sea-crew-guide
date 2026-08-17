// src/pages/academy/Wiki.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, BookOpen } from 'lucide-react';
import { getEncyclopediaCategories, getEncyclopediaArticles } from '../../services/encyclopediaService';

export default function Wiki() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadArticles();
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      const categoriesData = await getEncyclopediaCategories();
      setCategories(categoriesData);
      if (categoriesData.length > 0) {
        setSelectedCategory(categoriesData[0].id);
      }
    } catch (error) {
      console.error('加载分类失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadArticles = async () => {
    if (!selectedCategory) return;
    
    try {
      const articlesData = await getEncyclopediaArticles(selectedCategory);
      setArticles(articlesData);
    } catch (error) {
      console.error('加载文章失败:', error);
    }
  };

  const handleArticleClick = (article) => {
    navigate(`/academy/wiki/${article.slug || article.id}`, {
      state: { article }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部头部区域 */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-800 px-6 pt-16 pb-6">
        {/* 面包屑导航 */}
        <div className="flex items-center gap-2 text-amber-200 text-sm mb-4">
          <span onClick={() => navigate('/academy')} className="cursor-pointer hover:text-white">海乘学院</span>
          <span className="breadcrumb-separator">›</span>
          <span className="text-white font-medium">海乘百科</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/academy')}
            className="text-white hover:text-amber-200"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-white text-2xl font-bold">海乘百科</h1>
        </div>
        <p className="text-white/80 text-sm mt-2">
          全面了解海乘行业的知识和经验
        </p>
      </div>
      
      {/* 分类标签栏 */}
      <div className="px-6 py-4 bg-white shadow-sm sticky top-0 z-10">
        <div className="flex overflow-x-auto gap-2 pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === category.id ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* 文章列表 */}
      <div className="px-6 py-6 space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <h2 className="text-lg font-bold text-gray-800">文章列表</h2>
          <p className="text-gray-600 mt-2">
            {categories.find(c => c.id === selectedCategory)?.name} · {articles.length} 篇文章
          </p>
        </div>
        
        <div className="space-y-3">
          {articles.map((article) => (
            <button
              key={article.id}
              onClick={() => handleArticleClick(article)}
              className="w-full bg-white rounded-xl p-4 shadow-sm active:scale-[0.98] transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800 mb-2">{article.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{article.summary}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <BookOpen size={14} />
                    <span>{article.createdAt ? new Date(article.createdAt).toLocaleDateString() : '未知'}</span>
                  </div>
                </div>
                <div className="ml-4">
                  <ChevronLeft size={20} className="text-gray-400 transform rotate-180" />
                </div>
              </div>
            </button>
          ))}
        </div>
        
        {articles.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-600">该分类暂无文章</p>
          </div>
        )}
      </div>
    </div>
  );
}
