import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Store a new OTP code for email verification
 */
export const storeOTP = mutation({
  args: {
    email: v.string(),
    code: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase();

    // Delete any existing OTP for this email
    const existingOTPs = await ctx.db
      .query("otp_codes")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();

    for (const otp of existingOTPs) {
      await ctx.db.delete(otp._id);
    }

    // Create new OTP
    await ctx.db.insert("otp_codes", {
      email,
      code: args.code,
      expires_at: args.expiresAt,
      used: false,
    });
  },
});

/**
 * Verify an OTP code
 * Returns: { valid: true } if valid, { valid: false, reason: string } if invalid
 */
export const verifyOTP = mutation({
  args: {
    email: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase();
    const now = Date.now();

    // Find the OTP
    const otp = await ctx.db
      .query("otp_codes")
      .withIndex("by_email_code", (q) => q.eq("email", email).eq("code", args.code))
      .first();

    if (!otp) {
      return { valid: false, reason: "Invalid verification code" };
    }

    if (otp.used) {
      return { valid: false, reason: "Verification code already used" };
    }

    if (now > otp.expires_at) {
      // Delete expired OTP
      await ctx.db.delete(otp._id);
      return { valid: false, reason: "Verification code has expired" };
    }

    // Mark OTP as used
    await ctx.db.patch(otp._id, { used: true });

    // Delete the OTP after successful verification
    await ctx.db.delete(otp._id);

    return { valid: true };
  },
});

/**
 * Clean up expired OTPs (can be called by a cron job)
 */
export const cleanupExpiredOTPs = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const allOTPs = await ctx.db.query("otp_codes").collect();

    let deleted = 0;
    for (const otp of allOTPs) {
      if (otp.expires_at < now) {
        await ctx.db.delete(otp._id);
        deleted++;
      }
    }

    return { deleted };
  },
});
