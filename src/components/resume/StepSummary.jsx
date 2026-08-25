import useResumeStore from '../../store/resumeStore';
import { getResumeGuidance, getTargetPositionFromTask2 } from '../../data/resumeGuidance';

export default function StepSummary() {
  const { professionalSummary, setProfessionalSummary } = useResumeStore();
  const targetPosition = getTargetPositionFromTask2();
  const guidance = getResumeGuidance(targetPosition);

  return (
    <div className="pb-24">
      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-blue-700">Professional Summary</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-950">写成目标岗位看得懂的职业摘要</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {targetPosition ? `当前目标岗位是 ${guidance.label}，摘要要优先突出它最在意的能力。` : '如果还没选目标岗位，先用通用邮轮服务方向模板，后续可以再改。'}
        </p>

        <textarea
          value={professionalSummary}
          onChange={(e) => setProfessionalSummary(e.target.value)}
          placeholder="Write your professional summary here..."
          rows={5}
          className="mt-4 w-full resize-none rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-slate-700">岗位化模板</p>
          <div className="grid gap-3">
            {guidance.summaryTemplates.map((template) => (
              <div key={template.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="mb-1 text-xs font-semibold text-slate-600">{template.label}</p>
                <p className="text-xs leading-5 text-slate-700">{template.text}</p>
                <button
                  type="button"
                  onClick={() => setProfessionalSummary(template.text)}
                  className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-medium text-blue-700 ring-1 ring-slate-200 transition hover:bg-blue-50"
                >
                  使用此模板
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-950">这一步的判断标准</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {guidance.keywords.map((keyword) => (
            <span key={keyword} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-amber-800">
              {keyword}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm leading-6 text-amber-900">
          摘要不要写成“我热爱旅游”。它要在 3 句话里说明：你做过什么、能解决什么服务问题、为什么适合目标岗位。
        </p>
      </div>
    </div>
  );
}
