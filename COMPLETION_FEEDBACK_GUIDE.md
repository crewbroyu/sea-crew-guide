# 完成反馈增强层（Completion Feedback Layer）使用指南

## 一、系统概述

完成反馈增强层是一个轻量级的提示系统，在用户完成任务时显示短暂的成就反馈，提升用户体验和继续前进的动力。

## 二、核心文件

| 文件 | 说明 |
|------|------|
| `src/components/CompletionHint.jsx` | 反馈提示组件 |
| `src/utils/completionMessages.js` | 提示文案配置 |

## 三、使用方法

### 1. 导入函数

```javascript
import { showCompletionHint } from '../components/CompletionHint';
```

### 2. 在任务完成时调用

```javascript
// 示例：任务1完成时
const handleTaskComplete = () => {
  // 原有的完成逻辑
  localStorage.setItem('task1_completed', 'true');
  
  // 显示完成反馈
  showCompletionHint(1);  // 参数是任务ID
  
  // 其他逻辑...
  navigate('/tasks');
};
```

## 四、任务ID映射

| 任务ID | 任务名称 | 文案类型 |
|--------|---------|---------|
| 1 | 海乘适配评估 | general |
| 2 | 岗位选择测评 | general |
| 3 | 预算设置 | general |
| 4 | 简历构建 | skills |
| 5 | 岗位英语课程 | skills |
| 6 | 面试技巧 | interview |
| 7 | 面试练习 | interview |
| 8 | AI模拟面试 | interview |
| 9 | 我的Offer | documents |
| 10 | 海乘职业资质 | documents |
| 11 | 登船准备 | onboard |
| 12 | 最终确认 | onboard |

## 五、文案配置

### 通用文案（general）
```javascript
{ en: 'Good progress. One step closer.', zh: '进展不错，又近一步。' }
{ en: 'Task completed. Keep going.', zh: '任务完成，继续前进。' }
{ en: 'Nice. You\'re moving forward.', zh: '很好，你正在前进。' }
```

### 海乘场景文案（onboard）
```javascript
{ en: 'Onboard mindset unlocked.', zh: '解锁登船心态。' }
{ en: 'Crew experience updated.', zh: '船员经验已更新。' }
{ en: 'You\'re getting closer to onboard reality.', zh: '离登船更近了。' }
```

### 技能提升文案（skills）
```javascript
{ en: 'Skill level up.', zh: '技能提升。' }
{ en: 'New skill acquired.', zh: '获得新技能。' }
{ en: 'You\'re building your path.', zh: '你正在建立自己的道路。' }
```

## 六、接入示例

### 任务1（Task1.jsx）

```javascript
import { showCompletionHint } from '../components/CompletionHint';

// 在测评完成时
const handleAssessmentComplete = () => {
  // 保存结果
  saveAssessmentResult();
  
  // 显示反馈
  showCompletionHint(1);
  
  // 跳转
  navigate('/tasks');
};
```

### 任务2（Task2.jsx）

```javascript
import { showCompletionHint } from '../components/CompletionHint';

// 在岗位选择完成时
const handlePositionSelect = () => {
  // 保存选择
  savePositionSelection();
  
  // 显示反馈
  showCompletionHint(2);
  
  // 跳转
  navigate('/tasks');
};
```

### 任务5（Task5Training.jsx）

```javascript
import { showCompletionHint } from '../components/CompletionHint';

// 在课程完成时
const handleCourseComplete = () => {
  // 标记课程完成
  markCourseAsCompleted();
  
  // 显示反馈
  showCompletionHint(5);
  
  // 更新UI
  updateProgress();
};
```

## 七、自定义文案

如需添加新文案，编辑 `src/utils/completionMessages.js`：

```javascript
export const completionMessages = {
  general: [
    { en: 'Your new message.', zh: '你的新文案。' },
    // ...
  ],
  // 添加新类型
  custom: [
    { en: 'Custom message.', zh: '自定义文案。' },
  ],
};

// 添加任务类型映射
export const taskTypeMap = {
  // ...
  13: 'custom',  // 新任务
};
```

## 八、注意事项

1. ✅ 只在任务真正完成时调用
2. ✅ 不阻断用户操作
3. ✅ 不影响原有逻辑
4. ✅ 提示会自动消失（2.5秒）
5. ✅ 文案随机显示，增加新鲜感

## 九、效果预览

完成反馈提示会：
- 从下方淡入
- 显示绿色渐变背景
- 展示英文主文案 + 中文辅助文案
- 2.5秒后自动消失

---

## 快速接入清单

- [ ] 导入 `showCompletionHint` 函数
- [ ] 在任务完成逻辑中调用
- [ ] 传入正确的任务ID
- [ ] 测试反馈提示是否正常显示
