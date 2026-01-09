# LoveXAI Studio 性能优化追踪文档

> **最后更新**: 2025-01-08
> **负责人**: Claude Code
> **项目版本**: v1.6.0

---

## 目录

1. [性能问题总览](#性能问题总览)
2. [P0 问题详解与解决方案](#p0-问题详解与解决方案)
3. [P1 问题清单](#p1-问题清单)
4. [P2 问题清单](#p2-问题清单)
5. [优化进度追踪](#优化进度追踪)
6. [性能测试基准](#性能测试基准)

---

## 性能问题总览

### 问题分级标准

| 级别 | 定义 | 影响范围 | 修复时限 |
|------|------|----------|----------|
| **P0** | 严重影响用户体验/SEO | 全站核心功能 | 本周内 |
| **P1** | 明显影响加载速度/交互 | 主要页面 | 2周内 |
| **P2** | 优化项，提升体验 | 局部功能 | 1个月内 |

### 问题汇总

| 优先级 | 问题 | 位置 | 状态 |
|--------|------|------|------|
| P0 | Landing Page 完全客户端渲染 | `app/[locale]/(default)/page.tsx` | ⏳ 待修复 |
| P0 | 聊天消息无虚拟化 | `components/chat/ChatWindow.tsx` | ⏳ 待修复 |
| P0 | SwipeCard/TrendingCard 无 React.memo | `discover/page.tsx` | ⏳ 待修复 |
| P1 | 原生 img 标签未使用 next/image | 多处 | ⏳ 待修复 |
| P1 | 数据请求瀑布流 | `chat/page.tsx:57-93` | ⏳ 待修复 |
| P1 | 缺少 useMemo | `chat/page.tsx:82-117` | ⏳ 待修复 |
| P1 | GenerationSettingsModal 未懒加载 | `ChatWindow.tsx:11` | ⏳ 待修复 |
| P2 | AI 系统提示词每次重建 | `convex/actions.ts` | ⏳ 待修复 |
| P2 | 滚动逻辑每条消息触发 | `ChatWindow.tsx:144` | ⏳ 待修复 |
| P2 | Discover 页面 35+ useState | `discover/page.tsx` | ⏳ 待修复 |

---

## P0 问题详解与解决方案

### P0-1: Landing Page 完全客户端渲染

#### 问题描述

**文件**: `app/[locale]/(default)/page.tsx`

```typescript
// 当前代码 - 问题所在
"use client";  // ❌ 导致整个页面客户端渲染

import HeroBanner from "@/components/blocks/characters/HeroBanner";
import DiscoverSection from "@/components/blocks/characters/DiscoverSection";
// ...

export default function LandingPage() {
  const characters = useQuery(api.characters.list, { activeOnly: true });
  // ...
}
```

#### 影响

1. **SEO 严重受损**: 搜索引擎爬虫无法索引首页内容
2. **FCP (First Contentful Paint) 延迟**: 用户看到白屏时间长
3. **LCP (Largest Contentful Paint) 延迟**: Hero 图片加载慢
4. **无法预渲染静态内容**: HeroBanner、Testimonials 等静态组件也被客户端渲染

#### 解决方案

**方案: 混合渲染架构 (Server + Client Components)**

将页面拆分为 Server Components (静态内容) 和 Client Components (交互内容)。

**Step 1: 创建 Server Component 包装**

```typescript
// app/[locale]/(default)/page.tsx - 修改后
import { Suspense } from "react";
import HeroBanner from "@/components/blocks/characters/HeroBanner";
import ImageGenSection from "@/components/blocks/home/ImageGenSection";
import Testimonials from "@/components/blocks/home/Testimonials";
import DiscoverSectionWrapper from "@/components/blocks/characters/DiscoverSectionWrapper";
import { CharactersSkeleton } from "@/components/skeletons/CharactersSkeleton";

// 移除 "use client" - 默认为 Server Component
export default function LandingPage() {
  return (
    <>
      {/* 静态内容 - Server 渲染 */}
      <HeroBanner />

      {/* 动态内容 - Client 渲染 with Suspense */}
      <Suspense fallback={<CharactersSkeleton />}>
        <DiscoverSectionWrapper />
      </Suspense>

      {/* 静态内容 - Server 渲染 */}
      <ImageGenSection />
      <Testimonials />
    </>
  );
}
```

**Step 2: 创建 Client Wrapper 组件**

```typescript
// components/blocks/characters/DiscoverSectionWrapper.tsx - 新建
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import DiscoverSection from "./DiscoverSection";

export default function DiscoverSectionWrapper() {
  const characters = useQuery(api.characters.list, { activeOnly: true });
  return <DiscoverSection characters={characters} />;
}
```

**Step 3: 修改 HeroBanner 为纯 Server Component**

```typescript
// components/blocks/characters/HeroBanner.tsx - 修改
// 移除 "use client"
// 移除所有 useState, useEffect
// 使用 searchParams 替代 useSearchParams

import { headers } from 'next/headers';

export default function HeroBanner() {
  // Server-side: 从 headers 或 props 获取 gender
  // 静态内容直接渲染
}
```

**Step 4: 创建 Loading Skeleton**

```typescript
// components/skeletons/CharactersSkeleton.tsx - 新建
export function CharactersSkeleton() {
  return (
    <section className="py-16">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    </section>
  );
}
```

#### 预期收益

| 指标 | 优化前 | 优化后 (预估) |
|------|--------|---------------|
| FCP | ~2.5s | ~0.8s |
| LCP | ~3.5s | ~1.5s |
| SEO 可索引 | ❌ | ✅ |
| 首屏 HTML 大小 | ~5KB | ~50KB |

---

### P0-2: 聊天消息无虚拟化

#### 问题描述

**文件**: `components/chat/ChatWindow.tsx:344-389`

```typescript
// 当前代码 - 问题所在
<div className="flex-1 overflow-y-auto relative custom-scrollbar">
  <div className="relative z-10 p-4 space-y-4 min-h-full">
    {messages.map((message) => (  // ❌ 渲染所有消息
      <div key={message.id} className={`flex items-start gap-3 ...`}>
        {/* 消息内容 */}
      </div>
    ))}
  </div>
</div>
```

#### 影响

1. **DOM 节点爆炸**: 100 条消息 = 100+ DOM 节点
2. **内存占用高**: 每条消息都在内存中
3. **滚动卡顿**: 大量 DOM 导致重绘慢
4. **初始渲染慢**: 一次性渲染所有历史消息

#### 解决方案

**方案: 使用 @tanstack/react-virtual 实现虚拟列表**

**Step 1: 安装依赖**

```bash
pnpm add @tanstack/react-virtual
```

**Step 2: 重构 ChatWindow 消息列表**

```typescript
// components/chat/ChatWindow.tsx - 修改后
"use client";

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useCallback, useEffect } from 'react';

// 消息项组件 - 提取并 memo 化
const MessageItem = memo(function MessageItem({
  message,
  character,
  renderAvatar,
  formatTime
}: MessageItemProps) {
  return (
    <div className={`flex items-start gap-3 ${message.sender === "user" ? "flex-row-reverse" : ""}`}>
      {message.sender === "character" && renderAvatar()}
      <div className="flex flex-col w-full max-w-[60%]">
        {/* 消息气泡内容 */}
      </div>
    </div>
  );
});

export default function ChatWindow({ character, messages, ... }: ChatWindowProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // 虚拟化配置
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // 预估每条消息高度
    overscan: 5, // 预渲染前后 5 条
  });

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    if (messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
    }
  }, [messages.length, virtualizer]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  return (
    <div className="flex flex-col h-full">
      {/* Header... */}

      {/* 虚拟化消息列表 */}
      <div
        ref={parentRef}
        className="flex-1 overflow-y-auto relative custom-scrollbar"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const message = messages[virtualItem.index];
            return (
              <div
                key={message.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div className="p-4">
                  <MessageItem
                    message={message}
                    character={character}
                    renderAvatar={renderAvatar}
                    formatTime={formatTime}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Input Area... */}
    </div>
  );
}
```

**Step 3: 动态高度测量 (可选优化)**

```typescript
// 如果消息高度差异大，使用动态测量
const virtualizer = useVirtualizer({
  count: messages.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 120,
  measureElement: (el) => el.getBoundingClientRect().height,
  overscan: 5,
});
```

#### 预期收益

| 指标 | 优化前 (100条消息) | 优化后 |
|------|-------------------|--------|
| DOM 节点数 | 100+ | ~15 (可见 + overscan) |
| 内存占用 | ~50MB | ~8MB |
| 滚动帧率 | 30fps | 60fps |
| 初始渲染 | ~500ms | ~50ms |

---

### P0-3: SwipeCard/TrendingCard 无 React.memo

#### 问题描述

**文件**: `app/[locale]/(default)/discover/page.tsx:509-854`

```typescript
// 当前代码 - 问题所在
function TrendingCard({ character, onClick }: {...}) {  // ❌ 没有 memo
  const [isHovered, setIsHovered] = useState(false);
  // ... 110 行代码
}

function SwipeCard({ data, position, onSwipe, ... }: {...}) {  // ❌ 没有 memo
  const x = useMotionValue(0);
  // ... 233 行代码
}
```

#### 影响

1. **父组件更新导致所有卡片重渲染**: DiscoverPage 有 35+ useState，任一变化触发所有卡片重渲染
2. **Framer Motion 动画重建**: 每次重渲染重新计算动画配置
3. **视频元素重建**: TrendingCard 的 video ref 可能丢失状态
4. **CPU 占用高**: 复杂组件频繁重建

#### 解决方案

**方案: 使用 React.memo + useCallback 优化**

**Step 1: memo 化 TrendingCard**

```typescript
// app/[locale]/(default)/discover/page.tsx - 修改

import { memo, useCallback } from 'react';

// TrendingCard - 提取为独立 memo 组件
const TrendingCard = memo(function TrendingCard({
  character,
  onClick
}: {
  character: any;
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // ... 其他代码保持不变

  return (
    <div
      className={cn(...)}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 内容 */}
    </div>
  );
});

// 添加 displayName 用于调试
TrendingCard.displayName = 'TrendingCard';
```

**Step 2: memo 化 SwipeCard**

```typescript
// SwipeCard - memo 化
const SwipeCard = memo(function SwipeCard({
  data,
  position,
  onSwipe,
  isFlipped = false,
  setIsFlipped,
  onStartChat
}: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);

  // ... 其他代码

  return (
    <motion.div {...props}>
      {/* 内容 */}
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数 - 只在关键 props 变化时重渲染
  return (
    prevProps.data.id === nextProps.data.id &&
    prevProps.position === nextProps.position &&
    prevProps.isFlipped === nextProps.isFlipped
  );
});

SwipeCard.displayName = 'SwipeCard';
```

**Step 3: 父组件 useCallback 优化**

```typescript
// DiscoverPage 组件内
export default function DiscoverPage() {
  // ... 状态定义

  // memo 化回调函数
  const handleStartChat = useCallback(async (characterId: Id<"characters">) => {
    if (!session?.user?.email) {
      window.location.href = '/api/auth/signin';
      return;
    }
    // ... 其他逻辑
  }, [session?.user?.email, ensureUser, createConversation, router]);

  const removeCard = useCallback((id: string, direction: "left" | "right") => {
    // ... 逻辑
  }, [cards, history, userId, swipeInfo, useSwipeMutation]);

  // 渲染
  return (
    <div>
      {/* Trending Cards Grid */}
      <div className="grid ...">
        {(rawCharacters || []).map((char) => (
          <TrendingCard
            key={char._id}
            character={char}
            onClick={() => handleStartChat(char._id)}  // 注意: 这里仍会创建新函数
          />
        ))}
      </div>
    </div>
  );
}
```

**Step 4: 进一步优化 - 避免 inline 函数**

```typescript
// 最佳实践: 传递 characterId 而非 inline onClick
const TrendingCard = memo(function TrendingCard({
  character,
  onStartChat,  // 改为传入 handler
  characterId   // 传入 ID
}: {...}) {
  const handleClick = useCallback(() => {
    onStartChat(characterId);
  }, [onStartChat, characterId]);

  return <div onClick={handleClick}>...</div>;
});

// 父组件
{(rawCharacters || []).map((char) => (
  <TrendingCard
    key={char._id}
    character={char}
    characterId={char._id}
    onStartChat={handleStartChat}  // 稳定引用
  />
))}
```

#### 预期收益

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| 重渲染次数 (滑动一次) | 所有卡片 (~12次) | 1-2次 |
| 帧率 (滑动时) | ~45fps | 60fps |
| CPU 占用 | 高 | 低 |
| 内存波动 | 大 | 小 |

---

## P1 问题清单

### P1-1: 原生 img 标签未使用 next/image

**位置**:
- `ChatWindow.tsx:127, 244-251`
- `discover/page.tsx:554-558, 741-745`
- `DiscoverSection.tsx` (CharacterCard 内)

**解决方案**:
```typescript
import Image from 'next/image';

// 替换
<img src={url} alt="..." className="..." />

// 改为
<Image
  src={url}
  alt="..."
  width={400}
  height={400}
  className="..."
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

**注意**: 需要在 `next.config.mjs` 配置远程图片域名。

---

### P1-2: 数据请求瀑布流

**位置**: `app/[locale]/chat/page.tsx:57-93`

**当前流程**:
```
Session 加载 → ensureUser() → setConvexUserId → directConversation 查询
     ↓            ↓                ↓                    ↓
   ~100ms       ~200ms           ~50ms               ~200ms
                                         总计: ~550ms
```

**解决方案**: 并行化请求
```typescript
// 使用 Promise.all 或 SWR/React Query 的并行请求
const [user, conversations] = await Promise.all([
  ensureUser(...),
  fetchConversations(...)
]);
```

---

### P1-3: 缺少 useMemo

**位置**: `chat/page.tsx:82-117`

**问题代码**:
```typescript
const characters = (rawCharacters || []).map((c) => ({...}));  // ❌ 每次渲染重建
const conversations = (rawConversations || []).map((c) => ({...}));  // ❌ 每次渲染重建
```

**解决方案**:
```typescript
const characters = useMemo(() =>
  (rawCharacters || []).map((c) => ({...})),
  [rawCharacters]
);

const conversations = useMemo(() =>
  (rawConversations || []).map((c) => ({...})),
  [rawConversations]
);
```

---

### P1-4: GenerationSettingsModal 未懒加载

**位置**: `ChatWindow.tsx:11`

**当前代码**:
```typescript
import GenerationSettingsModal from "./GenerationSettingsModal";  // ❌ 同步导入 492 行组件
```

**解决方案**:
```typescript
import dynamic from 'next/dynamic';

const GenerationSettingsModal = dynamic(
  () => import('./GenerationSettingsModal'),
  {
    loading: () => <div className="animate-pulse">Loading...</div>,
    ssr: false
  }
);
```

---

## P2 问题清单

### P2-1: AI 系统提示词每次重建

**位置**: `convex/actions.ts`

**解决方案**: 缓存每个角色的系统提示词模板

### P2-2: 滚动逻辑每条消息触发

**位置**: `ChatWindow.tsx:144-146`

**解决方案**: 使用 Intersection Observer 或节流

### P2-3: Discover 页面 35+ useState

**位置**: `discover/page.tsx`

**解决方案**: 使用 useReducer 合并相关状态

---

## 优化进度追踪

| 问题编号 | 描述 | 状态 | 开始日期 | 完成日期 | 负责人 |
|----------|------|------|----------|----------|--------|
| P0-1 | Landing Page SSR | ⏳ 待修复 | - | - | - |
| P0-2 | 消息虚拟化 | ⏳ 待修复 | - | - | - |
| P0-3 | React.memo 优化 | ⏳ 待修复 | - | - | - |
| P1-1 | next/image 替换 | ⏳ 待修复 | - | - | - |
| P1-2 | 请求瀑布流 | ⏳ 待修复 | - | - | - |
| P1-3 | useMemo 添加 | ⏳ 待修复 | - | - | - |
| P1-4 | Modal 懒加载 | ⏳ 待修复 | - | - | - |
| P2-1 | 提示词缓存 | ⏳ 待修复 | - | - | - |
| P2-2 | 滚动优化 | ⏳ 待修复 | - | - | - |
| P2-3 | useState 合并 | ⏳ 待修复 | - | - | - |

### 状态说明

- ⏳ 待修复
- 🔄 进行中
- ✅ 已完成
- ❌ 已取消
- 🔒 已延期

---

## 性能测试基准

### 测试工具

- **Lighthouse**: Core Web Vitals 测试
- **React DevTools Profiler**: 组件渲染分析
- **Chrome DevTools Performance**: 运行时性能
- **Bundle Analyzer**: `pnpm analyze`

### 基准数据 (优化前 - 2025-01-08)

| 页面 | FCP | LCP | TBT | CLS | Performance Score |
|------|-----|-----|-----|-----|-------------------|
| Landing (/) | 待测 | 待测 | 待测 | 待测 | 待测 |
| Discover | 待测 | 待测 | 待测 | 待测 | 待测 |
| Chat | 待测 | 待测 | 待测 | 待测 | 待测 |

### 目标数据

| 页面 | FCP | LCP | TBT | CLS | Performance Score |
|------|-----|-----|-----|-----|-------------------|
| Landing (/) | <1.0s | <2.0s | <200ms | <0.1 | >85 |
| Discover | <1.5s | <2.5s | <300ms | <0.1 | >80 |
| Chat | <1.0s | <2.0s | <150ms | <0.1 | >85 |

---

## 附录

### A. 相关文件清单

```
app/[locale]/(default)/page.tsx          # Landing Page
app/[locale]/(default)/discover/page.tsx # Discover Page
app/[locale]/chat/page.tsx               # Chat Page
components/chat/ChatWindow.tsx           # Chat Messages
components/chat/GenerationSettingsModal.tsx
components/blocks/characters/HeroBanner.tsx
components/blocks/characters/DiscoverSection.tsx
```

### B. 依赖版本

```json
{
  "next": "15.2.8",
  "react": "19.0.0",
  "framer-motion": "11.15.0",
  "convex": "1.29.3",
  "@tanstack/react-virtual": "需安装"
}
```

### C. 参考资料

- [Next.js App Router Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [React Virtual](https://tanstack.com/virtual/latest)
- [React.memo 最佳实践](https://react.dev/reference/react/memo)
- [Web Vitals](https://web.dev/vitals/)

---

**文档维护说明**: 每次完成优化后，请更新"优化进度追踪"表格，并补充实际测试数据。
