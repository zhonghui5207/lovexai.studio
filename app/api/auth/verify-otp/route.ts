import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      );
    }

    // Rate limit verification attempts to prevent brute force
    const clientIP = getClientIP(req.headers);
    const rateLimit = checkRateLimit(
      `verify:ip:${clientIP}`,
      { limit: 10, windowSeconds: 60 } // 10 attempts per minute per IP
    );

    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Too many verification attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": retryAfter.toString() },
        }
      );
    }

    const normalizedEmail = email.toLowerCase();

    // Verify OTP using Convex
    const result = await convex.mutation(api.otp.verifyOTP, {
      email: normalizedEmail,
      code: code.toString(),
    });

    if (!result.valid) {
      return NextResponse.json(
        { error: result.reason || "Invalid verification code" },
        { status: 400 }
      );
    }

    // OTP is valid - create or get user from Convex
    try {
      const user = await convex.mutation(api.users.syncUser, {
        email: normalizedEmail,
        name: normalizedEmail.split("@")[0],
        avatar_url: "",
        externalId: `email_${normalizedEmail}`,
        provider: "email",
      });

      if (!user) {
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        );
      }

      // Return user data for client-side session handling
      return NextResponse.json({
        success: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          subscription_tier: user.subscription_tier,
          credits_balance: user.credits_balance,
        },
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to process login" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
