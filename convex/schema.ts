import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table
  users: defineTable({
    email: v.string(),
    name: v.string(),
    avatar_url: v.optional(v.string()),
    subscription_tier: v.string(), // 'free', 'plus', 'pro', 'ultimate'
    credits_balance: v.number(),
    invite_code: v.optional(v.string()),
    invited_by: v.optional(v.string()),
    subscription_expires_at: v.optional(v.string()),
    // External Auth Provider ID (e.g. from NextAuth/Clerk)
    tokenIdentifier: v.optional(v.string()),
    // Generation settings for AI responses
    generation_settings: v.optional(v.object({
      creativity: v.string(), // 'precise' | 'balanced' | 'creative'
      responseLength: v.string(), // 'short' | 'default' | 'long'
      selectedModel: v.string(), // 'nova' | 'pulsar' | 'nebula' | 'quasar'
    })),
    // Daily swipe tracking for Discover
    daily_swipes_used: v.optional(v.number()),
    last_swipe_reset_date: v.optional(v.string()),
    // Custom characters count
    custom_characters_count: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_token", ["tokenIdentifier"])
    .index("by_invite_code", ["invite_code"]),

  // Characters table
  characters: defineTable({
    name: v.string(),
    description: v.string(),
    personality: v.string(),
    is_active: v.boolean(),
    access_level: v.string(), // 'free', 'plus', 'pro', 'ultimate'
    sort_order: v.number(),
    credits_per_message: v.number(),
    chat_count: v.string(), // e.g. "1.2k chats"
    is_premium: v.boolean(),
    greeting_message: v.string(),
    username: v.string(),
    avatar_url: v.optional(v.string()),
    video_url: v.optional(v.string()), // Video URL for hover preview
    category: v.optional(v.string()), // 'female', 'male', 'anime'
    traits: v.optional(v.array(v.string())),
    // Combined text for full-text search (name + description + personality)
    search_text: v.optional(v.string()),
    // Extended character details
    suggestions: v.optional(v.string()),
    background: v.optional(v.string()),
    scenario: v.optional(v.string()),
    current_state: v.optional(v.string()),
    motivation: v.optional(v.string()),
    // Creator and social
    creator_id: v.optional(v.string()), // User ID of creator
    like_count: v.optional(v.number()),
    favorite_count: v.optional(v.number()),
  })
    .index("by_username", ["username"])
    .index("by_access_level", ["access_level"])
    .index("by_sort_order", ["sort_order"])
    .index("by_creator", ["creator_id"])
    .searchIndex("search_body", {
      searchField: "search_text",
      filterFields: ["is_active", "access_level"],
    }),

  // Conversations table
  conversations: defineTable({
    user_id: v.string(), // Can be Convex ID or External UUID
    character_id: v.id("characters"),
    title: v.string(),
    is_archived: v.boolean(),
    last_message_at: v.string(),
    message_count: v.number(),
    total_credits_used: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_user_character", ["user_id", "character_id"])
    .index("by_last_message", ["last_message_at"])
    .index("by_user_time", ["user_id", "last_message_at"]),

  // Messages table
  messages: defineTable({
    conversation_id: v.id("conversations"),
    sender_type: v.string(), // 'user' | 'character'
    content: v.string(),
    credits_used: v.number(),
    generation_settings: v.optional(v.any()), // JSON object
  }).index("by_conversation", ["conversation_id"]),

  // Generation Settings table
  generation_settings: defineTable({
    conversation_id: v.id("conversations"),
    response_length: v.string(),
    include_narrator: v.boolean(),
    narrator_voice: v.string(),
    selected_model: v.string(),
  }).index("by_conversation", ["conversation_id"]),

  // Credits table (Transaction history)
  credits: defineTable({
    user_id: v.string(),
    trans_no: v.optional(v.string()),
    order_no: v.optional(v.string()),
    expired_at: v.optional(v.string()),
    amount: v.number(),
    type: v.string(), // 'purchase', 'bonus', 'usage'
  }).index("by_user", ["user_id"]),

  // Orders table
  orders: defineTable({
    order_no: v.string(),
    user_id: v.string(),
    user_email: v.string(),
    status: v.string(), // 'created', 'pending', 'paid', 'failed', 'deleted'
    amount: v.number(),
    credits: v.number(),
    currency: v.string(),
    stripe_session_id: v.optional(v.string()),
    paid_at: v.optional(v.string()),
    paid_email: v.optional(v.string()),
    // Subscription details
    sub_id: v.optional(v.string()),
    sub_interval: v.optional(v.string()),
    product_id: v.optional(v.string()),
    product_name: v.optional(v.string()),
    expired_at: v.optional(v.string()),
    // Payment method: 'card', 'wechat', 'alipay', 'crypto'
    payment_method: v.optional(v.string()),
  })
    .index("by_order_no", ["order_no"])
    .index("by_user", ["user_id"]),

  // Feedbacks table
  feedbacks: defineTable({
    user_id: v.string(),
    content: v.string(),
    type: v.string(),
    status: v.string(),
  }).index("by_user", ["user_id"]),

  // Image Generations table
  image_generations: defineTable({
    user_id: v.string(),
    prompt: v.string(),
    revised_prompt: v.optional(v.string()),
    image_url: v.string(),
    storage_key: v.optional(v.string()),
    model: v.string(),
    status: v.string(), // 'completed', 'failed'
    credits_cost: v.number(),
  }).index("by_user", ["user_id"]),

  // Character Likes table
  character_likes: defineTable({
    user_id: v.string(),
    character_id: v.id("characters"),
  })
    .index("by_user", ["user_id"])
    .index("by_character", ["character_id"])
    .index("by_user_character", ["user_id", "character_id"]),

  // Character Favorites table
  character_favorites: defineTable({
    user_id: v.string(),
    character_id: v.id("characters"),
  })
    .index("by_user", ["user_id"])
    .index("by_character", ["character_id"])
    .index("by_user_character", ["user_id", "character_id"]),
});
