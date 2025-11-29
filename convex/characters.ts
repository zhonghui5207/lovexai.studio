import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Helper to check access level
const TIER_LEVELS = { free: 0, basic: 1, pro: 2, ultra: 3 };

function canAccess(userTier: string, characterLevel: string) {
  const u = TIER_LEVELS[userTier as keyof typeof TIER_LEVELS] || 0;
  const c = TIER_LEVELS[characterLevel as keyof typeof TIER_LEVELS] || 0;
  return u >= c;
}

// List all characters with optional filtering
export const list = query({
  args: {
    activeOnly: v.optional(v.boolean()),
    userTier: v.optional(v.string()), // Optional: filter by what user can access
  },
  handler: async (ctx, args) => {
    // Use the sort_order index to get characters in correct order
    const characters = await ctx.db
      .query("characters")
      .withIndex("by_sort_order")
      .collect();

    let result = characters;

    // Filter by active status (default to true if not specified)
    if (args.activeOnly !== false) {
      result = result.filter((c) => c.is_active);
    }

    // Filter by user access level if tier is provided
    if (args.userTier) {
      result = result.filter((c) => canAccess(args.userTier!, c.access_level));
    }

    return result;
  },
});

// Get a single character by ID
export const get = query({
  args: { id: v.id("characters") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get a character by username (slug)
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("characters")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
  },
});

// Search characters
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("characters")
      .withSearchIndex("search_body", (q) =>
        q.search("search_text", args.query).eq("is_active", true)
      )
      .take(20);
  },
});

// Update chat count (Mutation)
export const incrementChatCount = mutation({
  args: { id: v.id("characters") },
  handler: async (ctx, args) => {
    const character = await ctx.db.get(args.id);
    if (!character) throw new Error("Character not found");

    // Parse current count "1.2k chats" -> number
    // For simplicity in migration, we might want to store this as a number in the future.
    // But to match existing logic:
    const currentStr = character.chat_count || "0 chats";
    let count = 0;
    if (currentStr.includes("M")) {
      count = parseFloat(currentStr) * 1000000;
    } else if (currentStr.includes("K")) {
      count = parseFloat(currentStr) * 1000;
    } else {
      count = parseInt(currentStr.replace(/[^\d]/g, "")) || 0;
    }

    const newCount = count + 1;
    let newCountStr = `${newCount} chats`;
    if (newCount >= 1000000) {
      newCountStr = `${(newCount / 1000000).toFixed(1)}M chats`;
    } else if (newCount >= 1000) {
      newCountStr = `${(newCount / 1000).toFixed(1)}K chats`;
    }

    await ctx.db.patch(args.id, { chat_count: newCountStr });
  },
});

// Create a character (Admin)
export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    personality: v.string(),
    is_active: v.boolean(),
    access_level: v.string(),
    sort_order: v.number(),
    credits_per_message: v.number(),
    is_premium: v.boolean(),
    greeting_message: v.string(),
    username: v.string(),
    avatar_url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Construct search text
    const search_text = `${args.name} ${args.description} ${args.personality}`;
    
    const id = await ctx.db.insert("characters", {
      ...args,
      chat_count: "0 chats",
      search_text,
    });
    return id;
  },
});

export const migrateCreate = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    personality: v.string(),
    is_active: v.boolean(),
    access_level: v.string(),
    sort_order: v.number(),
    credits_per_message: v.number(),
    chat_count: v.string(),
    is_premium: v.boolean(),
    greeting_message: v.string(),
    username: v.string(),
    avatar_url: v.optional(v.string()),
    legacy_id: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if exists by legacy_id
    const existing = await ctx.db
      .query("characters")
      .filter((q) => q.eq(q.field("legacy_id"), args.legacy_id))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("characters", args);
  },
});
