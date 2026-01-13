// ========================================
// LoveXAI Permission System
// ========================================

// Subscription Tiers
export type SubscriptionTier = 'free' | 'plus' | 'pro' | 'ultimate';

// AI Chat Models
export type ChatModel = 'nova' | 'pulsar' | 'nebula' | 'quasar';

// AI Image Models
export type ImageModel = 'spark' | 'prism' | 'aurora' | 'zenith';

// Character Access Levels
export type CharacterAccessLevel = 'free' | 'plus' | 'pro' | 'ultimate';

// ========================================
// Tier Limits Configuration
// ========================================
export const TIER_LIMITS: Record<SubscriptionTier, {
  daily_swipes: number;
  memory_length: number;
  custom_characters: number;
  monthly_credits: number;
  models: ChatModel[];
  character_access: CharacterAccessLevel[];
}> = {
  free: {
    daily_swipes: 10,
    memory_length: 10,
    custom_characters: 0,
    monthly_credits: 0, // Only gets 150 on signup
    models: ['nova'],
    character_access: ['free'],
  },
  plus: {
    daily_swipes: 30,
    memory_length: 20,
    custom_characters: 5,
    monthly_credits: 500,
    models: ['nova', 'pulsar'],
    character_access: ['free', 'plus'],
  },
  pro: {
    daily_swipes: 50,
    memory_length: 30,
    custom_characters: 15,
    monthly_credits: 2000,
    models: ['nova', 'pulsar', 'nebula'],
    character_access: ['free', 'plus', 'pro'],
  },
  ultimate: {
    daily_swipes: Infinity,
    memory_length: 50,
    custom_characters: Infinity,
    monthly_credits: 5000,
    models: ['nova', 'pulsar', 'nebula', 'quasar'],
    character_access: ['free', 'plus', 'pro', 'ultimate'],
  },
};

// ========================================
// Credits Consumption
// ========================================

// Chat model credits per message
export const MODEL_CREDITS: Record<ChatModel, number> = {
  nova: 2,
  pulsar: 4,
  nebula: 6,
  quasar: 10,
};

// Image generation credits per tier
// DEPRECATED: Use IMAGE_MODEL_CREDITS instead for per-model pricing
export const IMAGE_CREDITS: Record<SubscriptionTier, number> = {
  free: 10,
  plus: 10,
  pro: 15,
  ultimate: 20,
};

// ========================================
// Image Model Configuration
// ========================================

// Image model name mapping (UI -> actual API model)
export const IMAGE_MODEL_MAPPING: Record<ImageModel, string> = {
  spark: 'gemini-2.5-flash-image',
  prism: 'gpt-4o-image-vip',
  aurora: 'flux-kontext-pro',
  zenith: 'gemini-3-pro-image-preview',
};

// Image model credits per generation
export const IMAGE_MODEL_CREDITS: Record<ImageModel, number> = {
  spark: 10,   // $0.04 - 基础款
  prism: 15,   // $0.10 - 中端
  aurora: 25,  // $0.20 - 高端艺术
  zenith: 40,  // $0.30 - 顶级
};

// Image models available per subscription tier
export const IMAGE_MODEL_TIERS: Record<SubscriptionTier, ImageModel[]> = {
  free: ['spark'],
  plus: ['spark', 'prism'],
  pro: ['spark', 'prism', 'aurora'],
  ultimate: ['spark', 'prism', 'aurora', 'zenith'],
};

// Image model display info
export const IMAGE_MODEL_INFO: Record<ImageModel, { name: string; desc: string; tier: string }> = {
  spark: { name: 'Spark', desc: 'Fast & Efficient', tier: 'FREE' },
  prism: { name: 'Prism', desc: 'Balanced Quality', tier: 'PLUS' },
  aurora: { name: 'Aurora', desc: 'Artistic Style', tier: 'PRO' },
  zenith: { name: 'Zenith', desc: 'Ultimate Quality', tier: 'ULTIMATE' },
};

// Prompt enhancement cost
export const PROMPT_ENHANCE_CREDITS = 2;

// New user signup credits
export const SIGNUP_CREDITS = 150;

// ========================================
// Model Mapping (UI name -> actual model)
// ========================================
export const MODEL_MAPPING: Record<ChatModel, string> = {
  nova: 'gpt-4o-mini',
  pulsar: 'gemini-2.0-flash-exp',
  nebula: 'deepseek-r1-0528',
  quasar: 'gpt-4.5-preview',
};

// ========================================
// Helper Functions
// ========================================

/**
 * Check if a user can access a specific AI model
 */
export function canUseModel(tier: SubscriptionTier, model: ChatModel): boolean {
  return TIER_LIMITS[tier].models.includes(model);
}

/**
 * Check if a user can access a character by its access level
 */
export function canAccessCharacter(tier: SubscriptionTier, characterLevel: CharacterAccessLevel): boolean {
  return TIER_LIMITS[tier].character_access.includes(characterLevel);
}

/**
 * Get the credits cost for a chat message
 */
export function getChatCredits(model: ChatModel): number {
  return MODEL_CREDITS[model];
}

/**
 * Get the credits cost for image generation
 */
export function getImageCredits(model: ImageModel): number {
  return IMAGE_MODEL_CREDITS[model] || 10;
}

/**
 * Check if a user can use a specific image model
 */
export function canUseImageModel(tier: SubscriptionTier, model: ImageModel): boolean {
  const allowedModels = IMAGE_MODEL_TIERS[tier] || IMAGE_MODEL_TIERS['free'];
  return allowedModels.includes(model);
}

/**
 * Check if user has enough credits
 */
export function hasEnoughCredits(balance: number, cost: number): boolean {
  return balance >= cost;
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: SubscriptionTier): string {
  const names: Record<SubscriptionTier, string> = {
    free: 'FREE',
    plus: 'PLUS',
    pro: 'PRO',
    ultimate: 'ULTIMATE',
  };
  return names[tier];
}

/**
 * Compare tier levels (returns true if tier1 >= tier2)
 */
export function isTierAtLeast(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  const tierOrder: SubscriptionTier[] = ['free', 'plus', 'pro', 'ultimate'];
  return tierOrder.indexOf(userTier) >= tierOrder.indexOf(requiredTier);
}
