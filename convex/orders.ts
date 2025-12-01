import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByOrderNo = query({
  args: { orderNo: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_order_no", (q) => q.eq("order_no", args.orderNo))
      .unique();
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
        // Try as legacy_id
        // Legacy migration logic removed
        // user = await ctx.db.query("users").filter(q => q.eq(q.field("legacy_id"), order.user_id)).unique();
    }
    
    if (!user) {
        // Try as tokenIdentifier
        user = await ctx.db.query("users").withIndex("by_token", q => q.eq("tokenIdentifier", order.user_id)).unique();
    }

    if (user && order.credits > 0) {
        // Determine new tier
        let newTier = (user as any).subscription_tier || "free";
        const productName = order.product_name?.toLowerCase() || "";
        
        if (productName.includes("premium")) {
            newTier = "basic";
        } else if (productName.includes("pro")) {
            newTier = "pro";
        }

        // Add credits
        const currentCredits = (user as any).credits_balance || 0;
        
        const patchData: any = {
            credits_balance: currentCredits + order.credits
        };

        // If it's a subscription order (has expired_at), update subscription info
        if (order.expired_at) {
            patchData.subscription_tier = newTier;
            patchData.subscription_expires_at = order.expired_at;
        }

        await ctx.db.patch(user._id, patchData);
        
        // Record transaction
        await ctx.db.insert("credits", {
            user_id: user._id,
            amount: order.credits,
            type: "purchase",
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
