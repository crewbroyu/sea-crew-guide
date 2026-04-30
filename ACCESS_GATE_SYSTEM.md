# 权限拦截系统（Activation Gate System）使用指南

## 一、系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        App.jsx                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    AccessGate                            │ │
│  │  ┌─────────────────┐  ┌─────────────────┐               │ │
│  │  │  RegisterModal  │  │   UnlockModal   │               │ │
│  │  └─────────────────┘  └─────────────────┘               │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   ProtectedRoute                         │ │
│  │  ┌─────────────────────────────────────────────────────┐│ │
│  │  │              需要保护的路由                          ││ │
│  │  │  - 任务5                                             ││ │
│  │  │  - 海乘学院（海乘百科除外）                          ││ │
│  │  │  - 求职中心所有模块                                  ││ │
│  │  └─────────────────────────────────────────────────────┘│ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 二、核心组件

### 1. 全局状态管理（accessStore.js）
- 用户注册状态
- 激活解锁状态
- 弹窗显示状态

### 2. 权限控制 Hook（useAccessGuard.js）
- `canAccess(pathname)` - 检查是否可以访问路由
- `guardRoute(pathname)` - 拦截路由访问
- `guardClick(targetPath, callback)` - 拦截点击事件

### 3. 弹窗组件
- `RegisterModal` - 注册弹窗
- `UnlockModal` - 解锁弹窗
- `AccessGate` - 全局弹窗管理

### 4. 路由守卫
- `ProtectedRoute` - 保护需要权限的路由

## 三、拦截规则

| 模块 | 路由 | 是否需要解锁 |
|------|------|-------------|
| 首页 | / | ❌ 免费 |
| 登船路径 | /tasks | ❌ 免费 |
| 任务1-4 | /tasks/Task1-4 | ❌ 免费 |
| **任务5** | /tasks/phase2/Task5 | ✅ 需要解锁 |
| 任务6-12 | /tasks/phase2/Task6-12 | ❌ 免费 |
| 海乘学院首页 | /academy | ❌ 免费 |
| **听说训练** | /academy/listening-speaking | ✅ 需要解锁 |
| **登船准备** | /academy/boarding | ✅ 需要解锁 |
| 海乘百科 | /academy/wiki | ❌ 免费 |
| **岗位英语** | /academy/position-english | ✅ 需要解锁 |
| **面试题库** | /academy/interview-questions | ✅ 需要解锁 |
| **场景训练** | /academy/scenarios | ✅ 需要解锁 |
| **港口日常** | /academy/port-daily | ✅ 需要解锁 |
| 求职中心首页 | /jobs | ❌ 免费 |
| **所有求职模块** | /jobs/* | ✅ 需要解锁 |

## 四、使用示例

### 示例1：在现有页面中检查权限（不修改页面逻辑）

```javascript
// ❌ 不需要修改现有页面代码
// 权限拦截已经通过 ProtectedRoute 在路由层实现

// ✅ 只需要在 App.jsx 中用 ProtectedRoute 包装需要保护的路由
<Route 
  path="/academy/position-english" 
  element={<ProtectedRoute><PositionEnglish /></ProtectedRoute>} 
/>
```

### 示例2：在按钮点击时检查权限

```javascript
import { useAccessGuard } from '../hooks/useAccessGuard';

function MyComponent() {
  const { guardClick } = useAccessGuard();

  const handleClick = () => {
    // 执行操作
  };

  return (
    <button onClick={guardClick('/some-protected-path', handleClick)}>
      点击访问
    </button>
  );
}
```

### 示例3：手动检查权限状态

```javascript
import { useAccessGuard } from '../hooks/useAccessGuard';

function MyComponent() {
  const { isRegistered, isUnlocked, canAccess } = useAccessGuard();

  useEffect(() => {
    const result = canAccess('/academy/position-english');
    if (!result.canAccess) {
      console.log('需要:', result.reason); // 'register' 或 'unlock'
    }
  }, []);

  return <div>...</div>;
}
```

## 五、弹窗文案

### 注册弹窗
```
Welcome to Sea Crew Guide
欢迎来到海乘指南

Email *
Name (Optional)

[Continue]
```

### 解锁弹窗
```
Full access requires activation
完整功能需激活后使用

Limited early access
当前为内测阶段，名额有限

[Enter activation code]

[Activate Code]

Get your code via WeChat
添加微信获取激活码
```

### 激活成功
```
Access granted. Full guide unlocked.
已解锁完整内容
```

## 六、已创建的文件

| 文件路径 | 说明 |
|---------|------|
| `src/store/accessStore.js` | 全局状态管理 |
| `src/hooks/useAccessGuard.js` | 权限控制 Hook |
| `src/components/RegisterModal.jsx` | 注册弹窗组件 |
| `src/components/UnlockModal.jsx` | 解锁弹窗组件 |
| `src/components/AccessGate.jsx` | 全局弹窗管理 |
| `src/components/ProtectedRoute.jsx` | 路由守卫组件 |
| `ACCESS_GATE_SYSTEM.md` | 本文档 |

## 七、测试流程

1. **首次访问** → 自动弹出注册弹窗
2. **注册成功** → 可以访问免费内容
3. **访问付费内容** → 弹出解锁弹窗
4. **输入激活码** → 解锁所有功能
5. **解锁后** → 正常访问所有内容

## 八、Supabase 数据库配置

在 Supabase 控制台执行以下 SQL：

```sql
-- 创建激活码表
CREATE TABLE IF NOT EXISTS activation_codes (
  code TEXT PRIMARY KEY,
  is_used BOOLEAN DEFAULT false,
  used_by TEXT,
  used_at TIMESTAMP,
  type TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_activation_codes_is_used ON activation_codes(is_used);
CREATE INDEX IF NOT EXISTS idx_activation_codes_code ON activation_codes(code);

-- 插入测试激活码
INSERT INTO activation_codes (code, type) VALUES
('TEST001', 'premium'),
('TEST002', 'premium'),
('TEST003', 'premium');
```

## 九、注意事项

1. ✅ 不修改现有页面组件逻辑
2. ✅ 不重构页面结构
3. ✅ 所有拦截逻辑集中管理
4. ✅ 通过路由层拦截，不侵入业务代码
5. ✅ 弹窗状态全局管理，避免散落各处
