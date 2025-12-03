# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📋 **文档版本信息**

- **最后更新**: 2024-12-03
- **项目状态**: Production Ready - 核心功能完整运行
- **当前版本**: v1.6.0
- **主要技术栈**: Next.js 15 + Convex + NextAuth.js + Vercel AI SDK

---

## 🎯 **项目概述**

**LoveXAI Studio** - AI角色聊天平台

### **核心定位**
- AI驱动的角色对话体验平台
- 强调沉浸式剧情化互动
- 双重货币化模式（订阅 + 积分）

### **技术架构特点**
- **前端**: Next.js 15 App Router + React 19
- **数据库**: Convex (实时数据库)
- **认证**: NextAuth.js v5
- **AI集成**: Vercel AI SDK + Tu-zi API (OpenAI Compatible)
- **支付**: Stripe
- **样式**: Tailwind CSS + Shadcn UI
- **国际化**: next-intl

---

## 🚀 **开发命令**

```bash
# 开发环境
pnpm dev                  # 启动开发服务器（使用Turbopack）

# 构建部署
pnpm build               # Convex部署 + Next.js构建
pnpm start               # 启动生产服务器

# 代码质量
pnpm lint                # ESLint检查

# 分析工具
pnpm analyze             # 打包体积分析

# Cloudflare部署
pnpm cf:build            # Cloudflare Pages构建
pnpm cf:preview          # 预览Cloudflare部署
pnpm cf:deploy           # 部署到Cloudflare

# Docker
pnpm docker:build        # 构建Docker镜像
```

---

## 📁 **项目结构**

```
lovexai.studio/
├── app/                          # Next.js 15 App Router
│   ├── [locale]/                # 国际化路由
│   │   ├── (default)/           # 默认布局组
│   │   │   ├── page.tsx         # 首页（Landing Page）
│   │   │   ├── discover/        # 角色发现页
│   │   │   ├── generate/        # 图片生成页
│   │   │   ├── create/          # 角色创建页
│   │   │   ├── profile/         # 用户个人中心
│   │   │   └── pricing/         # 定价页面
│   │   ├── chat/                # 聊天页面（独立布局）
│   │   │   └── page.tsx         # 统一聊天界面
│   │   ├── pay-success/         # 支付成功页
│   │   └── auth/                # 认证相关页面
│   └── api/                     # Next.js API Routes
│       ├── auth/                # NextAuth.js端点
│       ├── checkout/            # Stripe结账
│       ├── stripe-notify/       # Stripe Webhook
│       └── upload-image/        # 图片上传（R2）
│
├── convex/                      # Convex后端（实时数据库）
│   ├── schema.ts                # 数据库Schema定义
│   ├── users.ts                 # 用户查询和变更
│   ├── characters.ts            # 角色管理
│   ├── conversations.ts         # 对话管理
│   ├── messages.ts              # 消息管理
│   ├── orders.ts                # 订单管理
│   ├── actions.ts               # AI生成Action（流式响应）
│   └── seed.ts                  # 数据初始化
│
├── components/                  # React组件
│   ├── blocks/                  # Landing Page区块
│   │   ├── landing/             # 首页组件
│   │   ├── characters/          # 角色相关组件
│   │   └── Header.tsx           # 全局Header
│   ├── chat/                    # 聊天相关组件
│   │   ├── ChatInterface.tsx    # 主聊天界面
│   │   ├── ChatWindow.tsx       # 消息窗口
│   │   ├── ChatSidebar.tsx      # 对话历史侧边栏
│   │   ├── CharacterPanel.tsx   # 角色信息面板
│   │   └── MessageInput.tsx     # 消息输入框
│   ├── ui/                      # Shadcn UI组件库
│   └── ...
│
├── contexts/                    # React Contexts
│   ├── app.tsx                  # 全局应用状态
│   └── credits.tsx              # 积分系统状态
│
├── i18n/                        # 国际化配置
│   ├── messages/                # 全局翻译文件
│   │   ├── en.json
│   │   └── zh.json
│   └── pages/landing/           # 页面级翻译
│
├── lib/                         # 工具库
│   ├── constants.ts             # 常量定义
│   └── utils.ts                 # 工具函数
│
├── types/                       # TypeScript类型定义
│   └── chat.d.ts                # 聊天相关类型
│
├── data/                        # 历史遗留（Supabase SQL）
│   └── database_schema.sql      # ⚠️ 不再使用，项目已迁移到Convex
│
└── public/                      # 静态资源
    └── fonts/                   # 本地字体文件
```

---

## 🗄️ **数据库架构（Convex Schema）**

### **核心表结构**

#### **users** - 用户表
```typescript
{
  email: string;
  name: string;
  avatar_url?: string;
  subscription_tier: "free" | "basic" | "pro" | "ultra";
  credits_balance: number;
  subscription_expires_at?: string;
  invite_code?: string;
  invited_by?: string;
  tokenIdentifier?: string; // NextAuth关联
}
```

#### **characters** - 角色表
```typescript
{
  name: string;
  username: string;
  description: string;
  personality: string;
  traits?: string[];
  avatar_url?: string;
  greeting_message: string;

  // 剧情化字段（核心沉浸感系统）
  scenario?: string;          // 剧情情景设定
  current_state?: string;     // 当前状态/进展
  motivation?: string;        // 角色动机
  background?: string;        // 背景介绍
  suggestions?: string;       // 对话建议（JSON字符串）

  // 访问控制
  access_level: "free" | "basic" | "pro" | "ultra";
  credits_per_message: number;

  // 元数据
  is_active: boolean;
  is_premium: boolean;
  sort_order: number;
  chat_count: string;
  search_text?: string;       // 全文搜索字段
}
```

#### **conversations** - 对话表
```typescript
{
  user_id: string;            // Convex User ID
  character_id: Id<"characters">;
  title: string;
  is_archived: boolean;
  last_message_at: string;
  message_count: number;
  total_credits_used: number;
}
```

#### **messages** - 消息表
```typescript
{
  conversation_id: Id<"conversations">;
  sender_type: "user" | "character";
  content: string;
  credits_used: number;
  generation_settings?: any;  // JSON对象
}
```

#### **orders** - 订单表
```typescript
{
  order_no: string;
  user_id: string;
  user_email: string;
  status: "created" | "paid" | "deleted";
  amount: number;
  credits: number;
  currency: string;
  stripe_session_id?: string;
  paid_at?: string;

  // 订阅信息
  sub_id?: string;
  sub_interval?: string;
  product_id?: string;
  product_name?: string;
  expired_at?: string;
}
```

#### **credits** - 积分交易历史
```typescript
{
  user_id: string;
  trans_no?: string;
  order_no?: string;
  expired_at?: string;
  amount: number;
  type: "purchase" | "bonus" | "usage";
}
```

#### **generation_settings** - 生成设置
```typescript
{
  conversation_id: Id<"conversations">;
  response_length: string;
  include_narrator: boolean;
  narrator_voice: string;
  selected_model: string;
}
```

#### **image_generations** - 图片生成记录
```typescript
{
  user_id: string;
  prompt: string;
  revised_prompt?: string;
  image_url: string;
  storage_key?: string;
  model: string;
  status: "completed" | "failed";
  credits_cost: number;
}
```

#### **feedbacks** - 用户反馈
```typescript
{
  user_id: string;
  content: string;
  type: string;
  status: string;
}
```

---

## 🔥 **核心功能实现状态**

### ✅ **已完成并稳定运行**

#### **1. 用户认证系统**
- **技术**: NextAuth.js v5 + Convex集成
- **实现**: `app/api/auth/[...nextauth]/route.ts`
- **用户同步**: `convex/users.ts::ensureUser`
- **状态**: ✅ 完全稳定

#### **2. 角色系统**
- **角色管理**: `convex/characters.ts`
- **剧情化字段**: scenario/current_state/motivation/background/suggestions
- **访问控制**: 基于subscription_tier的分层访问
- **状态**: ✅ 12个角色，剧情化系统完整

#### **3. 聊天系统**
- **统一聊天页**: `app/[locale]/chat/page.tsx`
- **实时消息**: Convex实时订阅
- **流式AI响应**: `convex/actions.ts::generateResponse`
- **消息管理**: `convex/messages.ts`
- **状态**: ✅ 核心功能完整，用户体验流畅

#### **4. AI集成**
- **提供商**: Tu-zi API (OpenAI Compatible)
- **SDK**: Vercel AI SDK (`streamText`)
- **系统提示词**: 数据库驱动，动态生成
- **AI参数**: Temperature 0.9-1.0（最大创造性）
- **状态**: ✅ 沉浸感优秀，角色扮演效果达标

#### **5. 积分系统**
- **积分扣除**: AI成功响应后扣费
- **余额管理**: `convex/users.ts::deductCredits`
- **实时更新**: Convex订阅自动同步
- **交易历史**: `credits`表记录所有交易
- **状态**: ✅ 完整实现

#### **6. 支付系统**
- **支付网关**: Stripe
- **结账流程**: `app/api/checkout/route.ts`
- **Webhook**: `app/api/stripe-notify/route.ts`
- **订单管理**: `convex/orders.ts`
- **状态**: ✅ 基础功能完整

#### **7. 角色发现页**
- **页面**: `app/[locale]/(default)/discover/page.tsx`
- **Swipe交互**: 类Tinder卡片滑动
- **筛选功能**: 前端状态管理
- **状态**: ✅ 基础功能完整

#### **8. 图片生成页**
- **页面**: `app/[locale]/(default)/generate/page.tsx`
- **UI**: 风格选择、比例控制、提示词输入
- **状态**: ⚠️ 前端UI完整，后端API未实现

---

## 🚨 **已知问题和技术债务**

### **P0 - 紧急修复（影响用户资金安全）**

#### **问题1: 积分扣除时机不当（已修复）**
- **文件**: `convex/actions.ts:153-159`
- **当前实现**: AI生成成功后扣费（✅ 正确）
- **状态**: ✅ 已正确实现，无重复扣费

#### **问题2: 错误处理不完善**
- **文件**: `convex/actions.ts:160-163`
- **问题**: catch块只记录错误，未删除失败的placeholder消息
- **影响**: AI生成失败时用户看到空消息
- **优先级**: P0

#### **问题3: 速率限制缺失**
- **影响端点**:
  - `/api/checkout`
  - `/api/upload-image`
  - 所有公开API
- **风险**: 可能被滥用
- **优先级**: P0

### **P1 - 用户体验优化（本周内）**

#### **问题4: 聊天历史性能**
- **文件**: `components/chat/ChatWindow.tsx`
- **问题**: 一次性渲染全部历史消息
- **解决方案**: 实现虚拟列表或分页加载
- **优先级**: P1

#### **问题5: 首屏性能**
- **问题**: Landing Page完全依赖客户端渲染
- **解决方案**: 改用Server Components + Suspense
- **优先级**: P1

#### **问题6: 图片生成功能未实现**
- **文件**: `app/[locale]/(default)/generate/page.tsx`
- **状态**: UI完整，后端API缺失
- **需要**: 集成Kling API或其他图片生成服务
- **优先级**: P2

### **P2 - 功能完善（2-4周）**

#### **问题7: 订阅过期处理**
- **问题**: 无定期任务检查订阅到期
- **解决方案**: Convex scheduler或外部cron
- **优先级**: P2

#### **问题8: 角色创建功能**
- **文件**: `app/[locale]/(default)/create/page.tsx`
- **状态**: 前端表单完整，后端持久化未实现
- **优先级**: P2

#### **问题9: 国际化清理**
- **问题**: 部分组件硬编码文案
- **影响**: HeroBanner、DiscoverSection等
- **优先级**: P2

---

## 🎯 **角色体验优化进展**

### **系统提示词架构（已完成）**

**文件**: `convex/actions.ts:64-101`

#### **核心特点**
- ✅ **数据库驱动**: 基于scenario/current_state/motivation动态生成
- ✅ **强制沉浸**: 禁止AI助手认知，强化角色扮演
- ✅ **动作描述**: 要求使用`*斜体*`格式
- ✅ **动态个性化**: `getPersonalityGuidance()`根据性格调整指令
- ✅ **格式多样性**: 防止回复模式固化

#### **系统提示词结构**
```typescript
=== WHO YOU ARE ===
${char.description}
Personality: ${char.personality}
Core traits: ${traits}

=== THE SCENARIO (MOST IMPORTANT) ===
${char.scenario}
CURRENT SITUATION: ${char.current_state}
YOUR INNER DRIVE: ${char.motivation}

=== RESPONSE GUIDELINES ===
FORMAT:
- Use *italics* for actions
- NO emojis
- NEVER write "Character does..."

STRUCTURE VARIETY:
• Action → dialogue
• Dialogue → action
• Reaction

PERSONALITY EXPRESSION:
${getPersonalityGuidance(personality, traits)}

AUTHENTICITY:
- Live in THIS scenario, THIS moment
- React naturally to tension/flirtation
- Don't deflect or redirect
```

#### **AI参数配置**
```typescript
{
  model: "gpt-4o-mini" (可配置),
  temperature: 动态（通常0.9-1.0）,
  system: systemPrompt,
  stream: true
}
```

### **已验证角色效果**

根据最近的Git提交记录和代码，角色系统已经过多次迭代优化：

- ✅ **角色数据完整**: 12个角色包含完整剧情化字段
- ✅ **动态个性化指导**: 根据personality/traits生成差异化指令
- ✅ **流式响应**: 实时更新消息内容
- ✅ **积分系统集成**: AI成功后扣费
- ✅ **对话历史显示**: 最后消息在聊天列表中展示

---

## 💳 **货币化系统**

### **双重模式**

#### **1. 订阅系统**
- **层级**: Free / Basic / Pro / Ultra
- **控制**: 角色访问权限（access_level）
- **实现**:
  - 前端: `app/[locale]/(default)/pricing/page.tsx`
  - 后端: `convex/orders.ts::processPaidOrder`

#### **2. 积分系统**
- **用途**: AI消息生成计费
- **价格**: 按角色差异化（`credits_per_message`）
- **充值**: Stripe支付购买积分包
- **实现**:
  - 扣费: `convex/actions.ts::generateResponse`
  - 余额管理: `convex/users.ts::deductCredits`
  - 历史记录: `credits`表

### **支付流程**

```
用户点击购买
    ↓
app/api/checkout/route.ts
    ↓
创建Stripe Checkout Session
    ↓
用户完成支付
    ↓
Stripe发送Webhook
    ↓
app/api/stripe-notify/route.ts
    ↓
convex/orders.ts::processPaidOrder
    ↓
更新用户credits_balance或subscription_tier
```

---

## 🔧 **开发工作流指南**

### **架构原则**

#### ✅ **DO - 推荐做法**
1. **Convex优先**: 所有数据操作使用Convex query/mutation/action
2. **实时订阅**: 使用`useQuery`自动同步数据
3. **Server Components**: 静态内容使用Server Components预渲染
4. **类型安全**: 充分利用Convex生成的类型定义
5. **错误处理**: 所有异步操作添加try-catch和用户提示

#### ❌ **DON'T - 禁止做法**
1. **绕过Convex**: 不要直接访问数据库
2. **硬编码配置**: 价格、角色数据等应从数据库读取
3. **忽略积分检查**: 所有AI操作前检查用户余额
4. **跳过认证**: 所有敏感操作必须验证用户身份
5. **前端存储敏感数据**: API密钥等必须在后端

### **新功能开发流程**

#### **1. 调研阶段**
```bash
# 搜索相关功能
使用Glob/Grep查找类似实现

# 理解现有架构
阅读相关Convex schema和mutations

# 检查依赖关系
了解数据流和组件依赖
```

#### **2. 设计阶段**
- 扩展Convex schema（如需要）
- 设计API接口和数据流
- 考虑错误处理和边界情况
- 评估对现有功能的影响

#### **3. 实现阶段**
```typescript
// 示例：添加新的角色筛选功能

// 1. 扩展Convex query
// convex/characters.ts
export const searchByTags = query({
  args: { tags: v.array(v.string()) },
  handler: async (ctx, args) => {
    // 实现逻辑
  }
});

// 2. 前端组件调用
// components/discover/FilterPanel.tsx
const filteredChars = useQuery(api.characters.searchByTags, {
  tags: selectedTags
});

// 3. 添加错误处理和加载状态
if (filteredChars === undefined) return <Loading />;
if (filteredChars.length === 0) return <EmptyState />;
```

#### **4. 测试验证**
- 本地测试核心流程
- 检查Convex Dashboard数据变化
- 验证错误处理机制
- 确认积分系统正确集成

### **代码审查清单**

```markdown
## 功能完整性
- [ ] 所有用户交互有响应
- [ ] 加载状态和错误提示
- [ ] 数据持久化正确
- [ ] 权限检查到位

## 性能优化
- [ ] 避免不必要的重渲染
- [ ] 使用Convex索引优化查询
- [ ] 图片使用Next.js Image组件
- [ ] 大列表考虑虚拟化

## 安全性
- [ ] 用户输入验证
- [ ] 敏感操作认证
- [ ] API密钥保护
- [ ] XSS/CSRF防护

## 用户体验
- [ ] 响应式设计
- [ ] 友好的错误提示
- [ ] 国际化文案
- [ ] 无障碍访问
```

---

## 🔍 **故障排查指南**

### **常见问题**

#### **问题1: Convex查询返回undefined**
```typescript
// ❌ 错误
const data = useQuery(api.users.get);

// ✅ 正确
const data = useQuery(api.users.get, { userId: "..." });

// 原因：缺少必需参数
```

#### **问题2: 积分未正确扣除**
```typescript
// 检查点：
// 1. convex/actions.ts::generateResponse 是否调用 deductCredits
// 2. 是否在AI成功后才扣费
// 3. 是否更新了conversation.total_credits_used
```

#### **问题3: 聊天消息不显示**
```typescript
// 检查点：
// 1. useQuery订阅是否正确
const messages = useQuery(api.messages.list, {
  conversationId: convId,
  userId: userId // 必需
});

// 2. 权限检查：conversation.user_id === userId
// 3. Convex Dashboard查看数据是否写入
```

#### **问题4: Stripe支付未生效**
```bash
# 检查步骤：
# 1. Stripe Dashboard查看事件日志
# 2. 检查Webhook URL配置
# 3. 查看app/api/stripe-notify日志
# 4. 验证orders表数据

# 常见原因：
# - Webhook签名验证失败
# - order_no匹配不上
# - processPaidOrder逻辑错误
```

### **调试技巧**

#### **Convex Dashboard**
```
https://dashboard.convex.dev

1. 查看所有表数据
2. 查看函数执行日志
3. 实时监控查询性能
4. 手动运行mutation测试
```

#### **本地日志**
```typescript
// Convex Action日志
console.log("[Action] generateResponse start:", args);

// 前端组件日志
useEffect(() => {
  console.log("[ChatPage] conversationId:", convId);
  console.log("[ChatPage] messages count:", messages?.length);
}, [convId, messages]);
```

---

## 📚 **关键文档和资源**

### **内部文档**
- `convex/README.md` - Convex架构说明
- `MIGRATION_PLAN.md` - 数据迁移记录（历史）
- `lovexai-roadmap.md` - 项目开发计划

### **外部资源**
- [Convex文档](https://docs.convex.dev)
- [Next.js 15文档](https://nextjs.org/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [NextAuth.js v5](https://next-auth.js.org)
- [Shadcn UI](https://ui.shadcn.com)

---

## 🎯 **当前开发重点（2024-12-03）**

### **短期目标（本周）**
1. ✅ 修复AI生成失败时的错误处理
2. ⚠️ 实现聊天历史虚拟列表
3. ⚠️ 添加速率限制中间件
4. ⚠️ 优化首屏加载性能

### **中期目标（本月）**
1. 实现订阅过期自动降级
2. 完善图片生成功能后端
3. 角色创建功能持久化
4. 国际化文案清理

### **长期目标（下季度）**
1. 移动端优化和PWA
2. 用户生成内容（UGC）角色
3. 社交功能（分享、评论）
4. 高级分析和监控

---

## 📊 **系统状态总结**

### **✅ 生产就绪**
- 用户认证系统
- 角色聊天系统
- AI集成（流式响应）
- 积分系统
- 支付系统（基础）
- 角色发现页

### **⚠️ 需要优化**
- 错误处理机制
- 性能优化（首屏、聊天历史）
- 订阅管理自动化
- 速率限制

### **❌ 未实现**
- 图片生成后端API
- 角色创建持久化
- 订阅过期自动降级
- 高级监控和分析

---

## 🔒 **安全性和合规**

### **已实现**
- ✅ NextAuth.js认证
- ✅ Stripe安全支付
- ✅ 用户数据加密存储（Convex）
- ✅ API密钥环境变量保护

### **待加强**
- ⚠️ API速率限制
- ⚠️ 内容审查机制
- ⚠️ 用户举报功能
- ⚠️ GDPR合规工具

---

## 📝 **注意事项**

### **历史遗留代码**
- ⚠️ `data/database_schema.sql` - Supabase SQL文件，不再使用
- ⚠️ `models/` 目录 - 已删除，迁移到Convex
- ⚠️ 部分API端点可能引用旧的Supabase逻辑

### **环境变量要求**
```bash
# Convex
CONVEX_DEPLOYMENT=          # Convex项目ID
NEXT_PUBLIC_CONVEX_URL=     # Convex公开URL

# NextAuth
NEXTAUTH_URL=               # 应用URL
NEXTAUTH_SECRET=            # JWT密钥

# AI Provider (Tu-zi API)
OPENAI_BASE_URL=            # https://api.tu-zi.com/v1
OPENAI_API_KEY=             # Tu-zi API密钥
OPENAI_MODEL=               # gpt-4o-mini

# Stripe
STRIPE_SECRET_KEY=          # Stripe密钥
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # Stripe公钥
STRIPE_WEBHOOK_SECRET=      # Webhook密钥

# Cloudflare R2 (图片上传)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# Analytics (可选)
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_OPENPANEL_CLIENT_ID=
```

---

**最后更新**: 2024-12-03 by Claude Code
**项目状态**: ✅ 生产就绪，核心功能稳定运行
**技术债务**: 可控，已在Roadmap中规划
