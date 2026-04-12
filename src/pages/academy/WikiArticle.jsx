// src/pages/academy/WikiArticle.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, BookOpen, Clock } from 'lucide-react';

export default function WikiArticle() {
  const navigate = useNavigate();
  const location = useLocation();
  const { article } = location.state || {};

  if (!article) {
    navigate('/academy/wiki');
    return null;
  }

  // 获取分类名称
  const categoryNames = {
    cognition: '入行认知',
    diy: '低成本DIY上船',
    position: '岗位选择',
    english: '英语提升',
    interview: '面试与上船流程',
    experience: '真实经历'
  };

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
          <span className="text-white font-medium">{categoryNames[article.category]}</span>
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
          <span>{categoryNames[article.category]}</span>
          <span className="mx-2">·</span>
          <Clock size={14} />
          <span>{article.createdAt}</span>
        </div>
      </div>
      
      {/* 文章内容 */}
      <div className="px-6 py-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="prose max-w-none">
            {article.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-4">{paragraph}</p>
            ))}
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
