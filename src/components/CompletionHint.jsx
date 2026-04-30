import { useState, useEffect } from 'react';
import { getRandomMessage } from '../utils/completionMessages';

let showHintCallback = null;

// 完成反馈提示组件
export default function CompletionHint() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState({ en: '', zh: '' });

  useEffect(() => {
    // 注册回调函数
    showHintCallback = (taskId) => {
      const msg = getRandomMessage(taskId);
      setMessage(msg);
      setVisible(true);

      // 2.5秒后自动消失
      setTimeout(() => {
        setVisible(false);
      }, 2500);
    };

    return () => {
      showHintCallback = null;
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
      <div 
        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-6 rounded-2xl shadow-2xl transform transition-all duration-300"
        style={{
          animation: 'fadeInUp 0.3s ease-out',
        }}
      >
        <div className="flex items-center gap-4">
          {/* 成功图标 */}
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          {/* 文案 */}
          <div>
            <p className="text-lg font-semibold">{message.en}</p>
            <p className="text-sm text-white/80 mt-1">{message.zh}</p>
          </div>
        </div>
      </div>

      {/* 内联动画样式 */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

// 导出显示函数
export const showCompletionHint = (taskId) => {
  if (showHintCallback) {
    showHintCallback(taskId);
  }
};
