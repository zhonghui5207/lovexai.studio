import { v } from "convex/values";
import { action, internalMutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { callImageGeneration } from "./utils/image_gen";

export const generate = action({
  args: {
    prompt: v.string(),
    style: v.string(),
    ratio: v.string(), // Kept for API compatibility, but ignored in favor of hardcoded 3:4
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Authentication
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject || "temp-user-id-123";
    
    // 2. Check Credits (Placeholder)
    // const user = await ctx.runQuery(api.users.get, { userId });
    // if (user.credits < 5) throw new Error("Insufficient credits");

    // 3. Call AI API
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("Server configuration error: Missing API Key");
    }

    // Append style to prompt for better results
    const fullPrompt = `${args.prompt}, ${args.style} style`;
    const modelName = args.model || "flux-kontext-pro";
    
    console.log(`Generating image with prompt: ${fullPrompt} using model: ${modelName}`);

    let imageUrl = "";

    try {
      // Unified call for all models (Flux, GPT, Gemini)
      // The utility function handles model-specific parameters (aspect_ratio vs size)
      imageUrl = await callImageGeneration(apiKey, fullPrompt, modelName);
    } catch (error) {
      console.error("Image generation error:", error);
      throw new Error("Image generation failed. Please try again.");
    }

    if (!imageUrl || !imageUrl.startsWith("http")) {
      throw new Error("Failed to generate image: Invalid response from API");
    }

    // 4. Deduct Credits & Save Record
    await ctx.runMutation(internal.images.saveGeneration, {
      userId,
      prompt: args.prompt,
      style: args.style,
      image_url: imageUrl,
      creditsCost: 5,
      status: "completed",
      model: modelName,
    });

    return imageUrl;
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
    await ctx.db.insert("image_generations", {
      user_id: args.userId,
      prompt: args.prompt,
      // style: args.style, // Removed as it's not in schema yet
      image_url: args.image_url,
      credits_cost: args.creditsCost,
      status: args.status,
      model: args.model || "unknown",
    });
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject || "temp-user-id-123";
    
    return await ctx.db
      .query("image_generations")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .order("desc")
      .take(20);
  },
});
