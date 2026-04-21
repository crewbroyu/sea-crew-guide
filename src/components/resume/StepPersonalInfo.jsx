import React from 'react';
import useResumeStore from '../../store/resumeStore';

function InputField({ label, placeholder, value, onChange, type = 'text', required }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
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
      <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        {/* Photo upload */}
        <div className="flex items-center gap-4 mb-6 p-3 bg-gray-50 rounded-lg">
          <div className="w-20 h-20 rounded-full bg-white border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
            {personalInfo.photo ? (
              <img
                src={personalInfo.photo}
                alt="Photo"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-400 text-2xl">📷</span>
            )}
          </div>
          <div>
            <label className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium cursor-pointer active:bg-blue-100">
              上传证件照
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-400 mt-1.5">
              白底正装照 · 微笑自然 · 邮轮行业常用
            </p>
            {personalInfo.photo && (
              <button
                onClick={() => updatePersonalInfo({ photo: null })}
                className="text-xs text-red-400 mt-1"
              >
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Passport Status 护照状态
          </label>
          <select
            value={personalInfo.passportStatus}
            onChange={(e) => updatePersonalInfo({ passportStatus: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
          >
            <option value="">请选择</option>
            <option value="Valid">有效 Valid</option>
            <option value="Expiring Soon">即将到期 Expiring Soon</option>
            <option value="Applying">申请中 Applying</option>
            <option value="Not Yet">暂无 Not Yet</option>
          </select>
        </div>
      </div>

      {/* Tip */}
      <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
        <p className="text-sm text-amber-800">
          💡 <strong>提示：</strong>邮轮简历建议<strong>英文填写</strong>，姓名用拼音或英文名。国际邮轮ATS系统优先识别英文格式。
        </p>
      </div>
    </div>
  );
}