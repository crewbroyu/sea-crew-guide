// src/pages/MyApplications.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Search, Briefcase, Calendar, Globe, FileText, X, CheckCircle, AlertCircle, XCircle, Mail } from 'lucide-react';

// 邮轮公司列表（用于下拉选择）
const cruiseCompanies = [
  'Royal Caribbean', 'MSC Cruises', 'Carnival Cruise Line',
  'Norwegian Cruise Line', 'Celebrity Cruises', 'Disney Cruise Line',
  'Princess Cruises', 'Viking Cruises'
];

// 投递渠道选项
const channels = ['官网', '招聘平台', '代理', '宇哥内推', '其他'];

// 申请状态
const statuses = [
  { id: 'submitted', name: '已投递', color: 'bg-blue-100 text-blue-700' },
  { id: 'replied', name: '已回复', color: 'bg-amber-100 text-amber-700' },
  { id: 'interview', name: '面试中', color: 'bg-purple-100 text-purple-700' },
  { id: 'approved', name: '已通过', color: 'bg-green-100 text-green-700' },
  { id: 'rejected', name: '未通过', color: 'bg-gray-100 text-gray-700' }
];

export default function MyApplications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([
    {
      id: 1, company: 'Royal Caribbean', position: 'Bar Server', date: '2025-04-01', channel: '官网', status: 'interview', notes: '视频面试已预约'
    },
    {
      id: 2, company: 'MSC Cruises', position: 'Restaurant Server', date: '2025-03-28', channel: '招聘平台', status: 'submitted', notes: ''
    },
    {
      id: 3, company: 'Disney Cruise Line', position: 'Retail Associate', date: '2025-03-25', channel: '宇哥内推', status: 'approved', notes: 'Offer已收到！'
    }
  ]);
  
  const [showModal, setShowModal] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    date: new Date().toISOString().split('T')[0],
    channel: '官网',
    notes: ''
  });

  // 统计数据
  const stats = {
    submitted: applications.filter(a => a.status === 'submitted').length,
    replied: applications.filter(a => a.status === 'replied').length,
    interview: applications.filter(a => a.status === 'interview').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length
  };

  // 打开添加弹窗
  const handleOpenModal = () => {
    setFormData({
      company: '',
      position: '',
      date: new Date().toISOString().split('T')[0],
      channel: '官网',
      notes: ''
    });
    setShowModal(true);
  };

  // 提交添加申请
  const handleAddApplication = () => {
    if (!formData.company || !formData.position) return;
    const newApp = {
      id: Date.now(),
      ...formData,
      status: 'submitted'
    };
    setApplications([newApp, ...applications]);
    setShowModal(false);
  };

  // 更改状态
  const handleChangeStatus = (id, newStatus) => {
    setApplications(applications.map(app => 
      app.id === id ? { ...app, status: newStatus } : app
    ));
    setShowStatusMenu(null);
  };

  // 获取状态信息
  const getStatusInfo = (statusId) => {
    return statuses.find(s => s.id === statusId) || statuses[0];
  };

  // 获取状态图标
  const getStatusIcon = (statusId) => {
    switch (statusId) {
      case 'approved': return <CheckCircle size={16} />;
      case 'rejected': return <XCircle size={16} />;
      case 'interview': return <AlertCircle size={16} />;
      default: return <Mail size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 pt-16 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/jobs')}
              className="text-white hover:text-purple-200"
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-white text-2xl font-bold">我的申请</h1>
          </div>
          <button
            onClick={handleOpenModal}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30"
          >
            <Plus size={20} />
          </button>
        </div>
        <p className="text-white/80 text-sm mt-2">
          跟踪投递进度，管理申请记录
        </p>
      </div>

      <div className="px-6 py-4">
        {/* 顶部统计 */}
        <div className="flex overflow-x-auto gap-3 pb-3">
          <div className="flex-shrink-0 bg-white rounded-xl shadow-sm p-3 min-w-[80px]">
            <div className="text-lg font-bold text-blue-600">{stats.submitted}</div>
            <div className="text-xs text-gray-500">已投递</div>
          </div>
          <div className="flex-shrink-0 bg-white rounded-xl shadow-sm p-3 min-w-[80px]">
            <div className="text-lg font-bold text-amber-600">{stats.replied}</div>
            <div className="text-xs text-gray-500">已回复</div>
          </div>
          <div className="flex-shrink-0 bg-white rounded-xl shadow-sm p-3 min-w-[80px]">
            <div className="text-lg font-bold text-purple-600">{stats.interview}</div>
            <div className="text-xs text-gray-500">面试中</div>
          </div>
          <div className="flex-shrink-0 bg-white rounded-xl shadow-sm p-3 min-w-[80px]">
            <div className="text-lg font-bold text-green-600">{stats.approved}</div>
            <div className="text-xs text-gray-500">已通过</div>
          </div>
        </div>

        {/* 提示 */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <p className="text-amber-700 text-xs">
            提示：数据仅存储在本地，刷新页面会丢失。建议截图保存重要信息。
          </p>
        </div>

        {/* 申请列表 */}
        {applications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Briefcase size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-2">还没有申请记录</h3>
            <p className="text-gray-500 mb-4">去招聘渠道看看有没有心仪的岗位吧</p>
            <button
              onClick={() => navigate('/jobs/channels')}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
            >
              去招聘渠道
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => {
              const statusInfo = getStatusInfo(app.status);
              return (
                <div key={app.id} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-800">{app.position}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1 ${statusInfo.color}`}>
                          {getStatusIcon(app.status)}
                          {statusInfo.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <div className="flex items-center gap-1">
                          <Briefcase size={14} />
                          {app.company}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          {app.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <Globe size={14} />
                          {app.channel}
                        </div>
                      </div>
                      {app.notes && (
                        <p className="text-gray-600 text-xs">{app.notes}</p>
                      )}
                    </div>
                    
                    {/* 状态选择菜单 */}
                    <div className="relative">
                      <button
                        onClick={() => setShowStatusMenu(showStatusMenu === app.id ? null : app.id)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <FileText size={16} />
                      </button>
                      {showStatusMenu === app.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10 min-w-[120px]">
                          {statuses.map((status) => (
                            <button
                              key={status.id}
                              onClick={() => handleChangeStatus(app.id, status.id)}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                            >
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${status.color}`}>
                                {status.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 添加申请弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">添加申请记录</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮轮公司</label>
                <select
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">请选择公司</option>
                  {cruiseCompanies.map((company) => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">申请岗位</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="例如：Bar Server"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">投递日期</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">投递渠道</label>
                <select
                  value={formData.channel}
                  onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {channels.map((channel) => (
                    <option key={channel} value={channel}>{channel}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注（可选）</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="添加备注..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                  rows={3}
                />
              </div>
            </div>
            
            <button
              onClick={handleAddApplication}
              disabled={!formData.company || !formData.position}
              className={`w-full py-3 rounded-lg font-medium mt-6 ${
                formData.company && formData.position
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              添加记录
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
