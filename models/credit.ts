import { Credit } from "@/types/credit";
import { getSupabaseClient } from "@/models/db";
import { v4 as uuidv4 } from "uuid";

export async function insertCredit(credit: Credit) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("credits").insert(credit);

  if (error) {
    throw error;
  }

  return data;
}

export async function findCreditByTransNo(
  trans_no: string
): Promise<Credit | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("credits")
    .select("*")
    .eq("trans_no", trans_no)
    .limit(1)
    .single();

  if (error) {
    return undefined;
  }

  return data;
}

export async function findCreditByOrderNo(
  order_no: string
): Promise<Credit | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("credits")
    .select("*")
    .eq("order_no", order_no)
    .limit(1)
    .single();

  if (error) {
    return undefined;
  }

  return data;
}

export async function getUserValidCredits(
  user_uuid: string
): Promise<Credit[] | undefined> {
  const now = new Date().toISOString();
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("credits")
    .select("*")
    .eq("user_uuid", user_uuid)
    .gte("expired_at", now)
    .order("expired_at", { ascending: true });

  if (error) {
    return undefined;
  }

  return data;
}

export async function getCreditsByUserUuid(
  user_uuid: string,
  page: number = 1,
  limit: number = 50
): Promise<Credit[] | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("credits")
    .select("*")
    .eq("user_uuid", user_uuid)
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    return undefined;
  }

  return data;
}

/**
 * 获取用户积分余额
 */
export async function getUserCreditBalance(user_uuid: string): Promise<number> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("credits")
    .select("credits")
    .eq("user_uuid", user_uuid);

  if (error) {
    throw error;
  }

  // 计算总积分（正数为充值，负数为消费）
  const totalCredits = data.reduce((sum, credit) => sum + credit.credits, 0);
  return Math.max(0, totalCredits); // 确保不会返回负数
}

/**
 * 扣除用户积分（用于生图等消费）
 */
export async function deductUserCredits(
  user_uuid: string, 
  amount: number, 
  description: string = "Image generation"
): Promise<{ success: boolean; remaining_credits?: number; error?: string }> {
  try {
    // 检查用户当前积分余额
    const currentBalance = await getUserCreditBalance(user_uuid);
    
    if (currentBalance < amount) {
      return {
        success: false,
        error: "Insufficient credits",
        remaining_credits: currentBalance
      };
    }

    // 创建消费记录（负数表示消费）
    const creditRecord: Credit = {
      trans_no: uuidv4(),
      created_at: new Date().toISOString(),
      user_uuid,
      trans_type: "consumption",
      credits: -amount, // 负数表示消费
      order_no: `consume_${Date.now()}`,
      expired_at: undefined // 消费记录不过期
    };

    await insertCredit(creditRecord);
    const newBalance = currentBalance - amount;

    return {
      success: true,
      remaining_credits: newBalance
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

/**
 * 给用户充值积分
 */
export async function addUserCredits(
  user_uuid: string,
  amount: number,
  order_no: string,
  expired_days: number = 365
): Promise<Credit> {
  const expiredAt = new Date();
  expiredAt.setDate(expiredAt.getDate() + expired_days);

  const creditRecord: Credit = {
    trans_no: uuidv4(),
    created_at: new Date().toISOString(),
    user_uuid,
    trans_type: "recharge",
    credits: amount, // 正数表示充值
    order_no,
    expired_at: expiredAt.toISOString()
  };

  await insertCredit(creditRecord);
  return creditRecord;
}
