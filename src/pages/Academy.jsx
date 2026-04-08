import { useNavigate } from 'react-router-dom'
import { createElement } from 'react'
import { BookOpen, Mic2, FileText, Ship } from 'lucide-react'

const modules = [
  { icon: BookOpen, label: '岗位英语', desc: '学习对应岗位的英语课程', to: '/academy/job-english' },
  { icon: Mic2, label: '面试训练', desc: '面试技巧 · 常见问题 · AI模拟', to: '/academy/interview' },
  { icon: FileText, label: '登船手续', desc: '证件办理 · 行李准备 · 机票', to: '/academy/boarding' },
  { icon: Ship, label: '邮轮百科', desc: '了解邮轮公司和船上生活', to: '/academy/wiki' },
]

export default function Academy() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 pt-12 pb-6">
        <h1 className="text-white text-lg font-bold">海乘学院</h1>
        <p className="text-purple-200 text-sm mt-1">系统学习，全面提升</p>
      </div>

      <div className="px-6 py-4 space-y-3">
        {modules.map(({ icon, label, desc, to }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="w-full bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm active:scale-[0.98] transition"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              {createElement(icon, { size: 24, className: 'text-purple-600' })}
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-800">{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}