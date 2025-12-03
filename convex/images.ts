import { v } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { callFluxImageGen } from "./utils/flux";

// ============================================================================
//  DATABASE MUTATIONS (Internal)
// ============================================================================

export const saveGeneration = internalMutation({
  args: {
    userId: v.string(),
    prompt: v.string(),
    model: v.string(),
    creditsCost: v.number(),
    status: v.string(),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("image_generations", {
      user_id: args.userId,
      prompt: args.prompt,
      model: args.model,
      credits_cost: args.creditsCost,
      status: args.status,
      image_url: args.imageUrl,
    });
  },
});

// ============================================================================
//  PUBLIC ACTIONS
// ============================================================================

export const generate = action({
  args: {
    prompt: v.string(),
    style: v.optional(v.string()),
    ratio: v.optional(v.string()), // e.g., "9:16", "1:1"
    refImageUrl: v.optional(v.string()), // For img2img
  },
  handler: async (ctx, args) => {
    // 1. Authentication (Optional: Check if user is logged in)
    // For now, we assume the client handles auth or we pass a userId. 
    // Ideally, we get the user from ctx.auth
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Please log in to generate images.");
    }
    const userId = identity.subject;

    // 2. Check Credits (Optional: Implement credit check logic here)
    // const user = await ctx.runQuery(api.users.get, { userId });
    // if (user.credits < 5) throw new Error("Insufficient credits");

    // 3. Construct the prompt
    let finalPrompt = args.prompt;
    if (args.style) {
      finalPrompt += `, ${args.style} style`;
    }
    if (args.ratio) {
      finalPrompt += `, aspect ratio ${args.ratio}`;
    }

    // 4. Construct messages for Flux API
    const messages = [];
    if (args.refImageUrl) {
      // Img2Img format: "URL PROMPT"
      messages.push({
        role: "user",
        content: `${args.refImageUrl} ${finalPrompt}`,
      });
    } else {
      // Text2Img format
      messages.push({
        role: "user",
        content: finalPrompt,
      });
    }

    // 5. Call API
    const apiKey = process.env.OPENAI_API_KEY; // Using the same key as configured
    if (!apiKey) throw new Error("API Key not configured");

    console.log("Generating image with prompt:", messages[0].content);

    try {
      const imageUrl = await callFluxImageGen(apiKey, messages);
      
      if (!imageUrl || !imageUrl.startsWith("http")) {
        throw new Error("Failed to generate image: Invalid response from API");
      }

      // 6. Save to Database
      await ctx.runMutation(internal.images.saveGeneration, {
        userId: userId,
        prompt: finalPrompt,
        model: "flux-kontext-pro",
        creditsCost: 5, // Fixed cost for now
        status: "completed",
        imageUrl: imageUrl,
      });

      // 7. Deduct Credits (Implement this if you have the mutation)
      // await ctx.runMutation(internal.users.deductCredits, { userId, amount: 5 });

      return imageUrl;

    } catch (error) {
      console.error("Image generation error:", error);
      throw new Error("Image generation failed. Please try again.");
    }
  },
});

// ============================================================================
//  QUERIES
// ============================================================================

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    
    return await ctx.db
      .query("image_generations")
      .withIndex("by_user", (q) => q.eq("user_id", identity.subject))
      .order("desc")
      .take(20);
  },
});
