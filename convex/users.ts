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
    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
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
      credits_balance: 100, // Default starting credits
      invite_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
    });

    return newUserId;
  },
});

// Temporary Auth Bypass for Migration/Dev
export const ensureUser = mutation({
  args: {
    legacyId: v.string(),
    email: v.string(),
    name: v.string(),
    avatar_url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user exists by legacy_id (Supabase UUID)
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("legacy_id"), args.legacyId))
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
      legacy_id: args.legacyId,
      subscription_tier: "free",
      credits_balance: 100,
      invite_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
    });

    return newUserId;
  },
});

// Deduct credits
export const deductCredits = mutation({
  args: { amount: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    if (user.credits_balance < args.amount) {
      throw new Error("Insufficient credits");
    }

    await ctx.db.patch(user._id, {
      credits_balance: user.credits_balance - args.amount,
    });

    // Record transaction
    await ctx.db.insert("credits", {
      user_id: user._id, // Using Convex ID here
      amount: -args.amount,
      type: "usage",
      created_at: new Date().toISOString(), // Schema didn't enforce created_at but good to have
    } as any); // Cast to any if schema mismatch, but we should add created_at to schema later
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
      
      // Claim legacy data if needed (if user has legacy_id but conversations point to it as string)
      if (existingByEmail.legacy_id) {
         const legacyConversations = await ctx.db
            .query("conversations")
            .filter(q => q.eq(q.field("user_id"), existingByEmail.legacy_id))
            .collect();
         
         for (const conv of legacyConversations) {
             await ctx.db.patch(conv._id, { user_id: existingByEmail._id });
         }
      }

      return existingByEmail;
    }

    // 2. Try to find user by legacy_id (if externalId matches a legacy UUID)
    // This handles the case where email might be missing or different in legacy data
    const existingByLegacyId = await ctx.db
        .query("users")
        .filter(q => q.eq(q.field("legacy_id"), args.externalId))
        .unique();

    if (existingByLegacyId) {
        // We found the legacy user! Update email and tokenIdentifier
        await ctx.db.patch(existingByLegacyId._id, {
            email: args.email,
            name: args.name,
            avatar_url: args.avatar_url,
            tokenIdentifier: args.externalId, // Link NextAuth ID
        });
        
        // Claim legacy data
        const legacyConversations = await ctx.db
            .query("conversations")
            .filter(q => q.eq(q.field("user_id"), existingByLegacyId.legacy_id))
            .collect();
            
        for (const conv of legacyConversations) {
            await ctx.db.patch(conv._id, { user_id: existingByLegacyId._id });
        }

        return existingByLegacyId;
    }

    // 3. Create new user
    const newId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      avatar_url: args.avatar_url,
      tokenIdentifier: args.externalId,
      legacy_id: args.externalId,
      subscription_tier: "free",
      credits_balance: 100,
      invite_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
    });

    return await ctx.db.get(newId);
  },
});
