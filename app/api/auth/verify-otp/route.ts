import { NextRequest, NextResponse } from "next/server";
import { otpStore } from "../send-otp/route";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

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

    const normalizedEmail = email.toLowerCase();
    const storedOtp = otpStore.get(normalizedEmail);

    // Check if OTP exists
    if (!storedOtp) {
      return NextResponse.json(
        { error: "No verification code found. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (Date.now() > storedOtp.expiresAt) {
      otpStore.delete(normalizedEmail);
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if OTP matches
    if (storedOtp.code !== code) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // OTP is valid - delete it
    otpStore.delete(normalizedEmail);

    // Create or get user from Convex
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
