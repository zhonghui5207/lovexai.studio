# 网站优化建议

## ✅ 已完成：支付图标优化

### 修改内容
- 使用 Next.js `Image` 组件替代 `<img>` 标签
- 添加 `priority` 预加载
- 设置固定尺寸 (24x24)
- 质量设置为 90

### 效果
- ✅ 自动 WebP 转换（Next.js 自动处理）
- ✅ 图片懒加载优化
- ✅ 响应式优化
- ✅ 减少加载闪烁

---

## 2️⃣ Footer 优化建议

### 当前问题
从截图看，Footer 有以下占位链接：
- Discord ❓
- Reddit ❓  
- Twitter ❓
- Tags ❓
- Affiliates ❓
- Guides ❓

### 优化方案

#### 方案 A：暂时隐藏（推荐）
**适用场景**：社交账号还未建立

```tsx
// 在 Footer 中添加条件渲染
{footer.social && footer.social.items?.length > 0 && (
  <ul className="flex items-center gap-4">
    {footer.social.items.map(...)}
  </ul>
)}
```

**优点**：
- ✅ 避免无效链接
- ✅ 保持界面简洁
- ✅ 日后容易添加

#### 方案 B：替换为实际内容（推荐）
保留有用的链接，删除暂时不需要的：

**保留**：
- ✅ Characters（已有）
- ✅ Image Gen（已有）
- ✅ Pricing（已有）
- ✅ Terms（法律要求）
- ✅ Privacy（法律要求）

**删除/隐藏**：
- ❌ Help Center（暂无）
- ❌ Community（暂无）
- ❌ Contact（可以用 email）
- ❌ Guidelines（暂无）

---

## 3️⃣ 侧边栏社交通道建议

### 当前问题
截图中红框标注的社交链接都是占位符。

### 取舍建议

#### 立即行动（必要）
1. **Discord** 
   - ✅ **建议**：创建 Discord 服务器
   - **理由**：NSFW 社区首选平台，用户互动强
   - **成本**：免费，1小时可设置完成

2. **Twitter/X**
   - ✅ **建议**：注册官方账号
   - **理由**：营销曝光必需
   - **成本**：免费，建议同步更新

#### 可选（次要）
3. **Reddit**
   - ⚠️ **建议**：暂时不做
   - **理由**：需要持续运营，前期优先级低

4. **Tags/Affiliates/Guides**
   - ⚠️ **建议**：暂时隐藏
   - **理由**：内容还未准备好

### 实施建议

#### 最小可行方案（MVP）
```
保留：
✅ Discord（必须创建）
✅ Twitter（必须创建）

暂时隐藏：
❌ Reddit
❌ Tags
❌ Affiliates  
❌ Guides
```

#### 代码实现
```tsx
// 只展示已有真实链接的社交平台
const activeSocial = footer.social?.items?.filter(item => 
  item.url && item.url !== '#'
);

{activeSocial && activeSocial.length > 0 && (
  <ul className="flex items-center gap-4">
    {activeSocial.map(...)}
  </ul>
)}
```

---

## 📋 优先级排序

### 🚀 立即执行（今天）
1. ✅ 支付图标优化（已完成）
2. 🔄 创建 Discord 服务器
3. 🔄 注册 Twitter 官方账号

### 📅 本周完成
4. 修改 Footer 配置，隐藏无效链接
5. 添加实际社交链接到代码

### 📆 后续优化
6. 完善 Help Center
7. 创建 Community
8. 准备 Guides 内容

---

## 🎯 建议执行方案

### Discord 设置（30分钟）
1. 创建服务器：[discord.com/new](https://discord.com/new)
2. 设置频道：
   - `#announcements` - 公告
   - `#general` - 聊天
   - `#support` - 支持
   - `#feedback` - 反馈
3. 设置 NSFW 标记
4. 获取邀请链接

### Twitter 设置（15分钟）
1. 注册：[@LoveXAI](https://twitter.com/signup)
2. 设置 Profile
3. 发第一条推文
4. 获取主页链接

### 更新代码（10分钟）
```bash
# 修改配置文件
# data/config/index.ts 或类似配置文件
social: [
  {
    icon: "discord",
    url: "https://discord.gg/YOUR_INVITE", // 真实链接
    target: "_blank"
  },
  {
    icon: "twitter", 
    url: "https://twitter.com/LoveXAI", // 真实链接
    target: "_blank"
  }
]
```

---

## ⚠️ 注意事项

1. **NSFW 合规**
   - Discord：需要设置 NSFW 服务器
   - Twitter：遵守成人内容政策

2. **品牌一致性**
   - 使用相同的用户名
   - 保持视觉风格统一

3. **运营准备**
   - 准备好管理员
   - 设置自动欢迎消息
   - 定期发布更新

---

## 📞 需要决策的问题

1. **Discord 服务器名称**：
   - `LoveXAI Official` 
   - `LoveXAI Community`
   - 其他？

2. **Twitter 账号名**：
   - `@LoveXAI`
   - `@LoveXAIStudio`
   - 其他？

3. **是否需要中文社区**：
   - Discord 中文频道？
   - 微博/小红书账号？

4. **Footer 链接取舍**：
   - Help Center：暂时用 Discord？
   - Contact：暂时用 Email？

---

请告诉我您的决定，我可以帮您：
1. 更新代码配置
2. 准备社交媒体模板
3. 创建运营指南
