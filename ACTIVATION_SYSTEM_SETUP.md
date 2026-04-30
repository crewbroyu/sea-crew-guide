# 激活码解锁系统 - 完整设置指南

## 一、Supabase 数据库设置

### 1.1 创建表

在 Supabase 控制台执行以下 SQL：

```sql
-- 创建激活码表
CREATE TABLE IF NOT EXISTS activation_codes (
  code TEXT PRIMARY KEY,
  is_used BOOLEAN DEFAULT false,
  used_by TEXT,
  used_at TIMESTAMP,
  type TEXT,  -- 预留字段：basic / premium
  created_at TIMESTAMP DEFAULT now()
);

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_activation_codes_is_used ON activation_codes(is_used);
CREATE INDEX IF NOT EXISTS idx_activation_codes_code ON activation_codes(code);
```

### 1.2 添加测试激活码

```sql
-- 插入测试激活码
INSERT INTO activation_codes (code, type) VALUES
('TEST001', 'premium'),
('TEST002', 'premium'),
('TEST003', 'premium');
```

## 二、使用示例

### 2.1 在页面中使用激活码系统

```javascript
import { useState, useEffect } from 'react';
import ActivationCodeModal from '../components/ActivationCodeModal';
import { activationService } from '../services/activationService';

function SomeComponent() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // 检查解锁状态
    setIsUnlocked(activationService.isUnlocked());
  }, []);

  const handleUnlockSuccess = () => {
    setIsUnlocked(true);
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-12">
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">请先解锁完整内容</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium"
          >
            Unlock Full Guide
          </button>
        </div>
        <ActivationCodeModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={handleUnlockSuccess}
        />
      </div>
    );
  }

  return (
    <div>
      {/* 解锁后的完整内容 */}
    </div>
  );
}
```

## 三、提示文案汇总

### 3.1 弹窗文案（英文主，中文辅助）

| 位置 | 英文文案 | 中文辅助 |
|------|---------|---------|
| 标题 | Full guide is available via activation code | 完整内容需激活码解锁 |
| 说明 | Limited early access | 当前为内测阶段，名额有限 |
| 获取方式 | Get your code via WeChat | 添加微信获取激活码 |
| 成功提示 | Access granted. Full guide unlocked. | 已解锁完整内容 |
| 无效码 | Invalid code | - |
| 已使用码 | Code already used | - |
| 激活失败 | Activation failed | - |
| 空输入提示 | 请输入激活码 | - |

### 3.2 按钮文案

| 按钮 | 文案 |
|------|------|
| 解锁按钮 | Unlock Full Guide |
| 激活按钮 | Activate |
| 激活中 | 激活中... |

## 四、已创建文件

| 文件路径 | 说明 |
|---------|------|
| `src/components/ActivationCodeModal.jsx` | 激活码输入弹窗组件 |
| `src/services/activationService.js` | 激活码服务 |
| `ACTIVATION_SYSTEM_SETUP.md` | 本文档 |

## 五、系统特点

- ✅ 简单、稳定、可快速上线
- ✅ 一个激活码只能使用一次
- ✅ 激活状态持久化到 localStorage
- ✅ 错误处理完善（无效码/已使用码）
- ✅ 预留 type 字段用于未来扩展
- ✅ 国际化文案（英文主，中文辅助）
