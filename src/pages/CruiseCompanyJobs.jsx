// src/pages/CruiseCompanyJobs.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ExternalLink, Globe, Star, Briefcase } from 'lucide-react';
import JobApplicationCard from '../components/JobApplicationCard';

// 邮轮公司列表
const cruiseCompanies = [
  {
    id: 'royal',
    name: 'ROYAL CARIBBEAN & CELEBRITY',
    url: 'https://rclctrac.com/',
    color: 'bg-blue-600',
    logo: 'RCC',
    description: '皇家加勒比和 Celebrity 邮轮官方招聘网站',
    commonJobs: ['Bar Server', 'Retail', 'Guest Service', 'Housekeeping']
  },
  {
    id: 'stardream',
    name: '丽星梦',
    url: 'https://stardreamcruises.com/sc-cn/careers',
    color: 'bg-purple-600',
    logo: '丽星',
    description: '丽星梦邮轮官方招聘网站',
    commonJobs: ['Bar Server', 'Retail', 'Guest Service', 'Housekeeping']
  },
  {
    id: 'carnival',
    name: 'Carnival',
    url: 'https://shipjobs.carnival.com/',
    color: 'bg-red-600',
    logo: 'CCL',
    description: '嘉年华邮轮官方招聘网站',
    commonJobs: ['Bar Server', 'Retail', 'Guest Service', 'Housekeeping']
  },
  {
    id: 'costa',
    name: 'Costa',
    url: 'https://career.costacrociere.it/shipside/',
    color: 'bg-orange-600',
    logo: 'COSTA',
    description: '歌诗达邮轮官方招聘网站',
    commonJobs: ['Bar Server', 'Retail', 'Guest Service', 'Housekeeping']
  },
  {
    id: 'msc',
    name: 'MSC',
    url: 'https://careers.msccruises.com/gb/en/msccruises/onboard-roles',
    color: 'bg-blue-500',
    logo: 'MSC',
    description: 'MSC邮轮官方招聘网站',
    commonJobs: ['Bar Server', 'Retail', 'Guest Service', 'Housekeeping']
  },
  {
    id: 'ncl',
    name: 'NCL',
    url: 'https://www.ncl.com/in/en/about/careers/overview',
    color: 'bg-blue-700',
    logo: 'NCL',
    description: '诺唯真邮轮官方招聘网站',
    commonJobs: ['Bar Server', 'Retail', 'Guest Service', 'Housekeeping']
  },
  {
    id: 'viking',
    name: '维京',
    url: 'https://www.vikingcruises.cn/careers/',
    color: 'bg-amber-600',
    logo: '维京',
    description: '维京邮轮官方招聘网站',
    commonJobs: ['Bar Server', 'Retail', 'Guest Service', 'Housekeeping']
  },
  {
    id: 'silversea',
    name: 'Silversea',
    url: 'https://crewcareer.silversea.com/',
    color: 'bg-gray-700',
    logo: 'SS',
    description: '银海邮轮官方招聘网站',
    commonJobs: ['Bar Server', 'Retail', 'Guest Service', 'Housekeeping']
  }
];

// 保存申请记录到本地存储
const saveApplication = (application) => {
  const applications = JSON.parse(localStorage.getItem('job_applications') || '[]');
  const newApplication = {
    id: Date.now().toString(),
    companyName: application.companyName,
    jobTitle: application.jobTitle,
    notes: application.notes,
    companyUrl: application.companyUrl,
    status: '未完成',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  applications.push(newApplication);
  localStorage.setItem('job_applications', JSON.stringify(applications));
};

export default function CruiseCompanyJobs() {
  const navigate = useNavigate();
  const [selectedCompany, setSelectedCompany] = useState(null);

  const handleCompanyClick = (company) => {
    setSelectedCompany(company);
  };

  const handleApply = (application) => {
    // 保存申请记录
    saveApplication(application);
    // 跳转官网
    window.open(application.companyUrl, '_blank', 'noopener,noreferrer');
    // 关闭申请动作卡
    setSelectedCompany(null);
  };

  const handleJustLooking = () => {
    // 不记录，直接跳转
    if (selectedCompany) {
      window.open(selectedCompany.url, '_blank', 'noopener,noreferrer');
    }
    setSelectedCompany(null);
  };

  const handleCancel = () => {
    setSelectedCompany(null);
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
          直接访问各大邮轮公司官方招聘网站
        </p>
      </div>

      <div className="px-6 py-4">
        {/* 提示信息 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <Globe size={18} className="text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800 mb-1">使用说明</h3>
              <p className="text-blue-700 text-sm">
                点击下方邮轮公司卡片，选择岗位后前往官网申请。申请完成后请返回应用更新状态。
              </p>
            </div>
          </div>
        </div>

        {/* 邮轮公司列表 */}
        <div className="grid grid-cols-1 gap-4">
          {cruiseCompanies.map((company) => (
            <div key={company.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* 公司卡片 */}
              <button
                onClick={() => handleCompanyClick(company)}
                className="w-full p-5 flex items-center gap-4 hover:bg-gray-50 transition"
              >
                <div className={`w-12 h-12 ${company.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white font-bold text-sm">{company.logo}</span>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-gray-800 text-lg">{company.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{company.description}</p>
                  {/* 常见岗位提示 */}
                  {company.commonJobs && company.commonJobs.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {company.commonJobs.map((job) => (
                        <span key={job} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {job}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-blue-600">访问官网</span>
                  <ExternalLink size={18} className="text-blue-600" />
                </div>
              </button>
            </div>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>点击公司卡片选择岗位后前往官网</p>
          <p className="mt-1">所有链接均为官方招聘网站，安全可靠</p>
        </div>
      </div>

      {/* 申请动作卡 */}
      {selectedCompany && (
        <JobApplicationCard
          company={selectedCompany}
          onApply={handleApply}
          onCancel={handleCancel}
          onJustLooking={handleJustLooking}
        />
      )}
    </div>
  );
}
