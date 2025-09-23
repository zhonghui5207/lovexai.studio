import {
  CreditPackage,
  CreditTransaction,
  Order,
  SubscriptionPlan,
  UserSubscription,
  TransactionType,
  OrderType,
  OrderStatus,
  PurchaseCreditsParams,
  PurchaseSubscriptionParams
} from "@/types/chat";
import { getSupabaseClient } from "./db";
import { addCredits, updateSubscriptionTier } from "./user-new";

// 积分包操作
export async function getAllCreditPackages(): Promise<CreditPackage[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("credit_packages")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to get credit packages: ${error.message}`);
  }

  return data || [];
}

export async function findCreditPackageById(id: string): Promise<CreditPackage | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("credit_packages")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (error) {
    return null;
  }

  return data;
}

// 积分交易记录操作
export async function createCreditTransaction(
  userId: string,
  transactionType: TransactionType,
  amount: number,
  balanceAfter: number,
  referenceId?: string,
  description?: string
): Promise<CreditTransaction> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("credit_transactions")
    .insert({
      user_id: userId,
      transaction_type: transactionType,
      amount,
      balance_after: balanceAfter,
      reference_id: referenceId,
      description
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create credit transaction: ${error.message}`);
  }

  return data;
}

export async function getUserCreditTransactions(userId: string, limit: number = 50): Promise<CreditTransaction[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get user credit transactions: ${error.message}`);
  }

  return data || [];
}

// 订阅计划操作
export async function getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("is_active", true)
    .order("monthly_price", { ascending: true });

  if (error) {
    throw new Error(`Failed to get subscription plans: ${error.message}`);
  }

  return data || [];
}

export async function findSubscriptionPlanById(id: string): Promise<SubscriptionPlan | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function findSubscriptionPlanByTier(tier: string): Promise<SubscriptionPlan | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("tier", tier)
    .eq("is_active", true)
    .single();

  if (error) {
    return null;
  }

  return data;
}

// 用户订阅操作
export async function createUserSubscription(
  userId: string,
  planId: string,
  expiresAt?: string
): Promise<UserSubscription> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("user_subscriptions")
    .insert({
      user_id: userId,
      plan_id: planId,
      expires_at: expiresAt,
      status: 'active'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user subscription: ${error.message}`);
  }

  return data;
}

export async function getUserActiveSubscription(userId: string): Promise<UserSubscription | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function cancelUserSubscription(userId: string): Promise<UserSubscription | null> {
  const subscription = await getUserActiveSubscription(userId);
  if (!subscription) {
    return null;
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("user_subscriptions")
    .update({ status: 'cancelled' })
    .eq("id", subscription.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to cancel user subscription: ${error.message}`);
  }

  return data;
}

// 订单操作
export async function createOrder(
  userId: string,
  orderType: OrderType,
  amount: number,
  referenceId?: string,
  currency: string = 'USD'
): Promise<Order> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      order_type: orderType,
      reference_id: referenceId,
      amount,
      currency,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create order: ${error.message}`);
  }

  return data;
}

export async function findOrderById(id: string): Promise<Order | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  paymentReference?: string,
  paidAt?: string
): Promise<Order> {
  const supabase = getSupabaseClient();
  const updates: Partial<Order> = { status };

  if (paymentReference) updates.payment_reference = paymentReference;
  if (paidAt) updates.paid_at = paidAt;

  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update order status: ${error.message}`);
  }

  return data;
}

export async function getUserOrders(userId: string, limit: number = 50): Promise<Order[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get user orders: ${error.message}`);
  }

  return data || [];
}

// 购买积分流程
export async function purchaseCredits(params: PurchaseCreditsParams): Promise<Order> {
  const creditPackage = await findCreditPackageById(params.package_id);
  if (!creditPackage) {
    throw new Error("Credit package not found");
  }

  // 创建订单
  const order = await createOrder(
    params.user_id,
    'credits',
    creditPackage.price,
    params.package_id
  );

  // 这里应该集成支付处理器 (Stripe, PayPal等)
  // 支付成功后调用 completeCreditsPurchase

  return order;
}

export async function completeCreditsPurchase(orderId: string): Promise<void> {
  const order = await findOrderById(orderId);
  if (!order || order.order_type !== 'credits') {
    throw new Error("Invalid order");
  }

  const creditPackage = await findCreditPackageById(order.reference_id!);
  if (!creditPackage) {
    throw new Error("Credit package not found");
  }

  // 计算总积分 (基础积分 + 赠送积分)
  const totalCredits = creditPackage.credits_amount + creditPackage.bonus_credits;

  // 添加积分到用户账户
  const updatedUser = await addCredits(order.user_id, totalCredits);

  // 创建积分交易记录
  await createCreditTransaction(
    order.user_id,
    'purchase',
    totalCredits,
    updatedUser.credits_balance,
    orderId,
    `Purchased ${creditPackage.name}`
  );

  // 更新订单状态
  await updateOrderStatus(orderId, 'paid', undefined, new Date().toISOString());
}

// 购买订阅流程
export async function purchaseSubscription(params: PurchaseSubscriptionParams): Promise<Order> {
  const plan = await findSubscriptionPlanById(params.plan_id);
  if (!plan) {
    throw new Error("Subscription plan not found");
  }

  const amount = params.billing_cycle === 'yearly' ? (plan.yearly_price || plan.monthly_price * 12) : plan.monthly_price;

  // 创建订单
  const order = await createOrder(
    params.user_id,
    'subscription',
    amount,
    params.plan_id
  );

  // 这里应该集成支付处理器
  // 支付成功后调用 completeSubscriptionPurchase

  return order;
}

export async function completeSubscriptionPurchase(
  orderId: string,
  billingCycle: 'monthly' | 'yearly'
): Promise<void> {
  const order = await findOrderById(orderId);
  if (!order || order.order_type !== 'subscription') {
    throw new Error("Invalid order");
  }

  const plan = await findSubscriptionPlanById(order.reference_id!);
  if (!plan) {
    throw new Error("Subscription plan not found");
  }

  // 计算订阅到期时间
  const now = new Date();
  const expiresAt = new Date(now);
  if (billingCycle === 'yearly') {
    expiresAt.setFullYear(now.getFullYear() + 1);
  } else {
    expiresAt.setMonth(now.getMonth() + 1);
  }

  // 取消现有订阅
  await cancelUserSubscription(order.user_id);

  // 创建新订阅
  await createUserSubscription(order.user_id, plan.id, expiresAt.toISOString());

  // 更新用户订阅层级
  await updateSubscriptionTier(order.user_id, plan.tier as any, expiresAt.toISOString());

  // 更新订单状态
  await updateOrderStatus(orderId, 'paid', undefined, new Date().toISOString());
}

// 记录积分消费
export async function recordCreditUsage(
  userId: string,
  amount: number,
  newBalance: number,
  referenceId?: string,
  description?: string
): Promise<CreditTransaction> {
  return createCreditTransaction(
    userId,
    'chat_usage',
    -amount, // 负数表示消费
    newBalance,
    referenceId,
    description
  );
}