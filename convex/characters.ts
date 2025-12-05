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

// Get characters created by a specific user
export const getByCreator = query({
  args: { creatorId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("characters")
      .withIndex("by_creator", (q) => q.eq("creator_id", args.creatorId))
      .collect();
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

// Create a character (User-generated)
export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    personality: v.string(),
    greeting_message: v.string(),
    avatar_url: v.optional(v.string()),
    traits: v.optional(v.array(v.string())),
    scenario: v.optional(v.string()),
    current_state: v.optional(v.string()),
    motivation: v.optional(v.string()),
    background: v.optional(v.string()),
    suggestions: v.optional(v.string()),
    is_public: v.optional(v.boolean()),
    creator_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Generate a unique username from the name
    const baseUsername = args.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const username = `${baseUsername}-${randomSuffix}`;
    
    // Construct search text
    const search_text = `${args.name} ${args.description} ${args.personality}`;
    
    const id = await ctx.db.insert("characters", {
      name: args.name,
      description: args.description,
      personality: args.personality,
      greeting_message: args.greeting_message,
      username,
      avatar_url: args.avatar_url,
      traits: args.traits,
      scenario: args.scenario,
      current_state: args.current_state,
      motivation: args.motivation,
      background: args.background,
      suggestions: args.suggestions,
      creator_id: args.creator_id,
      like_count: 0,
      favorite_count: 0,
      // Default values for user-created characters
      is_active: true,
      access_level: args.is_public ? "free" : "pro", // Public = free access, Private = pro only
      sort_order: 999, // Put at end of list
      credits_per_message: 1,
      is_premium: false,
      chat_count: "0 chats",
      search_text,
    });
    return id;
  },
});

// Delete a character (only by creator)
export const remove = mutation({
  args: {
    id: v.id("characters"),
    creatorId: v.string(),
  },
  handler: async (ctx, args) => {
    const character = await ctx.db.get(args.id);
    if (!character) throw new Error("Character not found");
    
    // Verify ownership
    if (character.creator_id !== args.creatorId) {
      throw new Error("You can only delete your own characters");
    }
    
    // Delete associated data
    // 1. Delete likes
    const likes = await ctx.db
      .query("character_likes")
      .withIndex("by_character", (q) => q.eq("character_id", args.id))
      .collect();
    for (const like of likes) {
      await ctx.db.delete(like._id);
    }
    
    // 2. Delete favorites
    const favorites = await ctx.db
      .query("character_favorites")
      .withIndex("by_character", (q) => q.eq("character_id", args.id))
      .collect();
    for (const fav of favorites) {
      await ctx.db.delete(fav._id);
    }
    
    // 3. Delete the character
    await ctx.db.delete(args.id);
    
    return { success: true };
  },
});
