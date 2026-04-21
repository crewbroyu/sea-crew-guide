// src/components/JobApplicationCard.jsx
import { useState } from 'react';
import { X, ExternalLink, CheckCircle } from 'lucide-react';

export default function JobApplicationCard({
  company,
  onApply,
  onCancel,
  onJustLooking
}) {
  const [selectedJob, setSelectedJob] = useState('');
  const [customJob, setCustomJob] = useState('');
  const [notes, setNotes] = useState('');
  const [showCustomJob, setShowCustomJob] = useState(false);

  const commonJobs = [
    'Bar Server',
    'Retail',
    'Guest Service',
    'Housekeeping',
    'Restaurant Server',
    'Entertainment',
    'Spa Therapist',
    '其他（自填）'
  ];

  const handleJobChange = (job) => {
    setSelectedJob(job);
    setShowCustomJob(job === '其他（自填）');
    setCustomJob('');
  };

  const handleApply = () => {
    const jobTitle = showCustomJob ? customJob : selectedJob;
    if (!jobTitle) {
      alert('请选择或填写岗位');
      return;
    }
    
    onApply({
      companyName: company.name,
      jobTitle,
      notes,
      companyUrl: company.url
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900">申请 {company.name}</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-5 space-y-4">
          {/* 岗位选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择岗位
            </label>
            <select
              value={selectedJob}
              onChange={(e) => handleJobChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">请选择岗位</option>
              {commonJobs.map((job) => (
                <option key={job} value={job}>
                  {job}
                </option>
              ))}
            </select>
          </div>

          {/* 自定义岗位 */}
          {showCustomJob && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                请填写岗位名称
              </label>
              <input
                type="text"
                value={customJob}
                onChange={(e) => setCustomJob(e.target.value)}
                placeholder="例如：Assistant Waiter"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* 备注 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              备注（可选）
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="例如：看到哪个具体岗位，或其他信息"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 提示信息 */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <CheckCircle size={16} className="text-amber-600 mt-0.5" />
              <p className="text-sm text-amber-700">
                申请完成后请返回应用点击「我已申请」，否则不会记录进度
              </p>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="p-5 border-t space-y-3">
          <button
            onClick={handleApply}
            className="w-full px-6 py-3 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <ExternalLink size={18} />
            去官网申请
          </button>
          <button
            onClick={onJustLooking}
            className="w-full px-6 py-3 rounded-lg font-medium transition-colors bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            我只是看看
          </button>
        </div>
      </div>
    </div>
  );
}