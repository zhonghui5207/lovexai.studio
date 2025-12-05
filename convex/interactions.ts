import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Toggle like on a character
export const toggleLike = mutation({
  args: {
    characterId: v.id("characters"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if already liked
    const existing = await ctx.db
      .query("character_likes")
      .withIndex("by_user_character", (q) =>
        q.eq("user_id", args.userId).eq("character_id", args.characterId)
      )
      .first();

    const character = await ctx.db.get(args.characterId);
    if (!character) throw new Error("Character not found");

    if (existing) {
      // Unlike
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.characterId, {
        like_count: Math.max(0, (character.like_count || 0) - 1),
      });
      return { liked: false };
    } else {
      // Like
      await ctx.db.insert("character_likes", {
        user_id: args.userId,
        character_id: args.characterId,
      });
      await ctx.db.patch(args.characterId, {
        like_count: (character.like_count || 0) + 1,
      });
      return { liked: true };
    }
  },
});

// Toggle favorite on a character
export const toggleFavorite = mutation({
  args: {
    characterId: v.id("characters"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if already favorited
    const existing = await ctx.db
      .query("character_favorites")
      .withIndex("by_user_character", (q) =>
        q.eq("user_id", args.userId).eq("character_id", args.characterId)
      )
      .first();

    const character = await ctx.db.get(args.characterId);
    if (!character) throw new Error("Character not found");

    if (existing) {
      // Unfavorite
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.characterId, {
        favorite_count: Math.max(0, (character.favorite_count || 0) - 1),
      });
      return { favorited: false };
    } else {
      // Favorite
      await ctx.db.insert("character_favorites", {
        user_id: args.userId,
        character_id: args.characterId,
      });
      await ctx.db.patch(args.characterId, {
        favorite_count: (character.favorite_count || 0) + 1,
      });
      return { favorited: true };
    }
  },
});

// Check if user has liked/favorited a character
export const getUserInteractions = query({
  args: {
    characterId: v.id("characters"),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      return { liked: false, favorited: false };
    }

    const liked = await ctx.db
      .query("character_likes")
      .withIndex("by_user_character", (q) =>
        q.eq("user_id", args.userId!).eq("character_id", args.characterId)
      )
      .first();

    const favorited = await ctx.db
      .query("character_favorites")
      .withIndex("by_user_character", (q) =>
        q.eq("user_id", args.userId!).eq("character_id", args.characterId)
      )
      .first();

    return {
      liked: !!liked,
      favorited: !!favorited,
    };
  },
});

// Get user's favorite characters
export const getUserFavorites = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("character_favorites")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .collect();

    const characters = await Promise.all(
      favorites.map((f) => ctx.db.get(f.character_id))
    );

    return characters.filter(Boolean);
  },
});
