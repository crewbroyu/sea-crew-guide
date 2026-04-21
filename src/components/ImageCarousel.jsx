// src/components/ImageCarousel.jsx
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ImageCarousel() {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 加载图片数据
  useEffect(() => {
    loadImages();
  }, []);

  // 自动轮播
  useEffect(() => {
    if (images.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [images.length]);

  // 加载图片数据
  const loadImages = () => {
    // 从本地存储加载数据
    const applications = JSON.parse(localStorage.getItem('job_applications') || '[]');
    const portDailyPosts = JSON.parse(localStorage.getItem('port_daily_posts') || '[]');

    // 收集图片
    const collectedImages = [];

    // 从申请记录中获取offer图片（模拟）
    applications.forEach((app) => {
      if (app.status === 'Offer') {
        collectedImages.push({
          id: `offer-${app.id}`,
          url: `https://picsum.photos/800/400?random=${app.id}`,
          title: `${app.companyName} - ${app.jobTitle}`,
          type: 'offer'
        });
      }
    });

    // 从到港日常中获取图片
    portDailyPosts.forEach((post) => {
      if (post.imageUrl) {
        collectedImages.push({
          id: `port-${post.id}`,
          url: post.imageUrl,
          title: post.port,
          type: 'port'
        });
      }
    });

    // 添加默认图片（初期使用）
    if (collectedImages.length === 0) {
      const defaultImages = [
        {
          id: 'default-1',
          url: 'https://picsum.photos/800/400?random=1',
          title: '新加坡港口',
          type: 'port'
        },
        {
          id: 'default-2',
          url: 'https://picsum.photos/800/400?random=2',
          title: '迪拜港口',
          type: 'port'
        },
        {
          id: 'default-3',
          url: 'https://picsum.photos/800/400?random=3',
          title: 'MSC Offer',
          type: 'offer'
        },
        {
          id: 'default-4',
          url: 'https://picsum.photos/800/400?random=4',
          title: 'Royal Caribbean Offer',
          type: 'offer'
        }
      ];
      setImages(defaultImages);
    } else {
      // 随机排序
      const shuffledImages = collectedImages.sort(() => Math.random() - 0.5);
      setImages(shuffledImages);
    }
  };

  // 上一张
  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // 下一张
  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="relative bg-white rounded-xl shadow-sm overflow-hidden">
      {/* 轮播图片 */}
      <div className="relative h-48 md:h-64">
        <img
          src={images[currentIndex].url}
          alt={images[currentIndex].title}
          className="w-full h-full object-cover"
        />
        {/* 遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
          <div className="p-4 text-white">
            <h3 className="font-bold text-lg">{images[currentIndex].title}</h3>
            <p className="text-sm opacity-90">
              {images[currentIndex].type === 'offer' ? 'Offer 喜报' : '到港日常'}
            </p>
          </div>
        </div>
      </div>

      {/* 导航按钮 */}
      <button
        onClick={prevImage}
        className="absolute top-1/2 left-2 -translate-y-1/2 w-8 h-8 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/50 transition-colors"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={nextImage}
        className="absolute top-1/2 right-2 -translate-y-1/2 w-8 h-8 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/50 transition-colors"
      >
        <ChevronRight size={16} />
      </button>

      {/* 指示器 */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}