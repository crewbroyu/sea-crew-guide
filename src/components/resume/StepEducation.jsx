import React from 'react';
import useResumeStore from '../../store/resumeStore';

export default function StepEducation() {
  const { education, addEducation, updateEducation, removeEducation } = useResumeStore();

  return (
    <div className="pb-24">
      <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">Education 教育背景</h3>
          <button
            onClick={addEducation}
            className="text-sm text-blue-600 font-medium"
          >
            + 添加教育
          </button>
        </div>

        {education.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="mb-2">暂无教育背景</p>
            <button
              onClick={addEducation}
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium"
            >
              添加第一条教育
            </button>
          </div>
        ) : (
          education.map((edu, idx) => (
            <div key={edu.id} className="flex items-start gap-3 mb-3 last:mb-0">
              <div className="flex-1">
                <input
                  value={edu.degree}
                  onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                  placeholder="Degree / Qualification 学位/证书"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm mb-2"
                />
                <input
                  value={edu.school}
                  onChange={(e) => updateEducation(edu.id, { school: e.target.value })}
                  placeholder="School / Institution 学校/机构"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm mb-2"
                />
                <input
                  value={edu.year}
                  onChange={(e) => updateEducation(edu.id, { year: e.target.value })}
                  placeholder="Year / Period 年份/期间"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                />
              </div>
              <button
                onClick={() => removeEducation(edu.id)}
                className="text-red-400 hover:text-red-600 p-1"
              >
                🗑️
              </button>
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
          <li>按时间倒序排列（最近的教育在前）</li>
          <li>包括学历、专业培训、职业证书等</li>
          <li>突出与邮轮行业相关的教育背景</li>
          <li>如果有英语相关证书（如雅思、托福），请在此处填写</li>
          <li>如果学历不高，可以突出相关的职业培训和技能证书</li>
        </ul>
      </div>
    </div>
  );
}