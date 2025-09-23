// AI聊天平台相关类型定义

export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'ultra';
export type AccessLevel = 'free' | 'basic' | 'pro' | 'ultra';
export type SenderType = 'user' | 'character';
export type ResponseLength = 'short' | 'default' | 'long';
export type NarratorVoice = 'male' | 'female';
export type OrderType = 'subscription' | 'credits';
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'pending';
export type TransactionType = 'purchase' | 'chat_usage' | 'bonus' | 'refund' | 'admin_adjust';

// 用户接口 - 新版本
export interface User {
  id: string; // UUID
  email: string;
  name: string;
  avatar_url?: string;
  subscription_tier: SubscriptionTier;
  subscription_expires_at?: string;
  credits_balance: number;
  total_credits_purchased: number;
  created_at: string;
  updated_at: string;
}

// 订阅计划
export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  monthly_price: number;
  yearly_price?: number;
  features: Record<string, any>;
  max_character_access_level: AccessLevel;
  is_active: boolean;
  created_at: string;
}

// 用户订阅记录
export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  starts_at: string;
  expires_at?: string;
  auto_renew: boolean;
  created_at: string;
}

// 积分包定义
export interface CreditPackage {
  id: string;
  name: string;
  credits_amount: number;
  bonus_credits: number;
  price: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

// 积分交易记录
export interface CreditTransaction {
  id: string;
  user_id: string;
  transaction_type: TransactionType;
  amount: number; // 正数表示获得，负数表示消费
  balance_after: number;
  reference_id?: string; // 关联订单ID或消息ID
  description?: string;
  created_at: string;
}

// 订单
export interface Order {
  id: string;
  user_id: string;
  order_type: OrderType;
  reference_id?: string; // 关联subscription_plan_id或credit_package_id
  amount: number;
  currency: string;
  status: OrderStatus;
  payment_method?: string;
  payment_provider?: string; // 'stripe', 'paypal' etc
  payment_reference?: string; // 第三方支付订单号
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

// AI角色
export interface Character {
  id: string;
  name: string;
  username?: string;
  avatar_url: string;
  description: string;
  personality: string;
  traits: string[]; // JSONB array
  greeting_message: string;
  access_level: AccessLevel;
  credits_per_message: number;
  is_premium: boolean;
  is_active: boolean;
  chat_count: string;
  age?: number;
  location?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// 对话会话
export interface Conversation {
  id: string;
  user_id: string;
  character_id: string;
  title?: string;
  last_message_at: string;
  message_count: number;
  total_credits_used: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

// 聊天消息
export interface Message {
  id: string;
  conversation_id: string;
  sender_type: SenderType;
  content: string;
  credits_used: number;
  generation_settings?: Record<string, any>; // JSONB
  created_at: string;
}

// 对话生成设置
export interface GenerationSettings {
  id: string;
  conversation_id: string;
  response_length: ResponseLength;
  include_narrator: boolean;
  narrator_voice: NarratorVoice;
  selected_model: string;
  updated_at: string;
}

// 用户角色偏好设置
export interface UserCharacterSettings {
  user_id: string;
  character_id: string;
  is_favorite: boolean;
  custom_persona?: string;
  last_interaction: string;
  total_messages: number;
  total_credits_spent: number;
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 聊天相关的复合类型
export interface ConversationWithCharacter extends Conversation {
  character: Character;
}

export interface MessageWithSender extends Message {
  character?: Character;
  user?: User;
}

export interface UserWithSubscription extends User {
  subscription?: UserSubscription;
  subscription_plan?: SubscriptionPlan;
}

// 权限检查相关
export interface UserPermissions {
  can_access_character: (character: Character) => boolean;
  can_send_message: (character: Character) => boolean;
  credits_needed: (character: Character) => number;
}

// 聊天会话创建参数
export interface CreateConversationParams {
  user_id: string;
  character_id: string;
  title?: string;
}

// 发送消息参数
export interface SendMessageParams {
  conversation_id: string;
  content: string;
  sender_type: SenderType;
  generation_settings?: Partial<GenerationSettings>;
}

// 积分购买参数
export interface PurchaseCreditsParams {
  user_id: string;
  package_id: string;
  payment_method: string;
}

// 订阅购买参数
export interface PurchaseSubscriptionParams {
  user_id: string;
  plan_id: string;
  payment_method: string;
  billing_cycle: 'monthly' | 'yearly';
}