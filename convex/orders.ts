import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { TIER_LIMITS, SubscriptionTier } from "./utils/permissions";

export const getByOrderNo = query({
  args: { orderNo: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_order_no", (q) => q.eq("order_no", args.orderNo))
      .unique();
  },
});

export const getBySessionId = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    if (!args.sessionId) return null;

    // Use index for efficient lookup
    const order = await ctx.db
      .query("orders")
      .withIndex("by_stripe_session", (q) => q.eq("stripe_session_id", args.sessionId))
      .first();

    return order;
  },
});

export const listRecent = query({
  handler: async (ctx) => {
    return await ctx.db.query("orders").order("desc").take(5);
  },
});

export const processPaidOrder = mutation({
  args: {
    orderNo: v.string(),
    paidAt: v.string(),
    paidEmail: v.string(),
    stripeSessionId: v.string(),
    paidDetail: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_order_no", (q) => q.eq("order_no", args.orderNo))
      .unique();

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status === "paid") {
      return;
    }

    // Update order
    await ctx.db.patch(order._id, {
      status: "paid",
      paid_at: args.paidAt,
      paid_email: args.paidEmail,
      stripe_session_id: args.stripeSessionId,
    });

    // Find user
    let user = null;
    // Try as Convex ID
    try {
        user = await ctx.db.get(order.user_id as any);
    } catch (e) {}

    if (!user) {
        // Try as tokenIdentifier
        user = await ctx.db.query("users").withIndex("by_token", q => q.eq("tokenIdentifier", order.user_id)).unique();
    }

    if (user) {
        const productName = order.product_name?.toLowerCase() || "";
        const productId = (order as any).product_id?.toLowerCase() || "";
        
        // Determine new tier based on product
        let newTier: SubscriptionTier = (user as any).subscription_tier || "free";
        
        if (productName.includes("ultimate") || productId.includes("ultimate")) {
            newTier = "ultimate";
        } else if (productName.includes("pro") || productId.includes("pro")) {
            newTier = "pro";
        } else if (productName.includes("plus") || productId.includes("plus")) {
            newTier = "plus";
        }

        // Calculate credits to add
        let creditsToAdd = order.credits || 0;
        
        // If it's a subscription (has expired_at), add monthly credits based on tier
        if (order.expired_at && newTier !== "free") {
            creditsToAdd = TIER_LIMITS[newTier]?.monthly_credits || creditsToAdd;
        }

        // Add credits
        const currentCredits = (user as any).credits_balance || 0;
        
        const patchData: any = {
            credits_balance: currentCredits + creditsToAdd
        };

        // If it's a subscription order, update subscription info
        if (order.expired_at) {
            patchData.subscription_tier = newTier;
            patchData.subscription_expires_at = order.expired_at;
            // Reset daily swipe counter for new subscription
            patchData.daily_swipes_used = 0;
        }

        await ctx.db.patch(user._id, patchData);
        
        // Record transaction
        await ctx.db.insert("credits", {
            user_id: user._id,
            amount: creditsToAdd,
            type: order.expired_at ? "subscription" : "purchase",
            order_no: order.order_no,
        } as any);
    }
  }
});

export const createOrder = mutation({
  args: {
    order_no: v.string(),
    user_id: v.string(),
    user_email: v.string(),
    amount: v.number(),
    currency: v.string(),
    credits: v.number(),
    status: v.string(),
    product_id: v.optional(v.string()),
    product_name: v.optional(v.string()),
    expired_at: v.optional(v.string()),
    sub_interval: v.optional(v.string()),
    payment_method: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("orders", args);
  },
});

export const updateOrderSession = mutation({
  args: {
    orderNo: v.string(),
    stripeSessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_order_no", (q) => q.eq("order_no", args.orderNo))
      .unique();
    
    if (order) {
        await ctx.db.patch(order._id, {
            stripe_session_id: args.stripeSessionId
        });
    }
  },
});

export const updateOrderStatus = mutation({
  args: {
    orderNo: v.union(v.string(), v.int64()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const orderNoStr = args.orderNo.toString();
    const order = await ctx.db
      .query("orders")
      .withIndex("by_order_no", (q) => q.eq("order_no", orderNoStr))
      .unique();
    
    if (order) {
      await ctx.db.patch(order._id, {
        status: args.status
      });
    }
    return order;
  },
});

// Query by order_no supporting both string and bigint
export const getOrderByNo = query({
  args: { orderNo: v.union(v.string(), v.int64()) },
  handler: async (ctx, args) => {
    const orderNoStr = args.orderNo.toString();
    return await ctx.db
      .query("orders")
      .withIndex("by_order_no", (q) => q.eq("order_no", orderNoStr))
      .unique();
  },
});
