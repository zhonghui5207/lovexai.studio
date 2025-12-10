# LoveXAI Studio 上线前检查清单

**生成时间**: 2025-12-10  
**项目状态**: 开发完成，待上线优化

---

## 📋 总览

| 类别 | 状态 | 优先级 |
|------|------|--------|
| 🔴 严重问题 | 2 项 | 必须修复 |
| 🟡 需优化项 | 8 项 | 建议修复 |
| 🟢 可选优化 | 5 项 | 可延后 |

---

## 🔴 严重问题 (必须在上线前修复)

### 1. ⚠️ 环境变量缺失检查

**问题**: `.env.example` 中列出的部分环境变量在 `.env.local` 中可能未配置完整

**缺失的关键配置**:
```
# 登录相关 - 确认已配置
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=

# 存储相关 - 目前可能未使用但会触发超时错误
STORAGE_ENDPOINT=
STORAGE_REGION=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_BUCKET=
STORAGE_DOMAIN=

# 分析相关
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=
NEXT_PUBLIC_OPENPANEL_CLIENT_ID=
```

**✅ 修复方案**: 检查并填写所有生产环境需要的环境变量

---

### 2. ⚠️ API Key 暴露风险

**问题**: `checkout/route.ts` 第178行使用了错误的环境变量名
```typescript
public_key: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY, // 应该是 STRIPE_PUBLIC_KEY
```

**影响**: 客户端可能收不到 Stripe public key

**✅ 修复方案**: 确认 `.env.local` 中 `STRIPE_PUBLIC_KEY` 和 `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` 都已配置

---

## 🟡 需优化项 (建议上线前修复)

### 3. ESLint 错误 (约50+个问题)

**问题类型**:
- 未使用的导入和变量 (~20处)
- 使用 `any` 类型 (~10处)
- 使用 `<img>` 而非 `<Image>` (~10处)
- 未转义的特殊字符 (`'`, `"`)
- 使用 `<a>` 而非 `<Link>`

**影响**: 代码质量、性能优化、SEO

**✅ 修复方案**: 
```bash
# 自动修复部分问题
pnpm lint --fix
# 手动修复剩余问题
```

---

### 4. 重复的 Convex 查询

**问题**: `HeroBanner.tsx` 和 `DiscoverSection.tsx` 都在调用相同的查询
```typescript
const rawCharacters = useQuery(api.characters.list, { activeOnly: true });
```

**影响**: 首页加载时发起两次相同请求，可能导致 TimeoutError

**✅ 修复方案**: 提升到父组件或使用 Context 共享数据

---

### 5. Package.json 项目名称

**问题**: `package.json` 中项目名仍为原模板名称
```json
"name": "shipany-template-one"
```

**✅ 修复方案**: 改为 `"name": "lovexai-studio"`

---

### 6. 硬编码的外部图片 URL

**问题**: `HeroBanner.tsx` 第169行使用 pravatar.cc 作为用户头像
```typescript
<img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
```

**影响**: 依赖外部服务，可能不稳定

**✅ 修复方案**: 使用本地静态资源或 R2 存储的图片

---

### 7. 控制台日志过多

**问题**: 多处代码包含开发调试日志
- `auth/config.ts` - 登录相关日志
- `contexts/app.tsx` - 用户信息日志
- `app/api/checkout/route.ts` - 支付日志

**✅ 修复方案**: 使用环境变量控制日志输出
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log(...)
}
```

---

### 8. Stripe Webhook URL

**问题**: 需要确保生产环境 Stripe Webhook 指向正确的 URL

**✅ 检查项**:
- Stripe Dashboard 中配置的 Webhook URL
- 应为: `https://yourdomain.com/api/stripe-notify`
- 确认 `STRIPE_WEBHOOK_SECRET` 是生产环境的密钥

---

### 9. Next.js 图片优化配置

**问题**: `next.config.mjs` 中 remotePatterns 配置过于宽松
```javascript
remotePatterns: [{ protocol: "https", hostname: "*" }]
```

**✅ 修复方案**: 限制为实际使用的域名
```javascript
remotePatterns: [
  { protocol: "https", hostname: "cdn.lovexai.studio" },
  { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
]
```

---

### 10. 错误处理增强

**问题**: 部分 API 路由的错误处理可以更完善

**位置**: 
- `services/order.ts` - 支付回调处理
- `convex/actions.ts` - AI 响应生成

**✅ 建议**: 添加更详细的错误日志和用户友好的错误提示

---

## 🟢 可选优化 (可延后处理)

### 11. SEO 优化

- [ ] 添加 `robots.txt`
- [ ] 添加 `sitemap.xml`
- [ ] 检查各页面的 meta description

### 12. 性能优化

- [ ] 使用 `React.lazy()` 懒加载大组件
- [ ] 添加 Loading UI 状态
- [ ] 考虑使用 ISR (增量静态再生成)

### 13. 安全加固

- [ ] 添加 Rate Limiting
- [ ] 添加 CORS 配置
- [ ] 检查 CSP (Content Security Policy)

### 14. 监控与日志

- [ ] 接入 Sentry 或类似的错误监控
- [ ] 配置 Vercel Analytics
- [ ] 添加业务指标监控

### 15. 备份与恢复

- [ ] 确保 Convex 数据有备份策略
- [ ] 文档化恢复流程

---

## 📦 上线部署检查

### Vercel 部署
```bash
# 1. 确保所有环境变量已在 Vercel 中配置
# 2. 运行构建测试
pnpm build

# 3. 部署
vercel --prod
```

### Convex 部署
```bash
# 确保 Convex 生产环境已部署
npx convex deploy
```

### 域名与 SSL
- [ ] 域名已解析到 Vercel
- [ ] SSL 证书已配置
- [ ] 确认 `NEXT_PUBLIC_WEB_URL` 为生产域名

---

## 🚀 推荐上线顺序

1. **第一阶段** (必须):
   - 修复严重问题 #1, #2
   - 确认支付流程可用
   - 配置生产环境变量

2. **第二阶段** (强烈建议):
   - 修复 ESLint 错误
   - 优化重复查询
   - 更新项目名称

3. **第三阶段** (可延后):
   - SEO 优化
   - 性能优化
   - 监控接入

---

**生成者**: Claude AI  
**最后更新**: 2025-12-10
