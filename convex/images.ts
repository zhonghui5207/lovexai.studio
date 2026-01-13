import { v } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { callImageGeneration } from "./utils/image_gen";
import { uploadImageToR2 } from "./utils/r2";
import {
  IMAGE_MODEL_MAPPING,
  IMAGE_MODEL_CREDITS,
  IMAGE_MODEL_TIERS,
  SubscriptionTier,
  ImageModel
} from "./utils/permissions";

export const generate = action({
  args: {
    prompt: v.string(),
    style: v.string(),
    ratio: v.string(), // Kept for API compatibility, but ignored in favor of hardcoded 3:4
    model: v.optional(v.string()),
    userId: v.optional(v.string()), // Accept userId from frontend
  },
  handler: async (ctx, args) => {
    // 1. Authentication - Try multiple methods:
    // Priority 1: Frontend-passed userId (most reliable with NextAuth)
    // Priority 2: Convex auth (if OIDC is configured)
    // Priority 3: Fallback for development
    const identity = await ctx.auth.getUserIdentity();
    const userId = args.userId || identity?.subject;
    
    if (!userId) {
      throw new Error("Authentication required. Please sign in to generate images.");
    }
    
    // 2. Get user and check credits
    let user = null;
    let creditsCost = 10; // Default cost

    try {
      user = await ctx.runQuery(api.users.get, { id: userId as any });
    } catch (e) {
      // Try finding by tokenIdentifier
      user = await ctx.runQuery(api.users.current);
    }

    // Validate model and get actual API model name
    const imageModel = (args.model || 'spark') as ImageModel;
    const actualModelName = IMAGE_MODEL_MAPPING[imageModel] || 'gemini-2.5-flash-image';
    creditsCost = IMAGE_MODEL_CREDITS[imageModel] || 10;

    if (user) {
      // Get user tier and check model access
      const tier = (user.subscription_tier || 'free') as SubscriptionTier;
      const allowedModels = IMAGE_MODEL_TIERS[tier] || ['spark'];

      // Check if user can use this model
      if (!allowedModels.includes(imageModel)) {
        throw new Error(`Your subscription tier (${tier}) does not have access to the ${imageModel} model. Please upgrade or select a different model.`);
      }

      // Check if user has enough credits
      if (user.credits_balance < creditsCost) {
        throw new Error(`Insufficient credits. You need ${creditsCost} credits but have ${user.credits_balance}. Please purchase more credits.`);
      }
    }

    // 3. Call AI API
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("Server configuration error: Missing API Key");
    }

    // Append style to prompt for better results
    const fullPrompt = `${args.prompt}, ${args.style} style`;

    console.log(`Generating image with prompt: ${fullPrompt} using model: ${actualModelName} (${imageModel})`);

    let imageUrl = "";

    try {
      // Unified call for all models (Flux, GPT, Gemini)
      // The utility function handles model-specific parameters (aspect_ratio vs size)
      imageUrl = await callImageGeneration(apiKey, fullPrompt, actualModelName);
    } catch (error: any) {
      console.error("Image generation error:", error);
      // Re-throw with the original error message (already user-friendly from image_gen.ts)
      throw new Error(error.message || "Image generation failed. Please try again.");
    }

    if (!imageUrl || !imageUrl.startsWith("http")) {
      throw new Error("Failed to generate image: Invalid response from API");
    }

    // 3.5 Upload to R2 (Cloudflare Object Storage)
    // This ensures we have a permanent copy and don't rely on temporary API links
    let finalImageUrl = imageUrl;
    try {
        finalImageUrl = await uploadImageToR2(imageUrl, args.prompt);
        console.log("Image successfully persisted to R2:", finalImageUrl);
    } catch (uploadError) {
        console.error("Failed to upload to R2, falling back to original URL:", uploadError);
        // We continue with the original URL so the user still gets their result
    }

    // 4. Deduct Credits & Save Record
    await ctx.runMutation(internal.images.saveGeneration, {
      userId,
      prompt: args.prompt,
      style: args.style,
      image_url: finalImageUrl, // Use the R2 URL (or fallback)
      creditsCost,
      status: "completed",
      model: actualModelName,
    });

    return finalImageUrl;
  },
});

export const saveGeneration = internalMutation({
  args: {
    userId: v.string(),
    prompt: v.string(),
    style: v.string(),
    image_url: v.string(),
    creditsCost: v.number(),
    status: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // First, deduct credits from user
    // Find user by various methods
    let user = null;
    
    try {
      user = await ctx.db.get(args.userId as any);
    } catch (e) {}
    
    if (!user) {
      user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.userId))
        .unique();
    }
    
    if (user && 'credits_balance' in user) {
      const currentBalance = (user as any).credits_balance || 0;
      const newBalance = Math.max(0, currentBalance - args.creditsCost);
      await ctx.db.patch(user._id, {
        credits_balance: newBalance,
      } as any);
      
      // Record credit transaction
      await ctx.db.insert("credits", {
        user_id: user._id,
        amount: -args.creditsCost,
        type: "image_generation",
      } as any);
    }
    
    // Save generation record
    await ctx.db.insert("image_generations", {
      user_id: args.userId,
      prompt: args.prompt,
      image_url: args.image_url,
      credits_cost: args.creditsCost,
      status: args.status,
      model: args.model || "unknown",
    });
  },
});

export const listMine = query({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = args.userId || identity?.subject;
    
    if (!userId) {
      return [];
    }
    
    return await ctx.db
      .query("image_generations")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .order("desc")
      .take(20);
  },
});

export const remove = mutation({
  args: { id: v.id("image_generations") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Upload avatar image to R2 (for character creation, doesn't save to image_generations)
export const uploadAvatar = action({
  args: {
    base64Data: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Import dynamically to avoid issues with server-side code
    const { uploadBase64ToR2 } = await import("./utils/r2");
    
    try {
      const imageUrl = await uploadBase64ToR2(args.base64Data);
      return { success: true, imageUrl };
    } catch (error: any) {
      console.error("Avatar upload failed:", error);
      return { success: false, error: error.message || "Upload failed" };
    }
  },
});
