// src/pages/academy/ListeningSpeakingCourse.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Headphones, PlayCircle } from 'lucide-react';

export default function ListeningSpeakingCourse() {
  const navigate = useNavigate();
  const location = useLocation();
  const { category, course } = location.state || {};

  if (!category || !course) {
    navigate('/academy/listening-speaking');
    return null;
  }

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
          <span onClick={() => navigate('/academy/listening-speaking/category', { state: { category } })} className="cursor-pointer hover:text-white">{category.name}</span>
          <span className="breadcrumb-separator">›</span>
          <span className="text-white font-medium">课程详情</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/academy/listening-speaking/category', { state: { category } })}
            className="text-white hover:text-indigo-200"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-white text-2xl font-bold">{course.title}</h1>
        </div>
        <p className="text-white/80 text-sm mt-2">
          {category.name} · {course.mediaType === 'audio' ? '音频' : '视频'}课程
        </p>
      </div>
      
      {/* 课程内容 */}
      <div className="px-6 py-6 space-y-6">
        {/* 媒体播放器 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4">{course.mediaType === 'audio' ? '音频播放' : '视频播放'}</h2>
          
          {course.mediaType === 'audio' ? (
            <audio
              src={course.mediaUrl}
              controls
              className="w-full"
            >
              您的浏览器不支持音频播放。
            </audio>
          ) : (
            <video
              src={course.mediaUrl}
              controls
              className="w-full aspect-video"
            >
              您的浏览器不支持视频播放。
            </video>
          )}
          
          <div className="mt-4 flex items-center gap-2">
            {course.mediaType === 'audio' ? (
              <Headphones size={20} className="text-indigo-600" />
            ) : (
              <PlayCircle size={20} className="text-indigo-600" />
            )}
            <span className="text-gray-600 text-sm">
              {course.mediaType === 'audio' ? '音频文件' : '视频文件'}
            </span>
          </div>
        </div>
        
        {/* 英文原文 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-3">英文原文</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-800">{course.transcript}</p>
          </div>
        </div>
        
        {/* 中文翻译 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-3">中文翻译</h2>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <p className="text-indigo-800">{course.translation}</p>
          </div>
        </div>
        
        {/* 练习提示 */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-medium text-amber-800 mb-2">练习提示</h3>
          <ul className="list-disc list-inside space-y-1 text-amber-700 text-sm">
            <li>仔细听音频/视频内容，注意发音和语调</li>
            <li>尝试跟读，模仿 native speaker 的发音</li>
            <li>理解对话场景，掌握常用表达</li>
            <li>反复练习，提高听力和口语能力</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
