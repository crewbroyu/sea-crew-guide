import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, CheckCircle, AlertCircle, XCircle,
  RefreshCw, ChevronLeft, FileImage, File, Trash2, ArrowRight
} from 'lucide-react';
import TaskLayout from '../../components/TaskLayout';

// 状态类型
const DOC_STATUS = {
  NOT_SUBMITTED: 'not_submitted',
  UNDER_REVIEW: 'under_review',
  REVIEWED: 'reviewed'
};

// 审核结果
const REVIEW_RESULT = {
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// 证件类型
const DOC_TYPES = [
  {
    id: 'seaman_book',
    name: '海员证',
    description: '海员必备的身份证件，用于国际航行'
  },
  {
    id: 'medical_certificate',
    name: '海员体检',
    description: '海员专业体检证明，确保身体健康'
  },
  {
    id: 'travel_medical',
    name: '国际旅行体检',
    description: '国际旅行健康证明，含黄皮书'
  },
  {
    id: 'criminal_record',
    name: '无犯罪记录证明',
    description: '证明无犯罪记录，有效期通常为6个月'
  }
];

// 模拟数据
const mockData = {
  rejectionReason: '证件不清晰，请重新上传清晰的扫描件'
};

export default function Task10() {
  const navigate = useNavigate();
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [docs, setDocs] = useState(() => {
    const savedDocs = localStorage.getItem('task10_docs');
    if (savedDocs) {
      return JSON.parse(savedDocs);
    }
    return DOC_TYPES.map(doc => ({
      id: doc.id,
      name: doc.name,
      status: DOC_STATUS.NOT_SUBMITTED,
      reviewResult: null,
      file: null
    }));
  });
  const [isDragging, setIsDragging] = useState(false);
  const [guideViewed, setGuideViewed] = useState(() => localStorage.getItem('task10_guide_viewed') === 'true');
  const fileInputRef = useRef(null);

  // 保存证件数据到localStorage
  useEffect(() => {
    localStorage.setItem('task10_docs', JSON.stringify(docs));
  }, [docs]);

  // 保存指南查看状态到localStorage
  useEffect(() => {
    localStorage.setItem('task10_guide_viewed', guideViewed.toString());
  }, [guideViewed]);

  // 当前证件
  const currentDoc = docs[currentDocIndex];

  // 处理文件选择
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocs(prev => {
        const newDocs = [...prev];
        newDocs[currentDocIndex] = {
          ...newDocs[currentDocIndex],
          file
        };
        return newDocs;
      });
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
      setDocs(prev => {
        const newDocs = [...prev];
        newDocs[currentDocIndex] = {
          ...newDocs[currentDocIndex],
          file
        };
        return newDocs;
      });
    }
  };

  // 移除文件
  const handleRemoveFile = () => {
    setDocs(prev => {
      const newDocs = [...prev];
      newDocs[currentDocIndex] = {
        ...newDocs[currentDocIndex],
        file: null
      };
      return newDocs;
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 提交审核
  const handleSubmit = () => {
    if (!currentDoc.file) return;
    setDocs(prev => {
      const newDocs = [...prev];
      newDocs[currentDocIndex] = {
        ...newDocs[currentDocIndex],
        status: DOC_STATUS.UNDER_REVIEW
      };
      return newDocs;
    });
  };

  // 撤回重新上传
  const handleWithdraw = () => {
    setDocs(prev => {
      const newDocs = [...prev];
      newDocs[currentDocIndex] = {
        ...newDocs[currentDocIndex],
        status: DOC_STATUS.NOT_SUBMITTED
      };
      return newDocs;
    });
  };

  // 重新上传
  const handleReupload = () => {
    setDocs(prev => {
      const newDocs = [...prev];
      newDocs[currentDocIndex] = {
        ...newDocs[currentDocIndex],
        status: DOC_STATUS.NOT_SUBMITTED,
        reviewResult: null,
        file: null
      };
      return newDocs;
    });
  };

  // 下一个证件
  const handleNextDoc = () => {
    if (currentDocIndex < DOC_TYPES.length - 1) {
      setCurrentDocIndex(currentDocIndex + 1);
    }
  };

  // 上一个证件
  const handlePrevDoc = () => {
    if (currentDocIndex > 0) {
      setCurrentDocIndex(currentDocIndex - 1);
    }
  };

  // 开发调试：切换状态
  const handleDebugToggle = () => {
    setDocs(prev => {
      const newDocs = [...prev];
      if (newDocs[currentDocIndex].status === DOC_STATUS.NOT_SUBMITTED) {
        newDocs[currentDocIndex] = {
          ...newDocs[currentDocIndex],
          status: DOC_STATUS.UNDER_REVIEW
        };
      } else if (newDocs[currentDocIndex].status === DOC_STATUS.UNDER_REVIEW) {
        newDocs[currentDocIndex] = {
          ...newDocs[currentDocIndex],
          status: DOC_STATUS.REVIEWED,
          reviewResult: REVIEW_RESULT.APPROVED
        };
        // 模拟添加站内消息
        const messages = JSON.parse(localStorage.getItem('messages') || '[]');
        messages.unshift({
          id: Date.now(),
          title: `${newDocs[currentDocIndex].name}已通过审核`,
          content: `恭喜！您的${newDocs[currentDocIndex].name}已通过审核，请继续上传其他证件。`,
          type: 'success',
          isRead: false,
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('messages', JSON.stringify(messages));
      } else {
        newDocs[currentDocIndex] = {
          ...newDocs[currentDocIndex],
          status: DOC_STATUS.NOT_SUBMITTED,
          reviewResult: null,
          file: null
        };
      }
      return newDocs;
    });
  };

  // 开发调试：切换为未通过
  const handleDebugReject = () => {
    setDocs(prev => {
      const newDocs = [...prev];
      newDocs[currentDocIndex] = {
        ...newDocs[currentDocIndex],
        status: DOC_STATUS.REVIEWED,
        reviewResult: REVIEW_RESULT.REJECTED
      };
      // 模拟添加站内消息
      const messages = JSON.parse(localStorage.getItem('messages') || '[]');
      messages.unshift({
        id: Date.now(),
        title: `${newDocs[currentDocIndex].name}未通过审核`,
        content: `您的${newDocs[currentDocIndex].name}未通过审核，原因：${mockData.rejectionReason}`,
        type: 'error',
        isRead: false,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('messages', JSON.stringify(messages));
      return newDocs;
    });
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

  // 检查是否所有证件都已完成
  const allDocsCompleted = docs.every(doc => 
    doc.status === DOC_STATUS.REVIEWED && doc.reviewResult === REVIEW_RESULT.APPROVED
  );

  // 处理完成任务
  const handleCompleteTask = () => {
    // 标记任务10为已完成
    const progressKey = 'boarding_progress';
    const progress = JSON.parse(localStorage.getItem(progressKey) || '{}');
    progress.task10 = {
      completed: true,
      completedAt: new Date().toISOString()
    };
    localStorage.setItem(progressKey, JSON.stringify(progress));
  };

  // 处理查看指南
  const handleViewGuide = () => {
    navigate('/academy/boarding');
  };

  // 处理跳过指南
  const handleSkipGuide = () => {
    setGuideViewed(true);
  };

  return (
    <TaskLayout taskId={10} taskTitle="海乘职业资质" canComplete={allDocsCompleted} onComplete={handleCompleteTask}>
      {!guideViewed ? (
        <div className="space-y-6">
          {/* 指南提示 */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-center text-white">
            <h2 className="text-xl font-bold mb-4">📋 证件办理指南</h2>
            <p className="mb-6">在上传证件前，建议先查看海乘学院的登船手续指南，了解各证件的办理流程和注意事项</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleViewGuide}
                className="w-full py-3 rounded-lg font-medium bg-white text-green-700 hover:bg-green-50 transition-colors"
              >
                前往海乘学院查看指南
              </button>
              <button
                onClick={handleSkipGuide}
                className="w-full py-3 rounded-lg font-medium bg-green-700 bg-opacity-30 text-white hover:bg-opacity-40 transition-colors"
              >
                跳过指南，直接上传证件
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 任务描述 */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-blue-700 text-sm">
              按先后顺序上传并通过以下证件的审核：海员证、海员体检、国际旅行体检、无犯罪记录证明
            </p>
          </div>

        {/* 证件导航 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-medium text-gray-800 mb-3">证件上传进度</h3>
          <div className="flex items-center justify-between mb-4">
            {DOC_TYPES.map((doc, index) => {
              const docData = docs[index];
              const isCompleted = docData.status === DOC_STATUS.REVIEWED && docData.reviewResult === REVIEW_RESULT.APPROVED;
              const isCurrent = index === currentDocIndex;
              
              return (
                <div key={doc.id} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${isCompleted ? 'bg-green-100 text-green-600' : isCurrent ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                    {isCompleted ? (
                      <CheckCircle size={20} />
                    ) : (
                      <span className="font-medium">{index + 1}</span>
                    )}
                  </div>
                  <span className={`text-xs text-center ${isCompleted ? 'text-green-600' : isCurrent ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                    {doc.name}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevDoc}
              disabled={currentDocIndex === 0}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentDocIndex === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-1">
                <ChevronLeft size={16} />
                上一个
              </div>
            </button>
            <button
              onClick={handleNextDoc}
              disabled={currentDocIndex === DOC_TYPES.length - 1}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentDocIndex === DOC_TYPES.length - 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-1">
                下一个
                <ArrowRight size={16} />
              </div>
            </button>
          </div>
        </div>

        {/* 当前证件上传 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-2">{currentDoc.name}</h3>
          <p className="text-gray-600 text-sm mb-4">{DOC_TYPES[currentDocIndex].description}</p>

          {/* 状态一：未提交 */}
          {currentDoc.status === DOC_STATUS.NOT_SUBMITTED && (
            <div className="space-y-4">
              {/* 上传区域 */}
              {!currentDoc.file ? (
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
                    {currentDoc.file.type.startsWith('image/') ? (
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                        <img
                          src={URL.createObjectURL(currentDoc.file)}
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
                      <p className="font-medium text-gray-800 truncate">{currentDoc.file.name}</p>
                      <p className="text-sm text-gray-500">{(currentDoc.file.size / 1024).toFixed(1)} KB</p>
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
                disabled={!currentDoc.file}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  currentDoc.file
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                提交审核
              </button>
            </div>
          )}

          {/* 状态二：审核中 */}
          {currentDoc.status === DOC_STATUS.UNDER_REVIEW && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-800">审核中</h4>
                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full flex items-center gap-1">
                  <AlertCircle size={16} />
                  审核中
                </span>
              </div>

              {/* 已上传的文档 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  {getFileIcon(currentDoc.file)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{currentDoc.file?.name}</p>
                    <p className="text-sm text-gray-500">已提交</p>
                  </div>
                </div>
              </div>

              {/* 提示文字 */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-700">
                  您的{currentDoc.name}已提交，工作人员将在1-3个工作日内完成审核
                </p>
              </div>

              {/* 撤回按钮 */}
              <button
                onClick={handleWithdraw}
                className="w-full py-3 rounded-lg font-medium transition-colors bg-gray-200 text-gray-800 hover:bg-gray-300 flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                撤回重新上传
              </button>
            </div>
          )}

          {/* 状态三：审核完成 */}
          {currentDoc.status === DOC_STATUS.REVIEWED && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-800">审核结果</h4>
                {currentDoc.reviewResult === REVIEW_RESULT.APPROVED ? (
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

              {/* 证件文档 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  {getFileIcon(currentDoc.file)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{currentDoc.file?.name}</p>
                  </div>
                </div>
              </div>

              {/* 审核结果详情 */}
              {currentDoc.reviewResult === REVIEW_RESULT.REJECTED && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h5 className="font-medium text-red-800 mb-2">未通过原因</h5>
                  <p className="text-red-700">{mockData.rejectionReason}</p>
                </div>
              )}

              {/* 重新上传按钮（仅未通过时显示） */}
              {currentDoc.reviewResult === REVIEW_RESULT.REJECTED && (
                <button
                  onClick={handleReupload}
                  className="w-full py-3 rounded-lg font-medium transition-colors bg-green-600 text-white hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} />
                  重新上传
                </button>
              )}

              {/* 已通过时的提示 */}
              {currentDoc.reviewResult === REVIEW_RESULT.APPROVED && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-700 flex items-center gap-2">
                    <CheckCircle size={16} />
                    您的{currentDoc.name}已通过审核，请继续上传其他证件
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 开发调试按钮 */}
        {isDevelopment && (
          <div className="bg-gray-100 border-2 border-dashed border-gray-400 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-3 font-medium">🔧 开发调试</p>
            <div className="flex gap-3">
              <button
                onClick={handleDebugToggle}
                className="flex-1 py-2 rounded-lg bg-gray-300 text-gray-800 text-sm font-medium hover:bg-gray-400"
              >
                切换状态
              </button>
              {currentDoc.status === DOC_STATUS.UNDER_REVIEW && (
                <button
                  onClick={handleDebugReject}
                  className="flex-1 py-2 rounded-lg bg-red-300 text-red-800 text-sm font-medium hover:bg-red-400"
                >
                  模拟未通过
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              当前状态: {currentDoc.status} {currentDoc.reviewResult ? `(${currentDoc.reviewResult})` : ''}
            </p>
          </div>
        )}

        {/* 底部空间，防止内容被固定按钮遮挡 */}
        <div className="h-24"></div>
      </div>
      )}
    </TaskLayout>
  );
}
