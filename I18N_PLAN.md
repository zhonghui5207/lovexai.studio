# LoveXAI Studio 国际化 (i18n) 计划

**文档版本**: v1.0
**最后更新**: 2025-01-13
**支持语言**: 英文 (默认), 中文
**框架**: next-intl

---

## 📊 **当前进度概览**

### ✅ 已完成国际化的模块

| 模块 | 文件路径 | 状态 |
|------|---------|------|
| 导航栏 | `components/blocks/header/index.tsx` | ✅ |
| 侧边栏 | `components/blocks/sidebar/index.tsx` | ✅ |
| 顶部筛选栏 | `components/blocks/characters/TopFilterBar.tsx` | ✅ |
| Hero Banner | `components/blocks/characters/HeroBanner.tsx` | ✅ |
| Discover Section | `components/blocks/characters/DiscoverSection.tsx` | ✅ |
| 语言切换 | `components/locale/toggle.tsx` | ✅ |
| 聊天侧边栏 | `components/chat/ChatSidebar.tsx` | ✅ |
| 聊天窗口 | `components/chat/ChatWindow.tsx` | ✅ |
| 生成设置弹窗 | `components/chat/GenerationSettingsModal.tsx` | ✅ |
| 发现页 | `app/[locale]/(default)/discover/page.tsx` | ✅ |
| 图片生成页 | `app/[locale]/(default)/generate/page.tsx` | ✅ |
| 角色创建页 | `app/[locale]/(default)/create/page.tsx` | ✅ |
| 登录/注册弹窗 | `components/sign/AuthModal.tsx` | ✅ |

**首页已完成**: HeroBanner + DiscoverSection (包括角色卡片的所有文本)

---

## 🎯 **待完成模块 (按优先级)**

### P0 - 高优先级 (用户频繁交互)

#### 1. 聊天相关组件

**InsufficientCreditsDialog.tsx**
- 文件路径: `components/chat/InsufficientCreditsDialog.tsx`
- 需要翻译的文本:
  - 标题、描述、按钮文本
  - 积分余额显示
- 翻译命名空间: `credits_dialog` ✅ (已存在于 messages 文件中)

**ErrorDisplay.tsx**
- 文件路径: `components/chat/ErrorDisplay.tsx`
- 需要翻译的文本:
  - 所有错误类型标题
  - 错误描述
  - 操作按钮文本
- 翻译命名空间: `chat_errors` ✅ (已存在)

**CharacterPanel.tsx**
- 文件路径: `components/chat/CharacterPanel.tsx`
- 需要翻译的文本:
  - 场景、背景、人格标签
  - 建议文本
- 翻译命名空间: `character_panel` ✅ (已存在)

**CreditDisplay.tsx**
- 文件路径: `components/chat/CreditDisplay.tsx`
- 需要翻译的文本:
  - 积分显示文本
  - 状态提示
- 翻译命名空间: `credit_display` ✅ (已存在)

#### 2. 认证相关

**modal.tsx (登录弹窗)**
- 文件路径: `components/sign/modal.tsx`
- 需要翻译的文本:
  - 社交登录按钮标签
  - 条款和隐私政策链接
- 翻译命名空间: `sign_modal` (需扩展)

---

### P1 - 中优先级 (影响用户体验)

#### 3. 定价相关

**PricingContent.tsx**
- 文件路径: `components/blocks/pricing/PricingContent.tsx`
- 需要翻译的文本:
  - 定价方案描述
  - 功能列表
  - CTA 按钮
- 翻译命名空间: `pricing` (需新增)

**PaymentMethodsModal.tsx**
- 文件路径: `components/blocks/pricing/PaymentMethodsModal.tsx`
- 翻译命名空间: `payment_methods` (需新增)

#### 4. 角色相关

**CharacterModal.tsx**
- 文件路径: `components/blocks/characters/CharacterModal.tsx`
- 需要翻译的文本:
  - 角色详情标签
  - 操作按钮
- 翻译命名空间: `character_modal` ✅ (已存在)

**DiscoverSection.tsx**
- 文件路径: `components/blocks/characters/DiscoverSection.tsx`
- 需要翻译的文本:
  - 筛选按钮
  - 标签文本
- 翻译命名空间: `discover` (需扩展)

#### 5. 用户功能

**ProfileSettingsDialog.tsx**
- 文件路径: `components/profile/ProfileSettingsDialog.tsx`
- 翻译命名空间: `profile_settings` (需新增)

**PaySuccessContent.tsx**
- 文件路径: `components/blocks/payment/PaySuccessContent.tsx`
- 翻译命名空间: `payment_success` (需新增)

---

### P2 - 低优先级 (辅助功能)

#### 6. 其他组件

**invite/modal.tsx**
- 文件路径: `components/invite/modal.tsx`
- 翻译命名空间: `my_invites` ✅ (已存在)

**invite/index.tsx**
- 文件路径: `components/invite/index.tsx`
- 翻译命名空间: `my_invites`

**feedback/index.tsx**
- 文件路径: `components/feedback/index.tsx`
- 翻译命名空间: `feedback` ✅ (已存在)

---

## 🔧 **实施步骤指南**

### 步骤 1: 检查翻译文件

确认 `i18n/messages/en.json` 和 `i18n/messages/zh.json` 中是否已有对应翻译键。

### 步骤 2: 添加缺失的翻译键

如果翻译键不存在，按以下格式添加：

```json
{
  "namespace": {
    "key": "English text",
    "key_with_param": "Text with {parameter}"
  }
}
```

### 步骤 3: 修改组件代码

1. 在组件顶部添加导入:
```typescript
import { useTranslations } from "next-intl";
```

2. 在组件内调用 hook:
```typescript
const t = useTranslations('namespace'); // 或不传参数使用根命名空间
```

3. 替换硬编码文本:
```typescript
// 之前
<h1>Title</h1>

// 之后
<h1>{t('key')}</h1>

// 带参数
<p>{t('key_with_param', { parameter: value })}</p>
```

### 步骤 4: 测试验证

1. 启动开发服务器: `pnpm dev`
2. 访问 `/` 验证英文显示
3. 访问 `/zh` 验证中文显示
4. 切换语言确认所有文本正确切换

---

## 📝 **翻译键命名规范**

### 命名空间结构

```
├── nav              # 导航菜单
├── categories       # 分类标签 (girls/guys/anime)
├── top_filter       # 顶部筛选栏
├── hero             # 首页 Hero 区域
├── sidebar          # 侧边栏
├── tiers            # 订阅层级
├── chat             # 聊天界面
├── chat_errors      # 聊天错误提示
├── credits_dialog   # 积分不足弹窗
├── credit_display   # 积分显示
├── character_panel  # 角色信息面板
├── character_modal  # 角色详情弹窗
├── discover         # 发现页
├── generate         # 图片生成页
├── create           # 角色创建页
├── traits           # 性格特征
├── scenarios        # 场景设定
├── generation_settings  # 生成设置
├── models           # AI 模型名称
├── image_models     # 图片生成模型
├── styles           # 艺术风格
├── sign_modal       # 登录/注册
├── user             # 用户相关
├── my_orders        # 我的订单
├── my_credits       # 我的积分
├── api_keys         # API 密钥
├── my_invites       # 我的邀请
├── feedback         # 反馈
├── blog             # 博客
└── common           # 通用文本 (按钮、状态等)
```

### 命名约定

1. **使用 snake_case**: `loading_credits`, `cost_per_message`
2. **层级结构清晰**: `chat.title`, `chat.no_conversations`
3. **参数使用花括号**: `{count}`, `{tier}`, `{cost}`
4. **按钮文本**: `button_primary`, `button_secondary`, `submit`, `cancel`
5. **状态文本**: `loading`, `error`, `success`

---

## 🌍 **添加新语言指南**

### 支持新语言的步骤

假设要添加日语 (ja) 支持：

#### 1. 创建翻译文件

```bash
# 复制英文翻译作为模板
cp i18n/messages/en.json i18n/messages/ja.json
```

#### 2. 翻译内容

将 `ja.json` 中的英文值翻译为日语：
```json
{
  "nav": {
    "home": "ホーム",
    "messages": "メッセージ"
  }
}
```

#### 3. 添加语言配置

在 `i18n/locale.ts` 中添加语言配置：
```typescript
export const locales = ["en", "zh", "ja"] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  zh: "中文",
  ja: "日本語"
};
```

#### 4. 更新 LocaleToggle 组件

确保语言切换按钮支持新语言。

#### 5. 测试验证

访问 `/ja` 确认日语显示正常。

---

## 📋 **检查清单**

完成国际化后，使用此清单验证：

### 翻译完整性
- [ ] 所有用户可见文本已翻译
- [ ] 无硬编码英文字符串
- [ ] 日期/时间格式本地化
- [ ] 数字格式本地化 (如千分位)
- [ ] 货币符号本地化

### 功能测试
- [ ] 语言切换正常工作
- [ ] URL 路由正确 (`/` vs `/zh`)
- [ ] 默认语言正确显示
- [ ] 所有页面两种语言都能访问
- [ ] 翻译参数正确插值

### 代码质量
- [ ] 使用 TypeScript 类型安全
- [ ] 无翻译键拼写错误
- [ ] 组件正确使用 `useTranslations` hook
- [ ] 服务端组件使用 `getTranslations`

---

## 🔍 **常用命令**

```bash
# 启动开发服务器
pnpm dev

# 检查缺失的翻译键
# (需要手动检查，next-intl 不会自动报告)

# 验证翻译文件 JSON 格式
cat i18n/messages/en.json | jq .

# 对比两个语言的翻译键数量
cat i18n/messages/en.json | jq 'keys' | wc -l
cat i18n/messages/zh.json | jq 'keys' | wc -l
```

---

## 📚 **参考资源**

- [next-intl 官方文档](https://next-intl-docs.vercel.app/)
- [ICU 消息格式](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
- [项目 CLAUDE.md](./CLAUDE.md)

---

**下一步建议**: 按优先级顺序完成 P0 级别的聊天相关组件国际化。
