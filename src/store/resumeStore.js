import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const initialState = {
  currentStep: 1,
  personalInfo: {
    name: '',
    phone: '',
    email: '',
    nationality: '',
    location: '',
    dateOfBirth: '',
    passportStatus: '',
    photo: null,
  },
  professionalSummary: '',
  workExperience: [],
  education: [],
  skills: [],
  certificates: [],
  languages: [],
};

const useResumeStore = create(
  persist(
    (set) => ({
      ...initialState,

      // Step navigation
      setStep: (step) => set({ currentStep: step }),
      nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 6) })),
      prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),

      // Personal Info
      updatePersonalInfo: (updates) =>
        set((s) => ({ personalInfo: { ...s.personalInfo, ...updates } })),

      // Professional Summary
      setProfessionalSummary: (text) => set({ professionalSummary: text }),

      // Work Experience
      addWorkExperience: () =>
        set((s) => ({
          workExperience: [
            ...s.workExperience,
            {
              id: Date.now().toString(),
              jobTitle: '',
              company: '',
              startDate: '',
              endDate: '',
              current: false,
              bullets: [''],
            },
          ],
        })),
      updateWorkExp: (id, updates) =>
        set((s) => ({
          workExperience: s.workExperience.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),
      removeWorkExp: (id) =>
        set((s) => ({
          workExperience: s.workExperience.filter((e) => e.id !== id),
        })),
      addBullet: (expId, initialValue = '') =>
        set((s) => ({
          workExperience: s.workExperience.map((e) =>
            e.id === expId ? { ...e, bullets: [...e.bullets, initialValue] } : e
          ),
        })),
      updateBullet: (expId, idx, val) =>
        set((s) => ({
          workExperience: s.workExperience.map((e) =>
            e.id === expId
              ? { ...e, bullets: e.bullets.map((b, i) => (i === idx ? val : b)) }
              : e
          ),
        })),
      removeBullet: (expId, idx) =>
        set((s) => ({
          workExperience: s.workExperience.map((e) =>
            e.id === expId
              ? { ...e, bullets: e.bullets.filter((_, i) => i !== idx) }
              : e
          ),
        })),

      // Education
      addEducation: () =>
        set((s) => ({
          education: [
            ...s.education,
            { id: Date.now().toString(), degree: '', school: '', year: '' },
          ],
        })),
      updateEducation: (id, updates) =>
        set((s) => ({
          education: s.education.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),
      removeEducation: (id) =>
        set((s) => ({ education: s.education.filter((e) => e.id !== id) })),

      // Skills
      addSkill: (skill) =>
        set((s) => ({ skills: [...s.skills, skill] })),
      removeSkill: (idx) =>
        set((s) => ({ skills: s.skills.filter((_, i) => i !== idx) })),

      // Certificates
      addCertificate: (certName) =>
        set((s) => ({
          certificates: [
            ...s.certificates,
            { id: Date.now().toString(), name: certName || '', status: 'obtained' },
          ],
        })),
      updateCertificate: (id, updates) =>
        set((s) => ({
          certificates: s.certificates.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),
      removeCertificate: (id) =>
        set((s) => ({ certificates: s.certificates.filter((c) => c.id !== id) })),

      // Languages
      addLanguage: () =>
        set((s) => ({
          languages: [
            ...s.languages,
            { id: Date.now().toString(), language: '', level: '' },
          ],
        })),
      updateLanguage: (id, updates) =>
        set((s) => ({
          languages: s.languages.map((l) =>
            l.id === id ? { ...l, ...updates } : l
          ),
        })),
      removeLanguage: (id) =>
        set((s) => ({ languages: s.languages.filter((l) => l.id !== id) })),

      // Reset
      resetResume: () => set(initialState),
    }),
    { name: 'seafarer-resume' }
  )
);

export default useResumeStore;