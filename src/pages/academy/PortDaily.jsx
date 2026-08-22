// src/pages/academy/PortDaily.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Upload, MapPin, Calendar, ChevronRight } from 'lucide-react';

export default function PortDaily() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState(() => JSON.parse(localStorage.getItem('port_daily_posts') || '[]'));
  const [newPost, setNewPost] = useState({
    port: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    image: null
  });
  const [isUploading, setIsUploading] = useState(false);

  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // 处理图片上传
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNewPost(prev => ({
        ...prev,
        image: e.target.files[0]
      }));
    }
  };

  // 处理表单输入变化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPost(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 提交新帖子
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.port || !newPost.description || !newPost.image) {
      alert('请填写完整信息并上传图片');
      return;
    }

    setIsUploading(true);

    try {
      const imageUrl = await readFileAsDataUrl(newPost.image);
      const portDailyPosts = JSON.parse(localStorage.getItem('port_daily_posts') || '[]');
      const newPostWithId = {
        id: Date.now().toString(),
        port: newPost.port,
        date: newPost.date,
        description: newPost.description,
        imageUrl,
        createdAt: new Date().toISOString()
      };
      portDailyPosts.unshift(newPostWithId);
      localStorage.setItem('port_daily_posts', JSON.stringify(portDailyPosts));
      setPosts(portDailyPosts);
      setNewPost({
        port: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        image: null
      });
    } catch (error) {
      console.error('Failed to save port daily image:', error);
      alert('图片保存失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center">
        <button 
          onClick={() => navigate('/academy')}
          className="mr-4"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-lg font-medium text-gray-800">海乘到港日常</h1>
      </div>

      {/* 主要内容 */}
      <div className="flex-1 px-6 py-6">
        {/* 发布新帖子 */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">分享你的到港经历</h2>
          <form onSubmit={handleSubmit}>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  港口名称
                </label>
                <input
                  type="text"
                  name="port"
                  value={newPost.port}
                  onChange={handleInputChange}
                  placeholder="例如：新加坡、迪拜、巴塞罗那"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  到港日期
                </label>
                <input
                  type="date"
                  name="date"
                  value={newPost.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  name="description"
                  value={newPost.description}
                  onChange={handleInputChange}
                  placeholder="分享你的到港经历，比如当地特色、美食、景点等"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  上传图片
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {newPost.image ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={URL.createObjectURL(newPost.image)}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg mb-2"
                      />
                      <p className="text-sm text-gray-600">已选择图片</p>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <Camera size={32} className="text-gray-400" />
                        <p className="text-sm text-gray-600">点击上传图片</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </div>
                    </label>
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={isUploading}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                  isUploading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isUploading ? '上传中...' : '发布'}
              </button>
            </div>
          </form>
        </div>

        {/* 到港日常列表 */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <Camera size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-800 mb-2">暂无到港记录</h3>
              <p className="text-gray-500 mb-4">
                分享你的到港经历，与其他海乘伙伴交流
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* 图片 */}
                <div className="h-48 bg-gray-100">
                  <img
                    src={post.imageUrl}
                    alt={post.port}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* 内容 */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={16} className="text-red-500" />
                    <h3 className="font-bold text-gray-800">{post.port}</h3>
                  </div>
                  <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
                    <Calendar size={14} />
                    <span>{formatDate(post.date)}</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    {post.description}
                  </p>
                  <div className="flex justify-end">
                    <span className="text-xs text-gray-400">
                      {formatDate(post.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
