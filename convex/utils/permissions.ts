// ========================================
// Convex Permission Utilities
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
    monthly_credits: 0,
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

// Model name mapping (UI -> actual API model)
export const MODEL_MAPPING: Record<ChatModel, string> = {
  nova: 'gpt-4o-mini',
  pulsar: 'o4-mini',
  nebula: 'deepseek-v3-250324',
  quasar: 'gemini-3-pro-preview',
};

// ========================================
// Helper Functions
// ========================================

/**
 * Check if a user can access a specific AI model
 */
export function canUseModel(tier: SubscriptionTier, model: ChatModel): boolean {
  const limits = TIER_LIMITS[tier as SubscriptionTier];
  if (!limits) return false;
  return limits.models.includes(model);
}

/**
 * Check if a user can access a character by its access level
 */
export function canAccessCharacter(tier: SubscriptionTier, characterLevel: CharacterAccessLevel): boolean {
  const limits = TIER_LIMITS[tier as SubscriptionTier];
  if (!limits) return false;
  return limits.character_access.includes(characterLevel);
}

/**
 * Get the credits cost for a chat message
 */
export function getChatCredits(model: ChatModel): number {
  return MODEL_CREDITS[model] || 2; // Default to nova cost
}

/**
 * Get the credits cost for image generation
 */
export function getImageCredits(tier: SubscriptionTier): number {
  return IMAGE_CREDITS[tier] || 10;
}

/**
 * Get daily swipe limit for a tier
 */
export function getDailySwipeLimit(tier: SubscriptionTier): number {
  const limits = TIER_LIMITS[tier as SubscriptionTier];
  return limits?.daily_swipes || 10;
}

/**
 * Get memory length for a tier
 */
export function getMemoryLength(tier: SubscriptionTier): number {
  const limits = TIER_LIMITS[tier as SubscriptionTier];
  return limits?.memory_length || 10;
}

/**
 * Get custom character limit for a tier
 */
export function getCustomCharacterLimit(tier: SubscriptionTier): number {
  const limits = TIER_LIMITS[tier as SubscriptionTier];
  return limits?.custom_characters || 0;
}

/**
 * Check if user has enough credits
 */
export function hasEnoughCredits(balance: number, cost: number): boolean {
  return balance >= cost;
}

/**
 * Get today's date string (for daily reset comparison)
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Check if daily counters should be reset
 */
export function shouldResetDaily(lastResetDate: string | undefined): boolean {
  if (!lastResetDate) return true;
  return lastResetDate !== getTodayDateString();
}
