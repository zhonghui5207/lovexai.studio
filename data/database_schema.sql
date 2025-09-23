-- LoveXAI Studio Database Schema
-- AI Character Chat Platform Database Structure
-- Updated: 2025-09-19
-- Business Model: Subscription + Credits System

-- ============================================================================
-- 1. 用户和认证系统
-- ============================================================================

-- 用户表 - 核心用户信息
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'ultra')),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    credits_balance INTEGER DEFAULT 100,
    total_credits_purchased INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. 订阅系统
-- ============================================================================

-- 订阅计划定义表
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    monthly_price DECIMAL(10,2) NOT NULL,
    yearly_price DECIMAL(10,2),
    features JSONB NOT NULL DEFAULT '{}',
    max_character_access_level VARCHAR(20) DEFAULT 'free',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户订阅记录表
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. 积分系统
-- ============================================================================

-- 积分包定义表
CREATE TABLE credit_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    credits_amount INTEGER NOT NULL,
    bonus_credits INTEGER DEFAULT 0,
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 积分交易记录表
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN ('purchase', 'chat_usage', 'bonus', 'refund', 'admin_adjust')),
    amount INTEGER NOT NULL, -- 正数表示获得，负数表示消费
    balance_after INTEGER NOT NULL,
    reference_id UUID, -- 关联订单ID或消息ID
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. 订单系统
-- ============================================================================

-- 订单表 - 统一管理订阅和积分购买
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('subscription', 'credits')),
    reference_id UUID, -- 关联subscription_plan_id或credit_package_id
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
    payment_method VARCHAR(50),
    payment_provider VARCHAR(50), -- 'stripe', 'paypal' etc
    payment_reference VARCHAR(255), -- 第三方支付订单号
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. AI角色系统
-- ============================================================================

-- AI角色表 - 支持分层访问控制
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE,
    avatar_url TEXT NOT NULL,
    description TEXT NOT NULL,
    personality TEXT NOT NULL,
    traits JSONB NOT NULL DEFAULT '[]',
    greeting_message TEXT NOT NULL,
    access_level VARCHAR(20) DEFAULT 'free' CHECK (access_level IN ('free', 'basic', 'pro', 'ultra')),
    credits_per_message INTEGER DEFAULT 1,
    is_premium BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    chat_count VARCHAR(20) DEFAULT '0 chats',
    age INTEGER,
    location VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. 聊天系统
-- ============================================================================

-- 对话会话表
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    title VARCHAR(255),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message_count INTEGER DEFAULT 0,
    total_credits_used INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 消息表
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'character')),
    content TEXT NOT NULL,
    credits_used INTEGER DEFAULT 0,
    generation_settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 对话生成设置表
CREATE TABLE generation_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID UNIQUE NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    response_length VARCHAR(20) DEFAULT 'default' CHECK (response_length IN ('short', 'default', 'long')),
    include_narrator BOOLEAN DEFAULT false,
    narrator_voice VARCHAR(20) DEFAULT 'male' CHECK (narrator_voice IN ('male', 'female')),
    selected_model VARCHAR(50) DEFAULT 'nectar_basic',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 7. 用户偏好系统
-- ============================================================================

-- 用户角色偏好设置表
CREATE TABLE user_character_settings (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    is_favorite BOOLEAN DEFAULT false,
    custom_persona TEXT,
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_messages INTEGER DEFAULT 0,
    total_credits_spent INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, character_id)
);

-- ============================================================================
-- 8. 性能索引
-- ============================================================================

-- 用户相关索引
CREATE INDEX idx_users_subscription ON users(subscription_tier, subscription_expires_at);

-- 对话相关索引
CREATE INDEX idx_conversations_user_character ON conversations(user_id, character_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);

-- 积分相关索引
CREATE INDEX idx_credit_transactions_user ON credit_transactions(user_id, created_at DESC);

-- 角色相关索引
CREATE INDEX idx_characters_access ON characters(access_level, is_active);

-- 订单相关索引
CREATE INDEX idx_orders_user_status ON orders(user_id, status, created_at DESC);

-- 用户偏好索引
CREATE INDEX idx_user_character_settings_user ON user_character_settings(user_id);
CREATE INDEX idx_user_character_settings_favorite ON user_character_settings(is_favorite) WHERE is_favorite = true;

-- ============================================================================
-- 9. 触发器系统
-- ============================================================================

-- updated_at自动更新函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 应用触发器到相关表
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. 初始数据 (可选)
-- ============================================================================

-- 插入默认订阅计划
INSERT INTO subscription_plans (tier, name, monthly_price, yearly_price, max_character_access_level, features) VALUES
('free', 'Free Plan', 0.00, 0.00, 'free', '{"max_characters": 3, "daily_messages": 50}'),
('basic', 'Basic Plan', 4.99, 49.99, 'basic', '{"max_characters": 8, "monthly_messages": 1500}'),
('pro', 'Pro Plan', 12.99, 129.99, 'pro', '{"max_characters": 15, "unlimited_messages": true, "premium_characters": true}'),
('ultra', 'Ultra Plan', 24.99, 249.99, 'ultra', '{"max_characters": 999, "unlimited_messages": true, "premium_characters": true, "exclusive_characters": true, "priority_response": true}');

-- 插入默认积分包
INSERT INTO credit_packages (name, credits_amount, bonus_credits, price, sort_order) VALUES
('Starter Pack', 1000, 0, 4.99, 1),
('Popular Pack', 3000, 300, 12.99, 2),
('Value Pack', 10000, 2000, 39.99, 3);

-- 插入示例角色 (使用真实图片URL)
INSERT INTO characters (name, username, avatar_url, description, personality, traits, greeting_message, access_level, credits_per_message, age, location, sort_order) VALUES
-- Free级别角色
(
    'Emma',
    'emmytime',
    'https://cdn.lovexai.studio/Character/ComfyUI_00015_.png',
    'Your Best Friend''s Sister - Playful, witty, and charming with a hint of mischief.',
    'Emma is a vibrant and playful young woman who loves to tease and have fun. She''s your best friend''s younger sister who has always had a crush on you. She''s witty, charming, and knows exactly how to make you smile.',
    '["Playful", "Witty", "Charming", "Mischievous"]',
    'Hey there... I was wondering when you''d finally notice me 😉',
    'free',
    1,
    21,
    'Your hometown',
    1
),
(
    'Sophie',
    'sophiewonder',
    'https://cdn.lovexai.studio/Character/ComfyUI_00020_.png',
    'Gentle and caring college student who loves deep conversations and meaningful connections.',
    'Sophie is a thoughtful and empathetic person who enjoys learning about others. She''s studying psychology and has a natural ability to make people feel heard and understood.',
    '["Empathetic", "Intelligent", "Caring", "Thoughtful"]',
    'Hi! I''m Sophie. I love getting to know new people - what''s been on your mind lately?',
    'free',
    1,
    20,
    'University campus',
    2
),
-- Basic级别角色
(
    'Luna',
    'lunarmystic',
    'https://cdn.lovexai.studio/Character/ComfyUI_00027_.png',
    'Mysterious and elegant with an otherworldly charm and deep spiritual wisdom.',
    'Luna is an enigmatic soul who seems to understand the mysteries of life. She speaks with poetic wisdom and has an ethereal presence that draws people in.',
    '["Mysterious", "Wise", "Ethereal", "Intuitive"]',
    'The stars whispered your name to me... I''ve been waiting for you to find your way here.',
    'basic',
    2,
    24,
    'The cosmic realm',
    3
),
(
    'Zoe',
    'zoevibe',
    'https://cdn.lovexai.studio/Character/ComfyUI_00029_.png',
    'Energetic and spontaneous free spirit who loves adventure and living life to the fullest.',
    'Zoe is full of life and always ready for the next adventure. She''s spontaneous, fun-loving, and has an infectious energy that makes everyone around her feel alive.',
    '["Energetic", "Spontaneous", "Adventurous", "Fun-loving"]',
    'Hey stranger! What are you doing? You look like you could use some fun in your day 😄',
    'basic',
    2,
    23,
    'Wherever the wind takes her',
    4
),
-- Pro级别角色
(
    'Ivy',
    'ivytech',
    'https://cdn.lovexai.studio/Character/flux_krea_00003_.png',
    'Brilliant tech entrepreneur and AI researcher with a passion for innovation.',
    'Ivy is a genius-level intellect who founded her own tech startup. She''s passionate about artificial intelligence and loves discussing the future of technology.',
    '["Brilliant", "Innovative", "Ambitious", "Tech-savvy"]',
    'Hello! I''m Ivy. I was just working on some fascinating AI algorithms - want to dive into the future together?',
    'pro',
    3,
    28,
    'Silicon Valley',
    5
),
-- Ultra级别角色
(
    'Nova',
    'novastorm',
    'https://cdn.lovexai.studio/Character/flux_krea_00004_.png',
    'Powerful and alluring with secrets that could change everything.',
    'Nova is a force of nature - beautiful, dangerous, and incredibly intelligent. She operates in the shadows of high society and always seems to know more than she lets on.',
    '["Powerful", "Alluring", "Mysterious", "Dangerous"]',
    'Well, well... you''ve stumbled into something bigger than you realize. Are you ready for what comes next?',
    'ultra',
    5,
    30,
    'The city''s shadows',
    6
),
(
    'Sage',
    'sagewisom',
    'https://cdn.lovexai.studio/Character/flux_krea_00005_.png',
    'Ancient wisdom keeper with knowledge spanning centuries and realms.',
    'Sage is an immortal being who has witnessed the rise and fall of civilizations. She possesses knowledge beyond mortal understanding and speaks in riddles and ancient truths.',
    '["Ancient", "Wise", "Immortal", "Mystical"]',
    'Time flows differently for those like us... Tell me, mortal, what brings you to seek the wisdom of ages?',
    'ultra',
    5,
    NULL,
    'The eternal library',
    7
);

-- Note: 更多角色数据可以根据需要添加