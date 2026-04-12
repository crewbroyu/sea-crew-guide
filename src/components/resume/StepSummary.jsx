import React, { useState } from 'react';
import useResumeStore from '../../store/resumeStore';

export default function StepSummary() {
  const { professionalSummary, setProfessionalSummary } = useResumeStore();

  const TEMPLATES = [
    {
      label: '🌱 零经验入门',
      text: 'Enthusiastic hospitality professional with strong communication skills and a passion for delivering exceptional guest experiences. Eager to contribute to a multicultural team in the cruise industry. Skilled in customer service, English communication, and adaptable to high-paced work environments.',
    },
    {
      label: '🏨 有酒店/服务业经验',
      text: 'Dedicated hospitality professional with X years of experience in hotel/restaurant service. Proven ability to deliver outstanding guest experiences in fast-paced environments. Skilled in customer relations, complaint resolution, and team collaboration. Seeking to transition expertise to the international cruise industry.',
    },
    {
      label: '🚢 有邮轮经验',
      text: 'Experienced cruise professional with X+ years onboard experience in luxury retail and guest service. Proven track record in guest satisfaction, sales performance, and multicultural team collaboration. Ready to bring expertise to a new cruise line and contribute to exceptional onboard experiences.',
    },
  ];

  return (
    <div className="pb-4">
      <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <h3 className="text-base font-semibold mb-3">Professional Summary 职业摘要</h3>
        <p className="text-sm text-gray-500 mb-4">
          2-3句话概括你的专业背景、核心技能和职业目标，突出与邮轮行业相关的经验。
        </p>

        <textarea
          value={professionalSummary}
          onChange={(e) => setProfessionalSummary(e.target.value)}
          placeholder="Write your professional summary here..."
          rows={5}
          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"
        />

        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">参考模板：</p>
          <div className="grid grid-cols-1 gap-3">
            {TEMPLATES.map((template, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <p className="text-xs font-medium text-gray-600 mb-1">{template.label}</p>
                <p className="text-xs text-gray-700">{template.text}</p>
                <button
                  onClick={() => setProfessionalSummary(template.text)}
                  className="mt-2 text-xs text-blue-600 hover:underline"
                >
                  使用此模板
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
        <p className="text-sm text-amber-800 mb-2">
          💡 <strong>写作技巧：</strong>
        </p>
        <ul className="text-xs text-amber-700 space-y-1 list-disc pl-4">
          <li>突出与邮轮行业相关的技能和经验</li>
          <li>使用关键词：customer service, hospitality, teamwork, communication</li>
          <li>量化你的成就（如：服务过 500+ 国际客人）</li>
          <li>保持简洁，控制在 3-4 行以内</li>
          <li>使用主动语态和动词开头</li>
        </ul>
      </div>
    </div>
  );
}