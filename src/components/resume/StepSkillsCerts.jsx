import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import useResumeStore from '../../store/resumeStore';
import { getResumeGuidance } from '../../data/resumeGuidance';

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
  const guidance = getResumeGuidance();

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
    <div className="pb-24">
      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-medium text-blue-700">Skills</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">技能要服务于目标岗位</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {guidance.label} 建议优先出现这些关键词，后续 AI 简历优化也会用它们判断匹配度。
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {guidance.keywords.map((keyword) => (
              <button
                key={keyword}
                type="button"
                onClick={() => {
                  if (!skills.includes(keyword)) addSkill(keyword);
                }}
                className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
              >
                {keyword}
              </button>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
              placeholder="Add a skill..."
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
            >
              添加
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {skills.map((skill, idx) => (
              <div key={idx} className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700">
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => removeSkill(idx)}
                  className="text-slate-400 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="mb-3 text-base font-semibold text-slate-950">Certificates 证书</h3>
          <div className="flex gap-2 mb-3">
            <input
              value={certInput}
              onChange={(e) => setCertInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCert()}
              placeholder="Add a certificate..."
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={handleAddCert}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
            >
              添加
            </button>
          </div>
          {certificates.map((cert) => (
            <div key={cert.id} className="mb-2 flex items-center justify-between rounded-lg border border-slate-200 p-3">
              <input
                value={cert.name}
                onChange={(e) => updateCertificate(cert.id, { name: e.target.value })}
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <select
                value={cert.status}
                onChange={(e) => updateCertificate(cert.id, { status: e.target.value })}
                className="ml-2 rounded-lg border border-slate-300 px-3 py-1 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="obtained">已获得</option>
                <option value="in-progress">进行中</option>
                <option value="planned">计划中</option>
              </select>
              <button
                type="button"
                onClick={() => removeCertificate(cert.id)}
                className="ml-2 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label="删除证书"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-950">Languages 语言</h3>
            <button
              type="button"
              onClick={addLanguage}
              className="text-sm font-medium text-blue-700"
            >
              添加语言
            </button>
          </div>
          {languages.map((lang) => (
            <div key={lang.id} className="mb-2 flex items-center gap-2">
              <input
                value={lang.language}
                onChange={(e) => updateLanguage(lang.id, { language: e.target.value })}
                placeholder="Language 语言"
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <select
                value={lang.level}
                onChange={(e) => updateLanguage(lang.id, { level: e.target.value })}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Level 水平</option>
                <option value="Native">母语</option>
                <option value="Fluent">流利</option>
                <option value="Conversational">会话</option>
                <option value="Basic">基础</option>
              </select>
              <button
                type="button"
                onClick={() => removeLanguage(lang.id)}
                className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label="删除语言"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-950">填写标准</p>
        <p className="mt-2 text-sm leading-6 text-amber-900">
          技能不要堆太多，优先保留能证明目标岗位匹配度的词。证书状态可以写 planned 或 in progress，方便后续判断证件准备进度。
        </p>
      </div>
    </div>
  );
}
