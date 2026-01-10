# .next 目录解析

## 📁 本质

`.next` 是 **Next.js 的编译缓存**，就像游戏里的"预加载文件"。

```
源代码 (app/, components/)
    ↓ 编译
.next/ (编译后的代码)
    ↓ 运行
浏览器/Node.js
```

## 🔄 开发模式 vs 生产模式

### 开发模式 (`pnpm dev`)

```
你修改代码
    ↓
Next.js 检测变化
    ↓
快速编译（不优化）
    ↓
写入 .next/（临时缓存）
    ↓
浏览器刷新
```

**特点**:
- `.next` 是**临时缓存**
- **可删除**，`pnpm dev` 会自动重建
- 支持热更新

### 生产模式 (`pnpm build + start`)

```
运行 pnpm build
    ↓
深度优化编译
    ↓
生成 .next/
    ↓
运行 node server.js
    ↓
使用 .next/ 里的代码
```

**特点**:
- `.next` 是**必需文件**
- **不可删除**，删除后无法运行
- 包含优化后的代码

## 📂 .next 目录结构

```
.next/
├── server/              # 服务端代码
│   └── app/            # 页面编译后
├── static/             # 静态资源
│   └── chunks/         # 代码分割
├── standalone/         # ⭐ 独立服务器
│   ├── server.js       # 自包含服务器
│   └── node_modules/   # 精简依赖
└── cache/              # 构建缓存
```

## 🎯 为什么开发时删除不影响？

```
源代码 = Word 文档（真货）
.next = 打印的 PDF（副本）

删除 PDF:
❌ Word 文档还在
✅ 需要时再打印一份
```

**口诀**:
- 开发模式: `.next` 是草稿纸，随便撕
- 生产模式: `.next` 是试卷，必须保留

## 💡 实际场景

```bash
# 场景 1: 本地开发（删除没问题）
rm -rf .next && pnpm dev  # ✅ 正常工作

# 场景 2: 本地构建（需要 .next）
pnpm build && pnpm start  # ✅ 使用 .next

# 场景 3: Docker 构建（.next 在镜像里）
docker build -t lovexai .  # ✅ .next 打包进镜像
```

## 🔍 Docker 只需要 .next

```dockerfile
# Dockerfile
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 只复制编译产物，不复制源代码
```

**原因**: 生产环境运行的是编译后的代码，不需要源代码。
