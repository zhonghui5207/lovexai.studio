// ========================================
// LoveXAI Permission System
// ========================================

// Subscription Tiers
export type SubscriptionTier = 'free' | 'plus' | 'pro' | 'ultimate';

// AI Chat Models
export type ChatModel = 'nova' | 'pulsar' | 'nebula' | 'quasar';

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
export const IMAGE_CREDITS: Record<SubscriptionTier, number> = {
  free: 10,
  plus: 10,
  pro: 15,
  ultimate: 20,
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
export function getImageCredits(tier: SubscriptionTier): number {
  return IMAGE_CREDITS[tier];
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
