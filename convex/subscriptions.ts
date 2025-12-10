import { internalMutation } from "./_generated/server";
import { TIER_LIMITS, SubscriptionTier } from "./utils/permissions";

/**
 * Check for expired subscriptions and downgrade users to free tier
 * Called daily by cron job
 */
export const checkExpiredSubscriptions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();
    
    // Find all users with expired subscriptions
    const allUsers = await ctx.db.query("users").collect();
    
    let downgraded = 0;
    
    for (const user of allUsers) {
      // Skip free users
      if (user.subscription_tier === "free" || !user.subscription_tier) {
        continue;
      }
      
      // Check if subscription has expired
      if (user.subscription_expires_at && user.subscription_expires_at < now) {
        // Downgrade to free
        await ctx.db.patch(user._id, {
          subscription_tier: "free",
          // Don't clear credits - they keep their balance
        });
        
        downgraded++;
        console.log(`Downgraded user ${user.email} from ${user.subscription_tier} to free (expired: ${user.subscription_expires_at})`);
      }
    }
    
    console.log(`Subscription check complete. Downgraded ${downgraded} users.`);
    return { downgraded };
  },
});

/**
 * Grant monthly credits for active subscribers
 * Called on subscription renewal (from Stripe webhook)
 */
export const grantMonthlyCredits = internalMutation({
  args: {},
  handler: async (ctx) => {
    // This is typically called from the Stripe webhook when a subscription renews
    // The processPaidOrder mutation already handles this
    // This function is here as a fallback or for manual grants
    
    const allUsers = await ctx.db.query("users").collect();
    const now = new Date().toISOString();
    
    let granted = 0;
    
    for (const user of allUsers) {
      const tier = (user.subscription_tier || "free") as SubscriptionTier;
      
      // Skip free users
      if (tier === "free") continue;
      
      // Check if subscription is still active
      if (user.subscription_expires_at && user.subscription_expires_at > now) {
        const tierLimits = TIER_LIMITS[tier];
        const monthlyCredits = tierLimits?.monthly_credits || 0;
        
        if (monthlyCredits > 0) {
          await ctx.db.patch(user._id, {
            credits_balance: user.credits_balance + monthlyCredits,
          });
          
          // Record transaction
          await ctx.db.insert("credits", {
            user_id: user._id,
            amount: monthlyCredits,
            type: "monthly_grant",
          } as any);
          
          granted++;
        }
      }
    }
    
    console.log(`Monthly credits granted to ${granted} users.`);
    return { granted };
  },
});
