import { CheckCircle2, Clipboard, XCircle } from 'lucide-react';
import useResumeStore from '../../store/resumeStore';
import { getResumeGuidance } from '../../data/resumeGuidance';

const hasText = (value) => Boolean(value?.trim?.());

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
  const guidance = getResumeGuidance();
  const allBullets = workExperience.flatMap((exp) => exp.bullets || []);
  const resumeText = [
    personalInfo.name,
    personalInfo.phone,
    personalInfo.email,
    personalInfo.location,
    personalInfo.nationality,
    professionalSummary,
    ...workExperience.flatMap((exp) => [exp.jobTitle, exp.company, ...(exp.bullets || [])]),
    ...education.flatMap((edu) => [edu.degree, edu.school, edu.year]),
    ...skills,
    ...certificates.map((cert) => `${cert.name} ${cert.status}`),
    ...languages.map((lang) => `${lang.language} ${lang.level}`),
  ].filter(Boolean).join('\n');
  const keywordCount = guidance.keywords.filter((keyword) =>
    resumeText.toLowerCase().includes(keyword.toLowerCase())
  ).length;
  const qualityChecks = [
    {
      label: '基础联系方式完整',
      passed: hasText(personalInfo.name) && hasText(personalInfo.phone) && hasText(personalInfo.email),
    },
    {
      label: '职业摘要已经填写',
      passed: professionalSummary.trim().length >= 80,
    },
    {
      label: '至少有一段可迁移经历',
      passed: workExperience.some((exp) => hasText(exp.jobTitle) && hasText(exp.company)),
    },
    {
      label: '经历里有具体职责或成果',
      passed: allBullets.filter((bullet) => bullet.trim().length >= 25).length >= 2,
    },
    {
      label: `包含 ${guidance.label} 相关关键词`,
      passed: keywordCount >= 2,
    },
    {
      label: '填写了语言或证书信息',
      passed: languages.length > 0 || certificates.length > 0,
    },
  ];
  const passedCount = qualityChecks.filter((item) => item.passed).length;
  const handleCopyResume = async () => {
    try {
      await navigator.clipboard.writeText(resumeText);
      alert('英文简历内容已复制');
    } catch {
      alert('复制失败，可以手动选择预览内容复制');
    }
  };

  return (
    <div className="pb-24">
      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-blue-700">Resume Review</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">简历质量检查</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              先确认这份简历能支撑 {guidance.label} 投递，再进入后续优化。
            </p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
            {passedCount}/{qualityChecks.length}
          </span>
        </div>

        <div className="mb-5 grid gap-2">
          {qualityChecks.map((check) => (
            <div key={check.label} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
              {check.passed ? (
                <CheckCircle2 size={17} className="text-emerald-600" />
              ) : (
                <XCircle size={17} className="text-amber-600" />
              )}
              <span className={check.passed ? 'text-slate-700' : 'text-amber-800'}>{check.label}</span>
            </div>
          ))}
        </div>
        
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-4 flex items-center gap-4">
            {personalInfo.photo && (
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
                <img
                  src={personalInfo.photo}
                  alt="Photo"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <h2 className="mb-1 text-lg font-bold text-slate-950">{personalInfo.name || 'Your Name'}</h2>
              <div className="space-y-0.5 text-sm text-slate-600">
                {personalInfo.phone && <p>{personalInfo.phone}</p>}
                {personalInfo.email && <p>{personalInfo.email}</p>}
                {personalInfo.location && <p>{personalInfo.location}</p>}
                {personalInfo.nationality && <p>{personalInfo.nationality}</p>}
              </div>
            </div>
          </div>

          {professionalSummary && (
            <div className="mb-4">
              <h3 className="mb-2 border-b pb-1 text-sm font-semibold text-slate-950">Professional Summary</h3>
              <p className="text-sm leading-6 text-slate-700">{professionalSummary}</p>
            </div>
          )}

          {workExperience.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 border-b pb-1 text-sm font-semibold text-slate-950">Work Experience</h3>
              {workExperience.map((exp) => (
                <div key={exp.id} className="mb-3 last:mb-0">
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <h4 className="text-sm font-medium">{exp.jobTitle || 'Job Title'}</h4>
                    <span className="text-right text-xs text-slate-500">
                      {exp.startDate || 'Start Date'} - {exp.current ? 'Present' : exp.endDate || 'End Date'}
                    </span>
                  </div>
                  <p className="mb-1 text-xs text-slate-600">{exp.company || 'Company'}</p>
                  {exp.bullets && exp.bullets.length > 0 && (
                    <ul className="list-disc space-y-1 pl-4 text-xs leading-5 text-slate-700">
                      {exp.bullets.map((bullet, idx) => (
                        <li key={idx}>{bullet || 'Responsibility'}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {education.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 border-b pb-1 text-sm font-semibold text-slate-950">Education</h3>
              {education.map((edu) => (
                <div key={edu.id} className="mb-2 flex items-start justify-between gap-3 last:mb-0">
                  <div>
                    <h4 className="text-sm font-medium">{edu.degree || 'Degree'}</h4>
                    <p className="text-xs text-slate-600">{edu.school || 'School'}</p>
                  </div>
                  <span className="text-xs text-slate-500">{edu.year || 'Year'}</span>
                </div>
              ))}
            </div>
          )}

          {skills.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 border-b pb-1 text-sm font-semibold text-slate-950">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, idx) => (
                  <span key={idx} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {certificates.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 border-b pb-1 text-sm font-semibold text-slate-950">Certificates</h3>
              <ul className="list-disc space-y-1 pl-4 text-xs text-slate-700">
                {certificates.map((cert) => (
                  <li key={cert.id}>
                    {cert.name || 'Certificate'} - 
                    <span className="text-slate-500"> {cert.status === 'obtained' ? 'Obtained' : cert.status === 'in-progress' ? 'In Progress' : 'Planned'}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Languages */}
          {languages.length > 0 && (
            <div>
              <h3 className="mb-2 border-b pb-1 text-sm font-semibold text-slate-950">Languages</h3>
              <ul className="list-disc space-y-1 pl-4 text-xs text-slate-700">
                {languages.map((lang) => (
                  <li key={lang.id}>
                    {lang.language || 'Language'} - {lang.level || 'Level'}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleCopyResume}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Clipboard size={17} />
            复制英文内容
          </button>
          <p className="text-center text-xs leading-5 text-slate-500">
            确认内容后，点击页面底部“完成并保存简历”同步到申请进度中心。
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-950">下一步建议</p>
        <p className="mt-2 text-sm leading-6 text-amber-900">
          如果质量检查少于 4 项通过，先回到前几步补齐。通过 4 项以上后，再保存到申请进度中心，后续可进入 AI 简历优化或面试准备。
        </p>
      </div>
    </div>
  );
}
