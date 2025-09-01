import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserCreditBalance } from "@/models/credit";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const balance = await getUserCreditBalance(session.user.email);
    
    return NextResponse.json({
      success: true,
      balance: balance
    });
  } catch (error) {
    console.error("Error fetching credit balance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}