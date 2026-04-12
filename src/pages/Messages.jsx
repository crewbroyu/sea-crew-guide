// src/pages/Messages.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Bell, CheckCircle, AlertCircle, XCircle,
  Info, Mail, Trash2
} from 'lucide-react';

export default function Messages() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);

  // 从 localStorage 加载消息
  useEffect(() => {
    const savedMessages = JSON.parse(localStorage.getItem('messages') || '[]');
    setMessages(savedMessages);
  }, []);

  // 标记消息为已读
  const markAsRead = (id) => {
    const updatedMessages = messages.map(msg => 
      msg.id === id ? { ...msg, isRead: true } : msg
    );
    setMessages(updatedMessages);
    localStorage.setItem('messages', JSON.stringify(updatedMessages));
  };

  // 删除消息
  const deleteMessage = (id) => {
    const updatedMessages = messages.filter(msg => msg.id !== id);
    setMessages(updatedMessages);
    localStorage.setItem('messages', JSON.stringify(updatedMessages));
  };

  // 全部标记为已读
  const markAllAsRead = () => {
    const updatedMessages = messages.map(msg => ({ ...msg, isRead: true }));
    setMessages(updatedMessages);
    localStorage.setItem('messages', JSON.stringify(updatedMessages));
  };

  // 删除所有已读消息
  const deleteAllRead = () => {
    const updatedMessages = messages.filter(msg => !msg.isRead);
    setMessages(updatedMessages);
    localStorage.setItem('messages', JSON.stringify(updatedMessages));
  };

  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return diffMinutes <= 1 ? '刚刚' : `${diffMinutes}分钟前`;
      }
      return `${diffHours}小时前`;
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  // 获取消息图标
  const getMessageIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={24} className="text-green-500" />;
      case 'error':
        return <XCircle size={24} className="text-red-500" />;
      case 'warning':
        return <AlertCircle size={24} className="text-amber-500" />;
      default:
        return <Info size={24} className="text-blue-500" />;
    }
  };

  // 计算未读消息数
  const unreadCount = messages.filter(msg => !msg.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部头部 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 pt-16 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/profile')}
              className="text-white hover:text-blue-200"
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-white text-2xl font-bold">站内消息</h1>
          </div>
          {unreadCount > 0 && (
            <div className="flex gap-2">
              <button
                onClick={markAllAsRead}
                className="text-white/80 hover:text-white text-sm"
              >
                全部已读
              </button>
            </div>
          )}
        </div>
        {unreadCount > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-blue-200 text-sm">
              {unreadCount} 条未读消息
            </span>
          </div>
        )}
      </div>

      <div className="px-6 py-6">
        {/* 消息为空 */}
        {messages.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Bell size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-2">暂无消息</h3>
            <p className="text-gray-500">您还没有收到任何消息</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* 消息列表 */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`bg-white rounded-xl shadow-sm p-4 transition-all ${
                  !message.isRead ? 'border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* 消息图标 */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === 'success' ? 'bg-green-100' :
                    message.type === 'error' ? 'bg-red-100' :
                    message.type === 'warning' ? 'bg-amber-100' : 'bg-blue-100'
                  }`}>
                    {getMessageIcon(message.type)}
                  </div>

                  {/* 消息内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`font-medium text-gray-800 ${!message.isRead ? 'font-bold' : ''}`}>
                          {message.title}
                        </h3>
                        <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                          {message.content}
                        </p>
                        <p className="text-gray-400 text-xs mt-2">
                          {formatDate(message.createdAt)}
                        </p>
                      </div>
                      
                      {/* 操作按钮 */}
                      <div className="flex items-center gap-2 ml-4">
                        {!message.isRead && (
                          <button
                            onClick={() => markAsRead(message.id)}
                            className="p-2 text-gray-400 hover:text-blue-500"
                            title="标记为已读"
                          >
                            <Mail size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteMessage(message.id)}
                          className="p-2 text-gray-400 hover:text-red-500"
                          title="删除"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 批量操作（有已读消息时显示） */}
        {messages.some(msg => msg.isRead) && (
          <div className="mt-6 bg-white rounded-xl shadow-sm p-4">
            <button
              onClick={deleteAllRead}
              className="w-full py-3 rounded-lg font-medium text-sm text-gray-600 hover:text-red-500 transition-colors"
            >
              删除所有已读消息
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
