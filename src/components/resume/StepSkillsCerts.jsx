import React, { useState } from 'react';
import useResumeStore from '../../store/resumeStore';

export default function StepSkillsCerts() {
  const { 
    skills, 
    certificates, 
    languages, 
    addSkill, 
    removeSkill, 
    addCertificate, 
    updateCertificate, 
    removeCertificate, 
    addLanguage, 
    updateLanguage, 
    removeLanguage 
  } = useResumeStore();

  const [skillInput, setSkillInput] = useState('');
  const [certInput, setCertInput] = useState('');

  const handleAddSkill = () => {
    if (skillInput.trim()) {
      addSkill(skillInput.trim());
      setSkillInput('');
    }
  };

  const handleAddCert = () => {
    if (certInput.trim()) {
      addCertificate(certInput.trim());
      setCertInput('');
    }
  };

  return (
    <div className="pb-4">
      <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        {/* Skills */}
        <div className="mb-6">
          <h3 className="text-base font-semibold mb-3">Skills 技能</h3>
          <div className="flex gap-2 mb-3">
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
              placeholder="Add a skill..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
            <button
              onClick={handleAddSkill}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
            >
              添加
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, idx) => (
              <div key={idx} className="flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-full text-blue-700 text-sm">
                <span>{skill}</span>
                <button
                  onClick={() => removeSkill(idx)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Certificates */}
        <div className="mb-6">
          <h3 className="text-base font-semibold mb-3">Certificates 证书</h3>
          <div className="flex gap-2 mb-3">
            <input
              value={certInput}
              onChange={(e) => setCertInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCert()}
              placeholder="Add a certificate..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
            <button
              onClick={handleAddCert}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
            >
              添加
            </button>
          </div>
          {certificates.map((cert) => (
            <div key={cert.id} className="flex items-center justify-between mb-2 p-3 border border-gray-200 rounded-lg">
              <input
                value={cert.name}
                onChange={(e) => updateCertificate(cert.id, { name: e.target.value })}
                className="flex-1 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
              <select
                value={cert.status}
                onChange={(e) => updateCertificate(cert.id, { status: e.target.value })}
                className="ml-2 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              >
                <option value="obtained">已获得</option>
                <option value="in-progress">进行中</option>
                <option value="planned">计划中</option>
              </select>
              <button
                onClick={() => removeCertificate(cert.id)}
                className="ml-2 text-red-400 hover:text-red-600 p-1"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>

        {/* Languages */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold">Languages 语言</h3>
            <button
              onClick={addLanguage}
              className="text-sm text-blue-600 font-medium"
            >
              + 添加语言
            </button>
          </div>
          {languages.map((lang) => (
            <div key={lang.id} className="flex items-center gap-2 mb-2">
              <input
                value={lang.language}
                onChange={(e) => updateLanguage(lang.id, { language: e.target.value })}
                placeholder="Language 语言"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
              <select
                value={lang.level}
                onChange={(e) => updateLanguage(lang.id, { level: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              >
                <option value="">Level 水平</option>
                <option value="Native">母语</option>
                <option value="Fluent">流利</option>
                <option value="Conversational">会话</option>
                <option value="Basic">基础</option>
              </select>
              <button
                onClick={() => removeLanguage(lang.id)}
                className="text-red-400 hover:text-red-600 p-1"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
        <p className="text-sm text-amber-800 mb-2">
          💡 <strong>填写提示：</strong>
        </p>
        <ul className="text-xs text-amber-700 space-y-1 list-disc pl-4">
          <li>技能：突出与服务行业相关的技能，如 customer service, communication, teamwork</li>
          <li>证书：包括海员证、健康证、英语证书等邮轮行业相关证书</li>
          <li>语言：英语水平是邮轮招聘的重要因素，请如实填写</li>
          <li>技能和证书按相关性排序，最重要的放在前面</li>
          <li>使用关键词，让ATS系统容易识别</li>
        </ul>
      </div>
    </div>
  );
}