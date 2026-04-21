import React from 'react';
import useResumeStore from '../../store/resumeStore';

export default function ResumePreview() {
  const { 
    personalInfo, 
    professionalSummary, 
    workExperience, 
    education, 
    skills, 
    certificates, 
    languages 
  } = useResumeStore();

  return (
    <div className="pb-24">
      <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <h3 className="text-base font-semibold mb-4">Resume Preview 简历预览</h3>
        
        {/* Resume Preview Card */}
        <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-white shadow-sm">
          {/* Personal Info */}
          <div className="flex items-center gap-4 mb-4">
            {personalInfo.photo && (
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={personalInfo.photo}
                  alt="Photo"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-bold mb-1">{personalInfo.name || 'Your Name'}</h2>
              <div className="text-sm text-gray-600 space-y-0.5">
                {personalInfo.phone && <p>📱 {personalInfo.phone}</p>}
                {personalInfo.email && <p>✉️ {personalInfo.email}</p>}
                {personalInfo.location && <p>📍 {personalInfo.location}</p>}
                {personalInfo.nationality && <p>🌍 {personalInfo.nationality}</p>}
              </div>
            </div>
          </div>

          {/* Professional Summary */}
          {professionalSummary && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2 border-b pb-1">Professional Summary</h3>
              <p className="text-sm text-gray-700">{professionalSummary}</p>
            </div>
          )}

          {/* Work Experience */}
          {workExperience.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2 border-b pb-1">Work Experience</h3>
              {workExperience.map((exp) => (
                <div key={exp.id} className="mb-3 last:mb-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-medium">{exp.jobTitle || 'Job Title'}</h4>
                    <span className="text-xs text-gray-500">
                      {exp.startDate || 'Start Date'} - {exp.current ? 'Present' : exp.endDate || 'End Date'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{exp.company || 'Company'}</p>
                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul className="text-xs text-gray-700 space-y-1 list-disc pl-4">
                      {exp.bullets.map((bullet, idx) => (
                        <li key={idx}>{bullet || 'Responsibility'}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {education.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2 border-b pb-1">Education</h3>
              {education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-start mb-2 last:mb-0">
                  <div>
                    <h4 className="text-sm font-medium">{edu.degree || 'Degree'}</h4>
                    <p className="text-xs text-gray-600">{edu.school || 'School'}</p>
                  </div>
                  <span className="text-xs text-gray-500">{edu.year || 'Year'}</span>
                </div>
              ))}
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2 border-b pb-1">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, idx) => (
                  <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {/* Certificates */}
          {certificates.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2 border-b pb-1">Certificates</h3>
              <ul className="text-xs text-gray-700 space-y-1 list-disc pl-4">
                {certificates.map((cert) => (
                  <li key={cert.id}>
                    {cert.name || 'Certificate'} - 
                    <span className="text-gray-500"> {cert.status === 'obtained' ? 'Obtained' : cert.status === 'in-progress' ? 'In Progress' : 'Planned'}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Languages */}
          {languages.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 border-b pb-1">Languages</h3>
              <ul className="text-xs text-gray-700 space-y-1 list-disc pl-4">
                {languages.map((lang) => (
                  <li key={lang.id}>
                    {lang.language || 'Language'} - {lang.level || 'Level'}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button className="flex-1 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium active:bg-blue-600">
            💾 保存简历
          </button>
          <button className="flex-1 py-2.5 bg-green-500 text-white rounded-lg text-sm font-medium active:bg-green-600">
            📄 导出 PDF
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
        <p className="text-sm text-amber-800 mb-2">
          💡 <strong>预览提示：</strong>
        </p>
        <ul className="text-xs text-amber-700 space-y-1 list-disc pl-4">
          <li>检查所有信息是否完整准确</li>
          <li>确保英文拼写和语法正确</li>
          <li>突出与邮轮行业相关的技能和经验</li>
          <li>保持简历简洁，控制在 1-2 页以内</li>
          <li>使用专业、正式的语言和格式</li>
        </ul>
      </div>
    </div>
  );
}