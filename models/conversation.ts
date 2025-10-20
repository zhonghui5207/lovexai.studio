import {
  Conversation,
  Message,
  GenerationSettings,
  ConversationWithCharacter,
  MessageWithSender,
  CreateConversationParams,
  SendMessageParams,
  SenderType
} from "@/types/chat";
import { getSupabaseClient } from "./db";
import { findCharacterById } from "./character";
import { findUserById, deductCredits } from "./user";

// 对话会话操作
export async function createConversation(params: CreateConversationParams): Promise<Conversation> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: params.user_id,
      character_id: params.character_id,
      title: params.title
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create conversation: ${error.message}`);
  }

  return data;
}

export async function findConversationById(id: string): Promise<Conversation | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function getConversationWithCharacter(id: string): Promise<ConversationWithCharacter | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("conversations")
    .select(`
      *,
      characters(*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    return null;
  }

  // Supabase 返回的数据中角色信息在 characters 字段中，需要映射到 character 字段
  const conversationData = data as any;
  if (conversationData.characters) {
    conversationData.character = conversationData.characters;
    delete conversationData.characters;
  }

  return conversationData as ConversationWithCharacter;
}

export async function getUserConversations(userId: string): Promise<ConversationWithCharacter[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("conversations")
    .select(`
      *,
      characters(*)
    `)
    .eq("user_id", userId)
    .eq("is_archived", false)
    .order("last_message_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to get user conversations: ${error.message}`);
  }

  // Supabase 返回的数据中角色信息在 characters 字段中，需要映射到 character 字段
  const conversations = (data || []).map((conv: any) => {
    if (conv.characters) {
      conv.character = conv.characters;
      delete conv.characters;
    }
    return conv as ConversationWithCharacter;
  });

  return conversations;
}

// 获取对话的最后一条消息
export async function getLastMessageForConversation(conversationId: string): Promise<Message | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function findActiveConversationByUserAndCharacter(
  userId: string,
  characterId: string
): Promise<ConversationWithCharacter | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("conversations")
    .select(`
      *,
      characters(*)
    `)
    .eq("user_id", userId)
    .eq("character_id", characterId)
    .eq("is_archived", false)
    .order("last_message_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return null;
  }

  // Supabase 返回的数据中角色信息在 characters 字段中，需要映射到 character 字段
  const conversationData = data as any;
  if (conversationData.characters) {
    conversationData.character = conversationData.characters;
    delete conversationData.characters;
  }

  return conversationData as ConversationWithCharacter;
}

export async function updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("conversations")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update conversation: ${error.message}`);
  }

  return data;
}

export async function archiveConversation(id: string): Promise<Conversation> {
  return updateConversation(id, { is_archived: true });
}

export async function updateConversationStats(conversationId: string, messageCredits: number): Promise<void> {
  const conversation = await findConversationById(conversationId);
  if (!conversation) {
    throw new Error("Conversation not found");
  }

  await updateConversation(conversationId, {
    message_count: conversation.message_count + 1,
    total_credits_used: conversation.total_credits_used + messageCredits,
    last_message_at: new Date().toISOString()
  });
}

// 消息操作
export async function createMessage(params: SendMessageParams): Promise<Message> {
  const supabase = getSupabaseClient();

  // 积分扣除已移至AI回复成功后统一处理
  // 这里不再扣除积分，避免重复扣费问题
  let creditsUsed = 0;
  if (params.sender_type === 'user') {
    const conversation = await getConversationWithCharacter(params.conversation_id);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    creditsUsed = conversation.character.credits_per_message;
    // 注意：积分扣除已在app/api/chat/route.ts中AI回复成功后处理
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: params.conversation_id,
      sender_type: params.sender_type,
      content: params.content,
      credits_used: creditsUsed,
      generation_settings: params.generation_settings
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create message: ${error.message}`);
  }

  // 更新对话统计
  await updateConversationStats(params.conversation_id, creditsUsed);

  return data;
}

export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to get conversation messages: ${error.message}`);
  }

  return data || [];
}

export async function getConversationMessagesWithSender(conversationId: string): Promise<MessageWithSender[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("messages")
    .select(`
      *,
      conversations!inner(
        user_id,
        character_id,
        users(*),
        characters(*)
      )
    `)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to get conversation messages with sender: ${error.message}`);
  }

  return data || [];
}

export async function deleteMessage(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete message: ${error.message}`);
  }
}

// 对话生成设置操作
export async function createOrUpdateGenerationSettings(
  conversationId: string,
  settings: Partial<Omit<GenerationSettings, 'id' | 'conversation_id' | 'updated_at'>>
): Promise<GenerationSettings> {
  const supabase = getSupabaseClient();

  // 尝试更新现有设置
  const { data: existingData, error: selectError } = await supabase
    .from("generation_settings")
    .select("*")
    .eq("conversation_id", conversationId)
    .single();

  if (existingData) {
    // 更新现有设置
    const { data, error } = await supabase
      .from("generation_settings")
      .update(settings)
      .eq("conversation_id", conversationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update generation settings: ${error.message}`);
    }

    return data;
  } else {
    // 创建新设置
    const { data, error } = await supabase
      .from("generation_settings")
      .insert({
        conversation_id: conversationId,
        ...settings
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create generation settings: ${error.message}`);
    }

    return data;
  }
}

export async function getGenerationSettings(conversationId: string): Promise<GenerationSettings | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("generation_settings")
    .select("*")
    .eq("conversation_id", conversationId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

// 便捷方法：查找或创建完整的对话流程
export async function startConversationWithCharacter(
  userId: string,
  characterId: string,
  title?: string
): Promise<{ conversation: ConversationWithCharacter; greeting: Message; isNewConversation: boolean }> {
  // 验证用户和角色
  const user = await findUserById(userId);
  const character = await findCharacterById(characterId);

  if (!user) throw new Error("User not found");
  if (!character) throw new Error("Character not found");

  // 检查用户权限
  const tierLevels = { free: 0, basic: 1, pro: 2, ultra: 3 };
  const userLevel = tierLevels[user.subscription_tier as keyof typeof tierLevels] || 0;
  const characterLevel = tierLevels[character.access_level as keyof typeof tierLevels] || 0;

  if (userLevel < characterLevel) {
    throw new Error("User does not have access to this character");
  }

  // 首先查找现有的活跃对话
  const existingConversation = await findActiveConversationByUserAndCharacter(userId, characterId);

  if (existingConversation) {
    // 获取现有对话的第一条消息（通常是问候语）
    const messages = await getConversationMessages(existingConversation.id);
    const greeting = messages.find(msg => msg.sender_type === 'character') || messages[0];

    if (!greeting) {
      throw new Error("No greeting message found in existing conversation");
    }

    return {
      conversation: existingConversation,
      greeting,
      isNewConversation: false
    };
  }

  // 如果没有现有对话，创建新对话
  const conversation = await createConversation({
    user_id: userId,
    character_id: characterId,
    title: title || `Chat with ${character.name}`
  });

  // 创建默认生成设置
  await createOrUpdateGenerationSettings(conversation.id, {
    response_length: 'default',
    include_narrator: false,
    narrator_voice: 'male',
    selected_model: 'nectar_basic'
  });

  // 创建角色问候消息
  const greeting = await createMessage({
    conversation_id: conversation.id,
    content: character.greeting_message,
    sender_type: 'character'
  });

  // 获取完整的对话信息
  const fullConversation = await getConversationWithCharacter(conversation.id);
  if (!fullConversation) {
    throw new Error("Failed to retrieve conversation");
  }

  return {
    conversation: fullConversation,
    greeting,
    isNewConversation: true
  };
}

// 发送用户消息并获取AI回复
export async function sendUserMessage(
  conversationId: string,
  content: string,
  generationSettings?: Partial<GenerationSettings>
): Promise<{ userMessage: Message; aiMessage?: Message }> {
  // 创建用户消息
  const userMessage = await createMessage({
    conversation_id: conversationId,
    content,
    sender_type: 'user',
    generation_settings: generationSettings
  });

  // 这里可以调用AI API生成回复
  // 目前先返回用户消息，AI回复通过单独的API处理

  return {
    userMessage
  };
}