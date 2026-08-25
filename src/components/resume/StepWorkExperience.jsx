import { Trash2 } from 'lucide-react';
import useResumeStore from '../../store/resumeStore';
import { actionVerbs, getResumeGuidance } from '../../data/resumeGuidance';

export default function StepWorkExperience() {
  const { 
    workExperience, 
    addWorkExperience, 
    updateWorkExp, 
    removeWorkExp, 
    addBullet, 
    updateBullet, 
    removeBullet 
  } = useResumeStore();
  const guidance = getResumeGuidance();

  const applyExampleBullet = (expId, text) => {
    const experience = workExperience.find((item) => item.id === expId);
    const emptyIndex = experience?.bullets.findIndex((bullet) => !bullet.trim()) ?? -1;

    if (emptyIndex >= 0) {
      updateBullet(expId, emptyIndex, text);
      return;
    }

    addBullet(expId, text);
  };

  return (
    <div className="pb-24">
      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-blue-700">Work Experience</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">把经历写成岗位能力</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {guidance.label} 简历重点：{guidance.qualityFocus.join('、')}。
            </p>
          </div>
          <button
            type="button"
            onClick={addWorkExperience}
            className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            添加经历
          </button>
        </div>

        {workExperience.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-slate-500">
            <p className="mb-2">还没有添加工作经历</p>
            <button
              type="button"
              onClick={addWorkExperience}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
            >
              添加第一条经历
            </button>
          </div>
        ) : (
          workExperience.map((exp) => (
            <div key={exp.id} className="mb-4 rounded-lg border border-slate-200 p-4 last:mb-0">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <input
                    value={exp.jobTitle}
                    onChange={(e) => updateWorkExp(exp.id, { jobTitle: e.target.value })}
                    placeholder="Job Title 职位"
                    className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <input
                    value={exp.company}
                    onChange={(e) => updateWorkExp(exp.id, { company: e.target.value })}
                    placeholder="Company / Venue 公司/场所"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeWorkExp(exp.id)}
                  className="ml-3 rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  aria-label="删除经历"
                >
                  <Trash2 size={17} />
                </button>
              </div>

              <div className="mb-3 flex gap-2">
                <input
                  type="date"
                  value={exp.startDate}
                  onChange={(e) => updateWorkExp(exp.id, { startDate: e.target.value })}
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <input
                  type="date"
                  value={exp.endDate}
                  onChange={(e) => updateWorkExp(exp.id, { endDate: e.target.value, current: false })}
                  disabled={exp.current}
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
              </div>

              <div className="mb-3 flex items-center">
                <input
                  type="checkbox"
                  checked={exp.current}
                  onChange={(e) => updateWorkExp(exp.id, { current: e.target.checked, endDate: e.target.checked ? '' : exp.endDate })}
                  className="mr-2"
                />
                <label className="text-sm text-slate-600">Current Position 目前在职</label>
              </div>

              <div className="mb-2">
                <p className="mb-2 text-sm font-medium text-slate-700">Key Responsibilities 主要职责</p>
                {exp.bullets.map((bullet, bulletIdx) => (
                  <div key={bulletIdx} className="mb-2 flex items-start gap-2">
                    <span className="mt-2 text-slate-400">•</span>
                    <input
                      value={bullet}
                      onChange={(e) => updateBullet(exp.id, bulletIdx, e.target.value)}
                      placeholder="Describe your responsibilities and achievements..."
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    {exp.bullets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBullet(exp.id, bulletIdx)}
                        className="rounded-lg px-2 py-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addBullet(exp.id)}
                  className="text-sm font-medium text-blue-700"
                >
                  添加职责
                </button>
              </div>

              <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3">
                <p className="text-xs font-semibold text-blue-900">可套用的岗位表达</p>
                <div className="mt-2 space-y-2">
                  {guidance.bulletExamples.map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => applyExampleBullet(exp.id, example)}
                      className="block w-full rounded-lg bg-white px-3 py-2 text-left text-xs leading-5 text-blue-950 ring-1 ring-blue-100 transition hover:bg-blue-50"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-950">推荐动词</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {actionVerbs.map((verb) => (
            <span key={verb} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-amber-800">
              {verb}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm leading-6 text-amber-900">
          经历 bullet 尽量用“动作 + 服务对象 + 场景/结果”。不要只写 responsible for，要写清楚你具体处理了什么。
        </p>
      </div>
    </div>
  );
}
