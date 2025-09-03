import { getSupabaseClient } from "./db";

export interface ImageGeneration {
  id?: number;
  uuid: string;
  user_uuid: string;
  created_at?: string;
  
  // 生成参数
  prompt: string;
  revised_prompt?: string;
  aspect_ratio?: string;
  model?: string;
  
  // 存储信息
  original_url?: string;
  storage_url: string;
  storage_key: string;
  file_size?: number;
  
  // 成本和状态
  credits_cost?: number;
  generation_time_ms?: number;
  status?: string;
}

/**
 * 插入图片生成记录
 */
export async function insertImageGeneration(record: ImageGeneration) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("image_generations")
    .insert([record])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * 获取用户的图片历史记录
 */
export async function getUserImageGenerations(
  user_uuid: string,
  options: {
    limit?: number;
    offset?: number;
    search?: string;
    sort?: 'newest' | 'oldest';
  } = {}
) {
  const supabase = getSupabaseClient();
  const { limit = 20, offset = 0, search, sort = 'newest' } = options;

  let query = supabase
    .from("image_generations")
    .select("*")
    .eq("user_uuid", user_uuid);

  // 搜索功能
  if (search) {
    query = query.ilike("prompt", `%${search}%`);
  }

  // 排序
  const order = sort === 'newest' ? { ascending: false } : { ascending: true };
  query = query.order("created_at", order);

  // 分页
  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * 获取用户图片生成统计信息 - 优化版本，使用单个查询
 */
export async function getUserImageStats(user_uuid: string) {
  const supabase = getSupabaseClient();
  
  // 计算时间范围
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const thisMonth = now.toISOString().substring(0, 7);
  
  // 使用一个查询获取所有需要的数据
  const { data, error } = await supabase
    .from("image_generations")
    .select("created_at, credits_cost")
    .eq("user_uuid", user_uuid)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  // 在应用层计算统计信息
  const stats = {
    total_count: 0,
    today_count: 0,
    monthly_count: 0,
    monthly_credits: 0
  };

  if (data && data.length > 0) {
    const todayStart = `${today}T00:00:00.000Z`;
    const monthStart = `${thisMonth}-01T00:00:00.000Z`;

    for (const item of data) {
      stats.total_count++;
      
      const createdAt = item.created_at;
      if (createdAt >= todayStart) {
        stats.today_count++;
      }
      
      if (createdAt >= monthStart) {
        stats.monthly_count++;
        stats.monthly_credits += item.credits_cost || 0;
      }
    }
  }

  return stats;
}

/**
 * 根据UUID获取单张图片记录
 */
export async function getImageGenerationByUuid(uuid: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("image_generations")
    .select("*")
    .eq("uuid", uuid)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * 删除图片记录
 */
export async function deleteImageGeneration(uuid: string, user_uuid: string) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("image_generations")
    .delete()
    .eq("uuid", uuid)
    .eq("user_uuid", user_uuid); // 确保用户只能删除自己的记录

  if (error) {
    throw error;
  }

  return true;
}