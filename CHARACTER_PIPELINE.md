# LoveXAI 角色批量生产流水线指南

**版本**: 1.0
**日期**: 2025-12-10
**目标**: 建立一套标准化的流水线，用于批量设计、生成和导入 1300+ 个高质量 AI 角色。

---

## 🔄 生产流程概览

1.  **Phase 1: 分类体系设计 (Taxonomy)** - 定义角色的维度、主题和模版。
2.  **Phase 2: 数据结构定义 (Schema)** - 确立标准化的 JSON 数据格式。
3.  **Phase 3: AI 生成模版 (Prompting)** - 使用 LLM 批量生成角色元数据。
4.  **Phase 4: 批量导入实现 (Import)** - 数据库导入与更新脚本。

---

## 📋 Phase 1: 角色分类体系 (Taxonomy)

为了确保角色的多样性和覆盖面，我们使用以下维度进行组合生成。

### 1.1 核心分类 (Categories)

| 分类 | 目标数量 | 占比 | 重点 |
| :--- | :--- | :--- | :--- |
| **👩 Female** | 500 | 38.5% | 多样化职业、性格、恋爱关系 |
| **👨 Male** | 500 | 38.5% | 理想男友、霸道总裁、暖男 |
| **🎌 Anime** | 300 | 23.0% | 二次元画风、特定萌属性、幻想设定 |

### 1.2 主题细分 (Themes)

#### 👩 女性角色主题池
*   **日常系**: Neighbor (邻居), Childhood Friend (青梅竹马), College Roommate (室友), Barista (咖啡师)
*   **职业系**: Nurse (护士), Teacher (老师), Flight Attendant (空姐), CEO (女总裁), Doctor (医生), Secretary (秘书)
*   **特殊关系**: Stepsister (继妹), Ex-Girlfriend (前女友), Secret Admirer (暗恋者)
*   **幻想/亚文化**: Vampire (吸血鬼), Witch (女巫), Elf (精灵), Cyberpunk (赛博朋克), Maid (女仆), Goth (哥特)

#### 👨 男性角色主题池
*   **日常系**: Senior (学长), Neighbor (邻居哥哥), Tutor (家教), Colleague (同事)
*   **理想型**: CEO (霸道总裁), Doctor (医生), Pilot (飞行员), Lawyer (律师), Firefighter (消防员)
*   **特殊/幻想**: Prince (王子), Vampire Duke (吸血鬼公爵), Werewolf (狼人), Mafia Boss (黑道大佬)

#### 🎌 动漫角色主题池
*   **萌属性**: Tsundere (傲娇), Yandere (病娇), Kuudere (三无), Onee-san (御姐)
*   **设定**: Isekai Heroine (异世界女主), Magical Girl (魔法少女), Idol (偶像), Fox Spirit (狐妖), Mecha Pilot (机甲驾驶员)

### 1.3 性格维度 (Personality Axes)

每个角色应从以下三个维度中各选一个标签进行组合：

1.  **核心特质 (Primary)**: Sweet (甜美), Mysterious (神秘), Dominant (强势), Shy (害羞), Energetic (元气), Cold (高冷)
2.  **情感模式 (Emotional)**: Caring (体贴), Teasing (爱捉弄), Possessive (占有欲), Supportive (支持), Tsundere (嘴硬心软)
3.  **说话风格 (Speaking)**: Formal (正式), Casual (随意/俚语), Flirty (撩人), Poetic (诗意), Rude/Sharp (毒舌)

### 1.4 剧情场景模版 (Scenario Templates)

*   **T1 - 意外重逢**: "多年未见，在{location}偶遇..."
*   **T2 - 深夜加班**: "办公室只剩下你们两人，她走过来..."
*   **T3 - 受伤照顾**: "你受伤/生病了，她焦急地..."
*   **T4 - 秘密关系**: "作为{role}，这段关系不能公开..."
*   **T5 - 异世界召唤**: "你突然醒来，面前站着一位..."
*   **T6 - 醉酒误事**: "派对结束后，她借着酒意..."

---

## 📝 Phase 2: 数据结构定义 (JSON Schema)

所有生成的数据必须严格符合以下 TypeScript 接口定义。

```typescript
interface CharacterData {
  // --- 基础标识 ---
  name: string;               // 英文名
  username: string;           // 唯一标识 (例如: emma_nurse_001) -用于去重和URL
  
  // --- 分类标签 ---
  category: "female" | "male" | "anime";
  theme: string;              // 细分主题
  access_level: "free" | "plus" | "pro" | "ultimate";
  
  // --- 核心设定 ---
  description: string;        // 短描述 (Card 上显示)
  personality: string;        // 详细性格描述 (100-200字，指导 AI 扮演)
  traits: string[];           // [Tag1, Tag2, Tag3, Tag4] (前端显示标签)
  
  // --- 沉浸式剧情字段 ---
  scenario: string;           // 剧情背景/开场情境描述
  current_state: string;      // 角色当前的状态/动作/穿着
  motivation: string;         // 角色在这场对话中的核心动机/目的
  background: string;         // 角色的身世/背景故事
  
  // --- 对话配置 ---
  greeting_message: string;   // 第一句开场白 (需包含动作描写 *action*)
  suggestions: string[];      // 4个用户回复建议
  speaking_style: string;     // AI 回复风格指南 (指导 System Prompt)
  
  // --- 图像生成配置 ---
  image_prompt: string;       // 用于生成角色立绘的详细 Prompt
  appearance: {               // 外貌特征分解 (用于一致性/参考)
    age: number;
    visual_style: string;     // e.g. "Realistic photo", "Anime style"
    clothing: string;
    features: string;
  };
  
  // --- 系统配置 ---
  credits_per_message: number; // costs: Free=1, Plus=2, Pro/Ult=3+
  sort_order: number;          // 排序权重
}
```

---

## 🤖 Phase 3: AI 批量生成模版 (System Prompt)

将以下 Prompt 输入给 GPT-4 或 Claude，用于批量生成 JSON 数据。

### System Prompt

```markdown
Role: You are a Lead Character Designer for a premium AI companion platform.
Task: Create unique, high-quality character profiles based on the provided parameters.

Output Format: A single JSON object (or an array of objects) strictly following the schema below. No markdown formatting, just raw JSON.

Schema:
{
  "name": "string (Western name)",
  "username": "string (lowercase, unique, e.g., name_theme_id)",
  "category": "female" | "male" | "anime",
  "theme": "string",
  "access_level": "free" | "plus" | "pro" | "ultimate",
  "description": "string (1 very catchy sentence, max 60 chars)",
  "personality": "string (Detailed psychological profile, 3-4 sentences)",
  "traits": ["string (Adj 1)", "string (Adj 2)", "string (Adj 3)", "string (Adj 4)"],
  "scenario": "string (The specific situation where the chat begins, 2-3 sentences)",
  "current_state": "string (Visual description of current action/clothing, bullet points style)",
  "motivation": "string (What the character wants from the user right now)",
  "background": "string (Brief bio/history, 3-4 sentences)",
  "greeting_message": "string (Engaging first message, usually includes *action* or *feeling*)",
  "suggestions": ["string (User reply option 1)", "string ...2", "string ...3", "string ...4"],
  "speaking_style": "string (Instructions for AI: tone, quirks, formatting rules)",
  "image_prompt": "string (Highly detailed Stable Diffusion/Flux prompt, start with 'raw photo' or 'anime masterpiece', describe subject, pose, clothing, lighting, background)",
  "appearance": {
    "age": number,
    "visual_style": "string",
    "clothing": "string",
    "features": "string"
  },
  "credits_per_message": number,
  "sort_order": number
}

Design Guidelines:
1. **Premium Quality**: Avoid clichés text. Make characters feel deep and real.
2. **Hook**: The greeting and scenario must immediately hook the user to reply.
3. **Consistency**: The image prompt must match the description perfectly.
4. **Variety**: If correcting multiple characters, ensure they are distinct.
```

### User Input Example (Batch Generation)

```text
Please generate 5 "Female" characters using the "Nurse" theme.
Mix access levels: 2 Free, 2 Plus, 1 Pro.
Vary personalities: 1 Shy, 1 Strict, 1 Flirty, 1 Caring, 1 Burned-out.
Start sort_order from 100.
```

---

## ⚙️ Phase 4: 批量导入脚本 (Convex Implementation)

我们将在 `convex/batch.ts` 中实现此脚本，支持幂等操作（即重复运行会更新而非重复创建）。

### 4.1 核心导入函数 (`batch.ts`)

```typescript
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const importCharacters = internalMutation({
  args: {
    characters: v.array(v.object({
      name: v.string(),
      username: v.string(),
      description: v.string(),
      personality: v.string(),
      traits: v.array(v.string()), // 注意：Schema中是JSON字符串，这里传入数组，内部转换
      avatar_url: v.string(),      // 图片生成后填入
      greeting_message: v.string(),
      suggestions: v.array(v.string()), // 同上，内部转换
      background: v.string(),
      scenario: v.string(),
      current_state: v.string(),
      motivation: v.string(),
      access_level: v.string(),
      sort_order: v.number(),
      credits_per_message: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    let stats = { created: 0, updated: 0 };

    for (const char of args.characters) {
      // 1. Check existence by username
      const existing = await ctx.db
        .query("characters")
        .filter((q) => q.eq(q.field("username"), char.username))
        .first();

      // 2. Prepare search text
      const search_text = `${char.name} ${char.description} ${char.personality} ${char.theme}`;
      
      // 3. Prepare DB object (convert arrays to JSON strings as per current schema)
      const dbObj = {
        ...char,
        traits: JSON.stringify(char.traits),
        suggestions: JSON.stringify(char.suggestions),
        search_text,
        is_active: true,
        is_premium: char.access_level !== "free",
        chat_count: "0 chats", // Default
      };

      if (existing) {
        await ctx.db.patch(existing._id, dbObj);
        stats.updated++;
      } else {
        await ctx.db.insert("characters", dbObj as any);
        stats.created++;
      }
    }
    
    return stats;
  },
});
```

### 4.2 执行策略

1.  **JSON 生成**: 使用 LLM 生成 JSON 文件（如 `batch_1_nurses.json`）。
2.  **图片生成**: 编写 Python/Node 脚本读取 JSON 中的 `image_prompt`，调用本地 Stable Diffusion API。
    *   保存文件名格式: `{username}.png`
    *   上传至 R2/S3，获取 `avatar_url`。
3.  **数据回填**: 将 `avatar_url` 回填入 JSON。
4.  **执行导入**: 运行 Convex Mutation 导入完整数据。

```bash
# 示例：通过 Convex Dashboard 或 CLI 调用
npx convex run batch:importCharacters --file ./data/ready_to_import.json
```
