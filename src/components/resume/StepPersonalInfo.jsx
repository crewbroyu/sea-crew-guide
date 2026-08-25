import { Camera, X } from 'lucide-react';
import useResumeStore from '../../store/resumeStore';

function InputField({ label, placeholder, value, onChange, type = 'text', required }) {
  return (
    <div className="mb-4">
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

export default function StepPersonalInfo() {
  const { personalInfo, updatePersonalInfo } = useResumeStore();

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updatePersonalInfo({ photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="pb-24">
      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-blue-700">Personal Information</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-950">联系方式要让招聘方能直接联系你</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          邮轮简历建议用英文姓名、可联系手机号或 WhatsApp、常用邮箱和当前所在地。
        </p>

        <div className="mb-6 mt-4 flex items-center gap-4 rounded-lg bg-slate-50 p-3">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-slate-300 bg-white">
            {personalInfo.photo ? (
              <img
                src={personalInfo.photo}
                alt="Photo"
                className="h-full w-full object-cover"
              />
            ) : (
              <Camera size={24} className="text-slate-400" />
            )}
          </div>
          <div>
            <label className="inline-block cursor-pointer rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100">
              上传证件照
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
            <p className="mt-1.5 text-xs text-slate-500">
              白底正装照 · 微笑自然 · 邮轮行业常用
            </p>
            {personalInfo.photo && (
              <button
                type="button"
                onClick={() => updatePersonalInfo({ photo: null })}
                className="mt-1 inline-flex items-center gap-1 text-xs text-red-500"
              >
                <X size={12} />
                移除照片
              </button>
            )}
          </div>
        </div>

        <InputField
          label="Full Name 姓名"
          placeholder="e.g. Zhang Wei"
          value={personalInfo.name}
          onChange={(v) => updatePersonalInfo({ name: v })}
          required
        />
        <InputField
          label="Phone / WhatsApp 电话"
          placeholder="e.g. +86-138-xxxx-xxxx"
          value={personalInfo.phone}
          onChange={(v) => updatePersonalInfo({ phone: v })}
          required
        />
        <InputField
          label="Email 邮箱"
          placeholder="e.g. zhangwei@email.com"
          value={personalInfo.email}
          onChange={(v) => updatePersonalInfo({ email: v })}
          type="email"
          required
        />
        <InputField
          label="Nationality 国籍"
          placeholder="e.g. Chinese"
          value={personalInfo.nationality}
          onChange={(v) => updatePersonalInfo({ nationality: v })}
          required
        />
        <InputField
          label="Current Location 所在地"
          placeholder="e.g. Shanghai, China"
          value={personalInfo.location}
          onChange={(v) => updatePersonalInfo({ location: v })}
        />
        <InputField
          label="Date of Birth 出生日期"
          value={personalInfo.dateOfBirth}
          onChange={(v) => updatePersonalInfo({ dateOfBirth: v })}
          type="date"
        />

        <div className="mb-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Passport Status 护照状态
          </label>
          <select
            value={personalInfo.passportStatus}
            onChange={(e) => updatePersonalInfo({ passportStatus: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">请选择</option>
            <option value="Valid">有效 Valid</option>
            <option value="Expiring Soon">即将到期 Expiring Soon</option>
            <option value="Applying">申请中 Applying</option>
            <option value="Not Yet">暂无 Not Yet</option>
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-950">填写标准</p>
        <p className="mt-2 text-sm leading-6 text-amber-900">
          姓名建议用拼音或英文名，邮箱避免使用不专业昵称。护照状态会影响后续证件和登船准备判断。
        </p>
      </div>
    </div>
  );
}
