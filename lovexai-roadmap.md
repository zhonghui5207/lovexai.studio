# Lovexai 项目后续开发计划

> **文档说明**: 本文档整理了 Lovexai 项目当前的技术债务、待完成功能和优化方向，可按优先级拆解为具体的开发任务。

---

## 📋 目录

- [1. 全局方向与架构](#1-全局方向与架构)
- [2. 前端展示层](#2-前端展示层)
- [3. 应用内核心功能](#3-应用内核心功能)
- [4. 后端接口与集成](#4-后端接口与集成)
- [5. Convex 数据层与业务逻辑](#5-convex-数据层与业务逻辑)
- [6. AI 生成能力](#6-ai-生成能力)
- [7. 付费与积分体系](#7-付费与积分体系)
- [8. 国际化与内容管理](#8-国际化与内容管理)
- [9. 可观测性、测试与 DevOps](#9-可观测性测试与-devops)
- [10. 安全性加固](#10-安全性加固)

---

## 1. 全局方向与架构

### 1.1 建立路线图文档
- [ ] 创建 `docs/roadmap.md`
- [ ] 将功能拆分为里程碑:
  - 聊天体验 (`app/[locale]/chat`)
  - 生成体验 (`app/[locale]/generate`)
  - 付费与运营 (`app/[locale]/pricing`)
- [ ] 映射到现有代码目录结构,便于按阶段追踪进度

### 1.2 统一 Params 类型处理
**问题**: 多个页面将 `params` 声明为 `Promise` 并使用 `await`

**影响文件**:
- `app/[locale]/layout.tsx`
- `app/[locale]/(default)/page.tsx`
- `app/[locale]/chat/page.tsx`

**行动项**:
- [ ] 统一 params 类型写法
- [ ] 避免未来 Next.js 版本升级时出错
- [ ] 考虑创建共享类型定义

---

## 2. 前端展示层

### 2.1 首屏性能优化

#### 问题诊断
核心板块 (HeroBanner、DiscoverSection、Testimonials) 完全依赖客户端 JS + Convex 查询

#### 解决方案
- [ ] 改用 Server Component + Suspense 预取数据
- [ ] 使用 `generateStaticParams` 预渲染静态页面
- [ ] 在组件内提供 fallback UI

### 2.2 导航系统优化

#### 问题
- Sidebar 和 Header 同时存在
- 侧边栏在服务器布局中默认渲染
- TopFilterBar 和 Sidebar 可能造成双层滚动

#### 行动项
- [ ] 梳理移动端/桌面端导航逻辑
- [ ] 统一导航组件的渲染策略
- [ ] 解决双层滚动问题

### 2.3 筛选功能打通

**文件**: `components/blocks/characters/TopFilterBar.tsx`

**问题**: TopFilterBar 只是视觉组件,未将筛选状态传回 DiscoverSection

**行动项**:
- [ ] 打通筛选上下文
- [ ] 使用 URL 参数同步筛选状态
- [ ] 实现筛选逻辑与角色列表联动

### 2.4 落地页内容一致性

**问题**:
- `components/blocks` 中多个区块 (faq, benefit, usage) 依赖 `i18n/pages/landing/*.json`
- `app/[locale]/(default)/page.tsx` 只渲染了 4 个区块

**行动项**:
- [ ] 补齐 JSON → 组件的映射
- [ ] 删除无用配置文件
- [ ] 保持落地页文案一致性

### 2.5 动画性能优化

**问题**: Tailwind 动画与 framer-motion 并用导致打包体积较大

**行动项**:
- [ ] 梳理动画策略
- [ ] 将常驻动画迁移到纯 CSS
- [ ] 交互动画保留 framer-motion
- [ ] 配置 `next/dynamic` 延迟加载动画组件

---

## 3. 应用内核心功能

### 3.1 聊天页面 (Chat)

#### 3.1.1 性能优化
**问题**: ChatWindow 一次性渲染全部历史消息

**行动项**:
- [ ] 实现虚拟列表渲染
- [ ] 使用分页 `useQuery(api.messages.list)`
- [ ] 优化长会话渲染性能

#### 3.1.2 积分扣除逻辑
**问题**: 
- `handleSend` 只依赖前端 CreditsContext 判断
- 后端无二次校验

**行动项**:
- [ ] 在 `messages.send` 或 `actions.generateResponse` 中添加原子扣费
- [ ] 实现前后端双重校验
- [ ] 添加扣费失败回滚机制

#### 3.1.3 生成设置持久化
**文件**: `GenerationSettingsModal`

**问题**: POV/Creativity/模型设置未写入数据库 (`messages` 表 `generation_settings` 字段未被赋值)

**行动项**:
- [ ] 在 `handleSendMessage` 中透传设置到 Convex
- [ ] 更新数据库 schema
- [ ] 实现设置的保存和读取

#### 3.1.4 积分不足提示优化
**问题**: InsufficientCreditsDialog 不实时同步 Convex 数据

**行动项**:
- [ ] 监听支付成功事件
- [ ] 在 Convex mutation 成功后推送更新
- [ ] 实现实时积分同步

### 3.2 发现页面 (Discover)

**文件**: `app/[locale]/(default)/discover/page.tsx`

#### 3.2.1 列表性能优化
**问题**: 直接使用 Convex list 返回的全量数组,无分页

**行动项**:
- [ ] 在 `convex/characters.ts` 提供分页和筛选的 query
- [ ] 前端结合 swiping 体验
- [ ] 实现滞留状态管理

#### 3.2.2 收藏功能持久化
**问题**: "喜欢列表" 仅存在前端状态 (`likedCharacters`),未写入数据库

**行动项**:
- [ ] 设计 `user_character_settings` 表
- [ ] 实现收藏 mutation
- [ ] 添加历史记录功能
- [ ] 参考 `convex/schema.ts` 已有概念补充

#### 3.2.3 匹配弹窗优化
**问题**: 创建会话时缺少 loading、错误状态和重复创建校验

**行动项**:
- [ ] 添加 loading 状态
- [ ] 实现错误处理和 toast 提示
- [ ] 防止重复创建会话
- [ ] 优化 `router.push` 逻辑

### 3.3 生成页面 (Generate)

**文件**: `app/[locale]/(default)/generate/page.tsx`

**问题**: 完全是前端 mock,无实际功能

**行动项**:
- [ ] 对接 `aisdk/kling` 或 OpenRouter
- [ ] 创建 `app/api/generate-image` 端点
- [ ] 实现排队机制
- [ ] 添加收费逻辑
- [ ] 实现异常处理
- [ ] 将生成记录存入 `convex/image_generations`

### 3.4 创建页面 (Create)

**文件**: `app/[locale]/(default)/create/page.tsx`

#### 3.4.1 表单持久化
**问题**: 表单状态只保存在前端

**行动项**:
- [ ] 创建 `POST /api/characters` 或 Convex mutation
- [ ] 与 image upload flow 联动
- [ ] 实现表单数据持久化

#### 3.4.2 统一头像上传流程
**问题**: `app/api/upload-image` 已能写入 R2,但 Create 页未调用

**行动项**:
- [ ] 实现文件选择/拖拽界面
- [ ] 添加上传进度显示
- [ ] 实现失败回滚机制
- [ ] 集成到角色创建流程

### 3.5 个人资料页面 (Profile)

**文件**: `app/[locale]/(default)/profile/page.tsx`

#### 3.5.1 数据集成
**问题**: 只依赖 `useAppContext().user`,无真实数据

**行动项**:
- [ ] 使用 Convex query 拉取:
  - 会话统计
  - Credits 日志
  - 角色列表
- [ ] 实现 NSFW 开关持久化
- [ ] 添加排序功能
- [ ] 存储用户偏好设置

#### 3.5.2 设置对话框
**问题**: ProfileSettingsDialog 只是 UI,无保存逻辑

**行动项**:
- [ ] 实现设置保存 mutation
- [ ] 添加表单验证
- [ ] 实现实时更新

### 3.6 定价页面 (Pricing)

**文件**: `app/[locale]/(default)/pricing/page.tsx`

#### 3.6.1 动态配置
**问题**: 计划和 credits 都是硬编码数组

**行动项**:
- [ ] 从 Convex 或 `services/page.ts` 加载动态配置
- [ ] 将配置提取到 `lib/constants`
- [ ] 实现配置热更新

#### 3.6.2 Checkout 参数规范化
**问题**: 
- Checkout 参数 hardcode
- 与 `app/api/checkout` 的 credits 字段解析不一致
- `parseInt(productId.split("_")[1])` 对于 `price_*` 格式会返回 NaN

**行动项**:
- [ ] 明确 credits 与 subscription 的 payload 结构
- [ ] 统一 product_id 命名规范
- [ ] 添加参数验证
- [ ] 实现错误处理

---

## 4. 后端接口与集成

### 4.1 Checkout 接口优化

**文件**: `app/api/checkout/route.ts`

#### 问题清单
1. 直接在 API Route 内实例化 ConvexHttpClient 和 Stripe
2. 缺少重试和日志
3. `valid_months` 由客户端传入,缺少白名单校验
4. 未区分一次性 credits vs subscription 的 credits 数值

#### 行动项
- [ ] 抽取服务层到 `services/stripe.ts`
- [ ] 添加 zod schema 校验
- [ ] 在后端根据 `product_id` 查配置,移除客户端 `valid_months`
- [ ] 在 Convex orders 表记录 `order_type` 与产品信息
- [ ] 在 `processPaidOrder` 中对应更新不同类型订单

### 4.2 Stripe Webhook 优化

**文件**: `app/api/stripe-notify/route.ts`

#### 行动项
- [ ] 添加 idempotency 机制 (防止 webhook 重放导致重复处理)
- [ ] 扩展 schema 支持 `paid_detail` 字段或删除冗余
- [ ] 返回 2xx 状态码 (避免 Stripe 频繁重试)
- [ ] 替换 `console.log` 为 structured logging
- [ ] 添加 webhook 签名验证

### 4.3 缺失 API 补充

#### 4.3.1 用户信息接口
- [ ] `/api/get-user-info` - 返回 Convex users + credits
  - 当前被 `contexts/app.tsx` 依赖但不存在
  - 考虑完全弃用该 fetch,改用 Convex query

#### 4.3.2 积分查询接口
- [ ] `/api/user/credits` - 读取 credits 表
  - 被 `CreditsContext.refreshCredits` 使用
  - 可直接使用 Convex query 替代

#### 4.3.3 反馈接口
- [ ] `/api/add-feedback` - 写入 Convex feedbacks 表
  - 被 `components/feedback` 提交使用

#### 4.3.4 其他接口
- [ ] `/api/get-user-conversations` - 获取用户会话列表
- [ ] `/api/user/orders` - 获取用户订单历史
- [ ] 考虑改为 Convex query 或保留 REST API (供第三方调用)

### 4.4 上传接口安全加固

**文件**: `app/api/upload-image/route.ts`

#### 当前状态
- ✅ 已验证文件类型/大小
- ❌ 无病毒扫描
- ❌ 无内容审查
- ❌ 未记录数据库

#### 行动项
- [ ] 添加 MIME 白名单验证
- [ ] 实现异常捕获
- [ ] 考虑结合 Cloudflare R2 的 signed URL
- [ ] 写入 `image_generations` 或 `uploads` 表
- [ ] 便于在 Profile 中读取上传历史

---

## 5. Convex 数据层与业务逻辑

### 5.1 Schema 表打通

**文件**: `convex/schema.ts`

以下表已存在但前端多数未使用:
- `generation_settings`
- `credits`
- `orders`
- `feedbacks`
- `image_generations`

#### 行动项
- [ ] **generation_settings**: 在 ChatWindow 中保存/读取 per-conversation 设置
- [ ] **credits**: 下沉到 CreditsContext 作为历史明细,在 pricing 页面显示
- [ ] **feedbacks**: 配合 `/api/add-feedback` 使用
- [ ] **image_generations**: 与生成页/上传 API 对接

### 5.2 消息发送权限校验

**文件**: `convex/messages.send`

**问题**: 只校验会话归属,未校验用户是否有权限访问角色 (`characters.access_level`)

**行动项**:
- [ ] 调用 `characters.canAccess`
- [ ] 在 mutation 中验证 `subscription_tier`
- [ ] 添加权限不足的错误提示

### 5.3 AI 响应生成优化

**文件**: `convex/actions.generateResponse`

#### 5.3.1 写操作优化
**问题**: 每个 token chunk 都调用 `ctx.runMutation`,写放过于频繁

**行动项**:
- [ ] 实现 batch 更新 (例如 200ms flush)
- [ ] 或使用 `ctx.db.patch` 直接写
- [ ] 减少数据库写入频率

#### 5.3.2 积分处理
**问题**: 
- 未处理 insufficient credits
- 只在调用结束时扣费

**行动项**:
- [ ] 在 action 开始前锁定额度
- [ ] 在 `users.deductCredits` 中抛错并回滚 placeholder message
- [ ] 实现原子扣费机制

#### 5.3.3 错误处理
**问题**: catch 块只执行 `console.error`

**行动项**:
- [ ] 添加超时逻辑
- [ ] 实现取消机制
- [ ] 添加用户可见的错误提示
- [ ] 实现错误上报

### 5.4 用户创建安全性

**文件**: `convex/users.ensureUser`

**问题**: 无鉴权 mutation,任何人都能创建用户

**行动项**:
- [ ] 在 Convex 中添加 secret token
- [ ] 或迁移到内部 action
- [ ] 通过 Next API proxy 加签
- [ ] 实现用户创建的鉴权机制

### 5.5 数据初始化

**文件**: `convex/seed.ts`

**问题**: 已写好角色模板但未执行

**行动项**:
- [ ] 在 README 或 `package.json` 中提供 `pnpm convex:seed` 命令
- [ ] 或在 Convex dashboard 中手动运行一次
- [ ] 添加 seed 执行文档

### 5.6 迁移计划更新

**文件**: `MIGRATION_PLAN.md`

**问题**: Phase 1 仍标记未完成,但代码已完成

**行动项**:
- [ ] 更新迁移文档状态
- [ ] 记录剩余技术债:
  - Supabase 遗留类型
  - `models/` 目录删除情况
- [ ] 补充新的迁移计划

---

## 6. AI 生成能力

### 6.1 多模型支持

**文件**: `convex/actions.generateResponse`

**问题**: 目前固定 `OPENAI_BASE_URL` 和 `modelName`

**行动项**:
- [ ] 引入多模型配置系统
- [ ] 支持按角色或用户 tier 切换模型:
  - gpt-4o-mini
  - deepseek
  - openrouter
- [ ] 将系统 prompt 提炼到 `lib/prompts`
- [ ] 实现模型切换逻辑

### 6.2 Kling API 集成

**文件**: `aisdk/kling`

**问题**: 已封装获取 token、建任务、查任务,但无任何调用

**行动项**:
- [ ] 创建 `/api/kling/generate` 端点
- [ ] 创建 `/api/kling/status` 端点
- [ ] 实现排队机制
- [ ] 添加回调机制
- [ ] 集成到生成页面

### 6.3 Prompt 模板管理

**问题**: 
- Prompt 模板使用 `char.description/personality/scenario` 等字段
- 需要在 UI 中允许编辑

**行动项**:
- [ ] 在 Convex seed 中补充完整字段
- [ ] 在角色创建/编辑 UI 中添加字段
- [ ] 处理缺少字段时的 fallback
- [ ] 实现 prompt 模板系统

### 6.4 内容审查

**行动项**:
- [ ] 添加 OpenAI moderations API 集成
- [ ] 或实现自定义内容审查规则
- [ ] 避免 NSFW 请求直接发送到模型
- [ ] 添加审查结果提示

---

## 7. 付费与积分体系

### 7.1 订单闭环优化

#### 7.1.1 订单列表 UI
**行动项**:
- [ ] 在 `app/[locale]/(default)/profile` 新增 "Orders/Payments" tab
- [ ] 从 Convex `orders` 查询订单历史
- [ ] 实现订单详情展示

#### 7.1.2 订单处理逻辑
**问题**: `processPaidOrder` 只根据 `product_name` 包含 premium/pro 推断 tier

**行动项**:
- [ ] 将 tier 写死在订单配置或 metadata
- [ ] 实现明确的 tier 映射
- [ ] 添加订单类型验证

### 7.2 订阅管理

#### 7.2.1 过期处理
**问题**: `orders` 表有 `expired_at`,但没定期 job 降级 `subscription_tier`

**行动项**:
- [ ] 通过 Convex scheduler 实现定期任务
- [ ] 或使用外部 cron job
- [ ] 实现订阅过期自动降级
- [ ] 添加过期提醒功能

#### 7.2.2 积分扣除记录
**问题**: credits 扣除只发生在 AI 回复时

**行动项**:
- [ ] 考虑在 `messages.send` 中记录用户发送消息的花费
- [ ] 实现详细的积分使用记录
- [ ] 添加积分使用历史查询

### 7.3 定价准确性

**问题**: "按年付减少 30%" 只是文案,未自动计算

**行动项**:
- [ ] 根据真实价格自动计算折扣
- [ ] 避免手动同步价格出错
- [ ] 实现动态折扣展示

---

## 8. 国际化与内容管理

### 8.1 翻译文件清理

**文件**: `i18n/messages/zh.json`, `i18n/messages/en.json`

**问题**: 内容主要面向旧版 (Supabase 模板),许多键未使用

**行动项**:
- [ ] 梳理实际使用的 translation key
- [ ] 删除或更新无用键
- [ ] 确保翻译完整性

### 8.2 组件国际化

**问题**: 
- HeroBanner、DiscoverSection 直接写英语文案
- 未使用 next-intl

**行动项**:
- [ ] 将硬编码文案抽取为翻译 key
- [ ] 实现动态加载
- [ ] 确保所有组件支持多语言

### 8.3 Landing 数据集成

**问题**: 
- Landing 数据通过 `getLandingPage(locale)` 获取
- HeroBanner 等组件未使用该数据

**行动项**:
- [ ] 决定数据使用策略:
  - 将 JSON 内容传递给组件
  - 或直接修改 JSON 结构
- [ ] 统一数据流

### 8.4 SEO 优化

**文件**: `app/[locale]/layout.tsx`

**问题**: metadata 只设置了 title/description/keywords

**行动项**:
- [ ] 添加 OG tags
- [ ] 添加 Twitter card
- [ ] 添加 robots meta
- [ ] 实现动态 metadata 生成

### 8.5 地域敏感性

**行动项**:
- [ ] 规范图片与文案的地域处理
- [ ] NSFW/AI 伴侣内容在不同语言需要不同处理策略
- [ ] 添加地域内容合规检查

---

## 9. 可观测性、测试与 DevOps

### 9.1 自动化测试

#### 9.1.1 单元测试
- [ ] 使用 `convex-test` 覆盖 Convex 函数
- [ ] 重点测试 credits/订单逻辑
- [ ] 添加边界情况测试

#### 9.1.2 E2E 测试
- [ ] 使用 Playwright 测试核心流程:
  - 登录 → 聊天 → 扣积分 → 支付 → 额度恢复
- [ ] 添加 CI/CD 集成
- [ ] 实现自动化回归测试

#### 9.1.3 组件测试
- [ ] 使用 Storybook 或 Chromatic
- [ ] 维护关键组件的视觉回归测试
- [ ] 建立组件库文档

### 9.2 构建与部署

#### 9.2.1 构建脚本优化
**问题**: `pnpm build` 执行 `npx convex deploy --cmd 'next build'`,在本地或 CI 会自动部署 Convex

**行动项**:
- [ ] 拆分为:
  - `build`: 只运行 `next build`
  - `deploy:convex`: 单独触发 Convex 部署
- [ ] 更新 CI/CD 配置
- [ ] 添加部署文档

#### 9.2.2 Docker 优化
**问题**: Dockerfile 只构建 Next 应用,未包含 Convex

**行动项**:
- [ ] 在部署说明中写清楚 Convex 另行部署
- [ ] 或提供 docker-compose 完整方案
- [ ] 添加环境变量配置文档

### 9.3 监控与日志

#### 9.3.1 错误上报
- [ ] 引入 Sentry 或 Datadog
- [ ] 监控 Next API
- [ ] 监控 Convex actions
- [ ] 监控 Stripe webhook

#### 9.3.2 性能指标
- [ ] 添加关键路径的性能监控
- [ ] 实现用户行为追踪
- [ ] 建立性能基准

#### 9.3.3 日志规范化
**问题**: `console.log` 遍布前后端

**行动项**:
- [ ] 统一日志层
- [ ] 前端使用 debug flag
- [ ] 后端使用 structured logger
- [ ] 实现日志分级

---

## 10. 安全性加固

### 10.1 认证安全

**问题**: 
- NextAuth 未配置 session.strategy
- Cookies 安全标志未设置
- signIn callback 没有封装邮箱白名单/封禁逻辑

**行动项**:
- [ ] 配置 session.strategy
- [ ] 设置 cookies 安全标志
- [ ] 实现邮箱白名单
- [ ] 添加用户封禁机制
- [ ] 实现安全策略文档

### 10.2 速率限制

**问题**: 以下端点容易被滥用
- `/api/checkout`
- `/api/upload-image`
- 其他公开 API

**行动项**:
- [ ] 引入 Upstash Ratelimit
- [ ] 或实现中间件速率限制
- [ ] 针对不同端点设置不同限制
- [ ] 添加超限提示

### 10.3 内容过滤

**问题**: 文件上传/生成/聊天涉及 NSFW 内容

**行动项**:
- [ ] 配合内容政策实施过滤
- [ ] 实现内容审查机制
- [ ] 添加用户举报功能
- [ ] 建立内容审核流程

---

## 📊 优先级建议

### P0 - 核心功能 (立即处理)
1. 聊天页面积分扣除后端校验
2. Stripe webhook idempotency
3. 用户创建安全性加固
4. 速率限制实施

### P1 - 用户体验 (1-2 周内)
1. 首屏性能优化 (Server Component)
2. 聊天历史虚拟列表
3. 发现页面分页
4. 生成设置持久化
5. 订单列表 UI

### P2 - 功能完善 (2-4 周内)
1. 生成页面实际功能实现
2. 创建页面持久化
3. 多模型支持
4. 订阅过期处理
5. 国际化清理

### P3 - 优化与监控 (持续进行)
1. 自动化测试
2. 监控与日志
3. 文档完善
4. 动画性能优化
5. SEO 优化

---

## 📝 使用建议

1. **按模块拆解**: 将每个章节拆解为独立的 GitHub Issue 或 Jira Task
2. **设置里程碑**: 根据优先级设置 Sprint 目标
3. **定期更新**: 完成任务后及时更新此文档
4. **团队协作**: 为每个任务分配负责人和预估时间
5. **持续集成**: 将完成的任务合并到主分支,保持代码质量

---

**文档版本**: v1.0  
**最后更新**: 2024-12-03  
**维护者**: Samuellyn DaSilver
