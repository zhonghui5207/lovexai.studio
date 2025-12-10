# Stripe 产品配置指南

**更新日期**: 2025-12-10

---

## 📋 需要创建的 Stripe 产品

登录 [Stripe Dashboard](https://dashboard.stripe.com) → Products → 创建以下产品

---

## 💎 订阅产品 (Subscriptions)

### 1. PLUS 订阅

| 字段 | 值 |
|------|------|
| **Product Name** | LoveXAI Plus |
| **Description** | 500 credits/month, 30 swipes/day, Plus features |

**价格 (Prices)**:
| Price ID | 金额 | 周期 | 备注 |
|----------|------|------|------|
| `price_plus_monthly` | $9.99 | Monthly | 月付 |
| `price_plus_yearly` | $83.88 | Yearly | 年付 ($6.99/月) |

---

### 2. PRO 订阅

| 字段 | 值 |
|------|------|
| **Product Name** | LoveXAI Pro |
| **Description** | 2000 credits/month, 50 swipes/day, Pro features |

**价格 (Prices)**:
| Price ID | 金额 | 周期 | 备注 |
|----------|------|------|------|
| `price_pro_monthly` | $19.99 | Monthly | 月付 |
| `price_pro_yearly` | $167.88 | Yearly | 年付 ($13.99/月) |

---

### 3. ULTIMATE 订阅

| 字段 | 值 |
|------|------|
| **Product Name** | LoveXAI Ultimate |
| **Description** | 5000 credits/month, Unlimited swipes, All features |

**价格 (Prices)**:
| Price ID | 金额 | 周期 | 备注 |
|----------|------|------|------|
| `price_ultimate_monthly` | $29.99 | Monthly | 月付 |
| `price_ultimate_yearly` | $251.88 | Yearly | 年付 ($20.99/月) |

---

## 🪙 积分包产品 (One-time Payments)

| Product Name | Price | Credits | Bonus | Price ID |
|--------------|-------|---------|-------|----------|
| 500 Credits | $2.99 | 500 | 0 | `credits_500` |
| 1500 Credits | $7.99 | 1500 | +100 | `credits_1500` |
| 3000 Credits | $14.99 | 3000 | +300 | `credits_3000` |
| 6000 Credits | $27.99 | 6000 | +800 | `credits_6000` |
| 12000 Credits | $49.99 | 12000 | +2000 | `credits_12000` |
| 30000 Credits | $99.99 | 30000 | +7500 | `credits_30000` |

---

## 🔧 配置步骤

### Step 1: 创建订阅产品

1. 进入 Stripe Dashboard → Products
2. 点击 "Add Product"
3. 填写 Product Name 和 Description
4. 在 Pricing 部分:
   - 选择 "Recurring"
   - 添加 Monthly 和 Yearly 两个价格
5. 保存后，复制生成的 Price ID

### Step 2: 创建积分包产品

1. 进入 Products → Add Product
2. 填写 Product Name (如 "500 Credits")
3. 在 Pricing 部分:
   - 选择 "One time"
   - 填写价格
4. 保存并复制 Price ID

### Step 3: 更新代码中的 Price ID

在 `app/[locale]/(default)/pricing/page.tsx` 中更新:

```typescript
// 订阅计划
{
  id: "plus",
  // ...
  product_id: "price_1XxxXXxxx" // ← 替换为实际的 Stripe Price ID
}

// 积分包
{
  credits: 500,
  price: 2.99,
  product_id: "price_1YyyYYyyy" // ← 替换为实际的 Stripe Price ID
}
```

### Step 4: 配置 Webhook

1. 进入 Developers → Webhooks
2. 点击 "Add endpoint"
3. Endpoint URL: `https://yourdomain.com/api/stripe-notify`
4. 选择事件:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
5. 复制 Webhook Secret 到 `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

---

## ✅ 检查清单

- [ ] 创建 3 个订阅产品 (Plus, Pro, Ultimate)
- [ ] 每个订阅产品创建 2 个价格 (Monthly, Yearly)
- [ ] 创建 6 个积分包产品
- [ ] 复制所有 Price ID 到代码中
- [ ] 配置 Webhook endpoint
- [ ] 测试模式下完成一次完整支付流程

---

## 🧪 测试

使用 Stripe 测试卡号:
- **卡号**: 4242 4242 4242 4242
- **有效期**: 任意未来日期
- **CVC**: 任意3位数

---

**完成后，在代码中更新 Price ID 即可正常使用！**
