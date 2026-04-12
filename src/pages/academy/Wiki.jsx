// src/pages/academy/Wiki.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, BookOpen } from 'lucide-react';

// 海乘百科分类
const categories = [
  { id: 'cognition', name: '入行认知' },
  { id: 'diy', name: '低成本DIY上船' },
  { id: 'position', name: '岗位选择' },
  { id: 'english', name: '英语提升' },
  { id: 'interview', name: '面试与上船流程' },
  { id: 'experience', name: '真实经历' }
];

// 海乘百科文章
const articles = [
  // 入行认知
  {
    id: 'cognition-1',
    title: '海乘到底是什么？真实工作 vs 想象',
    category: 'cognition',
    summary: '揭开海乘职业的神秘面纱，了解真实的工作内容和生活',
    content: '本文内容正在整理中，敬请期待……\n\n海乘职业近年来越来越受到年轻人的关注，但很多人对这个职业存在误解。本文将从实际工作内容、薪资待遇、生活环境等方面，为你还原一个真实的海乘职业。\n\n通过真实海乘的分享，你将了解到海乘工作的优点和挑战，帮助你做出更明智的职业选择。',
    createdAt: '2026-04-01'
  },
  {
    id: 'cognition-2',
    title: '海乘一年能存多少钱？（不同岗位真实对比）',
    category: 'cognition',
    summary: '详解海乘各岗位的收入结构和实际存款情况',
    content: '本文内容正在整理中，敬请期待……\n\n海乘的收入一直是大家关注的焦点，不同岗位的收入差异很大。本文将详细分析餐厅、酒吧、客房、免税店等不同岗位的薪资结构，包括底薪、小费、加班费等。\n\n通过真实数据和案例，为你揭示海乘一年到底能存多少钱，帮助你选择适合自己的岗位。',
    createdAt: '2026-04-02'
  },
  {
    id: 'cognition-3',
    title: '海乘的优点和缺点（别只讲光鲜）',
    category: 'cognition',
    summary: '客观分析海乘职业的优势和挑战',
    content: '本文内容正在整理中，敬请期待……\n\n任何职业都有其两面性，海乘也不例外。本文将客观分析海乘职业的优点和缺点，帮助你全面了解这个职业。\n\n优点包括环球旅行、高收入、丰富的人生经历等；缺点包括长期离家、工作强度大、人际关系复杂等。通过本文，你将对海乘职业有更理性的认识。',
    createdAt: '2026-04-03'
  },
  {
    id: 'cognition-4',
    title: '什么人适合做海乘？什么人千万别来',
    category: 'cognition',
    summary: '分析适合海乘职业的性格特质和能力要求',
    content: '本文内容正在整理中，敬请期待……\n\n海乘职业并不是适合所有人，本文将分析什么样的人适合做海乘，什么样的人不适合。\n\n适合的特质包括：适应能力强、善于沟通、吃苦耐劳、喜欢旅行等；不适合的特质包括：晕船严重、无法适应集体生活、过于内向等。通过本文，你可以评估自己是否适合这个职业。',
    createdAt: '2026-04-04'
  },
  {
    id: 'cognition-5',
    title: '海乘 vs 陆地工作（餐厅/酒吧/销售）',
    category: 'cognition',
    summary: '对比海乘和陆地同类工作的差异',
    content: '本文内容正在整理中，敬请期待……\n\n很多人会拿海乘和陆地的餐厅、酒吧、销售等工作做对比，本文将从收入、工作环境、发展前景等方面进行详细比较。\n\n通过对比，你可以更清楚地了解海乘职业的优势和劣势，做出更适合自己的职业选择。',
    createdAt: '2026-04-05'
  },
  {
    id: 'cognition-6',
    title: '海乘职业路径图（从0到管理层）',
    category: 'cognition',
    summary: '详解海乘的职业发展路径和晋升机会',
    content: '本文内容正在整理中，敬请期待……\n\n海乘职业并不是一个终点，而是一个可以不断发展的职业。本文将为你详细介绍海乘的职业发展路径，从基层员工到管理层的晋升机会和要求。\n\n通过了解职业路径，你可以为自己的海乘生涯制定更清晰的规划。',
    createdAt: '2026-04-06'
  },
  {
    id: 'cognition-7',
    title: '海乘常见骗局和误区合集（中介套路）',
    category: 'cognition',
    summary: '揭露海乘行业的常见骗局和误区，避免上当受骗',
    content: '本文内容正在整理中，敬请期待……\n\n海乘行业存在一些骗局和误区，本文将为你揭露常见的中介套路和行业误区，帮助你避免上当受骗。\n\n包括：虚假高薪承诺、乱收费、合同陷阱等。通过本文，你将学会如何识别和避免这些骗局，保护自己的权益。',
    createdAt: '2026-04-07'
  },
  
  // 低成本DIY上船
  {
    id: 'diy-1',
    title: '海乘DIY全流程（从0到登船完整路径）',
    category: 'diy',
    summary: '详细介绍如何不通过中介自己申请海乘职位',
    content: '本文内容正在整理中，敬请期待……\n\nDIY上船是一种低成本的海乘申请方式，本文将为你详细介绍从准备材料到登船的完整流程。\n\n包括：简历制作、英语准备、官网申请、面试准备、证件办理等各个环节。通过本文，你可以了解如何不花中介费，自己完成海乘申请。',
    createdAt: '2026-04-08'
  },
  {
    id: 'diy-2',
    title: '如何绕过中介自己申请邮轮公司',
    category: 'diy',
    summary: '详解直接申请邮轮公司的方法和技巧',
    content: '本文内容正在整理中，敬请期待……\n\n绕过中介直接申请邮轮公司是降低成本的关键，本文将为你介绍如何找到邮轮公司的官方申请渠道，以及申请的方法和技巧。\n\n包括：各大邮轮公司的官网申请入口、申请流程、注意事项等。通过本文，你可以掌握直接申请的方法，节省中介费用。',
    createdAt: '2026-04-09'
  },
  
  // 岗位选择
  {
    id: 'position-1',
    title: '海乘岗位全解析（餐厅/酒吧/客房/免税店）',
    category: 'position',
    summary: '详细介绍海乘各主要岗位的工作内容和要求',
    content: '本文内容正在整理中，敬请期待……\n\n海乘有很多不同的岗位，本文将详细介绍餐厅、酒吧、客房、免税店等主要岗位的工作内容、薪资待遇、工作强度、晋升机会等。\n\n通过本文，你可以了解各个岗位的特点，选择最适合自己的岗位。',
    createdAt: '2026-04-10'
  },
  
  // 英语提升
  {
    id: 'english-1',
    title: '海乘英语到底需要什么水平',
    category: 'english',
    summary: '详解海乘对英语水平的要求和实际应用场景',
    content: '本文内容正在整理中，敬请期待……\n\n英语是海乘的必备技能，本文将详细介绍海乘对英语水平的要求，以及在实际工作中的应用场景。\n\n包括：不同岗位对英语的要求、常用英语词汇和短语、英语面试技巧等。通过本文，你可以了解如何有针对性地提高自己的英语水平。',
    createdAt: '2026-04-11'
  },
  
  // 面试与上船流程
  {
    id: 'interview-1',
    title: '海乘面试完整流程',
    category: 'interview',
    summary: '详解海乘面试的各个环节和注意事项',
    content: '本文内容正在整理中，敬请期待……\n\n海乘面试是进入这个行业的关键环节，本文将详细介绍面试的完整流程，包括简历筛选、视频面试、现场面试等各个环节。\n\n通过本文，你可以了解面试的流程和注意事项，提高面试通过率。',
    createdAt: '2026-04-12'
  },
  
  // 真实经历
  {
    id: 'experience-1',
    title: '我是怎么从餐厅做到免税店的',
    category: 'experience',
    summary: '一位海乘的职业发展故事',
    content: '本文内容正在整理中，敬请期待……\n\n本文将分享一位海乘从餐厅基层员工晋升到免税店销售的职业发展故事，包括她的工作经历、挑战和收获。\n\n通过真实的故事，你可以了解海乘的职业发展路径和可能性。',
    createdAt: '2026-04-13'
  }
];

export default function Wiki() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('cognition');

  const filteredArticles = articles.filter(article => article.category === selectedCategory);

  const handleArticleClick = (article) => {
    navigate('/academy/wiki/article', {
      state: { article }
    });
  };

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
            {categories.find(c => c.id === selectedCategory)?.name} · {filteredArticles.length} 篇文章
          </p>
        </div>
        
        <div className="space-y-3">
          {filteredArticles.map((article) => (
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
                    <span>{article.createdAt}</span>
                  </div>
                </div>
                <div className="ml-4">
                  <ChevronLeft size={20} className="text-gray-400 transform rotate-180" />
                </div>
              </div>
            </button>
          ))}
        </div>
        
        {filteredArticles.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-600">该分类暂无文章</p>
          </div>
        )}
      </div>
    </div>
  );
}
