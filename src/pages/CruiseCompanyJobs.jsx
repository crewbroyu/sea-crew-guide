// src/pages/CruiseCompanyJobs.jsx
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, ExternalLink, Clock, Globe, DollarSign } from 'lucide-react';

// 邮轮公司列表
const cruiseCompanies = [
  { id: 'all', name: '全部' },
  { id: 'royal', name: 'Royal Caribbean', initial: 'RC', color: 'bg-blue-600' },
  { id: 'msc', name: 'MSC Cruises', initial: 'MSC', color: 'bg-blue-500' },
  { id: 'carnival', name: 'Carnival Cruise Line', initial: 'CCL', color: 'bg-red-600' },
  { id: 'norwegian', name: 'Norwegian Cruise Line', initial: 'NCL', color: 'bg-blue-700' },
  { id: 'celebrity', name: 'Celebrity Cruises', initial: 'CC', color: 'bg-cyan-600' },
  { id: 'disney', name: 'Disney Cruise Line', initial: 'DCL', color: 'bg-red-500' },
  { id: 'princess', name: 'Princess Cruises', initial: 'PC', color: 'bg-pink-600' },
  { id: 'viking', name: 'Viking Cruises', initial: 'VC', color: 'bg-amber-600' }
];

// 岗位类别
const jobCategories = [
  { id: 'all', name: '全部' },
  { id: 'fnb', name: '餐饮服务' },
  { id: 'bar', name: '酒吧服务' },
  { id: 'housekeeping', name: '客房服务' },
  { id: 'retail', name: '免税店/零售' },
  { id: 'guest', name: '前台/宾客服务' },
  { id: 'entertainment', name: '娱乐表演' },
  { id: 'spa', name: '水疗/健身' },
  { id: 'kitchen', name: '厨房/后厨' },
  { id: 'management', name: '管理岗位' },
  { id: 'other', name: '其他' }
];

// 模拟职位数据
const mockJobs = [
  // Royal Caribbean
  { id: 1, company: 'Royal Caribbean', companyId: 'royal', jobTitle: 'Bar Server', category: '酒吧服务', categoryId: 'bar', contractLength: '6-8 months', language: 'English', salaryRange: '$1,800-2,500/month + tips', applyUrl: 'https://www.royalcaribbeangroup.com/careers/', updatedAt: '2025-04-01' },
  { id: 2, company: 'Royal Caribbean', companyId: 'royal', jobTitle: 'Restaurant Server', category: '餐饮服务', categoryId: 'fnb', contractLength: '6-8 months', language: 'English', salaryRange: '$1,600-2,200/month + tips', applyUrl: 'https://www.royalcaribbeangroup.com/careers/', updatedAt: '2025-04-02' },
  { id: 3, company: 'Royal Caribbean', companyId: 'royal', jobTitle: 'Housekeeping Attendant', category: '客房服务', categoryId: 'housekeeping', contractLength: '6-8 months', language: 'English', salaryRange: '$1,400-1,800/month + tips', applyUrl: 'https://www.royalcaribbeangroup.com/careers/', updatedAt: '2025-04-03' },
  { id: 4, company: 'Royal Caribbean', companyId: 'royal', jobTitle: 'Retail Associate', category: '免税店/零售', categoryId: 'retail', contractLength: '6-8 months', language: 'English', salaryRange: '$1,500-2,000/month + commission', applyUrl: 'https://www.royalcaribbeangroup.com/careers/', updatedAt: '2025-04-04' },
  { id: 5, company: 'Royal Caribbean', companyId: 'royal', jobTitle: 'Guest Services', category: '前台/宾客服务', categoryId: 'guest', contractLength: '6-8 months', language: 'English + Chinese', salaryRange: '$1,800-2,400/month', applyUrl: 'https://www.royalcaribbeangroup.com/careers/', updatedAt: '2025-04-05' },
  
  // MSC Cruises
  { id: 6, company: 'MSC Cruises', companyId: 'msc', jobTitle: 'Bar Manager', category: '酒吧服务', categoryId: 'bar', contractLength: '8-10 months', language: 'English', salaryRange: '$2,500-3,500/month', applyUrl: 'https://www.msccruises.com/careers', updatedAt: '2025-04-01' },
  { id: 7, company: 'MSC Cruises', companyId: 'msc', jobTitle: 'Cook', category: '厨房/后厨', categoryId: 'kitchen', contractLength: '8-10 months', language: 'English', salaryRange: '$1,600-2,200/month', applyUrl: 'https://www.msccruises.com/careers', updatedAt: '2025-04-02' },
  { id: 8, company: 'MSC Cruises', companyId: 'msc', jobTitle: 'Spa Therapist', category: '水疗/健身', categoryId: 'spa', contractLength: '8-10 months', language: 'English', salaryRange: '$1,800-3,000/month + commission', applyUrl: 'https://www.msccruises.com/careers', updatedAt: '2025-04-03' },
  { id: 9, company: 'MSC Cruises', companyId: 'msc', jobTitle: 'Entertainment Host', category: '娱乐表演', categoryId: 'entertainment', contractLength: '8-10 months', language: 'English', salaryRange: '$1,700-2,300/month', applyUrl: 'https://www.msccruises.com/careers', updatedAt: '2025-04-04' },
  { id: 10, company: 'MSC Cruises', companyId: 'msc', jobTitle: 'Assistant Hotel Manager', category: '管理岗位', categoryId: 'management', contractLength: '8-10 months', language: 'English', salaryRange: '$4,000-6,000/month', applyUrl: 'https://www.msccruises.com/careers', updatedAt: '2025-04-05' },
  
  // Carnival Cruise Line
  { id: 11, company: 'Carnival Cruise Line', companyId: 'carnival', jobTitle: 'Bartender', category: '酒吧服务', categoryId: 'bar', contractLength: '6-8 months', language: 'English', salaryRange: '$2,000-3,000/month + tips', applyUrl: 'https://www.carnival.com/careers', updatedAt: '2025-04-01' },
  { id: 12, company: 'Carnival Cruise Line', companyId: 'carnival', jobTitle: 'Maitre d\'', category: '餐饮服务', categoryId: 'fnb', contractLength: '6-8 months', language: 'English', salaryRange: '$3,000-4,500/month', applyUrl: 'https://www.carnival.com/careers', updatedAt: '2025-04-02' },
  { id: 13, company: 'Carnival Cruise Line', companyId: 'carnival', jobTitle: 'Room Steward', category: '客房服务', categoryId: 'housekeeping', contractLength: '6-8 months', language: 'English', salaryRange: '$1,500-2,200/month + tips', applyUrl: 'https://www.carnival.com/careers', updatedAt: '2025-04-03' },
  { id: 14, company: 'Carnival Cruise Line', companyId: 'carnival', jobTitle: 'Shop Manager', category: '免税店/零售', categoryId: 'retail', contractLength: '6-8 months', language: 'English', salaryRange: '$2,800-4,000/month + commission', applyUrl: 'https://www.carnival.com/careers', updatedAt: '2025-04-04' },
  { id: 15, company: 'Carnival Cruise Line', companyId: 'carnival', jobTitle: 'Youth Staff', category: '其他', categoryId: 'other', contractLength: '6-8 months', language: 'English', salaryRange: '$1,600-2,100/month', applyUrl: 'https://www.carnival.com/careers', updatedAt: '2025-04-05' },
  
  // Norwegian Cruise Line
  { id: 16, company: 'Norwegian Cruise Line', companyId: 'norwegian', jobTitle: 'Bar Supervisor', category: '酒吧服务', categoryId: 'bar', contractLength: '6-8 months', language: 'English', salaryRange: '$2,200-3,200/month', applyUrl: 'https://www.ncl.com/careers', updatedAt: '2025-04-01' },
  { id: 17, company: 'Norwegian Cruise Line', companyId: 'norwegian', jobTitle: 'Restaurant Manager', category: '餐饮服务', categoryId: 'fnb', contractLength: '6-8 months', language: 'English', salaryRange: '$3,500-5,000/month', applyUrl: 'https://www.ncl.com/careers', updatedAt: '2025-04-02' },
  { id: 18, company: 'Norwegian Cruise Line', companyId: 'norwegian', jobTitle: 'Housekeeping Manager', category: '客房服务', categoryId: 'housekeeping', contractLength: '6-8 months', language: 'English', salaryRange: '$3,200-4,500/month', applyUrl: 'https://www.ncl.com/careers', updatedAt: '2025-04-03' },
  { id: 19, company: 'Norwegian Cruise Line', companyId: 'norwegian', jobTitle: 'Photographer', category: '其他', categoryId: 'other', contractLength: '6-8 months', language: 'English', salaryRange: '$1,400-2,000/month + commission', applyUrl: 'https://www.ncl.com/careers', updatedAt: '2025-04-04' },
  { id: 20, company: 'Norwegian Cruise Line', companyId: 'norwegian', jobTitle: 'Casino Dealer', category: '其他', categoryId: 'other', contractLength: '6-8 months', language: 'English', salaryRange: '$1,800-2,800/month + tips', applyUrl: 'https://www.ncl.com/careers', updatedAt: '2025-04-05' },
  
  // Celebrity Cruises
  { id: 21, company: 'Celebrity Cruises', companyId: 'celebrity', jobTitle: 'Wine Steward', category: '酒吧服务', categoryId: 'bar', contractLength: '6-8 months', language: 'English', salaryRange: '$2,000-3,000/month + tips', applyUrl: 'https://www.celebritycruises.com/careers', updatedAt: '2025-04-01' },
  { id: 22, company: 'Celebrity Cruises', companyId: 'celebrity', jobTitle: 'Sommelier', category: '餐饮服务', categoryId: 'fnb', contractLength: '6-8 months', language: 'English', salaryRange: '$2,500-3,500/month', applyUrl: 'https://www.celebritycruises.com/careers', updatedAt: '2025-04-02' },
  { id: 23, company: 'Celebrity Cruises', companyId: 'celebrity', jobTitle: 'Butler', category: '客房服务', categoryId: 'housekeeping', contractLength: '6-8 months', language: 'English', salaryRange: '$2,200-3,200/month + tips', applyUrl: 'https://www.celebritycruises.com/careers', updatedAt: '2025-04-03' },
  { id: 24, company: 'Celebrity Cruises', companyId: 'celebrity', jobTitle: 'Art Auctioneer', category: '其他', categoryId: 'other', contractLength: '6-8 months', language: 'English', salaryRange: '$2,500-4,000/month + commission', applyUrl: 'https://www.celebritycruises.com/careers', updatedAt: '2025-04-04' },
  { id: 25, company: 'Celebrity Cruises', companyId: 'celebrity', jobTitle: 'Concierge', category: '前台/宾客服务', categoryId: 'guest', contractLength: '6-8 months', language: 'English', salaryRange: '$2,000-2,800/month', applyUrl: 'https://www.celebritycruises.com/careers', updatedAt: '2025-04-05' },
  
  // Disney Cruise Line
  { id: 26, company: 'Disney Cruise Line', companyId: 'disney', jobTitle: 'Character Performer', category: '娱乐表演', categoryId: 'entertainment', contractLength: '6-8 months', language: 'English', salaryRange: '$1,800-2,500/month', applyUrl: 'https://www.disneycareers.com', updatedAt: '2025-04-01' },
  { id: 27, company: 'Disney Cruise Line', companyId: 'disney', jobTitle: 'Youth Activities Counselor', category: '其他', categoryId: 'other', contractLength: '6-8 months', language: 'English', salaryRange: '$1,600-2,200/month', applyUrl: 'https://www.disneycareers.com', updatedAt: '2025-04-02' },
  { id: 28, company: 'Disney Cruise Line', companyId: 'disney', jobTitle: 'Server', category: '餐饮服务', categoryId: 'fnb', contractLength: '6-8 months', language: 'English', salaryRange: '$1,700-2,400/month + tips', applyUrl: 'https://www.disneycareers.com', updatedAt: '2025-04-03' },
  { id: 29, company: 'Disney Cruise Line', companyId: 'disney', jobTitle: 'Stateroom Host/Hostess', category: '客房服务', categoryId: 'housekeeping', contractLength: '6-8 months', language: 'English', salaryRange: '$1,600-2,300/month + tips', applyUrl: 'https://www.disneycareers.com', updatedAt: '2025-04-04' },
  { id: 30, company: 'Disney Cruise Line', companyId: 'disney', jobTitle: 'Merchandise Cast Member', category: '免税店/零售', categoryId: 'retail', contractLength: '6-8 months', language: 'English', salaryRange: '$1,500-2,100/month', applyUrl: 'https://www.disneycareers.com', updatedAt: '2025-04-05' },
  
  // Princess Cruises
  { id: 31, company: 'Princess Cruises', companyId: 'princess', jobTitle: 'Cabin Steward', category: '客房服务', categoryId: 'housekeeping', contractLength: '6-8 months', language: 'English', salaryRange: '$1,500-2,100/month + tips', applyUrl: 'https://www.princess.com/careers', updatedAt: '2025-04-01' },
  { id: 32, company: 'Princess Cruises', companyId: 'princess', jobTitle: 'Bar Waiter', category: '酒吧服务', categoryId: 'bar', contractLength: '6-8 months', language: 'English', salaryRange: '$1,700-2,400/month + tips', applyUrl: 'https://www.princess.com/careers', updatedAt: '2025-04-02' },
  { id: 33, company: 'Princess Cruises', companyId: 'princess', jobTitle: 'Assistant Restaurant Manager', category: '管理岗位', categoryId: 'management', contractLength: '6-8 months', language: 'English', salaryRange: '$2,800-4,000/month', applyUrl: 'https://www.princess.com/careers', updatedAt: '2025-04-03' },
  { id: 34, company: 'Princess Cruises', companyId: 'princess', jobTitle: 'Fitness Instructor', category: '水疗/健身', categoryId: 'spa', contractLength: '6-8 months', language: 'English', salaryRange: '$1,600-2,300/month', applyUrl: 'https://www.princess.com/careers', updatedAt: '2025-04-04' },
  { id: 35, company: 'Princess Cruises', companyId: 'princess', jobTitle: 'Receptionist', category: '前台/宾客服务', categoryId: 'guest', contractLength: '6-8 months', language: 'English', salaryRange: '$1,500-2,100/month', applyUrl: 'https://www.princess.com/careers', updatedAt: '2025-04-05' }
];

export default function CruiseCompanyJobs() {
  const navigate = useNavigate();
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 筛选职位
  const filteredJobs = useMemo(() => {
    return mockJobs.filter(job => {
      const matchesCompany = selectedCompany === 'all' || job.companyId === selectedCompany;
      const matchesCategory = selectedCategory === 'all' || job.categoryId === selectedCategory;
      const matchesSearch = searchQuery === '' || 
        job.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCompany && matchesCategory && matchesSearch;
    });
  }, [selectedCompany, selectedCategory, searchQuery]);

  // 获取公司信息
  const getCompanyInfo = (companyId) => {
    return cruiseCompanies.find(c => c.id === companyId);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部头部 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 pt-16 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/jobs/channels')}
            className="text-white hover:text-blue-200"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-white text-2xl font-bold">邮轮公司官网合辑</h1>
        </div>
        <p className="text-white/80 text-sm mt-2">
          多家邮轮公司职位，支持多维度筛选
        </p>
      </div>

      <div className="px-6 py-4">
        {/* 搜索框 */}
        <div className="relative mb-4">
          <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索职位或公司..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 筛选栏 */}
        <div className="space-y-3 mb-4">
          {/* 邮轮公司筛选 */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">邮轮公司</p>
            <div className="flex overflow-x-auto gap-2 pb-2">
              {cruiseCompanies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => setSelectedCompany(company.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCompany === company.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {company.name}
                </button>
              ))}
            </div>
          </div>

          {/* 岗位类别筛选 */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">岗位类别</p>
            <div className="flex overflow-x-auto gap-2 pb-2">
              {jobCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 结果数量 */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Globe size={16} />
          <span>共找到 {filteredJobs.length} 个职位</span>
        </div>

        {/* 职位列表 */}
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Search size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-2">暂无匹配职位</h3>
            <p className="text-gray-500">请尝试调整筛选条件或搜索关键词</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => {
              const companyInfo = getCompanyInfo(job.companyId);
              return (
                <div key={job.id} className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex items-start gap-4">
                    {/* 公司Logo */}
                    <div className={`w-12 h-12 ${companyInfo?.color || 'bg-gray-500'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white font-bold text-sm">{companyInfo?.initial || job.company.slice(0, 2)}</span>
                    </div>
                    
                    {/* 职位信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 text-lg">{job.jobTitle}</h3>
                          <p className="text-gray-600 text-sm">{job.company}</p>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {job.category}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        <div className="flex items-center gap-1 text-gray-500 text-xs">
                          <Clock size={14} />
                          <span>{job.contractLength}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 text-xs">
                          <Globe size={14} />
                          <span>{job.language} required</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 text-xs">
                          <DollarSign size={14} />
                          <span>{job.salaryRange}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400 text-xs">
                          <span>更新于: {job.updatedAt}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => window.open(job.applyUrl, '_blank')}
                        className="w-full mt-4 py-2.5 rounded-lg font-medium text-sm bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2"
                      >
                        <ExternalLink size={16} />
                        直接申请
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
