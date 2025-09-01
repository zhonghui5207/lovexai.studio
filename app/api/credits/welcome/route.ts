import { NextRequest, NextResponse } from "next/server";
import { addUserCredits } from "@/models/credit";

export async function POST(request: NextRequest) {
  try {
    const { user_email, initial_amount = 50 } = await request.json();
    
    if (!user_email) {
      return NextResponse.json(
        { error: "User email required" },
        { status: 400 }
      );
    }

    // 给新用户赠送初始积分
    const creditRecord = await addUserCredits(
      user_email,
      initial_amount,
      `welcome_bonus_${Date.now()}`,
      365
    );
    
    return NextResponse.json({
      success: true,
      message: `${initial_amount} welcome credits added to ${user_email}`,
      credit_record: creditRecord
    });
  } catch (error) {
    console.error("Error adding welcome credits:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}