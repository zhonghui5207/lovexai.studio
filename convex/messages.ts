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

// List messages for a conversation (Internal use)
export const listInternal = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
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

// Create a placeholder message for AI response (for streaming)
export const createAIResponsePlaceholder = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    let creditsCost = 0;
    if (conversation.character_id) {
      const character = await ctx.db.get(conversation.character_id);
      if (character) {
        creditsCost = character.credits_per_message || 1;
      }
    }

    const messageId = await ctx.db.insert("messages", {
      conversation_id: args.conversationId,
      sender_type: "character",
      content: "", // Start empty
      credits_used: creditsCost,
    });

    await ctx.db.patch(args.conversationId, {
      last_message_at: new Date().toISOString(),
      message_count: (conversation.message_count || 0) + 1,
    });

    return messageId;
  },
});

// Update AI response content (for streaming)
export const updateAIResponse = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      content: args.content,
    });
  },
});

// Save AI response (Internal Mutation) - Deprecated but kept for compatibility
export const saveAIResponse = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // ... implementation ...
    // This is now replaced by the streaming flow, but we can keep it or redirect logic
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    await ctx.db.insert("messages", {
      conversation_id: args.conversationId,
      sender_type: "character",
      content: args.content,
      credits_used: conversation.character_id ? 1 : 0,
    });

    await ctx.db.patch(args.conversationId, {
      last_message_at: new Date().toISOString(),
      message_count: (conversation.message_count || 0) + 1,
    });
  },
});


