import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// List user's conversations
export const list = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    let userId = args.userId;
    if (!userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (identity) {
        const user = await ctx.db
          .query("users")
          .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
          .unique();
        userId = user?._id;
      }
    }

    if (!userId) return [];

    // Use the compound index for efficient sorting by time
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user_time", (q) => q.eq("user_id", userId!))
      .order("desc")
      .collect();

    // Enrich with character data
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const character = await ctx.db.get(conv.character_id);
        return { ...conv, character };
      })
    );

    return enriched;
  },
});

// Get a single conversation with character details
export const get = query({
  args: { id: v.id("conversations"), userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.id);
    if (!conversation) return null;

    let userId = args.userId;
    if (!userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (identity) {
        const user = await ctx.db
          .query("users")
          .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
          .unique();
        userId = user?._id;
      }
    }

    // Verify ownership
    if (!userId || conversation.user_id !== userId) {
      return null;
    }

    const character = await ctx.db.get(conversation.character_id);
    return { ...conversation, character };
  },
});

// Create a new conversation
export const create = mutation({
  args: { characterId: v.id("characters"), userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    let userId = args.userId;
    if (!userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (identity) {
        const user = await ctx.db
          .query("users")
          .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
          .unique();
        userId = user?._id;
      }
    }

    if (!userId) {
      // Try to find user by legacy ID if passed (fallback)
      // This part might not be needed if we rely on auth context, but kept for robustness
    }

    if (!userId) {
        console.error("Unauthorized: No user ID found in args or auth context");
        throw new Error("Unauthorized");
    }

    const character = await ctx.db.get(args.characterId);
    if (!character) throw new Error("Character not found");

    // Check for existing active conversation
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_user_character", (q) =>
        q.eq("user_id", userId!).eq("character_id", args.characterId)
      )
      .filter((q) => q.eq(q.field("is_archived"), false))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new conversation
    const id = await ctx.db.insert("conversations", {
      user_id: userId!,
      character_id: args.characterId,
      title: `Chat with ${character.name}`,
      is_archived: false,
      last_message_at: new Date().toISOString(),
      message_count: 0,
      total_credits_used: 0,
    });

    // Add greeting message
    await ctx.db.insert("messages", {
      conversation_id: id,
      sender_type: "character",
      content: character.greeting_message,
      credits_used: 0,
    });

    return id;
  },
});

export const migrateCreate = mutation({
  args: {
    user_id: v.id("users"),
    character_id: v.id("characters"),
    title: v.string(),
    is_archived: v.boolean(),
    last_message_at: v.string(),
    message_count: v.number(),
    total_credits_used: v.number(),
    legacy_id: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("legacy_id"), args.legacy_id))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("conversations", args);
  },
});
