# LoveXAI 项目架构分析与优化建议

生成时间：2026-01-04

---

## 1️⃣ 当前架构分析

### 技术栈

```
┌─────────────────────────────────────────┐
│         Frontend (Next.js 15)           │
│  - App Router (RSC)                     │
│  - Server Components + Client Components│
│  - API Routes (Edge/Node.js)            │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Backend Services                │
│  - Convex (Database + Real-time)        │
│  - NextAuth (Authentication)            │
│  - Payment APIs (ZhuFuFm, Payblis, etc) │
│  - AI APIs (OpenRouter, etc)            │
└─────────────────────────────────────────┘
```

### 当前架构特点

**优点**：
- ✅ **全栈一体**：前后端在同一代码库，开发效率高
- ✅ **SSR/ISR**：SEO 友好，首屏加载快
- ✅ **Edge Functions**：API Routes 可部署到边缘节点
- ✅ **Convex 实时性**：数据库 + 实时订阅一体化
- ✅ **零配置部署**：Vercel 一键部署

**缺点**：
- ⚠️ **耦合度高**：前后端代码在一起，难以独立扩展
- ⚠️ **Vercel 限制**：serverless 函数有执行时间限制（10s/300s）
- ⚠️ **成本问题**：高流量下 Vercel 费用昂贵
- ⚠️ **NSFW 风险**：Vercel 对成人内容有潜在限制

---

## 2️⃣ 前后端分离方案

### 方案 A：渐进式分离（推荐）

**架构设计**：

```
┌─────────────────┐      ┌─────────────────┐
│   Frontend      │      │   Backend API   │
│   (Vercel)      │─────▶│   (VPS/Railway) │
│   Next.js SSG   │      │   Express/Fastify│
└─────────────────┘      └─────────────────┘
         │                        │
         │                        ├──▶ Convex
         │                        ├──▶ Payment APIs
         │                        └──▶ AI Services
         │
         └──▶ Cloudflare CDN
```

**实施步骤**：

#### Phase 1: API 路由分离（难度：⭐⭐⭐）

1. **创建独立后端服务**

```bash
# 在 VPS 上
mkdir lovexai-backend
cd lovexai-backend
npm init -y
npm install express cors dotenv helmet
```

**目录结构**：
```
lovexai-backend/
├── src/
│   ├── routes/
│   │   ├── auth.ts          # 认证
│   │   ├── checkout.ts      # 支付
│   │   ├── chat.ts          # AI 对话
│   │   └── characters.ts    # 角色管理
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── cors.ts
│   ├── services/
│   │   ├── convex.ts
│   │   ├── payment.ts
│   │   └── ai.ts
│   └── server.ts
├── .env
└── package.json
```

2. **迁移 API Routes**

将现有的 API Routes 迁移到后端：

**之前（Next.js）**：
```typescript
// app/api/checkout/wechat/route.ts
export async function POST(req: Request) {
  // 处理支付
}
```

**之后（Express）**：
```typescript
// src/routes/checkout.ts
router.post('/checkout/wechat', async (req, res) => {
  // 处理支付
});
```

3. **配置 CORS**

```typescript
// src/middleware/cors.ts
import cors from 'cors';

export const corsMiddleware = cors({
  origin: [
    'https://lovexai.studio',
    'https://www.lovexai.studio',
    'http://localhost:3000' // 开发环境
  ],
  credentials: true
});
```

4. **前端调用更新**

```typescript
// 之前
const res = await fetch('/api/checkout/wechat', {...});

// 之后
const res = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/checkout/wechat`, 
  {...}
);
```

#### Phase 2: SSR → SSG 转换（难度：⭐⭐）

**保留在 Vercel**：
- 静态页面（Landing, Pricing）
- 客户端渲染组件

**迁移到 VPS**：
- API Routes
- Server-side 逻辑
- 数据库操作（通过 Convex）

---

### 方案 B：完全分离（难度：⭐⭐⭐⭐⭐）

```
┌─────────────────┐      ┌─────────────────┐      ┌──────────────┐
│   Frontend      │      │   BFF Layer     │      │   Backend    │
│   (Cloudflare)  │─────▶│   (VPS)         │─────▶│   Services   │
│   Pure SPA      │      │   GraphQL/REST  │      │   (Microservices)
└─────────────────┘      └─────────────────┘      └──────────────┘
```

**适用场景**：
- ❌ 当前不推荐（过度设计）
- ✅ 未来用户量 > 100K 时考虑

---

## 3️⃣ Vercel 对 NSFW 的接受度

### ⚠️ 风险评估

**Vercel ToS 限制**：

从 Vercel 的使用条款来看：

> **Prohibited Content**:
> - Excessively violent or disturbing content
> - Content that is illegal, promotes illegal activities
> - **Adult sexual content** (有争议区域)

**NSFW 内容分类**：

| 内容类型 | Vercel 风险 | 建议 |
|---------|-------------|------|
| 文字聊天（NSFW） | 🟡 中等 | 可以，但需谨慎 |
| AI 生成图片（裸露） | 🔴 高 | **不推荐** |
| 真人色情图片/视频 | 🔴 极高 | **禁止** |
| 成人角色扮演（纯文本） | 🟢 低 | 相对安全 |

### 🛡️ 安全建议

#### 方案 1：混合部署（推荐）

```
Vercel（前端 + 轻量 API）
  ├── 静态页面
  ├── 用户认证
  ├── 支付系统
  └── 安全内容 API

VPS（后端 + NSFW 服务）
  ├── AI 对话服务
  ├── NSFW 内容生成
  ├── 图片存储
  └── 敏感数据处理
```

**优点**：
- ✅ 降低 Vercel 风险
- ✅ 敏感服务独立部署
- ✅ 更好的控制权

#### 方案 2：完全迁移到 VPS

**推荐 VPS 提供商**：

| 提供商 | NSFW 友好度 | 价格 | 性能 |
|--------|------------|------|------|
| **DigitalOcean** | ✅ 高 | $6/月起 | ⭐⭐⭐⭐ |
| **Vultr** | ✅ 高 | $6/月起 | ⭐⭐⭐⭐ |
| **Hetzner** | ✅ 中 | €4/月起 | ⭐⭐⭐⭐⭐ |
| **AWS/GCP** | 🟡 中 | $10/月起 | ⭐⭐⭐⭐⭐ |
| **Linode** | ✅ 高 | $5/月起 | ⭐⭐⭐⭐ |

**部署建议**：
```bash
# 使用 Docker + Nginx
docker-compose up -d

# 配置 SSL
certbot --nginx -d lovexai.studio -d www.lovexai.studio
```

---

## 4️⃣ 利用 Cloudflare CDN

### 完整架构方案

```
┌─────────────────────────────────────────────┐
│         Cloudflare (CDN + Security)         │
│  - DNS                                      │
│  - CDN (缓存静态资源)                        │
│  - WAF (防火墙)                             │
│  - DDoS Protection                          │
│  - SSL/TLS                                  │
└─────────────────────────────────────────────┘
                    ↓
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌─────────▼────────┐
│   Frontend     │    │   Backend API    │
│   (Vercel/VPS) │    │   (VPS)          │
└────────────────┘    └──────────────────┘
```

### 实施步骤

#### Step 1: DNS 配置

```
登录 Cloudflare Dashboard
1. 添加网站：lovexai.studio
2. 更新 Nameservers 到域名注册商
3. 等待 DNS 生效（24-48小时）
```

#### Step 2: 配置 CDN 规则

**Page Rules 配置**：

```
规则 1: 静态资源缓存
  - URL: lovexai.studio/imgs/*
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month

规则 2: API 不缓存
  - URL: lovexai.studio/api/*
  - Cache Level: Bypass

规则 3: 字体/CSS/JS 缓存
  - URL: lovexai.studio/_next/static/*
  - Cache Level: Cache Everything
  - Browser Cache TTL: 1 year
```

#### Step 3: 启用安全功能

**WAF 规则**：
```
1. 启用 OWASP Core Ruleset
2. 添加自定义规则：
   - 阻止已知恶意 IP
   - 速率限制（100 req/min per IP）
   - 地域限制（可选）
```

**Bot Protection**：
```
- 启用 Bot Fight Mode
- 配置 Challenge Passage
- 白名单合法爬虫（Google, Bing）
```

#### Step 4: 性能优化

**Auto Minify**：
- ✅ JavaScript
- ✅ CSS
- ✅ HTML

**Brotli Compression**：
- ✅ 启用

**HTTP/3 (QUIC)**：
- ✅ 启用

**Early Hints**：
- ✅ 启用

---

## 📊 推荐部署方案对比

### 方案对比表

| 方案 | 成本 | 复杂度 | NSFW安全 | 性能 | 推荐度 |
|------|------|--------|----------|------|--------|
| **当前（纯 Vercel）** | $20/月 | ⭐ | 🔴 低 | ⭐⭐⭐⭐ | ⚠️ 短期可行 |
| **混合（Vercel + VPS）** | $30/月 | ⭐⭐⭐ | 🟢 高 | ⭐⭐⭐⭐⭐ | ✅ **推荐** |
| **完全 VPS** | $15/月 | ⭐⭐⭐⭐ | 🟢 高 | ⭐⭐⭐⭐ | ✅ 长期最佳 |
| **Cloudflare Pages + Workers** | $5/月 | ⭐⭐⭐ | 🟡 中 | ⭐⭐⭐⭐⭐ | 🟡 可考虑 |

---

## 🎯 我的建议

### 短期（1-3个月）

**继续使用 Vercel，但做以下优化**：

1. ✅ **内容分类**
   - 将 NSFW 标记清晰
   - 添加年龄验证
   - Terms of Service 明确说明

2. ✅ **监控账号状态**
   - 定期检查 Vercel Dashboard
   - 准备备份部署方案

3. ✅ **启用 Cloudflare**
   - 配置 DNS
   - 开启 CDN 缓存
   - 启用 WAF

### 中期（3-6个月）

**渐进式迁移到混合架构**：

```bash
# Phase 1: 部署后端到 VPS
1. 租用 VPS（推荐 Hetzner €4/月）
2. 迁移敏感 API（AI对话、图片生成）
3. 保留支付和认证在 Vercel

# Phase 2: 配置 Cloudflare
1. 全站接入 Cloudflare
2. 配置缓存规则
3. 启用 WAF

# Phase 3: 测试和优化
1. 压力测试
2. 性能优化
3. 监控和告警
```

### 长期（6个月+）

**完全迁移到自有 VPS**：

```
┌────────────────────────────────────────┐
│         Cloudflare (全球 CDN)          │
└────────────────┬───────────────────────┘
                 │
         ┌───────▼────────┐
         │   VPS Cluster  │
         │   Nginx + PM2  │
         │   Next.js App  │
         │   API Server   │
         └────────────────┘
                 │
         ┌───────▼────────┐
         │    Convex      │
         └────────────────┘
```

---

## 💰 成本预算

### 混合方案月成本

```
Vercel (Hobby)      : $0      (或 Pro $20)
VPS (Hetzner CX21)  : €4.5    (~$5)
Cloudflare (Free)   : $0
Convex (Starter)    : $25
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
总计                : ~$30/月
```

### 完全自建月成本

```
VPS (CX41 或更高)   : €12     (~$13)
Cloudflare (Free)   : $0
Convex (Starter)    : $25
Backup Storage      : $2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
总计                : ~$40/月
```

---

## 🚀 立即行动清单

### 本周执行

- [ ] 注册 Cloudflare 并接入 DNS
- [ ] 配置基础 CDN 规则
- [ ] 启用 SSL/TLS 加密
- [ ] 设置 WAF 基础规则

### 本月执行

- [ ] 租用 VPS 测试服务器
- [ ] 搭建独立后端服务（Express）
- [ ] 迁移 AI 对话 API
- [ ] 测试混合架构性能

### 3个月内

- [ ] 完整迁移所有敏感 API
- [ ] 优化 CDN 缓存策略
- [ ] 建立监控和告警系统
- [ ] 准备完全迁移方案

---

## 📚 参考资源

- [Vercel ToS](https://vercel.com/legal/terms)
- [Cloudflare Docs](https://developers.cloudflare.com/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Hetzner Cloud](https://www.hetzner.com/cloud)

---

**需要详细讨论哪个部分？我可以帮您：**
1. 编写完整的迁移脚本
2. 配置 Docker + Nginx
3. 设置 CI/CD 流程
4. Cloudflare 详细配置
