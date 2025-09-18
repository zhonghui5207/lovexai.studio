-- LoveXAI Studio Database Schema
-- AI Character Chat Platform Database Structure
-- Created: 2025-09-18

-- ============================================================================
-- Core Tables
-- ============================================================================

-- Users Table - 用户信息
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    credits_balance INTEGER DEFAULT 100,
    subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'pro')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Characters Table - AI角色信息
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100),
    avatar_url TEXT NOT NULL,
    description TEXT NOT NULL,
    personality TEXT NOT NULL,
    traits JSONB NOT NULL DEFAULT '[]',
    greeting_message TEXT NOT NULL,
    chat_count VARCHAR(20) DEFAULT '0 chats',
    age INTEGER,
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations Table - 对话会话
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    title VARCHAR(255),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message_count INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages Table - 消息内容
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'character')),
    content TEXT NOT NULL,
    generation_settings JSONB,
    credits_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generation Settings Table - 对话生成设置
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
-- Optional Extension Tables
-- ============================================================================

-- User Character Settings Table - 用户对特定角色的个性化设置
CREATE TABLE user_character_settings (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    custom_persona TEXT,
    favorite BOOLEAN DEFAULT false,
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, character_id)
);

-- Credit Transactions Table - 积分使用记录
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL, -- 负数表示消费，正数表示充值
    transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN ('message_generation', 'purchase', 'bonus')),
    model_used VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Conversations indexes
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_character_id ON conversations(character_id);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- Messages indexes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Credit transactions indexes
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- User character settings indexes
CREATE INDEX idx_user_character_settings_user_id ON user_character_settings(user_id);
CREATE INDEX idx_user_character_settings_favorite ON user_character_settings(favorite) WHERE favorite = true;

-- ============================================================================
-- Triggers for Updated At
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_generation_settings_updated_at BEFORE UPDATE ON generation_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Sample Data (Optional)
-- ============================================================================

-- Insert sample characters (基于现有角色数据)
INSERT INTO characters (name, username, avatar_url, description, personality, traits, greeting_message, chat_count, age, location) VALUES
(
    'Sophia Chen',
    'sophia_chen',
    'https://cdn.lovexai.studio/characters/sophia.jpg',
    'A warm and intelligent university student studying psychology, always eager to help others understand their emotions.',
    'Sophia is empathetic, curious, and has a natural ability to make people feel comfortable. She loves deep conversations and is genuinely interested in understanding human nature.',
    '["Empathetic", "Intelligent", "Supportive", "Curious"]',
    'Hi there! I''m Sophia. I love getting to know new people and having meaningful conversations. What''s on your mind today?',
    '104K chats',
    22,
    'San Francisco, CA'
),
(
    'Alex Rivers',
    'alex_rivers',
    'https://cdn.lovexai.studio/characters/alex.jpg',
    'An adventurous photographer who travels the world capturing beautiful moments and stories.',
    'Alex is spontaneous, creative, and always looking for the next great adventure. They have a passion for storytelling through visual art.',
    '["Adventurous", "Creative", "Spontaneous", "Artistic"]',
    'Hey! Just got back from an amazing shoot in the mountains. Ready for some exciting conversations?',
    '87K chats',
    28,
    'Currently traveling'
);

-- Note: Add more sample characters as needed