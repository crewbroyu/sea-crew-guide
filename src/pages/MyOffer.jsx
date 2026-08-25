// src/pages/MyOffer.jsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, CheckCircle, AlertCircle, XCircle,
  RefreshCw, ChevronLeft, FileImage, File, Trash2
} from 'lucide-react';

// 状态类型
const OFFER_STATUS = {
  NOT_SUBMITTED: 'not_submitted',
  UNDER_REVIEW: 'under_review',
  REVIEWED: 'reviewed'
};

// 审核结果
const REVIEW_RESULT = {
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// 模拟数据
const mockData = {
  rejectionReason: 'Offer文档不清晰，请重新上传清晰的扫描件'
};

export default function MyOffer() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(OFFER_STATUS.NOT_SUBMITTED);
  const [reviewResult, setReviewResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // 处理文件选择
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // 处理拖拽
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // 移除文件
  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 提交审核
  const handleSubmit = () => {
    if (!selectedFile) return;
    setStatus(OFFER_STATUS.UNDER_REVIEW);
  };

  // 撤回重新上传
  const handleWithdraw = () => {
    setStatus(OFFER_STATUS.NOT_SUBMITTED);
  };

  // 重新上传
  const handleReupload = () => {
    setStatus(OFFER_STATUS.NOT_SUBMITTED);
    setSelectedFile(null);
    setReviewResult(null);
  };

  // 开发调试：切换状态
  const handleDebugToggle = () => {
    if (status === OFFER_STATUS.NOT_SUBMITTED) {
      setStatus(OFFER_STATUS.UNDER_REVIEW);
    } else if (status === OFFER_STATUS.UNDER_REVIEW) {
      setStatus(OFFER_STATUS.REVIEWED);
      setReviewResult(REVIEW_RESULT.APPROVED);
      // 模拟添加站内消息
      const messages = JSON.parse(localStorage.getItem('messages') || '[]');
      messages.unshift({
        id: Date.now(),
        title: '您的Offer已通过审核',
        content: '恭喜！您的Offer已通过审核，请继续后续流程。',
        type: 'success',
        isRead: false,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('messages', JSON.stringify(messages));
      
      // 标记任务9为已完成
      const progressKey = 'boarding_progress';
      const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
      progress.task9 = {
        completed: true,
        completedAt: new Date().toISOString()
      };
      localStorage.setItem(progressKey, JSON.stringify(progress));
    } else {
      setStatus(OFFER_STATUS.NOT_SUBMITTED);
      setSelectedFile(null);
      setReviewResult(null);
    }
  };

  // 开发调试：切换为未通过
  const handleDebugReject = () => {
    setStatus(OFFER_STATUS.REVIEWED);
    setReviewResult(REVIEW_RESULT.REJECTED);
    // 模拟添加站内消息
    const messages = JSON.parse(localStorage.getItem('messages') || '[]');
    messages.unshift({
      id: Date.now(),
      title: '您的Offer未通过审核',
      content: `您的Offer未通过审核，原因：${mockData.rejectionReason}`,
      type: 'error',
      isRead: false,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('messages', JSON.stringify(messages));
  };

  // 判断是否是开发环境
  const isDevelopment = import.meta.env.DEV;

  // 获取文件图标
  const getFileIcon = (file) => {
    if (!file) return null;
    const isImage = file.type.startsWith('image/');
    if (isImage) {
      return <FileImage size={48} className="text-blue-500" />;
    }
    return <File size={48} className="text-red-500" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 顶部头部 */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 px-6 pt-16 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/tasks')}
            className="text-white hover:text-green-200"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-white text-2xl font-bold">我的Offer</h1>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* 状态一：未提交 */}
        {status === OFFER_STATUS.NOT_SUBMITTED && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">上传Offer文档</h2>
              
              {/* 上传区域 */}
              {!selectedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    isDragging 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Upload size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">点击或拖拽上传文件</p>
                  <p className="text-gray-400 text-sm mt-2">支持图片和PDF格式</p>
                  <p className="text-amber-600 text-xs mt-3">
                    上传文件只是为了解锁任务，请打码重要信息（姓名、证件编号）后上传
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-4">
                    {selectedFile.type.startsWith('image/') ? (
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                        <img
                          src={URL.createObjectURL(selectedFile)}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                        <File size={40} className="text-red-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              )}

              {/* 提交按钮 */}
              <button
                onClick={handleSubmit}
                disabled={!selectedFile}
                className={`w-full mt-6 py-3 rounded-lg font-medium transition-colors ${
                  selectedFile
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                提交审核
              </button>
            </div>
          </div>
        )}

        {/* 状态二：审核中 */}
        {status === OFFER_STATUS.UNDER_REVIEW && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">审核中</h2>
                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full flex items-center gap-1">
                  <AlertCircle size={16} />
                  审核中
                </span>
              </div>

              {/* 已上传的文档 */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-4">
                  {getFileIcon(selectedFile)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{selectedFile?.name}</p>
                    <p className="text-sm text-gray-500">已提交</p>
                  </div>
                </div>
              </div>

              {/* 提示文字 */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-700">
                  您的Offer已提交，工作人员将在1-3个工作日内完成审核
                </p>
              </div>

              {/* 撤回按钮 */}
              <button
                onClick={handleWithdraw}
                className="w-full mt-6 py-3 rounded-lg font-medium transition-colors bg-gray-200 text-gray-800 hover:bg-gray-300 flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                撤回重新上传
              </button>
            </div>
          </div>
        )}

        {/* 状态三：审核完成 */}
        {status === OFFER_STATUS.REVIEWED && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">审核结果</h2>
                {reviewResult === REVIEW_RESULT.APPROVED ? (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full flex items-center gap-1">
                    <CheckCircle size={16} />
                    已认证
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full flex items-center gap-1">
                    <XCircle size={16} />
                    未通过
                  </span>
                )}
              </div>

              {/* Offer文档 */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-4">
                  {getFileIcon(selectedFile)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{selectedFile?.name}</p>
                  </div>
                </div>
              </div>

              {/* 审核结果详情 */}
              {reviewResult === REVIEW_RESULT.REJECTED && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-red-800 mb-2">未通过原因</h3>
                  <p className="text-red-700">{mockData.rejectionReason}</p>
                </div>
              )}

              {/* 重新上传按钮（仅未通过时显示） */}
              {reviewResult === REVIEW_RESULT.REJECTED && (
                <button
                  onClick={handleReupload}
                  className="w-full py-3 rounded-lg font-medium transition-colors bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} />
                  重新上传
                </button>
              )}
            </div>
          </div>
        )}

        {/* 开发调试按钮 */}
        {isDevelopment && (
          <div className="bg-gray-100 border-2 border-dashed border-gray-400 rounded-xl p-4 mt-8">
            <p className="text-xs text-gray-500 mb-3 font-medium">🔧 开发调试</p>
            <div className="flex gap-3">
              <button
                onClick={handleDebugToggle}
                className="flex-1 py-2 rounded-lg bg-gray-300 text-gray-800 text-sm font-medium hover:bg-gray-400"
              >
                切换状态
              </button>
              {status === OFFER_STATUS.UNDER_REVIEW && (
                <button
                  onClick={handleDebugReject}
                  className="flex-1 py-2 rounded-lg bg-red-300 text-red-800 text-sm font-medium hover:bg-red-400"
                >
                  模拟未通过
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              当前状态: {status} {reviewResult ? `(${reviewResult})` : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
