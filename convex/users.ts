import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get the current authenticated user
export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    
    // First try by tokenIdentifier
    let user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    
    // Fallback: try by email if tokenIdentifier doesn't match
    if (!user && identity.email) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email as string))
        .unique();
    }
    
    return user;
  },
});

export const get = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    avatar_url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updateData: Record<string, any> = {};
    if (args.name !== undefined) updateData.name = args.name;
    if (args.avatar_url !== undefined) updateData.avatar_url = args.avatar_url;
    
    if (Object.keys(updateData).length > 0) {
      await ctx.db.patch(args.userId, updateData);
    }
    return true;
  },
});

// Create or update user after login
export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called storeUser without authentication present");
    }

    // 1. Check if user exists by tokenIdentifier (Auth provider ID)
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (user !== null) {
      // Update basic info if changed
      if (user.name !== identity.name || user.avatar_url !== identity.pictureUrl) {
        await ctx.db.patch(user._id, {
          name: identity.name || user.name,
          avatar_url: identity.pictureUrl || user.avatar_url,
        });
      }
      return user._id;
    }

    // 2. Check if user exists by email (Fall back to email matching)
    if (identity.email) {
      const existingUserByEmail = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .unique();

      if (existingUserByEmail) {
        // Link the new auth token to the existing user
        await ctx.db.patch(existingUserByEmail._id, {
          tokenIdentifier: identity.tokenIdentifier,
          name: identity.name || existingUserByEmail.name,
          avatar_url: identity.pictureUrl || existingUserByEmail.avatar_url,
        });
        return existingUserByEmail._id;
      }
    }

    // 3. Create new user
    const newUserId = await ctx.db.insert("users", {
      name: identity.name || "User",
      email: identity.email!,
      avatar_url: identity.pictureUrl,
      tokenIdentifier: identity.tokenIdentifier,
      subscription_tier: "free",
      credits_balance: 150, // New user signup credits
      invite_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
    });

    return newUserId;
  },
});

// Temporary Auth Bypass for Migration/Dev
export const ensureUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    avatar_url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user exists by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (user) {
      // Update info
      if (user.name !== args.name || user.avatar_url !== args.avatar_url) {
        await ctx.db.patch(user._id, {
          name: args.name,
          avatar_url: args.avatar_url,
        });
      }
      return user._id;
    }

    // Create new user
    const newUserId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      avatar_url: args.avatar_url,
      subscription_tier: "free",
      credits_balance: 150,
      invite_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
    });

    return newUserId;
  },
});

// Deduct credits
export const deductCredits = mutation({
  args: { amount: v.number(), userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    let user = null;

    if (args.userId) {
      // Internal call (e.g. from action)
      user = await ctx.db.get(args.userId);
    } else {
      // Client call
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new Error("Unauthorized");

      user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .unique();
    }

    if (!user) throw new Error("User not found");

    if (user.credits_balance < args.amount) {
      throw new Error("Insufficient credits");
    }

    await ctx.db.patch(user._id, {
      credits_balance: user.credits_balance - args.amount,
    });

    // Record transaction
    await ctx.db.insert("credits", {
      user_id: user._id,
      amount: -args.amount,
      type: "usage",
    } as any);
  },
});

// Add credits (Admin or Payment Webhook)
export const addCredits = mutation({
  args: { userId: v.id("users"), amount: v.number(), type: v.string() },
  handler: async (ctx, args) => {
    // In a real app, verify admin permissions here
    
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      credits_balance: user.credits_balance + args.amount,
    });

    await ctx.db.insert("credits", {
      user_id: args.userId,
      amount: args.amount,
      type: args.type,
    } as any);
  },
});

export const syncUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    avatar_url: v.string(),
    externalId: v.string(),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Try to find user by email
    const existingByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingByEmail) {
      // Update basic info
      if (existingByEmail.name !== args.name || existingByEmail.avatar_url !== args.avatar_url) {
        await ctx.db.patch(existingByEmail._id, {
          name: args.name,
          avatar_url: args.avatar_url,
        });
      }
      return existingByEmail;
    }

    // 2. Create new user
    const newId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      avatar_url: args.avatar_url,
      tokenIdentifier: args.externalId,
      subscription_tier: "free",
      credits_balance: 150,
      invite_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
    });

    return await ctx.db.get(newId);
  },
});

// Get user's generation settings
export const getGenerationSettings = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    
    // Return saved settings or defaults
    return user.generation_settings || {
      creativity: "balanced",
      responseLength: "default",
      selectedModel: "nova",
    };
  },
});

// Update user's generation settings
export const updateGenerationSettings = mutation({
  args: {
    userId: v.id("users"),
    settings: v.object({
      creativity: v.string(),
      responseLength: v.string(),
      selectedModel: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    
    await ctx.db.patch(args.userId, {
      generation_settings: args.settings,
    });
    
    return args.settings;
  },
});

// ========================================
// Discover Swipe Functions
// ========================================

import { 
  TIER_LIMITS, 
  SubscriptionTier, 
  getTodayDateString, 
  shouldResetDaily 
} from "./utils/permissions";

// Check remaining swipes for today
export const getRemainingSwipes = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { remaining: 0, limit: 0 };
    
    const tier = (user.subscription_tier || 'free') as SubscriptionTier;
    const limit = TIER_LIMITS[tier]?.daily_swipes || 10;
    
    // Check if we need to reset daily counter
    if (shouldResetDaily(user.last_swipe_reset_date)) {
      return { remaining: limit, limit };
    }
    
    const used = user.daily_swipes_used || 0;
    const remaining = Math.max(0, limit - used);
    
    return { remaining, limit };
  },
});

// Use a swipe (call this when user swipes in Discover)
export const useSwipe = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    
    const tier = (user.subscription_tier || 'free') as SubscriptionTier;
    const limit = TIER_LIMITS[tier]?.daily_swipes || 10;
    
    // Unlimited for ultimate
    if (limit === Infinity) {
      return { success: true, remaining: Infinity };
    }
    
    const today = getTodayDateString();
    
    // Reset if new day
    let currentUsed = user.daily_swipes_used || 0;
    if (shouldResetDaily(user.last_swipe_reset_date)) {
      currentUsed = 0;
    }
    
    // Check limit
    if (currentUsed >= limit) {
      return { success: false, remaining: 0, error: "Daily swipe limit reached" };
    }
    
    // Increment counter
    await ctx.db.patch(args.userId, {
      daily_swipes_used: currentUsed + 1,
      last_swipe_reset_date: today,
    });
    
    return { success: true, remaining: limit - currentUsed - 1 };
  },
});

// Check if user can access a character
export const canAccessCharacter = query({
  args: { 
    userId: v.id("users"),
    characterAccessLevel: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return false;
    
    const userTier = (user.subscription_tier || 'free') as SubscriptionTier;
    const charLevel = args.characterAccessLevel as SubscriptionTier;
    
    const allowedLevels = TIER_LIMITS[userTier]?.character_access || ['free'];
    return allowedLevels.includes(charLevel);
  },
});

// Check if user can use a specific model
export const canUseModel = query({
  args: { 
    userId: v.id("users"),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return false;
    
    const userTier = (user.subscription_tier || 'free') as SubscriptionTier;
    const allowedModels = TIER_LIMITS[userTier]?.models || ['nova'];
    return allowedModels.includes(args.model as any);
  },
});
