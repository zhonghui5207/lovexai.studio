# 项目瘦身分析报告

生成时间：2026-01-02

## 🗑️ 可以删除的文件

### 1. 废弃的支付相关文件

#### Stripe 相关（已改用 Payblis）
- ✅ **确认删除**
  - `STRIPE_SETUP.md` - Stripe 设置文档
  - `app/api/stripe-notify/` - Stripe webhook（已用 payblis-webhook 替代）

### 2. 空文件夹
- ✅ **确认删除**
  - `app/api/crypto-checkout/` - 空文件夹（已用 `checkout/crypto` 替代）

### 3. 测试和示例文件
- ⚠️ **建议删除**（如果不再需要测试数据）
  - `test_characters_10_with_urls.json` (36KB)
  - `test_characters_20_with_urls.json` (39KB)
  - `test_characters_30_with_urls.json` (107KB)
  - `theme-preview.html` (12KB)

### 4. 文档类文件（可选清理）
- ⚠️ **可选删除**（根据需要保留）
  - `BUSINESS_MODEL.md` - 商业模式文档
  - `CHARACTER_PIPELINE.md` - 角色流程文档
  - `CLAUDE.md` - Claude 相关文档
  - `MIGRATION_PLAN.md` - 迁移计划
  - `PRE_LAUNCH_CHECKLIST.md` - 上线检查清单
  - `lovexai-roadmap.md` - 路线图
  - `wrangler.toml.example` - Cloudflare Workers 配置示例（如果不用 Cloudflare）

### 5. 系统生成文件
- ⚠️ **建议删除**（应该被 .gitignore 忽略）
  - `.DS_Store` - macOS 系统文件
  - `tsconfig.tsbuildinfo` - TypeScript 编译缓存（2.1MB）

### 6. 可能未使用的组件
需要人工确认是否使用：
- `components/blocks/blog/` - 博客组件
- `components/blocks/blog-detail/` - 博客详情组件
- `components/blocks/branding/` - 品牌组件
- `components/blocks/feature1/` - 特性1组件
- `components/blocks/feature2/` - 特性2组件
- `components/blocks/feature3/` - 特性3组件
- `components/blocks/showcase/` - 展示组件
- `components/blocks/stats/` - 统计组件
- `components/blocks/table/` - 表格组件
- `components/blocks/testimonial/` - 推荐语组件

---

## 📦 NPM 包清理

### 可以卸载的依赖

检查以下包是否还在使用：

```bash
# Stripe 相关（如果完全不用了）
pnpm remove @stripe/stripe-js stripe

# 检查其他可能不用的包
pnpm ls --depth=0 | grep -E "(unused|extraneous)"
```

---

## 🎯 推荐清理顺序

### 阶段 1：安全删除（确认不影响）
1. 删除 Stripe 相关文件
2. 删除空文件夹
3. 删除系统生成文件

### 阶段 2：测试后删除
1. 删除测试 JSON 文件
2. 删除未使用的文档

### 阶段 3：需要代码检查
1. 搜索代码中是否引用了这些组件
2. 确认后删除未使用的组件

---

## 📝 执行命令

### 删除 Stripe 相关
```bash
rm STRIPE_SETUP.md
rm -rf app/api/stripe-notify
```

### 删除空文件夹
```bash
rm -rf app/api/crypto-checkout
```

### 删除测试文件
```bash
rm test_characters_*.json
rm theme-preview.html
rm .DS_Store
```

### 删除构建缓存
```bash
rm tsconfig.tsbuildinfo
```

### 卸载 Stripe 包
```bash
pnpm remove @stripe/stripe-js stripe
```

---

## ⚠️ 注意事项

1. **删除前备份**：建议先 git commit 当前状态
2. **测试验证**：删除后运行 `pnpm build` 确保构建成功
3. **分步执行**：不要一次性删除所有文件

---

## 📊 预估节省空间

- 测试 JSON 文件：~182KB
- tsconfig.tsbuildinfo：~2.1MB
- 文档文件：~70KB
- **总计**：约 2.3MB（不含 node_modules）

卸载 Stripe 依赖后，node_modules 可能减少 ~10-20MB
