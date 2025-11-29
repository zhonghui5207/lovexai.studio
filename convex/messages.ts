import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// List messages for a conversation
export const list = query({
  args: { conversationId: v.id("conversations"), userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) return [];

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

    if (!userId || conversation.user_id !== userId) return [];

    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversation_id", args.conversationId))
      .collect();
  },
});

// Send a message (User)
export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    userId: v.optional(v.id("users")),
  },
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

    if (!userId) throw new Error("Unauthorized");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");
    if (conversation.user_id !== userId) throw new Error("Unauthorized");

    // Insert user message
    await ctx.db.insert("messages", {
      conversation_id: args.conversationId,
      sender_type: "user",
      content: args.content,
      credits_used: 0,
    });

    // Update conversation stats
    await ctx.db.patch(args.conversationId, {
      last_message_at: new Date().toISOString(),
      message_count: conversation.message_count + 1,
    });

    // await ctx.scheduler.runAfter(0, api.actions.generateResponse, { conversationId: args.conversationId });
  },
});

// Save AI response (Internal Mutation)
export const saveAIResponse = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // We can skip auth check if we trust internal calls, but actions run with same auth context usually?
    // Actually actions are called by scheduler, which has system auth or user auth.
    // If called via runMutation from action, it inherits identity?
    // For now, we just check if conversation exists.
    
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    await ctx.db.insert("messages", {
      conversation_id: args.conversationId,
      sender_type: "character",
      content: args.content,
      credits_used: conversation.character_id ? 1 : 0, // Simplified credit logic
    });

    await ctx.db.patch(args.conversationId, {
      last_message_at: new Date().toISOString(),
      message_count: (conversation.message_count || 0) + 1,
    });
  },
});

export const migrateCreate = mutation({
  args: {
    conversation_id: v.id("conversations"),
    sender_type: v.string(),
    content: v.string(),
    credits_used: v.number(),
    legacy_id: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("legacy_id"), args.legacy_id))
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("messages", args);
  },
});
