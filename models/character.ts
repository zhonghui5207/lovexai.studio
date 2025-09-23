import { Character, AccessLevel } from "@/types/chat";
import { getSupabaseClient } from "./db";

// 角色基础操作
export async function createCharacter(characterData: Omit<Character, 'id' | 'created_at' | 'updated_at'>): Promise<Character> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("characters")
    .insert(characterData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create character: ${error.message}`);
  }

  return data;
}

export async function findCharacterById(id: string): Promise<Character | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function findCharacterByUsername(username: string): Promise<Character | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .eq("username", username)
    .eq("is_active", true)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function updateCharacter(id: string, updates: Partial<Character>): Promise<Character> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("characters")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update character: ${error.message}`);
  }

  return data;
}

// 角色查询和筛选
export async function getAllCharacters(activeOnly: boolean = true): Promise<Character[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("characters")
    .select("*")
    .order("sort_order", { ascending: true });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get characters: ${error.message}`);
  }

  return data || [];
}

export async function getCharactersByAccessLevel(accessLevel: AccessLevel): Promise<Character[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .eq("access_level", accessLevel)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to get characters by access level: ${error.message}`);
  }

  return data || [];
}

export async function getCharactersForUser(userSubscriptionTier: string): Promise<Character[]> {
  const tierLevels = { free: 0, basic: 1, pro: 2, ultra: 3 };
  const userLevel = tierLevels[userSubscriptionTier as keyof typeof tierLevels] || 0;

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to get characters for user: ${error.message}`);
  }

  // 过滤用户可以访问的角色
  const accessibleCharacters = (data || []).filter(character => {
    const characterLevel = tierLevels[character.access_level as keyof typeof tierLevels] || 0;
    return userLevel >= characterLevel;
  });

  return accessibleCharacters;
}

export async function getFreeCharacters(): Promise<Character[]> {
  return getCharactersByAccessLevel('free');
}

export async function getPremiumCharacters(): Promise<Character[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .eq("is_premium", true)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to get premium characters: ${error.message}`);
  }

  return data || [];
}

// 角色统计和管理
export async function updateCharacterChatCount(characterId: string, increment: number = 1): Promise<Character> {
  const character = await findCharacterById(characterId);
  if (!character) {
    throw new Error("Character not found");
  }

  // 解析当前聊天数量
  const currentCount = parseInt(character.chat_count.replace(/[^\d]/g, '')) || 0;
  const newCount = currentCount + increment;

  // 格式化新的聊天数量字符串
  let newChatCount: string;
  if (newCount >= 1000000) {
    newChatCount = `${(newCount / 1000000).toFixed(1)}M chats`;
  } else if (newCount >= 1000) {
    newChatCount = `${(newCount / 1000).toFixed(1)}K chats`;
  } else {
    newChatCount = `${newCount} chats`;
  }

  return updateCharacter(characterId, { chat_count: newChatCount });
}

export async function toggleCharacterStatus(id: string): Promise<Character> {
  const character = await findCharacterById(id);
  if (!character) {
    throw new Error("Character not found");
  }

  return updateCharacter(id, { is_active: !character.is_active });
}

export async function searchCharacters(query: string, limit: number = 10): Promise<Character[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .or(`name.ilike.%${query}%,description.ilike.%${query}%,personality.ilike.%${query}%`)
    .eq("is_active", true)
    .limit(limit);

  if (error) {
    throw new Error(`Failed to search characters: ${error.message}`);
  }

  return data || [];
}

// 角色权限检查
export function canUserAccessCharacter(userSubscriptionTier: string, character: Character): boolean {
  const tierLevels = { free: 0, basic: 1, pro: 2, ultra: 3 };
  const userLevel = tierLevels[userSubscriptionTier as keyof typeof tierLevels] || 0;
  const characterLevel = tierLevels[character.access_level as keyof typeof tierLevels] || 0;
  return userLevel >= characterLevel;
}

export function getCreditsRequired(character: Character): number {
  return character.credits_per_message;
}

// 批量操作
export async function findCharactersByIds(ids: string[]): Promise<Character[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .in("id", ids)
    .eq("is_active", true);

  if (error) {
    throw new Error(`Failed to find characters: ${error.message}`);
  }

  return data || [];
}

export async function updateCharactersSortOrder(characterUpdates: { id: string; sort_order: number }[]): Promise<void> {
  const supabase = getSupabaseClient();

  for (const update of characterUpdates) {
    const { error } = await supabase
      .from("characters")
      .update({ sort_order: update.sort_order })
      .eq("id", update.id);

    if (error) {
      throw new Error(`Failed to update character sort order: ${error.message}`);
    }
  }
}