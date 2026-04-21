import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, AlertTriangle, Camera, ArrowLeft } from 'lucide-react';

export default function Task12() {
  const navigate = useNavigate();
  
  // 状态管理
  const [checkedItems, setCheckedItems] = useState({});
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showDepartureConfirm, setShowDepartureConfirm] = useState(false);

  // 切换物品勾选状态
  const toggleItem = (category, item) => {
    setCheckedItems(prev => ({
      ...prev,
      [`${category}-${item}`]: !prev[`${category}-${item}`]
    }));
  };

  // 处理照片上传
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // 计算完成进度
  const calculateProgress = () => {
    const allItems = [
      // 必带文件
      ...requiredDocuments.flatMap(category => category.items.map(item => item.name)),
      // 必带随身物品
      ...essentialItems.flatMap(category => category.items.map(item => item.name))
    ];
    
    const checkedCount = allItems.filter(item => 
      checkedItems[`document-${item}`] || checkedItems[`item-${item}`]
    ).length;
    
    return {
      count: checkedCount,
      total: allItems.length,
      percentage: allItems.length > 0 ? Math.round((checkedCount / allItems.length) * 100) : 0
    };
  };

  // 完成任务
  const handleComplete = () => {
    const boardingProgress = JSON.parse(localStorage.getItem('boarding_progress') || '{}');
    boardingProgress.task12 = {
      completed: true,
      completedAt: new Date().toISOString(),
      itemsChecked: calculateProgress().count,
      hasDeparturePhoto: !!photo
    };
    localStorage.setItem('boarding_progress', JSON.stringify(boardingProgress));
    setIsCompleted(true);
    alert('✅ 登船必带清单任务已完成！');
    navigate('/tasks');
  };

  // 必带文件
  const requiredDocuments = [
    {
      category: '证件类',
      items: [
        { name: '护照原件（有效期至少6个月）' },
        { name: '海员证' },
        { name: '船员服务簿' },
        { name: '健康证' },
        { name: '国际旅行健康检查证明书' },
        { name: '无犯罪记录证明' }
      ]
    },
    {
      category: '公司文件',
      items: [
        { name: '邮轮合同原件' },
        { name: '雇佣确认函' },
        { name: '上船通知' }
      ]
    },
    {
      category: '辅助文件',
      items: [
        { name: '两寸证件照（至少5张）' },
        { name: '学历证明复印件' },
        { name: '疫苗接种证明' }
      ]
    }
  ];

  // 必带随身物品
  const essentialItems = [
    {
      category: '钱',
      items: [
        { name: '现金（美元，至少500美元）' },
        { name: '信用卡' },
        { name: '零钱（用于小费）' }
      ]
    },
    {
      category: '电子设备',
      items: [
        { name: '手机及充电器' },
        { name: '转换插头' },
        { name: '移动电源' }
      ]
    },
    {
      category: '应急用品',
      items: [
        { name: '常用药（感冒药、消炎药等）' },
        { name: '口罩' },
        { name: '消毒湿巾' },
        { name: '笔和小本子' }
      ]
    }
  ];

  // 新人常见错误
  const commonMistakes = [
    {
      mistake: '将重要证件放在托运行李中',
      consequence: '行李延误或丢失，无法登船',
      tip: '所有证件必须随身携带'
    },
    {
      mistake: '没有准备足够的现金',
      consequence: '登船初期无法购买必需品',
      tip: '至少准备500美元现金'
    },
    {
      mistake: '忘记带转换插头',
      consequence: '无法给电子设备充电',
      tip: '提前了解船上插座类型'
    },
    {
      mistake: '没有备份重要文件',
      consequence: '证件丢失后无法快速补办',
      tip: '将所有证件扫描备份到手机'
    }
  ];

  const progress = calculateProgress();
  const isAllChecked = progress.total > 0 && progress.count === progress.total;

  return (
    <div className="min-h-screen bg-gray-50 pb-48">
      {/* 顶部导航 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 pt-4 pb-5">
        <div className="flex items-center mb-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20"
          >
            ←
          </button>
          <span className="ml-3 text-sm text-blue-100">任务 12 / 12</span>
        </div>
        <h1 className="text-xl font-bold">📋 登船必带清单</h1>
        <p className="text-blue-100 text-sm mt-1">
          Essential Items for Boarding
        </p>
      </div>

      {/* 主要内容 */}
      <div className="flex-1 px-6 py-6">
        {/* 顶部核心提示 */}
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-6">
          <p className="text-red-700 font-medium">
            ⚠️ 所有重要文件必须随身携带，不能托运！
          </p>
        </div>

        {/* 打包进度 */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <h3 className="font-medium text-gray-800 mb-2">准备进度</h3>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">{progress.count} / {progress.total} 项</span>
            <span className="text-sm font-medium text-blue-600">{progress.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all" 
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* 必带文件 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-medium text-gray-800 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-600" />
              必带文件（必须随身携带）
            </h3>
          </div>
          <div className="p-4 space-y-4">
            {requiredDocuments.map((category) => (
              <div key={category.category}>
                <h4 className="font-medium text-gray-700 mb-2">{category.category}</h4>
                <div className="space-y-2">
                  {category.items.map((item) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <button
                        onClick={() => toggleItem('document', item.name)}
                        className="flex-shrink-0"
                      >
                        {checkedItems[`document-${item.name}`] ? (
                          <CheckCircle2 size={20} className="text-green-500" />
                        ) : (
                          <Circle size={20} className="text-gray-300" />
                        )}
                      </button>
                      <span className="text-gray-800">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 必带随身物品 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-medium text-gray-800 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-green-600" />
              必带随身物品
            </h3>
          </div>
          <div className="p-4 space-y-4">
            {essentialItems.map((category) => (
              <div key={category.category}>
                <h4 className="font-medium text-gray-700 mb-2">{category.category}</h4>
                <div className="space-y-2">
                  {category.items.map((item) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <button
                        onClick={() => toggleItem('item', item.name)}
                        className="flex-shrink-0"
                      >
                        {checkedItems[`item-${item.name}`] ? (
                          <CheckCircle2 size={20} className="text-green-500" />
                        ) : (
                          <Circle size={20} className="text-gray-300" />
                        )}
                      </button>
                      <span className="text-gray-800">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 新人常见错误 */}
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 mb-6">
          <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
            <AlertTriangle size={18} />
            新人常见错误
          </h3>
          <div className="space-y-3">
            {commonMistakes.map((item, index) => (
              <div key={index} className="bg-white p-3 rounded-lg shadow-sm">
                <p className="font-medium text-gray-800">{item.mistake}</p>
                <p className="text-sm text-gray-600 mt-1">→ 后果：{item.consequence}</p>
                <p className="text-xs text-green-600 mt-1">💡 建议：{item.tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 出发确认模块 */}
        {isAllChecked && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <Camera size={18} className="text-blue-600" />
              出发确认（可选）
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              📸 上传一张机场或出发照片，记录这个重要时刻！
            </p>
            <div className="space-y-3">
              {photoPreview ? (
                <div className="relative">
                  <img 
                    src={photoPreview} 
                    alt="出发照片" 
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => {
                      setPhoto(null);
                      setPhotoPreview(null);
                    }}
                    className="absolute top-2 right-2 bg-white/80 rounded-full p-1"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handlePhotoUpload}
                  />
                  <Camera size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">点击或拖拽上传照片</p>
                  <p className="text-xs text-gray-500 mt-1">可选，不影响任务完成</p>
                </label>
              )}
            </div>
          </div>
        )}

        {/* 完成按钮 */}
        {isAllChecked && (
          <button
            onClick={handleComplete}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-lg shadow-green-500/25"
          >
            ✅ 完成登船必带清单
          </button>
        )}
      </div>
    </div>
  );
}