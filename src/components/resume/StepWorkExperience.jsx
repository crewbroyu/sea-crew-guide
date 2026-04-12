import React from 'react';
import useResumeStore from '../../store/resumeStore';

export default function StepWorkExperience() {
  const { 
    workExperience, 
    addWorkExperience, 
    updateWorkExp, 
    removeWorkExp, 
    addBullet, 
    updateBullet, 
    removeBullet 
  } = useResumeStore();

  return (
    <div className="pb-4">
      <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">Work Experience 工作经验</h3>
          <button
            onClick={addWorkExperience}
            className="text-sm text-blue-600 font-medium"
          >
            + 添加经历
          </button>
        </div>

        {workExperience.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="mb-2">暂无工作经验</p>
            <button
              onClick={addWorkExperience}
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium"
            >
              添加第一条经历
            </button>
          </div>
        ) : (
          workExperience.map((exp, expIdx) => (
            <div key={exp.id} className="mb-4 border border-gray-200 rounded-lg p-3 last:mb-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <input
                    value={exp.jobTitle}
                    onChange={(e) => updateWorkExp(exp.id, { jobTitle: e.target.value })}
                    placeholder="Job Title 职位"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm mb-2"
                  />
                  <input
                    value={exp.company}
                    onChange={(e) => updateWorkExp(exp.id, { company: e.target.value })}
                    placeholder="Company / Venue 公司/场所"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />
                </div>
                <button
                  onClick={() => removeWorkExp(exp.id)}
                  className="ml-3 text-red-400 hover:text-red-600 p-1"
                >
                  🗑️
                </button>
              </div>

              <div className="flex gap-2 mb-3">
                <input
                  type="date"
                  value={exp.startDate}
                  onChange={(e) => updateWorkExp(exp.id, { startDate: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                <input
                  type="date"
                  value={exp.endDate}
                  onChange={(e) => updateWorkExp(exp.id, { endDate: e.target.value, current: false })}
                  disabled={exp.current}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:bg-gray-50"
                />
              </div>

              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  checked={exp.current}
                  onChange={(e) => updateWorkExp(exp.id, { current: e.target.checked, endDate: e.target.checked ? '' : exp.endDate })}
                  className="mr-2"
                />
                <label className="text-sm text-gray-600">Current Position 目前在职</label>
              </div>

              <div className="mb-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Key Responsibilities 主要职责：</p>
                {exp.bullets.map((bullet, bulletIdx) => (
                  <div key={bulletIdx} className="flex items-start gap-2 mb-2">
                    <span className="text-gray-400 mt-1">•</span>
                    <input
                      value={bullet}
                      onChange={(e) => updateBullet(exp.id, bulletIdx, e.target.value)}
                      placeholder="Describe your responsibilities and achievements..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    />
                    {exp.bullets.length > 1 && (
                      <button
                        onClick={() => removeBullet(exp.id, bulletIdx)}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addBullet(exp.id)}
                  className="text-sm text-blue-600 font-medium"
                >
                  + 添加职责
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tips */}
      <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
        <p className="text-sm text-amber-800 mb-2">
          💡 <strong>填写提示：</strong>
        </p>
        <ul className="text-xs text-amber-700 space-y-1 list-disc pl-4">
          <li>按时间倒序排列（最近的工作在前）</li>
          <li>突出与邮轮/酒店/服务行业相关的经验</li>
          <li>使用STAR法则：情境(Situation)、任务(Task)、行动(Action)、结果(Result)</li>
          <li>量化成就（如：提高客户满意度 15%）</li>
          <li>使用关键词：customer service, hospitality, teamwork, problem-solving</li>
        </ul>
      </div>
    </div>
  );
}