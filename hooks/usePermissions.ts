"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { 
  TIER_LIMITS, 
  MODEL_CREDITS, 
  IMAGE_CREDITS,
  PROMPT_ENHANCE_CREDITS,
  SubscriptionTier,
  ChatModel 
} from "@/lib/permissions";

/**
 * Hook to get user's permission status and helper functions
 */
export function usePermissions(userId?: Id<"users"> | string) {
  const user = useQuery(api.users.current);
  
  const tier = (user?.subscription_tier || 'free') as SubscriptionTier;
  const limits = TIER_LIMITS[tier];
  const credits = user?.credits_balance || 0;
  
  return {
    // User info
    user,
    tier,
    credits,
    limits,
    
    // Check functions
    canUseModel: (model: ChatModel) => limits.models.includes(model),
    canAccessCharacter: (level: SubscriptionTier) => limits.character_access.includes(level),
    canCreateCharacter: () => {
      const count = user?.custom_characters_count || 0;
      return count < limits.custom_characters;
    },
    
    // Cost functions
    getChatCost: (model: ChatModel) => MODEL_CREDITS[model] || 2,
    getImageCost: () => IMAGE_CREDITS[tier] || 10,
    getPromptEnhanceCost: () => PROMPT_ENHANCE_CREDITS,
    
    // Credit check functions
    hasCreditsForChat: (model: ChatModel) => credits >= MODEL_CREDITS[model],
    hasCreditsForImage: () => credits >= IMAGE_CREDITS[tier],
    hasCreditsForPromptEnhance: () => credits >= PROMPT_ENHANCE_CREDITS,
    
    // Tier check functions
    isPaid: () => tier !== 'free',
    isPlus: () => tier === 'plus' || tier === 'pro' || tier === 'ultimate',
    isPro: () => tier === 'pro' || tier === 'ultimate',
    isUltimate: () => tier === 'ultimate',
    
    // Upgrade needed check
    needsUpgradeFor: (requiredTier: SubscriptionTier) => {
      const tierOrder: SubscriptionTier[] = ['free', 'plus', 'pro', 'ultimate'];
      return tierOrder.indexOf(tier) < tierOrder.indexOf(requiredTier);
    },
  };
}

/**
 * Hook to get swipe status for Discover page
 */
export function useSwipeStatus(userId?: Id<"users">) {
  const swipeData = useQuery(
    api.users.getRemainingSwipes, 
    userId ? { userId } : "skip"
  );
  
  return {
    remaining: swipeData?.remaining ?? 0,
    limit: swipeData?.limit ?? 10,
    isLoading: swipeData === undefined,
    hasSwipes: (swipeData?.remaining ?? 0) > 0,
  };
}
