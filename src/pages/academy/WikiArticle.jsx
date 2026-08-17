// src/pages/academy/WikiArticle.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ChevronLeft, BookOpen, Clock, Target, Route } from 'lucide-react';
import { getEncyclopediaArticle } from '../../services/encyclopediaService';

export default function WikiArticle() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [article, setArticle] = useState(location.state?.article || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!article && (id || location.state?.articleId)) {
      loadArticle();
    }
  }, [article, id, location.state?.articleId]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      const articleData = await getEncyclopediaArticle(id || location.state?.articleId);
      setArticle(articleData);
    } catch (error) {
      console.error('加载文章失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  if (!article) {
    navigate('/academy/wiki');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部头部区域 */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-800 px-6 pt-16 pb-6">
        {/* 面包屑导航 */}
        <div className="flex items-center gap-2 text-amber-200 text-sm mb-4">
          <span onClick={() => navigate('/academy')} className="cursor-pointer hover:text-white">海乘学院</span>
          <span className="breadcrumb-separator">›</span>
          <span onClick={() => navigate('/academy/wiki')} className="cursor-pointer hover:text-white">海乘百科</span>
          <span className="breadcrumb-separator">›</span>
          <span className="text-white font-medium">{article.categoryName || '百科文章'}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/academy/wiki')}
            className="text-white hover:text-amber-200"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-white text-2xl font-bold">{article.title}</h1>
        </div>
        <div className="flex items-center gap-2 text-white/80 text-sm mt-2">
          <BookOpen size={14} />
          <span>{article.categoryName || '百科文章'}</span>
          <span className="mx-2">·</span>
          <Clock size={14} />
          <span>{article.createdAt ? new Date(article.createdAt).toLocaleDateString() : '未知'}</span>
        </div>
      </div>
      
      {/* 文章内容 */}
      <div className="px-6 py-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: article.content }} />

          <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                <Target size={20} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">看完这篇，先判断你适合哪些岗位</h2>
                <p className="text-sm text-gray-600 mt-1">
                  用几分钟测一下你的经历、英语和性格，更清楚地选择海乘准备方向。
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/assessment')}
              className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              测测我适合哪些海乘岗位
            </button>

            <button
              type="button"
              onClick={() => navigate('/tasks')}
              className="w-full mt-3 py-2.5 rounded-lg text-blue-700 font-medium flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors"
            >
              <Route size={16} />
              查看低成本登船路线
            </button>
          </div>
          
          {/* 文章底部 */}
          <div className="mt-8 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <button
                onClick={() => navigate('/academy/wiki')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <ChevronLeft size={16} />
                <span>返回列表</span>
              </button>
              <div className="text-xs text-gray-500">
                文章来源：海乘学院
              </div>
            </div>
          </div>
        </div>
        
        {/* 相关推荐 */}
        <div className="mt-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">相关推荐</h3>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-gray-600 text-sm">
              更多相关文章将在后续更新，敬请期待！
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
