import React from 'react';
import { useNavigate } from 'react-router-dom';
import useResumeStore from '../../../store/resumeStore';
import StepPersonalInfo from '../../../components/resume/StepPersonalInfo';
import StepSummary from '../../../components/resume/StepSummary';
import StepWorkExperience from '../../../components/resume/StepWorkExperience';
import StepEducation from '../../../components/resume/StepEducation';
import StepSkillsCerts from '../../../components/resume/StepSkillsCerts';
import ResumePreview from '../../../components/resume/ResumePreview';
import { syncLocalPathProfile } from '../../../services/userPathService';

const STEPS = [
  { num: 1, title: '个人信息', icon: '👤' },
  { num: 2, title: '职业摘要', icon: '📝' },
  { num: 3, title: '工作经验', icon: '💼' },
  { num: 4, title: '教育背景', icon: '🎓' },
  { num: 5, title: '技能证书', icon: '⚡' },
  { num: 6, title: '预览简历', icon: '👀' },
];

export default function Task4ResumeBuilder() {
  const navigate = useNavigate();
  const { currentStep, nextStep, prevStep, setStep } = useResumeStore();

  const handleComplete = () => {
    syncLocalPathProfile({
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
    <div className="min-h-screen bg-gray-50 pb-48">
      {/* ===== Header ===== */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 pt-4 pb-5">
        <div className="flex items-center mb-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20"
          >
            ←
          </button>
          <span className="ml-3 text-sm text-blue-100">任务 4 / 12</span>
        </div>
        <h1 className="text-xl font-bold">🚢 建立邮轮简历</h1>
        <p className="text-blue-100 text-sm mt-1">
          Build Your Cruise Industry Resume
        </p>
      </div>

      {/* ===== Step Indicator ===== */}
      <div className="px-4 py-3 bg-white border-b shadow-sm">
        {/* Progress bar */}
        <div className="flex gap-1.5 mb-3">
          {STEPS.map((step) => (
            <button
              key={step.num}
              onClick={() => step.num <= currentStep && setStep(step.num)}
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                step.num < currentStep
                  ? 'bg-green-400'
                  : step.num === currentStep
                  ? 'bg-blue-500'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        {/* Step label */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{STEPS[currentStep - 1].icon}</span>
            <span className="font-medium text-gray-800">
              {STEPS[currentStep - 1].title}
            </span>
          </div>
          <span className="text-sm text-gray-400">
            {currentStep} / {STEPS.length}
          </span>
        </div>
      </div>

      {/* ===== Step Content ===== */}
      <div className="px-4 py-4 pb-40">{renderStep()}</div>

      {/* ===== Bottom Navigation ===== */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t px-4 py-4 flex gap-3 z-40 shadow-lg">
        {currentStep > 1 && (
          <button
            onClick={prevStep}
            className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium active:bg-gray-50"
          >
            ← 上一步
          </button>
        )}
        {currentStep < STEPS.length ? (
          <button
            onClick={nextStep}
            className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium active:bg-blue-600 shadow-lg shadow-blue-500/25"
          >
            下一步 →
          </button>
        ) : (
          <button
            onClick={handleComplete}
            className="flex-1 py-3 bg-green-500 text-white rounded-xl font-medium active:bg-green-600 shadow-lg shadow-green-500/25"
          >
            ✅ 完成简历
          </button>
        )}
      </div>
    </div>
  );
}
