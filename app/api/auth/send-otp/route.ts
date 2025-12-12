import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// In-memory OTP store (in production, use Redis or database)
// Format: { email: { code: string, expiresAt: number } }
const otpStore = new Map<string, { code: string; expiresAt: number }>();

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Generate OTP
    const code = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    otpStore.set(email.toLowerCase(), { code, expiresAt });

    // Send email
    const { error } = await resend.emails.send({
      from: "LoveXAI <noreply@lovexai.studio>",
      to: email,
      subject: "Your verification code",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; font-size: 24px; margin: 0;">Verification Code</h1>
          </div>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Enter this code to sign in to LoveXAI Studio:
          </p>
          
          <div style="background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%); border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
            <span style="font-size: 36px; font-weight: bold; color: white; letter-spacing: 8px;">${code}</span>
          </div>
          
          <p style="color: #999; font-size: 14px; line-height: 1.6;">
            This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #bbb; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} LoveXAI Studio. All rights reserved.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Email send error:", error);
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Export otpStore for verification endpoint
export { otpStore };
