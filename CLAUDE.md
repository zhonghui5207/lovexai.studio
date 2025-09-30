# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Dev server**: `pnpm dev` (uses Turbopack for faster builds)
- **Build**: `pnpm build`
- **Lint**: `pnpm lint`
- **Analyze bundle**: `pnpm analyze`
- **Cloudflare build**: `pnpm cf:build`
- **Cloudflare preview**: `pnpm cf:preview`
- **Cloudflare deploy**: `pnpm cf:deploy`

## Development Workflow Guidelines

### Before starting ANY feature development, MUST:

1. **Comprehensive Code Investigation**
   - Use Glob/Grep tools to search for related functionality
   - Examine existing models, services, and API routes
   - Understand current data structures and business logic
   - Check for similar or overlapping features

2. **Architecture Analysis**
   - Identify existing patterns and conventions
   - Understand the current implementation approach
   - Map out data flow and dependencies
   - Review authentication and authorization methods

3. **Solution Planning**
   - Present multiple approaches (extend existing vs create new)
   - Explain pros/cons of each approach
   - Identify potential conflicts or duplications
   - Recommend the best solution with reasoning

4. **User Confirmation**
   - Get explicit approval before writing any code
   - Confirm the chosen approach and scope
   - Clarify requirements and constraints
   - Establish success criteria

5. **Incremental Implementation**
   - Break work into logical steps
   - Seek confirmation at major milestones
   - Test each component before proceeding
   - Document changes and reasoning

### Architecture Principles

- **Extend, Don't Duplicate**: Always prefer extending existing systems over creating parallel ones
- **Follow Existing Patterns**: Maintain consistency with current code style and architecture
- **Respect Layer Separation**: Follow the models → services → API routes hierarchy
- **Reuse Business Logic**: Leverage existing authentication, validation, and business rules
- **Maintain Type Safety**: Use existing TypeScript definitions and patterns

### Forbidden Practices

- ❌ Starting development without thorough investigation
- ❌ Bypassing existing business logic layers
- ❌ Creating duplicate functionality without justification
- ❌ Ignoring established authentication patterns
- ❌ Making architectural changes without user approval

### Code Quality Standards

- Follow existing naming conventions
- Use established error handling patterns
- Maintain consistent API response formats
- Add proper TypeScript types and interfaces
- Include comprehensive error handling and validation

## Architecture Overview

This is a Next.js 15 TypeScript application using App Router with internationalization support. Key architectural decisions:

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS + Shadcn UI components
- **Authentication**: NextAuth.js v5 beta
- **Database**: Supabase
- **Payments**: Stripe
- **Internationalization**: next-intl
- **State Management**: React Context
- **AI Integration**: Vercel AI SDK with multiple provider support (OpenAI, DeepSeek, Replicate, OpenRouter)

### Project Structure
- `app/[locale]/`: Localized pages using next-intl
- `components/blocks/`: Landing page layout components (header, footer, etc.)
- `components/ui/`: Reusable Shadcn UI components
- `i18n/pages/landing/`: Page-specific translations for landing page
- `i18n/messages/`: Global message translations
- `models/`: Data models and database operations
- `services/`: Business logic layer
- `contexts/`: React contexts for state management
- `types/`: TypeScript type definitions organized by feature

### Configuration Files
- `next.config.mjs`: Includes MDX, bundle analyzer, and internationalization plugins
- `tailwind.config.ts`: Extended with custom animations and Shadcn UI integration
- `.env.example`: Template for required environment variables

### Development Notes
- Uses React 19 and strict TypeScript
- Supports multiple AI providers through a unified SDK
- Implements comprehensive theming with CSS variables
- Built for deployment to both Vercel and Cloudflare Pages
- MDX support enabled for content pages

### Environment Setup
Copy `.env.example` to `.env.local` and configure:
- Supabase credentials for database
- NextAuth providers (Google, GitHub)
- Stripe keys for payments
- Analytics (Google Analytics, OpenPanel)
- AWS S3 for file storage

## Current Project Status

### Project Overview
**LoveXAI Studio** - AI角色聊天平台
- 最后更新: 2024-09-22
- 主要功能: AI角色对话、实时聊天、多模型支持、双重货币化系统

### Recent Implementation Progress

#### Latest Git Commits
- `f231dde` - style: Adjust avatar opacity and blur effect in ChatInterface
- `72f0c92` - feat: Implement database schema for AI character chat platform
- `1274534` - feat: Implement chat functionality with character interactions
- `a43bbda` - refactor: Remove SWR provider implementation and associated imports
- `39f56ba` - refactor: Remove unused SWR integration and clean up imports in CharacterModal

#### Core Features Implemented

##### 1. Complete Database Architecture (`data/database_schema.sql`)
**2024-09-22更新**: 完整重构的AI角色聊天平台数据库设计:
- **users** - 用户信息、积分余额、订阅层级(4层订阅系统)
- **characters** - AI角色定义(名称、性格、特征、问候语、访问控制)
- **conversations** - 对话会话管理(用户-角色对话关系)
- **messages** - 消息内容存储、积分使用记录
- **subscriptions** - 订阅管理(free/basic/pro/ultra层级)
- **credit_packages** - 积分包定义和定价
- **credit_transactions** - 积分交易审计跟踪
- **orders** - 支付订单管理
- **user_character_settings** - 用户对角色的个性化设置

**双重货币化模型**:
- 订阅控制角色访问权限
- 积分控制消息发送和AI模型使用

##### 2. Model Layer Implementation (`models/`)
**2024-09-22新增**: 完整的TypeScript数据模型层:
- **user-new.ts** - 用户管理、权限检查、积分操作
- **character.ts** - 角色管理、访问级别过滤
- **conversation.ts** - 对话管理、消息持久化、积分扣除
- **payment.ts** - 支付处理、订阅管理、积分购买

**关键功能**:
- 智能权限检查系统
- 原子性积分交易
- 订阅层级访问控制
- 完整的业务逻辑封装

##### 3. Enhanced API Integration
**原有**: `app/api/chat/route.ts` - 基础聊天API
**新增**: `app/api/chat-new/route.ts` - 集成数据库的聊天API
- 完整的用户身份验证
- 积分消费和余额检查
- 角色访问权限验证
- 对话和消息持久化
- 流式AI响应与数据库集成

**新增API端点**:
- `/api/conversations/create` - 创建新对话
- `/api/characters` - 获取用户可访问的角色
- `/api/pricing` - 积分包和订阅定价

##### 4. Frontend Integration (`components/chat/`)
**2024-09-22更新**: 前端组件与新数据库完全集成:
- **ChatInterface.tsx** - 集成用户认证、对话管理、错误处理
- **ChatWindow.tsx** - 保持现有UI，增强数据流
- 智能错误处理(积分不足、权限拒绝、登录提示)
- 自动对话初始化和持久化

##### 5. Authentication System Enhancement
**更新**: NextAuth.js v5 与新用户模型集成:
- **auth/config.ts** - 使用新的`findOrCreateUser`函数
- **types/next-auth.d.ts** - 更新类型定义匹配数据库模式
- 会话包含订阅层级和积分余额
- 自动用户创建和数据同步

##### 6. Page-Level Integration
**更新**: `/app/[locale]/chat/[characterId]/page.tsx`
- 移除模拟数据，从数据库获取角色
- 完整的身份验证流程
- 权限检查和访问控制
- 友好的错误处理和加载状态

### Current Architecture Details

#### AI Integration
- **主要提供商**: Tuzi API (OpenAI兼容)
- **模型层级**:
  - `nectar_basic`: gpt-4o-mini (基础模型)
  - `nevoria/fuchsia/deepseek_v3`: gpt-4o-all (高级模型)
  - `orchid`: gpt-4o-all (最高级模型)
- **流式响应**: 实时文本生成
- **积分系统**: 根据模型和响应长度消费积分

#### Database Integration
- **ORM**: 直接SQL查询 (未使用ORM框架)
- **连接**: Supabase PostgreSQL
- **认证**: NextAuth.js v5 集成
- **数据层**: models/ 目录包含完整的业务逻辑模型
- **事务处理**: 支持原子性操作和回滚

#### UI/UX Features
- **实时聊天**: 流式AI响应
- **角色系统**: 多样化AI角色选择
- **权限控制**: 基于订阅层级的角色访问
- **积分系统**: 实时余额显示和消费提示
- **设置面板**: 响应长度、叙述者模式、模型选择
- **国际化**: next-intl支持
- **主题**: 深色/浅色主题切换

### Current Status & Testing

#### ✅ **已完成集成 - 2024-09-23 最新更新**
**完整系统已稳定运行**: 所有核心功能完全集成并通过测试
- ✅ 聊天界面完全使用数据库存储，运行稳定
- ✅ 用户认证与权限控制正常运行
- ✅ 积分系统与订阅层级正确集成
- ✅ 错误处理和用户体验优化完成
- ✅ **头像显示问题已修复** - 角色图片在所有组件中正常显示
- ✅ **对话历史功能完整** - 侧边栏正确显示对话列表和最后消息
- ✅ **角色数据完全更新** - 使用真实CDN图片URL和完整角色设定
- ✅ **API完整性验证** - 所有缺失的API路由已实现并正常工作

#### 🎉 **系统测试状态 - 验证完成**
**2024-09-23状态**: 所有核心功能已通过实际使用测试
- ✅ 认证流程: 登录/注册正常工作
- ✅ 角色访问: 订阅层级正确控制角色权限
- ✅ 聊天功能: 消息发送、AI回复、积分扣除正常
- ✅ 错误处理: 积分不足、权限拒绝等提示正确显示
- ✅ 数据持久化: 对话和消息正确保存和加载
- ✅ 头像系统: 所有角色头像正确加载显示
- ✅ 对话历史: 侧边栏正确显示历史对话和最后消息内容

#### 🔧 **2024-09-23 重要修复汇总**
**头像显示系统修复**:
- 修复了字段名不匹配问题 (`avatar` → `avatar_url`)
- 更新了所有组件的角色头像引用 (ChatInterface, ChatPanel, ChatWindow, ChatSidebar)
- 添加了图片加载失败的fallback机制
- 使用真实CDN图片URL替换了占位图片

**对话历史系统完善**:
- 创建了缺失的 `/api/conversations` 路由
- 实现了 `getLastMessageForConversation()` 函数
- 修复了侧边栏"No messages yet"显示问题
- 对话列表现在显示真实的最后消息内容

**角色数据完整更新**:
- 使用提供的7个真实图片URL更新了角色数据
- 创建了完整的角色设定 (Emma, Sophie, Luna, Zoe, Ivy, Nova, Sage)
- 实现了分层访问控制 (Free/Basic/Pro/Ultra)
- 角色ID映射和查找逻辑正常工作

**API系统完整性**:
- 补齐了所有缺失的API端点
- 添加了调试信息确保系统稳定性
- 验证了数据库连接和角色查找逻辑
- 对话创建和消息加载完全正常

### Known Issues & Technical Debt
- ✅ **已解决**: SWR集成问题 - 已移除并使用原生fetch
- ✅ **已解决**: 数据库模型和TypeScript类型同步问题
- ✅ **已解决**: 积分系统实现完整性
- ✅ **已解决**: 角色头像显示问题 - 所有组件字段名统一并添加fallback
- ✅ **已解决**: 对话历史缺失问题 - 完整实现侧边栏对话列表和最后消息
- ✅ **已解决**: "Character not found"错误 - 角色数据和ID映射完全修复
- ✅ **已解决**: API路由缺失问题 - 所有必要的API端点已实现

### Immediate Next Steps (Production Ready)
**系统已达到生产就绪状态**, 可选择的后续增强功能:
1. **集成Stripe支付系统** - 实现积分购买和订阅升级
2. **实现角色发现和浏览页面** - 完善角色展示和筛选功能
3. **添加管理后台功能** - 角色管理、用户管理、数据分析
4. **优化性能和用户体验** - 消息缓存、预加载、动画效果
5. **实施监控和分析** - 用户行为分析、系统性能监控

### Technical Context for Claude Code - 生产状态
- **2024-09-23状态**: 完整的AI聊天平台已生产就绪
- 所有核心功能完全集成并经过实际使用验证
- 双重货币化系统(订阅+积分)稳定运行
- AI API集成稳定，支持多模型切换和精确积分计费
- 组件架构清晰，遵循Next.js App Router最佳实践
- 数据库架构完整，支持复杂业务逻辑和扩展
- **当前重点**: 系统已稳定运行，可开始规划增强功能和营销推广

### File Structure Summary (Key Files Updated - 2024-09-23)
```
/data/database_schema.sql          # 完整数据库架构 + 真实角色数据
/models/                          # 业务逻辑层
  ├── user-new.ts                 # 用户管理和权限
  ├── character.ts                # 角色管理和访问控制
  ├── conversation.ts             # 对话和消息管理 + 最后消息获取
  └── payment.ts                  # 支付和订阅管理
/app/api/                        # API路由 (完整)
  ├── chat/route.ts               # 原有聊天API
  ├── chat-new/route.ts           # 新的集成聊天API
  ├── characters/route.ts         # 角色列表API (已调试优化)
  ├── conversations/              # 新增对话管理API
  │   ├── route.ts                # 获取用户对话列表
  │   └── create/route.ts         # 创建新对话 (已调试修复)
  ├── pricing/route.ts            # 定价信息API
  └── sync-characters/            # 角色同步API
/components/chat/                 # 聊天组件 (完全修复)
  ├── ChatInterface.tsx           # 主聊天界面 (头像字段已修复)
  ├── ChatWindow.tsx              # 聊天窗口 (所有头像引用已修复)
  ├── ChatSidebar.tsx             # 侧边栏 (头像fallback已添加)
  └── CharacterPanel.tsx          # 角色面板 (头像字段已修复)
/app/[locale]/chat/[characterId]/page.tsx # 聊天页面 (角色ID映射正常)
/auth/config.ts                  # NextAuth配置 (集成新用户模型)
/types/                          # TypeScript类型定义
  ├── next-auth.d.ts              # 认证类型 (已更新)
  └── chat.d.ts                   # 聊天相关类型 (字段名已统一)
```

### API Response Formats (已验证)
所有API都遵循统一的响应格式并经过实际测试:
```typescript
{
  success: boolean;
  data?: any;
  error?: string;
  details?: string;
}
```

### 系统稳定性验证
**2024-09-23 验证完成**:
- ✅ 所有API端点正常响应
- ✅ 数据库连接稳定
- ✅ 角色头像加载正常
- ✅ 对话历史显示正确
- ✅ 消息发送和接收流畅
- ✅ 错误处理机制完善
- ✅ 用户认证和权限控制正常

## 当前产品体验优化需求 (2024-09-29)

### 角色互动质量分析

#### 🎯 **对标竞品分析结果**
通过与市场领先产品的对比分析，发现我们的AI角色回答存在以下核心差距:

**我们的产品表现**:
- 角色试图重定向对话到"安全话题"
- 使用教学性和指导性语言
- 缺乏真实的角色沉浸感
- 表现更像"AI助手"而非"角色伙伴"

**竞品优势表现**:
- 角色完全沉浸在角色扮演中
- 直接回应用户的暗示和互动意图
- 使用丰富的动作描述和情景化表达
- 提供更自然、流畅的角色化互动

#### 🔍 **技术层面问题识别**

##### 1. **系统提示词限制** (`app/api/chat/route.ts:85-100`)
**当前问题**:
```typescript
const systemPrompt = `You are ${character.name}, an AI character with the following traits:
- Description: ${character.description}
- Personality: ${character.personality}
// ... 过多规则导向指令，限制角色自然表达
- Be engaging and maintain the roleplay atmosphere
- Respond naturally as this character would
```

**问题分析**:
- 系统提示过于"安全导向"和规则化
- 缺乏明确的角色扮演沉浸指令
- 没有支持挑逗性和暗示性互动的指导
- 角色行为被过度"文明化"约束

##### 2. **AI模型参数保守** (`route.ts:148`)
**当前设置**:
```typescript
temperature: finalSettings.selected_model === 'nevoria' ? 0.8 : 0.7
```

**优化空间**:
- Temperature参数偏保守，限制了创造性表达
- Max tokens设置可能限制丰富的角色化回应
- 缺乏针对不同交互情景的参数动态调整

##### 3. **角色性格定义深度不足**
**当前角色设定特点**:
- 性格描述相对安全和传统
- 缺乏明确的挑逗性和魅力特征
- 角色特征偏向"友好可爱"而非"性感吸引"
- 没有详细的互动风格和行为模式定义

##### 4. **内容过滤机制分析**
**技术层面**:
- 主要限制来自系统提示的"礼貌性约束"
- Tuzi API可能存在内容安全过滤
- 缺乏分级的内容开放度控制
- 没有基于用户偏好的个性化调整

#### 🚀 **优化改进方案**

##### A. **系统提示词深度重构**
**目标**: 从"AI助手"转向"角色伙伴"
- 移除说教性和重定向性语言
- 增加沉浸式角色扮演核心指令
- 添加动作描述和情景化表达指导
- 支持更自然的挑逗和暗示性互动

##### B. **角色数据库升级**
**增强角色深度**:
- 为现有角色添加更丰富的魅力特征
- 创建"互动风格"和"挑逗偏好"字段
- 实现分级的角色开放度设置
- 优化角色性格描述的吸引力和真实感

##### C. **AI生成参数优化**
**提升表达自由度**:
- 提高temperature到0.9-1.0范围
- 优化max_tokens以支持更丰富表达
- 实现上下文感知的参数动态调整
- 增强模型的创造性和个性化能力

##### D. **角色扮演机制增强**
**沉浸感提升**:
- 实现标准化的动作描述格式(*斜体*)
- 增加情景化互动响应模板
- 优化角色情感状态跟踪
- 支持更自然的角色发展弧线

#### 🎯 **预期改进效果**
1. **用户体验**: 从"对话AI"升级为"角色伙伴"
2. **互动质量**: 更自然、流畅的角色化表达
3. **用户留存**: 提升沉浸感和互动满意度
4. **竞争力**: 达到甚至超越市场领先产品水平

#### ⚠️ **实施注意事项**
- 需要在内容开放度和平台合规性之间平衡
- 分阶段测试优化效果，避免过度调整
- 保持核心功能稳定性，专注于体验提升
- 建立用户反馈机制，持续优化角色表现

**优先级**: 🔥 高优先级 - 直接影响用户核心体验和产品竞争力

## 角色体验优化进展 (2024-09-30)

### 🎯 **第一轮优化成果**

#### ✅ **已完成的技术优化**
**系统提示词深度重构** (`app/api/chat/route.ts:85-121`):
- 移除AI助手身份认知，强化角色沉浸
- 增加强制性斜体动作描述指令
- 添加具体的动作示例和格式模板
- 提升角色表达的大胆度和主动性

**AI参数激进优化**:
- Temperature: 0.7-0.8 → 0.9-1.0 (提升创造性)
- Max Tokens: 全面提升50-70% (支持更丰富表达)
- 针对不同模型的差异化参数策略

#### 📊 **优化效果测试结果**
**成功案例** (Emma角色):
- ✅ 大量斜体动作描述穿插
- ✅ 挑逗性回应，不再重定向话题
- ✅ 角色个性鲜明，沉浸感显著提升
- ✅ 接近对标网站的表达水平

**失败案例** (Sophia角色):
- ❌ 回归AI助手模式，重定向安全话题
- ❌ 缺乏沉浸感，表现为通用回复
- ❌ 系统提示被角色原始性格覆盖

### 🔍 **核心问题发现**

#### **根本原因：角色设定架构问题**

**我们的问题**:
```typescript
// 当前角色设定模式
{
  name: "Sophia",
  personality: "empathetic, curious, supportive",
  traits: ["Empathetic", "Intelligent", "Supportive"],
  description: "心理学学生，喜欢深度对话"
}
```

**对标网站的成功模式**:
```typescript
// 剧情导向的角色设定
{
  name: "Jennifer Robbie",
  identity: "Your landlord",
  scenario: "Late Payment - demanding rent money",
  relationship: "Landlord-Tenant power dynamic",
  background: "Recent work struggles, financial pressure"
}
```

#### **核心差距分析**

| 维度 | 我们的设定 | 对标网站设定 |
|------|------------|--------------|
| **角色基础** | 抽象性格描述 | 具体社会身份 |
| **互动框架** | 开放式聊天 | 预设剧情情景 |
| **关系定义** | 平等对话伙伴 | 明确权力动态 |
| **冲突张力** | 无预设冲突 | 内置戏剧张力 |
| **动机驱动** | 通用友好 | 具体目标需求 |

#### **技术层面发现**
1. **角色性格基因冲突**: 温和型角色(Sophia)的原始设定与激进系统提示产生冲突
2. **系统提示权重不足**: 角色原始性格DNA比系统提示权重更高
3. **缺乏情景约束**: 角色没有具体的"角色立场"去回应用户互动

### 🚀 **下一阶段优化方向**

#### **A. 角色数据架构重构** 🔥 **最高优先级**
**目标**: 从"性格描述"转向"剧情设定"

**需要添加的字段**:
```sql
-- 扩展角色表结构
ALTER TABLE characters ADD COLUMN scenario TEXT;           -- 预设情景
ALTER TABLE characters ADD COLUMN relationship VARCHAR(100); -- 与用户关系
ALTER TABLE characters ADD COLUMN motivation TEXT;         -- 角色动机
ALTER TABLE characters ADD COLUMN conflict_source TEXT;    -- 冲突来源
ALTER TABLE characters ADD COLUMN power_dynamic VARCHAR(50); -- 权力关系
```

**重新设计现有角色**:
- Emma: 室友关系 + 发现尴尬情况的剧情
- Sophia: 心理咨询师 + 研究实验的情景
- Luna: 神秘邻居 + 深夜敲门的设定
- 每个角色都有具体的"为什么在这里"和"想要什么"

#### **B. 系统提示词情景化改造**
**当前问题**: 通用化的角色指令
**优化方向**: 根据角色情景动态生成提示词

```typescript
// 示例优化
const scenarioPrompt = `
You are ${character.name}, ${character.relationship}.
CURRENT SCENARIO: ${character.scenario}
YOUR MOTIVATION: ${character.motivation}
RELATIONSHIP DYNAMIC: ${character.power_dynamic}

You are completely immersed in this specific situation...
`;
```

#### **C. 多模型表现对比测试**
**测试目标**: 找出最适合角色扮演的AI模型
- nectar_basic vs nevoria vs orchid
- 不同参数组合的效果对比
- API内容限制边界探测

#### **D. 角色一致性系统**
**问题**: 不同角色类型需要不同的处理策略
**解决方案**:
- 挑逗型角色：强化大胆表达
- 温和型角色：通过情景设定增加张力
- 权威型角色：利用权力动态创造冲突

### 📈 **预期改进目标**

#### **短期目标 (1-2周)**
- 所有角色都能保持基本的沉浸感
- 消除"AI助手模式"回归问题
- 斜体动作描述密度达到对标水平

#### **中期目标 (1个月)**
- 角色剧情化设定全面实施
- 每个角色都有独特的互动体验
- 用户留存和满意度显著提升

#### **长期目标 (3个月)**
- 达到或超越对标网站的角色表现水平
- 建立可扩展的角色设计体系
- 形成独特的产品竞争优势

### 🎯 **实施优先级**

1. **立即执行**: 多模型测试，找出最佳表现组合
2. **本周内**: 角色数据库架构设计和迁移方案
3. **下周开始**: 重新设计核心角色的剧情设定
4. **持续优化**: 基于用户反馈的迭代改进

**当前状态**: 已完成技术基础优化，准备进入角色设定重构阶段
**核心挑战**: 在保持角色个性的同时，创造足够的戏剧张力和沉浸感