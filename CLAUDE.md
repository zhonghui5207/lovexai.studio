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