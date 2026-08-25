import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, FileText } from 'lucide-react';
import useResumeStore from '../../../store/resumeStore';
import StepPersonalInfo from '../../../components/resume/StepPersonalInfo';
import StepSummary from '../../../components/resume/StepSummary';
import StepWorkExperience from '../../../components/resume/StepWorkExperience';
import StepEducation from '../../../components/resume/StepEducation';
import StepSkillsCerts from '../../../components/resume/StepSkillsCerts';
import ResumePreview from '../../../components/resume/ResumePreview';
import { syncLocalPathProfile } from '../../../services/userPathService';
import { upsertMyResumeProfile } from '../../../services/resumeProfileService';
import { getResumeGuidance, getTargetPositionFromTask2 } from '../../../data/resumeGuidance';

const STEPS = [
  { num: 1, title: '个人信息' },
  { num: 2, title: '职业摘要' },
  { num: 3, title: '工作经验' },
  { num: 4, title: '教育背景' },
  { num: 5, title: '技能证书' },
  { num: 6, title: '质量检查' },
];

export default function Task4ResumeBuilder() {
  const navigate = useNavigate();
  const {
    currentStep,
    nextStep,
    prevStep,
    setStep,
    personalInfo,
    professionalSummary,
    workExperience,
    education,
    skills,
    certificates,
    languages,
  } = useResumeStore();
  const targetPosition = getTargetPositionFromTask2();
  const guidance = getResumeGuidance(targetPosition);

  const handleComplete = async () => {
    const completedAt = new Date().toISOString();
    const resumeResult = {
      taskId: 4,
      completedAt,
      personalInfo,
      professionalSummary,
      workExperience,
      education,
      skills,
      certificates,
      languages,
      resume_status: 'draft_ready',
    };
    localStorage.setItem('task4_result', JSON.stringify(resumeResult));

    const progressKey = 'boarding_progress';
    const boardingProgress = JSON.parse(localStorage.getItem(progressKey) || '{}');
    boardingProgress.task4 = {
      completed: true,
      completedAt,
    };
    localStorage.setItem(progressKey, JSON.stringify(boardingProgress));

    try {
      await upsertMyResumeProfile({
        personalInfo,
        professionalSummary,
        workExperience,
        education,
        skills,
        certificates,
        languages,
      });
    } catch (error) {
      console.error('同步简历资料失败:', error);
    }

    await syncLocalPathProfile({
      resume_status: 'draft_ready',
      application_stage: 'resume',
      career_stage: 'resume_preparation',
      last_completed_task_id: 4,
    });

    navigate('/tasks?justCompleted=4');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <StepPersonalInfo />;
      case 2: return <StepSummary />;
      case 3: return <StepWorkExperience />;
      case 4: return <StepEducation />;
      case 5: return <StepSkillsCerts />;
      case 6: return <ResumePreview />;
      default: return <StepPersonalInfo />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-40">
      <header className="border-b border-slate-200 bg-white px-5 pb-5 pt-12">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
          >
            <ArrowLeft size={16} />
            返回路线
          </button>

          <p className="text-sm font-medium text-blue-700">任务 4 / 12</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">
            准备英文简历
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            不只是填表。把你的经历改写成目标岗位看得懂的英文简历，用于投递、AI 优化和后续面试训练。
          </p>

          <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-950">
                  {targetPosition ? `目标岗位：${guidance.label}` : '目标岗位：暂未选择'}
                </p>
                <p className="mt-1 text-sm leading-6 text-blue-900">{guidance.headline}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {guidance.keywords.slice(0, 4).map((keyword) => (
                    <span key={keyword} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-blue-800">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="mx-auto max-w-3xl">
          <div className="mb-3 flex gap-1.5">
            {STEPS.map((step) => (
              <button
                key={step.num}
                type="button"
                onClick={() => step.num <= currentStep && setStep(step.num)}
                className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                  step.num < currentStep
                    ? 'bg-emerald-500'
                    : step.num === currentStep
                      ? 'bg-blue-600'
                      : 'bg-slate-200'
                }`}
                aria-label={step.title}
              />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-800">{STEPS[currentStep - 1].title}</span>
            <span className="text-sm text-slate-500">{currentStep} / {STEPS.length}</span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-5 py-6 pb-40">{renderStep()}</main>

      <footer className="fixed bottom-16 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-3xl gap-3">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="flex-1 rounded-lg border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              上一步
            </button>
          )}
          {currentStep < STEPS.length ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex-1 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              下一步
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <CheckCircle2 size={18} />
              完成并保存简历
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
