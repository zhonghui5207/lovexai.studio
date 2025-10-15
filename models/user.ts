import { User, UserSubscription, UserWithSubscription } from "@/types/chat";
import { getSupabaseClient } from "./db";

// =============================================================================
// 基础用户操作
// =============================================================================

export async function createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .insert(userData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  return data;
}

export async function findUserById(id: string): Promise<User | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }

  return data;
}

// =============================================================================
// 积分系统管理
// =============================================================================

export async function updateCreditsBalance(userId: string, newBalance: number): Promise<User> {
  return updateUser(userId, { credits_balance: newBalance });
}

export async function addCredits(userId: string, amount: number): Promise<User> {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const newBalance = user.credits_balance + amount;
  return updateCreditsBalance(userId, newBalance);
}

export async function deductCredits(userId: string, amount: number): Promise<User> {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (user.credits_balance < amount) {
    throw new Error("Insufficient credits");
  }

  const newBalance = user.credits_balance - amount;
  return updateCreditsBalance(userId, newBalance);
}

// =============================================================================
// 订阅系统管理
// =============================================================================

export async function getUserWithSubscription(userId: string): Promise<UserWithSubscription | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.log('getUserWithSubscription error:', error.message);
    return null;
  }

  // 直接返回用户基础信息，订阅信息包含在users表中
  return data;
}

export async function updateSubscriptionTier(
  userId: string,
  tier: User['subscription_tier'],
  expiresAt?: string
): Promise<User> {
  const updates: Partial<User> = { subscription_tier: tier };
  if (expiresAt) {
    updates.subscription_expires_at = expiresAt;
  }

  return updateUser(userId, updates);
}

// =============================================================================
// 权限检查系统
// =============================================================================

export async function checkUserPermissions(userId: string) {
  const user = await getUserWithSubscription(userId);
  if (!user) {
    throw new Error("User not found");
  }

  return {
    canAccessCharacter: (characterAccessLevel: string) => {
      const tierLevels = { free: 0, basic: 1, pro: 2, ultra: 3 };
      const userLevel = tierLevels[user.subscription_tier as keyof typeof tierLevels] || 0;
      const requiredLevel = tierLevels[characterAccessLevel as keyof typeof tierLevels] || 0;

      // 调试信息
      console.log('Character Access Debug:', {
        userSubscriptionTier: user.subscription_tier,
        userLevel,
        characterAccessLevel,
        requiredLevel,
        canAccess: userLevel >= requiredLevel
      });

      return userLevel >= requiredLevel;
    },

    canSendMessage: (creditsRequired: number) => {
      return user.credits_balance >= creditsRequired;
    },

    hasActiveSubscription: () => {
      if (user.subscription_tier === 'free') return true;
      if (!user.subscription_expires_at) return false;
      return new Date(user.subscription_expires_at) > new Date();
    }
  };
}

// =============================================================================
// 用户查找和创建
// =============================================================================

export async function findOrCreateUser(userData: {
  email: string;
  name: string;
  avatar_url?: string;
  provider: string;
  provider_id: string;
}): Promise<User> {
  // 首先尝试查找用户
  let user = await findUserByEmail(userData.email);
  if (!user) {
    // 用户不存在，创建新用户
    user = await createUser({
      email: userData.email,
      name: userData.name,
      avatar_url: userData.avatar_url || '',
      subscription_tier: 'free',
      credits_balance: 100, // 新用户赠送100积分
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  return user;
}

// =============================================================================
// 批量操作
// =============================================================================

export async function findUsersByIds(ids: string[]): Promise<User[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .in("id", ids);

  if (error) {
    throw new Error(`Failed to find users: ${error.message}`);
  }

  return data || [];
}

export async function searchUsers(query: string, limit: number = 10): Promise<User[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(limit);

  if (error) {
    throw new Error(`Failed to search users: ${error.message}`);
  }

  return data || [];
}

// =============================================================================
// 用户分页（从原user.ts迁移）
// =============================================================================

export async function getUsers(
  page: number = 1,
  pageSize: number = 10,
  search?: string
): Promise<{ users: User[]; total: number; page: number; pageSize: number }> {
  const supabase = getSupabaseClient();
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("users")
    .select("*", { count: "exact" })
    .range(offset, offset + pageSize - 1)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to get users: ${error.message}`);
  }

  return {
    users: data || [],
    total: count || 0,
    page,
    pageSize
  };
}

// =============================================================================
// 邀请码系统（从原user.ts迁移）
// =============================================================================

export async function updateUserInviteCode(userId: string, inviteCode: string): Promise<User> {
  return updateUser(userId, { invite_code: inviteCode });
}

export async function updateUserInvitedBy(userId: string, invitedBy: string): Promise<User> {
  return updateUser(userId, { invited_by: invitedBy });
}

export async function findUsersByUuids(user_uuids: string[]): Promise<User[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .in("id", user_uuids);

  if (error) {
    throw new Error(`Failed to find users by IDs: ${error.message}`);
  }

  return data || [];
}

export async function findUserByInviteCode(invite_code: string): Promise<User | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("invite_code", invite_code)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function getUserUuidsByEmail(email: string): Promise<string[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("email", email);

  if (error) {
    throw new Error(`Failed to get user UUIDs by email: ${error.message}`);
  }

  return data?.map(user => user.id) || [];
}

// =============================================================================
// 兼容性函数（保持向后兼容）
// =============================================================================

// 为了向后兼容，保留insertUser函数
export async function insertUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User[]> {
  const newUser = await createUser(user);
  return [newUser];
}

// 为了向后兼容，保留findUserByUuid函数（映射到findUserById）
export async function findUserByUuid(uuid: string): Promise<User | undefined> {
  const user = await findUserById(uuid);
  return user || undefined;
}