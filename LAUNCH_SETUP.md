# CrewPathGuide 上线前配置清单

以下项目需要在推送本次代码后完成。密钥只填入平台后台，不要填进任何 `VITE_` 变量、源码或 Git 提交。

## 1. 轮换百炼密钥

`.env` 曾被 Git 跟踪过，因此当前 DashScope API Key 应视为已暴露。

1. 打开阿里云百炼的 API Key 管理页面。
2. 新建一条只供 CrewPathGuide 使用的 Key。
3. 在 Vercel 替换 `DASHSCOPE_API_KEY` 为新 Key。
4. 确认 Vercel 部署正常后，禁用或删除旧 Key。

不要把 Key 发到聊天、截图、GitHub 或前端代码里。

## 2. Vercel 环境变量

在 Vercel 项目中依次打开 `Settings` -> `Environment Variables`。以下变量都选择 `Production`；需要预览环境测试时，再额外勾选 `Preview`。

| 变量名 | 用途 | 是否可暴露给浏览器 |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | 前端连接 Supabase 的项目 URL | 可以 |
| `VITE_SUPABASE_ANON_KEY` | 前端 Supabase publishable/anon key | 可以 |
| `SUPABASE_URL` | `/api/interview` 验证登录状态 | 不可公开配置，但值本身可为项目 URL |
| `SUPABASE_ANON_KEY` | `/api/interview` 验证用户 JWT | 不可用 service-role key |
| `DASHSCOPE_API_KEY` | 千问文字与语音接口 | **绝不能**以 `VITE_` 开头 |
| `DASHSCOPE_BASE_URL` | 可选，默认兼容模式文字接口地址 | 否 |
| `DASHSCOPE_ASR_URL` | 可选，默认语音转写接口地址 | 否 |
| `DASHSCOPE_EVALUATION_MODEL` | 可选，例如 `qwen3.5-plus` | 否 |
| `DASHSCOPE_SCENARIO_MODEL` | 可选，例如 `qwen3.7-plus` | 否 |

更新变量后必须触发一次新的 Production Deploy。应用现在会在变量遗漏时明确报错，不会再静默连接默认项目。

## 3. Supabase 登录回跳

在 Supabase Dashboard 打开 `Authentication` -> `URL Configuration`：

- `Site URL`: `https://crewpathguide.com`
- `Redirect URLs`: 至少加入 `https://crewpathguide.com/**`
- 保留 Vercel 备用域名时，再加入 `https://sea-crew-guide.vercel.app/**`
- 本地开发可加入 `http://127.0.0.1:5173/**` 和 `http://localhost:5173/**`

这一步避免邮件确认、重置密码或 OAuth 登录回到错误域名。

## 4. 执行 Supabase SQL

按以下顺序在 Supabase `SQL Editor` 执行：

1. `supabase_products_and_entitlements.sql`：产品、岗位权益、AI 用量和幂等计次。
2. `supabase_support_requests.sql`：支持工单和 RLS 权限。
3. `supabase_manual_purchase_requests.sql`：首批人工收款的申请队列与管理员权限。
4. `supabase_founder_bar_server_upgrade.sql`：把已有创始会员升级为 Bar Server 全流程包。

第四份脚本设置的是 `365` 天、`120` 次 AI 反馈、`10` 次完整模拟面试；它不会覆盖已经有付款或激活来源的同岗位权益。执行后查看脚本末尾的查询结果，确认大约有 20 位创始用户。

## 5. 上线验收

用三个账号分别测试：

1. 未登录：能浏览公开内容，只在点击个性化或 AI 功能时要求登录。
2. 免费登录用户：可完成 Bar Server 三题体验，但无法进入付费场景和完整模拟。
3. 创始或付费用户：可进入完整训练，AI 反馈与完整模拟额度会在训练中心显示并递减。

最后从手机网络访问 `https://crewpathguide.com`，完成一次登录、一次三题体验、一次 AI 报告和一次支持工单提交。

## 6. 首批人工收款流程

1. 用户在 `/premium` 点击“申请人工开通”，获得订单编号。
2. 用户通过注册邮箱联系 `crewbroyu@gmail.com` 获取付款方式；先确认身份和产品，不在页面公开个人付款码。
3. 在微信人工核对到账后，管理员打开 `/generate-codes`，点击“查看人工开通申请”，找到订单并标记“核款完成”。
4. 选择“人工收款”，生成 `1` 条激活码并发送给用户；再将订单标记为“已发激活码”。
5. 用户在产品页输入单条码后，获得 Bar Server 包 `180` 天权益。退款或异常不要复用已发出的码。
