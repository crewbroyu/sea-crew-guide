import { useNavigate } from 'react-router-dom'
import { ChevronRight, Headphones } from 'lucide-react'
import { listeningSpeakingCategories } from '../../data/listeningSpeakingCourses'

export default function ListeningSpeaking() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 pt-16 pb-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-indigo-200">
          <button onClick={() => navigate('/academy')} className="hover:text-white">海乘学院</button>
          <span>›</span>
          <span className="font-medium text-white">听说训练</span>
        </div>
        <h1 className="text-2xl font-bold text-white">听说训练</h1>
        <p className="mt-2 text-sm text-white/80">短句示范、朗读与本地跟读，先把开口练习变成习惯。</p>
      </div>
      <div className="space-y-4 px-6 py-6">
        <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800">训练分类</h2>
          <p className="mt-2 text-sm text-gray-600">课程可直接用链接打开；录音只保留在当前浏览器。</p>
        </div>
        {listeningSpeakingCategories.map((category) => {
          const iconClass = category.accent === 'emerald' ? 'text-emerald-600' : 'text-blue-600'
          const backgroundClass = category.accent === 'emerald' ? 'bg-emerald-100' : 'bg-indigo-100'
          return (
            <button key={category.id} onClick={() => navigate(`/academy/listening-speaking/${category.id}`)} className="flex w-full items-center justify-between rounded-xl bg-white p-4 text-left shadow-sm transition active:scale-[0.98]">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${backgroundClass}`}><Headphones size={24} className={iconClass} /></div>
                <div><p className="font-medium text-gray-800">{category.name}</p><p className="text-xs text-gray-500">{category.description}</p><p className="mt-1 text-xs text-gray-400">{category.courses.length} 个短句训练</p></div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
