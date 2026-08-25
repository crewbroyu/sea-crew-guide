import { Trash2 } from 'lucide-react';
import useResumeStore from '../../store/resumeStore';

export default function StepEducation() {
  const { education, addEducation, updateEducation, removeEducation } = useResumeStore();

  return (
    <div className="pb-24">
      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-blue-700">Education</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950">学历、培训和相关资格</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              学历不用写得复杂，重点是清楚、真实，并补充和英语、酒店、服务、销售相关的培训。
            </p>
          </div>
          <button
            type="button"
            onClick={addEducation}
            className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            添加教育
          </button>
        </div>

        {education.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-slate-500">
            <p className="mb-2">还没有添加教育或培训经历</p>
            <button
              type="button"
              onClick={addEducation}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
            >
              添加第一条教育
            </button>
          </div>
        ) : (
          education.map((edu) => (
            <div key={edu.id} className="mb-3 flex items-start gap-3 rounded-lg border border-slate-200 p-3 last:mb-0">
              <div className="flex-1">
                <input
                  value={edu.degree}
                  onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                  placeholder="Degree / Qualification 学位/证书"
                  className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <input
                  value={edu.school}
                  onChange={(e) => updateEducation(edu.id, { school: e.target.value })}
                  placeholder="School / Institution 学校/机构"
                  className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <input
                  value={edu.year}
                  onChange={(e) => updateEducation(edu.id, { year: e.target.value })}
                  placeholder="Year / Period 年份/期间"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button
                type="button"
                onClick={() => removeEducation(edu.id)}
                className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label="删除教育背景"
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-950">填写标准</p>
        <p className="mt-2 text-sm leading-6 text-amber-900">
          最近的学历或培训放前面。英语培训、酒店管理、餐饮服务、销售培训、急救或安全相关课程都可以作为加分信息。
        </p>
      </div>
    </div>
  );
}
