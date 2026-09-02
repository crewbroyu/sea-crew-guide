import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useResumeStore from '../store/resumeStore'
import { ChevronLeft, Download, Save, Eye, AlertCircle } from 'lucide-react'

export default function Resume() {
  const navigate = useNavigate()
  const { 
    personalInfo, 
    professionalSummary, 
    workExperience, 
    education, 
    skills, 
    certificates, 
    languages 
  } = useResumeStore()
  
  const [isLoading, setIsLoading] = useState(false)
  const hasResume = Boolean(
    personalInfo.name ||
    professionalSummary ||
    workExperience.length > 0 ||
    education.length > 0
  )

  const handleExportPDF = () => {
    setIsLoading(true)
    // 模拟PDF导出
    setTimeout(() => {
      alert('PDF导出功能将在后续版本中实现')
      setIsLoading(false)
    }, 1000)
  }

  const handleEditResume = () => {
    navigate('/tasks/phase2/Task4')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部头部 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 pt-16 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/profile')}
            className="text-white hover:text-blue-200"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-white text-2xl font-bold">个人简历</h1>
        </div>
        <p className="text-white/80 text-sm mt-2">
          查看和管理您的邮轮行业简历
        </p>
      </div>

      <div className="px-6 py-6">
        {/* 无简历提示 */}
        {!hasResume && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Eye size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-2">暂无简历</h3>
            <p className="text-gray-500 mb-6">您还没有创建简历</p>
            <button
              onClick={handleEditResume}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              去创建简历
            </button>
          </div>
        )}

        {/* 简历预览 */}
        {hasResume && (
          <div className="space-y-6">
            {/* 简历卡片 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">简历预览</h2>
              
              {/* Resume Preview Card */}
              <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-white shadow-sm">
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
                    <h3 className="text-lg font-bold mb-1">{personalInfo.name || 'Your Name'}</h3>
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
                    <h4 className="text-sm font-semibold mb-2 border-b pb-1">Professional Summary</h4>
                    <p className="text-sm text-gray-700">{professionalSummary}</p>
                  </div>
                )}

                {/* Work Experience */}
                {workExperience.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold mb-2 border-b pb-1">Work Experience</h4>
                    {workExperience.map((exp) => (
                      <div key={exp.id} className="mb-3 last:mb-0">
                        <div className="flex justify-between items-start mb-1">
                          <h5 className="text-sm font-medium">{exp.jobTitle || 'Job Title'}</h5>
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
                    <h4 className="text-sm font-semibold mb-2 border-b pb-1">Education</h4>
                    {education.map((edu) => (
                      <div key={edu.id} className="flex justify-between items-start mb-2 last:mb-0">
                        <div>
                          <h5 className="text-sm font-medium">{edu.degree || 'Degree'}</h5>
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
                    <h4 className="text-sm font-semibold mb-2 border-b pb-1">Skills</h4>
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
                    <h4 className="text-sm font-semibold mb-2 border-b pb-1">Certificates</h4>
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
                    <h4 className="text-sm font-semibold mb-2 border-b pb-1">Languages</h4>
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
                <button
                  onClick={handleEditResume}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  编辑简历
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  {isLoading ? '导出中...' : '导出 PDF'}
                </button>
              </div>
            </div>

            {/* 提示信息 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle size={18} className="text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-800 mb-1">简历提示</h3>
                  <p className="text-sm text-amber-700">
                    您的简历是通过任务4-制作英文简历生成的。如果需要更新简历，请点击"编辑简历"按钮返回任务4进行修改。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
