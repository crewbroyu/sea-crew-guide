// src/pages/academy/ListeningSpeakingCategory.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Headphones, PlayCircle } from 'lucide-react';

export default function ListeningSpeakingCategory() {
  const navigate = useNavigate();
  const location = useLocation();
  const { category } = location.state || {};

  if (!category) {
    navigate('/academy/listening-speaking');
    return null;
  }

  const handleCourseClick = (course) => {
    navigate('/academy/listening-speaking/course', {
      state: { category, course }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部头部区域 */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 pt-16 pb-6">
        {/* 面包屑导航 */}
        <div className="flex items-center gap-2 text-indigo-200 text-sm mb-4">
          <span onClick={() => navigate('/academy')} className="cursor-pointer hover:text-white">海乘学院</span>
          <span className="breadcrumb-separator">›</span>
          <span onClick={() => navigate('/academy/listening-speaking')} className="cursor-pointer hover:text-white">听说训练</span>
          <span className="breadcrumb-separator">›</span>
          <span className="text-white font-medium">{category.name}</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/academy/listening-speaking')}
            className="text-white hover:text-indigo-200"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-white text-2xl font-bold">{category.name}</h1>
        </div>
        <p className="text-white/80 text-sm mt-2">
          {category.description}
        </p>
      </div>
      
      {/* 课程列表 */}
      <div className="px-6 py-6 space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <h2 className="text-lg font-bold text-gray-800">训练课程</h2>
          <p className="text-gray-600 mt-2">
            点击课程卡片开始练习
          </p>
        </div>
        
        <div className="space-y-3">
          {category.courses.map((course, index) => (
            <button
              key={course.id}
              onClick={() => handleCourseClick(course)}
              className="w-full bg-white rounded-xl p-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  {course.mediaType === 'audio' ? (
                    <Headphones size={24} className="text-indigo-600" />
                  ) : (
                    <PlayCircle size={24} className="text-indigo-600" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-800">{index + 1}. {course.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${course.mediaType === 'audio' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {course.mediaType === 'audio' ? '音频' : '视频'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {course.transcript.substring(0, 30)}...
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
