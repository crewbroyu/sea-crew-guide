// src/pages/MyApplications.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Briefcase, Clock, CheckCircle, AlertCircle, Calendar, Edit, Upload, Trash2 } from 'lucide-react';

// 申请状态选项
const statusOptions = [
  '未完成',
  '已申请',
  '等待回复',
  '面试中',
  'Offer',
  '拒信'
];

// 获取申请记录从本地存储
const getApplications = () => {
  return JSON.parse(localStorage.getItem('job_applications') || '[]');
};

// 保存申请记录到本地存储
const saveApplications = (applications) => {
  localStorage.setItem('job_applications', JSON.stringify(applications));
};

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function MyApplications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [editingApplication, setEditingApplication] = useState(null);
  const [editForm, setEditForm] = useState({});

  // 加载申请记录
  useEffect(() => {
    const apps = getApplications();
    setApplications(apps);

    // 检查未完成的申请，添加提醒
    const incompleteApps = apps.filter(app => app.status === '未完成');
    if (incompleteApps.length > 0) {
      // 简单的提醒机制（实际项目中可以使用更复杂的通知系统）
      setTimeout(() => {
        if (window.confirm('你有未完成的申请，是否现在去更新状态？')) {
          // 可以跳转到具体的申请详情
        }
      }, 3000);
    }
  }, []);

  // 计算申请统计
  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === '等待回复').length,
    offers: applications.filter(app => app.status === 'Offer').length
  };

  // 处理状态变更
  const handleStatusChange = (id, newStatus) => {
    const updatedApplications = applications.map(app => {
      if (app.id === id) {
        return {
          ...app,
          status: newStatus,
          updatedAt: new Date().toISOString()
        };
      }
      return app;
    });
    setApplications(updatedApplications);
    saveApplications(updatedApplications);
  };

  // 开始编辑
  const handleEdit = (application) => {
    setEditingApplication(application.id);
    setEditForm({
      notes: application.notes || ''
    });
  };

  // 保存编辑
  const handleSaveEdit = (id) => {
    const updatedApplications = applications.map(app => {
      if (app.id === id) {
        return {
          ...app,
          notes: editForm.notes,
          updatedAt: new Date().toISOString()
        };
      }
      return app;
    });
    setApplications(updatedApplications);
    saveApplications(updatedApplications);
    setEditingApplication(null);
  };

  // 删除申请记录
  const handleDelete = (id) => {
    if (window.confirm('确定要删除这条申请记录吗？')) {
      const updatedApplications = applications.filter(app => app.id !== id);
      setApplications(updatedApplications);
      saveApplications(updatedApplications);
    }
  };

  // 上传截图（模拟）
  const handleUploadScreenshot = (id) => {
    alert('功能开发中：请上传申请成功页面或邮件确认的截图');
    // 实际项目中这里会实现文件上传功能
  };

  // 标记为已申请
  const handleMarkAsApplied = (id) => {
    handleStatusChange(id, '已申请');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部头部 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 pt-16 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/jobs')}
            className="text-white hover:text-blue-200"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-white text-2xl font-bold">我的申请</h1>
        </div>
        <p className="text-white/80 text-sm mt-2">
          管理和跟踪你的海乘申请进度
        </p>
      </div>

      <div className="px-6 py-4">
        {/* 申请统计 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">{stats.total}</div>
            <div className="text-sm text-gray-600">总申请数</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-amber-600 mb-1">{stats.pending}</div>
            <div className="text-sm text-gray-600">等待回复</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">{stats.offers}</div>
            <div className="text-sm text-gray-600">Offer数</div>
          </div>
        </div>

        {/* 申请列表 */}
        {applications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Briefcase size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-2">暂无申请记录</h3>
            <p className="text-gray-500 mb-4">
              去「招聘渠道」浏览邮轮公司官网并申请职位
            </p>
            <button
              onClick={() => navigate('/jobs/channels')}
              className="px-6 py-3 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
            >
              浏览招聘渠道
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div key={application.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* 申请基本信息 */}
                <div className="p-5 border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{application.companyName}</h3>
                      <p className="text-gray-600 mt-1">{application.jobTitle}</p>
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                        <Calendar size={14} />
                        <span>更新于：{formatDate(application.updatedAt)}</span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      application.status === '未完成' ? 'bg-gray-100 text-gray-800' :
                      application.status === '已申请' ? 'bg-blue-100 text-blue-800' :
                      application.status === '等待回复' ? 'bg-amber-100 text-amber-800' :
                      application.status === '面试中' ? 'bg-purple-100 text-purple-800' :
                      application.status === 'Offer' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {application.status}
                    </div>
                  </div>
                </div>

                {/* 状态管理和操作 */}
                <div className="p-5">
                  {/* 状态选择 */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      状态更新
                    </label>
                    <select
                      value={application.status}
                      onChange={(e) => handleStatusChange(application.id, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 备注 */}
                  {editingApplication === application.id ? (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        备注
                      </label>
                      <textarea
                        value={editForm.notes}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        placeholder="面试时间、HR信息等"
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleSaveEdit(application.id)}
                          className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingApplication(null)}
                          className="px-4 py-2 rounded-lg font-medium bg-gray-200 text-gray-800 hover:bg-gray-300"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          备注
                        </label>
                        <button
                          onClick={() => handleEdit(application)}
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Edit size={14} />
                          编辑
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {application.notes || '暂无备注'}
                      </p>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex flex-wrap gap-2">
                    {application.status === '未完成' && (
                      <button
                        onClick={() => handleMarkAsApplied(application.id)}
                        className="flex-1 px-4 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-1"
                      >
                        <CheckCircle size={16} />
                        我已申请
                      </button>
                    )}
                    <button
                      onClick={() => handleUploadScreenshot(application.id)}
                      className="flex-1 px-4 py-2 rounded-lg font-medium bg-purple-600 text-white hover:bg-purple-700 flex items-center justify-center gap-1"
                    >
                      <Upload size={16} />
                      上传截图
                    </button>
                    <button
                      onClick={() => handleDelete(application.id)}
                      className="px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 flex items-center justify-center gap-1"
                    >
                      <Trash2 size={16} />
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 底部提示 */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>点击状态下拉菜单更新申请进度</p>
          <p className="mt-1">申请完成后请及时更新状态，以便更好地管理</p>
        </div>
      </div>
    </div>
  );
}