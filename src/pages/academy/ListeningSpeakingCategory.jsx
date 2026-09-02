import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Headphones } from 'lucide-react'
import { getListeningSpeakingCategory } from '../../data/listeningSpeakingCourses'

export default function ListeningSpeakingCategory() {
  const navigate = useNavigate()
  const { category: categoryId } = useParams()
  const category = getListeningSpeakingCategory(categoryId)

  if (!category) return <Navigate to="/academy/listening-speaking" replace />

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 pt-16 pb-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-indigo-200">
          <button onClick={() => navigate('/academy')} className="hover:text-white">海乘学院</button><span>›</span>
          <button onClick={() => navigate('/academy/listening-speaking')} className="hover:text-white">听说训练</button><span>›</span>
          <span className="font-medium text-white">{category.name}</span>
        </div>
        <div className="flex items-center gap-3"><button onClick={() => navigate('/academy/listening-speaking')} className="text-white hover:text-indigo-200" aria-label="返回听说训练"><ChevronLeft size={24} /></button><h1 className="text-2xl font-bold text-white">{category.name}</h1></div>
        <p className="mt-2 text-sm text-white/80">{category.description}</p>
      </div>
      <div className="space-y-4 px-6 py-6">
        <div className="mb-6 rounded-xl bg-white p-4 shadow-sm"><h2 className="text-lg font-bold text-gray-800">短句训练</h2><p className="mt-2 text-sm text-gray-600">先听示范，再录一遍自己的版本。无需上传录音。</p></div>
        {category.courses.map((course, index) => (
          <button key={course.id} onClick={() => navigate(`/academy/listening-speaking/${category.id}/${course.id}`)} className="flex w-full items-center justify-between rounded-xl bg-white p-4 text-left shadow-sm transition active:scale-[0.98]">
            <div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100"><Headphones size={24} className="text-indigo-600" /></div><div><p className="font-medium text-gray-800">{index + 1}. {course.title}</p><p className="mt-1 text-xs text-gray-500">{course.transcript}</p></div></div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
        ))}
      </div>
    </div>
  )
}
