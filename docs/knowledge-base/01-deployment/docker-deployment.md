# Docker 部署指南

## 📊 部署难度评估

| 指标 | 评估 |
|------|------|
| 技术难度 | ⭐⭐ (中等) |
| 代码改动 | 几乎为 0 |
| 迁移时间 | 1-2 天 |

## 🎯 核心原理

### Next.js Standalone 模式

```javascript
// next.config.mjs
output: "standalone"
```

这行配置让 Next.js 生成自包含的服务器文件，可以脱离 Vercel 独立运行。

```
源代码 (app/, components/)
    ↓ pnpm build
.next/standalone/server.js  ← 独立服务器（可 Docker 化）
```

## 🐳 Docker 魔法

### 三阶段构建

```dockerfile
# 阶段 1: 安装依赖
FROM node:18-alpine AS deps
RUN pnpm install

# 阶段 2: 构建
FROM deps AS builder
RUN pnpm build  # 生成 .next/standalone/

# 阶段 3: 运行（只复制必需文件）
FROM base AS runner
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
CMD ["node", "server.js"]
```

### 为什么只需要改环境变量？

```
应用代码
    ↓ 读取所有配置通过环境变量
.env (NEXTAUTH_URL, CONVEX_URL, STRIPE_KEY...)
    ↓ 调用
外部服务 (Convex, Stripe, Tu-zi AI, R2)
```

所有外部依赖都在云端，应用代码无需改动。

## 📋 迁移清单

### 环境变量

只需修改域名相关的变量：

| 变量 | 主站 | 测试站 |
|------|------|--------|
| `NEXTAUTH_URL` | `https://lovexai.studio` | `https://beta.lovexai.studio` |
| `NEXT_PUBLIC_WEB_URL` | `https://lovexai.studio` | `https://beta.lovexai.studio` |

其他变量保持不变。

### Webhook 配置

在各平台新增测试站 webhook：
- Stripe Dashboard
- NOWPayments
- ZhuFuFm
- Payblis

## ⚡ 快速部署

```bash
# 1. 克隆代码
git clone https://github.com/xxx/lovexai.studio.git
cd lovexai.studio

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 3. 启动容器
docker build -t lovexai .
docker run -d --env-file .env -p 3000:3000 lovexai

# 4. 配置 Nginx 反向代理
# 5. 配置 SSL
# 6. 更新 DNS
```

## ⚠️ 注意事项

1. **Convex 部署**: `pnpm build` 时自动触发
2. **Webhook 签名**: 每个部署需要独立的 `STRIPE_WEBHOOK_SECRET`
3. **环境变量**: 使用 `--env-file` 确保 Docker 容器能读取

## 🎯 总结

- Docker 部署难度低，已有 Dockerfile
- 只需修改环境变量即可迁移
- 外部服务（Convex/Stripe）无需迁移
- 预计迁移时间：1-2 天
